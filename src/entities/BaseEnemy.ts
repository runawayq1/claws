import Phaser from 'phaser'
import { getSteeringTarget } from '../systems/Pathfinding'

export type DamageType = 'fire' | 'ice' | 'lightning' | 'poison' | 'melee' | 'shockwave'

type PlayerLike = Phaser.Physics.Arcade.Sprite & { takeDamage(amount: number): void }

export abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  // --- Public fields (hero modules access these) ---
  public hp: number = 0
  public maxHp: number = 0
  public speed: number = 0
  public baseSpeed: number = 0
  public xpValue: number = 0
  public damagePerSecond: number = 0
  public isDying: boolean = false
  public isAttacking: boolean = false
  public attackRange: number = 40
  public dmgAccum: number = 0
  public lastDmgTextTime: number = 0
  public lastDamageType: DamageType = 'melee'
  public isMarked: boolean = false
  public markTimer: number = 0
  public isRooted: boolean = false
  public rootTimer: number = 0
  public player: PlayerLike

  // --- Configurable per-enemy constants (set in subclass constructor) ---
  protected kbForce: number = 120
  protected kbRestoreDuration: number = 150
  protected shakeIntensity: number = 60
  protected shakeAmplitude: number = 0.003
  protected dmgTextColor: string = '#ffff00'
  protected dmgTextSize: string = '14px'
  protected dmgTextYOffset: number = -20
  protected flashTint: number = 0xffffff
  protected flashDuration: number = 80
  protected usesSteering: boolean = true

  // Animation keys — subclasses set these in their constructors
  protected walkAnim: string = ''
  protected attackAnim: string = ''

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    player: PlayerLike,
  ) {
    super(scene, x, y, texture, 0)
    this.player = player
  }

  // -------------------------------------------------------------------------
  // takeDamage — fully shared
  // -------------------------------------------------------------------------
  takeDamage(amount: number, type?: DamageType) {
    if (this.isDying) return
    this.lastDamageType = type ?? 'melee'
    this.hp -= amount

    // Skip visuals for tiny aura ticks
    if (amount < 1) {
      if (this.hp <= 0) { this.hp = 0; this.die() }
      return
    }

    // Batched floating damage number
    this.dmgAccum += amount
    const now = this.scene.time.now
    if (now - this.lastDmgTextTime >= 400) {
      this.lastDmgTextTime = now
      const displayDmg = Math.floor(this.dmgAccum)
      this.dmgAccum = 0

      const dmgText = this.scene.add.text(
        this.x, this.y + this.dmgTextYOffset,
        displayDmg.toString(),
        {
          fontFamily: 'monospace',
          fontSize: this.dmgTextSize,
          color: this.dmgTextColor,
          stroke: '#000000',
          strokeThickness: 2,
        }
      ).setOrigin(0.5).setDepth(20)

      this.scene.tweens.add({
        targets: dmgText,
        y: dmgText.y - 30,
        alpha: 0,
        duration: 600,
        onComplete: () => dmgText.destroy(),
      })
    }

    // Hit flash
    this.setTintFill(this.flashTint)
    this.scene.time.delayedCall(this.flashDuration, () => {
      if (this.active) this.clearTint()
    })

    // Knockback
    if (this.body) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y)
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(angle) * this.kbForce, Math.sin(angle) * this.kbForce)
      this.scene.time.delayedCall(this.kbRestoreDuration, () => {
        if (this.active && !this.isDying) {
          this.scene.physics.moveTo(this, this.player.x, this.player.y, this.speed)
        }
      })
    }

    if (this.hp <= 0) {
      this.hp = 0
      this.die()
    }
  }

  // -------------------------------------------------------------------------
  // applyPoison — shared implementation; FlyingEye overrides with empty stub
  // -------------------------------------------------------------------------
  applyPoison(dps: number, duration: number) {
    if (this.isDying) return
    const interval = 200
    const ticks = Math.floor(duration / interval)
    let ticksLeft = ticks
    const timer = this.scene.time.addEvent({
      delay: interval,
      repeat: ticks - 1,
      callback: () => {
        if (!this.active || this.isDying) { timer.remove(); return }
        this.takeDamage(dps * (interval / 1000), 'poison')
        ticksLeft--
        if (ticksLeft <= 0) timer.remove()
      },
    })
  }

  // -------------------------------------------------------------------------
  // die — guard, disable physics, shake, delegate VFX to subclass
  // -------------------------------------------------------------------------
  die() {
    if (this.isDying || !this.scene) return
    this.isDying = true
    this.setVelocity(0, 0)
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false

    this.scene.cameras.main.shake(this.shakeIntensity, this.shakeAmplitude)

    // Apply death tint
    const tintMap: Record<string, number> = {
      fire: 0x222222, shockwave: 0x222222, melee: 0x222222,
      ice: 0x4488ff, lightning: 0x4488ff,
      poison: 0x44cc44,
    }
    this.setTint(tintMap[this.lastDamageType] ?? 0x222222)

    this.onDeathVfx(() => {
      if (this.scene) {
        this.scene.events.emit('enemy-died', this.x, this.y, this.xpValue)
      }
      this.destroy()
    })
  }

  // -------------------------------------------------------------------------
  // update — shared movement, root, tint, flip, melee damage
  // -------------------------------------------------------------------------
  update(time: number, delta: number) {
    if (!this.active || !this.player.active || this.isDying) return

    // Recover speed toward baseSpeed
    if (this.speed < this.baseSpeed) {
      this.speed = Math.min(this.baseSpeed, this.speed + this.baseSpeed * 0.5 * (delta / 1000))
    }

    if (!this.isRooted) {
      if (this.usesSteering) {
        const rocks = (this.scene as any).rocks as Phaser.Physics.Arcade.StaticGroup | undefined
        const target = rocks
          ? getSteeringTarget(this, this.player.x, this.player.y, rocks)
          : { x: this.player.x, y: this.player.y }
        this.scene.physics.moveTo(this, target.x, target.y, this.speed)
      } else {
        this.scene.physics.moveTo(this, this.player.x, this.player.y, this.speed)
      }
    } else {
      this.setVelocity(0, 0)
      this.rootTimer -= delta
      if (this.rootTimer <= 0) this.isRooted = false
    }

    const dx = this.player.x - this.x
    if (Math.abs(dx) > 4) this.setFlipX(dx < 0)

    // Blue tint when slowed
    if (this.speed < this.baseSpeed * 0.95) {
      this.setTint(0x6688ff)
    } else {
      this.clearTint()
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)

    if (dist < this.attackRange) {
      if (!this.isAttacking) {
        this.isAttacking = true
        if (this.attackAnim) this.play(this.attackAnim)
      }
      this.player.takeDamage(this.damagePerSecond * (delta / 1000))
    } else {
      if (this.isAttacking) {
        this.isAttacking = false
        if (this.walkAnim) this.play(this.walkAnim)
      }
    }

    this.onUpdate(time, delta)
  }

  // -------------------------------------------------------------------------
  // Abstract / overridable hooks
  // -------------------------------------------------------------------------

  /** Subclass plays death animation / tween and calls onComplete when done. */
  protected abstract onDeathVfx(onComplete: () => void): void

  /** Optional per-frame subclass logic (Vampire lifesteal, SandGolem slam). */
  protected onUpdate(_time: number, _delta: number): void {
    // default: no-op
  }
}

export type EnemySprite = BaseEnemy

export default BaseEnemy
