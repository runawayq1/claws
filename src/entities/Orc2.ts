import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * Orc2 — medium orc enemy (replaces Skeleton).
 * Top-down 64x64 spritesheet, 4 directional rows — we use row 0 only.
 */
export class Orc2 extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'orc2_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.3
    this.maxHp = Math.floor(45 * hpMult + (wave - 1) * 5)
    this.hp = this.maxHp
    this.speed = 80 + wave * 4
    this.baseSpeed = this.speed
    this.xpValue = 8 + Math.floor(wave / 3)
    this.damagePerSecond = 7 + Math.floor(wave / 4)

    this.attackRange = 45
    this.kbForce = 120
    this.walkAnim = 'orc2_run'
    this.attackAnim = 'orc2_attack'

    this.setScale(2.0)
    this.baseTint = 0xddccaa
    this.setTint(this.baseTint)
    this.setBodySize(24, 24)
    this.setOffset(20, 18)
    this.setDepth(5)

    this.play('orc2_run')
  }

  static createAnimations(scene: Phaser.Scene) {
    // Row 0 frames: idle 4 frames (0-3), run 8 frames (0-7), attack 8 (0-7), hurt 4 (0-3), death 4 (0-3)
    // Each row = cols * row_index. Row 0 starts at frame 0.
    const defs: [string, string, number, number, number][] = [
      ['orc2_idle',   'orc2_idle',   0, 3,  -1],
      ['orc2_run',    'orc2_run',    0, 7,  -1],
      ['orc2_attack', 'orc2_attack', 0, 7,   0],
      ['orc2_hurt',   'orc2_hurt',   0, 3,   0],
      ['orc2_death',  'orc2_death',  0, 3,   0],
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
    this.play('orc2_death')
    this.once('animationcomplete', onComplete)
  }
}

// Legacy alias so any stray imports of Skeleton still compile
export { Orc2 as Skeleton }
