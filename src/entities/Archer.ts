import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * Archer — ranged green-cloaked goblin archer.
 * Holds position at SHOOT_RANGE and fires arrows on cooldown regardless of
 * player position. Kites away if player gets too close. Arrows fly with a
 * glowing trail and keep travelling until they hit or time out.
 */
export class Archer extends BaseEnemy {
  private _shootCd = 0
  private _isDrawing = false
  private readonly SHOOT_RANGE = 360      // 1.5× previous (240)
  private readonly SHOOT_COOLDOWN = 2400
  private readonly ARROW_SPEED = 380
  private readonly ARROW_DAMAGE: number

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'archer_idle_run', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.22
    this.maxHp = Math.floor(80 * hpMult + (wave - 1) * 6)
    this.hp = this.maxHp
    this.speed = 95 + wave * 5
    this.baseSpeed = this.speed
    this.xpValue = 11 + Math.floor(wave / 3)
    this.damagePerSecond = 0              // no melee DPS — arrows only
    this.ARROW_DAMAGE = 14 + Math.floor(wave / 2)

    this.attackRange = 0                  // disable base melee check
    this.kbForce = 140
    this.walkAnim = 'archer_run'

    this.setScale(1.8)
    this.baseTint = 0xffffff
    this.setBodySize(22, 28)
    this.setOffset(21, 18)
    this.setDepth(5)

    // Stagger initial cooldown so archers don't all fire on the same frame
    this._shootCd = Math.random() * 1500

    this.play('archer_run')
  }

  static createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists('archer_idle') && scene.textures.exists('archer_idle_run')) {
      scene.anims.create({
        key: 'archer_idle',
        frames: scene.anims.generateFrameNumbers('archer_idle_run', { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      })
      scene.anims.create({
        key: 'archer_run',
        frames: scene.anims.generateFrameNumbers('archer_idle_run', { start: 8, end: 15 }),
        frameRate: 12,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('archer_attack') && scene.textures.exists('archer_attack')) {
      scene.anims.create({
        key: 'archer_attack',
        frames: scene.anims.generateFrameNumbers('archer_attack', { start: 0, end: 10 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    if (!scene.anims.exists('archer_death') && scene.textures.exists('archer_death')) {
      // Frame 0 contains a "death" text label from the source sheet — skip it.
      scene.anims.create({
        key: 'archer_death',
        frames: scene.anims.generateFrameNumbers('archer_death', { start: 1, end: 9 }),
        frameRate: 12,
        repeat: 0,
      })
    }
  }

  protected onUpdate(_time: number, delta: number): void {
    if (this.isDying) return

    // Sprite faces left by default — invert BaseEnemy's flip
    const dx = this.player.x - this.x
    if (Math.abs(dx) > 4) this.setFlipX(dx > 0)

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)
    this._shootCd = Math.max(0, this._shootCd - delta)

    // While drawing, hold position and let the attack animation play out
    if (this._isDrawing) {
      this.setVelocity(0, 0)
      return
    }

    // Fire whenever cooldown is ready — from any distance, no kiting
    if (this._shootCd === 0) {
      this._shoot()
      return
    }

    // Within shooting range → hold position, play idle during cooldown wait
    if (dist <= this.SHOOT_RANGE) {
      this.setVelocity(0, 0)
      const cur = this.anims.currentAnim?.key
      if (cur !== 'archer_idle' && cur !== 'archer_attack') {
        this.play('archer_idle')
      }
      return
    }

    // Out of range → BaseEnemy handles approach; play run animation
    const cur = this.anims.currentAnim?.key
    if (cur !== 'archer_run') this.play('archer_run')
  }

  private _shoot(): void {
    this._isDrawing = true
    this._shootCd = this.SHOOT_COOLDOWN
    this.setVelocity(0, 0)
    this.play('archer_attack')

    this.once('animationcomplete-archer_attack', () => {
      if (!this.active || this.isDying) { this._isDrawing = false; return }
      this._fireArrow()
      this._isDrawing = false
      // Let onUpdate pick the right post-shot animation (idle if in range, run if out)
    })
  }

  private _fireArrow(): void {
    const scene = this.scene as any
    const target = this.player
    if (!target.active) return

    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)
    const vx = Math.cos(angle) * this.ARROW_SPEED
    const vy = Math.sin(angle) * this.ARROW_SPEED

    // Main arrow shaft — brown rectangle rotated to direction
    const arrow = scene.add.rectangle(this.x, this.y, 22, 3, 0x8b5a2b).setDepth(7)
    arrow.setRotation(angle)
    scene.physics.add.existing(arrow)
    const body = arrow.body as Phaser.Physics.Arcade.Body
    body.setVelocity(vx, vy)
    // Tag for shield-block detection in updateAmunPassives
    ;(arrow as any)._isArrow = true

    // Arrows are blocked by rocks — splinter + destroy on contact
    const rocks = (scene as any).rocks as Phaser.Physics.Arcade.StaticGroup | undefined
    if (rocks) {
      const rockOverlap = scene.physics.add.overlap(arrow, rocks, () => {
        if (!arrow.active) return
        // Splinter VFX
        const splinter = scene.add.circle(arrow.x, arrow.y, 5, 0xccaa66, 0.9).setDepth(8)
        scene.tweens.add({ targets: splinter, scale: 2, alpha: 0, duration: 200, onComplete: () => splinter.destroy() })
        arrow.destroy()
      })
      arrow.on('destroy', () => { if (rockOverlap) rockOverlap.destroy() })
    }

    // Glow — static yellow halo behind the arrow (no infinite tween)
    const glow = scene.add.ellipse(this.x, this.y, 28, 10, 0xffcc44, 0.45)
      .setDepth(6).setRotation(angle).setBlendMode(Phaser.BlendModes.ADD)

    const spawnTime = scene.time.now
    const maxLifetime = 2400
    const hitDistance = 22
    let lastTrailTime = 0

    const updateListener = () => {
      if (!arrow.active) return
      // Timeout
      if (scene.time.now - spawnTime > maxLifetime) {
        arrow.destroy()
        return
      }
      // Sync glow to arrow position
      glow.setPosition(arrow.x, arrow.y)
      // Trail segment every 80ms (throttled)
      if (scene.time.now - lastTrailTime > 80) {
        lastTrailTime = scene.time.now
        const trail = scene.add.ellipse(arrow.x, arrow.y, 14, 4, 0xffaa33, 0.6)
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
        const d = Phaser.Math.Distance.Between(arrow.x, arrow.y, p.x, p.y)
        if (d <= hitDistance) {
          p.takeDamage(this.ARROW_DAMAGE)
          // Impact flash
          const flash = scene.add.circle(arrow.x, arrow.y, 8, 0xffdd66, 0.9)
            .setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
          scene.tweens.add({
            targets: flash, scale: 2.2, alpha: 0, duration: 200,
            onComplete: () => flash.destroy(),
          })
          arrow.destroy()
          return
        }
      }
    }
    scene.events.on('update', updateListener)
    arrow.on('destroy', () => {
      scene.events.off('update', updateListener)
      if (glow.active) glow.destroy()
    })
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.setVelocity(0, 0)
    // Stop any in-flight animation so we keep the current sprite frame visible
    // while it fades — avoids a one-tick blank swap to a different texture.
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
