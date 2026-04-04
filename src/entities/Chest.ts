import Phaser from 'phaser'
import { Player } from './Player'
import { Pickup, type PickupType } from './Pickup'

export type ChestRarity = 'common' | 'rare'

export class Chest extends Phaser.Physics.Arcade.Sprite {
  rarity: ChestRarity
  private isOpened = false
  private player: Player

  constructor(scene: Phaser.Scene, x: number, y: number, rarity: ChestRarity, player: Player) {
    const texKey = `chest_${rarity}`
    if (!scene.textures.exists(texKey)) Chest.generateTextures(scene)
    super(scene, x, y, texKey)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.rarity = rarity
    this.player = player
    this.setDepth(4)
    this.setScale(rarity === 'rare' ? 1.4 : 1.1)
    this.setImmovable(true)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(20, 16)
  }

  static generateTextures(scene: Phaser.Scene) {
    // Common chest — brown box
    if (!scene.textures.exists('chest_common')) {
      const g = scene.add.graphics()
      g.fillStyle(0x8B4513)
      g.fillRect(2, 6, 20, 14)
      g.fillStyle(0xA0522D)
      g.fillRect(2, 6, 20, 4)
      g.fillStyle(0xDAA520)
      g.fillRect(10, 6, 4, 14)
      g.fillRect(4, 10, 16, 3)
      g.lineStyle(1, 0x5C3317)
      g.strokeRect(2, 6, 20, 14)
      g.generateTexture('chest_common', 24, 22)
      g.destroy()
    }
    // Rare chest — gold accents
    if (!scene.textures.exists('chest_rare')) {
      const g = scene.add.graphics()
      g.fillStyle(0x6B3A2A)
      g.fillRect(2, 6, 22, 16)
      g.fillStyle(0x8B4513)
      g.fillRect(2, 6, 22, 5)
      g.fillStyle(0xFFD700)
      g.fillRect(11, 6, 4, 16)
      g.fillRect(4, 11, 18, 3)
      g.fillStyle(0xFFF8DC, 0.4)
      g.fillRect(4, 7, 8, 3)
      g.lineStyle(1, 0xFFD700, 0.8)
      g.strokeRect(2, 6, 22, 16)
      g.generateTexture('chest_rare', 26, 24)
      g.destroy()
    }
  }

  open() {
    if (this.isOpened || !this.active) return
    this.isOpened = true

    // Open animation — pop up and flash
    this.scene.tweens.add({
      targets: this, y: this.y - 8, scaleX: 1.3, scaleY: 1.3,
      duration: 200, yoyo: true, ease: 'Back.easeOut',
    })

    // Flash
    const flash = this.scene.add.circle(this.x, this.y, 10, 0xffd700, 0.6).setDepth(15)
    this.scene.tweens.add({
      targets: flash, scale: 4, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
    })

    // Spawn loot
    const lootCount = this.rarity === 'rare' ? Phaser.Math.Between(4, 6) : Phaser.Math.Between(2, 4)
    const lootTypes: PickupType[] = this.rarity === 'rare'
      ? ['hp', 'hp', 'bomb', 'shield', 'speed', 'xpstar']
      : ['hp', 'hp', 'hp', 'magnet', 'speed']

    const scene = this.scene as any
    for (let i = 0; i < lootCount; i++) {
      const type = lootTypes[Phaser.Math.Between(0, lootTypes.length - 1)]
      const angle = (i / lootCount) * Math.PI * 2
      const dist = Phaser.Math.Between(20, 45)
      const lx = this.x + Math.cos(angle) * dist
      const ly = this.y + Math.sin(angle) * dist

      // Delay each pickup spawn for cascade effect
      this.scene.time.delayedCall(i * 100, () => {
        if (!this.scene) return
        const pickup = new Pickup(this.scene, this.x, this.y, type, this.player)
        if (scene.pickups) scene.pickups.add(pickup)
        // Tween to final position
        this.scene.tweens.add({
          targets: pickup, x: lx, y: ly, duration: 300, ease: 'Back.easeOut',
        })
      })
    }

    // Label
    const label = this.rarity === 'rare' ? 'RARE CHEST!' : 'Chest!'
    const color = this.rarity === 'rare' ? '#ffd700' : '#daa520'
    const txt = this.scene.add.text(this.x, this.y - 20, label, {
      fontFamily: 'monospace', fontSize: '12px', color, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20)
    this.scene.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 1000, onComplete: () => txt.destroy() })

    // Fade out chest
    this.scene.time.delayedCall(500, () => {
      if (this.scene) {
        this.scene.tweens.add({
          targets: this, alpha: 0, duration: 300,
          onComplete: () => this.destroy(),
        })
      }
    })
  }
}
