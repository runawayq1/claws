import Phaser from 'phaser'
import { type HeroType } from '../entities/Player'
import { unlockHero } from './EncyclopediaScene'

interface HeroDef {
  type: HeroType
  name: string
  role: string
  color: number
  asset: string
  fw: number
  fh: number
  scale: number
  tint?: number
  frames: number
  yOff?: number // vertical offset to center sprite in circle
}

const HEROES: HeroDef[] = [
  { type: 'ignara', name: 'Ignara', role: 'Fire Mage', color: 0xe84118,
    asset: 'assets/fire_wizard/Idle.png', fw: 150, fh: 150, scale: 1.1, frames: 8 },
  { type: 'sifra', name: 'Sifra', role: 'Ice Mage', color: 0x82ccdd,
    asset: 'assets/wizard/Idle.png', fw: 231, fh: 190, scale: 0.65, frames: 6 },
  { type: 'amun', name: 'Amun', role: 'Guardian', color: 0xfff200,
    asset: 'assets/king/Idle.png', fw: 160, fh: 111, scale: 1.3, frames: 8, yOff: -30 },
  { type: 'nazar', name: 'Nazar', role: 'Samurai', color: 0xc23616,
    asset: 'assets/martial_hero/Idle.png', fw: 200, fh: 200, scale: 1.0, frames: 8, yOff: 8 },
  { type: 'huntress', name: 'Lyra', role: 'Spear Thrower', color: 0x2ecc71,
    asset: 'assets/huntress/Idle.png', fw: 150, fh: 150, scale: 1.1, frames: 8 },
]

export class StartScene extends Phaser.Scene {
  private circles: Phaser.GameObjects.Graphics[] = []
  private selectedIndex = -1
  private playerName = ''

  constructor() {
    super({ key: 'StartScene' })
  }

