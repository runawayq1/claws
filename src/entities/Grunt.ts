import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * Orc0 — the most basic mob. Uses orc1 skin with yellow tint, slightly larger.
 * Slow, low HP, low damage. Cannon fodder.
 */
export class Orc0 extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'orc1_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.15
    this.maxHp = Math.floor(20 * hpMult + (wave - 1) * 2)
    this.hp = this.maxHp
    this.speed = 90 + wave * 4
    this.baseSpeed = this.speed
    this.xpValue = 5 + Math.floor(wave / 4)
    this.damagePerSecond = 4 + Math.floor(wave / 6)

    this.attackRange = 38
    this.kbForce = 120
    this.walkAnim = 'orc1_run'
    this.attackAnim = 'orc1_attack'

    this.setScale(2.0)
    this.baseTint = 0xbbcc88
    this.setTint(this.baseTint)
    this.setBodySize(24, 24)
    this.setOffset(20, 18)
    this.setDepth(5)

    this.play('orc1_run')
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.play('orc1_death')
    this.once('animationcomplete', onComplete)
  }
}
