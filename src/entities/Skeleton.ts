import Phaser from 'phaser'
import { Player } from './Player'
import { getSteeringTarget } from '../systems/Pathfinding'

export class Skeleton extends Phaser.Physics.Arcade.Sprite {
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  xpValue: number
  private player: Player
  private damagePerSecond: number
  private isDying = false
  private isAttacking = false
  private attackRange = 45
  private dmgAccum = 0
  private lastDmgTextTime = 0
  lastDamageType: 'fire' | 'ice' | 'lightning' | 'poison' | 'melee' | 'shockwave' = 'melee'
  isMarked = false
  markTimer = 0
  isRooted = false
  rootTimer = 0

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'skeleton_attack', 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.player = player

    const hpMult = 1 + Math.floor(wave / 5) * 0.3
    this.maxHp = Math.floor(45 * hpMult + (wave - 1) * 5)
    this.hp = this.maxHp
    this.speed = 80 + wave * 4
    this.baseSpeed = this.speed
    this.xpValue = 8 + Math.floor(wave / 3)
    this.damagePerSecond = 7 + Math.floor(wave / 4)

    this.setScale(1.5)
    this.setBodySize(30, 38)
    this.setOffset(60, 56)
    this.setDepth(5)

    this.play('skeleton_walk')
  }

  static createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists('skeleton_walk')) {
      scene.anims.create({
        key: 'skeleton_walk',
        frames: scene.anims.generateFrameNumbers('skeleton_attack', { frames: [0, 1] }),
        frameRate: 4,
        repeat: -1,
        yoyo: true,
      })
    }
    if (!scene.anims.exists('skeleton_hit')) {
      scene.anims.create({
        key: 'skeleton_hit',
        frames: scene.anims.generateFrameNumbers('skeleton_attack', { start: 2, end: 5 }),
        frameRate: 10,
        repeat: -1,
      })
    }
  }

  takeDamage(amount: number, type?: 'fire' | 'ice' | 'lightning' | 'poison' | 'melee' | 'shockwave') {
    if (this.isDying) return
    this.lastDamageType = type || 'melee'
    this.hp -= amount

    // Skip visual effects for tiny damage (e.g. aura ticks)
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

      // Floating damage number
      const dmgText = this.scene.add.text(this.x, this.y - 20, displayDmg.toString(), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20)

      this.scene.tweens.add({
        targets: dmgText,
        y: dmgText.y - 30,
        alpha: 0,
        duration: 600,
        onComplete: () => dmgText.destroy(),
      })
    }

    // Hit flash — tint white briefly
    this.setTintFill(0xffffff)
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint()
    })

    // Knockback — push away from player
    if (this.body) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y)
      const kb = 120
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(angle) * kb, Math.sin(angle) * kb)
      this.scene.time.delayedCall(150, () => {
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

  die() {
    if (this.isDying || !this.scene) return
    this.isDying = true
    this.setVelocity(0, 0)
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false

    this.scene.cameras.main.shake(60, 0.003)

    // Death tint based on damage source
    const tintMap: Record<string, number> = {
      fire: 0x222222, shockwave: 0x222222, melee: 0x222222,
      ice: 0x4488ff, lightning: 0x4488ff,
      poison: 0x44cc44,
    }
    this.setTint(tintMap[this.lastDamageType] ?? 0x222222)

    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        if (this.scene) {
          this.scene.events.emit('enemy-died', this.x, this.y, this.xpValue)
        }
        this.destroy()
      },
    })
  }

  applyPoison(dps: number, duration: number) {
    if (this.isDying) return
    const interval = 200
    const ticks = Math.floor(duration / interval)
    let ticksLeft = ticks
    const timer = this.scene.time.addEvent({
      delay: interval,
      repeat: ticks - 1,
      callback: () => {
        if (!this.active || this.isDying) {
          timer.remove()
          return
        }
        this.takeDamage(dps * (interval / 1000), 'poison')
        ticksLeft--
        if (ticksLeft <= 0) timer.remove()
      },
    })
  }

  update(_time: number, delta: number) {
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
        this.play('skeleton_hit')
      }
      this.player.takeDamage(this.damagePerSecond * (delta / 1000))
    } else {
      if (this.isAttacking) {
        this.isAttacking = false
        this.play('skeleton_walk')
      }
    }
  }
}
