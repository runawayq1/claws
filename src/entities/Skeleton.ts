import Phaser from 'phaser'
import { Player } from './Player'
import BaseEnemy from './BaseEnemy'

export class Skeleton extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player, wave: number) {
    super(scene, x, y, 'skeleton_attack', player)
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
    this.walkAnim = 'skeleton_walk'
    this.attackAnim = 'skeleton_hit'

    this.setScale(1.5)
    this.setBodySize(30, 38)
    this.setOffset(60, 56)
    this.setDepth(5)

    this.play('skeleton_walk')
  }

  static createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists('skeleton_walk')) {
      scene.anims.create({
        key: 'skeleton_walk',
        frames: scene.anims.generateFrameNumbers('skeleton_attack', { frames: [0, 1] }),
        frameRate: 4,
        repeat: -1,
        yoyo: true,
      })
    }
    if (!scene.anims.exists('skeleton_hit')) {
      scene.anims.create({
        key: 'skeleton_hit',
        frames: scene.anims.generateFrameNumbers('skeleton_attack', { start: 2, end: 5 }),
        frameRate: 10,
        repeat: -1,
      })
    }
  }

  protected onDeathVfx(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      ease: 'Power2',
      onComplete,
    })
  }
}
