import Phaser from 'phaser'
import { gameFont } from '../utils/device'
import { Player } from './Player'

export type PickupType = 'hp' | 'magnet' | 'heart' | 'bomb' | 'shield' | 'speed' | 'xpstar'

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  pickupType: PickupType
  private player: Player

  constructor(scene: Phaser.Scene, x: number, y: number, type: PickupType, player: Player) {
    // Use a generated texture
    const texMap: Record<PickupType, string> = {
      heart: 'pickup_heart', hp: 'pickup_hp', magnet: 'pickup_magnet',
      bomb: 'pickup_bomb', shield: 'pickup_shield', speed: 'pickup_speed', xpstar: 'pickup_xpstar',
    }
    const texKey = texMap[type]
    if (!scene.textures.exists(texKey)) {
      Pickup.generateTextures(scene)
    }
    super(scene, x, y, texKey)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.pickupType = type
    this.player = player
    this.setDepth(7)
    const scaleMap: Record<PickupType, number> = { heart: 1.5, hp: 1.0, magnet: 1.2, bomb: 1.3, shield: 1.2, speed: 1.1, xpstar: 1.3 }
    this.setScale(scaleMap[type] || 1.0)

    // Gentle float animation
    scene.tweens.add({
      targets: this,
      y: y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Auto-destroy after 10 seconds
    scene.time.delayedCall(10000, () => {
      if (this.active) {
        scene.tweens.add({
          targets: this, alpha: 0, duration: 500,
          onComplete: () => this.destroy(),
        })
      }
    })
  }

  static generateTextures(scene: Phaser.Scene) {
    // HP orb — red circle with white cross
    if (!scene.textures.exists('pickup_hp')) {
      const g1 = scene.add.graphics()
      g1.fillStyle(0xff4444)
      g1.fillCircle(8, 8, 7)
      g1.fillStyle(0xffffff)
      g1.fillRect(5, 3, 6, 10)
      g1.fillRect(3, 5, 10, 6)
      g1.generateTexture('pickup_hp', 16, 16)
      g1.destroy()
    }
    // Heart — pink heart shape
    if (!scene.textures.exists('pickup_heart')) {
      const gh = scene.add.graphics()
      gh.fillStyle(0xff3366)
      gh.fillCircle(5, 5, 4)
      gh.fillCircle(11, 5, 4)
      gh.fillTriangle(1, 7, 15, 7, 8, 15)
      gh.fillStyle(0xffffff, 0.5)
      gh.fillCircle(5, 4, 2)
      gh.generateTexture('pickup_heart', 16, 16)
      gh.destroy()
    }
    // Magnet — blue circle with U shape
    if (!scene.textures.exists('pickup_magnet')) {
      const g2 = scene.add.graphics()
      g2.fillStyle(0x4488ff)
      g2.fillCircle(8, 8, 7)
      g2.fillStyle(0xffffff)
      g2.fillRect(3, 3, 3, 8)
      g2.fillRect(10, 3, 3, 8)
      g2.fillRect(3, 9, 10, 3)
      g2.generateTexture('pickup_magnet', 16, 16)
      g2.destroy()
    }
    // Bomb — dark circle with fuse
    if (!scene.textures.exists('pickup_bomb')) {
      const gb = scene.add.graphics()
      gb.fillStyle(0x333333)
      gb.fillCircle(8, 9, 6)
      gb.fillStyle(0xff6600)
      gb.fillCircle(8, 3, 2)
      gb.lineStyle(2, 0xffaa00)
      gb.lineBetween(8, 3, 10, 0)
      gb.generateTexture('pickup_bomb', 16, 16)
      gb.destroy()
    }
    // Shield — blue diamond
    if (!scene.textures.exists('pickup_shield')) {
      const gs = scene.add.graphics()
      gs.fillStyle(0x4488ff, 0.8)
      gs.fillTriangle(8, 0, 0, 8, 8, 16)
      gs.fillTriangle(8, 0, 16, 8, 8, 16)
      gs.fillStyle(0xaaddff, 0.5)
      gs.fillTriangle(8, 2, 3, 8, 8, 14)
      gs.generateTexture('pickup_shield', 16, 16)
      gs.destroy()
    }
    // Speed shard — yellow lightning bolt
    if (!scene.textures.exists('pickup_speed')) {
      const gv = scene.add.graphics()
      gv.fillStyle(0xffdd44)
      gv.fillTriangle(6, 0, 2, 8, 8, 8)
      gv.fillTriangle(8, 8, 14, 8, 10, 16)
      gv.fillStyle(0xffffff, 0.6)
      gv.fillTriangle(7, 2, 4, 7, 7, 7)
      gv.generateTexture('pickup_speed', 16, 16)
      gv.destroy()
    }
    // XP star — gold star
    if (!scene.textures.exists('pickup_xpstar')) {
      const gx = scene.add.graphics()
      gx.fillStyle(0xffd700)
      gx.fillCircle(8, 8, 6)
      gx.fillStyle(0xffffff, 0.7)
      gx.fillCircle(8, 8, 3)
      // Star rays
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        gx.lineStyle(2, 0xffd700, 0.9)
        gx.lineBetween(8 + Math.cos(a) * 3, 8 + Math.sin(a) * 3, 8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7)
      }
      gx.generateTexture('pickup_xpstar', 16, 16)
      gx.destroy()
    }
  }

  collect() {
    if (!this.active) return
    if (this.pickupType === 'hp') {
      // Heal 15% max HP
      const heal = Math.ceil(this.player.maxHp * 0.15)
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal)
      // Green floating text
      const txt = this.scene.add.text(this.x, this.y - 10, `+${heal}`, {
        fontFamily: gameFont(), fontSize: '14px',
        color: '#44ff44', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20)
      this.scene.tweens.add({
        targets: txt, y: txt.y - 25, alpha: 0, duration: 600,
        onComplete: () => txt.destroy(),
      })
    } else if (this.pickupType === 'heart') {
      // Heal 10% max HP
      const heal = Math.ceil(this.player.maxHp * 0.10)
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal)
      const txt = this.scene.add.text(this.x, this.y - 10, `+${heal} ♥`, {
        fontFamily: gameFont(), fontSize: '16px',
        color: '#ff3366', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20)
      this.scene.tweens.add({
        targets: txt, y: txt.y - 30, alpha: 0, duration: 800,
        onComplete: () => txt.destroy(),
      })
    } else if (this.pickupType === 'magnet') {
      // Pull all XP orbs to player instantly
      this.scene.events.emit('magnet-activated')
      // Blue flash
      const flash = this.scene.add.circle(this.player.x, this.player.y, 30, 0x4488ff, 0.4).setDepth(15)
      this.scene.tweens.add({
        targets: flash, scale: 8, alpha: 0, duration: 500,
        onComplete: () => flash.destroy(),
      })
    } else if (this.pickupType === 'bomb') {
      // AOE explosion around player
      const radius = 150
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) <= radius) {
            (e as any).takeDamage(this.player.damage * 2, 'fire')
          }
        }
      }
      // Explosion VFX
      const boom = this.scene.add.circle(this.player.x, this.player.y, 20, 0xff6600, 0.6).setDepth(15)
      this.scene.tweens.add({ targets: boom, scale: radius / 20, alpha: 0, duration: 400, onComplete: () => boom.destroy() })
      this.scene.cameras.main.shake(100, 0.005)
      const txt = this.scene.add.text(this.x, this.y - 10, 'BOOM!', {
        fontFamily: gameFont(), fontSize: '16px', color: '#ff6600', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20)
      this.scene.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 800, onComplete: () => txt.destroy() })
    } else if (this.pickupType === 'shield') {
      // Temporary shield
      this.player.shieldHp = 30
      this.player.shieldMaxHp = 30
      this.player.shieldTimer = 10000 // 10 seconds
      const txt = this.scene.add.text(this.x, this.y - 10, 'SHIELD!', {
        fontFamily: gameFont(), fontSize: '14px', color: '#4488ff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20)
      this.scene.tweens.add({ targets: txt, y: txt.y - 25, alpha: 0, duration: 600, onComplete: () => txt.destroy() })
    } else if (this.pickupType === 'speed') {
      // Speed boost for 8 seconds — cache current speed before multiplying so expiry restores correctly
      this.player.baseSpeedCache = this.player.speed
      this.player.speedBuffUntil = this.scene.time.now + 8000
      this.player.speed = Math.ceil(this.player.speed * 1.3)
      const txt = this.scene.add.text(this.x, this.y - 10, 'SPEED!', {
        fontFamily: gameFont(), fontSize: '14px', color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20)
      this.scene.tweens.add({ targets: txt, y: txt.y - 25, alpha: 0, duration: 600, onComplete: () => txt.destroy() })
    } else if (this.pickupType === 'xpstar') {
      // 150% XP multiplier until next level
      this.player.xpMult *= 1.5
      const txt = this.scene.add.text(this.x, this.y - 10, 'XP x1.5!', {
        fontFamily: gameFont(), fontSize: '14px', color: '#ffd700', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20)
      this.scene.tweens.add({ targets: txt, y: txt.y - 25, alpha: 0, duration: 600, onComplete: () => txt.destroy() })
    }
    // Collect VFX — small sparkle
    const spark = this.scene.add.circle(this.x, this.y, 4, 0xffffff, 0.8).setDepth(15)
    this.scene.tweens.add({
      targets: spark, scale: 3, alpha: 0, duration: 200,
      onComplete: () => spark.destroy(),
    })
    this.destroy()
  }
}
