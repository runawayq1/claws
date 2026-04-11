import Phaser from 'phaser'
import { type HeroType } from '../entities/Player'
import { addDiagonalBg } from '../utils/bgScroll'
import { networkManager } from '../systems/NetworkManager'
import { gameFont } from '../utils/device'

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
  private _slots: LobbySlot[] = []
  get slots(): LobbySlot[] { return this._slots }
  private selectedHero: HeroType | null = null
  private playerName = ''
  private isOnline = false
  private takenHeroes = new Set<string>()

  // UI refs
  private slotContainers: Phaser.GameObjects.Container[] = []
  private heroCircleGraphics: Phaser.GameObjects.Graphics[] = []
  private heroCircleSelectedIndex = -1
  private heroDimOverlays: (Phaser.GameObjects.Text | null)[] = []
  private startBtn!: Phaser.GameObjects.Graphics
  private startBtnText!: Phaser.GameObjects.Text
  private startBtnEnabled = false
  private statusText!: Phaser.GameObjects.Text

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

  create(data?: { playerName?: string; online?: boolean }) {
    this.cameras.main.fadeIn(200)
    const { width, height } = this.scale

    this.playerName = data?.playerName
      || localStorage.getItem('claws_player_name')
      || 'Player'
    this.isOnline = data?.online ?? false

    this.selectedHero = null
    this.startBtnEnabled = false
    this.heroCircleSelectedIndex = -1
    this.heroCircleGraphics = []
    this.heroDimOverlays = HEROES.map(() => null)
    this.slotContainers = []
    this.takenHeroes.clear()

    // Init local slot data
    this._slots = [
      { playerId: networkManager.sessionId || 'local', playerName: this.playerName, heroType: null, isLocal: true, isHost: networkManager.isHost },
      { playerId: '', playerName: '', heroType: null, isLocal: false, isHost: false },
      { playerId: '', playerName: '', heroType: null, isLocal: false, isHost: false },
      { playerId: '', playerName: '', heroType: null, isLocal: false, isHost: false },
    ]

    this.cameras.main.setBackgroundColor(0x0d0d1a)
    addDiagonalBg(this)

    const compact = height < 500

    // ── Title ──────────────────────────────────────────────────────────────────
    const lobbyTitle = this.add.text(width / 2, compact ? 18 : 28, 'QUICK PLAY', {
      fontFamily: gameFont(),
      fontSize: compact ? '22px' : '32px',
      color: '#FFD700',
    }).setOrigin(0.5)
    lobbyTitle.setShadow(0, 1, '#000000', 2, true, true)

    // ── Status text (player count, waiting) ────────────────────────────────────
    this.statusText = this.add.text(width / 2, compact ? 36 : 52, this.isOnline ? 'Connected — waiting for players...' : 'Offline mode', {
      fontFamily: gameFont(),
      fontSize: compact ? '11px' : '10px',
      color: '#666688',
    }).setOrigin(0.5)

    // ── Player Slots ───────────────────────────────────────────────────────────
    const slotW = compact ? 90 : 120
    const slotH = compact ? 110 : 140
    const slotGap = compact ? 10 : 16
    const totalSlotsW = 4 * slotW + 3 * slotGap
    const slotStartX = width / 2 - totalSlotsW / 2
    const slotY = compact ? 50 : 68

    this.buildSlots(slotStartX, slotY, slotW, slotH, slotGap, compact)

    // ── Hero Selection ─────────────────────────────────────────────────────────
    const heroSectionY = slotY + slotH + (compact ? 14 : 22)
    this.buildHeroGrid(heroSectionY, compact)

    // ── Buttons ────────────────────────────────────────────────────────────────
    const btnAreaY = height - (compact ? 30 : 44)
    this.buildButtons(btnAreaY, compact)

    // ── ESC = Leave ────────────────────────────────────────────────────────────
    this.input.keyboard?.on('keydown-ESC', () => this.leave())

    // ── Network callbacks ──────────────────────────────────────────────────────
    if (this.isOnline) {
      this.setupNetworkCallbacks()
      // Sync initial state from room
      this.syncFromRoomState()
    }
  }

  // ─── Network Integration ─────────────────────────────────────────────────────

  private setupNetworkCallbacks() {
    networkManager.setCallbacks({
      onPlayerJoined: (data) => {
        // Find empty slot
        const emptyIdx = this._slots.findIndex(s => !s.playerId || s.playerId === '')
        if (emptyIdx >= 0) {
          this._slots[emptyIdx] = {
            playerId: data.playerId,
            playerName: data.playerName,
            heroType: (data.heroType as HeroType) || null,
            isLocal: data.playerId === networkManager.sessionId,
            isHost: data.slot === 0,
          }
          this.refreshSlotUI(emptyIdx)
          this.updateStatusText()
        }
      },

      onPlayerLeft: (data) => {
        const idx = this._slots.findIndex(s => s.playerId === data.playerId)
        if (idx >= 0) {
          // Free up the hero they had
          if (this._slots[idx].heroType) {
            this.takenHeroes.delete(this._slots[idx].heroType!)
            this.refreshHeroDimming()
          }
          this._slots[idx] = { playerId: '', playerName: '', heroType: null, isLocal: false, isHost: false }
          this.refreshSlotUI(idx)
          this.updateStatusText()
        }
      },

      onHeroTaken: (data) => {
        // Server rejected our hero choice
        this.statusText.setText(`${data.heroType} is already taken!`)
        this.statusText.setColor('#ff4444')
        this.time.delayedCall(2000, () => {
          this.updateStatusText()
          this.statusText.setColor('#666688')
        })
      },

      onGameStart: (data) => {
        // All players transition to game
        this.cameras.main.fadeOut(300)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('LoadingScene', {
            hero: this.selectedHero,
            map: 'GameScene',
            playerName: this.playerName,
            online: true,
            seed: data.seed,
            playerSlots: data.players,
          })
        })
      },

      onStateChange: () => {
        this.syncFromRoomState()
      },

      onLeave: () => {
        // Disconnected — return to start
        this.scene.start('StartScene', { playerName: this.playerName })
      },
    })
  }

  private syncFromRoomState() {
    const room = networkManager.currentRoom
    if (!room || !room.state) return

    const state = room.state as any
    if (!state.players) return

    // Reset taken heroes
    this.takenHeroes.clear()

    let slotIdx = 0
    state.players.forEach((p: any, _key: string) => {
      if (slotIdx >= 4) return
      this._slots[slotIdx] = {
        playerId: p.id,
        playerName: p.name,
        heroType: p.heroType || null,
        isLocal: p.id === networkManager.sessionId,
        isHost: slotIdx === 0,
      }
      if (p.heroType && p.id !== networkManager.sessionId) {
        this.takenHeroes.add(p.heroType)
      }
      this.refreshSlotUI(slotIdx)
      slotIdx++
    })

    // Clear remaining slots
    for (let i = slotIdx; i < 4; i++) {
      this._slots[i] = { playerId: '', playerName: '', heroType: null, isLocal: false, isHost: false }
      this.refreshSlotUI(i)
    }

    this.refreshHeroDimming()
    this.updateStatusText()
  }

  private updateStatusText() {
    const count = this._slots.filter(s => s.playerId && s.playerId !== '').length
    if (this.isOnline) {
      this.statusText.setText(`${count}/4 players — ${count >= 2 ? 'Ready to start!' : 'Waiting for players...'}`)
      this.statusText.setColor(count >= 2 ? '#44aa66' : '#666688')
    }
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
      const container = this.add.container(sx, sy)
      this.slotContainers.push(container)
      this.renderSlot(i, sx, sy, slotW, slotH, compact)
    }
  }

  private renderSlot(i: number, sx: number, sy: number, slotW: number, slotH: number, compact: boolean) {
    const container = this.slotContainers[i]
    if (!container) return
    // Clear previous children
    container.removeAll(true)
    container.setPosition(0, 0) // use absolute coords

    const slot = this._slots[i]
    const isOccupied = !!(slot.playerId && slot.playerId !== '')
    const isLocal = slot.isLocal
    const cx = sx + slotW / 2

    // Background
    const bg = this.add.graphics()
    bg.fillStyle(isLocal ? 0x1a1a3a : isOccupied ? 0x151528 : 0x111122, 1)
    bg.fillRoundedRect(sx, sy, slotW, slotH, 8)
    bg.lineStyle(isLocal ? 2 : 1, isLocal ? 0xffd700 : isOccupied ? 0x444466 : 0x333355, isLocal ? 0.8 : 0.5)
    bg.strokeRoundedRect(sx, sy, slotW, slotH, 8)
    container.add(bg)

    if (isOccupied) {
      // Badge (YOU / HOST / player index)
      const badgeY = sy + (compact ? 8 : 10)
      const badge = isLocal ? 'YOU' : slot.isHost ? 'HOST' : ''
      if (badge) {
        const badgeTxt = this.add.text(cx, badgeY, badge, {
          fontFamily: gameFont(),
          fontSize: compact ? '12px' : '11px',
          color: isLocal ? '#FFD700' : '#88aaff',
        }).setOrigin(0.5, 0)
        container.add(badgeTxt)
      }

      // Hero sprite or placeholder
      const spriteY = sy + slotH / 2 + (compact ? 4 : 6)
      if (slot.heroType) {
        const heroDef = HEROES.find(h => h.type === slot.heroType)
        if (heroDef) {
          const texKey = this._texKey(heroDef.asset)
          if (this.textures.exists(texKey)) {
            const scale = heroDef.scale * (compact ? 0.8 : 1.0)
            const sprite = this.add.sprite(cx, spriteY + (heroDef.yOff || 0), texKey, 0)
              .setScale(scale).setDepth(2)
            const animKey = `lobby_idle_${heroDef.type}`
            if (this.anims.exists(animKey)) sprite.play(animKey)
            container.add(sprite)
          }

          // Hero name
          const heroNameY = sy + slotH - (compact ? 26 : 34)
          const colorHex = `#${heroDef.color.toString(16).padStart(6, '0')}`
          const heroLabel = this.add.text(cx, heroNameY, heroDef.name, {
            fontFamily: gameFont(),
            fontSize: compact ? '11px' : '10px',
            color: colorHex,
          }).setOrigin(0.5).setDepth(3)
          container.add(heroLabel)
        }
      } else {
        const q = this.add.text(cx, spriteY, '?', {
          fontFamily: gameFont(),
          fontSize: compact ? '20px' : '28px',
          color: '#444466',
        }).setOrigin(0.5)
        container.add(q)
      }

      // Player name
      const nameY = sy + slotH - (compact ? 14 : 18)
      const nameTxt = this.add.text(cx, nameY, slot.playerName, {
        fontFamily: gameFont(),
        fontSize: compact ? '12px' : '11px',
        color: '#ffffff',
      }).setOrigin(0.5)
      container.add(nameTxt)
    } else {
      // Empty slot
      const midY = sy + slotH / 2
      const dots = this.add.text(cx, midY - (compact ? 6 : 8), '· · ·', {
        fontFamily: gameFont(),
        fontSize: compact ? '12px' : '16px',
        color: '#333355',
      }).setOrigin(0.5)
      const waitTxt = this.add.text(cx, midY + (compact ? 8 : 12), 'Waiting...', {
        fontFamily: gameFont(),
        fontSize: compact ? '11px' : '10px',
        color: '#333355',
      }).setOrigin(0.5)
      container.add([dots, waitTxt])
    }
  }

  private refreshSlotUI(index: number) {
    if (index < 0 || index >= 4) return
    const compact = this.scale.height < 500
    const slotW = compact ? 90 : 120
    const slotH = compact ? 110 : 140
    const slotGap = compact ? 10 : 16
    const totalSlotsW = 4 * slotW + 3 * slotGap
    const slotStartX = this.scale.width / 2 - totalSlotsW / 2
    const slotY = compact ? 50 : 68
    const sx = slotStartX + index * (slotW + slotGap)
    this.renderSlot(index, sx, slotY, slotW, slotH, compact)
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
      fontFamily: gameFont(),
      fontSize: compact ? '13px' : '13px',
      color: '#666688',
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
        fontFamily: gameFont(),
        fontSize: compact ? '11px' : '10px',
        color: colorHex,
      }).setOrigin(0.5)

      // "Taken" overlay (hidden by default)
      const dimOverlay = this.add.text(cx, cy, 'TAKEN', {
        fontFamily: gameFont(),
        fontSize: compact ? '11px' : '10px',
        color: '#ff4444',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(10).setVisible(false)
      this.heroDimOverlays[i] = dimOverlay

      // Interactive zone
      const zone = this.add.zone(cx, cy, R * 2 + 4, R * 2 + 4).setInteractive({ useHandCursor: true })

      zone.on('pointerover', () => {
        if (this.takenHeroes.has(hero.type)) return
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
        if (this.takenHeroes.has(hero.type)) return
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

    // Update local slot
    const localSlotIdx = this._slots.findIndex(s => s.isLocal)
    if (localSlotIdx >= 0) {
      this._slots[localSlotIdx].heroType = hero.type
      this.refreshSlotUI(localSlotIdx)
    }

    // Send to server
    if (this.isOnline) {
      networkManager.selectHero(hero.type)
    }

    this._setStartEnabled(true)
  }

  private refreshHeroDimming() {
    HEROES.forEach((hero, i) => {
      const overlay = this.heroDimOverlays[i]
      if (!overlay) return
      if (this.takenHeroes.has(hero.type)) {
        overlay.setVisible(true)
        // Dim the circle
        const R = this._circleR()
        const gap = this._circleGap()
        const startX = this._circleStartX(R, gap)
        const cx = startX + i * (R * 2 + gap)
        const cy = this._circleRowY(R)
        this.heroCircleGraphics[i]?.clear()
        this.heroCircleGraphics[i]?.fillStyle(0x111122, 0.7)
        this.heroCircleGraphics[i]?.fillCircle(cx, cy, R)
        this.heroCircleGraphics[i]?.lineStyle(2, 0x333344, 0.3)
        this.heroCircleGraphics[i]?.strokeCircle(cx, cy, R)
      } else {
        overlay.setVisible(false)
        // Restore normal circle
        const R = this._circleR()
        const gap = this._circleGap()
        const startX = this._circleStartX(R, gap)
        const cx = startX + i * (R * 2 + gap)
        const cy = this._circleRowY(R)
        const isSelected = this.heroCircleSelectedIndex === i
        this._drawHeroCircle(this.heroCircleGraphics[i], cx, cy, R, hero.color, isSelected)
      }
    })
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
      fontFamily: gameFont(),
      fontSize: compact ? '12px' : '16px',
      color: '#555555',
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

      if (this.isOnline) {
        // Host sends start to server
        if (networkManager.isHost) {
          networkManager.startGame()
        }
        // Non-host: button shows "Waiting for host..."
        return
      }

      // Offline: go directly to game
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
      fontFamily: gameFont(),
      fontSize: compact ? '12px' : '16px',
      color: '#cc4444',
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

    if (this.isOnline && !networkManager.isHost) {
      this.startBtnText.setText('WAITING...')
      this.startBtnText.setColor('#666688')
    } else {
      this.startBtnText.setText('START')
      this.startBtnText.setColor(enabled ? '#ffffff' : '#555555')
    }
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
    if (this.isOnline) {
      networkManager.leave()
    }
    this.cameras.main.fadeOut(200)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('StartScene', { playerName: this.playerName })
    })
  }

  // ── Layout helpers ──────────────────────────────────────────────────────────

  private _circleR(): number { return this.scale.height < 500 ? 26 : 34 }
  private _circleGap(): number { return this.scale.height < 500 ? 10 : 14 }
  private _circleStartX(R: number, gap: number): number {
    const totalW = HEROES.length * (R * 2) + (HEROES.length - 1) * gap
    return this.scale.width / 2 - totalW / 2 + R
  }
  private _circleRowY(R: number): number {
    const compact = this.scale.height < 500
    const slotH = compact ? 110 : 140
    const slotTopY = compact ? 50 : 68
    const heroSectionY = slotTopY + slotH + (compact ? 14 : 22)
    return heroSectionY + R + (compact ? 8 : 10)
  }

  private _texKey(asset: string): string {
    return asset.replace(/[^a-z0-9]/gi, '_')
  }
}
