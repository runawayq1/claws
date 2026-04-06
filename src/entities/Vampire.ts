import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

/**
 * Vampire — fast, lifesteal melee enemy with proper animated spritesheets (32x32).
 * Heals on hit, high speed, medium HP. Spawns in later zones.
 */
export class Vampire extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'vampire_idle', player)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const hpMult = 1 + Math.floor(wave / 5) * 0.25
    this.maxHp = Math.floor(55 * hpMult + (wave - 1) * 5)
    this.hp = this.maxHp
    this.speed = 100 + wave * 5
    this.baseSpeed = this.speed
    this.xpValue = 14 + Math.floor(wave / 2)
    this.damagePerSecond = 12 + Math.floor(wave / 3)

    this.attackRange = 38
    this.kbForce = 80
    this.walkAnim = 'vampire_run'
    this.attackAnim = 'vampire_attack'

    this.setScale(2.0)
    this.baseTint = 0xddccaa
    this.setTint(this.baseTint)
    this.setBodySize(14, 20)
    this.setOffset(9, 10)
    this.setDepth(5)

    this.play('vampire_run')
  }

  static createAnimations(scene: Phaser.Scene) {
    const defs: [string, string, number, number][] = [
      ['vampire_idle', 'vampire_idle', 6, -1],
      ['vampire_run', 'vampire_run', 8, -1],
      ['vampire_attack', 'vampire_attack', 16, 0],
      ['vampire_hurt', 'vampire_hurt', 5, 0],
      ['vampire_death', 'vampire_death', 14, 0],
    ]
    for (const [key, texture, count, repeat] of defs) {
      if (scene.anims.exists(key)) continue
      if (!scene.textures.exists(texture)) continue
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: count - 1 }),
        frameRate: key.includes('attack') ? 16 : key.includes('run') ? 12 : 8,
        repeat,
      })
    }
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.play('vampire_death')
    this.once('animationcomplete', onComplete)
  }

  protected onUpdate(_time: number, delta: number): void {
    // Lifesteal — heal 30% of damage dealt while attacking
    if (this.isAttacking) {
      const dmg = this.damagePerSecond * (delta / 1000)
      this.hp = Math.min(this.maxHp, this.hp + dmg * 0.3)
    }
  }
}
