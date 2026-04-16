import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { GameScene } from './GameScene'
import { GENERIC_POOL, HERO_BRANCHES, getIconFrame } from '../systems/UpgradeSystem'
import { MetaProgress, META_UPGRADES, RUN1_QUESTS, type SessionRecord, type QuestDef } from '../systems/MetaProgress'
import { SessionLogger } from '../systems/SessionLogger'
import { supabase } from '../systems/SupabaseClient'
import { Player } from '../entities/Player'
import { shouldShowHint } from '../systems/HintFlags'
import { isMobileUserAgent, isPortrait, gameFont } from '../utils/device'

const HERO_DISPLAY_NAMES: Record<string, string> = {
  huntress: 'Lyra', muller: 'Givi', ignara: 'Ignara',
  sifra: 'Sifra', amun: 'Amun', nazar: 'Nazar', khashin: 'Khashin',
  vael: 'Vael',
}

const HERO_COLORS: Record<string, number> = {
  huntress: 0x2ecc71, muller: 0x44aaff, ignara: 0xe84118,
  sifra: 0x82ccdd, amun: 0xfff200, nazar: 0xc23616, khashin: 0x88ddff,
  vael: 0x8866cc,
}

// Per-branch mastery accent colors. Used by the HUD mastery diamonds and by
// the side panel mastery strip. Shared here so the two drawing paths never
// drift out of sync.
const BRANCH_COLOR: Record<string, number> = {
  ice: 0x55aaff, lightning: 0x9966ff,
  sword: 0xcc4444, venom: 0x44cc44,
  melee: 0xe67e22, spear: 0x2ecc71,
  wind: 0x88ddff, sand: 0xddaa44,
  ground: 0xddaa22, quake: 0xff8833,
  fireball: 0xff6600, crystal: 0x44aaff,
  combat: 0xaaaaaa,
}

// Branch pairs per hero for HUD mastery-diamond rendering. Named differently
// from UpgradeSystem.HERO_BRANCHES so it doesn't shadow the import.
const HUD_HERO_BRANCHES: Record<string, string[]> = {
  sifra: ['ice', 'lightning'], nazar: ['sword', 'venom'],
  huntress: ['melee', 'spear'], khashin: ['wind', 'sand'],
  ignara: ['fireball'], muller: ['crystal'],
  nightborne: ['void'], vael: ['orbs', 'drain'],
}

