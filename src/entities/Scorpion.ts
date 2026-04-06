import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

export class FlyingEye extends BaseEnemy {
  public isFlying = true

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'flyingeye_attack', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.15
    this.maxHp = Math.floor(20 * hpMult + (wave - 1) * 2)
    this.hp = this.maxHp
    this.speed = 130 + wave * 7
    this.baseSpeed = this.speed
    this.xpValue = 12 + Math.floor(wave / 3)
    this.damagePerSecond = 10 + Math.floor(wave / 3)

    this.attackRange = 35
    this.kbForce = 180
    this.kbRestoreDuration = 100
    this.shakeIntensity = 40
    this.shakeAmplitude = 0.002
    this.dmgTextColor = '#ff4444'
    this.usesSteering = false
    this.walkAnim = 'flyingeye_walk'
    this.attackAnim = 'flyingeye_run'

    this.setScale(1.4)
    this.setBodySize(32, 32)
    this.setOffset(59, 59)
    this.setDepth(6)

    this.play('flyingeye_walk')
  }

  // FlyingEye is immune to poison
  applyPoison(_dps: number, _duration: number): void {
    // Intentionally empty — FlyingEye does not apply poison
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
