import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * Orc3 — slow, tanky orc enemy (replaces Skeleton2).
 * Top-down 64x64 spritesheet, 4 directional rows — we use row 0 only.
 */
export class Orc3 extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'orc3_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.35
    this.maxHp = Math.floor(70 * hpMult + (wave - 1) * 7)
    this.hp = this.maxHp
    this.speed = 65 + wave * 3
    this.baseSpeed = this.speed
    this.xpValue = 12 + Math.floor(wave / 3)
    this.damagePerSecond = 10 + Math.floor(wave / 3)
    this.isLarge = true

    this.attackRange = 40
    this.kbForce = 100
    this.walkAnim = 'orc3_run'
    this.attackAnim = 'orc3_attack'

    this.setScale(2.0)
    this.baseTint = 0xddccaa
    this.setTint(this.baseTint)
    this.setBodySize(24, 24)
    this.setOffset(20, 18)
    this.setDepth(5)

    this.play('orc3_run')
  }

  static createAnimations(scene: Phaser.Scene) {
    // Row 0 frames: idle 4 frames (0-3), run 8 frames (0-7), attack 8 (0-7), hurt 4 (0-3), death 4 (0-3)
    const defs: [string, string, number, number, number][] = [
      ['orc3_idle',   'orc3_idle',   0, 3,  -1],
      ['orc3_run',    'orc3_run',    0, 7,  -1],
      ['orc3_attack', 'orc3_attack', 0, 7,   0],
      ['orc3_hurt',   'orc3_hurt',   0, 3,   0],
      ['orc3_death',  'orc3_death',  0, 3,   0],
    ]
    for (const [key, texture, start, end, repeat] of defs) {
      if (scene.anims.exists(key)) continue
      if (!scene.textures.exists(texture)) continue
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(texture, { start, end }),
        frameRate: key.includes('attack') ? 14 : key.includes('run') ? 12 : 8,
        repeat,
      })
    }
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.play('orc3_death')
    this.once('animationcomplete', onComplete)
  }
}

// Legacy alias so any stray imports of Skeleton2 still compile
export { Orc3 as Skeleton2 }