const KILL_MILESTONES: [number, string][] = [
  [50, '50 KILLS'], [100, 'CENTURION'], [250, 'SLAUGHTER'], [500, 'MASSACRE'], [1000, 'GENOCIDE'],
]

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene
  private hud!: Phaser.GameObjects.Graphics
  private _xpShimmerGfx!: Phaser.GameObjects.Graphics
  private hpText!: Phaser.GameObjects.Text
  private lvlText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private tierText!: Phaser.GameObjects.Text
  private announcement!: Phaser.GameObjects.Text
  private overlay!: Phaser.GameObjects.Graphics
  private minimap!: Phaser.GameObjects.Graphics
  private mmMaskShape!: Phaser.GameObjects.Graphics
  private endTexts: Phaser.GameObjects.Text[] = []
  private endScreenShown = false
  private isPaused = false
  private pauseTab: 'stats' | 'inventory' = 'stats'
  private pauseOverlay!: Phaser.GameObjects.Graphics
  private pauseTexts: Phaser.GameObjects.Text[] = []
  private pauseTabObjs: Phaser.GameObjects.GameObject[] = []
  private pauseBtn: Phaser.GameObjects.Text | null = null
  private stanceBtn: Phaser.GameObjects.Text | null = null
  private stanceIcon: Phaser.GameObjects.Graphics | null = null
  private mobileStanceBtn: Phaser.GameObjects.Zone | null = null
  private mobileStanceLbl: Phaser.GameObjects.Text | null = null
  private mobileStancePill: Phaser.GameObjects.Graphics | null = null
  private isMobile = false
  private vignetteGfx!: Phaser.GameObjects.Graphics

  // Dirty-flag tracking — cached values from last HUD redraw
  private _lastHp = -1
  private _lastMaxHp = -1
  private _lastXp = -1
  private _lastXpMax = -1
  private _lastLevel = -1
  private _lastEnergy1 = -1  // hero energy bar 1 (ice/sword/melee/wind)
  private _lastEnergy2 = -1  // hero energy bar 2 (lightning/venom/spear/sand)
  private _lastFlashpointRemaining = -1
  private _lastPhoenixHeart = false
  private _lastFirestormOrbCount = -1
  private _bigBuffObjs: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = []
  private _lastKills = -1
  private _lastGold = -1
  // Integer-second buckets. These used to share a single field which was buggy:
  // curTimeSec counts remaining seconds (countdown), curTimeSecForQuest counts
  // elapsed seconds — sharing the same cache made quest time tracking fire
  // spuriously every frame.
  private _lastRemainingSec = -1
  private _lastElapsedSec = -1
  private _critFlashUntil = 0   // timestamp — HP bar white flash on damage
  private _critPulse = 0        // continuous pulse counter at low HP
  private _hpFlashUntil = 0     // timestamp — glass shimmer flash on HP decrease
  private _mmMaskDirty = true
  private _isPortrait = false
  private _masteryLabel: Phaser.GameObjects.Text | null = null
  private _tookDamageThisRun = false  // tracks if player received any damage this run
  private goldText!: Phaser.GameObjects.Text
  private goldIcon!: Phaser.GameObjects.Image

  // ── Quest HUD ─────────────────────────────────────────────────
  private _questPanel: Phaser.GameObjects.Container | null = null
  // IDs of quests currently rendered in the panel — if the set matches on a
  // refresh call we update the Text/Graphics objects in place instead of
  // destroying/recreating the whole container each second.
  private _questPanelIds: string[] = []
  // Per-row display objects, indexed by quest order. Kept parallel to
  // _questPanelIds so we can setText() in place.
  private _questTitleTexts: Phaser.GameObjects.Text[] = []
  private _questProgressTexts: Phaser.GameObjects.Text[] = []
  private _questProgressBars: Phaser.GameObjects.Graphics[] = []
  private _questProgressBarGeom: { barX: number; barY: number; barW: number; barH: number }[] = []
  // Track which quest IDs have already been toasted this run
  private _toastedQuests: Set<string> = new Set()
  private _sifraMarkerSince = 0  // ms timestamp when Sifra marker first appeared on minimap
  private _tutorialComplete = false  // cached from MetaProgress — avoids JSON.parse in drawMinimap
  private _vignetteWasVisible = false

  // ── Boss HP bar ────────────────────────────────────────────────
  private _bossBarGfx: Phaser.GameObjects.Graphics | null = null
  private _bossBarBg: Phaser.GameObjects.Graphics | null = null
  private _bossNameText: Phaser.GameObjects.Text | null = null
  private _bossPhaseText: Phaser.GameObjects.Text | null = null
  private _bossHp = 0
  private _bossMaxHp = 0
  private _bossBarVisible = false

  constructor() {
    super({ key: 'UIScene' })
  }

  create(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene || (this.scene.get('GameScene') as GameScene)
    this._tookDamageThisRun = false  // reset at start of each run
    // Pre-populate toasted set from persistent completions so already-done quests
    // don't show toasts or trigger the bonus picker on subsequent runs.
    const _metaAtStart = MetaProgress.load()
    this._toastedQuests = new Set(_metaAtStart.completedQuests)
    this._tutorialComplete = _metaAtStart.tutorialComplete
    this._sifraMarkerSince = 0       // reset Sifra minimap pulse anchor
    // Reset cached game objects — they are destroyed when UIScene stops, and must
    // not be reused across runs (stale refs cause setColor/drawImage crash on restart)
    this._masteryLabel = null
    this._bigBuffObjs = []
    this.pauseTexts = []
    this.pauseTabObjs = []
    this.pauseBtn = null
    this.stanceBtn = null
    this.stanceIcon = null
    this.mobileStanceBtn = null
    this.mobileStanceLbl = null
    this.mobileStancePill = null
    this._questPanelIds = []
    this._questTitleTexts = []
    this._questProgressTexts = []
    this._questProgressBars = []
    this.endScreenShown = false
    this.isMobile = isMobileUserAgent()
    this._isPortrait = isPortrait()

    // Slight UI scale-down on mobile so elements don't crowd the edges
    if (this.isMobile) {
      this.cameras.main.setZoom(0.92)
    }

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: gameFont(),
      fontSize: '13px',
      color: '#ffffff',
    }

    // Main HUD graphics layer
    this.hud = this.add.graphics()
    // Separate Graphics for XP shimmer — avoids command accumulation on this.hud
    this._xpShimmerGfx = this.add.graphics().setDepth(11).setScrollFactor(0)

    // HP text (on bar)
    this.hpText = this.add.text(0, 0, '', {
      ...textStyle, fontSize: '14px',
    }).setDepth(3)

    // Level text (below bars)
    this.lvlText = this.add.text(0, 0, '', {
      ...textStyle, fontSize: '14px', color: '#66bbff',
    }).setDepth(2)

    // Kills (top-right) — with skull icon
    this.killText = this.add.text(0, 22, '', {
      ...textStyle,
      fontSize: this.isMobile ? '20px' : '14px',
      color: '#ff8888',
      fontStyle: this.isMobile ? 'bold' : 'normal',
    }).setDepth(2)

    // Difficulty tier (top-right under kills)
    this.tierText = this.add.text(0, 40, '', {
      ...textStyle,
      fontSize: this.isMobile ? '16px' : '11px',
      color: '#ffaa44',
      fontStyle: this.isMobile ? 'bold' : 'normal',
    }).setDepth(2)

    // Gold counter (top-right under tier) with coin icon
    if (!this.textures.exists('hud_coin')) {
      const gc = this.add.graphics()
      gc.fillStyle(0xffd700)
      gc.fillCircle(7, 7, 7)
      gc.fillStyle(0xffee88)
      gc.fillCircle(6, 5, 3)
      gc.lineStyle(1, 0xbb9900)
      gc.strokeCircle(7, 7, 7)
      gc.generateTexture('hud_coin', 14, 14)
      gc.destroy()
    }
    this.goldIcon = this.add.image(0, 60, 'hud_coin').setDepth(2)
    this.goldText = this.add.text(0, 56, '', {
      ...textStyle,
      fontSize: this.isMobile ? '20px' : '13px',
      color: '#FFD700',
      fontStyle: this.isMobile ? 'bold' : 'normal',
    }).setDepth(2)

    // Countdown timer (top-center)
    this.timerText = this.add.text(0, this.isMobile ? 52 : 38, '', {
      fontFamily: gameFont(),
      fontSize: this.isMobile ? '30px' : '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setDepth(2)

    // Top-area announcement (kill milestones, claws warning)
    this.announcement = this.add.text(0, 0, '', {
      fontFamily: gameFont(),
      fontSize: '20px',
      color: '#FFD700',
    }).setOrigin(0.5).setAlpha(0).setDepth(20)
    this.announcement.setShadow(0, 1, '#000000', 2, true, true)

    // Minimap with clip mask
    this.minimap = this.add.graphics().setDepth(2)
    const portrait = this.isMobile && this._isPortrait
    const mmSize = portrait ? 90 : CONFIG.MINIMAP_SIZE
    const mmMargin = CONFIG.MINIMAP_MARGIN
    const mmX = this.scale.width - mmSize - mmMargin - 4
    const mmY = mmMargin + 76
    this.mmMaskShape = this.make.graphics({ x: 0, y: 0 })
    this.mmMaskShape.fillStyle(0xffffff)
    this.mmMaskShape.fillRect(mmX, mmY, mmSize, mmSize)
    this.minimap.setMask(this.mmMaskShape.createGeometryMask())

    // Spacebar pause/resume (desktop)
    if (this.input.keyboard) {
      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      spaceKey.on('down', () => this.togglePause())
      // ESC only unpauses (does not pause) to avoid conflicting with other ESC bindings
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      escKey.on('down', () => { if (this.isPaused) this.togglePause() })
    }

    // Pause overlay
    this.pauseOverlay = this.add.graphics()
    this.pauseOverlay.setAlpha(0).setDepth(28)
    this.isPaused = false

    // Overlay for game over
    this.overlay = this.add.graphics()
    this.overlay.setAlpha(0).setDepth(30)
    this.endScreenShown = false

    // Low HP vignette (red pulse around screen edges at <20% HP)
    // Depth 27: above HUD (2-5) but below pause overlay (28) and end screen (30)
    this.vignetteGfx = this.add.graphics()
    this.vignetteGfx.setDepth(27).setScrollFactor(0)

    // ── Controls hint (first launch) ──
    this.showControlsHint()

    // Stance toggle for Sifra
    if (this.gameScene.localPlayer.heroType === 'sifra') {
      this.stanceIcon = this.add.graphics().setDepth(3)
      this.stanceBtn = this.add.text(0, 0, '', {
        fontFamily: gameFont(), fontSize: '11px', color: '#88ddff',
      }).setOrigin(0, 0.5).setInteractive().setDepth(3)
      this.stanceBtn.on('pointerdown', () => {
        this.gameScene.localPlayer.toggleStance()
      })
      this.stanceBtn.on('pointerover', () => this.stanceBtn?.setColor('#ffffff'))
      this.stanceBtn.on('pointerout', () => this.updateStanceBtn())
      // Listen for stance changes
      this.gameScene.events.on('stance-changed', () => this.updateStanceBtn())
      this.updateStanceBtn()
    }

    // Stance toggle for Nazar (Samurai)
    if (this.gameScene.localPlayer.heroType === 'nazar') {
      this.stanceIcon = this.add.graphics().setDepth(3)
      this.stanceBtn = this.add.text(0, 0, '', {
        fontFamily: gameFont(), fontSize: '11px', color: '#ff6644',
      }).setOrigin(0, 0.5).setInteractive().setDepth(3)
      this.stanceBtn.on('pointerdown', () => {
        this.gameScene.localPlayer.toggleNazarStance()
      })
      this.stanceBtn.on('pointerover', () => this.stanceBtn?.setColor('#ffffff'))
      this.stanceBtn.on('pointerout', () => this.updateNazarStanceBtn())
      this.gameScene.events.on('nazar-stance-changed', () => this.updateNazarStanceBtn())
      this.updateNazarStanceBtn()
    }

    // Stance toggle for Huntress
    if (this.gameScene.localPlayer.heroType === 'huntress') {
      this.stanceIcon = this.add.graphics().setDepth(3)
      this.stanceBtn = this.add.text(0, 0, '', {
        fontFamily: gameFont(), fontSize: '11px', color: '#2ecc71',
      }).setOrigin(0, 0.5).setInteractive().setDepth(3)
      this.stanceBtn.on('pointerdown', () => {
        this.gameScene.localPlayer.toggleHuntressStance()
      })
      this.stanceBtn.on('pointerover', () => this.stanceBtn?.setColor('#ffffff'))
      this.stanceBtn.on('pointerout', () => this.updateHuntressStanceBtn())
      this.gameScene.events.on('huntress-stance-changed', () => this.updateHuntressStanceBtn())
      this.updateHuntressStanceBtn()
    }

    // Mobile stance toggle button (big, right side)
    const isMob = isMobileUserAgent()
    const p = this.gameScene.localPlayer
    const hasStance = p.heroType === 'sifra' || p.heroType === 'nazar' || p.heroType === 'huntress' || p.heroType === 'khashin' || (p.heroType === 'amun' && p.hasQuakeStance) || p.heroType === 'vael'
    if (isMob && hasStance) {
      const { width, height } = this.scale
      // Right half of screen = stance tap zone
      const zoneH = height - 200
      const zone = this.add.zone(width * 0.75, 200 + zoneH / 2, width / 2, zoneH)
        .setInteractive().setDepth(5)
      this.mobileStanceBtn = zone
      zone.on('pointerdown', () => {
        if (p.heroType === 'sifra') p.toggleStance()
        else if (p.heroType === 'nazar') p.toggleNazarStance()
        else if (p.heroType === 'huntress') p.toggleHuntressStance()
        else if (p.heroType === 'khashin') p.toggleKhashinStance()
        else if (p.heroType === 'amun') p.toggleAmunStance()
        else if (p.heroType === 'vael') p.toggleVaelStance()
        this.updateMobileStanceBtn()
      })
      // Pill background behind stance label (bottom-right)
      const pill = this.add.graphics().setDepth(20)
      this.mobileStancePill = pill
      // Small stance indicator label (bottom-right)
      const lbl = this.add.text(width - 12, height - 12, '', {
        fontFamily: gameFont(), fontSize: '18px', color: '#ffffff',
        align: 'center',
      }).setOrigin(1, 1).setDepth(21).setAlpha(0.8)
      this.mobileStanceLbl = lbl
      this.gameScene.events.on('stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('nazar-stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('huntress-stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('khashin-stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('amun-stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('vael-stance-changed', () => this.updateMobileStanceBtn())
      this.updateMobileStanceBtn()

      // TAP hint on first game — fades out after 2s
      if (shouldShowHint('mobile_stance_tap')) {
        const tapHint = this.add.text(width - 52, height - 50, 'TAP', {
          fontFamily: gameFont(), fontSize: '13px', color: '#aaaaaa',
        }).setOrigin(0.5).setDepth(22).setAlpha(0.6)
        this.time.delayedCall(1500, () => {
          this.tweens.add({ targets: tapHint, alpha: 0, duration: 800, onComplete: () => tapHint.destroy() })
        })
      }
    }

    // Mobile pause button (top-left, below the HUD bars) — hidden in online mode
    if (this.isMobile && !(this.gameScene as any)._online) {
      const btnSize = 44
      const btnX = 6
      const btnY = 72

      const pauseG = this.add.graphics().setDepth(22).setScrollFactor(0)

      this.add.text(btnX + btnSize / 2, btnY + btnSize / 2, '❚❚', {
        fontFamily: gameFont(),
        fontSize: '16px',
        color: '#aabbcc',
      }).setOrigin(0.5).setDepth(23).setScrollFactor(0)

      // Draw button background
      pauseG.fillStyle(0x000000, 0.4)
      pauseG.fillRoundedRect(btnX, btnY, btnSize, btnSize, 8)
      pauseG.lineStyle(1, 0x445566, 0.6)
      pauseG.strokeRoundedRect(btnX, btnY, btnSize, btnSize, 8)

      // Touch zone
      const pauseZone = this.add.zone(btnX + btnSize / 2, btnY + btnSize / 2, btnSize, btnSize)
        .setInteractive().setDepth(24).setScrollFactor(0)
      pauseZone.on('pointerdown', () => this.togglePause())
    }

    // CLAWS warning
    this.events.on('claws-warning', () => {
      this.showAnnounce('THE CLAWS ARE COMING...', '#ff2222')
    })

    // Branch mastery level-up popup (fixed HUD position, non-blocking)
    this.masteryPopup = this.add.text(0, 80, '', {
      fontFamily: gameFont(),
      fontSize: '20px',
      color: '#ffdd00',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(20).setAlpha(0)
    this.masteryPopup.setShadow(0, 1, '#000000', 2, true, true)

    // Listen for branch mastery level-ups emitted by the Player via scene events
    this.gameScene.events.on('branch-mastery-levelup', ({ branch, level }: { branch: string; level: number }) => {
      const levelName = Player.MASTERY_NAMES[level] || ''
      const displayBranch = branch.charAt(0).toUpperCase() + branch.slice(1)
      this.masteryPopup.setText(`\u2B27 ${displayBranch} \u2014 ${levelName} \u2B27`)
      this.masteryPopup.setPosition(this.scale.width / 2, 80).setAlpha(1).setScale(0.8)
      this.tweens.killTweensOf(this.masteryPopup)
      this.tweens.add({
        targets: this.masteryPopup,
        scale: 1,
        duration: 250,
        ease: 'Back.easeOut',
      })
      this.tweens.add({
        targets: this.masteryPopup,
        alpha: 0,
        duration: 600,
        delay: 1800,
      })
    })

    // ── Quest HUD ──────────────────────────────────────────────
    // Register mid-run quest-complete callback (fires when kill/time quests complete)
    MetaProgress.onQuestComplete((questId, _meta) => {
      this._onQuestCompletedMidRun(questId)
    })

    // Build initial quest panel if tutorial quests are active
    this._buildQuestPanel()

    this.updatePositions()
    const onScaleResize = () => this.updatePositions()
    this.scale.on('resize', onScaleResize)

    // ── Boss HP bar events ────────────────────────────────────────
    this.gameScene.events.on('boss-spawned', (boss?: any) => {
      if (boss) {
        this._bossHp = boss.hp ?? boss.maxHp ?? 1
        this._bossMaxHp = boss.maxHp ?? boss.hp ?? 1
      }
      this._showBossBar()
    })
    this.gameScene.events.on('boss-hp', (hp: number, maxHp: number) => {
      this._bossHp = hp
      this._bossMaxHp = maxHp
      this._drawBossBar()
    })
    this.gameScene.events.on('boss-phase', (phase: number) => {
      this._onBossPhase(phase)
    })
    this.gameScene.events.on('boss-defeated', () => {
      this._hideBossBar()
      if (!this.endScreenShown) {
        this.endScreenShown = true
        this.time.delayedCall(2500, () => this.showEndScreen())
      }
    })
    // Online multiplayer: server signals game end
    this.gameScene.events.on('show-end-screen', (data: { won: boolean }) => {
      if (!this.endScreenShown) {
        this.endScreenShown = true
        this.time.delayedCall(600, () => this.showEndScreen(data.won))
      }
    })

    // Clean up all external event listeners on shutdown to prevent memory leaks
    this.events.once('shutdown', () => {
      this.gameScene?.events?.off('stance-changed')
      this.gameScene?.events?.off('nazar-stance-changed')
      this.gameScene?.events?.off('huntress-stance-changed')
      this.gameScene?.events?.off('khashin-stance-changed')
      this.gameScene?.events?.off('amun-stance-changed')
      this.gameScene?.events?.off('branch-mastery-levelup')
      this.gameScene?.events?.off('boss-spawned')
      this.gameScene?.events?.off('boss-hp')
      this.gameScene?.events?.off('boss-phase')
      this.gameScene?.events?.off('boss-defeated')
      this.gameScene?.events?.off('show-end-screen')
      this.scale.off('resize', onScaleResize)
      MetaProgress.clearQuestCallbacks()
    })

    // Desktop-only cheat/debug panel
    if (!this.isMobile) this.setupCheatPanel()
  }

  // ── Cheat Panel (desktop only) ───────────────────────────────────────
  private _cheatGodMode = false
  private _cheatObjects: Phaser.GameObjects.GameObject[] = []

  private setupCheatPanel() {
    const gs = this.gameScene
    if (!gs) return

    let panelOpen = false
    const objs = this._cheatObjects
    const font = { fontFamily: gameFont(), fontSize: '11px', color: '#aaaaaa', backgroundColor: '#1a1a2e' }

    // Toggle with backtick / tilde key (raw DOM event — Phaser may not map BACKQUOTE)
    const togglePanel = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') {
        panelOpen = !panelOpen
        for (const o of objs) (o as any).setVisible(panelOpen)
      }
    }
    window.addEventListener('keydown', togglePanel)
    this.events.once('shutdown', () => window.removeEventListener('keydown', togglePanel))

    const { height } = this.scale
    const x = 8
    let y = height - 18

    const addBtn = (label: string, fn: () => void) => {
      const btn = this.add.text(x, y, label, font)
        .setDepth(9999).setVisible(false).setInteractive({ useHandCursor: true })
        .setPadding(4, 2, 4, 2).setScrollFactor(0)
      btn.on('pointerover', () => btn.setColor('#FFD700'))
      btn.on('pointerout', () => btn.setColor('#aaaaaa'))
      btn.on('pointerdown', fn)
      objs.push(btn)
      y -= 18
      return btn
    }

    addBtn('[+1000 Gold]', () => {
      for (let i = 0; i < 10; i++) gs.goldSystem?.spawnOrb(gs.localPlayer.x, gs.localPlayer.y, 100)
    })

    addBtn('[Level Up]', () => {
      gs.localPlayer.addXP(gs.localPlayer.xpToNextLevel())
    })

    addBtn('[Spawn Boss]', () => {
      gs.spawnClawsBoss(true)
    })

    addBtn('[Kill All]', () => {
      for (const e of gs.enemies.getChildren() as any[]) {
        if (e.active && typeof e.die === 'function') e.die()
      }
    })

    const godBtn = addBtn('[God Mode: OFF]', () => {
      this._cheatGodMode = !this._cheatGodMode
      godBtn.setText(`[God Mode: ${this._cheatGodMode ? 'ON' : 'OFF'}]`)
      godBtn.setColor(this._cheatGodMode ? '#44ff44' : '#aaaaaa')
    })

    addBtn('[+10 Levels]', () => {
      let remaining = 9
      gs.localPlayer.addXP(gs.localPlayer.xpToNextLevel())
      const tryNext = () => {
        if (remaining <= 0) return
        if (this.scene.isActive('LevelUpScene')) {
          this.time.delayedCall(300, tryNext)
          return
        }
        remaining--
        gs.localPlayer.addXP(gs.localPlayer.xpToNextLevel())
        this.time.delayedCall(400, tryNext)
      }
      this.time.delayedCall(400, tryNext)
    })

    addBtn('[Full HP]', () => {
      gs.localPlayer.hp = gs.localPlayer.maxHp
    })

    const speedBtn = addBtn('[Speed ×2: OFF]', () => {
      gs._cheatSpeedUp = !gs._cheatSpeedUp
      gs._restoreTimeScale()
      speedBtn.setText(`[Speed ×2: ${gs._cheatSpeedUp ? 'ON' : 'OFF'}]`)
      speedBtn.setColor(gs._cheatSpeedUp ? '#44ff44' : '#aaaaaa')
    })

    // Header
    const hdr = this.add.text(x, y, '~ CHEATS ~', {
      ...font, color: '#FFD700', fontSize: '12px',
    }).setDepth(9999).setVisible(false).setScrollFactor(0)
    objs.push(hdr)
  }

  private updatePositions() {
    const { width, height } = this.scale
    this._isPortrait = isPortrait()
    const portrait = this.isMobile && this._isPortrait

    // Re-apply zoom on resize/rotation so mobile scale stays consistent
    if (this.isMobile) {
      this.cameras.main.setZoom(0.92)
    }

    // In portrait, kills/tier/gold panel moves below minimap
    const mmSize = portrait ? 90 : CONFIG.MINIMAP_SIZE
    const killsY = portrait ? CONFIG.MINIMAP_MARGIN + 76 + mmSize + 8 : 24
    const mobHud = this.isMobile
    this.killText.setPosition(width - 20, killsY + 14).setOrigin(1, 0)
    this.tierText.setPosition(width - 20, killsY + (mobHud ? 38 : 32)).setOrigin(1, 0)
    this.goldText.setPosition(width - 20, killsY + (mobHud ? 60 : 48)).setOrigin(1, 0)
    this.goldIcon.setPosition(width - 20 - this.goldText.width - 12, killsY + (mobHud ? 68 : 55))
    this.timerText.setPosition(width / 2, this.isMobile ? 52 : 38).setOrigin(0.5, 0)
    this.announcement.setPosition(width / 2, 68)
    // Stance btn — anchor below HP/energy block (bottom-left)
    if (this.stanceBtn) {
      const sc = 1.25
      const _hpH = Math.round(24 * sc), _ebH = Math.round(12 * sc)
      const _totalH = _hpH + 3 + _ebH
      const _stanceBtnY = height - _totalH - 12 - 20 // above HP block
      this.stanceBtn.setPosition(8, _stanceBtnY)
    }
    if (this.mobileStanceBtn) {
      const zoneH = height - 200
      this.mobileStanceBtn.setPosition(width * 0.75, 200 + zoneH / 2).setSize(width / 2, zoneH)
    }
    if (this.mobileStanceLbl) {
      this.mobileStanceLbl.setPosition(width - 12, height - 12)
    }
    this._mmMaskDirty = true
  }

  private updateMobileStanceBtn() {
    if (!this.mobileStanceLbl) return
    const p = this.gameScene.localPlayer
    let label = ''
    if (p.heroType === 'sifra') {
      label = p.stance === 'lightning' ? '⚡' : '❄'
    } else if (p.heroType === 'nazar') {
      label = p.nazarStance === 'venom' ? '☠' : '⚔'
    } else if (p.heroType === 'huntress') {
      label = p.huntressStance === 'spear' ? '🏹' : '⚔'
    } else if (p.heroType === 'khashin') {
      label = p.khashinStance === 'sirocco' ? '💨' : '🏜'
    } else if (p.heroType === 'amun') {
      label = p.amunStance === 'quake' ? '🌋' : '⚔'
    } else if (p.heroType === 'vael') {
      label = p.vaelStance === 'drain' ? '✦' : '◉'
    }
    this.mobileStanceLbl.setText(label)
    // Draw pill background behind the label
    if (this.mobileStancePill && label) {
      const lbl = this.mobileStanceLbl
      const pw = 80, ph = 36
      const rx = lbl.x - pw + (lbl.displayWidth * 0.5)
      const ry = lbl.y - ph + (lbl.displayHeight * 0.5)
      this.mobileStancePill.clear()
      this.mobileStancePill.fillStyle(0x000000, 0.3)
      this.mobileStancePill.fillRoundedRect(rx, ry, pw, ph, 10)
    } else if (this.mobileStancePill && !label) {
      this.mobileStancePill.clear()
    }
  }

  private updateStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    this.stanceBtn.setText('')
    this.stanceIcon.clear()
  }

  private updateNazarStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    this.stanceBtn.setText('')
    this.stanceIcon.clear()
  }

  private updateHuntressStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    this.stanceBtn.setText('')
    this.stanceIcon.clear()
  }

  private showAnnounce(text: string, color = '#FFD700') {
    this.tweens.killTweensOf(this.announcement)
    this.announcement.setText(text).setColor(color).setAlpha(1).setScale(0.5)
    this.tweens.add({
      targets: this.announcement,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    })
    this.tweens.add({
      targets: this.announcement,
      alpha: 0,
      duration: 500,
      delay: 800,
    })
  }

  private showControlsHint() {
    if (!shouldShowHint('controls')) return

    const { width, height } = this.scale
    const isMob = this.isMobile
    const dep = 50

    // Semi-transparent backdrop
    const bg = this.add.graphics().setDepth(dep).setAlpha(0)
    bg.fillStyle(0x000000, 0.6)
    bg.fillRect(0, 0, width, height)

    const objs: Phaser.GameObjects.GameObject[] = [bg]
    const cx = width / 2
    const cy = height / 2

    if (isMob) {
      // ── Mobile: tap to move ──
      const title = this.add.text(cx, cy - 60, 'TAP TO MOVE', {
        fontFamily: gameFont(), fontSize: '24px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(title)

      // Hand icon (drawn with graphics)
      const hand = this.add.graphics().setDepth(dep + 1).setAlpha(0)
      hand.fillStyle(0xffffff, 0.9)
      hand.fillCircle(cx, cy + 10, 12)
      hand.fillRoundedRect(cx - 6, cy + 10, 12, 20, 4)
      objs.push(hand)

      // Ripple rings around tap
      const ripple = this.add.graphics().setDepth(dep + 1).setAlpha(0)
      ripple.lineStyle(2, 0xffffff, 0.5)
      ripple.strokeCircle(cx, cy + 10, 30)
      ripple.lineStyle(1, 0xffffff, 0.25)
      ripple.strokeCircle(cx, cy + 10, 50)
      objs.push(ripple)

      const sub = this.add.text(cx, cy + 70, 'Tap anywhere to move your hero', {
        fontFamily: gameFont(), fontSize: '11px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(sub)

      const dismiss = this.add.text(cx, cy + 110, 'tap to start', {
        fontFamily: gameFont(), fontSize: '13px', color: '#666666',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(dismiss)
    } else {
      // ── Desktop: WASD keys ──
      const title = this.add.text(cx, cy - 80, 'CONTROLS', {
        fontFamily: gameFont(), fontSize: '28px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(title)

      // Draw WASD key caps — centered on W column (= cx)
      const keyG = this.add.graphics().setDepth(dep + 1).setAlpha(0)
      const keySize = 36
      const gap = 4
      const keysStartY = cy - 30

      const drawKey = (kx: number, ky: number, label: string, highlight = false) => {
        keyG.fillStyle(highlight ? 0x334466 : 0x1a1a2a, 0.95)
        keyG.fillRoundedRect(kx, ky, keySize, keySize, 6)
        keyG.lineStyle(2, highlight ? 0x6699cc : 0x445566, 0.8)
        keyG.strokeRoundedRect(kx, ky, keySize, keySize, 6)
        // Top highlight
        keyG.fillStyle(0xffffff, 0.08)
        keyG.fillRoundedRect(kx + 2, ky + 2, keySize - 4, keySize / 3, { tl: 4, tr: 4, bl: 0, br: 0 })

        const kt = this.add.text(kx + keySize / 2, ky + keySize / 2, label, {
          fontFamily: gameFont(), fontSize: '16px', color: highlight ? '#aaccee' : '#889999',
        }).setOrigin(0.5).setDepth(dep + 2).setAlpha(0)
        objs.push(kt)
      }

      //     W
      //   A S D
      const wx = cx - keySize / 2                    // W / S column (centered on cx)
      const ax = wx - keySize - gap                  // A column
      const dx = wx + keySize + gap                  // D column
      const row2Y = keysStartY + keySize + gap
      drawKey(wx, keysStartY, 'W', true)
      drawKey(ax, row2Y, 'A', true)
      drawKey(wx, row2Y, 'S', true)
      drawKey(dx, row2Y, 'D', true)
      objs.push(keyG)

      const moveLabel = this.add.text(cx, keysStartY + (keySize + gap) * 2 + 12, 'Move', {
        fontFamily: gameFont(), fontSize: '12px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(moveLabel)

      // Attack info
      const atkLabel = this.add.text(cx, keysStartY + (keySize + gap) * 2 + 34, 'Attack is automatic', {
        fontFamily: gameFont(), fontSize: '11px', color: '#888888',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(atkLabel)

      // Pause hint
      const pauseLabel = this.add.text(cx, keysStartY + (keySize + gap) * 2 + 56, 'SPACE — pause', {
        fontFamily: gameFont(), fontSize: '13px', color: '#666666',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(pauseLabel)

      const dismiss = this.add.text(cx, keysStartY + (keySize + gap) * 2 + 82, 'press any key to start', {
        fontFamily: gameFont(), fontSize: '13px', color: '#555555',
      }).setOrigin(0.5).setDepth(dep + 1).setAlpha(0)
      objs.push(dismiss)
    }

    // Fade in immediately on scene open
    for (const obj of objs) {
      this.tweens.add({ targets: obj, alpha: 1, duration: 400 })
    }

    // Dismiss on any input
    const dismissAll = () => {
      for (const obj of objs) {
        this.tweens.add({
          targets: obj, alpha: 0, duration: 300,
          onComplete: () => (obj as any).destroy?.(),
        })
      }
      this.input.off('pointerdown', dismissAll)
      this.input.keyboard?.off('keydown', dismissAll)
    }

    this.input.once('pointerdown', dismissAll)
    this.input.keyboard?.once('keydown', dismissAll)
  }

  private togglePause() {
    if ((this.gameScene as any)._online) return  // No pausing in online mode
    if (this.endScreenShown) return

    this.isPaused = !this.isPaused
    const { width, height } = this.scale

    if (this.isPaused) {
      this.scene.pause(this.gameScene.scene.key)
      this.pauseBtn?.setText('▶').setColor('#66ff66')

      const gs = this.gameScene
      const p = gs.player
      const compact = height < 500 || width < 500
      const dep = 29
      const objs: Phaser.GameObjects.GameObject[] = []

      // ── Dark overlay with vignette ──
      this.pauseOverlay.clear()
      this.pauseOverlay.fillStyle(0x000000, 0.75)
      this.pauseOverlay.fillRect(0, 0, width, height)
      this.pauseOverlay.setAlpha(1)

      // ── Central panel ──
      const panelW = Math.min(width - 40, compact ? 500 : 680)
      const panelH = Math.min(height - 30, compact ? 320 : 480)
      const px = (width - panelW) / 2
      const py = (height - panelH) / 2
      const panelG = this.add.graphics().setDepth(dep)
      objs.push(panelG)

      // Panel background with rounded corners
      panelG.fillStyle(0x12121e, 0.95)
      panelG.fillRoundedRect(px, py, panelW, panelH, 16)
      // Inner border
      panelG.lineStyle(1, 0x334466, 0.6)
      panelG.strokeRoundedRect(px + 4, py + 4, panelW - 8, panelH - 8, 12)
      // Outer glow border
      panelG.lineStyle(2, 0xffd700, 0.3)
      panelG.strokeRoundedRect(px, py, panelW, panelH, 16)

      // ── Top accent line ──
      const accentColor = HERO_COLORS[p.heroType] || 0xffd700
      panelG.fillStyle(accentColor, 0.25)
      panelG.fillRoundedRect(px, py, panelW, compact ? 36 : 48, { tl: 16, tr: 16, bl: 0, br: 0 })
      panelG.fillStyle(accentColor, 0.08)
      panelG.fillRect(px, py + (compact ? 36 : 48), panelW, 1)

      // ── Header ──
      const heroName = HERO_DISPLAY_NAMES[p.heroType] || p.heroType
      const accentHex = '#' + accentColor.toString(16).padStart(6, '0')
      const header = this.add.text(width / 2, py + (compact ? 18 : 24), `⏸  ${heroName.toUpperCase()}`, {
        fontFamily: gameFont(), fontSize: compact ? '16px' : '22px', color: accentHex,
      }).setOrigin(0.5).setDepth(dep)
      objs.push(header)

      // Info bar under header
      const mins = Math.floor(gs.gameTime / 60000)
      const secs = Math.floor((gs.gameTime % 60000) / 1000)
      const barH = compact ? 22 : 28
      const barY = py + (compact ? 36 : 48)
      panelG.fillStyle(0x000000, 0.35)
      panelG.fillRect(px + 8, barY, panelW - 16, barH)
      panelG.lineStyle(1, 0x334466, 0.3)
      panelG.strokeRect(px + 8, barY, panelW - 16, barH)
      const infoStr = `${mins}:${secs.toString().padStart(2, '0')}   ·   LV ${p.level}   ·   ${p.kills} kills`
      objs.push(this.add.text(width / 2, barY + barH / 2, infoStr, {
        fontFamily: gameFont(), fontSize: compact ? '10px' : '13px', color: '#aabbcc',
      }).setOrigin(0.5).setDepth(dep))

      // ── Tab row ──
      const tabH = compact ? 22 : 28
      const tabY = barY + barH + (compact ? 4 : 6)
      const tabW = compact ? 80 : 110
      const midX = px + panelW / 2
      const tabStatsX = midX - tabW - (compact ? 4 : 6)
      const tabInvX = midX + (compact ? 4 : 6)

      // Tab graphics objects
      const tabStatsG = this.add.graphics().setDepth(dep)
      objs.push(tabStatsG)
      const tabStatsLbl = this.add.text(tabStatsX + tabW / 2, tabY + tabH / 2, 'STATS', {
        fontFamily: gameFont(), fontSize: compact ? '10px' : '12px', color: '#ffddcc',
      }).setOrigin(0.5).setDepth(dep)
      objs.push(tabStatsLbl)

      const tabInvG = this.add.graphics().setDepth(dep)
      objs.push(tabInvG)
      const tabInvLbl = this.add.text(tabInvX + tabW / 2, tabY + tabH / 2, 'INVENTORY', {
        fontFamily: gameFont(), fontSize: compact ? '10px' : '12px', color: '#886666',
      }).setOrigin(0.5).setDepth(dep)
      objs.push(tabInvLbl)

      const drawTabBtn = (
        tabG: Phaser.GameObjects.Graphics,
        tabLbl: Phaser.GameObjects.Text,
        isStats: boolean,
        active: boolean,
      ) => {
        const tx = isStats ? tabStatsX : tabInvX
        tabG.clear()
        if (active) {
          tabG.fillStyle(0x8b2020, 0.9)
          tabG.fillRoundedRect(tx, tabY, tabW, tabH, { tl: 6, tr: 6, bl: 0, br: 0 })
          tabG.lineStyle(1, 0xcc4444, 0.7)
          tabG.strokeRoundedRect(tx, tabY, tabW, tabH, { tl: 6, tr: 6, bl: 0, br: 0 })
          tabLbl.setColor('#ffddcc')
        } else {
          tabG.fillStyle(0x2a1010, 0.7)
          tabG.fillRoundedRect(tx, tabY, tabW, tabH, { tl: 6, tr: 6, bl: 0, br: 0 })
          tabG.lineStyle(1, 0x5a2020, 0.5)
          tabG.strokeRoundedRect(tx, tabY, tabW, tabH, { tl: 6, tr: 6, bl: 0, br: 0 })
          tabLbl.setColor('#886666')
        }
      }

      drawTabBtn(tabStatsG, tabStatsLbl, true, this.pauseTab === 'stats')
      drawTabBtn(tabInvG, tabInvLbl, false, this.pauseTab === 'inventory')

      // Content area bounds (below tab row)
      const contentTop = tabY + tabH + (compact ? 4 : 6)
      const contentBot = py + panelH - (compact ? 44 : 60)

      // ── Bottom buttons (always shown) ──
      const btnY = py + panelH - (compact ? 26 : 36)
      const btnW = compact ? 90 : 120
      const btnH = compact ? 24 : 32
      const btnGap = compact ? 16 : 24

      // Resume button
      const resumeG = this.add.graphics().setDepth(dep)
      objs.push(resumeG)
      resumeG.fillStyle(0x226633, 0.8).fillRoundedRect(midX - btnGap / 2 - btnW, btnY - btnH / 2, btnW, btnH, 8)
      resumeG.lineStyle(1, 0x44ff66, 0.4).strokeRoundedRect(midX - btnGap / 2 - btnW, btnY - btnH / 2, btnW, btnH, 8)
      const resumeBtn = this.add.text(midX - btnGap / 2 - btnW / 2, btnY, '▶  RESUME', {
        fontFamily: gameFont(), fontSize: compact ? '11px' : '13px', color: '#66ff88',
      }).setOrigin(0.5).setDepth(dep)
      objs.push(resumeBtn)
      const resumeZone = this.add.zone(midX - btnGap / 2 - btnW / 2, btnY, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(dep)
      objs.push(resumeZone)
      resumeZone.on('pointerover', () => { resumeBtn.setColor('#ffffff'); resumeG.clear().fillStyle(0x338844, 0.9).fillRoundedRect(midX - btnGap / 2 - btnW, btnY - btnH / 2, btnW, btnH, 8).lineStyle(1, 0x66ff88, 0.6).strokeRoundedRect(midX - btnGap / 2 - btnW, btnY - btnH / 2, btnW, btnH, 8) })
      resumeZone.on('pointerout', () => { resumeBtn.setColor('#66ff88'); resumeG.clear().fillStyle(0x226633, 0.8).fillRoundedRect(midX - btnGap / 2 - btnW, btnY - btnH / 2, btnW, btnH, 8).lineStyle(1, 0x44ff66, 0.4).strokeRoundedRect(midX - btnGap / 2 - btnW, btnY - btnH / 2, btnW, btnH, 8) })
      resumeZone.on('pointerdown', () => this.togglePause())

      // Quit button
      const quitG = this.add.graphics().setDepth(dep)
      objs.push(quitG)
      quitG.fillStyle(0x442222, 0.8).fillRoundedRect(midX + btnGap / 2, btnY - btnH / 2, btnW, btnH, 8)
      quitG.lineStyle(1, 0xff4444, 0.3).strokeRoundedRect(midX + btnGap / 2, btnY - btnH / 2, btnW, btnH, 8)
      const quitBtn = this.add.text(midX + btnGap / 2 + btnW / 2, btnY, '✕  QUIT', {
        fontFamily: gameFont(), fontSize: compact ? '11px' : '13px', color: '#ff6666',
      }).setOrigin(0.5).setDepth(dep)
      objs.push(quitBtn)
      const quitZone = this.add.zone(midX + btnGap / 2 + btnW / 2, btnY, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(dep)
      objs.push(quitZone)
      quitZone.on('pointerover', () => { quitBtn.setColor('#ffffff'); quitG.clear().fillStyle(0x663333, 0.9).fillRoundedRect(midX + btnGap / 2, btnY - btnH / 2, btnW, btnH, 8).lineStyle(1, 0xff6666, 0.5).strokeRoundedRect(midX + btnGap / 2, btnY - btnH / 2, btnW, btnH, 8) })
      quitZone.on('pointerout', () => { quitBtn.setColor('#ff6666'); quitG.clear().fillStyle(0x442222, 0.8).fillRoundedRect(midX + btnGap / 2, btnY - btnH / 2, btnW, btnH, 8).lineStyle(1, 0xff4444, 0.3).strokeRoundedRect(midX + btnGap / 2, btnY - btnH / 2, btnW, btnH, 8) })
      quitZone.on('pointerdown', () => {
        const sceneKey = this.gameScene.scene.key
        this.clearPause()
        this.cleanup()
        const sm = this.game.scene
        sm.stop('LevelUpScene'); sm.stop(sceneKey); sm.stop('UIScene')
        sm.start('StartScene')
      })

      // SPACE hint
      objs.push(this.add.text(width / 2, py + panelH + (compact ? 8 : 14), 'SPACE', {
        fontFamily: gameFont(), fontSize: '12px', color: '#334455',
      }).setOrigin(0.5).setDepth(dep))

      this.pauseTexts = objs as Phaser.GameObjects.Text[]

      // ── Render initial tab content ──
      const renderCurrentTab = () => {
        this.pauseTabObjs.forEach(o => o.destroy())
        this.pauseTabObjs = []
        if (this.pauseTab === 'stats') {
          this.renderStatsTab(px, contentTop, contentBot, midX, panelW, compact, dep)
        } else {
          this.renderInventoryTab(px, contentTop, contentBot, panelW, compact, dep)
        }
      }
      renderCurrentTab()

      // ── Tab click zones ──
      const tabStatsZone = this.add.zone(tabStatsX + tabW / 2, tabY + tabH / 2, tabW, tabH)
        .setInteractive({ useHandCursor: true }).setDepth(dep + 1)
      objs.push(tabStatsZone)
      tabStatsZone.on('pointerdown', () => {
        if (this.pauseTab === 'stats') return
        this.pauseTab = 'stats'
        drawTabBtn(tabStatsG, tabStatsLbl, true, true)
        drawTabBtn(tabInvG, tabInvLbl, false, false)
        renderCurrentTab()
      })

      const tabInvZone = this.add.zone(tabInvX + tabW / 2, tabY + tabH / 2, tabW, tabH)
        .setInteractive({ useHandCursor: true }).setDepth(dep + 1)
      objs.push(tabInvZone)
      tabInvZone.on('pointerdown', () => {
        if (this.pauseTab === 'inventory') return
        this.pauseTab = 'inventory'
        drawTabBtn(tabInvG, tabInvLbl, false, true)
        drawTabBtn(tabStatsG, tabStatsLbl, true, false)
        renderCurrentTab()
      })

    } else {
      this.clearPause()
      this.scene.resume(this.gameScene.scene.key)
    }
  }

  // ── Stats tab: full-width expanded stats ──
  private renderStatsTab(
    px: number, contentTop: number, contentBot: number,
    midX: number, _panelW: number, compact: boolean, dep: number,
  ) {
    const gs = this.gameScene
    const p = gs.player
    const tracker = gs.upgradeTracker
    const objs = this.pauseTabObjs

    const divG = this.add.graphics().setDepth(dep)
    objs.push(divG)

    // Two-column layout for stats
    const leftX = px + (compact ? 16 : 28)
    const rightX = midX + (compact ? 12 : 20)
    let sy = contentTop
    let ry = contentTop
    const sf = compact ? '10px' : '12px'
    const sGap = compact ? 14 : 18

    const sectionTitle = (x: number, y: number, text: string) => {
      const t = this.add.text(x, y, text, {
        fontFamily: gameFont(), fontSize: compact ? '10px' : '12px', color: '#8899aa',
      }).setDepth(dep)
      objs.push(t)
      divG.lineStyle(1, 0x445566, 0.3)
      divG.lineBetween(x, y + (compact ? 13 : 16), x + (compact ? 100 : 140), y + (compact ? 13 : 16))
    }

    const valColor = '#ccddee'
    const statRow = (x: number, yRef: { v: number }, label: string, val: string, valCol = valColor) => {
      objs.push(this.add.text(x, yRef.v, label, {
        fontFamily: gameFont(), fontSize: sf, color: '#667788',
      }).setDepth(dep))
      objs.push(this.add.text(x + (compact ? 72 : 100), yRef.v, val, {
        fontFamily: gameFont(), fontSize: sf, color: valCol,
      }).setDepth(dep))
      yRef.v += sGap
    }

    // ── Left column: Combat Stats ──
    sectionTitle(leftX, sy, '◆ COMBAT')
    sy += compact ? 18 : 24
    const syl = { v: sy }

    statRow(leftX, syl, 'HP', `${Math.ceil(p.hp)} / ${p.maxHp}`)
    statRow(leftX, syl, 'Damage', `${Math.ceil(p.damage)}`)
    statRow(leftX, syl, 'Speed', `${Math.ceil(p.speed)}`)
    statRow(leftX, syl, 'Range', `${Math.ceil(p.range)}px`)
    statRow(leftX, syl, 'Atk Spd', `${(1000 / p.attackCooldown).toFixed(1)}`)
    statRow(leftX, syl, 'Armor', `${Math.round(p.armor * 100)}%`)
    statRow(leftX, syl, 'HP Regen', `${p.hpRegen}/s`)
    statRow(leftX, syl, 'Splash', `${p.splashRadius}px`)
    statRow(leftX, syl, 'Strikes', `${p.strikeCount}`)
    if (tracker.chosenBranch) {
      statRow(leftX, syl, 'Specialization', tracker.chosenBranch)
    }

    // ── Right column: Run Stats ──
    sectionTitle(rightX, ry, '◆ RUN')
    ry += compact ? 18 : 24
    const syr = { v: ry }

    const heroName = HERO_DISPLAY_NAMES[p.heroType] || p.heroType
    statRow(rightX, syr, 'Hero', heroName, '#ffddaa')
    statRow(rightX, syr, 'Level', `${p.level}`, '#ffddaa')

    const elapsed = gs.gameTime
    const mins = Math.floor(elapsed / 60000)
    const secs = Math.floor((elapsed % 60000) / 1000)
    statRow(rightX, syr, 'Time', `${mins}:${secs.toString().padStart(2, '0')}`)

    statRow(rightX, syr, 'Kills', `${p.kills}`, '#ff8888')
    statRow(rightX, syr, 'Mini Boss', `${p.miniBossKills}`, '#ff6644')
    statRow(rightX, syr, 'Gold', `${p.goldThisRun} ✦`, '#ffdd44')

    // ── Mastery (below run stats) ──
    syr.v += compact ? 6 : 10
    let branches = HUD_HERO_BRANCHES[p.heroType] || []
    if (p.heroType === 'amun' && p.hasQuakeStance) branches = ['ground', 'quake']
    else if (p.heroType === 'amun') branches = ['ground']

    if (branches.length > 0) {
      sectionTitle(rightX, syr.v, '◆ MASTERY')
      syr.v += compact ? 18 : 24

      const dSize = compact ? 5 : 6
      const rowH = compact ? 44 : 54
      const barW = compact ? 60 : 80

      // Cumulative perks gained at each mastery level (1..3) for given branch
      const singleStanceBranches = new Set(['fireball', 'crystal'])
      const getPerksSummary = (branch: string, level: number): string => {
        if (level <= 0) return ''
        const parts: string[] = [`+${level * 10}% dmg`]
        // Stance branches have energy cost reduction. Amun 'ground' is melee
        // single-stance (no cost) until Quake stance unlocks.
        const isAmunSingleStance = p.heroType === 'amun' && !p.hasQuakeStance && branch === 'ground'
        const hasEnergyCost = !singleStanceBranches.has(branch) && !isAmunSingleStance
        if (hasEnergyCost) {
          const costRed = [0, 10, 18, 24][level]
          parts.push(`-${costRed}% cost`)
        }
        // Sifra: +2 range at mastery levels 1 & 2 (both branches)
        if (p.heroType === 'sifra' && (branch === 'ice' || branch === 'lightning')) {
          const rangeBonus = Math.min(level, 2) * 2
          if (rangeBonus > 0) parts.push(`+${rangeBonus} range`)
        }
        // Sifra lightning lvl 3: idle-stance regen trickle
        if (p.heroType === 'sifra' && branch === 'lightning' && level >= 3) {
          parts.push('idle regen')
        }
        return parts.join(', ')
      }

      branches.forEach((branch, bi) => {
        const by = syr.v + bi * rowH
        const level = p.getMasteryLevel(branch)
        const xp = p.branchMasteryXP[branch] ?? 0
        const color = BRANCH_COLOR[branch] ?? 0xaaaaaa
        const displayName = branch.charAt(0).toUpperCase() + branch.slice(1)
        const levelName = Player.MASTERY_NAMES[level] || ''

        objs.push(this.add.text(rightX, by, displayName, {
          fontFamily: gameFont(), fontSize: compact ? '10px' : '11px',
          color: '#' + color.toString(16).padStart(6, '0'),
        }).setDepth(dep + 1))

        if (levelName) {
          objs.push(this.add.text(rightX + (compact ? 55 : 65), by, levelName, {
            fontFamily: gameFont(), fontSize: compact ? '12px' : '10px',
            color: '#ffddaa',
          }).setDepth(dep + 1))
        }

        const diamondY = by + (compact ? 20 : 24)
        const mg = this.add.graphics().setDepth(dep + 2)
        objs.push(mg)

        const diamondSpacing = dSize * 3
        for (let i = 0; i < 3; i++) {
          const cx = rightX + dSize + i * diamondSpacing
          const cy = diamondY
          const filled = i < level
          if (filled) {
            mg.fillStyle(color, 0.95)
            mg.fillTriangle(cx, cy - dSize, cx + dSize, cy, cx - dSize, cy)
            mg.fillTriangle(cx, cy + dSize, cx + dSize, cy, cx - dSize, cy)
            mg.fillStyle(0xffffff, 0.25)
            mg.fillTriangle(cx, cy - dSize + 1, cx + dSize - 2, cy, cx - dSize + 2, cy)
          } else {
            mg.fillStyle(color, 0.08)
            mg.fillTriangle(cx, cy - dSize, cx + dSize, cy, cx - dSize, cy)
            mg.fillTriangle(cx, cy + dSize, cx + dSize, cy, cx - dSize, cy)
            mg.lineStyle(1, color, 0.5)
            mg.beginPath()
            mg.moveTo(cx, cy - dSize)
            mg.lineTo(cx + dSize, cy)
            mg.lineTo(cx, cy + dSize)
            mg.lineTo(cx - dSize, cy)
            mg.closePath()
            mg.strokePath()
          }
        }

        const barX2 = rightX + 3 * diamondSpacing + dSize + 6
        const barH = compact ? 6 : 8
        const thresholds = Player.getMasteryThresholds(branch)
        const nextThreshold = level < 3 ? thresholds[level] : thresholds[2]
        const prevThreshold = level > 0 ? thresholds[level - 1] : 0
        const progress = level >= 3 ? 1 : Math.min(1, (xp - prevThreshold) / (nextThreshold - prevThreshold))

        mg.fillStyle(0x1a1a2a)
        mg.fillRoundedRect(barX2, diamondY - barH / 2, barW, barH, 2)
        if (progress > 0) {
          mg.fillStyle(color, 0.8)
          mg.fillRoundedRect(barX2, diamondY - barH / 2, Math.max(2, barW * progress), barH, 2)
        }
        mg.lineStyle(1, color, 0.3)
        mg.strokeRoundedRect(barX2, diamondY - barH / 2, barW, barH, 2)

        const xpLabel = level >= 3 ? 'MAX' : `${Math.floor(xp)}/${nextThreshold}`
        objs.push(this.add.text(barX2 + barW + 6, diamondY, xpLabel, {
          fontFamily: gameFont(), fontSize: compact ? '11px' : '9px',
          color: level >= 3 ? '#ffdd44' : '#777777',
        }).setOrigin(0, 0.5).setDepth(dep + 1))

        // Perk summary — bonuses gained at current mastery level
        const perkText = getPerksSummary(branch, level)
        if (perkText) {
          objs.push(this.add.text(rightX, diamondY + (compact ? 10 : 12), perkText, {
            fontFamily: gameFont(), fontSize: compact ? '11px' : '9px',
            color: '#88ddaa',
          }).setDepth(dep + 1))
        }
      })
    }

    // Divider line between columns
    divG.lineStyle(1, 0x334466, 0.4)
    divG.lineBetween(midX, contentTop + 4, midX, contentBot - 4)
  }

  // ── Inventory tab: icon grid of picked upgrades ──
  private renderInventoryTab(
    px: number, contentTop: number, contentBot: number,
    panelW: number, compact: boolean, dep: number,
  ) {
    const gs = this.gameScene
    const p = gs.player
    const tracker = gs.upgradeTracker
    const objs = this.pauseTabObjs
    const iconSheetExists = this.textures.exists('skill_icons_sheet')

    // Collect all picked skills in order
    const allSkills: { label: string; icon: string }[] = []
    const personalIdsInv = Object.keys(tracker.skillLevels).filter(id => !tracker.pickedGeneric.has(id))
    for (const id of personalIdsInv) {
      const branches = HERO_BRANCHES[p.heroType] || []
      for (const b of branches) {
        const skill = b.upgrades.find(u => u.id === id)
        if (skill) { allSkills.push({ label: skill.label, icon: skill.icon }); break }
      }
    }
    for (const id of tracker.pickedGeneric) {
      const skill = GENERIC_POOL.find(u => u.id === id)
      if (skill) allSkills.push({ label: skill.label, icon: skill.icon })
    }

    // 8 slots: 2 columns × 4 rows, left side of panel
    const totalSlots = 8
    const cols = 2
    const rows = 4
    const slotSize = compact ? 56 : 72
    const slotGap = compact ? 6 : 8
    const gridW = cols * slotSize + (cols - 1) * slotGap
    const gridH = rows * slotSize + (rows - 1) * slotGap
    const gridX = px + (compact ? 16 : 24)
    const gridY = contentTop + Math.max(0, ((contentBot - contentTop) - gridH) / 2)

    // Tooltip
    const tooltipText = this.add.text(0, 0, '', {
      fontFamily: gameFont(), fontSize: compact ? '10px' : '12px', color: '#ffddcc',
      backgroundColor: '#1a0505',
      padding: { x: 6, y: 4 },
    }).setDepth(dep + 4).setAlpha(0).setOrigin(0)
    objs.push(tooltipText)

    // Draw 10 slots
    for (let i = 0; i < totalSlots; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const sx = gridX + col * (slotSize + slotGap)
      const sy = gridY + row * (slotSize + slotGap)
      const skill = allSkills[i] || null

      const slotG = this.add.graphics().setDepth(dep + 1)
      objs.push(slotG)

      // Slot frame
      if (skill) {
        slotG.fillStyle(0x3a1010)
        slotG.fillRoundedRect(sx, sy, slotSize, slotSize, 6)
        slotG.lineStyle(2, 0x8b2020, 0.9)
        slotG.strokeRoundedRect(sx, sy, slotSize, slotSize, 6)
      } else {
        // Empty slot — dashed look
        slotG.fillStyle(0x1a0808, 0.5)
        slotG.fillRoundedRect(sx, sy, slotSize, slotSize, 6)
        slotG.lineStyle(1, 0x4a1515, 0.5)
        slotG.strokeRoundedRect(sx, sy, slotSize, slotSize, 6)
      }

      if (skill) {
        // Skill icon (128x128 sheet → scale to fit slot with margin)
        if (iconSheetExists) {
          const frame = getIconFrame(skill.icon)
          const iconScale = (slotSize - 10) / 128
          const icon = this.add.image(sx + slotSize / 2, sy + slotSize / 2, 'skill_icons_sheet', frame)
            .setScale(iconScale).setDepth(dep + 2)
          objs.push(icon)
        } else {
          objs.push(this.add.text(sx + slotSize / 2, sy + slotSize / 2, skill.label.substring(0, 3).toUpperCase(), {
            fontFamily: gameFont(), fontSize: compact ? '11px' : '14px', color: '#cc8866',
          }).setOrigin(0.5).setDepth(dep + 2))
        }

        // Hover zone for tooltip
        const zone = this.add.zone(sx, sy, slotSize, slotSize)
          .setOrigin(0, 0).setInteractive({ useHandCursor: false }).setDepth(dep + 3)
        objs.push(zone)

        zone.on('pointerover', () => {
          slotG.clear()
          slotG.fillStyle(0x4a1818)
          slotG.fillRoundedRect(sx, sy, slotSize, slotSize, 6)
          slotG.lineStyle(2, 0xcc4444)
          slotG.strokeRoundedRect(sx, sy, slotSize, slotSize, 6)
          tooltipText.setText(skill.label)
            .setPosition(sx + slotSize + 8, sy)
            .setAlpha(1)
        })
        zone.on('pointerout', () => {
          slotG.clear()
          slotG.fillStyle(0x3a1010)
          slotG.fillRoundedRect(sx, sy, slotSize, slotSize, 6)
          slotG.lineStyle(2, 0x8b2020, 0.9)
          slotG.strokeRoundedRect(sx, sy, slotSize, slotSize, 6)
          tooltipText.setAlpha(0)
        })
      }
    }

    // Right side — skill text list next to icon grid
    const infoX = gridX + gridW + (compact ? 20 : 32)
    let infoY = gridY

    const skillTitleStyle = {
      fontFamily: gameFont(), fontSize: compact ? '10px' : '12px', color: '#8899aa',
    }
    objs.push(this.add.text(infoX, infoY, '◆ SKILLS', skillTitleStyle).setDepth(dep + 1))

    const lineG = this.add.graphics().setDepth(dep)
    objs.push(lineG)
    lineG.lineStyle(1, 0x445566, 0.3)
    lineG.lineBetween(infoX, infoY + (compact ? 13 : 16), infoX + (compact ? 100 : 140), infoY + (compact ? 13 : 16))

    infoY += compact ? 18 : 24

    // Collect picked skills with descriptions
    const pickedSkills: { label: string; desc: string; level: number }[] = []
    const personalIdsSkill = Object.keys(tracker.skillLevels).filter(id => !tracker.pickedGeneric.has(id))
    for (const id of personalIdsSkill) {
      const branches = HERO_BRANCHES[p.heroType] || []
      for (const b of branches) {
        const skill = b.upgrades.find(u => u.id === id)
        if (skill) {
          const lvl = tracker.skillLevels[id] ?? 1
          const descArr = Array.isArray(skill.desc) ? skill.desc : [skill.desc as string]
          pickedSkills.push({ label: skill.label, desc: descArr[0] ?? '', level: lvl })
          break
        }
      }
    }
    for (const id of tracker.pickedGeneric) {
      const skill = GENERIC_POOL.find(u => u.id === id)
      if (skill) {
        const descArr = Array.isArray(skill.desc) ? skill.desc : [skill.desc as string]
        pickedSkills.push({ label: skill.label, desc: descArr[0] ?? '', level: 1 })
      }
    }

    if (pickedSkills.length === 0) {
      objs.push(this.add.text(infoX, infoY, 'No skills yet', {
        fontFamily: gameFont(), fontSize: compact ? '10px' : '12px', color: '#445566',
      }).setDepth(dep + 1))
    } else {
      const maxSkills = compact ? 8 : 12
      const skillGap = compact ? 22 : 28
      const maxW = px + panelW - infoX - (compact ? 16 : 24)
      for (let i = 0; i < Math.min(pickedSkills.length, maxSkills); i++) {
        const s = pickedSkills[i]
        const lvlTag = s.level > 1 ? ` Lv${s.level}` : ''
        objs.push(this.add.text(infoX, infoY, s.label + lvlTag, {
          fontFamily: gameFont(), fontSize: compact ? '10px' : '12px', color: '#ccddee',
        }).setDepth(dep + 1))
        objs.push(this.add.text(infoX, infoY + (compact ? 11 : 14), s.desc, {
          fontFamily: gameFont(), fontSize: compact ? '11px' : '9px', color: '#556666',
          wordWrap: { width: maxW },
        }).setDepth(dep + 1))
        infoY += skillGap
      }
      if (pickedSkills.length > maxSkills) {
        objs.push(this.add.text(infoX, infoY, `+${pickedSkills.length - maxSkills} more...`, {
          fontFamily: gameFont(), fontSize: '12px', color: '#445566',
        }).setDepth(dep + 1))
      }
    }
  }

  private clearPause() {
    this.isPaused = false
    this.pauseBtn?.setText('||').setColor('#aaaaaa')
    this.pauseOverlay.setAlpha(0)
    this.pauseTabObjs.forEach(o => o.destroy())
    this.pauseTabObjs = []
    this.pauseTexts.forEach(t => t.destroy())
    this.pauseTexts = []
  }

  // The end-screen leaderboard is sourced from Supabase (global, shared) — no
  // localStorage path. See _populateEndLeaderboard() below.

  private showEndScreen(networkWon?: boolean) {
    const { width, height } = this.scale
    const gs = this.gameScene

    // Compute visible world bounds — UIScene camera may be zoomed (0.92 on mobile),
    // so this.scale.width/height are smaller than the actual visible edges.
    const _z = this.cameras.main.zoom || 1
    const _ox = width * (1 - 1 / _z) / 2
    const _oy = height * (1 - 1 / _z) / 2
    const _ow = width / _z
    const _oh = height / _z
    this.overlay.clear()
    this.overlay.fillStyle(0x000000, 1)
    this.overlay.fillRect(_ox, _oy, _ow, _oh)
    this.overlay.setAlpha(0)
    this.tweens.add({
      targets: this.overlay,
      alpha: 0.8,
      duration: 800,
      ease: 'Sine.easeIn',
    })

    const survived = gs.gameTime
    const mins = Math.floor(survived / 60000)
    const secs = Math.floor((survived % 60000) / 1000)
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

    let title: string
    let titleColor: string
    if (networkWon !== undefined) {
      // Online mode: server determined outcome
      title = networkWon ? 'VICTORY!' : 'GAME OVER'
      titleColor = networkWon ? '#ffdd00' : '#ff4444'
    } else {
      const bossDefeated = (gs as any).bossDefeated === true
      const wasClaws = !bossDefeated && survived >= CONFIG.RUN_DURATION
      title = bossDefeated ? 'THE EYE IS BLIND!' : (wasClaws ? 'SEEN BY THE EYE' : 'GAME OVER')
      titleColor = bossDefeated ? '#ffdd00' : (wasClaws ? '#ff6600' : '#ff4444')
    }

    // Meta-progression: save session + check achievements
    const session: SessionRecord = {
      id: 0,
      hero: gs.player.heroType,
      kills: gs.player.kills,
      level: gs.player.level,
      timeMs: survived,
      wave: gs._online ? (gs._networkAdapter?.serverWave || 1) : (gs.waveManager?.currentWave || 1),
      won: networkWon !== undefined ? networkWon : survived >= CONFIG.RUN_DURATION,
      tookDamage: this._tookDamageThisRun,
      date: new Date().toISOString(),
      upgrades: [...gs.upgradeTracker.pickedGeneric, ...Object.keys(gs.upgradeTracker.skillLevels).filter(id => !gs.upgradeTracker.pickedGeneric.has(id))],
      goldEarned: gs._online ? (gs._networkAdapter?.serverSharedGold ?? gs.player.goldThisRun) : gs.player.goldThisRun,
    }
    MetaProgress.recordSession(session)

    // Post-run hero unlocks (ignara / nazar / khashin)
    const newHeroes = MetaProgress.checkPostRunUnlocks(session)
    for (let i = 0; i < newHeroes.length; i++) {
      const delay = i * 2800
      const heroId = newHeroes[i]
      this.time.delayedCall(delay, () => {
        const name = HERO_DISPLAY_NAMES[heroId] ?? heroId
        this._showHeroUnlockPopup(`${name.toUpperCase()} UNLOCKED`, 'A new hero joins your roster')
      })
    }

    // Tutorial quest: "Sand and Steel" — finish a run (any outcome)
    const endedQuestIds = MetaProgress.reportRunEnded(session.won, session.hero)
    for (const qid of endedQuestIds) {
      this._onQuestCompletedMidRun(qid)
    }

    // Log to Supabase (fire-and-forget)
    const playerName = localStorage.getItem('claws_player_name') || 'unknown'
    SessionLogger.logSession({
      player_name: playerName,
      hero: session.hero,
      kills: session.kills,
      level: session.level,
      time_ms: session.timeMs,
      wave: session.wave,
      won: session.won,
      upgrades: session.upgrades,
      date: session.date,
    }).catch(() => {/* silently ignore */})

    const newAchievements = MetaProgress.checkAchievements(session)
    if (newAchievements.length > 0) {
      this.showAchievementNotification(newAchievements)
    }

    // Layout — compute all content heights, then center vertically
    const cx = width / 2
    const mob = this.isMobile
    const portrait = this._isPortrait

    // Responsive panel width: fit within screen with 30px margin each side
    const pw = Math.min(320, width - 60)
    const px = cx - pw / 2

    // Spacing scale — tighter on small screens
    const sp = portrait ? 0.85 : 1

    // ── Pre-compute content heights ────────────────────────────────────
    const titleH = 36                      // title
    const subGap = 6 * sp                  // gap below title
    const subH = 18                        // sub-label
    const afterSubGap = 14 * sp            // gap to stats panel

    const rowH = mob ? 22 : 24
    const goldDisplay = gs._online
      ? `${gs._networkAdapter?.serverSharedGold ?? 0} ✦`
      : `${gs.player.goldThisRun} ✦`
    const panelRows: Array<[string, string, string, string, string, string]> = [
      ['TIME',         timeStr,                               '#aabbcc',
       'KILLS',        String(gs.player.kills),               '#ff8888'],
      ['LEVEL',        String(gs.player.level),               '#66bbff',
       'GOLD',         goldDisplay,                           '#FFD700'],
      ['MINIBOSSES',   String(gs.player.miniBossKills),       '#ffaa44',
       'DMG TAKEN',    Math.round(gs.player.damageTakenThisRun).toLocaleString(), '#ee7777'],
    ]
    const ph = panelRows.length * rowH + 20

    // Skills
    const tracker = gs.upgradeTracker
    const heroType = gs.player.heroType
    const personalIds = Object.keys(tracker.skillLevels).filter(id => !tracker.pickedGeneric.has(id))
    const heroSkills: { label: string; level: number }[] = []
    for (const id of personalIds) {
      const branches = HERO_BRANCHES[heroType] || []
      for (const b of branches) {
        const skill = b.upgrades.find((u: { id: string; label: string }) => u.id === id)
        if (skill) { heroSkills.push({ label: skill.label, level: tracker.skillLevels[id] ?? 1 }); break }
      }
    }
    heroSkills.sort((a, b) => b.level - a.level)
    const maxSkills = portrait ? 3 : 4
    const topSkills = heroSkills.slice(0, maxSkills)
    const skillRowH = mob ? 18 : 20
    const skillSectionH = topSkills.length > 0 ? 16 + topSkills.length * skillRowH + 6 : 0
    const afterStatsGap = 10 * sp

    // Leaderboard
    const lbRows = portrait ? 3 : 5
    const lbRowH = mob ? 20 : 24
    const lbH = 30 + lbRows * lbRowH
    const afterSkillGap = skillSectionH > 0 ? 8 * sp : 0
    const afterLbGap = 16 * sp

    // Buttons
    const btnGap = mob ? 10 : 14
    const btnH1 = mob ? 36 : 40  // Try Again
    const btnH2 = mob ? 28 : 32  // Choose Hero
    const btnH3 = mob ? 28 : 32  // FORGE
    const totalBtnH = btnH1 + btnGap + btnH2 + btnGap + btnH3

    const totalH = titleH + subGap + subH + afterSubGap + ph + afterStatsGap
      + skillSectionH + afterSkillGap + lbH + afterLbGap + totalBtnH

    // Center the whole block vertically, clamp to not go above 5% from top
    const topY = Math.max(height * 0.05, (height - totalH) / 2)
    let cy2 = topY  // running Y cursor

    // ── Title (animated entrance) ─────────────────────────────────────
    const t1 = this.add.text(cx, cy2 + titleH / 2, title, {
      fontFamily: gameFont(), fontSize: mob ? '26px' : '32px', color: titleColor,
    }).setOrigin(0.5).setDepth(31).setAlpha(0).setScale(0.5)
    t1.setShadow(0, 1, '#000000', 2, true, true)
    this.tweens.add({
      targets: t1, alpha: 1, scale: 1,
      duration: 400, ease: 'Back.easeOut', delay: 300,
    })
    cy2 += titleH + subGap

    // ── Hero + wave sub-label ──────────────────────────────────────────
    const heroName = (HERO_DISPLAY_NAMES[gs.player.heroType] ?? gs.player.heroType).toUpperCase()
    const wave = gs._online ? (gs._networkAdapter?.serverWave || 1) : (gs.waveManager?.currentWave || 1)
    const subLabel = this.add.text(cx, cy2 + subH / 2, `${heroName}  ·  WAVE ${wave}`, {
      fontFamily: gameFont(), fontSize: mob ? '12px' : '13px', color: '#8899aa',
    }).setOrigin(0.5).setDepth(32).setAlpha(0)
    this.tweens.add({
      targets: subLabel, alpha: 1,
      duration: 300, delay: 500,
    })
    cy2 += subH + afterSubGap

    // ── Stats panel — 2-column grid (cascade entrance) ───────────────
    const py = cy2
    const col1 = px + 16, col2 = cx + 8
    const panelG = this.add.graphics().setDepth(31)
    panelG.fillStyle(0x1a1a2e, 0.9)
    panelG.fillRoundedRect(px, py, pw, ph, 10)
    panelG.lineStyle(1, 0x444466)
    panelG.strokeRoundedRect(px, py, pw, ph, 10)
    panelG.setAlpha(0)
    this.tweens.add({ targets: panelG, alpha: 1, duration: 300, delay: 600 })

    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: gameFont(), fontSize: mob ? '9px' : '10px', color: '#556677',
    }
    const valStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: gameFont(), fontSize: mob ? '13px' : '15px', color: '#cccccc',
    }

    const statTexts: Phaser.GameObjects.Text[] = []
    const statBaseDelay = 700  // ms after showEndScreen starts
    panelRows.forEach(([ll, lv, lc, rl, rv, rc], i) => {
      const ry = py + 10 + i * rowH
      const rowDelay = statBaseDelay + i * 120
      const t_ll = this.add.text(col1, ry, ll, labelStyle).setOrigin(0, 0).setDepth(32).setAlpha(0)
      const t_lv = this.add.text(col1, ry + 10, lv, { ...valStyle, color: lc }).setOrigin(0, 0).setDepth(32).setAlpha(0)
      const t_rl = this.add.text(col2, ry, rl, labelStyle).setOrigin(0, 0).setDepth(32).setAlpha(0)
      const t_rv = this.add.text(col2, ry + 10, rv, { ...valStyle, color: rc }).setOrigin(0, 0).setDepth(32).setAlpha(0)
      this.tweens.add({ targets: [t_ll, t_lv, t_rl, t_rv], alpha: 1, duration: 200, delay: rowDelay })
      statTexts.push(t_ll, t_lv, t_rl, t_rv,
      )
    })
    cy2 += ph + afterStatsGap

    // ── Hero skills section — top skills by level ──────────────────────
    const skillTexts: Phaser.GameObjects.Text[] = []
    const lastStatDelay = statBaseDelay + (panelRows.length - 1) * 120 + 200
    let lastContentDelay = lastStatDelay
    if (topSkills.length > 0) {
      const skillHeader = this.add.text(cx, cy2 + 2, 'TOP SKILLS', {
        fontFamily: gameFont(), fontSize: mob ? '9px' : '10px', color: '#556677',
      }).setOrigin(0.5, 0).setDepth(32).setAlpha(0)
      this.tweens.add({ targets: skillHeader, alpha: 1, duration: 200, delay: lastStatDelay + 120 })
      skillTexts.push(skillHeader)

      const dots = ['○○○', '●○○', '●●○', '●●●']
      topSkills.forEach((sk, i) => {
        const sy = cy2 + 16 + i * skillRowH
        const skDelay = lastStatDelay + 240 + i * 120
        const skL = this.add.text(col1, sy, sk.label, {
          fontFamily: gameFont(), fontSize: mob ? '12px' : '13px', color: '#ccddee',
        }).setOrigin(0, 0.5).setDepth(32).setAlpha(0)
        const skD = this.add.text(cx + pw / 2 - 16, sy, dots[Math.min(sk.level, 3)], {
          fontFamily: gameFont(), fontSize: mob ? '10px' : '11px', color: sk.level >= 3 ? '#ffcc44' : '#88aacc',
        }).setOrigin(1, 0.5).setDepth(32).setAlpha(0)
        this.tweens.add({ targets: [skL, skD], alpha: 1, duration: 200, delay: skDelay })
        skillTexts.push(skL, skD)
        lastContentDelay = skDelay + 200
      })
      cy2 += skillSectionH + afterSkillGap
    }

    // ── Leaderboard panel ──────────────────────────────────────────────
    const lbW = pw
    const lbX = px, lbY = cy2
    const lbG = this.add.graphics().setDepth(31)
    lbG.fillStyle(0x12122a, 0.9)
    lbG.fillRoundedRect(lbX, lbY, lbW, lbH, 8)
    lbG.lineStyle(1, 0x333355)
    lbG.strokeRoundedRect(lbX, lbY, lbW, lbH, 8)
    lbG.setAlpha(0)
    this.tweens.add({ targets: lbG, alpha: 1, duration: 300, delay: lastContentDelay + 200 })

    const lbTitle = this.add.text(cx, lbY + 12, 'TOP KILLS', {
      fontFamily: gameFont(), fontSize: mob ? '12px' : '13px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(32).setAlpha(0)
    this.tweens.add({ targets: lbTitle, alpha: 1, duration: 200, delay: lastContentDelay + 300 })

    const lbEntries: Phaser.GameObjects.Text[] = [lbTitle]
    const lbLoading = this.add.text(cx, lbY + lbH / 2 + 4, 'Loading...', {
      fontFamily: gameFont(), fontSize: mob ? '11px' : '12px', color: '#666677',
    }).setOrigin(0.5).setDepth(32).setAlpha(0)
    this.tweens.add({ targets: lbLoading, alpha: 1, duration: 200, delay: lastContentDelay + 400 })
    lbEntries.push(lbLoading)

    this._populateEndLeaderboard(cx, lbY, lbLoading, lbEntries, lbRows, lbRowH)
    cy2 += lbH + afterLbGap

    // ── Buttons (fade in last, 600ms after last content) ─────────────
    const btnDelay = lastContentDelay + 600
    const btnStyle = {
      fontFamily: gameFont(), fontSize: mob ? '16px' : '18px', color: '#FFD700',
      backgroundColor: '#2a2a4e', padding: { x: mob ? 16 : 20, y: mob ? 7 : 10 },
    }

    const t5 = this.add.text(cx, cy2 + btnH1 / 2, 'Try Again', btnStyle as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5).setInteractive().setDepth(32).setAlpha(0).setScale(0.9)
    this.tweens.add({ targets: t5, alpha: 1, scale: 1, duration: 300, delay: btnDelay })
    t5.on('pointerover', () => t5.setColor('#ffffff'))
    t5.on('pointerout', () => t5.setColor('#FFD700'))
    t5.on('pointerdown', () => {
      const hero = gs.player.heroType
      const map = gs.scene.key
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop('BastionPickScene'); sm.stop(map); sm.stop('UIScene')
      if ((gs as any)._online) {
        import('../systems/NetworkManager').then(({ networkManager }) => {
          networkManager.leave()
          sm.start('StartScene')
        })
      } else {
        sm.start(map, { hero })
      }
    })
    cy2 += btnH1 + btnGap

    const t6 = this.add.text(cx, cy2 + btnH2 / 2, 'Choose Hero', {
      ...btnStyle, fontSize: mob ? '13px' : '14px', color: '#aaaaaa',
    } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5).setInteractive().setDepth(32).setAlpha(0).setScale(0.9)
    this.tweens.add({ targets: t6, alpha: 1, scale: 1, duration: 300, delay: btnDelay + 80 })
    t6.on('pointerover', () => t6.setColor('#ffffff'))
    t6.on('pointerout', () => t6.setColor('#aaaaaa'))
    t6.on('pointerdown', () => {
      const sceneKey = gs.scene.key
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop(sceneKey); sm.stop('UIScene')
      if ((gs as any)._online) {
        import('../systems/NetworkManager').then(({ networkManager }) => {
          networkManager.leave()
          sm.start('StartScene')
        })
      } else {
        sm.start('StartScene')
      }
    })
    cy2 += btnH2 + btnGap

    // Forge button — gets a glow + pulse + hint label when the player has
    // enough gold for their first meta upgrade and hasn't bought any yet.
    const meta = MetaProgress.load()
    const cheapestFirstCost = Math.min(...META_UPGRADES.map(u => u.costs[0]))
    const hasAnyMetaUpgrade = Object.values(meta.metaUpgrades).some(t => (t || 0) > 0)
    const showForgeHint = !hasAnyMetaUpgrade && meta.goldTotal >= cheapestFirstCost

    const forgeY = cy2 + btnH3 / 2
    const t7 = this.add.text(cx, forgeY, 'FORGE', {
      ...btnStyle, fontSize: mob ? '13px' : '14px', color: '#FFD700',
      backgroundColor: showForgeHint ? '#3a2a05' : '#1a1a0a',
    } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5).setInteractive().setDepth(32).setAlpha(0).setScale(0.9)
    this.tweens.add({ targets: t7, alpha: 1, scale: 1, duration: 300, delay: btnDelay + 160 })
    t7.on('pointerover', () => t7.setColor('#ffffff'))
    t7.on('pointerout', () => t7.setColor('#FFD700'))
    t7.on('pointerdown', () => {
      const sceneKey = gs.scene.key
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop(sceneKey); sm.stop('UIScene')
      sm.start('ForgeScene')
    })

    this.endTexts = [t1, subLabel, t5, t6, t7, panelG as any, lbG as any, ...statTexts, ...skillTexts, ...lbEntries]

    if (showForgeHint) {
      // Glow ring behind the button — sized to match the actual button
      const glow = this.add.graphics().setDepth(31)
      const gw = t7.width + 8, gh = t7.height + 8
      const drawGlow = (alpha: number) => {
        glow.clear()
        glow.lineStyle(2, 0xffd700, alpha)
        glow.strokeRoundedRect(cx - gw / 2, forgeY - gh / 2, gw, gh, 8)
      }
      drawGlow(0.6)
      this.tweens.add({
        targets: { v: 0.3 },
        v: 0.9,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => drawGlow(tw.getValue() ?? 0.6),
      })
      this.tweens.add({
        targets: t7,
        scale: 1.06,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
      const hint = this.add.text(cx, forgeY + gh / 2 + 8, '★ Spend gold on upgrades!', {
        fontFamily: gameFont(), fontSize: mob ? '10px' : '11px', color: '#FFD700',
      }).setOrigin(0.5).setDepth(32)
      this.endTexts.push(glow as any, hint)
    }
  }

  private async _populateEndLeaderboard(
    cx: number,
    lbY: number,
    loadingText: Phaser.GameObjects.Text,
    lbEntries: Phaser.GameObjects.Text[],
    maxRows = 5,
    rowH = 24,
  ) {
    const localPlayer = localStorage.getItem('claws_player_name') || ''
    const { data, error } = await supabase
      .from('sessions')
      .select('player_name, hero, kills, level, time_ms')
      .order('kills', { ascending: false })
      .limit(maxRows)

    // Scene may have been torn down (Try Again, Choose Hero, etc.)
    if (!this.scene.isActive() || !loadingText.active) return

    if (error || !data) {
      loadingText.setText(error ? 'Could not load scores.' : 'No scores yet.')
      loadingText.setColor('#ff8888')
      return
    }

    if (data.length === 0) {
      loadingText.setText('No runs recorded yet.')
      return
    }

    loadingText.destroy()
    // Drop the loading placeholder from endTexts so cleanup() doesn't double-free
    const loadingIdx = lbEntries.indexOf(loadingText)
    if (loadingIdx >= 0) lbEntries.splice(loadingIdx, 1)

    const mob = isMobileUserAgent()
    data.forEach((entry, i) => {
      const m = Math.floor(entry.time_ms / 60000)
      const s = Math.floor((entry.time_ms % 60000) / 1000)
      const t = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      const isLocal = localPlayer && entry.player_name === localPlayer
      const color = isLocal ? '#ffdd44' : '#aaaaaa'
      const heroLabel = (HERO_DISPLAY_NAMES[entry.hero] || entry.hero).slice(0, 7).padEnd(7)
      const nameLabel = (entry.player_name || '???').slice(0, 8).padEnd(8)
      const txt = this.add.text(cx, lbY + 26 + i * rowH,
        `${i + 1}. ${nameLabel} ${heroLabel} ${String(entry.kills).padStart(4)}k  ${t}  L${entry.level}`,
        { fontFamily: gameFont(), fontSize: mob ? '10px' : '11px', color }
      ).setOrigin(0.5).setDepth(32)
      lbEntries.push(txt)
      this.endTexts.push(txt)
    })
  }

  private showAchievementNotification(ids: string[]) {
    const { width } = this.scale
    const defs = MetaProgress.getAchievementDefs()
    const names = ids.map(id => defs.find(d => d.id === id)?.name || id)

    const banner = this.add.graphics().setDepth(50)
    const bannerH = 30 + names.length * 22
    const bannerY = 80
    banner.fillStyle(0x1a1a2e, 0.95)
    banner.fillRoundedRect(width / 2 - 140, bannerY, 280, bannerH, 8)
    banner.lineStyle(2, 0xffd700)
    banner.strokeRoundedRect(width / 2 - 140, bannerY, 280, bannerH, 8)

    const title = this.add.text(width / 2, bannerY + 14, 'ACHIEVEMENT UNLOCKED!', {
      fontFamily: gameFont(), fontSize: '12px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(51)

    const nameTexts = names.map((name, i) =>
      this.add.text(width / 2, bannerY + 34 + i * 22, `★ ${name}`, {
        fontFamily: gameFont(), fontSize: '13px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(51)
    )

    // Fade out after 4 seconds
    this.tweens.add({
      targets: [banner, title, ...nameTexts],
      alpha: 0,
      duration: 1000,
      delay: 4000,
      onComplete: () => {
        banner.destroy()
        title.destroy()
        nameTexts.forEach(t => t.destroy())
      },
    })
  }

  /**
   * Paints the top XP bar (bg + fill + shimmer glints) directly onto the HUD
   * graphics without clearing it. Called from the dirty-redraw path AND from
   * the non-dirty path so the VS-style shimmer keeps animating every frame
   * while the rest of the HUD skips redraw when nothing else changed.
   */
  private drawXpShimmer(p: Player) {
    const g = this._xpShimmerGfx
    g.clear()
    const screenW = this.scale.width
    const xpPad = 40
    const xpTopY = 4
    const xpFullW = screenW - xpPad * 2
    const xpTopH = 15
    const xpRatio = p.xp / p.xpToNextLevel()
    const xpFillW = Math.floor(xpFullW * xpRatio)
    g.fillStyle(0x080818, 0.8)
    g.fillRoundedRect(xpPad, xpTopY, xpFullW, xpTopH, 4)
    if (xpFillW > 0) {
      g.fillStyle(0x2266cc)
      g.fillRoundedRect(xpPad, xpTopY, xpFillW, xpTopH, 4)
      g.fillStyle(0x4499ff, 0.6)
      g.fillRect(xpPad + 2, xpTopY + 1, xpFillW - 4, 3)
      g.fillStyle(0x88ccff, 0.4)
      g.fillRect(xpPad + 2, xpTopY + 2, xpFillW - 4, 1)
      g.fillStyle(0x001133, 0.4)
      g.fillRect(xpPad + 2, xpTopY + xpTopH - 3, xpFillW - 4, 2)
      const t = this.time.now * 0.002
      for (let i = 0; i < 3; i++) {
        const glintX = xpPad + ((t * 80 + i * xpFullW / 3) % xpFillW)
        if (glintX > xpPad && glintX < xpPad + xpFillW - 8) {
          g.fillStyle(0xffffff, 0.25 + Math.sin(t + i * 2) * 0.15)
          g.fillRect(glintX, xpTopY + 2, 6, xpTopH - 4)
          g.fillStyle(0xaaddff, 0.3)
          g.fillRect(glintX + 2, xpTopY + 1, 2, xpTopH - 2)
        }
      }
    }
    g.lineStyle(1, 0x1a2244, 0.6)
    g.strokeRoundedRect(xpPad, xpTopY, xpFullW, xpTopH, 4)
  }

  private cleanup() {
    this.clearPause()
    // Kill any active tweens targeting end-screen objects before destroying
    // them — the forge-hint glow tween and t7 scale pulse run onUpdate callbacks
    // that otherwise fire on freed targets and throw.
    this.endTexts.forEach((t) => this.tweens.killTweensOf(t))
    this.endTexts.forEach((t) => t.destroy())
    this.endTexts = []
    this.overlay.setAlpha(0)
  }

  /** Redraws gleam sweeps on the dedicated gleam graphics layer (runs every 50ms independent of HUD). */
  private drawMinimap() {
    const mm = this.minimap
    mm.clear()

    const portrait = this.isMobile && this._isPortrait
    const size = portrait ? 90 : CONFIG.MINIMAP_SIZE
    const margin = CONFIG.MINIMAP_MARGIN
    const { width } = this.scale
    const mapX = width - size - margin - 4
    const mapY = margin + (this.isMobile ? 76 : 92)

    // Background with frame
    mm.fillStyle(0x0a0a1a, 0.75)
    mm.fillRoundedRect(mapX - 2, mapY - 2, size + 4, size + 4, 4)
    mm.fillStyle(0x111122, 0.85)
    mm.fillRect(mapX, mapY, size, size)

    // Update clip mask position — only on resize
    if (this._mmMaskDirty && this.mmMaskShape) {
      this.mmMaskShape.clear()
      this.mmMaskShape.fillStyle(0xffffff)
      this.mmMaskShape.fillRect(mapX, mapY, size, size)
      this._mmMaskDirty = false
    }

    // Border frame
    mm.lineStyle(2, 0x444466)
    mm.strokeRoundedRect(mapX - 2, mapY - 2, size + 4, size + 4, 4)

    // Corner accents
    mm.fillStyle(0x666688)
    mm.fillRect(mapX - 2, mapY - 2, 6, 2)
    mm.fillRect(mapX - 2, mapY - 2, 2, 6)
    mm.fillRect(mapX + size - 4, mapY - 2, 6, 2)
    mm.fillRect(mapX + size, mapY - 2, 2, 6)
    mm.fillRect(mapX - 2, mapY + size - 4, 2, 6)
    mm.fillRect(mapX - 2, mapY + size, 6, 2)
    mm.fillRect(mapX + size, mapY + size - 4, 2, 6)
    mm.fillRect(mapX + size - 4, mapY + size, 6, 2)

    const gs = this.gameScene
    if (!gs?.player) return

    const playerX = gs.player.x
    const playerY = gs.player.y
    const radius = CONFIG.MINIMAP_WORLD_RADIUS
    const scale = size / (radius * 2)
    const half = size / 2

    // Helper: world coord → minimap pixel
    const toMmX = (wx: number) => mapX + half + (wx - playerX) * scale
    const toMmY = (wy: number) => mapY + half + (wy - playerY) * scale

    // Zone rings from world origin (0,0)
    const zoneRings: [number, number, number][] = [
      [600,  0x888888, 0.3],
      [1200, 0x448844, 0.3],
      [1800, 0x888866, 0.3],
      [2400, 0x446644, 0.3],
    ]
    const ox = toMmX(0)
    const oy = toMmY(0)
    for (const [worldRadius, color, alpha] of zoneRings) {
      mm.lineStyle(1, color, alpha)
      mm.strokeCircle(ox, oy, worldRadius * scale)
    }

    // Enemies as colored dots — batched by color to minimize fillStyle calls
    const enemyChildren = gs.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
    mm.fillStyle(0xcccccc)
    for (const enemy of enemyChildren) {
      if (!enemy.active) continue
      const e = enemy as any
      if (e.isFlying || e.isSandGolem) continue
      const ex = toMmX(enemy.x), ey = toMmY(enemy.y)
      if (ex < mapX || ex > mapX + size || ey < mapY || ey > mapY + size) continue
      mm.fillRect(ex - 0.75, ey - 0.75, 1.5, 1.5)
    }
    mm.fillStyle(0xff4444)
    for (const enemy of enemyChildren) {
      if (!enemy.active) continue
      if (!(enemy as any).isFlying) continue
      const ex = toMmX(enemy.x), ey = toMmY(enemy.y)
      if (ex < mapX || ex > mapX + size || ey < mapY || ey > mapY + size) continue
      mm.fillRect(ex - 0.75, ey - 0.75, 1.5, 1.5)
    }
    mm.fillStyle(0xff8800)
    for (const enemy of enemyChildren) {
      if (!enemy.active) continue
      if (!(enemy as any).isSandGolem) continue
      const ex = toMmX(enemy.x), ey = toMmY(enemy.y)
      if (ex < mapX || ex > mapX + size || ey < mapY || ey > mapY + size) continue
      mm.fillRect(ex - 1.5, ey - 1.5, 3, 3)
    }

    // Remote teammates as green dots
    if (gs._networkAdapter) {
      gs._networkAdapter.remotePlayers?.forEach((remote: any) => {
        if (!remote.sprite?.active) return
        const rx = toMmX(remote.sprite.x)
        const ry = toMmY(remote.sprite.y)
        if (rx < mapX || rx > mapX + size || ry < mapY || ry > mapY + size) return
        mm.fillStyle(0x44ff44, 1)
        mm.fillCircle(rx, ry, 2.5)
      })
    }

    // Player — always at center
    mm.fillStyle(0x00ff66)
    mm.fillCircle(mapX + half, mapY + half, 3)
    mm.lineStyle(1, 0x00ff66, 0.4)
    mm.strokeCircle(mapX + half, mapY + half, 5)

    // Sifra NPC marker (tutorial quest 3) — shown only when active
    if (!this._tutorialComplete && gs.selectedHeroType === 'amun' && gs.sifraNpcX) {
      // Track first appearance to start the pulse anchor time
      if (this._sifraMarkerSince === 0) this._sifraMarkerSince = this.time.now
      const sinceMs = this.time.now - this._sifraMarkerSince
      // Pulse forever (but more intense in first 6s after appearing)
      const pulseT = (Math.sin(sinceMs / 220) + 1) / 2  // 0..1
      const intro = Math.max(0, 1 - sinceMs / 6000)     // 1..0 over 6s
      const baseR = 3
      const ringR = baseR + 3 + pulseT * (4 + intro * 6)
      const ringAlpha = 0.35 + pulseT * 0.5

      const sx = toMmX(gs.sifraNpcX)
      const sy = toMmY(gs.sifraNpcY)
      if (sx >= mapX && sx <= mapX + size && sy >= mapY && sy <= mapY + size) {
        // Expanding pulse ring
        mm.lineStyle(1.5 + intro, 0x82ccdd, ringAlpha)
        mm.strokeCircle(sx, sy, ringR)
        // Solid core dot
        mm.fillStyle(0xaaeeff, 1)
        mm.fillCircle(sx, sy, baseR)
        mm.lineStyle(1, 0xffffff, 0.9)
        mm.strokeCircle(sx, sy, 5)
      } else {
        // Off-screen: arrow at minimap edge pointing toward NPC, also pulses
        const angle = Math.atan2(sy - (mapY + half), sx - (mapX + half))
        const ex = mapX + half + Math.cos(angle) * (half - 6)
        const ey = mapY + half + Math.sin(angle) * (half - 6)
        mm.lineStyle(1.5 + intro, 0x82ccdd, ringAlpha)
        mm.strokeCircle(ex, ey, ringR)
        mm.fillStyle(0xaaeeff, 1)
        mm.fillCircle(ex, ey, baseR)
      }
    } else {
      this._sifraMarkerSince = 0
    }
  }

  update() {
    if (!this.gameScene?.localPlayer) return
    const p = this.gameScene.localPlayer

    // God mode: keep HP full
    if (this._cheatGodMode && p.hp > 0) {
      p.hp = p.maxHp
    }

    // Detect player death directly
    if (p.hp <= 0 && !this.endScreenShown) {
      this.endScreenShown = true
      this.vignetteGfx.clear()
      // If a LevelUpScene is active (normal level-up or bonus spec picker),
      // it would stay on top of the end screen and trap the player. Kill it
      // and resume GameScene so showEndScreen renders cleanly.
      const lus = this.scene.get('LevelUpScene')
      if (lus && this.scene.isActive('LevelUpScene')) {
        this.scene.stop('LevelUpScene')
        if (this.scene.isPaused(this.gameScene.scene.key)) {
          this.scene.resume(this.gameScene.scene.key)
        }
      }
      this.time.delayedCall(600, () => this.showEndScreen())
      return
    }
    if (this.endScreenShown) return

    // --- Low HP vignette (red pulse at screen edges when HP <= 20%) ---
    // Draw shape ONCE on state enter, then pulse via setAlpha (1 prop write/frame).
    {
      const hpRatio = p.hp / (p.maxHp || 1)
      const v = this.vignetteGfx
      const vignetteVisible = !this.isPaused && hpRatio <= 0.2 && hpRatio > 0
      if (vignetteVisible && !this._vignetteWasVisible) {
        // Entering low-HP — draw shape once at peak intensity.
        // UIScene camera may be zoomed (0.92 on mobile), so visible world bounds
        // are larger than this.scale.width/height. Compute actual visible edges.
        v.clear()
        const z = this.cameras.main.zoom || 1
        const sw_ = this.scale.width
        const sh_ = this.scale.height
        const ox = sw_ * (1 - 1 / z) / 2
        const oy = sh_ * (1 - 1 / z) / 2
        const vw = sw_ / z
        const vh = sh_ / z
        const edgeW = 75
        const strips = 10
        const stripW = edgeW / strips
        for (let i = 0; i < strips; i++) {
          const t = i / strips
          const a = 0.5 * (1 - t) * (1 - t)
          const pos = i * stripW
          v.fillStyle(0xff0000, a)
          // Left edge
          v.fillRect(ox + pos, oy, stripW + 1, vh)
          // Right edge
          v.fillRect(ox + vw - pos - stripW, oy, stripW + 1, vh)
          // Top edge
          v.fillRect(ox, oy + pos, vw, stripW + 1)
          // Bottom edge
          v.fillRect(ox, oy + vh - pos - stripW, vw, stripW + 1)
        }
      }
      if (vignetteVisible) {
        v.setAlpha(0.6 + 0.4 * Math.sin(this.time.now / 200))
      } else if (this._vignetteWasVisible) {
        v.clear()
        v.setAlpha(1)
      }
      this._vignetteWasVisible = vignetteVisible
    }

    // --- Quest time tracking (once per second) ---
    const curTimeMsForQuest = this.gameScene.gameTime
    const curTimeSecForQuest = Math.floor(curTimeMsForQuest / 1000)
    if (curTimeSecForQuest !== this._lastElapsedSec) {
      this._lastElapsedSec = curTimeSecForQuest
      MetaProgress.reportTimeMs(curTimeMsForQuest)
      this._refreshQuestPanel()
    }

    // --- Timer text + pulse animation ---
    const remaining = Math.max(0, CONFIG.RUN_DURATION - this.gameScene.gameTime)
    const curTimeSec = Math.floor(remaining / 1000)
    if (curTimeSec !== this._lastRemainingSec) {
      this._lastRemainingSec = curTimeSec
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      this.timerText.setText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
      if (remaining < 60000) {
        this.timerText.setColor('#ff4444')
      } else if (remaining < 120000) {
        this.timerText.setColor('#ffaa44')
      } else {
        this.timerText.setColor('#ffffff')
      }
    }
    if (remaining < 60000) {
      this.timerText.setScale(0.85 + Math.sin(this.gameScene.gameTime / 200) * 0.15)
    } else {
      this.timerText.setScale(1)
    }

    // --- Dirty-flag check: gather current driving values ---
    const curHp        = p.hp
    const curMaxHp     = p.maxHp
    const curXp        = p.xp
    const curXpMax     = p.xpToNextLevel()
    const curLevel     = p.level
    const curKills     = p.kills
    const curGold      = p.goldThisRun

    // Hero-specific energy bars
    let curEnergy1 = 0, curEnergy2 = 0
    if (p.heroType === 'sifra') {
      curEnergy1 = p.iceEnergy; curEnergy2 = p.lightningEnergy
    } else if (p.heroType === 'nazar') {
      curEnergy1 = p.swordEnergy; curEnergy2 = p.venomEnergy
    } else if (p.heroType === 'huntress') {
      curEnergy1 = p.meleeEnergy; curEnergy2 = p.spearEnergy
    } else if (p.heroType === 'khashin') {
      curEnergy1 = p.windEnergy; curEnergy2 = p.sandEnergy
    } else if (p.heroType === 'amun' && p.hasQuakeStance) {
      curEnergy1 = p.groundEnergy; curEnergy2 = p.quakeEnergy
    } else if (p.heroType === 'vael') {
      curEnergy1 = p.orbsEnergy; curEnergy2 = p.drainEnergy
    }

    // Force redraw during flash or critical HP pulse
    const hpCritNow = curHp / (curMaxHp || 1) <= 0.3 && curHp > 0
    const dirty =
      curHp        !== this._lastHp      ||
      curMaxHp     !== this._lastMaxHp   ||
      curXp        !== this._lastXp      ||
      curXpMax     !== this._lastXpMax   ||
      curLevel     !== this._lastLevel   ||
      curEnergy1   !== this._lastEnergy1 ||
      curEnergy2   !== this._lastEnergy2 ||
      curKills     !== this._lastKills   ||
      curGold      !== this._lastGold    ||
      curTimeSec   !== this._lastRemainingSec ||
      p.flashpointRemaining !== this._lastFlashpointRemaining ||
      p.hasPhoenixHeart     !== this._lastPhoenixHeart        ||
      p.firestormOrbCount   !== this._lastFirestormOrbCount   ||
      this.time.now < this._critFlashUntil ||
      this.time.now < this._hpFlashUntil ||
      hpCritNow

    if (!dirty) {
      // Shimmer-only path: the XP bar glints need a continuous redraw, but
      // re-painting the entire HUD every frame is wasteful. We overdraw just
      // the XP bar region on top of the existing hud graphics (no g.clear()),
      // which fully covers the prior-frame glints with fresh ones.
      this.drawXpShimmer(p)
      this._mmFrame = ((this._mmFrame || 0) + 1) % 3
      if (this._mmFrame === 0) this.drawMinimap()
      return
    }

    // Detect damage BEFORE caching (so _lastHp still has old value)
    const tookDamage = curHp < this._lastHp && this._lastHp > 0
    if (tookDamage) this._tookDamageThisRun = true

    // Update cached values
    this._lastHp                    = curHp
    this._lastMaxHp                 = curMaxHp
    this._lastXp                    = curXp
    this._lastXpMax                 = curXpMax
    this._lastLevel                 = curLevel
    this._lastEnergy1               = curEnergy1
    this._lastEnergy2               = curEnergy2
    this._lastKills                 = curKills
    this._lastGold                  = curGold
    this._lastRemainingSec          = curTimeSec
    this._lastFlashpointRemaining   = p.flashpointRemaining
    this._lastPhoenixHeart          = p.hasPhoenixHeart
    this._lastFirestormOrbCount     = p.firestormOrbCount

    // Kill milestone announcements
    for (const [threshold, label] of KILL_MILESTONES) {
      if (curKills >= threshold && !this._killMilestones.has(threshold)) {
        this._killMilestones.add(threshold)
        this.showAnnounce(label)
      }
    }


    const g = this.hud
    g.clear()

    const _portrait = this.isMobile && this._isPortrait

    // === HERO COLOR for LVL circle border ===
    const heroColor = HERO_COLORS[p.heroType] ?? 0xaaaaaa

    // === LAYOUT CONSTANTS ===
    // LVL circle at far left, then bars to its right — anchored to bottom-left
    const scale = 1.25
    const lvlSize = Math.round(48 * scale)
    const lvlX = 4                             // circle left edge
    const lvlCX = lvlX + lvlSize / 2           // circle center X
    const barX = lvlX + lvlSize + 4            // bars start after circle
    const ebW = Math.round(95 * scale), ebGap = 3
    const barW = ebW * 2 + ebGap               // HP bar = combined energy width
    const hpBarH = Math.round(22 * scale), ebH = Math.round(5 * scale)
    const pipH = Math.round(7 * scale)
    const blockBottomY = this.scale.height - (this.isMobile ? 12 : 36)
    const hpBarY = blockBottomY - hpBarH       // HP on bottom
    const ebY = hpBarY - ebH - 2               // thin energy bars just above HP
    const pipY = ebY - pipH - 2                // mastery pips above energy
    const lvlCY = hpBarY + hpBarH / 2          // vertically center with HP bar

    // === LVL CIRCLE (left of bars) ===
    g.fillStyle(0x0a0a1a, 0.8)
    g.fillCircle(lvlCX, lvlCY, lvlSize / 2)
    g.lineStyle(2, heroColor, 0.8)
    g.strokeCircle(lvlCX, lvlCY, lvlSize / 2)
    this.lvlText.setText(`LVL ${p.level}`)
    this.lvlText.setPosition(lvlCX, lvlCY).setOrigin(0.5)

    // === HP BAR (same width as combined energy) ===
    const hpRatio = Math.max(0, p.hp / p.maxHp)
    const now = this.time.now
    const isCritical = hpRatio <= 0.3 && hpRatio > 0

    if (tookDamage && now > this._critFlashUntil + 300) this._critFlashUntil = now + 50
    if (isCritical) this._critPulse += 1
    else this._critPulse = 0
    const isFlashing = now < this._critFlashUntil || (isCritical && (Math.floor(this._critPulse / 8) % 2 === 0))

    const hpR = Math.round(hpBarH / 2)
    g.fillStyle(0x111122, 0.6)
    g.fillRoundedRect(barX, hpBarY, barW, hpBarH, hpR)
    const hpFillW = Math.floor(barW * hpRatio)
    if (hpFillW > 0) {
      const c = isFlashing ? 0xffffff : hpRatio > 0.5 ? 0xcc2222 : hpRatio > 0.25 ? 0xdd6622 : 0xff2222
      g.fillStyle(c)
      g.fillRoundedRect(barX + 1, hpBarY + 1, Math.max(0, hpFillW - 2), hpBarH - 2, hpR - 1)
      // Subtle top highlight
      g.fillStyle(0xffffff, 0.12)
      g.fillRoundedRect(barX + 2, hpBarY + 2, Math.max(0, hpFillW - 4), Math.floor(hpBarH * 0.35), hpR - 2)
    }
    // Glass gold border
    g.lineStyle(1, 0xffd700, 0.25)
    g.strokeRoundedRect(barX, hpBarY, barW, hpBarH, hpR)
    // HP shimmer on damage
    if (tookDamage && this.time.now > (this._hpFlashUntil ?? 0)) {
      this._hpFlashUntil = this.time.now + 150
    }
    if (this.time.now < (this._hpFlashUntil ?? 0)) {
      const flashAlpha = 0.3 * (1 - (this.time.now - ((this._hpFlashUntil ?? 0) - 150)) / 150)
      if (flashAlpha > 0) {
        g.fillStyle(0xffffff, flashAlpha)
        g.fillRoundedRect(barX, hpBarY, barW, hpBarH, hpR)
      }
    }

    this.hpText.setText(`${Math.ceil(p.hp)}/${p.maxHp}`)
    this.hpText.setPosition(barX + barW / 2, hpBarY + hpBarH / 2).setOrigin(0.5)

    // === XP (top bar, full width) ===
    this.drawXpShimmer(p)

    // === ENERGY BARS (directly below HP, aligned) ===
    const hasEnergy = (p.heroType === 'sifra' || p.heroType === 'nazar' || p.heroType === 'huntress' || p.heroType === 'khashin' || (p.heroType === 'amun' && p.hasQuakeStance) || p.heroType === 'vael')
    if (hasEnergy) {
      const rightBarX = barX + ebW + ebGap

      const ebR = Math.floor(ebH / 2)
      const drawDualBars = (
        leftRatio: number, leftActive: number, leftDim: number, _leftBorder: number,
        rightRatio: number, rightActive: number, rightDim: number, _rightBorder: number,
        leftIsActive: boolean, rightIsActive: boolean,
      ) => {
        // Left bar
        g.fillStyle(0x111122, 0.6)
        g.fillRoundedRect(barX, ebY, ebW, ebH, ebR)
        if (leftRatio > 0) {
          g.fillStyle(leftIsActive ? leftActive : leftDim, leftIsActive ? 1 : 0.55)
          g.fillRoundedRect(barX + 1, ebY + 1, Math.max(0, (ebW - 2) * leftRatio), ebH - 2, Math.max(0, ebR - 1))
        }
        g.lineStyle(1, 0xffd700, 0.25)
        g.strokeRoundedRect(barX, ebY, ebW, ebH, ebR)
        // Right bar
        g.fillStyle(0x111122, 0.6)
        g.fillRoundedRect(rightBarX, ebY, ebW, ebH, ebR)
        if (rightRatio > 0) {
          g.fillStyle(rightIsActive ? rightActive : rightDim, rightIsActive ? 1 : 0.55)
          g.fillRoundedRect(rightBarX + 1, ebY + 1, Math.max(0, (ebW - 2) * rightRatio), ebH - 2, Math.max(0, ebR - 1))
        }
        g.lineStyle(1, 0xffd700, 0.25)
        g.strokeRoundedRect(rightBarX, ebY, ebW, ebH, ebR)
      }

      if (p.heroType === 'sifra')
        drawDualBars(p.iceEnergy / p.maxEnergy, 0x55aaff, 0x2a5580, 0x335577,
          p.lightningEnergy / p.maxEnergy, 0x9966ff, 0x4a3380, 0x553377,
          p.stance === 'ice', p.stance === 'lightning')
      else if (p.heroType === 'nazar')
        drawDualBars(p.swordEnergy / p.maxEnergy, 0xcc4444, 0x662222, 0x553333,
          p.venomEnergy / p.maxEnergy, 0x44cc44, 0x226622, 0x335533,
          p.nazarStance === 'sword', p.nazarStance === 'venom')
      else if (p.heroType === 'huntress')
        drawDualBars(p.meleeEnergy / p.maxEnergy, 0xe67e22, 0x734011, 0x553311,
          p.spearEnergy / p.maxEnergy, 0x2ecc71, 0x176638, 0x115533,
          p.huntressStance === 'melee', p.huntressStance === 'spear')
      else if (p.heroType === 'khashin')
        drawDualBars(p.windEnergy / p.maxEnergy, 0x88ddff, 0x446688, 0x335577,
          p.sandEnergy / p.maxEnergy, 0xddaa44, 0x6e5522, 0x554411,
          p.khashinStance === 'sirocco', p.khashinStance === 'haboob')
      else if (p.heroType === 'amun' && p.hasQuakeStance)
        drawDualBars(p.groundEnergy / p.maxEnergy, 0xddaa22, 0x6e5511, 0x554411,
          p.quakeEnergy / p.maxEnergy, 0xff8833, 0x7a4419, 0x553311,
          p.amunStance === 'melee', p.amunStance === 'quake')
      else if (p.heroType === 'vael')
        drawDualBars(p.orbsEnergy / p.maxEnergy, 0xaaddff, 0x5577aa, 0x446688,
          p.drainEnergy / p.maxEnergy, 0x44dd66, 0x227733, 0x115522,
          p.vaelStance === 'orbs', p.vaelStance === 'drain')
    } else {
      // === MASTERY BAR for heroes without stances ===
      const masteryBranches: Record<string, string> = {
        ignara: 'fireball', muller: 'crystal', amun: 'ground',
      }
      const masteryColors: Record<string, number> = {
        fireball: 0xff6600, crystal: 0x44aaff, ground: 0xddaa22,
      }
      const branch = masteryBranches[p.heroType]
      if (branch) {
        const xp = p.branchMasteryXP[branch] ?? 0
        const level = p.getMasteryLevel(branch)
        const color = masteryColors[branch] ?? 0xaaaaaa
        const thresholds = Player.getMasteryThresholds(branch)
        const nextThreshold = level < 3 ? thresholds[level] : thresholds[2]
        const prevThreshold = level > 0 ? thresholds[level - 1] : 0
        const progress = level >= 3 ? 1 : Math.min(1, (xp - prevThreshold) / (nextThreshold - prevThreshold))
        const filledW = Math.floor(barW * progress)

        // Background
        const mR = Math.floor(ebH / 2)
        g.fillStyle(0x111122, 0.6)
        g.fillRoundedRect(barX, ebY, barW, ebH, mR)
        // Fill
        if (filledW > 0) {
          g.fillStyle(color, 0.7)
          g.fillRoundedRect(barX, ebY, filledW, ebH, mR)
        }
        g.lineStyle(1, 0xffd700, 0.25)
        g.strokeRoundedRect(barX, ebY, barW, ebH, mR)

        // XP label
        const xpLabel = level >= 3 ? 'MAX' : `${Math.floor(xp)}/${nextThreshold}`
        this._masteryLabel = this._masteryLabel ?? this.add.text(0, 0, '', {
          fontFamily: gameFont(), fontSize: '8px', color: '#888888',
        }).setDepth(5).setOrigin(0.5)
        this._masteryLabel.setText(xpLabel).setPosition(barX + barW / 2, ebY + ebH / 2)
        this._masteryLabel.setColor(level >= 3 ? '#ffdd44' : '#888888')
      }
    }

    // === MASTERY DIAMONDS (row above energy bars) ===
    {
      const starY = pipY + pipH / 2
      const dSize = Math.round(4 * scale)
      const gap = Math.round(dSize * 2.2)

      const drawDiamond = (cx: number, cy: number, size: number, filled: boolean, color: number) => {
        if (filled) {
          g.fillStyle(color, 1)
          g.beginPath()
          g.moveTo(cx, cy - size)
          g.lineTo(cx + size, cy)
          g.lineTo(cx, cy + size)
          g.lineTo(cx - size, cy)
          g.closePath()
          g.fillPath()
        } else {
          g.lineStyle(1.2, color, 0.4)
          g.beginPath()
          g.moveTo(cx, cy - size)
          g.lineTo(cx + size, cy)
          g.lineTo(cx, cy + size)
          g.lineTo(cx - size, cy)
          g.closePath()
          g.strokePath()
        }
      }

      const drawStars = (branch: string, startX: number, color: number) => {
        const level = p.getMasteryLevel(branch)
        for (let i = 0; i < 3; i++) {
          const cx = startX + i * gap
          drawDiamond(cx, starY, dSize, i < level, color)
        }
      }

      if (hasEnergy) {
        const rightBarX = barX + ebW + ebGap
        const hb = HUD_HERO_BRANCHES[p.heroType]
        let branches: [string, string] | null = hb && hb.length >= 2 ? [hb[0], hb[1]] : null
        if (p.heroType === 'amun' && p.hasQuakeStance) branches = ['ground', 'quake']
        if (branches) {
          drawStars(branches[0], barX + 8, BRANCH_COLOR[branches[0]] ?? 0xaaaaaa)
          drawStars(branches[1], rightBarX + 8, BRANCH_COLOR[branches[1]] ?? 0xaaaaaa)
        }
      } else {
        const branch = p.heroType === 'ignara' ? 'fireball' : p.heroType === 'muller' ? 'crystal' : 'combat'
        if (branch !== 'combat') {
          drawStars(branch, barX + 8, BRANCH_COLOR[branch] ?? 0xaaaaaa)
        }
      }
    }

    // === BIG BUFF ICONS (unified row below HP/energy) ===
    {
      // Buff icons — top-left area (HP moved to bottom)
      const buffStartY = _portrait ? 130 : 28
      const buffSize = 48
      const buffGap = 4
      const buffX = 8
      let bi = 0
      const now = this.gameScene.time.now

      // Hide all previous icons/labels
      for (const obj of this._bigBuffObjs) if (obj) obj.setVisible(false)

      const drawBigBuff = (frame: number, borderColor: number, text?: string, alphaVal = 0.9, timerFrac?: number) => {
        const bx = buffX + bi * (buffSize + buffGap)
        const by = buffStartY

        g.fillStyle(0x0a0a1a, 0.7)
        g.fillRoundedRect(bx, by, buffSize, buffSize, 5)
        g.lineStyle(1, borderColor, 0.7)
        g.strokeRoundedRect(bx, by, buffSize, buffSize, 5)

        // Timer sweep overlay (darkened expired portion)
        if (timerFrac !== undefined) {
          const darkH = Math.floor(buffSize * (1 - Math.max(0, Math.min(1, timerFrac))))
          if (darkH > 0) {
            g.fillStyle(0x000000, 0.5)
            g.fillRect(bx + 1, by + 1, buffSize - 2, darkH)
          }
        }

        // Icon sprite
        const iconIdx = bi * 2
        if (!this._bigBuffObjs[iconIdx]) {
          this._bigBuffObjs[iconIdx] = this.add.image(0, 0, 'skill_icons', frame)
            .setDisplaySize(buffSize - 6, buffSize - 6).setDepth(2).setOrigin(0.5)
        }
        const icon = this._bigBuffObjs[iconIdx] as Phaser.GameObjects.Image
        icon.setPosition(bx + buffSize / 2, by + buffSize / 2)
        icon.setFrame(frame); icon.setAlpha(alphaVal); icon.setVisible(true)

        // Label
        const lblIdx = bi * 2 + 1
        if (!this._bigBuffObjs[lblIdx]) {
          this._bigBuffObjs[lblIdx] = this.add.text(0, 0, '', {
            fontFamily: gameFont(), fontSize: '24px', color: '#ffffff',
          }).setDepth(3).setOrigin(0.5)
        }
        const lbl = this._bigBuffObjs[lblIdx] as Phaser.GameObjects.Text
        lbl.setPosition(bx + buffSize / 2, by + buffSize / 2)
        if (text) { lbl.setText(text); lbl.setVisible(true) } else lbl.setVisible(false)

        bi++
      }

      // --- Pickup buffs (timed) ---
      if (p.shieldHp > 0 && p.shieldTimer > 0)
        drawBigBuff(9, 0x4488ff, `${Math.ceil(p.shieldTimer / 1000)}`, 0.9, p.shieldTimer / 10000)
      if (p.speedBuffUntil > now)
        drawBigBuff(1, 0xffdd44, `${Math.ceil((p.speedBuffUntil - now) / 1000)}`, 0.9, (p.speedBuffUntil - now) / 8000)

      // --- Stone Skin (Givi) ---
      if (p.hasStoneSkin && p.stoneSkinStacks > 0)
        drawBigBuff(60, 0x99ddcc, `${p.stoneSkinStacks}`)

      // --- Ice Armor (Sifra) ---
      if (p.hasIceArmor && p.iceArmorHP > 0)
        drawBigBuff(51, 0x88ddff, `${Math.ceil(p.iceArmorHP)}`)

      // --- Undying rebirth stacks (Amun) ---
      if (p.rebirthStacks > 0)
        drawBigBuff(63, 0xfff200, `${p.rebirthStacks}`)

      // --- Firestorm orbs (Ignara Inferno) ---
      if (p.firestormOrbCount > 0)
        drawBigBuff(14, 0xff6600, `${p.firestormOrbCount}`)

      // --- Phoenix Heart (Ignara) — shows while revive is available ---
      if (p.hasPhoenixHeart)
        drawBigBuff(19, 0xff4400, '✦')

      // --- Flashpoint charges (Ignara Wildfire) — bh4 ---
      if (p.hasFlashpoint)
        drawBigBuff(103, 0xff8800, p.flashpointRemaining > 0 ? `${p.flashpointRemaining}` : undefined, p.flashpointRemaining > 0 ? 0.9 : 0.30)

      // --- Infernal Cadence (Ignara Wildfire) — bh5 — active timer OR cooldown sweep ---
      if (p.hasInfernalCadence) {
        if (now < p.infernalCadenceEndTime) {
          const remaining = (p.infernalCadenceEndTime - now) / 1000
          const frac = (p.infernalCadenceEndTime - now) / p.infernalCadenceDuration
          drawBigBuff(104, 0xff3300, `${Math.ceil(remaining)}s`, 0.95, frac)
        } else if (now < p.infernalCadenceCooldownUntil) {
          const cdRemaining = (p.infernalCadenceCooldownUntil - now) / 1000
          const frac = (p.infernalCadenceCooldownUntil - now) / p.infernalCadenceCooldown
          drawBigBuff(104, 0x661100, `${Math.ceil(cdRemaining)}s`, 0.30, frac)
        } else {
          drawBigBuff(104, 0xff3300, 'RDY', 0.80)
        }
      }

      // --- Powder Keg (Ignara Wildfire) — bh2 — kills remaining until proc ---
      if (p.hasPowderKeg) {
        if (p.powderKegReady) {
          drawBigBuff(101, 0xffaa00, 'GO', 0.95)
        } else {
          const killsLeft = p.powderKegThreshold - p.powderKegCounter
          const frac = p.powderKegCounter / p.powderKegThreshold
          drawBigBuff(101, 0xff6600, `${killsLeft}`, 0.65, 1 - frac)
        }
      }

      // --- Ember Volley stacks (Ignara Wildfire) — bh3 — CD reduction stacks ---
      if (p.hasEmberVolley && p.emberVolleyStacks > 0)
        drawBigBuff(102, 0xffcc44, `${p.emberVolleyStacks}`, 0.9)

      // --- Ashen Veil stacks (Ignara Inferno) ---
      if (p.hasAshenVeil && p.ashenVeilStacks > 0 && now < p.ashenVeilUntil) {
        const frac = (p.ashenVeilUntil - now) / 2000
        drawBigBuff(13, 0xcc6600, `${p.ashenVeilStacks}`, 0.9, frac)
      }

      // --- Soul Siphon stacks (Vael Pale Harvest) ---
      if (p.hasSoulSiphon && p.soulStacks > 0) {
        drawBigBuff(106, 0xaaddff, `${p.soulStacks}`, 0.95)
      }

      // --- Vanish CD (Nazar Shadow) ---
      if (p.hasVanish) {
        const now = this.gameScene.time.now
        const onCD = now < p.vanishCooldownUntil
        const cdFrac = onCD ? (p.vanishCooldownUntil - now) / 1500 : 0
        const active = now < p.vanishUntil
        drawBigBuff(35, active ? 0xcc44ff : 0x9955dd, undefined, active ? 0.95 : (onCD ? 0.35 : 0.8), onCD ? cdFrac : undefined)
      }

    }

    // === TOP-RIGHT: Kills & Tier (panel above minimap) ===
    this.killText.setText(`● ${p.kills} kills`)
    // `_lastGold` initializes to -1 so the first HUD redraw on run start doesn't
    // trigger the bump animation. Only animate when we have a valid prior value.
    if (curGold !== this._lastGold && this._lastGold >= 0) {
      // Bump animation on gold change
      this.tweens.add({
        targets: [this.goldText, this.goldIcon],
        scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true,
      })
    }
    this.goldText.setText(`${p.goldThisRun}`)
    // Reposition coin icon to left of text — portrait shifts kills below minimap
    const _mmSz = _portrait ? 90 : CONFIG.MINIMAP_SIZE
    const _killsOffY = _portrait ? CONFIG.MINIMAP_MARGIN + 76 + _mmSz + 8 : 24
    this.goldIcon.setPosition(this.scale.width - 20 - this.goldText.width - 12, _killsOffY + (this.isMobile ? 68 : 55))

    const tier = this.gameScene._online
      ? (this.gameScene._networkAdapter?.serverWave || 1)
      : (this.gameScene.waveManager?.currentWave || 1)
    const tierStars = tier >= 8 ? 'DANGER' : tier >= 5 ? 'HARD' : tier >= 3 ? 'MEDIUM' : 'EASY'
    const tierColor = tier >= 8 ? '#ff4444' : tier >= 5 ? '#ffaa44' : tier >= 3 ? '#ffff66' : '#88ff88'
    this.tierText.setText(`TIER ${tier}  ${tierStars}`).setColor(tierColor)

    // Kills/tier/gold background panel
    const killPanelW = this.isMobile ? 160 : 130
    const killPanelH = this.isMobile ? 76 : 56
    const killPanelX = this.scale.width - killPanelW - 10
    const killPanelY = _killsOffY + 6
    g.fillStyle(0x0a0a1a, 0.6)
    g.fillRoundedRect(killPanelX, killPanelY, killPanelW, killPanelH, 4)

    // Minimap — throttle to every 3 frames
    this._mmFrame = ((this._mmFrame || 0) + 1) % 3
    if (this._mmFrame === 0) this.drawMinimap()
  }


  private _mmFrame = 0
  private _killMilestones = new Set<number>()

  // Branch-mastery level-up popup text
  private masteryPopup!: Phaser.GameObjects.Text

  // ============================================================
  // QUEST HUD
  // ============================================================

  /** Format progress label for a quest row. */
  private _questProgressStr(quest: QuestDef, progress: number, done: boolean): string {
    if (quest.id === 'q_the_long_watch') {
      const secs = Math.floor(Math.min(progress, quest.goal) / 1000)
      const goalSecs = quest.goal / 1000
      return done ? 'DONE' : `${secs}s/${goalSecs}s`
    }
    if (quest.id === 'q_find_sifra') {
      return done ? 'DONE' : 'explore'
    }
    return done ? 'DONE' : `${Math.min(progress, quest.goal)}/${quest.goal}`
  }

  /** Destroy the quest panel and clear all in-place render caches. */
  private _destroyQuestPanel(): void {
    if (this._questPanel) {
      this._questPanel.destroy()
      this._questPanel = null
    }
    this._questPanelIds = []
    this._questTitleTexts = []
    this._questProgressTexts = []
    this._questProgressBars = []
    this._questProgressBarGeom = []
  }

  /**
   * Builds (or rebuilds) the quest panel in the bottom-left corner. Does a
   * full rebuild when the set of active quest IDs differs from what's
   * currently rendered; otherwise updates the existing Text/Graphics objects
   * in place via setText() and graphics.clear() — avoids per-second GC churn.
   */
  private _buildQuestPanel(): void {
    const quests = MetaProgress.getActiveQuests()
    if (quests.length === 0) {
      this._destroyQuestPanel()
      return
    }

    // Fast path: same IDs in same order → in-place update.
    const sameIds = quests.length === this._questPanelIds.length &&
      quests.every((q, i) => q.id === this._questPanelIds[i])
    if (sameIds && this._questPanel) {
      this._updateQuestPanelInPlace(quests)
      return
    }

    // Slow path: full rebuild.
    this._destroyQuestPanel()

    const { height } = this.scale
    const portrait = this.isMobile && this._isPortrait
    const panelW = this.isMobile ? 200 : 180
    const rowH = 36
    const padV = 8
    const padH = 10
    const panelH = padV * 2 + quests.length * rowH
    const panelX = 8
    // In portrait, move quest panel below buff icons (y:130+48+8=186) to avoid overlap and joystick zone
    const panelY = portrait
      ? 186
      : height - panelH - 8 - Math.round(height * 0.20)

    const container = this.add.container(panelX, panelY).setDepth(5)

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a1a, 0.82)
    bg.fillRoundedRect(0, 0, panelW, panelH, 6)
    bg.lineStyle(1, 0x334466, 0.8)
    bg.strokeRoundedRect(0, 0, panelW, panelH, 6)
    container.add(bg)

    const headerFontSize = this.isMobile ? '12px' : '9px'
    const header = this.add.text(padH, padV - 2, 'QUESTS', {
      fontFamily: gameFont(), fontSize: headerFontSize, color: '#6688aa',
    }).setOrigin(0, 0)
    container.add(header)

    quests.forEach((quest, idx) => {
      const rowY = padV + 10 + idx * rowH
      const progress = MetaProgress.getQuestProgress(quest.id)
      const done = progress >= quest.goal
      const frac = Math.min(1, progress / quest.goal)

      const questFontSize = this.isMobile ? '13px' : '10px'
      const titleColor = done ? '#558855' : '#cccccc'
      const titleTxt = this.add.text(padH, rowY, quest.title, {
        fontFamily: gameFont(), fontSize: questFontSize, color: titleColor,
      }).setOrigin(0, 0)
      container.add(titleTxt)
      this._questTitleTexts.push(titleTxt)

      const progTxt = this.add.text(panelW - padH, rowY, this._questProgressStr(quest, progress, done), {
        fontFamily: gameFont(), fontSize: questFontSize, color: done ? '#44aa44' : '#888888',
      }).setOrigin(1, 0)
      container.add(progTxt)
      this._questProgressTexts.push(progTxt)

      const barX = padH
      const barY = rowY + 14
      const barW = panelW - padH * 2
      const barH = 4
      const barBg = this.add.graphics()
      barBg.fillStyle(0x223344, 1)
      barBg.fillRoundedRect(barX, barY, barW, barH, 2)
      if (frac > 0) {
        barBg.fillStyle(done ? 0x44aa44 : 0x4488cc, 1)
        barBg.fillRoundedRect(barX, barY, Math.floor(barW * frac), barH, 2)
      }
      container.add(barBg)
      this._questProgressBars.push(barBg)
      this._questProgressBarGeom.push({ barX, barY, barW, barH })
    })

    this._questPanel = container
    this._questPanelIds = quests.map(q => q.id)
  }

  /** Update existing row Text/Graphics objects without reallocating. */
  private _updateQuestPanelInPlace(quests: QuestDef[]): void {
    for (let i = 0; i < quests.length; i++) {
      const quest = quests[i]
      const progress = MetaProgress.getQuestProgress(quest.id)
      const done = progress >= quest.goal
      const frac = Math.min(1, progress / quest.goal)

      const titleTxt = this._questTitleTexts[i]
      if (titleTxt) titleTxt.setColor(done ? '#558855' : '#cccccc')

      const progTxt = this._questProgressTexts[i]
      if (progTxt) {
        progTxt.setText(this._questProgressStr(quest, progress, done))
        progTxt.setColor(done ? '#44aa44' : '#888888')
      }

      const barBg = this._questProgressBars[i]
      const geom = this._questProgressBarGeom[i]
      if (barBg && geom) {
        barBg.clear()
        barBg.fillStyle(0x223344, 1)
        barBg.fillRoundedRect(geom.barX, geom.barY, geom.barW, geom.barH, 2)
        if (frac > 0) {
          barBg.fillStyle(done ? 0x44aa44 : 0x4488cc, 1)
          barBg.fillRoundedRect(geom.barX, geom.barY, Math.floor(geom.barW * frac), geom.barH, 2)
        }
      }
    }
  }

  /** Lightweight per-second refresh — delegates to _buildQuestPanel which
   * now does in-place updates when the quest ID set is unchanged. */
  private _refreshQuestPanel(): void {
    this._buildQuestPanel()
  }

  /**
   * Called when a quest completes mid-run (from MetaProgress callback or at run-end).
   * Shows a toast banner and rebuilds the quest panel to show completion state.
   */
  private _onQuestCompletedMidRun(questId: string): void {
    if (this._toastedQuests.has(questId)) return
    this._toastedQuests.add(questId)

    const quest = RUN1_QUESTS.find(q => q.id === questId)
    if (!quest) return

    // Determine toast label
    let toastLine1: string
    let toastLine2: string
    if (questId === 'q_forged_in_battle') {
      toastLine1 = 'SPECIALIZATION UNLOCKED'
      toastLine2 = 'Bastion'
    } else if (questId === 'q_the_long_watch') {
      toastLine1 = 'SPECIALIZATION UNLOCKED'
      toastLine2 = 'Quake'
    } else {
      toastLine1 = 'NEW HERO'
      toastLine2 = 'Sifra'
    }

    this._showQuestToast(toastLine1, toastLine2)
    this._buildQuestPanel()

    // After kill quest (q_forged_in_battle), grant a bonus Bastion specialization pick
    if (questId === 'q_forged_in_battle') {
      this._launchBastionBonusPicker()
    }

    // After meeting Sifra (q_find_sifra): big center popup announcing the unlock
    if (questId === 'q_find_sifra') {
      this._showHeroUnlockPopup('SIFRA UNLOCKED', 'A new hero joins your roster')
    }
  }

  /** Big center "new hero" popup, distinct from the small bottom toast. */
  private _showHeroUnlockPopup(title: string, sub: string): void {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2 - 40

    const pw = 360, ph = 110
    const bg = this.add.graphics().setDepth(60)
    bg.fillStyle(0x0a0f1a, 0.95)
    bg.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 12)
    bg.lineStyle(3, 0x82ccdd, 1)
    bg.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 12)
    // Inner glow stroke
    bg.lineStyle(1, 0xaaeeff, 0.5)
    bg.strokeRoundedRect(cx - pw / 2 + 4, cy - ph / 2 + 4, pw - 8, ph - 8, 10)

    const titleTxt = this.add.text(cx, cy - 18, title, {
      fontFamily: gameFont(), fontSize: '24px', color: '#aaeeff',
    }).setOrigin(0.5).setDepth(61)
    titleTxt.setShadow(0, 1, '#000000', 2, true, true)

    const subTxt = this.add.text(cx, cy + 18, sub, {
      fontFamily: gameFont(), fontSize: '12px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(61)

    const objs: Phaser.GameObjects.GameObject[] = [bg, titleTxt, subTxt]
    // Pop-in: scale + alpha
    bg.setAlpha(0); titleTxt.setAlpha(0); subTxt.setAlpha(0)
    titleTxt.setScale(0.6); subTxt.setScale(0.6)
    this.tweens.add({
      targets: [bg, titleTxt, subTxt], alpha: 1,
      duration: 350, ease: 'Quad.easeOut',
    })
    this.tweens.add({
      targets: [titleTxt, subTxt], scale: 1,
      duration: 450, ease: 'Back.easeOut',
    })
    // Hold then fade
    this.tweens.add({
      targets: [bg, titleTxt, subTxt], alpha: 0, y: '-=20',
      duration: 600, delay: 2400, ease: 'Quad.easeIn',
      onComplete: () => { for (const o of objs) (o as any).destroy() },
    })
  }

  /** Pause gameplay and show a bonus specialization picker for Bastion. */
  private _launchBastionBonusPicker(): void {
    const tryLaunch = () => {
      if (this.endScreenShown) return
      // Wait if LevelUpScene is open
      if (this.scene.isActive('LevelUpScene')) {
        this.time.delayedCall(500, tryLaunch)
        return
      }
      const gs = this.gameScene
      if (!gs.scene.isPaused()) gs.scene.pause()
      gs.scene.launch('BastionPickScene', {
        player: gs.localPlayer,
        tracker: gs.upgradeTracker,
        callerSceneKey: gs.scene.key,
      })
    }
    this.time.delayedCall(600, tryLaunch)
  }

  /** Brief non-blocking toast (bottom-center) for quest/unlock events. */
  private _showQuestToast(line1: string, line2: string): void {
    const { width, height } = this.scale
    const cx = width / 2
    const toastY = height - 80

    const bg = this.add.graphics().setDepth(40)
    const tw = 220, th = 46
    bg.fillStyle(0x0a0f1a, 0.92)
    bg.fillRoundedRect(cx - tw / 2, toastY - th / 2, tw, th, 8)
    bg.lineStyle(2, 0x4488ff, 0.9)
    bg.strokeRoundedRect(cx - tw / 2, toastY - th / 2, tw, th, 8)

    const t1 = this.add.text(cx, toastY - 9, line1, {
      fontFamily: gameFont(), fontSize: '11px', color: '#4488ff',
    }).setOrigin(0.5).setDepth(41)

    const t2 = this.add.text(cx, toastY + 8, line2, {
      fontFamily: gameFont(), fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41)

    // Slide up + fade out
    const objs = [bg, t1, t2]
    this.tweens.add({
      targets: objs, y: '-=18', alpha: 0,
      duration: 700, delay: 1800, ease: 'Quad.easeIn',
      onComplete: () => { bg.destroy(); t1.destroy(); t2.destroy() },
    })
  }

  // ── Boss HP bar ────────────────────────────────────────────────

  private _showBossBar() {
    const { width } = this.cameras.main
    // Mirror XP bar geometry: same x-padding, sit directly below it
    const xpPad = 40
    const xpTopY = 4
    const xpTopH = 15
    const bw = width - xpPad * 2      // same width as XP bar
    const bh = xpTopH * 2             // 2× XP bar height = 30px
    const bx = xpPad
    const by = xpTopY + xpTopH + 3    // 3px gap below XP bar

    // Background panel
    this._bossBarBg = this.add.graphics().setDepth(30).setScrollFactor(0)
    this._bossBarBg.fillStyle(0x000000, 0.55)
    this._bossBarBg.fillRoundedRect(bx - 2, by - 1, bw + 4, bh + 2, 4)
    this._bossBarBg.setAlpha(0)

    // HP fill graphics
    this._bossBarGfx = this.add.graphics().setDepth(31).setScrollFactor(0)

    // Name label — small, inside the bar, right-aligned
    this._bossNameText = this.add.text(bx + bw - 6, by + bh / 2, 'THE ALL-SEEING EYE', {
      fontFamily: gameFont(), fontSize: '12px', color: '#ff6666',
      shadow: { offsetX: 0, offsetY: 1, color: '#000', blur: 3, fill: true },
    }).setOrigin(1, 0.5).setDepth(32).setScrollFactor(0).setAlpha(0)

    // Phase text — centered, appears below the bar temporarily
    this._bossPhaseText = this.add.text(bx + bw / 2, by + bh + 4, '', {
      fontFamily: gameFont(), fontSize: '11px', color: '#ffcccc',
      shadow: { offsetX: 0, offsetY: 1, color: '#000', blur: 2, fill: true },
    }).setOrigin(0.5, 0).setDepth(32).setScrollFactor(0).setAlpha(0)

    // Tween in
    this.tweens.add({ targets: [this._bossBarBg, this._bossNameText], alpha: 1, duration: 600, ease: 'Sine.easeOut' })
    this._bossBarVisible = true
    this._drawBossBar()
  }

  private _drawBossBar() {
    if (!this._bossBarGfx || !this._bossBarVisible) return
    if (this._bossMaxHp === 0) return
    const { width } = this.cameras.main
    const xpPad = 40
    const xpTopY = 4
    const xpTopH = 15
    const bw = width - xpPad * 2
    const bh = xpTopH * 2
    const bx = xpPad
    const by = xpTopY + xpTopH + 3
    const pct = Math.max(0, this._bossHp / this._bossMaxHp)
    const g = this._bossBarGfx
    g.clear()

    // === Background panel ===
    g.fillStyle(0x0a0000, 0.92)
    g.fillRoundedRect(bx, by, bw, bh, 4)

    // === Red HP fill — 3 gradient layers ===
    if (pct > 0) {
      const fw = bw * pct
      // Deep red base
      g.fillStyle(0x660000, 1)
      g.fillRoundedRect(bx, by, fw, bh, 3)
      // Mid red
      g.fillStyle(0xcc1111, 1)
      g.fillRoundedRect(bx + 1, by + 1, Math.max(0, fw - 2), bh - 2, 3)
      // Bright top highlight
      g.fillStyle(0xff3322, 0.85)
      g.fillRect(bx + 2, by + 2, Math.max(0, fw - 4), Math.floor(bh * 0.35))
      // Blood shimmer line
      g.fillStyle(0xff8866, 0.3)
      g.fillRect(bx + 2, by + 2, Math.max(0, fw - 4), 2)
    }

    // === Segment dividers (tenths) ===
    const segments = 10
    for (let i = 1; i < segments; i++) {
      const sx = bx + (bw * i) / segments
      g.lineStyle(1, 0x000000, 0.85)
      g.beginPath(); g.moveTo(sx, by + 2); g.lineTo(sx, by + bh - 2); g.strokePath()
      g.lineStyle(1, 0x331111, 0.5)
      g.beginPath(); g.moveTo(sx + 1, by + 2); g.lineTo(sx + 1, by + bh - 2); g.strokePath()
    }

    // === Ornate frame: vines + ropes + horns ===
    const frameColor = 0x0a0a0a
    const frameAccent = 0x1a0d0d

    // Outer thick border
    g.lineStyle(3, frameColor, 1)
    g.strokeRoundedRect(bx - 2, by - 2, bw + 4, bh + 4, 5)
    g.lineStyle(1, frameAccent, 0.8)
    g.strokeRoundedRect(bx - 3, by - 3, bw + 6, bh + 6, 6)

    // Horns — left side (curving upward)
    const hornL_x = bx - 2
    const hornL_y = by + bh / 2
    g.lineStyle(2.5, frameColor, 1)
    g.beginPath()
    g.moveTo(hornL_x, hornL_y - 6)
    g.lineTo(hornL_x - 6, hornL_y - 12)
    g.lineTo(hornL_x - 10, hornL_y - 18)
    g.lineTo(hornL_x - 8, hornL_y - 22)
    g.strokePath()
    g.beginPath()
    g.moveTo(hornL_x, hornL_y + 6)
    g.lineTo(hornL_x - 6, hornL_y + 12)
    g.lineTo(hornL_x - 10, hornL_y + 18)
    g.lineTo(hornL_x - 8, hornL_y + 22)
    g.strokePath()

    // Horns — right side (mirror)
    const hornR_x = bx + bw + 2
    const hornR_y = by + bh / 2
    g.beginPath()
    g.moveTo(hornR_x, hornR_y - 6)
    g.lineTo(hornR_x + 6, hornR_y - 12)
    g.lineTo(hornR_x + 10, hornR_y - 18)
    g.lineTo(hornR_x + 8, hornR_y - 22)
    g.strokePath()
    g.beginPath()
    g.moveTo(hornR_x, hornR_y + 6)
    g.lineTo(hornR_x + 6, hornR_y + 12)
    g.lineTo(hornR_x + 10, hornR_y + 18)
    g.lineTo(hornR_x + 8, hornR_y + 22)
    g.strokePath()

    // Vines — top edge (curvy tendrils over the bar)
    g.lineStyle(2, frameColor, 0.95)
    const vineSpacing = 60
    for (let vx = bx + 20; vx < bx + bw - 20; vx += vineSpacing) {
      g.beginPath()
      g.moveTo(vx, by - 2)
      g.lineTo(vx + 4, by - 6)
      g.lineTo(vx + 2, by - 10)
      g.lineTo(vx + 6, by - 12)
      g.strokePath()
      // Small leaf node
      g.fillStyle(frameColor, 1)
      g.fillCircle(vx + 6, by - 12, 1.5)
    }

    // Vines — bottom edge
    for (let vx = bx + 40; vx < bx + bw - 20; vx += vineSpacing) {
      g.beginPath()
      g.moveTo(vx, by + bh + 2)
      g.lineTo(vx + 4, by + bh + 6)
      g.lineTo(vx + 2, by + bh + 10)
      g.lineTo(vx + 6, by + bh + 12)
      g.strokePath()
      g.fillStyle(frameColor, 1)
      g.fillCircle(vx + 6, by + bh + 12, 1.5)
    }

    // Rope texture along the top/bottom (short diagonal slashes)
    g.lineStyle(1, frameAccent, 0.6)
    for (let rx = bx; rx < bx + bw; rx += 6) {
      g.beginPath()
      g.moveTo(rx, by - 1); g.lineTo(rx + 3, by - 3)
      g.strokePath()
      g.beginPath()
      g.moveTo(rx, by + bh + 1); g.lineTo(rx + 3, by + bh + 3)
      g.strokePath()
    }
  }

  private _onBossPhase(phase: number) {
    if (!this._bossNameText || !this._bossPhaseText) return
    const labels: Record<number, string> = { 2: '— FRENZY —', 3: '— DESPERATION —' }
    const label = labels[phase] ?? ''
    this._bossPhaseText.setText(label).setAlpha(1)
    // Flash phase text then fade
    this.tweens.add({ targets: this._bossPhaseText, alpha: 0, duration: 2000, delay: 1500 })
    // Shake the bar briefly
    if (this._bossBarGfx) {
      this.tweens.add({
        targets: this._bossBarGfx, x: 3, duration: 60, yoyo: true, repeat: 4,
        onComplete: () => { if (this._bossBarGfx) this._bossBarGfx.x = 0 },
      })
    }
  }

  private _hideBossBar() {
    this._bossBarVisible = false
    const targets = [this._bossBarGfx, this._bossBarBg, this._bossNameText, this._bossPhaseText].filter(Boolean)
    this.tweens.add({
      targets, alpha: 0, duration: 1500, onComplete: () => {
        this._bossBarGfx?.destroy(); this._bossBarGfx = null
        this._bossBarBg?.destroy(); this._bossBarBg = null
        this._bossNameText?.destroy(); this._bossNameText = null
        this._bossPhaseText?.destroy(); this._bossPhaseText = null
      },
    })
  }
}
