import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * FlyingDemon — ranged flying enemy that shoots fireball projectiles.
 * Holds position at SHOOT_RANGE and fires on cooldown. Flies over rocks.
 */
export class FlyingDemon extends BaseEnemy {
  public isFlying = true

  private _shootCd = 0
  private _isDrawing = false
  private readonly SHOOT_RANGE = 280
  private readonly SHOOT_COOLDOWN = 2800
  private readonly ARROW_SPEED = 300
  private readonly ARROW_DAMAGE: number

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'fdemon_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.22
    this.maxHp = Math.floor(55 * hpMult + (wave - 1) * 4)
    this.hp = this.maxHp
    this.speed = 85 + wave * 4
    this.baseSpeed = this.speed
    this.xpValue = 13 + Math.floor(wave / 3)
    this.damagePerSecond = 0              // no melee DPS — fireballs only
    this.ARROW_DAMAGE = 10 + Math.floor(wave / 3)

    this.attackRange = 0                  // disable base melee check
    this.kbForce = 140
    this.walkAnim = 'fdemon_flying'
    this.attackAnim = 'fdemon_attack'

    this.setScale(1.2)
    this.baseTint = 0xffffff
    this.setBodySize(30, 30)
    this.setOffset(25, 20)
    this.setDepth(5)

    // Stagger initial cooldown so demons don't all fire on the same frame
    this._shootCd = Math.random() * 1500

