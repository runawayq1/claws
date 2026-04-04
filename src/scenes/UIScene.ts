import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { GameScene } from './GameScene'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'
import { MetaProgress, type SessionRecord } from '../systems/MetaProgress'
import { SessionLogger } from '../systems/SessionLogger'

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
  private endTexts: Phaser.GameObjects.Text[] = []
  private endScreenShown = false
  private isPaused = false
  private pauseOverlay!: Phaser.GameObjects.Graphics
  private pauseTexts: Phaser.GameObjects.Text[] = []
  private pauseBtn!: Phaser.GameObjects.Text
  private stanceBtn: Phaser.GameObjects.Text | null = null
  private stanceIcon: Phaser.GameObjects.Graphics | null = null

  constructor() {
    super({ key: 'UIScene' })
  }

  create(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene || (this.scene.get('GameScene') as GameScene)

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }

    // Main HUD graphics layer
    this.hud = this.add.graphics()

    // Hero portrait — use spritesheet idle frame
    const ht = this.gameScene.player.heroType
    const srcMap: Record<string, string> = {}
    const srcHero = srcMap[ht] || ht
    const spriteKey = `${srcHero}_idle`
    const tints: Record<string, number> = {}
    if (this.textures.exists(spriteKey)) {
      const scales: Record<string, number> = { ignara: 0.33, sifra: 0.28, nazar: 0.36, amun: 0.50 }
      const yOffsets: Record<string, number> = { amun: -10 }
      const portrait = this.add.sprite(34, 30 + (yOffsets[ht] || 0), spriteKey, 0).setScale(scales[ht] || 0.3).setDepth(2)
      if (tints[ht]) portrait.setTint(tints[ht])
    } else {
      this.add.image(34, 30, `hero_${ht}`).setScale(0.6).setDepth(2)
    }

    // HP text
    this.hpText = this.add.text(60, 14, '', textStyle).setDepth(2)

    // Level badge
    this.lvlText = this.add.text(60, 46, '', {
      ...textStyle,
      fontSize: '12px',
      color: '#66bbff',
    }).setDepth(2)

    // Kills (top-right) — with skull icon
    this.killText = this.add.text(0, 14, '', {
      ...textStyle,
      fontSize: '14px',
      color: '#ff8888',
    }).setDepth(2)

    // Difficulty tier (top-right under kills)
    this.tierText = this.add.text(0, 32, '', {
      ...textStyle,
      fontSize: '11px',
      color: '#ffaa44',
    }).setDepth(2)

    // Countdown timer (top-center)
    this.timerText = this.add.text(0, 6, '', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setDepth(2)

    // Center announcement
    this.announcement = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(20)

    // Minimap
    this.minimap = this.add.graphics().setDepth(2)

    // Pause button (top-center-left, next to timer)
    this.pauseBtn = this.add.text(0, 0, '||', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#1a1a2e',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setInteractive().setDepth(25)
    this.pauseBtn.on('pointerover', () => { if (!this.isPaused) this.pauseBtn.setColor('#ffffff') })
    this.pauseBtn.on('pointerout', () => { if (!this.isPaused) this.pauseBtn.setColor('#aaaaaa') })
    this.pauseBtn.on('pointerdown', () => this.togglePause())

    // Spacebar pause/resume (desktop)
    if (this.input.keyboard) {
      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      spaceKey.on('down', () => this.togglePause())
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
        backgroundColor: '#1a1a2e', padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setInteractive().setDepth(3)
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
        backgroundColor: '#1a1a2e', padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setInteractive().setDepth(3)
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
        backgroundColor: '#1a1a2e', padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setInteractive().setDepth(3)
      this.stanceBtn.on('pointerdown', () => {
        this.gameScene.player.toggleHuntressStance()
      })
      this.stanceBtn.on('pointerover', () => this.stanceBtn?.setColor('#ffffff'))
      this.stanceBtn.on('pointerout', () => this.updateHuntressStanceBtn())
      this.gameScene.events.on('huntress-stance-changed', () => this.updateHuntressStanceBtn())
      this.updateHuntressStanceBtn()
    }

    // CLAWS warning
    this.events.on('claws-warning', () => {
      this.showAnnounce('THE CLAWS ARE COMING...', '#ff2222')
    })

    this.updatePositions()
    this.scale.on('resize', () => this.updatePositions())
  }

  private updatePositions() {
    const { width, height } = this.scale
    this.killText.setPosition(width - 20, 14).setOrigin(1, 0)
    this.tierText.setPosition(width - 20, 32).setOrigin(1, 0)
    this.timerText.setPosition(width / 2, 10).setOrigin(0.5, 0)
    this.pauseBtn.setPosition(width / 2 + 60, 22)
    this.announcement.setPosition(width / 2, height / 2 - 50)
    if (this.stanceBtn) this.stanceBtn.setPosition(120, 100)
  }

  private updateStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    const p = this.gameScene.player
    const isLightning = p.stance === 'lightning'
    const label = isLightning ? '⚡ LIGHTNING [Q]' : '❄ ICE [Q]'
    const color = isLightning ? '#bb88ff' : '#88ddff'
    this.stanceBtn.setText(label).setColor(color)

    // Colored dot indicator
    this.stanceIcon.clear()
    const bx = 120 - this.stanceBtn.width / 2 - 12
    const by = 100
    this.stanceIcon.fillStyle(isLightning ? 0x9966ff : 0x55aaff)
    this.stanceIcon.fillCircle(bx, by, 4)
  }

  private updateNazarStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    const p = this.gameScene.player
    const isVenom = p.nazarStance === 'venom'
    const label = isVenom ? '☠ VENOM [Q]' : '⚔ SWORD [Q]'
    const color = isVenom ? '#44cc44' : '#ff6644'
    this.stanceBtn.setText(label).setColor(color)
    this.stanceIcon.clear()
    const bx = 120 - this.stanceBtn.width / 2 - 12
    const by = 100
    this.stanceIcon.fillStyle(isVenom ? 0x44cc44 : 0xcc4444)
    this.stanceIcon.fillCircle(bx, by, 4)
  }

  private updateHuntressStanceBtn() {
    if (!this.stanceBtn || !this.stanceIcon) return
    const p = this.gameScene.player
    const isSpear = p.huntressStance === 'spear'
    const label = isSpear ? '🏹 SPEAR [Q]' : '⚔ MELEE [Q]'
    const color = isSpear ? '#2ecc71' : '#e67e22'
    this.stanceBtn.setText(label).setColor(color)
    this.stanceIcon.clear()
    const bx = 120 - this.stanceBtn.width / 2 - 12
    const by = 100
    this.stanceIcon.fillStyle(isSpear ? 0x2ecc71 : 0xe67e22)
    this.stanceIcon.fillCircle(bx, by, 4)
  }

  private showAnnounce(text: string, color = '#FFD700') {
    this.announcement.setText(text).setColor(color).setAlpha(1).setScale(0.5)
    this.tweens.add({
      targets: this.announcement,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    })
    this.tweens.add({
      targets: this.announcement,
      alpha: 0,
      duration: 2000,
      delay: 3000,
    })
  }

  private togglePause() {
    if (this.endScreenShown) return

    this.isPaused = !this.isPaused
    const { width, height } = this.scale

    if (this.isPaused) {
      // Pause the game scene
      this.scene.pause('GameScene')
      this.pauseBtn.setText('▶').setColor('#66ff66')

      // Dark overlay
      this.pauseOverlay.clear()
      this.pauseOverlay.fillStyle(0x000000, 0.6)
      this.pauseOverlay.fillRect(0, 0, width, height)
      this.pauseOverlay.setAlpha(1)

      // Pause text
      const t1 = this.add.text(width / 2, height * 0.35, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(29)

      const t2 = this.add.text(width / 2, height * 0.35 + 50, 'SPACE or tap || to resume', {
        fontFamily: 'monospace', fontSize: '14px', color: '#888888',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(29)

      // Choose Hero button in pause
      const t3 = this.add.text(width / 2, height * 0.35 + 100, 'Choose Hero', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#2a2a4e', padding: { x: 16, y: 8 },
      } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setInteractive().setDepth(29)
      t3.on('pointerover', () => t3.setColor('#ffffff'))
      t3.on('pointerout', () => t3.setColor('#aaaaaa'))
      t3.on('pointerdown', () => {
        this.clearPause()
        this.cleanup()
        const sm = this.game.scene
        sm.stop('LevelUpScene'); sm.stop('GameScene'); sm.stop('UIScene')
        sm.start('StartScene')
      })

      this.pauseTexts = [t1, t2, t3]
    } else {
      this.clearPause()
      this.scene.resume('GameScene')
    }
  }

  private clearPause() {
    this.isPaused = false
    this.pauseBtn.setText('||').setColor('#aaaaaa')
    this.pauseOverlay.setAlpha(0)
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
      date: new Date().toISOString(),
      upgrades: [...gs.upgradeTracker.pickedGeneric, ...gs.upgradeTracker.pickedPersonal],
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
    const pw = 260, ph = 90
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
        `${i + 1}. ${entry.hero.padEnd(7)} ${String(entry.kills).padStart(4)} kills  ${t}  Lv${entry.level}`,
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
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop('GameScene'); sm.stop('UIScene')
      sm.start('GameScene', { hero })
    })

    const t6 = this.add.text(cx, btnY + 46, 'Choose Hero', {
      ...btnStyle, fontSize: '14px', color: '#aaaaaa',
    } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5).setInteractive().setDepth(32)
    t6.on('pointerover', () => t6.setColor('#ffffff'))
    t6.on('pointerout', () => t6.setColor('#aaaaaa'))
    t6.on('pointerdown', () => {
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop('GameScene'); sm.stop('UIScene')
      sm.start('StartScene')
    })

    this.endTexts = [t1, t2, t3, t4, t5, t6, panelG as any, lbG as any, ...lbEntries]
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
    const mapY = margin + 50

    // Background with frame
    mm.fillStyle(0x0a0a1a, 0.75)
    mm.fillRoundedRect(mapX - 2, mapY - 2, size + 4, size + 4, 4)
    mm.fillStyle(0x111122, 0.85)
    mm.fillRect(mapX, mapY, size, size)

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

    const scaleX = size / CONFIG.WORLD_WIDTH
    const scaleY = size / CONFIG.WORLD_HEIGHT

    const gs = this.gameScene
    if (!gs?.player) return

    // Enemies as colored dots
    for (const enemy of gs.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!enemy.active) continue
      if (enemy instanceof FlyingEye) mm.fillStyle(0xff4444)
      else if (enemy instanceof SandGolem) mm.fillStyle(0xff8800)
      else mm.fillStyle(0xcccccc)
      const ex = mapX + enemy.x * scaleX
      const ey = mapY + enemy.y * scaleY
      const s = enemy instanceof SandGolem ? 3 : 1.5
      mm.fillRect(ex - s / 2, ey - s / 2, s, s)
    }

    // Camera viewport
    const cam = gs.cameras.main
    mm.lineStyle(1, 0x4488aa, 0.6)
    mm.strokeRect(
      mapX + cam.scrollX * scaleX,
      mapY + cam.scrollY * scaleY,
      cam.width * scaleX,
      cam.height * scaleY,
    )

    // Player — bright dot with ring
    const px = mapX + gs.player.x * scaleX
    const py = mapY + gs.player.y * scaleY
    mm.fillStyle(0x00ff66)
    mm.fillCircle(px, py, 3)
    mm.lineStyle(1, 0x00ff66, 0.4)
    mm.strokeCircle(px, py, 5)
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

    const g = this.hud
    g.clear()

    // === TOP-LEFT: HP/XP Panel (with padding from edges) ===
    const panelW = 210, panelH = 66
    const px = 14, py = 10

    // Panel background
    g.fillStyle(0x0a0a1a, 0.7)
    g.fillRoundedRect(px, py, panelW, panelH, 8)
    g.lineStyle(1, 0x333355)
    g.strokeRoundedRect(px, py, panelW, panelH, 8)

    // Portrait frame
    g.lineStyle(2, 0x666688)
    g.strokeCircle(34, 30, 14)

    // HP bar
    const hpBarX = 60, hpBarY = 18, hpBarW = 152, hpBarH = 14
    // Bar background
    g.fillStyle(0x1a0000)
    g.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 3)
    // HP fill
    const hpRatio = Math.max(0, p.hp / p.maxHp)
    const hpColor = hpRatio > 0.5 ? 0xcc2222 : hpRatio > 0.25 ? 0xcc6622 : 0xff2222
    if (hpRatio > 0) {
      g.fillStyle(hpColor)
      g.fillRoundedRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH, 3)
      // Shine highlight
      g.fillStyle(0xffffff, 0.15)
      g.fillRect(hpBarX + 2, hpBarY + 1, hpBarW * hpRatio - 4, 4)
    }
    // HP bar frame
    g.lineStyle(1, 0x662222)
    g.strokeRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 3)

    this.hpText.setText(`${Math.ceil(p.hp)}/${p.maxHp}`)

    // XP bar
    const xpBarX = 60, xpBarY = 50, xpBarW = 152, xpBarH = 10
    g.fillStyle(0x000a1a)
    g.fillRoundedRect(xpBarX, xpBarY, xpBarW, xpBarH, 2)
    const xpRatio = p.xp / p.xpToNextLevel()
    if (xpRatio > 0) {
      g.fillStyle(0x2266cc)
      g.fillRoundedRect(xpBarX, xpBarY, xpBarW * xpRatio, xpBarH, 2)
      g.fillStyle(0xffffff, 0.12)
      g.fillRect(xpBarX + 2, xpBarY + 1, xpBarW * xpRatio - 4, 3)
    }
    g.lineStyle(1, 0x223366)
    g.strokeRoundedRect(xpBarX, xpBarY, xpBarW, xpBarH, 2)

    // Level badge
    const lvlBadgeX = 52, lvlBadgeY = 44
    g.fillStyle(0x1a1a3e)
    g.fillCircle(lvlBadgeX, lvlBadgeY, 9)
    g.lineStyle(1, 0x4488ff)
    g.strokeCircle(lvlBadgeX, lvlBadgeY, 9)
    this.lvlText.setPosition(lvlBadgeX, lvlBadgeY).setOrigin(0.5)
    this.lvlText.setText(`${p.level}`)

    // HP text centered in bar
    this.hpText.setPosition(hpBarX + hpBarW / 2, hpBarY + hpBarH / 2).setOrigin(0.5)

    // === SIFRA ENERGY BARS (below HP/XP panel) ===
    if (p.heroType === 'sifra') {
      const ebX = 14, ebY = 80, ebW = 95, ebH = 6, ebGap = 3
      // Panel bg
      g.fillStyle(0x0a0a1a, 0.7)
      g.fillRoundedRect(ebX, ebY - 2, ebW * 2 + ebGap + 8, ebH + 4, 4)

      // Ice energy bar (left)
      const iceRatio = p.iceEnergy / p.maxEnergy
      g.fillStyle(0x0a1a2a)
      g.fillRect(ebX + 3, ebY, ebW, ebH)
      if (iceRatio > 0) {
        const iceColor = p.stance === 'ice' ? 0x55aaff : 0x2a5580
        g.fillStyle(iceColor)
        g.fillRect(ebX + 3, ebY, ebW * iceRatio, ebH)
      }
      g.lineStyle(1, 0x335577)
      g.strokeRect(ebX + 3, ebY, ebW, ebH)

      // Lightning energy bar (right)
      const ltRatio = p.lightningEnergy / p.maxEnergy
      const ltX = ebX + 3 + ebW + ebGap
      g.fillStyle(0x1a0a2a)
      g.fillRect(ltX, ebY, ebW, ebH)
      if (ltRatio > 0) {
        const ltColor = p.stance === 'lightning' ? 0x9966ff : 0x4a3380
        g.fillStyle(ltColor)
        g.fillRect(ltX, ebY, ebW * ltRatio, ebH)
      }
      g.lineStyle(1, 0x553377)
      g.strokeRect(ltX, ebY, ebW, ebH)
    }

    // === NAZAR ENERGY BARS (below HP/XP panel) ===
    if (p.heroType === 'nazar') {
      const ebX = 14, ebY = 80, ebW = 95, ebH = 6, ebGap = 3
      g.fillStyle(0x0a0a1a, 0.7)
      g.fillRoundedRect(ebX, ebY - 2, ebW * 2 + ebGap + 8, ebH + 4, 4)

      const swordRatio = p.swordEnergy / p.maxEnergy
      g.fillStyle(0x1a0a0a)
      g.fillRect(ebX + 3, ebY, ebW, ebH)
      if (swordRatio > 0) {
        g.fillStyle(p.nazarStance === 'sword' ? 0xcc4444 : 0x662222)
        g.fillRect(ebX + 3, ebY, ebW * swordRatio, ebH)
      }
      g.lineStyle(1, 0x553333)
      g.strokeRect(ebX + 3, ebY, ebW, ebH)

      const venomRatio = p.venomEnergy / p.maxEnergy
      const vX = ebX + 3 + ebW + ebGap
      g.fillStyle(0x0a1a0a)
      g.fillRect(vX, ebY, ebW, ebH)
      if (venomRatio > 0) {
        g.fillStyle(p.nazarStance === 'venom' ? 0x44cc44 : 0x226622)
        g.fillRect(vX, ebY, ebW * venomRatio, ebH)
      }
      g.lineStyle(1, 0x335533)
      g.strokeRect(vX, ebY, ebW, ebH)
    }

    // === HUNTRESS ENERGY BARS (below HP/XP panel) ===
    if (p.heroType === 'huntress') {
      const ebX = 14, ebY = 80, ebW = 95, ebH = 6, ebGap = 3
      g.fillStyle(0x0a0a1a, 0.7)
      g.fillRoundedRect(ebX, ebY - 2, ebW * 2 + ebGap + 8, ebH + 4, 4)

      const meleeRatio = p.meleeEnergy / p.maxEnergy
      g.fillStyle(0x1a0d00)
      g.fillRect(ebX + 3, ebY, ebW, ebH)
      if (meleeRatio > 0) {
        g.fillStyle(p.huntressStance === 'melee' ? 0xe67e22 : 0x734011)
        g.fillRect(ebX + 3, ebY, ebW * meleeRatio, ebH)
      }
      g.lineStyle(1, 0x553311)
      g.strokeRect(ebX + 3, ebY, ebW, ebH)

      const spearRatio = p.spearEnergy / p.maxEnergy
      const sX = ebX + 3 + ebW + ebGap
      g.fillStyle(0x001a0a)
      g.fillRect(sX, ebY, ebW, ebH)
      if (spearRatio > 0) {
        g.fillStyle(p.huntressStance === 'spear' ? 0x2ecc71 : 0x176638)
        g.fillRect(sX, ebY, ebW * spearRatio, ebH)
      }
      g.lineStyle(1, 0x115533)
      g.strokeRect(sX, ebY, ebW, ebH)
    }

    // === AMUN BUFF INDICATORS (below HP/XP panel) ===
    if (p.heroType === 'amun') {
      const buffY = 82
      const buffX = 14
      const buffSize = 12
      const buffGap = 3
      let bi = 0

      const drawBuff = (active: boolean, color: number) => {
        const bx = buffX + bi * (buffSize + buffGap)
        g.fillStyle(active ? color : 0x222233, active ? 0.8 : 0.3)
        g.fillRoundedRect(bx, buffY, buffSize, buffSize, 2)
        g.lineStyle(1, active ? color : 0x333344, active ? 0.8 : 0.3)
        g.strokeRoundedRect(bx, buffY, buffSize, buffSize, 2)
        bi++
      }

      if (p.defenseAuraActive !== undefined) drawBuff(p.defenseAuraActive, 0x4488ff)
      if (p.hasPassiveAura)                  drawBuff(p.hasPassiveAura, 0xfff200)
      if (p.dmgAuraActive !== undefined)     drawBuff(p.dmgAuraActive, 0xff8800)
      if (p.hasUndying)                      drawBuff(p.hasUndying, 0xffee88)
      if (p.hasThorns)                       drawBuff(p.hasThorns, 0xffdd44)
      if (p.hasIronWill)                     drawBuff(p.hasIronWill, 0x88aacc)
      if (p.hasEarthquake)                   drawBuff(p.hasEarthquake, 0xccaa55)
      if (p.hasGravityWell)                  drawBuff(p.hasGravityWell, 0x9966ff)
      if (p.hasDivineJudgment)               drawBuff(p.hasDivineJudgment, 0xfff200)
      if (p.hasColossus)                     drawBuff(p.hasColossus, 0xffcc44)
      if (p.hasCataclysm)                    drawBuff(p.hasCataclysm, 0xff6600)
      if (p.hasLowHpRegen)                   drawBuff(p.hasLowHpRegen, 0x44ff88)
      if (p.hasLivingFortress)               drawBuff(p.hasLivingFortress, 0xaaccff)
      if (p.hasWrath)                        drawBuff(p.hasWrath, 0xff3333)
    }

    // === TOP-RIGHT: Kills & Tier (panel above minimap) ===
    this.killText.setText(`${p.kills} kills`)

    const tier = this.gameScene.waveManager?.currentWave || 1
    const tierStars = tier >= 8 ? 'DANGER' : tier >= 5 ? 'HARD' : tier >= 3 ? 'MEDIUM' : 'EASY'
    const tierColor = tier >= 8 ? '#ff4444' : tier >= 5 ? '#ffaa44' : tier >= 3 ? '#ffff66' : '#88ff88'
    this.tierText.setText(`Tier ${tier} - ${tierStars}`).setColor(tierColor)

    // Kills/tier background panel
    const killPanelW = 130, killPanelH = 40
    const killPanelX = this.scale.width - killPanelW - 14
    const killPanelY = 8
    g.fillStyle(0x0a0a1a, 0.6)
    g.fillRoundedRect(killPanelX, killPanelY, killPanelW, killPanelH, 6)
    g.lineStyle(1, 0x333355)
    g.strokeRoundedRect(killPanelX, killPanelY, killPanelW, killPanelH, 6)

    // === TOP-CENTER: Timer ===
    const remaining = Math.max(0, CONFIG.RUN_DURATION - this.gameScene.gameTime)
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

    if (remaining < 60000) {
      this.timerText.setColor('#ff4444')
      // Pulse effect in last minute
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

    // Timer background pill
    const tw = this.timerText.width + 20
    const th = this.timerText.height + 8
    const tx = this.scale.width / 2 - tw / 2
    g.fillStyle(0x0a0a1a, 0.6)
    g.fillRoundedRect(tx, 6, tw, th, 6)

    // Minimap
    this.drawMinimap()
  }
}
