import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * Skeleton2 — armored skeleton with proper animated spritesheets (32x32 frames).
 * Tougher and slower than Skeleton, with a multi-frame attack combo.
 */
export class Skeleton2 extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'skeleton2_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.35
    this.maxHp = Math.floor(70 * hpMult + (wave - 1) * 7)
    this.hp = this.maxHp
    this.speed = 65 + wave * 3
    this.baseSpeed = this.speed
    this.xpValue = 12 + Math.floor(wave / 3)
    this.damagePerSecond = 10 + Math.floor(wave / 3)

    this.attackRange = 40
    this.kbForce = 100
    this.walkAnim = 'skeleton2_run'
    this.attackAnim = 'skeleton2_attack'

    this.setScale(2.5)
    this.setBodySize(14, 20)
    this.setOffset(9, 10)
    this.setDepth(5)

    this.play('skeleton2_run')
  }

  static createAnimations(scene: Phaser.Scene) {
    const defs: [string, string, number, number][] = [
      ['skeleton2_idle', 'skeleton2_idle', 6, -1],
      ['skeleton2_run', 'skeleton2_run', 10, -1],
      ['skeleton2_attack', 'skeleton2_attack', 15, 0],
      ['skeleton2_hurt', 'skeleton2_hurt', 5, 0],
      ['skeleton2_death', 'skeleton2_death', 15, 0],
    ]
    for (const [key, texture, count, repeat] of defs) {
      if (scene.anims.exists(key)) continue
      if (!scene.textures.exists(texture)) continue
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: count - 1 }),
        frameRate: key.includes('attack') ? 14 : key.includes('run') ? 12 : 8,
        repeat,
      })
    }
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.play('skeleton2_death')
    this.once('animationcomplete', onComplete)
  }
}
