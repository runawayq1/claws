import Phaser from 'phaser'
import { Player } from '../entities/Player'

export class XPSystem {
  private scene: Phaser.Scene
  private player: Player
  private orbs: Phaser.Physics.Arcade.Group
  magnetRadius = 100

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player

    this.orbs = scene.physics.add.group()

    // Generate XP orb texture — bright blue gem
    const g = scene.add.graphics()
    // Outer glow
    g.fillStyle(0x4488ff, 0.3)
    g.fillCircle(8, 8, 8)
    // Core
    g.fillStyle(0x4488ff)
    g.fillCircle(8, 8, 5)
    // Highlight
    g.fillStyle(0x88ccff)
    g.fillCircle(7, 6, 2)
    g.generateTexture('xp_orb', 16, 16)
    g.destroy()

    // Collect orbs on overlap
    scene.physics.add.overlap(player, this.orbs, (_p, orb) => {
      const xpOrb = orb as Phaser.Physics.Arcade.Sprite
      const xpValue = (xpOrb as any).xpValue || 10
      this.player.addXP(xpValue)
      xpOrb.destroy()
    })
  }

  spawnOrb(x: number, y: number, value: number) {
    const orb = this.scene.physics.add.sprite(x, y, 'xp_orb')
    orb.setDepth(3)
    ;(orb as any).xpValue = value
    this.orbs.add(orb)

    // Small scatter burst
    const angle = Math.random() * Math.PI * 2
    orb.setVelocity(Math.cos(angle) * 60, Math.sin(angle) * 60)
    this.scene.time.delayedCall(250, () => {
      if (orb.active) orb.setVelocity(0, 0)
    })
  }

  /** Call every frame — pulls nearby orbs toward player */
  updateMagnet() {
    for (const orb of this.orbs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!orb.active) continue
      const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.player.x, this.player.y)
      if (dist < this.magnetRadius) {
        // Accelerate toward player — faster when closer
        const speed = 200 + (1 - dist / this.magnetRadius) * 300
        this.scene.physics.moveTo(orb, this.player.x, this.player.y, speed)
      }
    }
  }

  getOrbs() {
    return this.orbs
  }
}
