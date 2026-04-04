import Phaser from 'phaser'
import { Player } from './Player'
import { getSteeringTarget } from '../systems/Pathfinding'

export class Goblin extends Phaser.Physics.Arcade.Sprite {
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  xpValue: number
  private player: Player
  private damagePerSecond: number
  private isDying = false
  private isAttacking = false
  private attackRange = 40
  private dmgAccum = 0
  private lastDmgTextTime = 0
  lastDamageType: 'fire' | 'ice' | 'lightning' | 'poison' | 'melee' | 'shockwave' = 'melee'
  isMarked = false
  markTimer = 0
  isRooted = false
  rootTimer = 0

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'goblin_attack', 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.player = player

    const hpMult = 1 + Math.floor(wave / 5) * 0.2
    this.maxHp = Math.floor(30 * hpMult + (wave - 1) * 3)
    this.hp = this.maxHp
    this.speed = 140 + wave * 8
    this.baseSpeed = this.speed
    this.xpValue = 8 + Math.floor(wave / 3)
    this.damagePerSecond = 6 + Math.floor(wave / 5)

    this.setScale(1.4)
    this.setBodySize(28, 36)
    this.setOffset(61, 67)
    this.setDepth(5)

    this.play('goblin_walk')
  }

  static createAnimations(scene: Phaser.Scene) {
    // Goblin — 12 frames, 150x150
    if (!scene.anims.exists('goblin_walk')) {
      scene.anims.create({
        key: 'goblin_walk',
        frames: scene.anims.generateFrameNumbers('goblin_attack', { start: 0, end: 5 }),
        frameRate: 7,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('goblin_run')) {
      scene.anims.create({
        key: 'goblin_run',
        frames: scene.anims.generateFrameNumbers('goblin_attack', { start: 0, end: 11 }),
        frameRate: 12,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('goblin_death')) {
      scene.anims.create({
        key: 'goblin_death',
        frames: scene.anims.generateFrameNumbers('goblin_attack', { start: 8, end: 11 }),
        frameRate: 6,
        repeat: 0,
      })
    }

    // Mushroom — 11 frames, 150x150
    if (!scene.anims.exists('mushroom_walk')) {
      scene.anims.create({
        key: 'mushroom_walk',
        frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('mushroom_run')) {
      scene.anims.create({
        key: 'mushroom_run',
        frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 0, end: 10 }),
        frameRate: 10,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('mushroom_death')) {
      scene.anims.create({
        key: 'mushroom_death',
        frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 7, end: 10 }),
        frameRate: 6,
        repeat: 0,
      })
    }

    // Flying Eye — 6 frames, 150x150
    if (!scene.anims.exists('flyingeye_walk')) {
      scene.anims.create({
        key: 'flyingeye_walk',
        frames: scene.anims.generateFrameNumbers('flyingeye_attack', { start: 0, end: 2 }),
        frameRate: 6,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('flyingeye_run')) {
      scene.anims.create({
        key: 'flyingeye_run',
        frames: scene.anims.generateFrameNumbers('flyingeye_attack', { start: 0, end: 5 }),
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
      const kb = 160
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

    this.play('goblin_death')
    this.once('animationcomplete-goblin_death', () => {
      if (this.scene) {
        this.scene.events.emit('enemy-died', this.x, this.y, this.xpValue)
      }
      this.destroy()
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
        this.play('goblin_run')
      }
      this.player.takeDamage(this.damagePerSecond * (delta / 1000))
    } else {
      if (this.isAttacking) {
        this.isAttacking = false
        this.play('goblin_walk')
      }
    }

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
}
