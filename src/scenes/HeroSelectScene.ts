import Phaser from 'phaser'
import { type HeroType } from '../entities/Player'
import { unlockHero } from './EncyclopediaScene'
import { MetaProgress } from '../systems/MetaProgress'
import { addDiagonalBg } from '../utils/bgScroll'
import { isMobileDevice, gameFont } from '../utils/device'

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
  yOff?: number
}

export const HEROES: HeroDef[] = [
  { type: 'amun', name: 'Amun', role: 'Guardian', color: 0xfff200,
    asset: 'assets/amun/Idle.png', fw: 160, fh: 111, scale: 1.3, frames: 8, yOff: -30 },
  { type: 'sifra', name: 'Sifra', role: 'Ice Mage', color: 0x82ccdd,
    asset: 'assets/sifra/Idle.png', fw: 231, fh: 190, scale: 0.65, frames: 6 },
  { type: 'ignara', name: 'Ignara', role: 'Fire Mage', color: 0xe84118,
    asset: 'assets/ignara/Idle.png', fw: 150, fh: 150, scale: 1.1, frames: 8 },
  { type: 'nazar', name: 'Nazar', role: 'Samurai', color: 0xc23616,
    asset: 'assets/nazar/Idle.png', fw: 200, fh: 200, scale: 1.0, frames: 8, yOff: 8 },
  { type: 'huntress', name: 'Lyra', role: 'Spear Thrower', color: 0x2ecc71,
    asset: 'assets/lyra/Idle.png', fw: 150, fh: 150, scale: 1.265, frames: 8 },
  { type: 'khashin', name: 'Khashin', role: 'Sand Assassin', color: 0x88ddff,
    asset: 'assets/khashin/Idle_cropped.png', fw: 48, fh: 42, scale: 1.36, frames: 8 },
  { type: 'muller', name: 'Givi', role: 'Crystal Gnome', color: 0x44aaff,
    asset: 'assets/givi/Idle_cropped.png', fw: 51, fh: 44, scale: 1.12, frames: 8, yOff: 10 },
]

export const HERO_UNLOCK_HINTS: Partial<Record<HeroType, string>> = {
  sifra:    "Find her in the Ruin. (Complete Amun's tutorial)",
  ignara:   'Complete 3 runs to unlock.',
  nazar:    'Win a run to unlock.',
  huntress: 'Purchase at the Forge for 300 gold.',
  khashin:  'Survive 8 minutes as Sifra to unlock.',
  muller:   'Someone is working in the deep crystal...',
}

export class HeroSelectScene extends Phaser.Scene {
  private circles: Phaser.GameObjects.Graphics[] = []
  private selectedIndex = -1
  private activeLockedHint: Phaser.GameObjects.Text | null = null
  private playerName = ''

  constructor() {
    super({ key: 'HeroSelectScene' })
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
    if (!this.textures.exists('book_anim')) {
      this.load.spritesheet('book_anim', 'assets/book/book_anim.png', { frameWidth: 542, frameHeight: 542 })
    }
  }

