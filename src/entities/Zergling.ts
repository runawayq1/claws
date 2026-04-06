import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * Orc1 — fast, weak orc enemy (replaces Goblin).
 * Top-down 64x64 spritesheet, 4 directional rows — we use row 0 only.
 */
export class Orc1 extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'orc1_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.2
    this.maxHp = Math.floor(30 * hpMult + (wave - 1) * 3)
    this.hp = this.maxHp
    this.speed = 140 + wave * 8
    this.baseSpeed = this.speed
    this.xpValue = 8 + Math.floor(wave / 3)
    this.damagePerSecond = 6 + Math.floor(wave / 5)

    this.attackRange = 40
    this.kbForce = 160
    this.walkAnim = 'orc1_run'
    this.attackAnim = 'orc1_attack'

    this.setScale(1.75)
    this.baseTint = 0xddccaa
    this.setTint(this.baseTint)
    this.setBodySize(24, 24)
    this.setOffset(20, 20)
    this.setDepth(5)

    this.play('orc1_run')
  }

  static createAnimations(scene: Phaser.Scene) {
    // Row 0 frames: idle 4 frames (0-3), run 8 frames (0-7), attack 8 (0-7), hurt 4 (0-3), death 4 (0-3)
    const defs: [string, string, number, number, number][] = [
      ['orc1_idle',   'orc1_idle',   0, 3,  -1],
      ['orc1_run',    'orc1_run',    0, 7,  -1],
      ['orc1_attack', 'orc1_attack', 0, 7,   0],
      ['orc1_hurt',   'orc1_hurt',   0, 3,   0],
      ['orc1_death',  'orc1_death',  0, 3,   0],
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

  protected onDeathVfx(onComplete: () => void): void {
    this.play('orc1_death')
    this.once('animationcomplete', onComplete)
  }
}

// Legacy aliases
export { Orc1 as Goblin }
