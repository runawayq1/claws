import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { GameScene } from './GameScene'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'
import { GENERIC_POOL, HERO_BRANCHES } from '../systems/UpgradeSystem'
import { MetaProgress, type SessionRecord } from '../systems/MetaProgress'
import { SessionLogger } from '../systems/SessionLogger'

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
  private endTexts: Phaser.GameObjects.Text[] = []
  private endScreenShown = false
  private isPaused = false
  private pauseOverlay!: Phaser.GameObjects.Graphics
  private pauseTexts: Phaser.GameObjects.Text[] = []
  private pauseBtn!: Phaser.GameObjects.Text
  private stanceBtn: Phaser.GameObjects.Text | null = null
  private stanceIcon: Phaser.GameObjects.Graphics | null = null
  private _buffLabels: (Phaser.GameObjects.Text | null)[] = []

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
      this.scene.pause(this.gameScene.scene.key)
      this.pauseBtn.setText('▶').setColor('#66ff66')

      const gs = this.gameScene
      const p = gs.player
      const tracker = gs.upgradeTracker
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

      // ── Content area ──
      const contentTop = py + (compact ? 62 : 82)
      const contentBot = py + panelH - (compact ? 44 : 60)
      const midX = px + panelW / 2

      // ── Divider line ──
      panelG.lineStyle(1, 0x334466, 0.4)
      panelG.lineBetween(midX, contentTop + 4, midX, contentBot - 4)

      // ── Left: Stats ──
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
        panelG.lineStyle(1, 0x445566, 0.3)
        panelG.lineBetween(x, y + (compact ? 13 : 16), x + (compact ? 100 : 140), y + (compact ? 13 : 16))
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
      statRow('Cooldown', `${p.attackCooldown}ms`)
      statRow('Armor', `${Math.round(p.armor * 100)}%`)
      statRow('HP Regen', `${p.hpRegen}/s`)
      statRow('Splash', `${p.splashRadius}px`)
      statRow('Strikes', `${p.strikeCount}`)
      if (tracker.chosenBranch) {
        statRow('Branch', tracker.chosenBranch)
      }

      // ── Right: Skills ──
      const rightX = midX + (compact ? 12 : 20)
      let ry = contentTop

      sectionTitle(rightX, ry, '◆ SKILLS')
      ry += compact ? 18 : 24

      // Collect picked skills
      const pickedSkills: { label: string; desc: string }[] = []
      for (const id of tracker.pickedPersonal) {
        const branches = HERO_BRANCHES[p.heroType] || []
        for (const b of branches) {
          const skill = b.upgrades.find(u => u.id === id)
          if (skill) { pickedSkills.push({ label: skill.label, desc: skill.desc }); break }
        }
      }
      for (const id of tracker.pickedGeneric) {
        const skill = GENERIC_POOL.find(u => u.id === id)
        if (skill) pickedSkills.push({ label: skill.label, desc: skill.desc })
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

      // ── Bottom buttons ──
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
    } else {
      this.clearPause()
      this.scene.resume(this.gameScene.scene.key)
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
      const sceneKey = gs.scene.key
      this.cleanup()
      const sm = this.game.scene
      sm.stop('LevelUpScene'); sm.stop(sceneKey); sm.stop('UIScene')
      sm.start(sceneKey, { hero })
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

    // Zone rings (world center 1500,1500 mapped to minimap coords)
    const cx = mapX + 1500 * scaleX
    const cy = mapY + 1500 * scaleY
    const zoneRings: [number, number, number][] = [
      [600,  0x888888, 0.3],
      [1200, 0x448844, 0.3],
      [1800, 0x888866, 0.3],
      [2400, 0x446644, 0.3],
    ]
    for (const [worldRadius, color, alpha] of zoneRings) {
      mm.lineStyle(1, color, alpha)
      mm.strokeCircle(cx, cy, worldRadius * scaleX)
    }

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

    // === KHASHIN ENERGY BARS (below HP/XP panel) ===
    if (p.heroType === 'khashin') {
      const ebX = 14, ebY = 80, ebW = 95, ebH = 6, ebGap = 3
      g.fillStyle(0x0a0a1a, 0.7)
      g.fillRoundedRect(ebX, ebY - 2, ebW * 2 + ebGap + 8, ebH + 4, 4)

      // Wind energy bar (left — sirocco/ranged)
      const windRatio = p.windEnergy / p.maxEnergy
      g.fillStyle(0x0a1a2a)
      g.fillRect(ebX + 3, ebY, ebW, ebH)
      if (windRatio > 0) {
        g.fillStyle(p.khashinStance === 'sirocco' ? 0x88ddff : 0x446688)
        g.fillRect(ebX + 3, ebY, ebW * windRatio, ebH)
      }
      g.lineStyle(1, 0x335577)
      g.strokeRect(ebX + 3, ebY, ebW, ebH)

      // Sand energy bar (right — haboob/melee)
      const sandRatio = p.sandEnergy / p.maxEnergy
      const sX = ebX + 3 + ebW + ebGap
      g.fillStyle(0x1a1000)
      g.fillRect(sX, ebY, ebW, ebH)
      if (sandRatio > 0) {
        g.fillStyle(p.khashinStance === 'haboob' ? 0xddaa44 : 0x6e5522)
        g.fillRect(sX, ebY, ebW * sandRatio, ebH)
      }
      g.lineStyle(1, 0x554411)
      g.strokeRect(sX, ebY, ebW, ebH)
    }

    // === UNIVERSAL BUFF PANEL (below HP/XP panel, all heroes) ===
    {
      const buffY = 82
      const buffX = 14
      const buffSize = 14
      const buffGap = 3
      let bi = 0

      const drawBuff = (active: boolean, color: number, label?: string, stacks?: number) => {
        if (!active) return
        const bx = buffX + bi * (buffSize + buffGap)
        g.fillStyle(color, 0.75)
        g.fillRoundedRect(bx, buffY, buffSize, buffSize, 3)
        g.lineStyle(1, 0xffffff, 0.3)
        g.strokeRoundedRect(bx, buffY, buffSize, buffSize, 3)
        if (label && !this._buffLabels[bi]) {
          this._buffLabels[bi] = this.add.text(0, 0, '', {
            fontFamily: 'monospace', fontSize: '8px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
          }).setDepth(3).setOrigin(0.5)
        }
        const lbl = this._buffLabels[bi]
        if (lbl) {
          lbl.setPosition(bx + buffSize / 2, buffY + buffSize / 2).setOrigin(0.5)
          lbl.setText(stacks !== undefined ? `${stacks}` : (label || ''))
          lbl.setVisible(true)
        }
        bi++
      }

      // Hide all previous buff labels
      for (const lbl of this._buffLabels) if (lbl) lbl.setVisible(false)

      // --- Universal buffs ---
      if ((p as any).hasCriticalStrike)     drawBuff(true, 0xff4444, 'C')
      if ((p as any).hasMarkedTarget)       drawBuff(true, 0xff8844, 'M')
      if ((p as any).hasBattleFrenzy && (p as any).battleFrenzyUntil > this.gameScene.time.now)
                                            drawBuff(true, 0xff6666, 'F')
      if ((p as any).hasKillStride && (p as any).killStrideUntil > this.gameScene.time.now)
                                            drawBuff(true, 0x44cc44, 'S')
      if ((p as any).hasCamouflage && (p as any).vanishUntil > this.gameScene.time.now)
                                            drawBuff(true, 0x8888ff, 'I')

      // Amun
      if (p.defenseAuraActive)              drawBuff(true, 0x4488ff, 'D')
      if (p.hasPassiveAura)                 drawBuff(true, 0xfff200, 'A')
      if (p.dmgAuraActive)                  drawBuff(true, 0xff8800, 'W')
      if (p.hasUndying)                     drawBuff(true, 0xffee88, 'U')
      if (p.hasThorns)                      drawBuff(true, 0xffdd44, 'T')
      if (p.hasIronWill)                    drawBuff(true, 0x88aacc, 'I')
      if (p.hasEarthquake)                  drawBuff(true, 0xccaa55, 'E')
      if (p.hasGravityWell)                 drawBuff(true, 0x9966ff, 'G')
      if (p.hasDivineJudgment)              drawBuff(true, 0xfff200, 'J')
      if (p.hasColossus)                    drawBuff(true, 0xffcc44, 'C')
      if (p.hasCataclysm)                   drawBuff(true, 0xff6600, '2')
      if (p.hasLowHpRegen)                  drawBuff(true, 0x44ff88, 'R')
      if (p.hasLivingFortress)              drawBuff(true, 0xaaccff, 'L')
      if (p.hasWrath)                       drawBuff(true, 0xff3333, 'W')

      // Givi / Crystal Muller
      if (p.hasStoneSkin)                   drawBuff(true, 0x99ddcc, undefined, p.stoneSkinStacks)
      if ((p as any).hasGeodeShell)         drawBuff(true, 0x66bbaa, 'G')
      if ((p as any).hasCrystalWall)        drawBuff(true, 0x44aaff, 'W')
      if ((p as any).hasResonanceArmor)     drawBuff(true, 0x88ccff, 'R')
      if ((p as any).hasLivingGeode)        drawBuff(true, 0x55ccaa, 'L')
      if ((p as any).hasDeepVein)           drawBuff(true, 0x4488ff, 'D')
      if ((p as any).hasShardstorm)         drawBuff(true, 0x66aaff, '2')
      if ((p as any).hasCrystalShrapnel)    drawBuff(true, 0x88ddff, 'S')
      if ((p as any).hasTectonicFury)       drawBuff(true, 0xff6644, 'T')
      if ((p as any).hasCrystalPillar)      drawBuff(true, 0x6688cc, 'P')
      if ((p as any).hasFaultLine)          drawBuff(true, 0x4466aa, 'F')
      if ((p as any).hasResonanceField)     drawBuff(true, 0x7799cc, 'R')
      if ((p as any).hasMotherLode)         drawBuff(true, 0xcc99ff, 'M')
      if ((p as any).hasPlantedShard)       drawBuff(true, 0x5577aa, 'P')

      // Khashin
      if ((p as any).hasGustStrike)         drawBuff(true, 0x88ddff, 'G')
      if ((p as any).hasDustDevil)          drawBuff(true, 0xaaddff, 'D')
      if ((p as any).hasEyeOfTheStorm)      drawBuff(true, 0x66ccff, 'E')
      if ((p as any).hasChokingSand)        drawBuff(true, 0xe8a040, 'C')
      if ((p as any).hasSandArmor)          drawBuff(true, 0xccaa66, 'A')
      if ((p as any).hasScarabTide)         drawBuff(true, 0xddbb44, 'S')
      if ((p as any).hasPhantomStep)        drawBuff(true, 0xccaaff, 'P')
      if ((p as any).hasMirage)             drawBuff(true, 0xbb99ee, 'M')
      if ((p as any).hasDrift)              drawBuff(true, 0xaa88dd, 'D')
      if ((p as any).hasDesertWind)         drawBuff(true, 0x9977cc, 'W')

      // Ignara
      if ((p as any).hasPyromaniac)         drawBuff(true, 0xff4400, 'P')
      if ((p as any).hasPhoenixHeart)       drawBuff(true, 0xff8800, 'H')

      // Sifra
      if ((p as any).hasBlizzardAura)       drawBuff(true, 0x55aaff, 'B')
      if ((p as any).hasIceArmor)           drawBuff(true, 0x88ccff, 'I')
      if ((p as any).hasBallLightning)      drawBuff(true, 0x9966ff, 'L')

      // Nazar
      if ((p as any).hasShadowStep)         drawBuff(true, 0x663333, 'S')
      if ((p as any).hasVanish)             drawBuff(true, 0x444466, 'V')
      if ((p as any).hasAssassinate)        drawBuff(true, 0xcc2222, 'A')

      // Lyra / Huntress
      if ((p as any).hasHeavySpear)         drawBuff(true, 0x4488ff, 'H')
      if ((p as any).hasExplosiveTips)      drawBuff(true, 0xff6644, 'E')
      if ((p as any).hasSpearWall)          drawBuff(true, 0x44cc88, 'W')
      if ((p as any).hasCaltrops)           drawBuff(true, 0xaa6633, 'C')
      if ((p as any).hasNetThrow)           drawBuff(true, 0x669944, 'N')
      if ((p as any).hasLeap)               drawBuff(true, 0x44aa88, 'L')

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

    // Minimap — throttle to every 3 frames
    this._mmFrame = ((this._mmFrame || 0) + 1) % 3
    if (this._mmFrame === 0) this.drawMinimap()
  }

  private _mmFrame = 0
}