  create(data?: { playerName?: string; mode?: 'solo' | 'multiplayer' }) {
    this.cameras.main.fadeIn(200)
    const { width, height } = this.scale
    const compact = height < 500
    this.circles = []
    this.selectedIndex = -1
    this.activeLockedHint = null

    this.playerName = data?.playerName
      || localStorage.getItem('claws_player_name')
      || ''


    this.cameras.main.setBackgroundColor(0x0d0d1a)
    addDiagonalBg(this)

    // Title
    const heroSelectTitle = this.add.text(width / 2, compact ? 18 : height * 0.08, 'CLAWS', {
      fontFamily: gameFont(), fontSize: compact ? '28px' : '48px',
      color: '#FFD700',
    }).setOrigin(0.5)
    heroSelectTitle.setShadow(0, 1, '#000000', 2, true, true)

    this.add.text(width / 2, compact ? 46 : height * 0.08 + 46, 'Survive the Swarm', {
      fontFamily: gameFont(), fontSize: compact ? '13px' : '16px',
      color: '#888888',
    }).setOrigin(0.5)

    if (this.playerName) {
      this.add.text(16, compact ? 8 : 16, `Playing as: ${this.playerName}`, {
        fontFamily: gameFont(), fontSize: compact ? '13px' : '13px',
        color: '#FFD700',
      }).setOrigin(0, 0)
    }

    this.add.text(width / 2, compact ? 64 : height * 0.24, 'Choose your Hero', {
      fontFamily: gameFont(), fontSize: compact ? '13px' : '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    // Layout heroes
    const isPortrait = height > width
    const circleRadius = isPortrait ? 32 : (compact ? 36 : 52)
    const gap = isPortrait ? 12 : (compact ? 16 : 20)

    let startX: number, heroY: number
    const cols = isPortrait ? 2 : HEROES.length
    const rowH = circleRadius * 2 + (isPortrait ? 50 : 0)
    if (isPortrait) {
      const gridW = cols * (circleRadius * 2) + (cols - 1) * gap
      startX = width / 2 - gridW / 2 + circleRadius
      heroY = height * 0.28
    } else {
      const totalW = HEROES.length * (circleRadius * 2) + (HEROES.length - 1) * gap
      startX = width / 2 - totalW / 2 + circleRadius
      heroY = compact ? height * 0.48 : height * 0.46
    }

    // Create idle animations for each hero
    HEROES.forEach((hero) => {
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

    // Sort: unlocked heroes first
    const sortedHeroes = [...HEROES].sort((a, b) => {
      const aLocked = MetaProgress.isHeroUnlocked(a.type) ? 0 : 1
      const bLocked = MetaProgress.isHeroUnlocked(b.type) ? 0 : 1
      return aLocked - bLocked
    })

    sortedHeroes.forEach((hero, i) => {
      let cx: number, cy: number
      if (isPortrait) {
        const col = i % cols
        const row = Math.floor(i / cols)
        cx = startX + col * (circleRadius * 2 + gap)
        cy = heroY + row * (rowH + gap)
      } else {
        cx = startX + i * (circleRadius * 2 + gap)
        cy = heroY
      }
      const colorHex = `#${hero.color.toString(16).padStart(6, '0')}`
      const isLocked = !MetaProgress.isHeroUnlocked(hero.type)

      // Circle background + border
      const g = this.add.graphics().setDepth(0)
      this.circles.push(g)
      this.drawCircle(g, cx, cy, circleRadius, isLocked ? 0x444444 : hero.color, false)

      // Animated sprite — circular mask
      const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
      const sprY = cy + (hero.yOff || 0)
      const sprite = this.add.sprite(cx, sprY, texKey, 0)
        .setScale(hero.scale).setDepth(1)
      if (hero.tint) sprite.setTint(hero.tint)
      sprite.play(`start_idle_${hero.type}`)

      // Circular mask to clip sprite inside the circle
      const maskShape = this.make.graphics({ x: 0, y: 0 })
      maskShape.fillStyle(0xffffff)
      maskShape.fillCircle(cx, cy, circleRadius - 3)
      const mask = maskShape.createGeometryMask()
      sprite.setMask(mask)

      // Locked overlay: very dark tint + lock icon
      if (isLocked) {
        sprite.setTint(0x111111)
        const lockOverlay = this.add.graphics().setDepth(3)
        lockOverlay.fillStyle(0x000000, 0.5)
        lockOverlay.fillCircle(cx, cy, circleRadius - 3)
        const lx = cx, ly = cy
        const lockG = this.add.graphics().setDepth(4)
        lockG.lineStyle(2, 0x888888, 1)
        lockG.beginPath()
        lockG.arc(lx, ly - 6, 7, Math.PI, 0, false)
        lockG.strokePath()
        lockG.fillStyle(0x666666, 1)
        lockG.fillRect(lx - 9, ly - 6, 18, 14)
        lockG.lineStyle(1, 0x888888, 1)
        lockG.strokeRect(lx - 9, ly - 6, 18, 14)
        lockG.fillStyle(0x222222, 1)
        lockG.fillCircle(lx, ly, 2)
        lockG.fillRect(lx - 1, ly, 2, 5)
      }

      // Hero name below circle
      const nameText = this.add.text(cx, cy + circleRadius + (compact ? 8 : 14), isLocked ? '???' : hero.name, {
        fontFamily: gameFont(), fontSize: isPortrait ? '10px' : (compact ? '11px' : '14px'),
        color: isLocked ? '#555555' : colorHex,
      }).setOrigin(0.5).setDepth(2)

      // Role below name
      this.add.text(cx, cy + circleRadius + (compact ? 22 : 32), isLocked ? '???' : hero.role, {
        fontFamily: gameFont(), fontSize: isPortrait ? '12px' : (compact ? '11px' : '10px'),
        color: isLocked ? '#444444' : '#888888',
      }).setOrigin(0.5).setDepth(2)

      // Interactive zone over the circle
      const zone = this.add.zone(cx, cy, circleRadius * 2, circleRadius * 2 + 50)
        .setInteractive({ useHandCursor: !isLocked })

      if (isLocked) {
        zone.on('pointerdown', () => {
          this.tweens.add({ targets: g, x: 3, duration: 40, yoyo: true, repeat: 2, onComplete: () => g.setX(0) })
          if (this.activeLockedHint) {
            this.tweens.killTweensOf(this.activeLockedHint)
            this.activeLockedHint.destroy()
            this.activeLockedHint = null
          }
          const hint = HERO_UNLOCK_HINTS[hero.type] || 'Play more runs to unlock'
          const hintW = isPortrait ? circleRadius * 2 + 80 : circleRadius * 2 + 40
          const hintTxt = this.add.text(cx, cy + circleRadius + (compact ? 52 : 68), hint, {
            fontFamily: gameFont(), fontSize: isPortrait ? '11px' : (compact ? '12px' : '11px'),
            color: '#aaaaaa',
            wordWrap: { width: hintW },
          }).setOrigin(0.5).setDepth(5)
          this.activeLockedHint = hintTxt
          this.tweens.add({
            targets: hintTxt, alpha: 0, duration: 600,
            delay: 1800,
            onComplete: () => {
              hintTxt.destroy()
              if (this.activeLockedHint === hintTxt) this.activeLockedHint = null
            },
          })
        })
      } else {
        zone.on('pointerover', () => {
          if (this.selectedIndex !== i) {
            this.drawCircle(g, cx, cy, circleRadius, hero.color, true)
            sprite.setScale(hero.scale * 1.15)
            nameText.setColor('#ffffff')
          }
        })

        zone.on('pointerout', () => {
          if (this.selectedIndex !== i) {
            this.drawCircle(g, cx, cy, circleRadius, hero.color, false)
            sprite.setScale(hero.scale)
            nameText.setColor(colorHex)
          }
        })

        zone.on('pointerdown', () => {
          // Deselect previous
          if (this.selectedIndex >= 0 && this.selectedIndex !== i) {
            const prev = sortedHeroes[this.selectedIndex]
            let prevCx: number, prevCy: number
            if (isPortrait) {
              const pc = this.selectedIndex % cols
              const pr = Math.floor(this.selectedIndex / cols)
              prevCx = startX + pc * (circleRadius * 2 + gap)
              prevCy = heroY + pr * (rowH + gap)
            } else {
              prevCx = startX + this.selectedIndex * (circleRadius * 2 + gap)
              prevCy = heroY
            }
            this.drawCircle(this.circles[this.selectedIndex], prevCx, prevCy, circleRadius, prev.color, false)
          }

          this.selectedIndex = i
          this.drawCircle(g, cx, cy, circleRadius, hero.color, true)
          sprite.setScale(hero.scale * 1.15)

          // Enter fullscreen + lock landscape on mobile
          const isMob = isMobileDevice()
          if (isMob) {
            const el = document.documentElement as any
            if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
              const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {})
              if (p && typeof p.then === 'function') {
                p.then(() => {
                  (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
                })
              }
            } else {
              (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
            }
          }

          // Save hero to encyclopedia
          unlockHero(hero.type)

          // Brief flash then start loading scene
          this.cameras.main.flash(200, 255, 255, 255, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
            if (progress >= 1) {
              this.scene.start('LoadingScene', { hero: hero.type, map: 'GameScene', playerName: this.playerName })
            }
          })
        })
      }
    })

    // BACK button (bottom-left area)
    const backY = compact ? height - 14 : height * 0.92
    const backBtn = this.add.text(compact ? 48 : 60, backY, 'BACK', {
      fontFamily: gameFont(), fontSize: compact ? '11px' : '14px',
      color: '#888888',
      backgroundColor: '#1a1a2e', padding: { x: compact ? 10 : 16, y: compact ? 4 : 8 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'))
    backBtn.on('pointerout', () => backBtn.setColor('#888888'))
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200)
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('StartScene', { playerName: this.playerName })
      )
    })

    // ESC = back
    this.input.keyboard?.once('keydown-ESC', () => {
      this.cameras.main.fadeOut(200)
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('StartScene', { playerName: this.playerName })
      )
    })
  }

  private drawCircle(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, r: number,
    color: number, highlighted: boolean,
  ) {
    g.clear()

    if (highlighted) {
      g.fillStyle(color, 0.15)
      g.fillCircle(cx, cy, r + 8)
      g.fillStyle(color, 0.08)
      g.fillCircle(cx, cy, r + 14)
    }

    g.fillStyle(highlighted ? 0x222244 : 0x111122)
    g.fillCircle(cx, cy, r)

    g.lineStyle(highlighted ? 3 : 2, color, highlighted ? 1 : 0.6)
    g.strokeCircle(cx, cy, r)

    g.lineStyle(1, color, 0.2)
    g.strokeCircle(cx, cy, r - 4)
  }
}
