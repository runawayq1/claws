import Phaser from 'phaser'
import { Player } from './Player'

export class FlyingEye extends Phaser.Physics.Arcade.Sprite {
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  xpValue: number
  isFlying = true
  private player: Player
  private damagePerSecond: number
  private isDying = false
  private isAttacking = false
  private attackRange = 35
  private dmgAccum = 0
  private lastDmgTextTime = 0
  lastDamageType: 'fire' | 'ice' | 'lightning' | 'poison' | 'melee' | 'shockwave' = 'melee'
  isMarked = false
  markTimer = 0
  isRooted = false
  rootTimer = 0

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'flyingeye_attack', 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.player = player

    const hpMult = 1 + Math.floor(wave / 5) * 0.15
    this.maxHp = Math.floor(20 * hpMult + (wave - 1) * 2)
    this.hp = this.maxHp
    this.speed = 130 + wave * 7
    this.baseSpeed = this.speed
    this.xpValue = 12 + Math.floor(wave / 3)
    this.damagePerSecond = 10 + Math.floor(wave / 3)

    this.setScale(1.4)
    this.setBodySize(32, 32)
    this.setOffset(59, 59)
    this.setDepth(6)

    this.play('flyingeye_walk')
  }

  takeDamage(amount: number, type?: 'fire' | 'ice' | 'lightning' | 'poison' | 'melee' | 'shockwave') {
    if (this.isDying) return
    this.lastDamageType = type || 'melee'
    this.hp -= amount

    if (amount < 1) {
      if (this.hp <= 0) { this.hp = 0; this.die() }
      return
    }

    // Accumulate damage for batched display
    this.dmgAccum += amount
    const now = this.scene.time.now
    if (now - this.lastDmgTextTime >= 400) {
      this.lastDmgTextTime = now
      const displayDmg = Math.floor(this.dmgAccum)
      this.dmgAccum = 0

      // Floating damage — red for aggressive mob
      const dmgText = this.scene.add.text(this.x, this.y - 20, displayDmg.toString(), {
        fontFamily: 'monospace', fontSize: '14px',
        color: '#ff4444', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20)

      this.scene.tweens.add({
        targets: dmgText, y: dmgText.y - 30, alpha: 0, duration: 600,
        onComplete: () => dmgText.destroy(),
      })
    }

    this.setTintFill(0xffffff)
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint()
    })

    // Knockback
    if (this.body) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y)
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180)
      this.scene.time.delayedCall(100, () => {
        if (this.active && !this.isDying) {
          this.scene.physics.moveTo(this, this.player.x, this.player.y, this.speed)
        }
      })
    }

    if (this.hp <= 0) { this.hp = 0; this.die() }
  }

  die() {
    if (this.isDying || !this.scene) return
    this.isDying = true
    this.setVelocity(0, 0)
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false

    this.scene.cameras.main.shake(40, 0.002)

    // Death tint based on damage source
    const tintMap: Record<string, number> = {
      fire: 0x222222, shockwave: 0x222222, melee: 0x222222,
      ice: 0x4488ff, lightning: 0x4488ff,
      poison: 0x44cc44,
    }
    this.setTint(tintMap[this.lastDamageType] ?? 0x222222)

    // Shrink + fade death
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 0.3, duration: 300,
      onComplete: () => {
        if (this.scene) {
          this.scene.events.emit('enemy-died', this.x, this.y, this.xpValue)
        }
        this.destroy()
      },
    })
  }

  applyPoison(_dps: number, _duration: number) {
    // Intentionally empty — FlyingEye does not apply poison
  }

  update(_time: number, delta: number) {
    if (!this.active || !this.player.active || this.isDying) return

    // Recover speed toward baseSpeed
    if (this.speed < this.baseSpeed) {
      this.speed = Math.min(this.baseSpeed, this.speed + this.baseSpeed * 0.5 * (delta / 1000))
    }

    // Only move if not rooted
    if (!this.isRooted) {
      this.scene.physics.moveTo(this, this.player.x, this.player.y, this.speed)
    } else {
      this.setVelocity(0, 0)
      this.rootTimer -= delta
      if (this.rootTimer <= 0) this.isRooted = false
    }
    this.setFlipX(this.player.x < this.x)

    if (this.speed < this.baseSpeed * 0.95) {
      this.setTint(0x6688ff)
    } else {
      this.clearTint()
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)

    if (dist < this.attackRange) {
      if (!this.isAttacking) {
        this.isAttacking = true
        this.play('flyingeye_run')
      }
      this.player.takeDamage(this.damagePerSecond * (delta / 1000))
    } else {
      if (this.isAttacking) {
        this.isAttacking = false
        this.play('flyingeye_walk')
      }
    }

  }
}
