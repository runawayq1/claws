import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { UpgradeTracker, getIconFrame, type Upgrade } from '../systems/UpgradeSystem'
import { unlockUpgrade, unlockBranch } from './EncyclopediaScene'

const CARD_W = 280
const CARD_H = 340
const GAP = 20
const STRIP_H = 28
const ICON_SIZE = 128
const DOT_RADIUS = 4
const DOT_COUNT = 5
const DOT_SPACING = 12

// Branch selection mode — bigger, bolder cards
const BRANCH_CARD_W = 340
const BRANCH_CARD_H = 480
const BRANCH_GAP = 28
const BRANCH_ICON_SIZE = 128

export class LevelUpScene extends Phaser.Scene {
  private player!: Player
  private tracker!: UpgradeTracker
  private callerSceneKey!: string
  private picked = false

  constructor() {
    super({ key: 'LevelUpScene' })
  }

  create(data: { player: Player; tracker: UpgradeTracker; callerSceneKey?: string }) {
    this.player = data.player
    this.tracker = data.tracker
    this.callerSceneKey = data.callerSceneKey ?? 'GameScene'
    this.picked = false
    const { width, height } = this.scale
    const isBranch = this.tracker.isBranchSelection

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, isBranch ? 0.85 : 0.75)
    overlay.fillRect(0, 0, width, height)

    const upgrades = isBranch
      ? this.tracker.getBranchChoices(this.player.heroType, this.player.getActiveStance())
      : this.tracker.getChoices(this.player.heroType, this.player.getActiveStance())

