import Phaser from 'phaser'
import { Player } from './Player'
import { getSteeringTarget } from '../systems/Pathfinding'

export class SandGolem extends Phaser.Physics.Arcade.Sprite {
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  xpValue: number
  private player: Player
  private damagePerSecond: number
  private isDying = false
  private isAttacking = false
  private attackRange = 55
  private lastSlamTime = 0
  private slamCooldown = 5000
  private slamRadius = 80
  private dmgAccum = 0
  private lastDmgTextTime = 0
  lastDamageType: 'fire' | 'ice' | 'lightning' | 'poison' | 'melee' | 'shockwave' = 'melee'
  isMarked = false
  markTimer = 0
  isRooted = false
  rootTimer = 0

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'mushroom_attack', 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.player = player

    const hpMult = 1 + Math.floor(wave / 5) * 0.4
    this.maxHp = Math.floor(180 * hpMult + (wave - 1) * 12)
    this.hp = this.maxHp
    this.speed = 45 + wave * 2
    this.baseSpeed = this.speed
    this.xpValue = 25 + Math.floor(wave / 2) * 3
    this.damagePerSecond = 12 + Math.floor(wave / 4)

    this.setScale(2.0)
    this.setBodySize(32, 40)
    this.setOffset(59, 65)
    this.setDepth(5)

    this.play('mushroom_walk')
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

      // Floating damage — orange for golem
      const dmgText = this.scene.add.text(this.x, this.y - 30, displayDmg.toString(), {
        fontFamily: 'monospace', fontSize: '16px',
        color: '#ff8800', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20)

      this.scene.tweens.add({
        targets: dmgText, y: dmgText.y - 30, alpha: 0, duration: 600,
        onComplete: () => dmgText.destroy(),
      })
    }

    // Brief flash
    this.setTintFill(0xddbb88)
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint()
    })

    // Almost no knockback — too heavy
    if (this.body) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y)
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(angle) * 30, Math.sin(angle) * 30)
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

    this.scene.cameras.main.shake(100, 0.006)

    // Death tint based on damage source
    const tintMap: Record<string, number> = {
      fire: 0x222222, shockwave: 0x222222, melee: 0x222222,
      ice: 0x4488ff, lightning: 0x4488ff,
      poison: 0x44cc44,
    }
    this.setTint(tintMap[this.lastDamageType] ?? 0x222222)

    this.play('mushroom_death')
    this.once('animationcomplete-mushroom_death', () => {
      // Spawn debris particles
      for (let i = 0; i < 5; i++) {
        const debris = this.scene.add.circle(
          this.x + Phaser.Math.Between(-20, 20),
          this.y + Phaser.Math.Between(-10, 10),
          Phaser.Math.Between(3, 6),
          0x8b7355
        ).setDepth(4)
        this.scene.tweens.add({
          targets: debris,
          y: debris.y + Phaser.Math.Between(10, 30),
          alpha: 0,
          duration: 600,
          onComplete: () => debris.destroy(),
        })
      }
      if (this.scene) {
        this.scene.events.emit('enemy-died', this.x, this.y, this.xpValue)
      }
      this.destroy()
    })
  }

  private trySlam(time: number) {
    if (time - this.lastSlamTime < this.slamCooldown) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)
    if (dist > this.slamRadius + 20) return

    this.lastSlamTime = time

    // Ground slam visual
    const ring = this.scene.add.circle(this.x, this.y, 10, 0xaa8844, 0.5).setDepth(3)
    this.scene.tweens.add({
      targets: ring,
      scale: this.slamRadius / 10,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    })

    // Damage player if in range
    if (dist <= this.slamRadius) {
      this.player.takeDamage(this.damagePerSecond * 2)
      // Push player back
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
      const pBody = this.player.body as Phaser.Physics.Arcade.Body
      pBody.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250)
    }

    this.scene.cameras.main.shake(80, 0.004)
  }

  update(time: number, delta: number) {
    if (!this.active || !this.player.active || this.isDying) return

    // Recover speed toward baseSpeed
    if (this.speed < this.baseSpeed) {
      this.speed = Math.min(this.baseSpeed, this.speed + this.baseSpeed * 0.5 * (delta / 1000))
    }

    const rocks = (this.scene as any).rocks as Phaser.Physics.Arcade.StaticGroup | undefined
    const target = rocks
      ? getSteeringTarget(this, this.player.x, this.player.y, rocks)
      : { x: this.player.x, y: this.player.y }
    // Only move if not rooted
    if (!this.isRooted) {
      this.scene.physics.moveTo(this, target.x, target.y, this.speed)
    } else {
      this.setVelocity(0, 0)
      this.rootTimer -= delta
      if (this.rootTimer <= 0) this.isRooted = false
    }
    const dx = this.player.x - this.x
    if (Math.abs(dx) > 4) this.setFlipX(dx < 0)

    if (this.speed < this.baseSpeed * 0.95) {
      this.setTint(0x6688ff)
    } else {
      this.clearTint()
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)

    if (dist < this.attackRange) {
      if (!this.isAttacking) {
        this.isAttacking = true
        this.play('mushroom_run')
      }
      this.player.takeDamage(this.damagePerSecond * (delta / 1000))
    } else {
      if (this.isAttacking) {
        this.isAttacking = false
        this.play('mushroom_walk')
      }
    }

    this.trySlam(time)
  }
}
