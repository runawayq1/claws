import Phaser from 'phaser'
import { type HeroType } from '../entities/Player'
import { addDiagonalBg } from '../utils/bgScroll'

interface HeroDef {
  type: HeroType
  name: string
  color: number
  asset: string
  fw: number
  fh: number
  scale: number
  frames: number
  yOff?: number
}

const HEROES: HeroDef[] = [
  { type: 'amun',     name: 'Amun',    color: 0xfff200, asset: 'assets/amun/Idle.png',           fw: 160, fh: 111, scale: 1.3,  frames: 8, yOff: -30 },
  { type: 'sifra',    name: 'Sifra',   color: 0x82ccdd, asset: 'assets/sifra/Idle.png',          fw: 231, fh: 190, scale: 0.65, frames: 6 },
  { type: 'ignara',   name: 'Ignara',  color: 0xe84118, asset: 'assets/ignara/Idle.png',         fw: 150, fh: 150, scale: 1.1,  frames: 8 },
  { type: 'nazar',    name: 'Nazar',   color: 0xc23616, asset: 'assets/nazar/Idle.png',          fw: 200, fh: 200, scale: 1.0,  frames: 8, yOff: 8 },
  { type: 'huntress', name: 'Lyra',    color: 0x2ecc71, asset: 'assets/lyra/Idle.png',           fw: 150, fh: 150, scale: 1.265,frames: 8 },
  { type: 'khashin',  name: 'Khashin', color: 0x88ddff, asset: 'assets/khashin/Idle_cropped.png',fw: 48,  fh: 42,  scale: 1.36, frames: 8 },
  { type: 'muller',   name: 'Givi',    color: 0x44aaff, asset: 'assets/givi/Idle_cropped.png',   fw: 51,  fh: 44,  scale: 1.12, frames: 8, yOff: 10 },
]

interface LobbySlot {
  playerId: string
  playerName: string
  heroType: HeroType | null
  isLocal: boolean
  isHost: boolean
}

export class LobbyScene extends Phaser.Scene {
  /** Slot data — populated on create, extended by network events in Phase 2 */
  private _slots: LobbySlot[] = []
  /** Public accessor for Phase 2 network layer to read/update slots */
  get slots(): LobbySlot[] { return this._slots }
  private selectedHero: HeroType | null = null
  private playerName = ''

  // UI refs that need updating after hero selection
  private slotHeroSprites: (Phaser.GameObjects.Sprite | null)[] = []
  private slotHeroNameTexts: (Phaser.GameObjects.Text | null)[] = []
  private heroCircleGraphics: Phaser.GameObjects.Graphics[] = []
  private heroCircleSelectedIndex = -1
  private startBtn!: Phaser.GameObjects.Graphics
  private startBtnText!: Phaser.GameObjects.Text
  private startBtnEnabled = false

  constructor() {
    super({ key: 'LobbyScene' })
  }

