import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { GameScene } from './GameScene'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'
import { GENERIC_POOL, HERO_BRANCHES, getIconFrame } from '../systems/UpgradeSystem'
import { MetaProgress, type SessionRecord } from '../systems/MetaProgress'
import { SessionLogger } from '../systems/SessionLogger'
import { Player } from '../entities/Player'
import { shouldShowHint } from '../systems/HintFlags'

const HERO_DISPLAY_NAMES: Record<string, string> = {
  huntress: 'Lyra', muller: 'Givi', ignara: 'Ignara',
  sifra: 'Sifra', amun: 'Amun', nazar: 'Nazar', khashin: 'Khashin',
}

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene
  private hud!: Phaser.GameObjects.Graphics
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

  // Dirty-flag tracking — cached values from last HUD redraw
  private _lastHp = -1
  private _lastMaxHp = -1
  private _lastXp = -1
  private _lastXpMax = -1
  private _lastLevel = -1
  private _lastEnergy1 = -1  // hero energy bar 1 (ice/sword/melee/wind)
  private _lastEnergy2 = -1  // hero energy bar 2 (lightning/venom/spear/sand)
  private _bigBuffObjs: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = []
  private _lastKills = -1
  private _lastGold = -1
  private _lastGameTimeSec = -1  // integer seconds bucket
  private _critFlashUntil = 0   // timestamp — HP bar white flash on damage
  private _critPulse = 0        // continuous pulse counter at low HP
  private _mmMaskDirty = true
  private _tookDamageThisRun = false  // tracks if player received any damage this run
  private goldText!: Phaser.GameObjects.Text
  private goldIcon!: Phaser.GameObjects.Image

  constructor() {
    super({ key: 'UIScene' })
  }

  create(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene || (this.scene.get('GameScene') as GameScene)
    this._tookDamageThisRun = false  // reset at start of each run
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    // Slight UI scale-down on mobile so elements don't crowd the edges
    if (this.isMobile) {
      this.cameras.main.setZoom(0.92)
    }

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }

    // Main HUD graphics layer
    this.hud = this.add.graphics()

    // HP text (on bar)
    this.hpText = this.add.text(0, 0, '', {
      ...textStyle, fontSize: '11px',
    }).setDepth(3)

    // Level text (below bars)
    this.lvlText = this.add.text(0, 0, '', {
      ...textStyle, fontSize: '11px', color: '#66bbff',
    }).setDepth(2)

    // Kills (top-right) — with skull icon
    this.killText = this.add.text(0, 22, '', {
      ...textStyle,
      fontSize: '14px',
      color: '#ff8888',
    }).setDepth(2)

    // Difficulty tier (top-right under kills)
    this.tierText = this.add.text(0, 40, '', {
      ...textStyle,
      fontSize: '11px',
      color: '#ffaa44',
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
      fontSize: '13px',
      color: '#FFD700',
    }).setDepth(2)

    // Countdown timer (top-center)
    this.timerText = this.add.text(0, 38, '', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setDepth(2)

    // Top-area announcement (kill milestones, claws warning)
    this.announcement = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(20)

    // Minimap with clip mask
    this.minimap = this.add.graphics().setDepth(2)
    const mmSize = CONFIG.MINIMAP_SIZE
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

    // Stance toggle for Sifra
    if (this.gameScene.player.heroType === 'sifra') {
      this.stanceIcon = this.add.graphics().setDepth(3)
      this.stanceBtn = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#88ddff',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0, 0.5).setInteractive().setDepth(3)
      this.stanceBtn.on('pointerdown', () => {
        this.gameScene.player.toggleStance()
      })
      this.stanceBtn.on('pointerover', () => this.stanceBtn?.setColor('#ffffff'))
      this.stanceBtn.on('pointerout', () => this.updateStanceBtn())
      // Listen for stance changes
      this.gameScene.events.on('stance-changed', () => this.updateStanceBtn())
      this.updateStanceBtn()
    }

    // Stance toggle for Nazar (Samurai)
    if (this.gameScene.player.heroType === 'nazar') {
      this.stanceIcon = this.add.graphics().setDepth(3)
      this.stanceBtn = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#ff6644',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0, 0.5).setInteractive().setDepth(3)
      this.stanceBtn.on('pointerdown', () => {
        this.gameScene.player.toggleNazarStance()
      })
      this.stanceBtn.on('pointerover', () => this.stanceBtn?.setColor('#ffffff'))
      this.stanceBtn.on('pointerout', () => this.updateNazarStanceBtn())
      this.gameScene.events.on('nazar-stance-changed', () => this.updateNazarStanceBtn())
      this.updateNazarStanceBtn()
    }

    // Stance toggle for Huntress
    if (this.gameScene.player.heroType === 'huntress') {
      this.stanceIcon = this.add.graphics().setDepth(3)
      this.stanceBtn = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#2ecc71',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0, 0.5).setInteractive().setDepth(3)
      this.stanceBtn.on('pointerdown', () => {
        this.gameScene.player.toggleHuntressStance()
      })
      this.stanceBtn.on('pointerover', () => this.stanceBtn?.setColor('#ffffff'))
      this.stanceBtn.on('pointerout', () => this.updateHuntressStanceBtn())
      this.gameScene.events.on('huntress-stance-changed', () => this.updateHuntressStanceBtn())
      this.updateHuntressStanceBtn()
    }

    // Mobile stance toggle button (big, right side)
    const isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const p = this.gameScene.player
    const hasStance = p.heroType === 'sifra' || p.heroType === 'nazar' || p.heroType === 'huntress' || p.heroType === 'khashin' || (p.heroType === 'amun' && p.hasQuakeStance)
    if (isMob && hasStance) {
      const { width, height } = this.scale
      // Right half of screen = stance tap zone
      const zone = this.add.zone(width * 0.75, height / 2, width / 2, height)
        .setInteractive().setDepth(5)
      this.mobileStanceBtn = zone
      zone.on('pointerdown', () => {
        if (p.heroType === 'sifra') p.toggleStance()
        else if (p.heroType === 'nazar') p.toggleNazarStance()
        else if (p.heroType === 'huntress') p.toggleHuntressStance()
        else if (p.heroType === 'khashin') p.toggleKhashinStance()
        else if (p.heroType === 'amun') p.toggleAmunStance()
        this.updateMobileStanceBtn()
      })
      // Pill background behind stance label (bottom-right)
      const pill = this.add.graphics().setDepth(20)
      this.mobileStancePill = pill
      // Small stance indicator label (bottom-right)
      const lbl = this.add.text(width - 12, height - 12, '', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3, align: 'center',
      }).setOrigin(1, 1).setDepth(21).setAlpha(0.8)
      this.mobileStanceLbl = lbl
      this.gameScene.events.on('stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('nazar-stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('huntress-stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('khashin-stance-changed', () => this.updateMobileStanceBtn())
      this.gameScene.events.on('amun-stance-changed', () => this.updateMobileStanceBtn())
      this.updateMobileStanceBtn()

      // TAP hint on first game — fades out after 2s
      if (shouldShowHint('mobile_stance_tap')) {
        const tapHint = this.add.text(width - 52, height - 50, 'TAP', {
          fontFamily: 'monospace', fontSize: '10px', color: '#aaaaaa',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(22).setAlpha(0.6)
        this.time.delayedCall(1500, () => {
          this.tweens.add({ targets: tapHint, alpha: 0, duration: 800, onComplete: () => tapHint.destroy() })
        })
      }
    }

    // CLAWS warning
    this.events.on('claws-warning', () => {
      this.showAnnounce('THE CLAWS ARE COMING...', '#ff2222')
    })

    // Branch mastery level-up popup (fixed HUD position, non-blocking)
    this.masteryPopup = this.add.text(0, 80, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(20).setAlpha(0)

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

    // Clean up all external event listeners on shutdown to prevent memory leaks
    this.events.once('shutdown', () => {
      this.gameScene?.events?.off('stance-changed')
      this.gameScene?.events?.off('nazar-stance-changed')
      this.gameScene?.events?.off('huntress-stance-changed')
      this.gameScene?.events?.off('khashin-stance-changed')
      this.gameScene?.events?.off('amun-stance-changed')
      this.gameScene?.events?.off('branch-mastery-levelup')
    })

    this.updatePositions()
    this.scale.on('resize', () => this.updatePositions())
  }

  private updatePositions() {
    const { width, height } = this.scale
    this.killText.setPosition(width - 20, 22).setOrigin(1, 0)
    this.tierText.setPosition(width - 20, 40).setOrigin(1, 0)
    this.goldText.setPosition(width - 20, 56).setOrigin(1, 0)
    this.goldIcon.setPosition(width - 20 - this.goldText.width - 10, 63)
    this.timerText.setPosition(width / 2, 38).setOrigin(0.5, 0)
    this.announcement.setPosition(width / 2, 68)
    if (this.stanceBtn) this.stanceBtn.setPosition(56, 72)
    if (this.mobileStanceBtn) {
      this.mobileStanceBtn.setPosition(width * 0.75, height / 2).setSize(width / 2, height)
    }
    if (this.mobileStanceLbl) {
      this.mobileStanceLbl.setPosition(width - 12, height - 12)
    }
    this._mmMaskDirty = true
  }

  private updateMobileStanceBtn() {
    if (!this.mobileStanceLbl) return
    const p = this.gameScene.player
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
    const p = this.gameScene.player
    const isLightning = p.stance === 'lightning'
    const label = isLightning ? '⚡ LIGHTNING [Q]' : '❄ ICE [Q]'
    const color = isLightning ? '#bb88ff' : '#88ddff'
    this.stanceBtn.setText(label).setColor(color)
    this.stanceIcon.clear()
  }

  private updateNazarStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    const p = this.gameScene.player
    const isVenom = p.nazarStance === 'venom'
    const label = isVenom ? '☠ VENOM [Q]' : '⚔ SWORD [Q]'
    const color = isVenom ? '#44cc44' : '#ff6644'
    this.stanceBtn.setText(label).setColor(color)
    this.stanceIcon.clear()
  }

  private updateHuntressStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    const p = this.gameScene.player
    const isSpear = p.huntressStance === 'spear'
    const label = isSpear ? '🏹 SPEAR [Q]' : '⚔ MELEE [Q]'
    const color = isSpear ? '#2ecc71' : '#e67e22'
    this.stanceBtn.setText(label).setColor(color)
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

  private togglePause() {
    if (this.endScreenShown) return

    this.isPaused = !this.isPaused
    const { width, height } = this.scale

    if (this.isPaused) {
      this.scene.pause(this.gameScene.scene.key)
      this.pauseBtn?.setText('▶').setColor('#66ff66')

      const gs = this.gameScene
      const p = gs.player
      const compact = height < 500
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
      const heroColors: Record<string, number> = { huntress: 0x2ecc71, muller: 0x44aaff, ignara: 0xe84118, sifra: 0x82ccdd, amun: 0xfff200, nazar: 0xc23616, khashin: 0x88ddff }
      const accentColor = heroColors[p.heroType] || 0xffd700
      panelG.fillStyle(accentColor, 0.25)
      panelG.fillRoundedRect(px, py, panelW, compact ? 36 : 48, { tl: 16, tr: 16, bl: 0, br: 0 })
      panelG.fillStyle(accentColor, 0.08)
      panelG.fillRect(px, py + (compact ? 36 : 48), panelW, 1)

      // ── Header ──
      const heroName = HERO_DISPLAY_NAMES[p.heroType] || p.heroType
      const accentHex = '#' + accentColor.toString(16).padStart(6, '0')
      const header = this.add.text(width / 2, py + (compact ? 18 : 24), `⏸  ${heroName.toUpperCase()}`, {
        fontFamily: 'monospace', fontSize: compact ? '16px' : '22px', color: accentHex,
        stroke: '#000000', strokeThickness: 3,
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
        fontFamily: 'monospace', fontSize: compact ? '10px' : '13px', color: '#aabbcc',
        stroke: '#000000', strokeThickness: 2,
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
        fontFamily: 'monospace', fontSize: compact ? '10px' : '12px', color: '#ffddcc',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(dep)
      objs.push(tabStatsLbl)

      const tabInvG = this.add.graphics().setDepth(dep)
      objs.push(tabInvG)
      const tabInvLbl = this.add.text(tabInvX + tabW / 2, tabY + tabH / 2, 'INVENTORY', {
        fontFamily: 'monospace', fontSize: compact ? '10px' : '12px', color: '#886666',
        stroke: '#000000', strokeThickness: 2,
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
        fontFamily: 'monospace', fontSize: compact ? '11px' : '13px', color: '#66ff88',
        stroke: '#000000', strokeThickness: 2,
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
        fontFamily: 'monospace', fontSize: compact ? '11px' : '13px', color: '#ff6666',
        stroke: '#000000', strokeThickness: 2,
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
        fontFamily: 'monospace', fontSize: '9px', color: '#334455',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(dep))

      this.pauseTexts = objs as Phaser.GameObjects.Text[]

      // ── Render initial tab content ──
      const renderCurrentTab = () => {
        this.pauseTabObjs.forEach(o => o.destroy())
        this.pauseTabObjs = []
        if (this.pauseTab === 'stats') {
          this.renderStatsTab(px, contentTop, contentBot, midX, panelW, compact, dep)
        } else {
          this.renderInventoryTab(px, contentTop, contentBot, compact, dep)
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

  // ── Stats tab: two-column stats + skills ──
  private renderStatsTab(
    px: number, contentTop: number, contentBot: number,
    midX: number, panelW: number, compact: boolean, dep: number,
  ) {
    const gs = this.gameScene
    const p = gs.player
    const tracker = gs.upgradeTracker
    const objs = this.pauseTabObjs

    // Divider line
    const divG = this.add.graphics().setDepth(dep)
    objs.push(divG)
    divG.lineStyle(1, 0x334466, 0.4)
    divG.lineBetween(midX, contentTop + 4, midX, contentBot - 4)

    // Left: Stats
    const leftX = px + (compact ? 16 : 28)
    let sy = contentTop
    const sf = compact ? '10px' : '12px'
    const sGap = compact ? 14 : 18

    const sectionTitle = (x: number, y: number, text: string) => {
      const t = this.add.text(x, y, text, {
        fontFamily: 'monospace', fontSize: compact ? '10px' : '12px', color: '#8899aa',
        stroke: '#000000', strokeThickness: 2,
      }).setDepth(dep)
      objs.push(t)
      divG.lineStyle(1, 0x445566, 0.3)
      divG.lineBetween(x, y + (compact ? 13 : 16), x + (compact ? 100 : 140), y + (compact ? 13 : 16))
    }

    sectionTitle(leftX, sy, '◆ STATS')
    sy += compact ? 18 : 24

    const valColor = '#ccddee'
    const statRow = (label: string, val: string) => {
      objs.push(this.add.text(leftX, sy, label, {
        fontFamily: 'monospace', fontSize: sf, color: '#667788', stroke: '#000000', strokeThickness: 1,
      }).setDepth(dep))
      objs.push(this.add.text(leftX + (compact ? 72 : 100), sy, val, {
        fontFamily: 'monospace', fontSize: sf, color: valColor, stroke: '#000000', strokeThickness: 1,
      }).setDepth(dep))
      sy += sGap
    }

    statRow('HP', `${Math.ceil(p.hp)} / ${p.maxHp}`)
    statRow('Damage', `${Math.ceil(p.damage)}`)
    statRow('Speed', `${Math.ceil(p.speed)}`)
    statRow('Range', `${Math.ceil(p.range)}px`)
    statRow('Atk Spd', `${(1000 / p.attackCooldown).toFixed(1)}`)
    statRow('Armor', `${Math.round(p.armor * 100)}%`)
    statRow('HP Regen', `${p.hpRegen}/s`)
    statRow('Splash', `${p.splashRadius}px`)
    statRow('Strikes', `${p.strikeCount}`)
    if (tracker.chosenBranch) {
      statRow('Branch', tracker.chosenBranch)
    }

    // Right: Skills
    const rightX = midX + (compact ? 12 : 20)
    let ry = contentTop

    sectionTitle(rightX, ry, '◆ SKILLS')
    ry += compact ? 18 : 24

    const pickedSkills: { label: string; desc: string; level: number }[] = []
    const personalIds = Object.keys(tracker.skillLevels).filter(id => !tracker.pickedGeneric.has(id))
    for (const id of personalIds) {
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
      objs.push(this.add.text(rightX, ry, 'No skills yet', {
        fontFamily: 'monospace', fontSize: sf, color: '#445566', stroke: '#000000', strokeThickness: 1,
      }).setDepth(dep))
    } else {
      const maxSkills = compact ? 8 : 12
      const skillGap = compact ? 22 : 28
      for (let i = 0; i < Math.min(pickedSkills.length, maxSkills); i++) {
        const s = pickedSkills[i]
        objs.push(this.add.text(rightX, ry, s.label, {
          fontFamily: 'monospace', fontSize: compact ? '10px' : '12px', color: '#ccddee',
          stroke: '#000000', strokeThickness: 2,
        }).setDepth(dep))
        objs.push(this.add.text(rightX, ry + (compact ? 11 : 14), s.desc, {
          fontFamily: 'monospace', fontSize: compact ? '7px' : '9px', color: '#556666',
          stroke: '#000000', strokeThickness: 1,
          wordWrap: { width: midX - rightX + (panelW / 2) - (compact ? 28 : 48) },
        }).setDepth(dep))
        ry += skillGap
      }
      if (pickedSkills.length > maxSkills) {
        objs.push(this.add.text(rightX, ry, `+${pickedSkills.length - maxSkills} more...`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#445566', stroke: '#000000', strokeThickness: 1,
        }).setDepth(dep))
      }
    }
  }

  // ── Inventory tab: icon grid of picked upgrades ──
  private renderInventoryTab(
    px: number, contentTop: number, contentBot: number,
    compact: boolean, dep: number,
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

    // 10 slots: 2 columns × 5 rows, left side of panel
    const totalSlots = 10
    const cols = 2
    const rows = 5
    const slotSize = compact ? 56 : 72
    const slotGap = compact ? 6 : 8
    const gridW = cols * slotSize + (cols - 1) * slotGap
    const gridH = rows * slotSize + (rows - 1) * slotGap
    const gridX = px + (compact ? 16 : 24)
    const gridY = contentTop + Math.max(0, ((contentBot - contentTop) - gridH) / 2)

    // Tooltip
    const tooltipText = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: compact ? '10px' : '12px', color: '#ffddcc',
      stroke: '#000000', strokeThickness: 2,
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
            fontFamily: 'monospace', fontSize: compact ? '11px' : '14px', color: '#cc8866',
            stroke: '#000000', strokeThickness: 2,
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

    // Right side — stats summary next to inventory
    const infoX = gridX + gridW + (compact ? 20 : 32)
    const infoY = gridY
    const infoStyle = { fontFamily: 'monospace', fontSize: compact ? '10px' : '12px', color: '#aabbcc', stroke: '#000000', strokeThickness: 2 }
    const valStyle = { ...infoStyle, color: '#ffddaa' }
    const lineH = compact ? 18 : 22

    const stats = [
      ['HP', `${Math.ceil(p.hp)} / ${p.maxHp}`],
      ['DMG', `${p.damage}`],
      ['SPD', `${p.speed}`],
      ['RNG', `${p.range}`],
      ['ARM', `${Math.round(p.armor * 100)}%`],
      ['LVL', `${p.level}`],
      ['KILLS', `${p.kills}`],
      ['GOLD', `${p.goldThisRun} ✦`],
    ]
    stats.forEach(([label, val], i) => {
      objs.push(this.add.text(infoX, infoY + i * lineH, label, infoStyle as any).setDepth(dep + 1))
      objs.push(this.add.text(infoX + (compact ? 50 : 65), infoY + i * lineH, val, valStyle as any).setDepth(dep + 1))
    })

    // === MASTERY SECTION (below stats) ===
    const masteryY = infoY + stats.length * lineH + (compact ? 10 : 16)
    const branchColor: Record<string, number> = {
      ice: 0x55aaff, lightning: 0x9966ff,
      sword: 0xcc4444, venom: 0x44cc44,
      melee: 0xe67e22, spear: 0x2ecc71,
      wind: 0x88ddff, sand: 0xddaa44,
      ground: 0xddaa22, quake: 0xff8833,
      fireball: 0xff6600, crystal: 0x44aaff,
    }
    const heroBranches: Record<string, string[]> = {
      sifra: ['ice', 'lightning'], nazar: ['sword', 'venom'],
      huntress: ['melee', 'spear'], khashin: ['wind', 'sand'],
      ignara: ['fireball'], muller: ['crystal'],
    }
    let branches = heroBranches[p.heroType] || []
    if (p.heroType === 'amun' && p.hasQuakeStance) branches = ['ground', 'quake']
    else if (p.heroType === 'amun') branches = []

    if (branches.length > 0) {
      objs.push(this.add.text(infoX, masteryY, 'MASTERY', {
        fontFamily: 'monospace', fontSize: compact ? '10px' : '12px',
        color: '#888888', stroke: '#000000', strokeThickness: 2,
      }).setDepth(dep + 1))

      const dSize = compact ? 5 : 6
      const rowH = compact ? 28 : 34
      const barW = compact ? 60 : 80

      branches.forEach((branch, bi) => {
        const ry = masteryY + 18 + bi * rowH
        const level = p.getMasteryLevel(branch)
        const xp = p.branchMasteryXP[branch] ?? 0
        const color = branchColor[branch] ?? 0xaaaaaa
        const displayName = branch.charAt(0).toUpperCase() + branch.slice(1)
        const levelName = Player.MASTERY_NAMES[level] || ''

        // Branch label
        objs.push(this.add.text(infoX, ry, displayName, {
          fontFamily: 'monospace', fontSize: compact ? '10px' : '11px',
          color: '#' + color.toString(16).padStart(6, '0'),
          stroke: '#000000', strokeThickness: 2,
        }).setDepth(dep + 1))

        // Mastery level name (right of label)
        if (levelName) {
          objs.push(this.add.text(infoX + (compact ? 55 : 65), ry, levelName, {
            fontFamily: 'monospace', fontSize: compact ? '9px' : '10px',
            color: '#ffddaa', stroke: '#000000', strokeThickness: 1,
          }).setDepth(dep + 1))
        }

        // Diamond row + XP progress bar
        const diamondY = ry + (compact ? 14 : 16)
        const mg = this.add.graphics().setDepth(dep + 2)
        objs.push(mg)

        // 3 diamonds
        const diamondSpacing = dSize * 3
        for (let i = 0; i < 3; i++) {
          const cx = infoX + dSize + i * diamondSpacing
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

        // XP progress bar (toward next level)
        const barX2 = infoX + 3 * diamondSpacing + dSize + 6
        const barH = compact ? 6 : 8
        const nextThreshold = level < 3 ? Player.MASTERY_THRESHOLDS[level] : Player.MASTERY_THRESHOLDS[2]
        const prevThreshold = level > 0 ? Player.MASTERY_THRESHOLDS[level - 1] : 0
        const progress = level >= 3 ? 1 : Math.min(1, (xp - prevThreshold) / (nextThreshold - prevThreshold))

        mg.fillStyle(0x1a1a2a)
        mg.fillRoundedRect(barX2, diamondY - barH / 2, barW, barH, 2)
        if (progress > 0) {
          mg.fillStyle(color, 0.8)
          mg.fillRoundedRect(barX2, diamondY - barH / 2, Math.max(2, barW * progress), barH, 2)
        }
        mg.lineStyle(1, color, 0.3)
        mg.strokeRoundedRect(barX2, diamondY - barH / 2, barW, barH, 2)

        // XP text
        const xpLabel = level >= 3 ? 'MAX' : `${Math.floor(xp)}/${nextThreshold}`
        objs.push(this.add.text(barX2 + barW + 6, diamondY, xpLabel, {
          fontFamily: 'monospace', fontSize: compact ? '8px' : '9px',
          color: level >= 3 ? '#ffdd44' : '#777777',
          stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0, 0.5).setDepth(dep + 1))
      })
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

  private saveScore(kills: number, timeMs: number, level: number, hero: string) {
    try {
      const raw = localStorage.getItem('claws_leaderboard')
      const board: { kills: number; time: number; level: number; hero: string }[] = raw ? JSON.parse(raw) : []
      board.push({ kills, time: timeMs, level, hero })
      board.sort((a, b) => b.kills - a.kills)
      localStorage.setItem('claws_leaderboard', JSON.stringify(board.slice(0, 5)))
      return board.slice(0, 5)
    } catch { return [] }
  }

  private showEndScreen() {
    const { width, height } = this.scale
    const gs = this.gameScene

    this.overlay.clear()
    this.overlay.fillStyle(0x000000, 0.75)
    this.overlay.fillRect(0, 0, width, height)
    this.overlay.setAlpha(1)

    const survived = gs.gameTime
    const mins = Math.floor(survived / 60000)
    const secs = Math.floor((survived % 60000) / 1000)
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

    const wasClaws = survived >= CONFIG.RUN_DURATION
    const title = wasClaws ? 'CRUSHED BY CLAWS' : 'GAME OVER'
    const titleColor = wasClaws ? '#ff6600' : '#ff4444'

    // Save score and get leaderboard
    const board = this.saveScore(gs.player.kills, survived, gs.player.level, gs.player.heroType)

    // Meta-progression: save session + check achievements
    const session: SessionRecord = {
      id: 0,
      hero: gs.player.heroType,
      kills: gs.player.kills,
      level: gs.player.level,
      timeMs: survived,
      wave: gs.waveManager?.currentWave || 1,
      won: survived >= CONFIG.RUN_DURATION,
      tookDamage: this._tookDamageThisRun,
      date: new Date().toISOString(),
      upgrades: [...gs.upgradeTracker.pickedGeneric, ...Object.keys(gs.upgradeTracker.skillLevels).filter(id => !gs.upgradeTracker.pickedGeneric.has(id))],
      goldEarned: gs.player.goldThisRun,
    }
    MetaProgress.recordSession(session)

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

    // Layout — left side: stats + buttons, right side: leaderboard
    const cx = width / 2
    const topY = height * 0.12

    // Title
    const t1 = this.add.text(cx, topY, title, {
      fontFamily: 'monospace', fontSize: '32px', color: titleColor,
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(31)

    // Stats panel
    const panelG = this.add.graphics().setDepth(31)
    const pw = 260, ph = 114
    const px = cx - pw / 2, py = topY + 44
    panelG.fillStyle(0x1a1a2e, 0.9)
    panelG.fillRoundedRect(px, py, pw, ph, 10)
    panelG.lineStyle(2, 0x444466)
    panelG.strokeRoundedRect(px, py, pw, ph, 10)

    const infoStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace', fontSize: '15px', color: '#cccccc',
      stroke: '#000000', strokeThickness: 2,
    }

    const t2 = this.add.text(cx, py + 18, `Time: ${timeStr}`, infoStyle).setOrigin(0.5).setDepth(32)
    const t3 = this.add.text(cx, py + 42, `Kills: ${gs.player.kills}`, { ...infoStyle, color: '#ff8888' }).setOrigin(0.5).setDepth(32)
    const t4 = this.add.text(cx, py + 66, `Level: ${gs.player.level}`, { ...infoStyle, color: '#66bbff' }).setOrigin(0.5).setDepth(32)
    const t4b = this.add.text(cx, py + 90, `Gold: ${gs.player.goldThisRun} ✦`, { ...infoStyle, color: '#FFD700' }).setOrigin(0.5).setDepth(32)

    // Leaderboard panel
    const lbG = this.add.graphics().setDepth(31)
    const lbW = 300, lbH = 36 + board.length * 24
    const lbX = cx - lbW / 2, lbY = py + ph + 18
    lbG.fillStyle(0x12122a, 0.9)
    lbG.fillRoundedRect(lbX, lbY, lbW, lbH, 8)
    lbG.lineStyle(1, 0x333355)
    lbG.strokeRoundedRect(lbX, lbY, lbW, lbH, 8)

    const lbTitle = this.add.text(cx, lbY + 14, 'LEADERBOARD', {
      fontFamily: 'monospace', fontSize: '13px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(32)

    const lbEntries: Phaser.GameObjects.Text[] = [lbTitle]
    board.forEach((entry, i) => {
      const m = Math.floor(entry.time / 60000)
      const s = Math.floor((entry.time % 60000) / 1000)
      const t = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      const isNew = i === board.findIndex(e => e.kills === gs.player.kills && e.time === survived)
      const color = isNew ? '#ffdd44' : '#888888'
      const txt = this.add.text(cx, lbY + 32 + i * 24,
        `${i + 1}. ${(HERO_DISPLAY_NAMES[entry.hero] || entry.hero).padEnd(7)} ${String(entry.kills).padStart(4)} kills  ${t}  Lv${entry.level}`,
        { fontFamily: 'monospace', fontSize: '12px', color, stroke: '#000000', strokeThickness: 1 }
      ).setOrigin(0.5).setDepth(32)
      lbEntries.push(txt)
    })

    // Buttons
    const btnY = lbY + lbH + 20
    const btnStyle = {
      fontFamily: 'monospace', fontSize: '18px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#2a2a4e', padding: { x: 20, y: 10 },
    }

    const t5 = this.add.text(cx, btnY, 'Try Again', btnStyle as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5).setInteractive().setDepth(32)
    t5.on('pointerover', () => t5.setColor('#ffffff'))
    t5.on('pointerout', () => t5.setColor('#FFD700'))
    t5.on('pointerdown', () => {
      const hero = gs.player.heroType
      const map = gs.scene.key
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop(map); sm.stop('UIScene')
      sm.start(map, { hero })
    })

    const t6 = this.add.text(cx, btnY + 46, 'Choose Hero', {
      ...btnStyle, fontSize: '14px', color: '#aaaaaa',
    } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5).setInteractive().setDepth(32)
    t6.on('pointerover', () => t6.setColor('#ffffff'))
    t6.on('pointerout', () => t6.setColor('#aaaaaa'))
    t6.on('pointerdown', () => {
      const sceneKey = gs.scene.key
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop(sceneKey); sm.stop('UIScene')
      sm.start('StartScene')
    })

    const t7 = this.add.text(cx, btnY + 86, 'FORGE', {
      ...btnStyle, fontSize: '14px', color: '#FFD700',
      backgroundColor: '#1a1a0a',
    } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5).setInteractive().setDepth(32)
    t7.on('pointerover', () => t7.setColor('#ffffff'))
    t7.on('pointerout', () => t7.setColor('#FFD700'))
    t7.on('pointerdown', () => {
      const sceneKey = gs.scene.key
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop(sceneKey); sm.stop('UIScene')
      sm.start('ForgeScene')
    })

    this.endTexts = [t1, t2, t3, t4, t4b, t5, t6, t7, panelG as any, lbG as any, ...lbEntries]
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
      fontFamily: 'monospace', fontSize: '12px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(51)

    const nameTexts = names.map((name, i) =>
      this.add.text(width / 2, bannerY + 34 + i * 22, `★ ${name}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2,
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

  private cleanup() {
    this.clearPause()
    this.endTexts.forEach((t) => t.destroy())
    this.endTexts = []
    this.overlay.setAlpha(0)
  }

  private drawMinimap() {
    const mm = this.minimap
    mm.clear()

    const size = CONFIG.MINIMAP_SIZE
    const margin = CONFIG.MINIMAP_MARGIN
    const { width } = this.scale
    const mapX = width - size - margin - 4
    const mapY = margin + 76

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

    // Enemies as colored dots
    for (const enemy of gs.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!enemy.active) continue
      const ex = toMmX(enemy.x)
      const ey = toMmY(enemy.y)
      if (ex < mapX || ex > mapX + size || ey < mapY || ey > mapY + size) continue
      if (enemy instanceof FlyingEye) mm.fillStyle(0xff4444)
      else if (enemy instanceof SandGolem) mm.fillStyle(0xff8800)
      else mm.fillStyle(0xcccccc)
      const s = enemy instanceof SandGolem ? 3 : 1.5
      mm.fillRect(ex - s / 2, ey - s / 2, s, s)
    }

    // Player — always at center
    mm.fillStyle(0x00ff66)
    mm.fillCircle(mapX + half, mapY + half, 3)
    mm.lineStyle(1, 0x00ff66, 0.4)
    mm.strokeCircle(mapX + half, mapY + half, 5)
  }

  update() {
    if (!this.gameScene?.player) return
    const p = this.gameScene.player

    // Detect player death directly
    if (p.hp <= 0 && !this.endScreenShown) {
      this.endScreenShown = true
      this.time.delayedCall(600, () => this.showEndScreen())
      return
    }
    if (this.endScreenShown) return

    // --- Timer text + pulse animation (always update, cheap) ---
    const remaining = Math.max(0, CONFIG.RUN_DURATION - this.gameScene.gameTime)
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    if (remaining < 60000) {
      this.timerText.setColor('#ff4444')
      const pulse = 0.85 + Math.sin(this.gameScene.gameTime / 200) * 0.15
      this.timerText.setScale(pulse)
    } else if (remaining < 120000) {
      this.timerText.setColor('#ffaa44')
      this.timerText.setScale(1)
    } else {
      this.timerText.setColor('#ffffff')
      this.timerText.setScale(1)
    }
    this.timerText.setText(timeStr)

    // --- Dirty-flag check: gather current driving values ---
    const curHp        = p.hp
    const curMaxHp     = p.maxHp
    const curXp        = p.xp
    const curXpMax     = p.xpToNextLevel()
    const curLevel     = p.level
    const curKills     = p.kills
    const curGold      = p.goldThisRun
    const curTimeSec   = Math.floor(remaining / 1000)

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
      curTimeSec   !== this._lastGameTimeSec ||
      this.time.now < this._critFlashUntil ||
      hpCritNow

    if (!dirty) {
      this._mmFrame = ((this._mmFrame || 0) + 1) % 3
      if (this._mmFrame === 0) this.drawMinimap()
      return
    }

    // Detect damage BEFORE caching (so _lastHp still has old value)
    const tookDamage = curHp < this._lastHp && this._lastHp > 0
    if (tookDamage) this._tookDamageThisRun = true

    // Update cached values
    this._lastHp           = curHp
    this._lastMaxHp        = curMaxHp
    this._lastXp           = curXp
    this._lastXpMax        = curXpMax
    this._lastLevel        = curLevel
    this._lastEnergy1      = curEnergy1
    this._lastEnergy2      = curEnergy2
    this._lastKills        = curKills
    this._lastGold         = curGold
    this._lastGameTimeSec  = curTimeSec

    // Kill milestone announcements
    const KILL_MILESTONES: [number, string][] = [
      [50, '50 KILLS'], [100, 'CENTURION'], [250, 'SLAUGHTER'], [500, 'MASSACRE'], [1000, 'GENOCIDE'],
    ]
    for (const [threshold, label] of KILL_MILESTONES) {
      if (curKills >= threshold && !this._killMilestones.has(threshold)) {
        this._killMilestones.add(threshold)
        this.showAnnounce(label)
      }
    }


    const g = this.hud
    g.clear()

    // === HERO COLOR for LVL circle border ===
    const HERO_COLORS: Record<string, number> = {
      ignara: 0xe84118, sifra: 0x82ccdd, amun: 0xfff200, nazar: 0xc23616,
      huntress: 0x2ecc71, khashin: 0x88ddff, muller: 0x44aaff,
    }
    const heroColor = HERO_COLORS[p.heroType] ?? 0xaaaaaa

    // === LAYOUT CONSTANTS ===
    // LVL circle (48px, like buff icons) at far left, then bars to its right
    const lvlSize = 48
    const lvlX = 4                             // circle left edge
    const lvlCX = lvlX + lvlSize / 2           // circle center X
    const barX = lvlX + lvlSize + 4            // bars start after circle
    const ebW = 95, ebGap = 3
    const barW = ebW * 2 + ebGap               // HP bar = combined energy width (193px)
    const hpBarH = 24, ebH = 12
    const hpBarY = 24                          // HP bar top (below XP bar)
    const ebY = hpBarY + hpBarH + 3            // energy bars top
    const lvlCY = hpBarY + (hpBarH + 3 + ebH) / 2  // vertically center with bars

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

    g.fillStyle(0x220808)
    g.fillRoundedRect(barX, hpBarY, barW, hpBarH, 2)
    const hpFillW = Math.floor(barW * hpRatio)
    if (hpFillW > 0) {
      const c = isFlashing ? 0xffffff : hpRatio > 0.5 ? 0xcc2222 : hpRatio > 0.25 ? 0xdd6622 : 0xff2222
      g.fillStyle(c)
      g.fillRoundedRect(barX, hpBarY, hpFillW, hpBarH, 2)
    }
    g.lineStyle(1, isFlashing ? 0xffffff : 0x551111)
    g.strokeRoundedRect(barX, hpBarY, barW, hpBarH, 2)

    this.hpText.setText(`${Math.ceil(p.hp)}/${p.maxHp}`)
    this.hpText.setPosition(barX + barW / 2, hpBarY + hpBarH / 2).setOrigin(0.5)

    // === XP (top bar, full width) ===
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
      // Main fill
      g.fillStyle(0x2266cc)
      g.fillRoundedRect(xpPad, xpTopY, xpFillW, xpTopH, 4)
      // Top highlight strip
      g.fillStyle(0x4499ff, 0.6)
      g.fillRect(xpPad + 2, xpTopY + 1, xpFillW - 4, 3)
      // Bright specular line
      g.fillStyle(0x88ccff, 0.4)
      g.fillRect(xpPad + 2, xpTopY + 2, xpFillW - 4, 1)
      // Bottom shadow
      g.fillStyle(0x001133, 0.4)
      g.fillRect(xpPad + 2, xpTopY + xpTopH - 3, xpFillW - 4, 2)
      // Animated color glints (VS-style shimmer)
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

    // === ENERGY BARS (directly below HP, aligned) ===
    const hasEnergy = (p.heroType === 'sifra' || p.heroType === 'nazar' || p.heroType === 'huntress' || p.heroType === 'khashin' || (p.heroType === 'amun' && p.hasQuakeStance))
    if (hasEnergy) {
      const rightBarX = barX + ebW + ebGap

      const drawDualBars = (
        leftRatio: number, leftActive: number, leftDim: number, leftBorder: number,
        rightRatio: number, rightActive: number, rightDim: number, rightBorder: number,
        leftIsActive: boolean, rightIsActive: boolean,
      ) => {
        // Left bar
        g.fillStyle(0x0a0a0a)
        g.fillRect(barX, ebY, ebW, ebH)
        if (leftRatio > 0) {
          g.fillStyle(leftIsActive ? leftActive : leftDim)
          g.fillRect(barX, ebY, ebW * leftRatio, ebH)
        }
        g.lineStyle(1, leftBorder, 0.5)
        g.strokeRect(barX, ebY, ebW, ebH)
        // Right bar
        g.fillStyle(0x0a0a0a)
        g.fillRect(rightBarX, ebY, ebW, ebH)
        if (rightRatio > 0) {
          g.fillStyle(rightIsActive ? rightActive : rightDim)
          g.fillRect(rightBarX, ebY, ebW * rightRatio, ebH)
        }
        g.lineStyle(1, rightBorder, 0.5)
        g.strokeRect(rightBarX, ebY, ebW, ebH)
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
    }

    // === MASTERY DIAMONDS (on energy bars) + STANCE LABELS ===
    if (hasEnergy) {
      const rightBarX = barX + ebW + ebGap
      const branchColor: Record<string, number> = {
        ice: 0x55aaff, lightning: 0x9966ff,
        sword: 0xcc4444, venom: 0x44cc44,
        melee: 0xe67e22, spear: 0x2ecc71,
        wind: 0x88ddff, sand: 0xddaa44,
        ground: 0xddaa22, quake: 0xff8833,
      }
      const heroBranches: Record<string, [string, string]> = {
        sifra: ['ice', 'lightning'], nazar: ['sword', 'venom'],
        huntress: ['melee', 'spear'], khashin: ['wind', 'sand'],
      }
      let branches: [string, string] | null = heroBranches[p.heroType] || null
      if (p.heroType === 'amun' && p.hasQuakeStance) branches = ['ground', 'quake']

      if (branches) {
        const dSize = 4
        const diamondCY = ebY + ebH / 2  // centered on energy bar

        const drawBarDiamonds = (branch: string, bx: number, bw: number) => {
          const level = p.getMasteryLevel(branch)
          const color = branchColor[branch] ?? 0xaaaaaa
          const spacing = bw / 4
          for (let i = 0; i < 3; i++) {
            const cx = bx + spacing * (i + 1)
            const cy = diamondCY
            if (i < level) {
              g.fillStyle(0xffffff, 0.85)
              g.fillTriangle(cx, cy - dSize, cx + dSize, cy, cx - dSize, cy)
              g.fillTriangle(cx, cy + dSize, cx + dSize, cy, cx - dSize, cy)
            } else {
              g.lineStyle(1.5, color, 0.45)
              g.beginPath()
              g.moveTo(cx, cy - dSize)
              g.lineTo(cx + dSize, cy)
              g.lineTo(cx, cy + dSize)
              g.lineTo(cx - dSize, cy)
              g.closePath()
              g.strokePath()
            }
          }
        }

        drawBarDiamonds(branches[0], barX, ebW)
        drawBarDiamonds(branches[1], rightBarX, ebW)
      }
    }

    // === BIG BUFF ICONS (unified row below HP/energy) ===
    {
      const buffStartY = hasEnergy ? ebY + ebH + 24 : hpBarY + hpBarH + 14
      const buffSize = 48
      const buffGap = 4
      const buffX = barX
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
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
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

    }

    // === TOP-RIGHT: Kills & Tier (panel above minimap) ===
    this.killText.setText(`● ${p.kills} kills`)
    if (curGold !== this._lastGold && this._lastGold >= 0) {
      // Bump animation on gold change
      this.tweens.add({
        targets: [this.goldText, this.goldIcon],
        scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true,
      })
    }
    this.goldText.setText(`${p.goldThisRun}`)
    // Reposition coin icon to left of text
    this.goldIcon.setPosition(this.scale.width - 20 - this.goldText.width - 10, 55)

    const tier = this.gameScene.waveManager?.currentWave || 1
    const tierStars = tier >= 8 ? 'DANGER' : tier >= 5 ? 'HARD' : tier >= 3 ? 'MEDIUM' : 'EASY'
    const tierColor = tier >= 8 ? '#ff4444' : tier >= 5 ? '#ffaa44' : tier >= 3 ? '#ffff66' : '#88ff88'
    this.tierText.setText(`TIER ${tier}  ${tierStars}`).setColor(tierColor)

    // Kills/tier/gold background panel
    const killPanelW = 130, killPanelH = 56
    const killPanelX = this.scale.width - killPanelW - 10
    const killPanelY = 8
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
}