  preload() {
    const loaded = new Set<string>()
    for (const hero of HEROES) {
      if (loaded.has(hero.asset)) continue
      loaded.add(hero.asset)
      const key = hero.asset.replace(/[^a-z0-9]/gi, '_')
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, hero.asset, { frameWidth: hero.fw, frameHeight: hero.fh })
      }
    }
  }

  create(data?: { playerName?: string }) {
    const { width, height } = this.scale
    const compact = height < 500
    this.circles = []
    this.selectedIndex = -1

    // Resolve name: passed via scene data, or fall back to localStorage
    this.playerName = data?.playerName
      || localStorage.getItem('claws_player_name')
      || ''

    this.cameras.main.setBackgroundColor(0x0d0d1a)

    // Title
    this.add.text(width / 2, compact ? 18 : height * 0.08, 'CLAWS', {
      fontFamily: 'monospace', fontSize: compact ? '28px' : '48px',
      color: '#FFD700', stroke: '#000000', strokeThickness: compact ? 4 : 6,
    }).setOrigin(0.5)

    this.add.text(width / 2, compact ? 46 : height * 0.08 + 46, 'Survive the Swarm', {
      fontFamily: 'monospace', fontSize: compact ? '10px' : '16px',
      color: '#888888', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    if (this.playerName) {
      this.add.text(16, compact ? 8 : 16, `Playing as: ${this.playerName}`, {
        fontFamily: 'monospace', fontSize: compact ? '10px' : '13px',
        color: '#FFD700', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0, 0)
    }

    this.add.text(width / 2, compact ? 64 : height * 0.24, 'Choose your Hero', {
      fontFamily: 'monospace', fontSize: compact ? '13px' : '18px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    // Layout heroes
    const circleRadius = compact ? 36 : 52
    const gap = compact ? 16 : 20
    const totalW = HEROES.length * (circleRadius * 2) + (HEROES.length - 1) * gap
    const startX = width / 2 - totalW / 2 + circleRadius
    const heroY = compact ? height * 0.48 : height * 0.46

    // Create idle animations for each hero
    HEROES.forEach((hero, _i) => {
      const animKey = `start_idle_${hero.type}`
      if (!this.anims.exists(animKey)) {
        const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: hero.frames - 1 }),
          frameRate: 8,
          repeat: -1,
        })
      }
    })

    // Encyclopedia button
    const encBtn = this.add.text(width / 2 - (compact ? 52 : 72), compact ? height - 14 : height * 0.92, 'ENCYCLOPEDIA', {
      fontFamily: 'monospace', fontSize: compact ? '11px' : '14px',
      color: '#888888', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#1a1a2e', padding: { x: compact ? 10 : 16, y: compact ? 4 : 8 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
    encBtn.on('pointerover', () => encBtn.setColor('#d4b483'))
    encBtn.on('pointerout', () => encBtn.setColor('#888888'))
    encBtn.on('pointerdown', () => this.scene.start('EncyclopediaScene'))

    // Profile button
    const profileBtn = this.add.text(width / 2 + (compact ? 52 : 72), compact ? height - 14 : height * 0.92, 'PROFILE', {
      fontFamily: 'monospace', fontSize: compact ? '11px' : '14px',
      color: '#888888', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#1a1a2e', padding: { x: compact ? 10 : 16, y: compact ? 4 : 8 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setInteractive({ useHandCursor: true })
    profileBtn.on('pointerover', () => profileBtn.setColor('#FFD700'))
    profileBtn.on('pointerout', () => profileBtn.setColor('#888888'))
    profileBtn.on('pointerdown', () => this.scene.start('ProfileScene'))

    // TEST button — corner shortcut to hitbox debug scene
    const testBtn = this.add.text(width - 10, height - 10, 'TEST', {
      fontFamily: 'monospace', fontSize: '10px',
      color: '#444466', stroke: '#000000', strokeThickness: 2,
      backgroundColor: '#111122', padding: { x: 6, y: 3 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(1, 1).setInteractive({ useHandCursor: true })
    testBtn.on('pointerover', () => testBtn.setColor('#aaaaff'))
    testBtn.on('pointerout', () => testBtn.setColor('#444466'))
    testBtn.on('pointerdown', () => this.scene.start('TestScene'))

    HEROES.forEach((hero, i) => {
      const cx = startX + i * (circleRadius * 2 + gap)
      const colorHex = `#${hero.color.toString(16).padStart(6, '0')}`

      // Circle background + border
      const g = this.add.graphics().setDepth(0)
      this.circles.push(g)
      this.drawCircle(g, cx, heroY, circleRadius, hero.color, false)

      // Animated sprite — circular mask
      const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
      const sprY = heroY + (hero.yOff || 0)
      const sprite = this.add.sprite(cx, sprY, texKey, 0)
        .setScale(hero.scale).setDepth(1)
      if (hero.tint) sprite.setTint(hero.tint)
      sprite.play(`start_idle_${hero.type}`)

      // Circular mask to clip sprite inside the circle
      const maskShape = this.make.graphics({ x: 0, y: 0 })
      maskShape.fillStyle(0xffffff)
      maskShape.fillCircle(cx, heroY, circleRadius - 3)
      const mask = maskShape.createGeometryMask()
      sprite.setMask(mask)

      // Hero name below circle
      const nameText = this.add.text(cx, heroY + circleRadius + (compact ? 8 : 14), hero.name, {
        fontFamily: 'monospace', fontSize: compact ? '11px' : '14px',
        color: colorHex, stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(2)

      // Role below name
      this.add.text(cx, heroY + circleRadius + (compact ? 22 : 32), hero.role, {
        fontFamily: 'monospace', fontSize: compact ? '8px' : '10px',
        color: '#888888', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(2)

      // Interactive zone over the circle
      const zone = this.add.zone(cx, heroY, circleRadius * 2, circleRadius * 2 + 50)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerover', () => {
        if (this.selectedIndex !== i) {
          this.drawCircle(g, cx, heroY, circleRadius, hero.color, true)
          sprite.setScale(hero.scale * 1.15)
          nameText.setColor('#ffffff')
        }
      })

      zone.on('pointerout', () => {
        if (this.selectedIndex !== i) {
          this.drawCircle(g, cx, heroY, circleRadius, hero.color, false)
          sprite.setScale(hero.scale)
          nameText.setColor(colorHex)
        }
      })

      zone.on('pointerdown', () => {
        // Deselect previous
        if (this.selectedIndex >= 0 && this.selectedIndex !== i) {
          const prev = HEROES[this.selectedIndex]
          const prevCx = startX + this.selectedIndex * (circleRadius * 2 + gap)
          this.drawCircle(this.circles[this.selectedIndex], prevCx, heroY, circleRadius, prev.color, false)
        }

        this.selectedIndex = i
        this.drawCircle(g, cx, heroY, circleRadius, hero.color, true)
        sprite.setScale(hero.scale * 1.15)

        // Enter fullscreen on mobile only
        const isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1)
        if (isMob) {
          const el = document.documentElement as any
          if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
            (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {})
          }
        }

        // Save hero to encyclopedia
        unlockHero(hero.type)

        // Brief flash then start
        this.cameras.main.flash(200, 255, 255, 255, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
          if (progress >= 1) {
            this.scene.start('GameScene', { hero: hero.type })
          }
        })
      })
    })
  }

  private drawCircle(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, r: number,
    color: number, highlighted: boolean,
  ) {
    g.clear()

    if (highlighted) {
      // Outer glow
      g.fillStyle(color, 0.15)
      g.fillCircle(cx, cy, r + 8)
      g.fillStyle(color, 0.08)
      g.fillCircle(cx, cy, r + 14)
    }

    // Dark bg
    g.fillStyle(highlighted ? 0x222244 : 0x111122)
    g.fillCircle(cx, cy, r)

    // Border
    g.lineStyle(highlighted ? 3 : 2, color, highlighted ? 1 : 0.6)
    g.strokeCircle(cx, cy, r)

    // Inner subtle ring
    g.lineStyle(1, color, 0.2)
    g.strokeCircle(cx, cy, r - 4)
  }
}
