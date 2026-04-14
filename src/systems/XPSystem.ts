import Phaser from 'phaser'
import { gameFont } from '../utils/device'
import { Player } from '../entities/Player'

export class XPSystem {
  private scene: Phaser.Scene
  private players: Player[]
  private orbs: Phaser.Physics.Arcade.Group
  magnetRadius = 100

  constructor(scene: Phaser.Scene, players: Player[]) {
    this.scene = scene
    this.players = players

    this.orbs = scene.physics.add.group()

    // Generate XP orb texture — bright blue gem (16x16)
    const g = scene.add.graphics()
    g.fillStyle(0x4488ff, 0.3)
    g.fillCircle(8, 8, 8)
    g.fillStyle(0x4488ff)
    g.fillCircle(8, 8, 5)
    g.fillStyle(0x88ccff)
    g.fillCircle(7, 6, 2)
    g.generateTexture('xp_orb', 16, 16)
    g.destroy()

    // Generate large XP orb texture — purple gem (32x32, x2 size)
    const gl = scene.add.graphics()
    gl.fillStyle(0x9944ff, 0.3)
    gl.fillCircle(16, 16, 16)
    gl.fillStyle(0x9944ff)
    gl.fillCircle(16, 16, 10)
    gl.fillStyle(0xcc88ff)
    gl.fillCircle(14, 12, 4)
    gl.generateTexture('xp_orb_large', 32, 32)
    gl.destroy()

    // Collect orbs on overlap — register for each player
    for (const p of this.players) {
      scene.physics.add.overlap(p, this.orbs, (_p, orb) => {
        const xpOrb = orb as Phaser.Physics.Arcade.Sprite
        const xpValue = (xpOrb as any).xpValue || 10
        p.addXP(xpValue)
        xpOrb.destroy()
      })
    }

    // Single sweep timer to expire old orbs (replaces per-orb delayedCall timers)
    scene.time.addEvent({ delay: 5000, loop: true, callback: () => this._expireOldOrbs() })
  }

  private _expireOldOrbs() {
    const now = this.scene.time.now
    for (const orb of this.orbs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (orb.active && (orb as any)._spawnTime && now - (orb as any)._spawnTime > 30000) {
        orb.destroy()
      }
    }
  }

  spawnOrb(x: number, y: number, value: number) {
    const orb = this.scene.physics.add.sprite(x, y, 'xp_orb')
    orb.setDepth(3)
    ;(orb as any).xpValue = value
    ;(orb as any)._spawnTime = this.scene.time.now
    this.orbs.add(orb)

    // Small scatter burst
    const angle = Math.random() * Math.PI * 2
    orb.setVelocity(Math.cos(angle) * 60, Math.sin(angle) * 60)
    this.scene.time.delayedCall(250, () => {
      if (orb.active) orb.setVelocity(0, 0)
    })
  }

  /** Spawn a large purple XP orb (x2 value, x2 size) */
  spawnLargeOrb(x: number, y: number, value: number) {
    const orb = this.scene.physics.add.sprite(x, y, 'xp_orb_large')
    orb.setDepth(3)
    ;(orb as any).xpValue = value * 2
    ;(orb as any)._spawnTime = this.scene.time.now
    this.orbs.add(orb)

    // Pop-in scale
    orb.setScale(0)
    this.scene.tweens.add({
      targets: orb, scaleX: 1.3, scaleY: 1.3, duration: 150, ease: 'Back.easeOut',
      onComplete: () => {
        if (orb.active) this.scene.tweens.add({ targets: orb, scaleX: 1, scaleY: 1, duration: 100 })
      },
    })

    // Scatter burst
    const angle = Math.random() * Math.PI * 2
    orb.setVelocity(Math.cos(angle) * 80, Math.sin(angle) * 80)
    this.scene.time.delayedCall(300, () => {
      if (orb.active) orb.setVelocity(0, 0)
    })

    // Gentle pulse glow
    this.scene.tweens.add({
      targets: orb, alpha: 0.6, duration: 500, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  /** Call every frame — pulls nearby orbs toward the nearest player */
  updateMagnet() {
    for (const orb of this.orbs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!orb.active) continue
      let nearest: Player | null = null
      let minDist = this.magnetRadius
      for (const p of this.players) {
        if (p.isDead) continue
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, p.cx, p.cy)
        if (dist < minDist) { nearest = p; minDist = dist }
      }
      if (nearest) {
        const speed = 200 + (1 - minDist / this.magnetRadius) * 300
        const dx = nearest.cx - orb.x
        const dy = nearest.cy - orb.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const body = orb.body as Phaser.Physics.Arcade.Body
        body.setVelocity((dx / len) * speed, (dy / len) * speed)
      }
    }
  }

  getOrbs() {
    return this.orbs
  }
}

export class GoldSystem {
  private scene: Phaser.Scene
  private players: Player[]
  private orbs: Phaser.Physics.Arcade.Group
  magnetRadius = 100

