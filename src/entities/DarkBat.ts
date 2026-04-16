import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

export class DarkBat extends BaseEnemy {
  public isFlying = true

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'darkbat_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.15
    this.maxHp = Math.floor(15 * hpMult + (wave - 1) * 1.5)
    this.hp = this.maxHp
    this.speed = 150 + wave * 8
    this.baseSpeed = this.speed
    this.xpValue = 8 + Math.floor(wave / 3)
    this.damagePerSecond = 8 + Math.floor(wave / 3)

    this.attackRange = 30
    this.kbForce = 160
    this.kbRestoreDuration = 100
    this.shakeIntensity = 30
    this.shakeAmplitude = 0.002
    this.dmgTextColor = '#ff4444'
    this.usesSteering = false
    this.walkAnim = 'darkbat_idle'
    this.attackAnim = 'darkbat_attack'

    this.setScale(1.4)
    this.baseTint = 0xffffff
    this.setBodySize(22, 22)
    this.setOffset(21, 21)
    this.setDepth(6)

    this.play('darkbat_idle')
  }

  static createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists('darkbat_idle') && scene.textures.exists('darkbat_idle')) {
      scene.anims.create({
        key: 'darkbat_idle',
        frames: scene.anims.generateFrameNumbers('darkbat_idle', { start: 0, end: 8 }),
        frameRate: 10,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('darkbat_attack') && scene.textures.exists('darkbat_attack')) {
      scene.anims.create({
        key: 'darkbat_attack',
        frames: scene.anims.generateFrameNumbers('darkbat_attack', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    if (!scene.anims.exists('darkbat_hurt') && scene.textures.exists('darkbat_hurt')) {
      scene.anims.create({
        key: 'darkbat_hurt',
        frames: scene.anims.generateFrameNumbers('darkbat_hurt', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0,
      })
    }
    if (!scene.anims.exists('darkbat_death') && scene.textures.exists('darkbat_death')) {
      scene.anims.create({
        key: 'darkbat_death',
        frames: scene.anims.generateFrameNumbers('darkbat_death', { start: 0, end: 11 }),
        frameRate: 12,
        repeat: 0,
      })
    }
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      duration: 300,
      onComplete,
    })
  }
}