    if (isBranch) {
      // ── Branch selection: big dramatic layout ──────────────────────────
      const headerY = height * 0.08
      this.add.text(width / 2, headerY, 'CHOOSE YOUR PATH', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5)

      this.add.text(width / 2, headerY + 48, 'Choose Specialization', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      const totalW = BRANCH_CARD_W * upgrades.length + BRANCH_GAP * (upgrades.length - 1)
      const startX = width / 2 - totalW / 2
      const targetY = height / 2 - BRANCH_CARD_H / 2 + 30

      upgrades.forEach((upgrade, i) => {
        this.createBranchCard(startX + i * (BRANCH_CARD_W + BRANCH_GAP), targetY, upgrade, i)
      })
    } else {
      // ── Normal level-up: compact cards ─────────────────────────────────
      const headerBlockH = 32 + 8 + 14 + 20
      const totalBlockH = headerBlockH + CARD_H
      const blockTop = height / 2 - totalBlockH / 2 - 60

      this.add.text(width / 2, blockTop + 16, 'LEVEL UP', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 5,
      }).setOrigin(0.5)

      this.add.text(width / 2, blockTop + 16 + 32 + 8, `Level ${this.player.level}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      const totalW = CARD_W * upgrades.length + GAP * (upgrades.length - 1)
      const startX = width / 2 - totalW / 2
      const targetY = blockTop + headerBlockH

      upgrades.forEach((upgrade, i) => {
        this.createCard(startX + i * (CARD_W + GAP), targetY, upgrade, i, false)
      })
    }
  }

  // ── Branch selection card — large, dramatic ────────────────────────────
  private createBranchCard(x: number, targetY: number, upgrade: Upgrade, index: number) {
    const borderColor = upgrade.branchColor || 0xffd700
    const branchHex = '#' + borderColor.toString(16).padStart(6, '0')
    const cw = BRANCH_CARD_W
    const ch = BRANCH_CARD_H

    const container = this.add.container(x + cw / 2, targetY + ch / 2)
    const lx = -cw / 2
    const ly = -ch / 2

    // Card bg
    const g = this.add.graphics()
    g.fillStyle(0x0e0e1a)
    g.fillRoundedRect(lx, ly, cw, ch, 12)
    // Colored top strip (40px)
    g.fillStyle(borderColor, 0.35)
    g.fillRoundedRect(lx, ly, cw, 44, { tl: 12, tr: 12, bl: 0, br: 0 })
    // Border
    g.lineStyle(3, borderColor)
    g.strokeRoundedRect(lx, ly, cw, ch, 12)
    container.add(g)

    // Outer glow
    const glowG = this.add.graphics()
    glowG.lineStyle(8, borderColor, 0.2)
    glowG.strokeRoundedRect(lx - 2, ly - 2, cw + 4, ch + 4, 14)
    container.add(glowG)
    this.tweens.add({
      targets: glowG,
      alpha: { from: 0.15, to: 0.5 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Bottom gradient
    const gradG = this.add.graphics()
    gradG.fillStyle(0x000000, 0.3)
    gradG.fillRoundedRect(lx, ly + ch * 0.6, cw, ch * 0.4, { tl: 0, tr: 0, bl: 12, br: 12 })
    container.add(gradG)

    // Branch name — big and bold at top
    const branchLabel = this.add.text(0, ly + 22, upgrade.branch || '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: branchHex,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)
    container.add(branchLabel)

    // Big icon with glow
    const iconY = ly + 150
    const iconGlow = this.add.graphics()
    iconGlow.fillStyle(borderColor, 0.12)
    iconGlow.fillCircle(0, iconY, 110)
    container.add(iconGlow)
    const icon = this.add.image(0, iconY, 'skill_icons', getIconFrame(upgrade.icon))
      .setDisplaySize(BRANCH_ICON_SIZE, BRANCH_ICON_SIZE)
    container.add(icon)

    // First skill name
    const nameLabel = this.add.text(0, iconY + BRANCH_ICON_SIZE / 2 + 16, upgrade.label, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(nameLabel)

    // First skill description
    if (upgrade.desc) {
      const descY = iconY + BRANCH_ICON_SIZE / 2 + 44
      const descTxt = this.add.text(0, descY, upgrade.desc, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#cccccc',
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: cw - 40 },
        align: 'center',
        lineSpacing: 4,
      }).setOrigin(0.5, 0)
      container.add(descTxt)
    }

    // SELECT button
    const btnY = ly + ch - 24
    const selectText = this.add.text(0, btnY, '[ SELECT ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(selectText)
    this.tweens.add({
      targets: selectText,
      scaleX: 1.1, scaleY: 1.1,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Hit zone
    const zone = this.add.zone(0, 0, cw, ch).setInteractive()
    container.add(zone)

    // Hover
    zone.on('pointerover', () => {
      selectText.setColor('#ffffff')
      g.clear()
      g.fillStyle(0x181830)
      g.fillRoundedRect(lx, ly, cw, ch, 12)
      g.fillStyle(borderColor, 0.5)
      g.fillRoundedRect(lx, ly, cw, 44, { tl: 12, tr: 12, bl: 0, br: 0 })
      g.lineStyle(3, 0xffffff)
      g.strokeRoundedRect(lx, ly, cw, ch, 12)
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Sine.easeOut' })
    })
    zone.on('pointerout', () => {
      selectText.setColor('#ffd700')
      g.clear()
      g.fillStyle(0x0e0e1a)
      g.fillRoundedRect(lx, ly, cw, ch, 12)
      g.fillStyle(borderColor, 0.35)
      g.fillRoundedRect(lx, ly, cw, 44, { tl: 12, tr: 12, bl: 0, br: 0 })
      g.lineStyle(3, borderColor)
      g.strokeRoundedRect(lx, ly, cw, ch, 12)
      this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 150, ease: 'Sine.easeOut' })
    })

    // Click
    zone.on('pointerdown', () => {
      if (this.picked) return
      this.picked = true
      this.input.enabled = false
      upgrade.apply(this.player)
      this.tracker.pick(upgrade)
      if (upgrade.branch && !this.player.chosenBranch) this.player.chosenBranch = upgrade.branch

      // Encyclopedia tracking
      unlockUpgrade(upgrade.id)
      if (upgrade.branch) unlockBranch(upgrade.branch)

      const cx = x + cw / 2
      const cy = targetY + ch / 2

      // Big flash
      const flash = this.add.graphics()
      flash.fillStyle(borderColor, 0.7)
      flash.fillRoundedRect(x, targetY, cw, ch, 12)
      flash.setDepth(20)
      this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() })

      // Burst particles
      for (let p = 0; p < 10; p++) {
        const angle = (p / 10) * Math.PI * 2
        const dist = 80 + Math.random() * 40
        const pg = this.add.graphics()
        pg.fillStyle(borderColor, 1)
        pg.fillCircle(0, 0, 5 + Math.random() * 4)
        pg.setPosition(cx, cy).setDepth(22)
        this.tweens.add({
          targets: pg,
          x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
          alpha: 0, scaleX: 0.2, scaleY: 0.2,
          duration: 400 + Math.random() * 150, ease: 'Quad.easeOut',
          onComplete: () => pg.destroy(),
        })
      }

      // Fly icon
      const { width, height } = this.scale
      const flyIcon = this.add.image(cx, cy, 'skill_icons', getIconFrame(upgrade.icon))
        .setDisplaySize(BRANCH_ICON_SIZE, BRANCH_ICON_SIZE).setDepth(21)
      this.tweens.add({
        targets: flyIcon,
        x: width / 2, y: height * 0.1, scale: 2.5, alpha: 0,
        duration: 500, ease: 'Quad.easeOut',
        onComplete: () => flyIcon.destroy(),
      })

      this.time.delayedCall(400, () => {
        this.scene.resume(this.callerSceneKey)
        this.scene.stop()
      })
    })

    // Entrance animation
    container.setPosition(x + cw / 2, targetY + ch / 2 + 50)
    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      y: targetY + ch / 2,
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
      delay: index * 80,
    })
  }

  private createCard(x: number, targetY: number, upgrade: Upgrade, index: number, isBranchMode: boolean) {
    const isPersonal = !!upgrade.branch
    const borderColor = isPersonal ? (upgrade.branchColor || 0xffd700) : 0x888899
    const branchHex = '#' + borderColor.toString(16).padStart(6, '0')

    // ── Container (enables scale tweening for the whole card) ─────────────
    const container = this.add.container(x + CARD_W / 2, targetY + CARD_H / 2)
    // Local coords: card spans [-CARD_W/2, CARD_W/2] x [-CARD_H/2, CARD_H/2]
    const lx = -CARD_W / 2  // local card left
    const ly = -CARD_H / 2  // local card top

    // ── Card background graphics ──────────────────────────────────────────
    const g = this.add.graphics()
    this.drawCardNormal(g, lx, ly, borderColor, isPersonal)
    container.add(g)

    // ── Outer glow graphics (personal only) ──────────────────────────────
    let glowBorder: Phaser.GameObjects.Graphics | null = null
    if (isPersonal) {
      glowBorder = this.add.graphics()
      glowBorder.lineStyle(6, borderColor, 0.3)
      glowBorder.strokeRoundedRect(lx - 1, ly - 1, CARD_W + 2, CARD_H + 2, 9)
      container.add(glowBorder)

      // Pulsing tween on the glow alpha
      this.tweens.add({
        targets: glowBorder,
        alpha: { from: 0.2, to: 0.5 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // Bottom-half gradient effect: subtle darker overlay on lower portion
    const gradG = this.add.graphics()
    gradG.fillStyle(0x000000, 0.22)
    gradG.fillRoundedRect(lx, ly + CARD_H / 2, CARD_W, CARD_H / 2, { tl: 0, tr: 0, bl: 8, br: 8 })
    container.add(gradG)

    // ── Top strip: "★ HERO SKILL" + branch name ───────────────────────────
    if (isPersonal) {
      const heroLabel = this.add.text(0, ly + 12, '★ HERO SKILL', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)
      container.add(heroLabel)
    }

    if (isPersonal && upgrade.branch) {
      const branchFontSize = isBranchMode ? '14px' : '10px'
      const branchNameY = isBranchMode ? ly + 26 : ly + 26
      const branchLabel = this.add.text(0, branchNameY, upgrade.branch, {
        fontFamily: 'monospace',
        fontSize: branchFontSize,
        color: branchHex,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)
      container.add(branchLabel)

      if (!isBranchMode) {
        // Tier progress dots (normal mode only)
        const tier = this.tracker.branchProgress[upgrade.branch] ?? 0
        const dotsStartX = -(((DOT_COUNT - 1) * DOT_SPACING) / 2)
        const dotsY = ly + STRIP_H + 9
        const dotG = this.add.graphics()
        for (let d = 0; d < DOT_COUNT; d++) {
          const filled = d < tier
          const dx = dotsStartX + d * DOT_SPACING
          if (filled) {
            dotG.fillStyle(borderColor, 1)
          } else {
            dotG.fillStyle(0x444455, 1)
          }
          dotG.fillCircle(dx, dotsY, DOT_RADIUS)
          // Thin outline ring on unfilled dots for readability
          if (!filled) {
            dotG.lineStyle(1, borderColor, 0.5)
            dotG.strokeCircle(dx, dotsY, DOT_RADIUS)
          }
        }
        container.add(dotG)
      }
    }

    // ── Icon (44x44, centered) ────────────────────────────────────────────
    // Branch mode: icon starts below branch name (~36px from top)
    // Normal mode: icon starts below strip/dots area
    const iconOffsetY = isBranchMode
      ? ly + 36 + ICON_SIZE / 2
      : ly + 36 + ICON_SIZE / 2
    // Soft glow circle behind icon (drawn before icon so it sits beneath)
    if (isPersonal) {
      const glowG = this.add.graphics()
      glowG.fillStyle(borderColor, 0.15)
      glowG.fillCircle(0, iconOffsetY, 44)
      container.add(glowG)
    }
    const icon = this.add.image(0, iconOffsetY, 'skill_icons', getIconFrame(upgrade.icon))
      .setDisplaySize(ICON_SIZE, ICON_SIZE)
    container.add(icon)

    // ── Skill name (13px) — below icon ───────────────────────────────────
    const nameColor = isPersonal ? '#FFD700' : '#ddddee'
    const nameY = iconOffsetY + ICON_SIZE / 2 + 12
    const nameLabel = this.add.text(0, nameY, upgrade.label, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(nameLabel)

    // ── Description — fit within card ──────────────────────────────────────
    const descMaxY = ly + CARD_H - 36  // space for SELECT button
    const descAvail = descMaxY - (nameY + 16)
    const descFontSize = descAvail < 40 ? '8px' : '9px'
    const descLabel = this.add.text(0, nameY + 16, upgrade.desc, {
      fontFamily: 'monospace',
      fontSize: descFontSize,
      color: isPersonal ? '#cccccc' : '#999999',
      stroke: '#000000',
      strokeThickness: 1,
      wordWrap: { width: CARD_W - 24 },
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5, 0)
    // Clip if still too tall
    if (descLabel.height > descAvail) {
      descLabel.setCrop(0, 0, descLabel.width, descAvail)
    }
    container.add(descLabel)

    // ── SELECT button — consistently at bottom with padding ───────────────
    const btnY = ly + CARD_H - 18
    const btnColor = isPersonal ? '#ffd700' : '#88ff88'
    const selectText = this.add.text(0, btnY, '[ SELECT ]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: btnColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(selectText)

    // Subtle scale pulse on SELECT button for personal cards
    if (isPersonal) {
      this.tweens.add({
        targets: selectText,
        scaleX: 1.08, scaleY: 1.08,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // ── Hit zone ──────────────────────────────────────────────────────────
    const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive()
    container.add(zone)

    // ── Hover scale tween ─────────────────────────────────────────────────
    zone.on('pointerover', () => {
      selectText.setColor('#ffffff')
      this.drawCardHover(g, lx, ly, borderColor, isPersonal)
      this.tweens.add({
        targets: container,
        scaleX: 1.05, scaleY: 1.05,
        duration: 120, ease: 'Sine.easeOut',
      })
    })

    zone.on('pointerout', () => {
      selectText.setColor(btnColor)
      this.drawCardNormal(g, lx, ly, borderColor, isPersonal)
      this.tweens.add({
        targets: container,
        scaleX: 1.0, scaleY: 1.0,
        duration: 120, ease: 'Sine.easeOut',
      })
    })

    // ── Click: apply + particles + flash + fly icon + resume ─────────────
    zone.on('pointerdown', () => {
      if (this.picked) return
      this.picked = true
      this.input.enabled = false
      upgrade.apply(this.player)
      this.tracker.pick(upgrade)
      if (upgrade.branch && !this.player.chosenBranch) this.player.chosenBranch = upgrade.branch

      // Encyclopedia tracking
      unlockUpgrade(upgrade.id)
      if (upgrade.branch) unlockBranch(upgrade.branch)

      const cx = x + CARD_W / 2
      const cy = targetY + CARD_H / 2

      // Flash overlay on card
      const flash = this.add.graphics()
      flash.fillStyle(isPersonal ? borderColor : 0xffffff, 0.6)
      flash.fillRoundedRect(x, targetY, CARD_W, CARD_H, 8)
      flash.setDepth(20)
      this.tweens.add({
        targets: flash, alpha: 0, duration: 300,
        onComplete: () => flash.destroy(),
      })

      // Burst particles: 6 small circles flying outward
      const particleColor = isPersonal ? borderColor : 0xffffff
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2
        const dist = 55 + Math.random() * 25
        const pg = this.add.graphics()
        pg.fillStyle(particleColor, 1)
        pg.fillCircle(0, 0, 4 + Math.random() * 3)
        pg.setPosition(cx, cy)
        pg.setDepth(22)
        this.tweens.add({
          targets: pg,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 320 + Math.random() * 100,
          ease: 'Quad.easeOut',
          onComplete: () => pg.destroy(),
        })
      }

      // Icon flies up and fades
      const { width, height } = this.scale
      const flyIcon = this.add.image(cx, cy, 'skill_icons', getIconFrame(upgrade.icon))
        .setDisplaySize(ICON_SIZE, ICON_SIZE).setDepth(21)
      this.tweens.add({
        targets: flyIcon,
        x: width / 2, y: height / 2 - 180, scale: 2, alpha: 0,
        duration: 400, ease: 'Quad.easeOut',
        onComplete: () => flyIcon.destroy(),
      })

      // Brief delay then resume
      this.time.delayedCall(350, () => {
        this.scene.resume(this.callerSceneKey)
        this.scene.stop()
      })
    })

    // ── Entrance animation: slide up from 30px below with stagger ─────────
    const startY = targetY + CARD_H / 2 + 30
    container.setPosition(x + CARD_W / 2, startY)
    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      y: targetY + CARD_H / 2,
      alpha: 1,
      duration: 260,
      ease: 'Quad.easeOut',
      delay: index * 50,
    })
  }

  // ── Graphics helpers ────────────────────────────────────────────────────

  private drawCardNormal(g: Phaser.GameObjects.Graphics, lx: number, ly: number, borderColor: number, isPersonal: boolean) {
    g.clear()
    g.fillStyle(isPersonal ? 0x1a1a2e : 0x12121e)
    g.fillRoundedRect(lx, ly, CARD_W, CARD_H, 8)
    if (isPersonal) {
      g.fillStyle(borderColor, 0.3)
      g.fillRoundedRect(lx, ly, CARD_W, STRIP_H, { tl: 8, tr: 8, bl: 0, br: 0 })
    }
    g.lineStyle(3, borderColor)
    g.strokeRoundedRect(lx, ly, CARD_W, CARD_H, 8)
  }

  private drawCardHover(g: Phaser.GameObjects.Graphics, lx: number, ly: number, borderColor: number, isPersonal: boolean) {
    g.clear()
    g.fillStyle(0x1a1a30)
    g.fillRoundedRect(lx, ly, CARD_W, CARD_H, 8)
    if (isPersonal) {
      g.fillStyle(borderColor, 0.4)
      g.fillRoundedRect(lx, ly, CARD_W, STRIP_H, { tl: 8, tr: 8, bl: 0, br: 0 })
    }
    g.lineStyle(3, 0xffffff)
    g.strokeRoundedRect(lx, ly, CARD_W, CARD_H, 8)
  }
}