  preload() {
    for (const hero of HEROES) {
      const key = this._texKey(hero.asset)
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, hero.asset, { frameWidth: hero.fw, frameHeight: hero.fh })
      }
    }
  }

  create(data?: { playerName?: string }) {
    this.cameras.main.fadeIn(200)
    const { width, height } = this.scale

    this.playerName = data?.playerName
      || localStorage.getItem('claws_player_name')
      || 'Player'

    this.selectedHero = null
    this.startBtnEnabled = false
    this.heroCircleSelectedIndex = -1
    this.heroCircleGraphics = []
    this.slotHeroSprites = [null, null, null, null]
    this.slotHeroNameTexts = [null, null, null, null]

    // Init slot data
    this._slots = [
      { playerId: 'local', playerName: this.playerName, heroType: null, isLocal: true,  isHost: true },
      { playerId: '',      playerName: '',               heroType: null, isLocal: false, isHost: false },
      { playerId: '',      playerName: '',               heroType: null, isLocal: false, isHost: false },
      { playerId: '',      playerName: '',               heroType: null, isLocal: false, isHost: false },
    ]

    this.cameras.main.setBackgroundColor(0x0d0d1a)
    addDiagonalBg(this)

    const compact = height < 500

    // ── Title ──────────────────────────────────────────────────────────────────
    this.add.text(width / 2, compact ? 18 : 28, 'QUICK PLAY', {
      fontFamily: 'monospace',
      fontSize: compact ? '22px' : '32px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: compact ? 4 : 6,
    }).setOrigin(0.5)

    // ── Player Slots ───────────────────────────────────────────────────────────
    const slotW = compact ? 90 : 120
    const slotH = compact ? 110 : 140
    const slotGap = compact ? 10 : 16
    const totalSlotsW = 4 * slotW + 3 * slotGap
    const slotStartX = width / 2 - totalSlotsW / 2
    const slotY = compact ? 46 : 60

    this.buildSlots(slotStartX, slotY, slotW, slotH, slotGap, compact)

    // ── Hero Selection ─────────────────────────────────────────────────────────
    const heroSectionY = slotY + slotH + (compact ? 14 : 22)
    this.buildHeroGrid(heroSectionY, compact)

    // ── Buttons ────────────────────────────────────────────────────────────────
    const btnAreaY = height - (compact ? 30 : 44)
    this.buildButtons(btnAreaY, compact)

    // ── ESC = Leave ────────────────────────────────────────────────────────────
    this.input.keyboard?.on('keydown-ESC', () => this.leave())
  }

  // ── Slots ───────────────────────────────────────────────────────────────────

  private buildSlots(
    startX: number, topY: number,
    slotW: number, slotH: number, gap: number,
    compact: boolean,
  ) {
    for (let i = 0; i < 4; i++) {
      const sx = startX + i * (slotW + gap)
      const sy = topY
      const isLocal = i === 0

      // Rounded rect background
      const bg = this.add.graphics()
      bg.fillStyle(isLocal ? 0x1a1a3a : 0x111122, 1)
      bg.fillRoundedRect(sx, sy, slotW, slotH, 8)
      bg.lineStyle(isLocal ? 2 : 1, isLocal ? 0xffd700 : 0x333355, isLocal ? 0.8 : 0.5)
      bg.strokeRoundedRect(sx, sy, slotW, slotH, 8)

      const cx = sx + slotW / 2

      if (isLocal) {
        // "YOU" badge
        const badgeY = sy + (compact ? 8 : 10)
        this.add.text(cx, badgeY, 'YOU', {
          fontFamily: 'monospace',
          fontSize: compact ? '9px' : '11px',
          color: '#FFD700',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5, 0)

        // Slot 1: hero sprite placeholder (filled when hero selected)
        const spriteY = sy + slotH / 2 + (compact ? 4 : 6)
        const placeholder = this.add.text(cx, spriteY, '?', {
          fontFamily: 'monospace',
          fontSize: compact ? '20px' : '28px',
          color: '#444466',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5)
        this.slotHeroSprites[0] = null
        // Store placeholder so we can hide it when hero is selected
        ;(placeholder as any).__isPlaceholder = true
        this.slotHeroSprites[0] = placeholder as any

        // Player name
        const nameY = sy + slotH - (compact ? 14 : 18)
        const nameTxt = this.add.text(cx, nameY, this.playerName, {
          fontFamily: 'monospace',
          fontSize: compact ? '9px' : '11px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5)
        this.slotHeroNameTexts[0] = nameTxt
      } else {
        // Empty slot
        const midY = sy + slotH / 2
        this.add.text(cx, midY - (compact ? 6 : 8), '· · ·', {
          fontFamily: 'monospace',
          fontSize: compact ? '12px' : '16px',
          color: '#333355',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5)
        this.add.text(cx, midY + (compact ? 8 : 12), 'Waiting...', {
          fontFamily: 'monospace',
          fontSize: compact ? '8px' : '10px',
          color: '#333355',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5)
      }
    }
  }

  // ── Hero Grid ────────────────────────────────────────────────────────────────

  private buildHeroGrid(topY: number, compact: boolean) {
    const { width } = this.scale
    const R = compact ? 26 : 34
    const gap = compact ? 10 : 14
    const totalW = HEROES.length * (R * 2) + (HEROES.length - 1) * gap
    const startX = width / 2 - totalW / 2 + R
    const cy = topY + R + (compact ? 8 : 10)

    // Section label
    this.add.text(width / 2, topY, '── Choose Your Hero ──', {
      fontFamily: 'monospace',
      fontSize: compact ? '10px' : '13px',
      color: '#666688',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0)

    // Create idle animations
    for (const hero of HEROES) {
      const animKey = `lobby_idle_${hero.type}`
      if (!this.anims.exists(animKey)) {
        const texKey = this._texKey(hero.asset)
        if (this.textures.exists(texKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: hero.frames - 1 }),
            frameRate: 8,
            repeat: -1,
          })
        }
      }
    }

    HEROES.forEach((hero, i) => {
      const cx = startX + i * (R * 2 + gap)
      const colorHex = `#${hero.color.toString(16).padStart(6, '0')}`

      // Circle bg
      const g = this.add.graphics()
      this.heroCircleGraphics.push(g)
      this._drawHeroCircle(g, cx, cy, R, hero.color, false)

      // Sprite inside circle
      const texKey = this._texKey(hero.asset)
      const spriteY = cy + (hero.yOff || 0)
      if (this.textures.exists(texKey)) {
        const sprite = this.add.sprite(cx, spriteY, texKey, 0).setScale(hero.scale).setDepth(1)
        const maskShape = this.make.graphics({ x: 0, y: 0 })
        maskShape.fillStyle(0xffffff)
        maskShape.fillCircle(cx, cy, R - 2)
        sprite.setMask(maskShape.createGeometryMask())
        const animKey = `lobby_idle_${hero.type}`
        if (this.anims.exists(animKey)) sprite.play(animKey)
      }

      // Name below circle
      this.add.text(cx, cy + R + (compact ? 6 : 8), hero.name, {
        fontFamily: 'monospace',
        fontSize: compact ? '8px' : '10px',
        color: colorHex,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      // Interactive zone
      const zone = this.add.zone(cx, cy, R * 2 + 4, R * 2 + 4).setInteractive({ useHandCursor: true })

      zone.on('pointerover', () => {
        if (this.heroCircleSelectedIndex !== i) {
          this._drawHeroCircle(g, cx, cy, R, hero.color, true)
        }
      })
      zone.on('pointerout', () => {
        if (this.heroCircleSelectedIndex !== i) {
          this._drawHeroCircle(g, cx, cy, R, hero.color, false)
        }
      })
      zone.on('pointerdown', () => {
        this._selectHero(i, hero)
      })
    })
  }

  private _selectHero(index: number, hero: HeroDef) {
    const prev = this.heroCircleSelectedIndex

    // Deselect previous circle
    if (prev >= 0 && prev !== index) {
      const ph = HEROES[prev]
      const R = this._circleR()
      const gap = this._circleGap()
      const startX = this._circleStartX(R, gap)
      const prevCx = startX + prev * (R * 2 + gap)
      const prevCy = this._circleRowY(R)
      this._drawHeroCircle(this.heroCircleGraphics[prev], prevCx, prevCy, R, ph.color, false)
    }

    this.heroCircleSelectedIndex = index
    const R = this._circleR()
    const gap = this._circleGap()
    const startX = this._circleStartX(R, gap)
    const cx = startX + index * (R * 2 + gap)
    const cy = this._circleRowY(R)
    this._drawHeroCircle(this.heroCircleGraphics[index], cx, cy, R, hero.color, true)

    this.selectedHero = hero.type
    this._updateSlot1(hero)
    this._setStartEnabled(true)
  }

  // ── Slot 1 update ────────────────────────────────────────────────────────────

  private _updateSlot1(hero: HeroDef) {
    const compact = this.scale.height < 500
    const slotW = compact ? 90 : 120
    const slotH = compact ? 110 : 140
    const slotGap = compact ? 10 : 16
    const totalSlotsW = 4 * slotW + 3 * slotGap
    const slotStartX = this.scale.width / 2 - totalSlotsW / 2
    const slotTopY = compact ? 46 : 60

    const sx = slotStartX
    const sy = slotTopY
    const cx = sx + slotW / 2
    const spriteY = sy + slotH / 2 + (compact ? 4 : 6)

    // Destroy previous placeholder/sprite in slot 1
    const prev = this.slotHeroSprites[0]
    if (prev) { prev.destroy(); this.slotHeroSprites[0] = null }

    const texKey = this._texKey(hero.asset)
    if (this.textures.exists(texKey)) {
      const scale = hero.scale * (compact ? 0.9 : 1.1)
      const sprite = this.add.sprite(cx, spriteY + (hero.yOff || 0), texKey, 0)
        .setScale(scale).setDepth(2)
      const animKey = `lobby_idle_${hero.type}`
      if (this.anims.exists(animKey)) sprite.play(animKey)
      this.slotHeroSprites[0] = sprite
    }

    // Update hero name text under player name
    const heroNameY = sy + slotH - (compact ? 26 : 34)
    if (this.slotHeroNameTexts[0]) {
      // Find or create hero sub-label — we just update/create a text
      // (simpler than storing a ref from buildSlots)
    }
    // Add hero label above player name area
    const colorHex = `#${hero.color.toString(16).padStart(6, '0')}`
    const heroLabel = this.add.text(cx, heroNameY, hero.name, {
      fontFamily: 'monospace',
      fontSize: compact ? '8px' : '10px',
      color: colorHex,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3)
    // Store so next selection clears it
    ;(this as any).__slot1HeroLabel?.destroy()
    ;(this as any).__slot1HeroLabel = heroLabel
  }

  // ── Buttons ──────────────────────────────────────────────────────────────────

  private buildButtons(centerY: number, compact: boolean) {
    const { width } = this.scale
    const btnW = compact ? 90 : 120
    const btnH = compact ? 26 : 36
    const gap = compact ? 14 : 20
    const totalW = btnW * 2 + gap
    const leftX = width / 2 - totalW / 2
    const rightX = width / 2 + gap / 2

    // START button (disabled until hero selected)
    this.startBtn = this.add.graphics()
    this._drawBtn(this.startBtn, leftX, centerY - btnH / 2, btnW, btnH, false)

    this.startBtnText = this.add.text(leftX + btnW / 2, centerY, 'START', {
      fontFamily: 'monospace',
      fontSize: compact ? '12px' : '16px',
      color: '#555555',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1)

    const startZone = this.add.zone(leftX + btnW / 2, centerY, btnW, btnH).setInteractive({ useHandCursor: false })
    startZone.on('pointerover', () => {
      if (!this.startBtnEnabled) return
      this._drawBtn(this.startBtn, leftX, centerY - btnH / 2, btnW, btnH, true, true)
    })
    startZone.on('pointerout', () => {
      if (!this.startBtnEnabled) return
      this._drawBtn(this.startBtn, leftX, centerY - btnH / 2, btnW, btnH, true, false)
    })
    startZone.on('pointerdown', () => {
      if (!this.startBtnEnabled || !this.selectedHero) return
      this.cameras.main.flash(200, 255, 255, 255, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) {
          this.scene.start('LoadingScene', {
            hero: this.selectedHero,
            map: 'GameScene',
            playerName: this.playerName,
          })
        }
      })
    })

    // LEAVE button
    const leaveBtn = this.add.graphics()
    this._drawLeaveBtn(leaveBtn, rightX, centerY - btnH / 2, btnW, btnH, false)

    const leaveTxt = this.add.text(rightX + btnW / 2, centerY, 'LEAVE', {
      fontFamily: 'monospace',
      fontSize: compact ? '12px' : '16px',
      color: '#cc4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1)

    const leaveZone = this.add.zone(rightX + btnW / 2, centerY, btnW, btnH).setInteractive({ useHandCursor: true })
    leaveZone.on('pointerover', () => {
      this._drawLeaveBtn(leaveBtn, rightX, centerY - btnH / 2, btnW, btnH, true)
      leaveTxt.setColor('#ff6666')
    })
    leaveZone.on('pointerout', () => {
      this._drawLeaveBtn(leaveBtn, rightX, centerY - btnH / 2, btnW, btnH, false)
      leaveTxt.setColor('#cc4444')
    })
    leaveZone.on('pointerdown', () => this.leave())
  }

  private _setStartEnabled(enabled: boolean) {
    this.startBtnEnabled = enabled
    const compact = this.scale.height < 500
    const btnW = compact ? 90 : 120
    const btnH = compact ? 26 : 36
    const gap = compact ? 14 : 20
    const totalW = btnW * 2 + gap
    const leftX = this.scale.width / 2 - totalW / 2
    const centerY = this.scale.height - (compact ? 30 : 44)
    this._drawBtn(this.startBtn, leftX, centerY - btnH / 2, btnW, btnH, enabled, false)
    this.startBtnText.setColor(enabled ? '#ffffff' : '#555555')
  }

  private _drawBtn(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    enabled: boolean,
    hovered = false,
  ) {
    g.clear()
    if (!enabled) {
      g.fillStyle(0x1a1a2e, 1)
      g.fillRoundedRect(x, y, w, h, 6)
      g.lineStyle(1, 0x333344, 0.6)
      g.strokeRoundedRect(x, y, w, h, 6)
    } else if (hovered) {
      g.fillStyle(0x228833, 1)
      g.fillRoundedRect(x, y, w, h, 6)
      g.lineStyle(2, 0x55ff88, 0.9)
      g.strokeRoundedRect(x, y, w, h, 6)
    } else {
      g.fillStyle(0x1a3322, 1)
      g.fillRoundedRect(x, y, w, h, 6)
      g.lineStyle(2, 0x44aa66, 0.8)
      g.strokeRoundedRect(x, y, w, h, 6)
    }
  }

  private _drawLeaveBtn(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    hovered: boolean,
  ) {
    g.clear()
    g.fillStyle(hovered ? 0x3a1111 : 0x1e1010, 1)
    g.fillRoundedRect(x, y, w, h, 6)
    g.lineStyle(1, hovered ? 0xaa3333 : 0x663333, 0.8)
    g.strokeRoundedRect(x, y, w, h, 6)
  }

  // ── Hero circle helpers ──────────────────────────────────────────────────────

  private _drawHeroCircle(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, r: number,
    color: number, highlighted: boolean,
  ) {
    g.clear()
    if (highlighted) {
      g.fillStyle(color, 0.15)
      g.fillCircle(cx, cy, r + 6)
    }
    g.fillStyle(highlighted ? 0x222244 : 0x111122)
    g.fillCircle(cx, cy, r)
    g.lineStyle(highlighted ? 3 : 2, color, highlighted ? 1.0 : 0.5)
    g.strokeCircle(cx, cy, r)
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  private leave() {
    this.cameras.main.fadeOut(200)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('StartScene', { playerName: this.playerName })
    })
  }

  // ── Layout helpers (called from _selectHero which runs after create) ─────────

  private _circleR(): number { return this.scale.height < 500 ? 26 : 34 }
  private _circleGap(): number { return this.scale.height < 500 ? 10 : 14 }
  private _circleStartX(R: number, gap: number): number {
    const totalW = HEROES.length * (R * 2) + (HEROES.length - 1) * gap
    return this.scale.width / 2 - totalW / 2 + R
  }
  private _circleRowY(R: number): number {
    const compact = this.scale.height < 500
    const slotH = compact ? 110 : 140
    const slotTopY = compact ? 46 : 60
    const heroSectionY = slotTopY + slotH + (compact ? 14 : 22)
    return heroSectionY + R + (compact ? 8 : 10)
  }

  private _texKey(asset: string): string {
    return asset.replace(/[^a-z0-9]/gi, '_')
  }
}
