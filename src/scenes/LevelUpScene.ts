import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { UpgradeTracker, getIconTexture, type Upgrade } from '../systems/UpgradeSystem'
import { unlockUpgrade, unlockBranch } from './EncyclopediaScene'
// @ts-ignore - kept for revert after testing
import { shouldShowHint } from '../systems/HintFlags'

// Compact 5-card layout
const CARD_W = 200
const CARD_H = 300
const GAP = 14
const STRIP_H = 28
const ICON_SIZE = 96
const DOT_RADIUS = 4
const DOT_COUNT = 3   // max skill level
const DOT_SPACING = 14

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
  private static stanceHintShown = false
  // Keyboard shortcut triggers — populated during card creation
  private cardTriggers: Array<() => void> = []
  private cardFlips: Array<() => void> = []

  constructor() {
    super({ key: 'LevelUpScene' })
  }

  create(data: { player: Player; tracker: UpgradeTracker; callerSceneKey?: string }) {
    this.player = data.player
    this.tracker = data.tracker
    this.callerSceneKey = data.callerSceneKey ?? 'GameScene'
    this.picked = false
    this.cardTriggers = []
    this.cardFlips = []
    const isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const mobZoom = isMob ? 0.85 : 1
    if (isMob) this.cameras.main.setZoom(mobZoom)
    // Use effective dimensions so layout centers correctly under zoom
    const width = this.scale.width / mobZoom
    const height = this.scale.height / mobZoom
    const isBranch = this.tracker.isBranchSelection

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, isBranch ? 0.85 : 0.75)
    overlay.fillRect(0, 0, width, height)

    const upgrades = isBranch
      ? this.tracker.getBranchChoices(this.player.heroType, this.player.getActiveStance())
      : this.tracker.getChoices(this.player.heroType, this.player.getActiveStance())

    // Compute scale factor so cards fit within screen width (with 20px margin each side)
    const availW = width - 40
    if (isBranch) {
      // ── Branch selection: big dramatic layout ──────────────────────────
      const rawW = BRANCH_CARD_W * upgrades.length + BRANCH_GAP * (upgrades.length - 1)
      const cardScale = rawW > availW ? availW / rawW : 1
      const scaledCW = BRANCH_CARD_W * cardScale
      const scaledCH = BRANCH_CARD_H * cardScale
      const scaledGap = BRANCH_GAP * cardScale

      const headerY = height * 0.08
      this.add.text(width / 2, headerY, 'CHOOSE YOUR PATH', {
        fontFamily: 'monospace',
        fontSize: isMob ? '28px' : '40px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: isMob ? 4 : 6,
      }).setOrigin(0.5)

      this.add.text(width / 2, headerY + (isMob ? 34 : 48), 'Choose Specialization', {
        fontFamily: 'monospace',
        fontSize: isMob ? '12px' : '16px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      const totalW = scaledCW * upgrades.length + scaledGap * (upgrades.length - 1)
      const startX = width / 2 - totalW / 2
      const targetY = height / 2 - scaledCH / 2 + (isMob ? 15 : 30)

      upgrades.forEach((upgrade, i) => {
        this.createBranchCard(startX + i * (scaledCW + scaledGap), targetY, upgrade, i, cardScale)
      })
    } else {
      // ── Normal level-up: 5 compact cards ───────────────────────────────
      const rawW = CARD_W * upgrades.length + GAP * (upgrades.length - 1)
      const cardScale = rawW > availW ? availW / rawW : 1
      const scaledCW = CARD_W * cardScale
      const scaledCH = CARD_H * cardScale
      const scaledGap = GAP * cardScale

      const headerBlockH = (32 + 8 + 14 + 20) * cardScale
      const totalBlockH = headerBlockH + scaledCH
      const blockTop = height / 2 - totalBlockH / 2 - 60 * cardScale

      this.add.text(width / 2, blockTop + 16 * cardScale, 'LEVEL UP', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(32 * cardScale)}px`,
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 5,
      }).setOrigin(0.5)

      this.add.text(width / 2, blockTop + (16 + 32 + 8) * cardScale, `Level ${this.player.level}`, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(14 * cardScale)}px`,
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      const totalW = scaledCW * upgrades.length + scaledGap * (upgrades.length - 1)
      const startX = width / 2 - totalW / 2
      const targetY = blockTop + headerBlockH

      upgrades.forEach((upgrade, i) => {
        this.createCard(startX + i * (scaledCW + scaledGap), targetY, upgrade, i, cardScale)
      })

      // Confetti burst — desktop full version, mobile lightweight radial
      if (!isMob) {
        this.spawnConfetti(width, height)
      } else {
        this.spawnMobileConfetti(width, height)
      }
    }

    // Keyboard shortcuts: 1-5 trigger card selection (works for both normal and branch)
    const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']
    KEY_NAMES.forEach((keyName, i) => {
      this.input.keyboard?.on(`keydown-${keyName}`, () => {
        if (this.cardTriggers[i]) this.cardTriggers[i]()
      })
    })
  }

  // ── Branch selection card — large, dramatic ────────────────────────────
  private createBranchCard(x: number, targetY: number, upgrade: Upgrade, index: number, cardScale = 1) {
    const borderColor = upgrade.branchColor || 0xffd700
    const branchHex = '#' + borderColor.toString(16).padStart(6, '0')
    const cw = BRANCH_CARD_W
    const ch = BRANCH_CARD_H

    const container = this.add.container(x + cw / 2, targetY + ch / 2)
    const lx = -cw / 2
    const ly = -ch / 2

    // Card bg — image + colored overlay
    const bgImg = this.add.image(0, 0, 'card_back_lg').setDisplaySize(cw, ch)
    container.add(bgImg)
    const g = this.add.graphics()
    // Colored top strip (40px)
    g.fillStyle(borderColor, 0.25)
    g.fillRoundedRect(lx, ly, cw, 44, { tl: 6, tr: 6, bl: 0, br: 0 })
    container.add(g)

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
    const it = getIconTexture(upgrade.icon, this)
    const icon = this.add.image(0, iconY, it.key, it.frame)
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

    // First skill description (level 1 desc)
    const descText = Array.isArray(upgrade.desc) ? upgrade.desc[0] : upgrade.desc
    if (descText) {
      const descY = iconY + BRANCH_ICON_SIZE / 2 + 44
      const descTxt = this.add.text(0, descY, descText, {
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

    // ── Sealed card back ──────────────────────────────────────────────
    let flipped = false
    const sealedImg = this.add.image(0, 0, 'card_sealed_lg').setDisplaySize(cw, ch)
    const branchBack = this.add.container(0, 0, [sealedImg])
    container.add(branchBack)
    // Hide face content
    for (const obj of container.list) {
      if (obj !== branchBack) (obj as any).setAlpha?.(0)
    }

    const doFlip = () => {
      if (flipped) return
      flipped = true
      this.tweens.add({
        targets: container, scaleX: 0, duration: 175, ease: 'Sine.easeIn',
        onComplete: () => {
          branchBack.setVisible(false)
          for (const obj of container.list) {
            if (obj !== branchBack) (obj as any).setAlpha?.(1)
          }
          this.tweens.add({
            targets: container, scaleX: 1, duration: 250, ease: 'Back.easeOut',
          })
          // Dramatic reveal burst
          const cx0 = container.x, cy0 = container.y
          for (let s = 0; s < 12; s++) {
            const angle = (s / 12) * Math.PI * 2
            const dist = 100 + Math.random() * 50
            const spark = this.add.graphics().setDepth(25)
            spark.fillStyle(borderColor, 1)
            spark.fillCircle(0, 0, 4 + Math.random() * 4)
            spark.setPosition(cx0, cy0)
            this.tweens.add({
              targets: spark,
              x: cx0 + Math.cos(angle) * dist,
              y: cy0 + Math.sin(angle) * dist,
              alpha: 0, scaleX: 0.1, scaleY: 0.1,
              duration: 350 + Math.random() * 150, ease: 'Quad.easeOut',
              onComplete: () => spark.destroy(),
            })
          }
          const flash = this.add.graphics().setDepth(24)
          flash.fillStyle(borderColor, 0.5)
          flash.fillRoundedRect(cx0 - cw / 2, cy0 - ch / 2, cw, ch, 12)
          this.tweens.add({ targets: flash, alpha: 0, duration: 350, onComplete: () => flash.destroy() })
        },
      })
    }

    // Hit zone
    const zone = this.add.zone(0, 0, cw, ch).setInteractive()
    container.add(zone)

    // Hover
    zone.on('pointerover', () => {
      if (!flipped) {
        this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 120, ease: 'Sine.easeOut' })
        return
      }
      selectText.setColor('#ffffff')
      g.clear()
      g.fillStyle(0xffffff, 0.06)
      g.fillRoundedRect(lx, ly, cw, ch, 12)
      g.fillStyle(borderColor, 0.35)
      g.fillRoundedRect(lx, ly, cw, 44, { tl: 6, tr: 6, bl: 0, br: 0 })
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Sine.easeOut' })
    })
    zone.on('pointerout', () => {
      if (!flipped) {
        this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 120, ease: 'Sine.easeOut' })
        return
      }
      selectText.setColor('#ffd700')
      g.clear()
      g.fillStyle(borderColor, 0.25)
      g.fillRoundedRect(lx, ly, cw, 44, { tl: 6, tr: 6, bl: 0, br: 0 })
      this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 150, ease: 'Sine.easeOut' })
    })

    this.cardFlips.push(doFlip)

    // Click / keyboard trigger
    const flipIdx = this.cardFlips.length - 1
    const triggerBranchCard = () => {
      if (!flipped) { this.flipAllCards(flipIdx); return }
      const { height } = this.scale
      this.handlePick(
        upgrade,
        x + cw / 2, targetY + ch / 2,
        x, targetY, cw, ch,
        borderColor, 12, 400,
        borderColor, 10, 80, 120, 5, 9,
        BRANCH_ICON_SIZE, height * 0.1, 2.5, 500,
        400,
      )
    }
    zone.on('pointerdown', triggerBranchCard)

    // Register keyboard trigger for this card index
    this.cardTriggers[index] = triggerBranchCard

    // Entrance animation — position uses scaled dimensions, container renders at full size with setScale
    const scw = cw * cardScale, sch = ch * cardScale
    container.setScale(cardScale)
    container.setPosition(x + scw / 2, targetY + sch / 2 + 50)
    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      y: targetY + sch / 2,
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
      delay: index * 80,
    })
  }

  private createCard(x: number, targetY: number, upgrade: Upgrade, index: number, cardScale = 1) {
    const isPersonal = !!upgrade.branch
    const borderColor = isPersonal ? (upgrade.branchColor || 0xffd700) : 0x888899
    const branchHex = '#' + borderColor.toString(16).padStart(6, '0')

    // Current and next level
    const currentLevel = this.tracker.getLevel(upgrade.id)
    const nextLevel = currentLevel + 1
    const isLevelUp = currentLevel > 0   // already known, leveling up
    const isUltimate = !!upgrade.isUltimate

    // Description for NEXT level
    const descArr = Array.isArray(upgrade.desc) ? upgrade.desc : [upgrade.desc as string]
    const nextDesc = descArr[nextLevel - 1] ?? descArr[descArr.length - 1]

    // ── Container ─────────────────────────────────────────────────────────
    const container = this.add.container(x + CARD_W / 2, targetY + CARD_H / 2)
    const lx = -CARD_W / 2
    const ly = -CARD_H / 2

    // ── Card background ───────────────────────────────────────────────────
    const bgImg = this.add.image(0, 0, 'card_back').setDisplaySize(CARD_W, CARD_H)
    container.add(bgImg)
    const g = this.add.graphics()
    this.drawCardNormal(g, lx, ly, borderColor, isPersonal)
    container.add(g)

    // Bottom-half gradient
    const gradG = this.add.graphics()
    gradG.fillStyle(0x000000, 0.22)
    gradG.fillRoundedRect(lx, ly + CARD_H / 2, CARD_W, CARD_H / 2, { tl: 0, tr: 0, bl: 8, br: 8 })
    container.add(gradG)

    // ── Top strip: hero skill label + branch name ─────────────────────────
    if (isPersonal) {
      const heroLabel = this.add.text(0, ly + 8, isUltimate ? '★ ULTIMATE' : '★ HERO SKILL', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: isUltimate ? '#ffcc44' : '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)
      container.add(heroLabel)
    }

    if (isPersonal && upgrade.branch) {
      const branchLabel = this.add.text(0, ly + 20, upgrade.branch, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: branchHex,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)
      container.add(branchLabel)

      // Skill level dots (3 max)
      const dotsStartX = -(((DOT_COUNT - 1) * DOT_SPACING) / 2)
      const dotsY = ly + STRIP_H + 6
      const dotG = this.add.graphics()
      for (let d = 0; d < DOT_COUNT; d++) {
        const filled = d < currentLevel
        const isNext = d === currentLevel  // will be filled after this pick
        const dx = dotsStartX + d * DOT_SPACING
        if (filled) {
          dotG.fillStyle(borderColor, 1)
          dotG.fillCircle(dx, dotsY, DOT_RADIUS)
        } else if (isNext) {
          // Half-filled / pulsing dot shows what this pick will do
          dotG.fillStyle(borderColor, 0.5)
          dotG.fillCircle(dx, dotsY, DOT_RADIUS)
          dotG.lineStyle(1, borderColor, 0.8)
          dotG.strokeCircle(dx, dotsY, DOT_RADIUS)
        } else {
          dotG.fillStyle(0x444455, 1)
          dotG.fillCircle(dx, dotsY, DOT_RADIUS)
          dotG.lineStyle(1, borderColor, 0.4)
          dotG.strokeCircle(dx, dotsY, DOT_RADIUS)
        }
      }
      container.add(dotG)
    }

    // ── LVL UP badge (for cards that are leveling up, not newly learned) ─
    if (isLevelUp && isPersonal) {
      const badgeG = this.add.graphics()
      badgeG.fillStyle(0xffcc00, 0.9)
      badgeG.fillRoundedRect(-26, ly + STRIP_H + 2, 52, 14, 4)
      container.add(badgeG)

      const lvlUpText = this.add.text(0, ly + STRIP_H + 9, `LVL ${nextLevel}`, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#000000',
      }).setOrigin(0.5)
      container.add(lvlUpText)
    }

    // ── Icon (fixed Y for all cards so icons align across the row) ─────
    const iconOffsetY = ly + STRIP_H + 18 + 18 + ICON_SIZE / 2 + 4
    if (isPersonal) {
      const glowG = this.add.graphics()
      glowG.fillStyle(borderColor, 0.15)
      glowG.fillCircle(0, iconOffsetY, 36)
      container.add(glowG)
    }
    const it2 = getIconTexture(upgrade.icon, this)
    const icon = this.add.image(0, iconOffsetY, it2.key, it2.frame)
      .setDisplaySize(ICON_SIZE, ICON_SIZE)
    container.add(icon)

    // ── Skill name ────────────────────────────────────────────────────────
    const nameColor = isPersonal ? '#FFD700' : '#ddddee'
    const nameY = iconOffsetY + ICON_SIZE / 2 + 8
    const nameLabel = this.add.text(0, nameY, upgrade.label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(nameLabel)

    // ── Description (next level text) ─────────────────────────────────────
    const descMaxY = ly + CARD_H - 30
    const descStartY = nameY + 14
    const descAvail = descMaxY - descStartY
    const descLabel = this.add.text(0, descStartY, nextDesc, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: isPersonal ? '#cccccc' : '#999999',
      stroke: '#000000',
      strokeThickness: 1,
      wordWrap: { width: CARD_W - 20 },
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5, 0)
    if (descLabel.height > descAvail) {
      descLabel.setCrop(0, 0, descLabel.width, descAvail)
    }
    container.add(descLabel)

    // ── SELECT button ─────────────────────────────────────────────────────
    const btnY = ly + CARD_H - 14
    const btnLabel = isLevelUp ? '[ LVL UP ]' : '[ SELECT ]'
    const btnColor = isPersonal ? '#ffd700' : '#88ff88'
    const selectText = this.add.text(0, btnY, btnLabel, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: btnColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(selectText)

    if (isPersonal) {
      this.tweens.add({
        targets: selectText,
        scaleX: 1.08, scaleY: 1.08,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
    }

    // ── Sealed card back (all cards start face-down) ───────────────────
    let flipped = false
    const sealedImg = this.add.image(0, 0, 'card_sealed').setDisplaySize(CARD_W, CARD_H)
    const cardBack = this.add.container(0, 0, [sealedImg])
    container.add(cardBack)

    // Hide face content initially
    for (const obj of container.list) {
      if (obj !== cardBack) (obj as any).setAlpha?.(0)
    }

    // ── Hit zone ──────────────────────────────────────────────────────────
    const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive()
    container.add(zone)

    const doFlip = () => {
      if (flipped) return
      flipped = true
      // Flip animation: squeeze → swap content → expand (25% slower)
      this.tweens.add({
        targets: container, scaleX: 0, duration: 150, ease: 'Sine.easeIn',
        onComplete: () => {
          cardBack.setVisible(false)
          // Reveal face
          const faceObjs = container.list.filter(
            (o: any) => o !== cardBack && o !== zone
          )
          for (const obj of faceObjs) (obj as any).setAlpha?.(1)
          this.tweens.add({
            targets: container, scaleX: 1, duration: 225, ease: 'Back.easeOut',
          })
          // Special reveal VFX for personal cards
          if (isPersonal) {
            const cx0 = container.x, cy0 = container.y
            // Radial spark burst
            for (let s = 0; s < 8; s++) {
              const angle = (s / 8) * Math.PI * 2
              const dist = 60 + Math.random() * 30
              const spark = this.add.graphics().setDepth(25)
              spark.fillStyle(borderColor, 1)
              spark.fillCircle(0, 0, 3 + Math.random() * 3)
              spark.setPosition(cx0, cy0)
              this.tweens.add({
                targets: spark,
                x: cx0 + Math.cos(angle) * dist,
                y: cy0 + Math.sin(angle) * dist,
                alpha: 0, scaleX: 0.2, scaleY: 0.2,
                duration: 300 + Math.random() * 100, ease: 'Quad.easeOut',
                onComplete: () => spark.destroy(),
              })
            }
            // Flash overlay
            const flash = this.add.graphics().setDepth(24)
            flash.fillStyle(borderColor, 0.4)
            flash.fillRoundedRect(
              cx0 - CARD_W / 2, cy0 - CARD_H / 2, CARD_W, CARD_H, 8
            )
            this.tweens.add({
              targets: flash, alpha: 0, duration: 300,
              onComplete: () => flash.destroy(),
            })
          }
        },
      })
    }

    this.cardFlips.push(doFlip)

    zone.on('pointerover', () => {
      if (!flipped) {
        this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 120, ease: 'Sine.easeOut' })
        return
      }
      selectText.setColor('#ffffff')
      this.drawCardHover(g, lx, ly, borderColor, isPersonal)
      this.tweens.add({
        targets: container, scaleX: 1.05, scaleY: 1.05,
        duration: 120, ease: 'Sine.easeOut',
      })
    })

    zone.on('pointerout', () => {
      if (!flipped) {
        this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 120, ease: 'Sine.easeOut' })
        return
      }
      selectText.setColor(btnColor)
      this.drawCardNormal(g, lx, ly, borderColor, isPersonal)
      this.tweens.add({
        targets: container, scaleX: 1.0, scaleY: 1.0,
        duration: 120, ease: 'Sine.easeOut',
      })
    })

    const flipIdx2 = this.cardFlips.length - 1
    const triggerCard = () => {
      if (!flipped) { this.flipAllCards(flipIdx2); return }
      const { height } = this.scale
      const particleColor = isPersonal ? borderColor : 0xffffff
      this.handlePick(
        upgrade,
        x + CARD_W / 2, targetY + CARD_H / 2,
        x, targetY, CARD_W, CARD_H,
        isPersonal ? borderColor : 0xffffff, 8, 300,
        particleColor, 6, 55, 80, 4, 7,
        ICON_SIZE, height / 2 - 180, 2, 400,
        350,
      )
    }
    zone.on('pointerdown', triggerCard)

    // Register keyboard trigger for this card index
    this.cardTriggers[index] = triggerCard

    // Entrance animation — scale container for mobile fit
    const scw = CARD_W * cardScale, sch = CARD_H * cardScale
    container.setScale(cardScale)
    const startY = targetY + sch / 2 + 30
    container.setPosition(x + scw / 2, startY)
    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      y: targetY + sch / 2,
      alpha: 1, duration: 260,
      ease: 'Quad.easeOut',
      delay: index * 50,
    })
  }

  // ── Confetti burst (desktop only) ────────────────────────────────────
  private spawnConfetti(w: number, h: number) {
    const colors = [0xffd700, 0xff4444, 0x44ff44, 0x4488ff, 0xff88ff, 0xffaa22]
    for (let i = 0; i < 40; i++) {
      const x = w * 0.2 + Math.random() * w * 0.6
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = 3 + Math.random() * 5
      const piece = this.add.graphics().setDepth(30)
      piece.fillStyle(color, 0.9)
      if (Math.random() < 0.5) {
        piece.fillRect(-size / 2, -size, size, size * 2) // rectangle
      } else {
        piece.fillCircle(0, 0, size / 2) // circle
      }
      piece.setPosition(x, -10 - Math.random() * 40)
      piece.setRotation(Math.random() * Math.PI * 2)
      this.tweens.add({
        targets: piece,
        y: h + 20,
        x: x + (Math.random() - 0.5) * 200,
        rotation: piece.rotation + (Math.random() - 0.5) * 8,
        duration: 1500 + Math.random() * 1000,
        ease: 'Quad.easeIn',
        delay: Math.random() * 300,
        onComplete: () => piece.destroy(),
      })
    }
  }

  // ── Mobile confetti substitute — 10 radial circles from screen center ──
  private spawnMobileConfetti(w: number, h: number) {
    const colors = [0xffd700, 0xff4444, 0x44ff44, 0x4488ff, 0xff88ff, 0xffaa22]
    const cx = w / 2
    const cy = h / 2
    for (let i = 0; i < 10; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const radius = 4 + Math.random() * 4
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.4
      const dist = 180 + Math.random() * 40
      const piece = this.add.graphics().setDepth(30)
      piece.fillStyle(color, 0.9)
      piece.fillCircle(0, 0, radius)
      piece.setPosition(cx, cy)
      this.tweens.add({
        targets: piece,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.3, scaleY: 0.3,
        duration: 400,
        ease: 'Quad.easeOut',
        delay: i * 20,
        onComplete: () => piece.destroy(),
      })
    }
  }

  // ── Shared pick handler ─────────────────────────────────────────────────
  /**
   * Common logic executed when the player picks any upgrade card (normal or branch).
   * Flip all sealed cards at once.
   */
  private flipAllCards(clickedIndex = 0) {
    for (let i = 0; i < this.cardFlips.length; i++) {
      if (i === clickedIndex) {
        this.cardFlips[i]()
      } else {
        const delay = 80 + Math.abs(i - clickedIndex) * 60
        this.time.delayedCall(delay, this.cardFlips[i])
      }
    }
  }

  /**
   * Applies the upgrade, fires VFX, then resumes the caller scene (or shows tutorial).
   */
  private handlePick(
    upgrade: Upgrade,
    cx: number, cy: number,
    cardX: number, cardY: number, cardW: number, cardH: number,
    flashColor: number, flashRoundness: number, flashDuration: number,
    particleColor: number, particleCount: number, particleMinDist: number, particleMaxDist: number, particleMinSize: number, particleMaxSize: number,
    iconSize: number, iconFlyY: number, iconFlyScale: number, iconFlyDuration: number,
    resumeDelay: number,
  ) {
    if (this.picked) return
    this.picked = true
    this.input.enabled = false

    const nextLevel = (this.tracker.getLevel(upgrade.id) || 0) + 1
    upgrade.apply(this.player, nextLevel)
    this.tracker.pick(upgrade)
    if (upgrade.branch && !this.player.chosenBranch) this.player.chosenBranch = upgrade.branch

    // Branch Mastery: upgrade pick awards x2 mastery XP to current attack branch
    if (this.player.currentAttackBranch) {
      this.player.awardMasteryXP(this.player.currentAttackBranch, 2.0)
    }

    // Encyclopedia tracking
    unlockUpgrade(upgrade.id)
    if (upgrade.branch) unlockBranch(upgrade.branch)

    // Flash overlay
    const flash = this.add.graphics()
    flash.fillStyle(flashColor, 0.7)
    flash.fillRoundedRect(cardX, cardY, cardW, cardH, flashRoundness)
    flash.setDepth(20)
    this.tweens.add({ targets: flash, alpha: 0, duration: flashDuration, onComplete: () => flash.destroy() })

    // Burst particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const dist = particleMinDist + Math.random() * (particleMaxDist - particleMinDist)
      const pg = this.add.graphics()
      pg.fillStyle(particleColor, 1)
      pg.fillCircle(0, 0, particleMinSize + Math.random() * (particleMaxSize - particleMinSize))
      pg.setPosition(cx, cy).setDepth(22)
      this.tweens.add({
        targets: pg,
        x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 350 + Math.random() * 200, ease: 'Quad.easeOut',
        onComplete: () => pg.destroy(),
      })
    }

    // Fly icon
    const { width } = this.scale
    const fit = getIconTexture(upgrade.icon, this)
    const flyIcon = this.add.image(cx, cy, fit.key, fit.frame)
      .setDisplaySize(iconSize, iconSize).setDepth(21)
    this.tweens.add({
      targets: flyIcon,
      x: width / 2, y: iconFlyY, scale: iconFlyScale, alpha: 0,
      duration: iconFlyDuration, ease: 'Quad.easeOut',
      onComplete: () => flyIcon.destroy(),
    })

    this.time.delayedCall(resumeDelay, () => {
      if (upgrade.id === 'aq1' && !LevelUpScene.stanceHintShown) {
        LevelUpScene.stanceHintShown = true
        this.showStanceTutorial()
      } else {
        this.scene.resume(this.callerSceneKey)
        this.scene.stop()
      }
    })
  }

  // ── Graphics helpers ────────────────────────────────────────────────────

  private drawCardNormal(g: Phaser.GameObjects.Graphics, lx: number, ly: number, borderColor: number, isPersonal: boolean) {
    g.clear()
    if (isPersonal) {
      g.fillStyle(borderColor, 0.15)
      g.fillRoundedRect(lx, ly, CARD_W, STRIP_H, { tl: 8, tr: 8, bl: 0, br: 0 })
    }
  }

  private drawCardHover(g: Phaser.GameObjects.Graphics, lx: number, ly: number, borderColor: number, isPersonal: boolean) {
    g.clear()
    g.fillStyle(0xffffff, 0.06)
    g.fillRoundedRect(lx, ly, CARD_W, CARD_H, 8)
    if (isPersonal) {
      g.fillStyle(borderColor, 0.25)
      g.fillRoundedRect(lx, ly, CARD_W, STRIP_H, { tl: 8, tr: 8, bl: 0, br: 0 })
    }
  }

  // ── Stance tutorial dialog (Amun Quake branch) ──────────────────────────
  private showStanceTutorial() {
    const { width, height } = this.scale

    // Dark overlay with cutout for energy bar
    const bg = this.add.graphics().setDepth(40)
    bg.fillStyle(0x000000, 0.8)
    // Draw overlay in sections, leaving a gap for the energy bar area
    const energyX = 6, energyY = 70, energyW = 230, energyH = 26
    bg.fillRect(0, 0, width, energyY)
    bg.fillRect(0, energyY, energyX, energyH)
    bg.fillRect(energyX + energyW, energyY, width - energyX - energyW, energyH)
    bg.fillRect(0, energyY + energyH, width, height - energyY - energyH)
    bg.setAlpha(0)
    this.tweens.add({ targets: bg, alpha: 1, duration: 200 })

    // Panel
    const pw = Math.min(460, width - 40)
    const ph = 320
    const px = (width - pw) / 2
    const py = (height - ph) / 2

    const panel = this.add.graphics().setDepth(41)
    panel.fillStyle(0x12121e, 0.95)
    panel.fillRoundedRect(px, py, pw, ph, 12)
    panel.lineStyle(2, 0xffcc44, 0.6)
    panel.strokeRoundedRect(px, py, pw, ph, 12)
    // Top accent
    panel.fillStyle(0xffcc44, 0.15)
    panel.fillRoundedRect(px, py, pw, 40, { tl: 12, tr: 12, bl: 0, br: 0 })

    // Title
    const title = this.add.text(width / 2, py + 20, 'STANCE SWITCHING', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(42)

    // Body text
    const lines = [
      'You unlocked two combat stances!',
      '',
      '⚡ QUAKE — ranged shockwave rings',
      '⚔ MELEE — close-range ground slams',
      '',
      'Each stance drains energy.',
      'When empty — auto-switches to the other.',
      'Press [Q] to switch manually.',
    ]
    const body = this.add.text(width / 2, py + 56, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '12px', color: '#cccccc',
      stroke: '#000000', strokeThickness: 1,
      lineSpacing: 5, align: 'center',
    }).setOrigin(0.5, 0).setDepth(42)

    // [Q] key highlight
    const qHint = this.add.text(width / 2, py + ph - 70, '[ Q ]', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(42)
    this.tweens.add({
      targets: qHint, scaleX: 1.15, scaleY: 1.15,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Energy bars highlight
    const hlG = this.add.graphics().setDepth(42)
    const drawHighlight = (alpha: number) => {
      hlG.clear()
      hlG.lineStyle(2, 0xffcc44, alpha)
      hlG.strokeRoundedRect(10, 74, 202, 18, 4)
    }
    drawHighlight(0.8)
    this.tweens.addCounter({
      from: 0.3, to: 0.9, duration: 600, yoyo: true, repeat: -1,
      onUpdate: (t) => drawHighlight(t.getValue() as number),
    })
    const arrow = this.add.text(216, 74, '◄ energy', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(42)

    // Dismiss hint
    const dismiss = this.add.text(width / 2, py + ph - 24, 'click to continue', {
      fontFamily: 'monospace', fontSize: '10px', color: '#666688',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(42)
    this.tweens.add({
      targets: dismiss, alpha: 0.4,
      duration: 800, yoyo: true, repeat: -1,
    })

    // Entrance
    const all = [panel, title, body, qHint, dismiss, hlG, arrow]
    all.forEach(o => { o.setAlpha(0); (o as any).y += 20 })
    this.tweens.add({
      targets: all, alpha: 1, y: '-=20',
      duration: 300, delay: 150, ease: 'Quad.easeOut',
    })

    // Click to dismiss
    this.time.delayedCall(300, () => {
      this.input.enabled = true
      const zone = this.add.zone(width / 2, height / 2, width, height)
        .setInteractive().setDepth(43)
      zone.once('pointerdown', () => {
        this.tweens.add({
          targets: [...all, bg, zone], alpha: 0, duration: 200,
          onComplete: () => {
            this.scene.resume(this.callerSceneKey)
            this.scene.stop()
          },
        })
      })
    })
  }

  shutdown() {
    this.tweens.killAll()
  }
}