    this.play('fdemon_flying')
  }

  static createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists('fdemon_idle') && scene.textures.exists('fdemon_idle')) {
      scene.anims.create({
        key: 'fdemon_idle',
        frames: scene.anims.generateFrameNumbers('fdemon_idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('fdemon_flying') && scene.textures.exists('fdemon_flying')) {
      scene.anims.create({
        key: 'fdemon_flying',
        frames: scene.anims.generateFrameNumbers('fdemon_flying', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('fdemon_attack') && scene.textures.exists('fdemon_attack')) {
      scene.anims.create({
        key: 'fdemon_attack',
        frames: scene.anims.generateFrameNumbers('fdemon_attack', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    if (!scene.anims.exists('fdemon_hurt') && scene.textures.exists('fdemon_hurt')) {
      scene.anims.create({
        key: 'fdemon_hurt',
        frames: scene.anims.generateFrameNumbers('fdemon_hurt', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0,
      })
    }
    if (!scene.anims.exists('fdemon_death') && scene.textures.exists('fdemon_death')) {
      scene.anims.create({
        key: 'fdemon_death',
        frames: scene.anims.generateFrameNumbers('fdemon_death', { start: 0, end: 6 }),
        frameRate: 12,
        repeat: 0,
      })
    }
    if (!scene.anims.exists('fdemon_projectile') && scene.textures.exists('fdemon_projectile')) {
      scene.anims.create({
        key: 'fdemon_projectile',
        frames: scene.anims.generateFrameNumbers('fdemon_projectile', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1,
      })
    }
  }

  protected onUpdate(_time: number, delta: number): void {
    if (this.isDying) return

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)
    this._shootCd = Math.max(0, this._shootCd - delta)

    // While drawing, hold position and let the attack animation play out
    if (this._isDrawing) {
      this.setVelocity(0, 0)
      return
    }

    // Fire whenever cooldown is ready
    if (this._shootCd === 0) {
      this._shoot()
      return
    }

    // Within shooting range -> hold position, play idle during cooldown wait
    if (dist <= this.SHOOT_RANGE) {
      this.setVelocity(0, 0)
      const cur = this.anims.currentAnim?.key
      if (cur !== 'fdemon_idle' && cur !== 'fdemon_attack') {
        this.play('fdemon_idle')
      }
      return
    }

    // Out of range -> BaseEnemy handles approach; play flying animation
    const cur = this.anims.currentAnim?.key
    if (cur !== 'fdemon_flying') this.play('fdemon_flying')
  }

  private _shoot(): void {
    this._isDrawing = true
    this._shootCd = this.SHOOT_COOLDOWN
    this.setVelocity(0, 0)
    this.play('fdemon_attack')

    this.once('animationcomplete-fdemon_attack', () => {
      if (!this.active || this.isDying) { this._isDrawing = false; return }
      this._fireFireball()
      this._isDrawing = false
    })
  }

  private _fireFireball(): void {
    const scene = this.scene as any
    const target = this.player
    if (!target.active) return

    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)
    const vx = Math.cos(angle) * this.ARROW_SPEED
    const vy = Math.sin(angle) * this.ARROW_SPEED

    // Main fireball — animated sprite rotated to direction
    const fireball = scene.add.sprite(this.x, this.y, 'fdemon_projectile').setDepth(7)
    fireball.setRotation(angle)
    if (scene.anims.exists('fdemon_projectile')) fireball.play('fdemon_projectile')
    scene.physics.add.existing(fireball)
    const body = fireball.body as Phaser.Physics.Arcade.Body
    body.setVelocity(vx, vy)
    // Tag for shield-block detection
    ;(fireball as any)._isFireball = true

    // Fireballs are blocked by rocks — burst + destroy on contact
    const rocks = (scene as any).rocks as Phaser.Physics.Arcade.StaticGroup | undefined
    if (rocks) {
      const rockOverlap = scene.physics.add.overlap(fireball, rocks, () => {
        if (!fireball.active) return
        // Burst VFX
        const burst = scene.add.circle(fireball.x, fireball.y, 6, 0xff6633, 0.9).setDepth(8)
        scene.tweens.add({ targets: burst, scale: 2, alpha: 0, duration: 200, onComplete: () => burst.destroy() })
        fireball.destroy()
      })
      fireball.on('destroy', () => { if (rockOverlap) rockOverlap.destroy() })
    }

    // Glow — orange halo behind the fireball, additive
    const glow = scene.add.ellipse(this.x, this.y, 28, 10, 0xff6633, 0.55)
      .setDepth(6).setRotation(angle).setBlendMode(Phaser.BlendModes.ADD)
    scene.tweens.add({
      targets: glow,
      scaleX: { from: 1, to: 1.25 },
      alpha: { from: 0.55, to: 0.35 },
      duration: 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Fireball tip spark — small bright core that pulses
    const tip = scene.add.circle(this.x, this.y, 3, 0xffaa44, 0.9)
      .setDepth(8).setBlendMode(Phaser.BlendModes.ADD)
    scene.tweens.add({
      targets: tip,
      scale: { from: 1, to: 1.6 },
      alpha: { from: 0.9, to: 0.5 },
      duration: 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const spawnTime = scene.time.now
    const maxLifetime = 2400
    const hitDistance = 22
    let lastTrailTime = 0

    const updateListener = () => {
      if (!fireball.active) return
      // Timeout
      if (scene.time.now - spawnTime > maxLifetime) {
        fireball.destroy()
        return
      }
      // Sync glow + tip to fireball position
      glow.setPosition(fireball.x, fireball.y)
      tip.setPosition(
        fireball.x + Math.cos(angle) * 11,
        fireball.y + Math.sin(angle) * 11
      )
      // Spawn fading trail segment every 40ms
      if (scene.time.now - lastTrailTime > 40) {
        lastTrailTime = scene.time.now
        const trail = scene.add.ellipse(fireball.x, fireball.y, 14, 4, 0xff6633, 0.6)
          .setDepth(5).setRotation(angle).setBlendMode(Phaser.BlendModes.ADD)
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0.4,
          duration: 260,
          onComplete: () => trail.destroy(),
        })
      }
      // Hit check against all alive players
      const players: Player[] = (scene as any).players || [target]
      for (const p of players) {
        if (p.isDead) continue
        const d = Phaser.Math.Distance.Between(fireball.x, fireball.y, p.x, p.y)
        if (d <= hitDistance) {
          p.takeDamage(this.ARROW_DAMAGE)
          // Impact flash — red/orange
          const flash = scene.add.circle(fireball.x, fireball.y, 8, 0xff4433, 0.9)
            .setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
          scene.tweens.add({
            targets: flash, scale: 2.2, alpha: 0, duration: 200,
            onComplete: () => flash.destroy(),
          })
          fireball.destroy()
          return
        }
      }
    }
    scene.events.on('update', updateListener)
    fireball.on('destroy', () => {
      scene.events.off('update', updateListener)
      if (glow.active) glow.destroy()
      if (tip.active) tip.destroy()
    })
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.setVelocity(0, 0)
    this.anims.stop()
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: this.scale * 0.7,
      angle: 35,
      duration: 350,
      ease: 'Quad.easeIn',
      onComplete,
    })
  }
}