  constructor(scene: Phaser.Scene, players: Player[]) {
    this.scene = scene
    this.players = players
    this.orbs = scene.physics.add.group()

    // Generate spinning coin spritesheet (8 frames, 16x16 each)
    if (!scene.textures.exists('gold_coin_sheet')) {
      const frames = 8
      const sz = 16
      const g = scene.add.graphics()
      for (let i = 0; i < frames; i++) {
        const ox = i * sz
        const phase = (i / frames) * Math.PI * 2
        const scaleX = Math.abs(Math.cos(phase))
        const hw = Math.max(1, Math.floor(6 * scaleX))
        // Shadow
        g.fillStyle(0xaa8800, 0.3)
        g.fillEllipse(ox + sz / 2, sz / 2 + 1, hw * 2 + 2, 12)
        // Body
        g.fillStyle(0xffd700)
        g.fillEllipse(ox + sz / 2, sz / 2, hw * 2, 12)
        // Edge (darker)
        if (scaleX > 0.2) {
          g.fillStyle(0xcc9900)
          g.fillEllipse(ox + sz / 2 - (hw > 2 ? 1 : 0), sz / 2, Math.max(1, hw * 2 - 2), 10)
          // Face
          g.fillStyle(0xffee55)
          g.fillEllipse(ox + sz / 2, sz / 2, Math.max(1, hw * 2 - 3), 8)
          // Shine
          g.fillStyle(0xffffff, 0.6)
          g.fillEllipse(ox + sz / 2 - 1, sz / 2 - 2, Math.max(1, Math.floor(hw * 0.6)), 3)
        }
      }
      g.generateTexture('gold_coin_sheet', sz * frames, sz)
      g.destroy()

      scene.textures.get('gold_coin_sheet').add('__BASE', 0, 0, 0, sz * frames, sz)
      for (let i = 0; i < frames; i++) {
        scene.textures.get('gold_coin_sheet').add(i, 0, i * sz, 0, sz, sz)
      }
      scene.anims.create({
        key: 'gold_spin',
        frames: Array.from({ length: frames }, (_, i) => ({ key: 'gold_coin_sheet', frame: i })),
        frameRate: 10,
        repeat: -1,
      })
    }

    // Single sweep timer to expire old gold orbs
    scene.time.addEvent({ delay: 5000, loop: true, callback: () => this._expireOldOrbs() })

    // Collect gold on overlap — fly-away +N text — register for each player
    for (const p of this.players) {
      scene.physics.add.overlap(p, this.orbs, (_p, orb) => {
        const goldOrb = orb as Phaser.Physics.Arcade.Sprite
        const value = (goldOrb as any).goldValue || 1
        p.goldThisRun += value

        // Floating "+N" text
        const txt = this.scene.add.text(goldOrb.x, goldOrb.y - 10, `+${value}`, {
          fontFamily: gameFont(), fontSize: '13px', color: '#FFD700',
        }).setOrigin(0.5).setDepth(25)
        this.scene.tweens.add({
          targets: txt, y: txt.y - 30, alpha: 0, duration: 600,
          onComplete: () => txt.destroy(),
        })

        goldOrb.destroy()
      })
    }
  }

  spawnOrb(x: number, y: number, value: number) {
    const orb = this.scene.physics.add.sprite(x, y, 'gold_coin_sheet', 0)
    orb.play('gold_spin')
    orb.setDepth(3).setScale(0)
    ;(orb as any).goldValue = value
    ;(orb as any)._spawnTime = this.scene.time.now
    this.orbs.add(orb)

    // Pop-in scale + scatter burst
    this.scene.tweens.add({
      targets: orb, scaleX: 1.3, scaleY: 1.3, duration: 120, ease: 'Back.easeOut',
      onComplete: () => {
        if (!orb.active) return
        this.scene.tweens.add({ targets: orb, scaleX: 1, scaleY: 1, duration: 80 })
      },
    })

    const angle = Math.random() * Math.PI * 2
    orb.setVelocity(Math.cos(angle) * 70, Math.sin(angle) * 70)
    this.scene.time.delayedCall(300, () => {
      if (orb.active) orb.setVelocity(0, 0)
    })

    // Gentle bob loop
    this.scene.tweens.add({
      targets: orb, y: orb.y - 4, duration: 500, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 400,
    })

    // Pulse glow
    this.scene.tweens.add({
      targets: orb, alpha: 0.7, duration: 600, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  updateMagnet() {
    for (const orb of this.orbs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!orb.active) continue
      let nearest: Player | null = null
      let minDist = this.magnetRadius
      for (const p of this.players) {
        if (p.isDead) continue
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, p.cx, p.cy)
        if (dist < minDist) { nearest = p; minDist = dist }
      }
      if (nearest) {
        const speed = 200 + (1 - minDist / this.magnetRadius) * 300
        const dx = nearest.cx - orb.x
        const dy = nearest.cy - orb.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const body = orb.body as Phaser.Physics.Arcade.Body
        body.setVelocity((dx / len) * speed, (dy / len) * speed)
      }
    }
  }

  private _expireOldOrbs() {
    const now = this.scene.time.now
    for (const orb of this.orbs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (orb.active && (orb as any)._spawnTime && now - (orb as any)._spawnTime > 30000) {
        orb.destroy()
      }
    }
  }

  getOrbs() {
    return this.orbs
  }
}
