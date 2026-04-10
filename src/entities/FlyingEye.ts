import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

export class FlyingEye extends BaseEnemy {
  public isFlying = true
  private glow?: Phaser.GameObjects.Arc

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number, miniBoss = false) {
    super(scene, x, y, 'flyingeye_attack', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    if (miniBoss) {
      // Mini-boss variant: x3 scale, boosted stats like SandGolem
      const hpMult = 1 + Math.floor(wave / 5) * 0.35
      this.maxHp = Math.floor(150 * hpMult + (wave - 1) * 10)
      this.hp = this.maxHp
      this.speed = 80 + wave * 4
      this.baseSpeed = this.speed
      this.xpValue = 25 + Math.floor(wave / 2) * 3
      this.damagePerSecond = 12 + Math.floor(wave / 4)
      this.isLarge = true

      this.attackRange = 50
      this.kbForce = 200
      this.kbRestoreDuration = 100
      this.shakeIntensity = 80
      this.shakeAmplitude = 0.005
      this.dmgTextColor = '#ff4444'
      this.dmgTextSize = '16px'
      this.dmgTextYOffset = -30
      this.flashTint = 0xddbb88
      this.flashDuration = 100
      this.usesSteering = false
      this.walkAnim = 'flyingeye_walk'
      this.attackAnim = 'flyingeye_run'

      this.setScale(3.0)
      this.baseTint = 0xcc4444
      this.setTint(this.baseTint)
      this.setBodySize(24, 24)
      this.setOffset(20, 17)
      this.setDepth(5)

      // Pulsing red glow aura like SandGolem
      this.glow = scene.add.circle(x, y, 40, 0xff3333, 0.2).setDepth(4)
      scene.tweens.add({
        targets: this.glow,
        scale: { from: 1.0, to: 1.6 },
        alpha: { from: 0.25, to: 0.05 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    } else {
      // Regular mob
      const hpMult = 1 + Math.floor(wave / 5) * 0.15
      this.maxHp = Math.floor(20 * hpMult + (wave - 1) * 2)
      this.hp = this.maxHp
      this.speed = 130 + wave * 7
      this.baseSpeed = this.speed
      this.xpValue = 12 + Math.floor(wave / 3)
      this.damagePerSecond = 10 + Math.floor(wave / 3)
      this.isLarge = true

      this.attackRange = 35
      this.kbForce = 180
      this.kbRestoreDuration = 100
      this.shakeIntensity = 40
      this.shakeAmplitude = 0.002
      this.dmgTextColor = '#ff4444'
      this.usesSteering = false
      this.walkAnim = 'flyingeye_walk'
      this.attackAnim = 'flyingeye_run'

      this.setScale(1.12)
      this.baseTint = 0xddccaa
      this.setTint(this.baseTint)
      this.setBodySize(32, 32)
      this.setOffset(64, 59)
      this.setDepth(6)
    }

    this.play('flyingeye_walk')
  }

  // FlyingEye is immune to poison
  applyPoison(_dps: number, _duration: number): void {
    // Intentionally empty — FlyingEye does not apply poison
  }

  protected onDeathVfx(onComplete: () => void): void {
    if (this.glow) this.glow.destroy()
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      duration: 300,
      onComplete,
    })
  }

  protected onUpdate(_time: number, _delta: number): void {
    if (this.glow) this.glow.setPosition(this.x, this.y)
  }
}
