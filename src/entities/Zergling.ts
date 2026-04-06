import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

export class Goblin extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'goblin_attack', player)
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
    this.walkAnim = 'goblin_walk'
    this.attackAnim = 'goblin_run'

    this.setScale(1.4)
    this.setBodySize(28, 36)
    this.setOffset(61, 67)
    this.setDepth(5)

    this.play('goblin_walk')
  }

  static createAnimations(scene: Phaser.Scene) {
    // Goblin — 12 frames, 150x150
    if (!scene.anims.exists('goblin_walk')) {
      scene.anims.create({
        key: 'goblin_walk',
        frames: scene.anims.generateFrameNumbers('goblin_attack', { start: 0, end: 5 }),
        frameRate: 7,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('goblin_run')) {
      scene.anims.create({
        key: 'goblin_run',
        frames: scene.anims.generateFrameNumbers('goblin_attack', { start: 0, end: 11 }),
        frameRate: 12,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('goblin_death')) {
      scene.anims.create({
        key: 'goblin_death',
        frames: scene.anims.generateFrameNumbers('goblin_attack', { start: 8, end: 11 }),
        frameRate: 6,
        repeat: 0,
      })
    }

    // Mushroom — 11 frames, 150x150
    if (!scene.anims.exists('mushroom_walk')) {
      scene.anims.create({
        key: 'mushroom_walk',
        frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('mushroom_run')) {
      scene.anims.create({
        key: 'mushroom_run',
        frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 0, end: 10 }),
        frameRate: 10,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('mushroom_death')) {
      scene.anims.create({
        key: 'mushroom_death',
        frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 7, end: 10 }),
        frameRate: 6,
        repeat: 0,
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
    this.play('goblin_death')
    this.once('animationcomplete-goblin_death', onComplete)
  }
}
