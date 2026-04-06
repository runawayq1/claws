import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

export class SandGolem extends BaseEnemy {
  private lastSlamTime = 0
  private slamCooldown = 5000
  private slamRadius = 80

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'mushroom_attack', player)
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
    this.walkAnim = 'mushroom_walk'
    this.attackAnim = 'mushroom_run'

    this.setScale(2.0)
    this.setBodySize(32, 40)
    this.setOffset(59, 65)
    this.setDepth(5)

    this.play('mushroom_walk')
  }

  protected onDeathVfx(onComplete: () => void): void {
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
      onComplete()
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

  protected onUpdate(time: number, _delta: number): void {
    this.trySlam(time)
  }
}
