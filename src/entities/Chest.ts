import Phaser from 'phaser'
import { Player } from './Player'
import { Pickup, type PickupType } from './Pickup'

export type ChestRarity = 'common' | 'rare'

// Spritesheet: 9 cols (chest types) x 4 rows (animation states)
// Row 0 = closed, Row 1 = opening, Row 2 = open, Row 3 = contents visible
// Frame index = row * 9 + col
const CHEST_COL: Record<ChestRarity, number> = {
  common: 0, // brown/wooden
  rare:   6, // gold/ornate
}

function closedFrame(col: number)   { return col }
function openingFrame(col: number)  { return 9  + col }
function openFrame(col: number)     { return 18 + col }
function contentsFrame(col: number) { return 27 + col }

export class Chest extends Phaser.Physics.Arcade.Sprite {
  rarity: ChestRarity
  private isOpened = false
  private player: Player

  constructor(scene: Phaser.Scene, x: number, y: number, rarity: ChestRarity, player: Player) {
    const col = CHEST_COL[rarity]
    super(scene, x, y, 'chests', closedFrame(col))
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.rarity = rarity
    this.player = player
    this.setDepth(4)
    this.setScale(rarity === 'rare' ? 3.0 : 2.4)
    this.setImmovable(true)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(20, 16)

    // Create animations once per scene (guarded by key existence check)
    this.createAnimsIfNeeded(scene)
  }

  private createAnimsIfNeeded(scene: Phaser.Scene) {
    if (!scene.anims.exists('chest_common_open')) {
      const col = CHEST_COL['common']
      scene.anims.create({
        key: 'chest_common_open',
        frames: [
          { key: 'chests', frame: closedFrame(col) },
          { key: 'chests', frame: openingFrame(col) },
          { key: 'chests', frame: openFrame(col) },
          { key: 'chests', frame: contentsFrame(col) },
        ],
        frameRate: 12,
        repeat: 0,
      })
    }
    if (!scene.anims.exists('chest_rare_open')) {
      const col = CHEST_COL['rare']
      scene.anims.create({
        key: 'chest_rare_open',
        frames: [
          { key: 'chests', frame: closedFrame(col) },
          { key: 'chests', frame: openingFrame(col) },
          { key: 'chests', frame: openFrame(col) },
          { key: 'chests', frame: contentsFrame(col) },
        ],
        frameRate: 12,
        repeat: 0,
      })
    }
  }

  open() {
    if (this.isOpened || !this.active) return
    this.isOpened = true
    const scene = this.scene

    // Play opening animation, then spawn loot on complete
    const animKey = this.rarity === 'rare' ? 'chest_rare_open' : 'chest_common_open'
    this.play(animKey)
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.spawnLoot()
    })

    // Flash effect at moment of opening
    const flash = scene.add.circle(this.x, this.y, 10, 0xffd700, 0.6).setDepth(15)
    scene.tweens.add({
      targets: flash, scale: 4, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
    })

    // Label
    const label = this.rarity === 'rare' ? 'RARE CHEST!' : 'Chest!'
    const color = this.rarity === 'rare' ? '#ffd700' : '#daa520'
    const txt = scene.add.text(this.x, this.y - 20, label, {
      fontFamily: 'monospace', fontSize: '12px', color, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20)
    scene.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 1000, onComplete: () => txt.destroy() })
  }

  private spawnLoot() {
    const lootCount = this.rarity === 'rare' ? Phaser.Math.Between(4, 6) : Phaser.Math.Between(2, 4)
    const lootTypes: PickupType[] = this.rarity === 'rare'
      ? ['hp', 'hp', 'bomb', 'shield', 'speed', 'xpstar']
      : ['hp', 'hp', 'hp', 'magnet', 'speed']

    // Cache refs before any delayed calls — this.scene becomes null after destroy
    const scene = this.scene as any
    const cx = this.x, cy = this.y
    const player = this.player

    for (let i = 0; i < lootCount; i++) {
      const type = lootTypes[Phaser.Math.Between(0, lootTypes.length - 1)]
      const angle = (i / lootCount) * Math.PI * 2
      const dist = Phaser.Math.Between(20, 45)
      const lx = cx + Math.cos(angle) * dist
      const ly = cy + Math.sin(angle) * dist

      scene.time.delayedCall(i * 100, () => {
        if (!scene.scene?.isActive()) return
        const pickup = new Pickup(scene, cx, cy, type, player)
        if (scene.pickups) scene.pickups.add(pickup)
        scene.tweens.add({
          targets: pickup, x: lx, y: ly, duration: 300, ease: 'Back.easeOut',
        })
      })
    }

    // Fade out chest after loot spawns
    scene.time.delayedCall(500, () => {
      if (!scene.scene?.isActive() || !this.active) return
      scene.tweens.add({
        targets: this, alpha: 0, duration: 300,
        onComplete: () => { if (this.active) this.destroy() },
      })
    })
  }
}
