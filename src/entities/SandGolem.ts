import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * BigOrc — large, tanky orc with ground slam.
 * Uses orc1 spritesheet scaled up. Slow but high HP and AoE slam.
 */
export class SandGolem extends BaseEnemy {
  private lastSlamTime = 0
  private slamCooldown = 5000
  private slamRadius = 80

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'orc3_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.4
    this.maxHp = Math.floor(180 * hpMult + (wave - 1) * 12)
    this.hp = this.maxHp
    this.speed = 45 + wave * 2
    this.baseSpeed = this.speed
    this.xpValue = 25 + Math.floor(wave / 2) * 3
    this.damagePerSecond = 12 + Math.floor(wave / 4)

    this.attackRange = 55
    this.kbForce = 30
    this.kbRestoreDuration = 100
    this.shakeIntensity = 100
    this.shakeAmplitude = 0.006
    this.dmgTextColor = '#ff8800'
    this.dmgTextSize = '16px'
    this.dmgTextYOffset = -30
    this.flashTint = 0xddbb88
    this.flashDuration = 100
    this.walkAnim = 'orc3_run'
    this.attackAnim = 'orc3_attack'

    this.setScale(3.2)
    this.baseTint = 0xcc4444
    this.setTint(this.baseTint)
    this.setBodySize(24, 24)
    this.setOffset(20, 20)
    this.setDepth(5)

    this.play('orc3_run')

    // Pulsing red glow aura
    const glow = scene.add.circle(x, y, 40, 0xff3333, 0.2).setDepth(4)
    scene.tweens.add({
      targets: glow,
      scale: { from: 1.0, to: 1.6 },
      alpha: { from: 0.25, to: 0.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    // Follow the BigOrc
    scene.events.on('update', () => {
      if (!this.active) { glow.destroy(); return }
      glow.setPosition(this.x, this.y)
    })
    this.once('destroy', () => glow.destroy())
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.play('orc3_death')
    this.once('animationcomplete', () => {
      for (let i = 0; i < 5; i++) {
        const debris = this.scene.add.circle(
          this.x + Phaser.Math.Between(-20, 20),
          this.y + Phaser.Math.Between(-10, 10),
          Phaser.Math.Between(3, 6),
          0x8b4513
        ).setDepth(4)
        this.scene.tweens.add({
          targets: debris,
          y: debris.y + Phaser.Math.Between(10, 30),
          alpha: 0,
          duration: 600,
          onComplete: () => debris.destroy(),
        })
      }
      onComplete()
    })
  }

  private trySlam(time: number) {
    if (time - this.lastSlamTime < this.slamCooldown) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)
    if (dist > this.slamRadius + 20) return

    this.lastSlamTime = time

    // Ground slam visual
    const ring = this.scene.add.circle(this.x, this.y, 10, 0xaa4444, 0.5).setDepth(3)
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
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
      const pBody = this.player.body as Phaser.Physics.Arcade.Body
      pBody.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250)
    }

    this.scene.cameras.main.shake(80, 0.004)
  }

  protected onUpdate(time: number, _delta: number): void {
    this.trySlam(time)
  }
}
