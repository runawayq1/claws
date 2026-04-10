import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { UpgradeTracker, HERO_BRANCHES, getIconTexture, type Upgrade, type BranchDef } from '../systems/UpgradeSystem'
import { unlockUpgrade, unlockBranch } from './EncyclopediaScene'
import { shouldShowHint } from '../systems/HintFlags'
import { isMobileUserAgent, isPortrait } from '../utils/device'

/** Render desc text with number tokens highlighted in yellow. Returns [baseText, overlayText]. */
function addHighlightedDesc(
  scene: Phaser.Scene, x: number, y: number, text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): [Phaser.GameObjects.Text, Phaser.GameObjects.Text] {
  const base = scene.add.text(x, y, text, { ...style }).setOrigin(0.5, 0)

  // Get wrapped lines from the base text to match line breaks exactly
  const lines = base.getWrappedText(text)
  const wrapped = lines.join('\n')

  // Build overlay: only number tokens visible, rest replaced with spaces
  const result = new Array(wrapped.length).fill(' ')
  for (let i = 0; i < wrapped.length; i++) {
    if (wrapped[i] === '\n') result[i] = '\n'
  }
  let pos = 0
  for (const line of lines) {
    const re = /[+×]?\d+\.?\d*[%ms]?/g
    let m
    while ((m = re.exec(line)) !== null) {
      for (let i = 0; i < m[0].length; i++) result[pos + m.index + i] = line[m.index + i]
    }
    pos += line.length + 1
  }

  // Render overlay WITHOUT wordWrap — line breaks already embedded via \n
  const { wordWrap: _, ...noWrapStyle } = style as any
  const overlay = scene.add.text(x, y, result.join(''), {
    ...noWrapStyle, color: '#FFD700',
  }).setOrigin(0.5, 0)

  return [base, overlay]
}

// Compact 5-card layout
const CARD_W = 170
const CARD_H = 255
const GAP = 12
const STRIP_H = 14
const ICON_SIZE = 96
const DOT_RADIUS = 4
const DOT_COUNT = 3   // max skill level
const DOT_SPACING = 14

// Branch selection mode — bigger, bolder cards
const BRANCH_CARD_W = 289
const BRANCH_CARD_H = 408
const BRANCH_GAP = 24
const BRANCH_ICON_SIZE = 109

export class LevelUpScene extends Phaser.Scene {
  private player!: Player
  private tracker!: UpgradeTracker
  private callerSceneKey!: string
  private picked = false
  private _bonusSpecialization = false  // true when launched as a bonus Bastion picker
  // Keyboard shortcut triggers — populated during card creation
  private cardTriggers: Array<() => void> = []
  private cardFlips: Array<() => void> = []

  constructor() {
    super({ key: 'LevelUpScene' })
  }

  create(data: { player: Player; tracker: UpgradeTracker; callerSceneKey?: string; bonusSpecialization?: boolean }) {
    this.player = data.player
    this.tracker = data.tracker
    this.callerSceneKey = data.callerSceneKey ?? 'GameScene'
    this.picked = false
    this._bonusSpecialization = data.bonusSpecialization ?? false
    this.cardTriggers = []
    this.cardFlips = []
    const isMob = isMobileUserAgent()
    const mobZoom = isMob ? 0.85 : 1
    if (isMob) {
      this.cameras.main.setZoom(mobZoom)
      // Shift scroll so visible world [0..width, 0..height] is centered on screen.
      // Camera center = scrollX + scale.width/2; we need center at width/2 = scale.width/(2*zoom)
      // → scrollX = scale.width/(2*zoom) - scale.width/2 = scale.width * (1/zoom - 1) / 2
      this.cameras.main.scrollX = this.scale.width * (1 / mobZoom - 1) / 2
      this.cameras.main.scrollY = this.scale.height * (1 / mobZoom - 1) / 2
    }
    // Use effective dimensions so layout centers correctly under zoom
    const width = this.scale.width / mobZoom
    const height = this.scale.height / mobZoom
    const isBranch = this.tracker.isBranchSelection

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, isBranch ? 0.85 : 0.75)
    overlay.fillRect(0, 0, width, height)

    // Pulsing color strip at top of scene
    const pulseStrip = this.add.graphics().setDepth(25)
    const stripH = isMob ? 3 : 4
    const pulseColors = [0xffd700, 0xff4444, 0x44ff44, 0x4488ff, 0xff88ff, 0xffaa22]
    const pulseTarget = { phase: 0 }
    this.tweens.add({
      targets: pulseTarget,
      phase: pulseColors.length,
      duration: pulseColors.length * 800,
      repeat: -1,
      onUpdate: () => {
        pulseStrip.clear()
        const idx = Math.floor(pulseTarget.phase) % pulseColors.length
        const nextIdx = (idx + 1) % pulseColors.length
        const t = pulseTarget.phase - Math.floor(pulseTarget.phase)
        const c1 = Phaser.Display.Color.IntegerToColor(pulseColors[idx])
        const c2 = Phaser.Display.Color.IntegerToColor(pulseColors[nextIdx])
        const blended = Phaser.Display.Color.Interpolate.ColorWithColor(c1, c2, 1, t)
        const col = Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b)
        // Bright center line
        pulseStrip.fillStyle(col, 0.9)
        pulseStrip.fillRect(0, 0, width, stripH)
        // Soft glow below
        pulseStrip.fillStyle(col, 0.15)
        pulseStrip.fillRect(0, stripH, width, 20)
        pulseStrip.fillStyle(col, 0.05)
        pulseStrip.fillRect(0, stripH + 20, width, 30)
      },
    })

    // ── Bonus Specialization mode (Quest 1 reward: free Bastion pick for Amun) ──
    // UIScene gates launching via _toastedQuests (seeded from meta.completedQuests),
    // so by the time we get here the bonus mode is guaranteed to be first-time.
    if (this._bonusSpecialization) {
      this._buildBonusSpecializationLayout(width, height, isMob)
      const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']
      KEY_NAMES.forEach((keyName, i) => {
        this.input.keyboard?.on(`keydown-${keyName}`, () => {
          if (this.cardTriggers[i]) this.cardTriggers[i]()
        })
      })
      return
    }

    const upgrades = isBranch
      ? this.tracker.getBranchChoices(this.player.heroType, this.player.getActiveStance())
      : this.tracker.getChoices(this.player.heroType, this.player.getActiveStance())

    // Compute scale factor so cards fit within screen width (with 20px margin each side)
    const availW = width - 40
    if (isBranch) {
      // ── Branch selection: big dramatic layout ──────────────────────────
      const portraitBranch = isMob && isPortrait()

      const headerY = portraitBranch ? height * 0.04 : height * 0.12
      this.add.text(width / 2, headerY, 'CHOOSE YOUR PATH', {
        fontFamily: 'monospace',
        fontSize: isMob ? '22px' : '40px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: isMob ? 4 : 6,
      }).setOrigin(0.5)

      this.add.text(width / 2, headerY + (isMob ? 28 : 48), 'Choose Specialization', {
        fontFamily: 'monospace',
        fontSize: isMob ? '14px' : '16px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      if (portraitBranch) {
        // Portrait: vertical stack — scale cards to fit width, stack vertically
        const cardScale = Math.min(1, availW / BRANCH_CARD_W)
        const scaledCH = BRANCH_CARD_H * cardScale
        const vGap = 12
        const totalH = scaledCH * upgrades.length + vGap * (upgrades.length - 1)
        const topY = headerY + 50
        const availH = height - topY - 20
        // If stack doesn't fit vertically, scale down further
        const vScale = totalH > availH ? availH / totalH : 1
        const finalScale = cardScale * vScale
        const finalCH = BRANCH_CARD_H * finalScale
        const finalGap = vGap * vScale
        const totalFinalH = finalCH * upgrades.length + finalGap * (upgrades.length - 1)
        const startY = topY + (availH - totalFinalH) / 2
        const startX = width / 2 - (BRANCH_CARD_W * finalScale) / 2

        upgrades.forEach((upgrade, i) => {
          this.createBranchCard(startX, startY + i * (finalCH + finalGap), upgrade, i, finalScale)
        })
      } else {
        // Desktop/landscape: horizontal row
        const rawW = BRANCH_CARD_W * upgrades.length + BRANCH_GAP * (upgrades.length - 1)
        const cardScale = rawW > availW ? availW / rawW : 1
        const scaledCW = BRANCH_CARD_W * cardScale
        const scaledCH = BRANCH_CARD_H * cardScale
        const scaledGap = BRANCH_GAP * cardScale

        const totalW = scaledCW * upgrades.length + scaledGap * (upgrades.length - 1)
        const startX = width / 2 - totalW / 2
        const targetY = height / 2 - scaledCH / 2 + (isMob ? 15 : 30)

        upgrades.forEach((upgrade, i) => {
          this.createBranchCard(startX + i * (scaledCW + scaledGap), targetY, upgrade, i, cardScale)
        })
      }
    } else {
      // ── Normal level-up: 5 compact cards ───────────────────────────────
      const gridMode = isMob && isPortrait()  // 3+2 grid on mobile portrait

      if (gridMode) {
        // Portrait mobile: 3 cards on top row, 2 on bottom row (centered)
        const row1Count = 3
        const portraitGap = 18  // wider gap than desktop for touch clarity
        const rawW3 = CARD_W * row1Count + portraitGap * (row1Count - 1)
        const cardScale = Math.min(1, availW / rawW3)
        const scw = CARD_W * cardScale
        const sch = CARD_H * cardScale
        const sgap = portraitGap * cardScale

        const headerBlockH = (32 + 8 + 14 + 20) * cardScale
        const rowGap = 16
        const totalGridH = sch * 2 + rowGap
        const blockTop = height / 2 - (headerBlockH + totalGridH) / 2 - 40 * cardScale

        this.add.text(width / 2, blockTop + 28 * cardScale, 'LEVEL UP', {
          fontFamily: 'monospace',
          fontSize: `${Math.round(32 * cardScale)}px`,
          color: '#FFD700',
          stroke: '#000000',
          strokeThickness: 5,
        }).setOrigin(0.5)

        const row1Y = blockTop + headerBlockH
        const row2Y = row1Y + sch + rowGap
        const row1StartX = width / 2 - (scw * 3 + sgap * 2) / 2
        const row2StartX = width / 2 - (scw * 2 + sgap) / 2

        upgrades.forEach((upgrade, i) => {
          const inRow1 = i < 3
          const col = inRow1 ? i : i - 3
          const x = (inRow1 ? row1StartX : row2StartX) + col * (scw + sgap)
          const y = inRow1 ? row1Y : row2Y
          this.createCard(x, y, upgrade, i, cardScale)
        })
      } else {
        // Desktop / landscape: single horizontal row
        const rawW = CARD_W * upgrades.length + GAP * (upgrades.length - 1)
        const cardScale = rawW > availW ? availW / rawW : 1
        const scaledCW = CARD_W * cardScale
        const scaledCH = CARD_H * cardScale
        const scaledGap = GAP * cardScale

        const headerBlockH = (32 + 8 + 14 + 20) * cardScale
        const totalBlockH = headerBlockH + scaledCH
        const blockTop = height / 2 - totalBlockH / 2 - 60 * cardScale

        this.add.text(width / 2, blockTop + 28 * cardScale, 'LEVEL UP', {
          fontFamily: 'monospace',
          fontSize: `${Math.round(32 * cardScale)}px`,
          color: '#FFD700',
          stroke: '#000000',
          strokeThickness: 5,
        }).setOrigin(0.5)

        const totalW = scaledCW * upgrades.length + scaledGap * (upgrades.length - 1)
        const startX = width / 2 - totalW / 2
        const targetY = blockTop + headerBlockH

        upgrades.forEach((upgrade, i) => {
          this.createCard(startX + i * (scaledCW + scaledGap), targetY, upgrade, i, cardScale)
        })
      }

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

    // Big icon
    const iconY = ly + 150
    const it = getIconTexture(upgrade.icon, this)
    const icon = this.add.image(0, iconY, it.key, it.frame)
      .setDisplaySize(BRANCH_ICON_SIZE, BRANCH_ICON_SIZE)
    container.add(icon)

    // First skill name
    const nameLabel = this.add.text(0, iconY + BRANCH_ICON_SIZE / 2 + 16, upgrade.label, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(nameLabel)

    // First skill description (level 1 desc)
    const descText = Array.isArray(upgrade.desc) ? upgrade.desc[0] : upgrade.desc
    if (descText) {
      const descY = iconY + BRANCH_ICON_SIZE / 2 + 44
      const brDescStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#cccccc',
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: cw - 30 },
        align: 'center',
        lineSpacing: 4,
      }
      const [descTxt, descTxtHL] = addHighlightedDesc(this, 0, descY, descText, brDescStyle)
      container.add(descTxt)
      container.add(descTxtHL)
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
    const flipIdx2 = this.cardFlips.length - 1

    // Click / keyboard trigger
    const triggerBranchCard = () => {
      if (!flipped) { this.flipAllCards(flipIdx2); return }
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

    // ── Top label: hero skill + level dots ─────────────────────────────
    const topOffset = Math.round(CARD_H * 0.10)  // 10% down from top
    if (isPersonal) {
      const heroLabel = this.add.text(0, ly + topOffset, isUltimate ? '★ ULTIMATE' : '★ HERO SKILL', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: isUltimate ? '#ffcc44' : '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)
      container.add(heroLabel)
    }

    if (isPersonal && upgrade.branch) {
      // Skill level dots (3 max)
      const dotsStartX = -(((DOT_COUNT - 1) * DOT_SPACING) / 2)
      const dotsY = ly + topOffset + 14
      const dotG = this.add.graphics()
      for (let d = 0; d < DOT_COUNT; d++) {
        const filled = d < currentLevel
        const isNext = d === currentLevel
        const dx = dotsStartX + d * DOT_SPACING
        if (filled) {
          dotG.fillStyle(borderColor, 1)
          dotG.fillCircle(dx, dotsY, DOT_RADIUS)
        } else if (isNext) {
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
      const badgeY = ly + topOffset + 28
      const badgeG = this.add.graphics()
      badgeG.fillStyle(0xffcc00, 0.9)
      badgeG.fillRoundedRect(-26, badgeY, 52, 14, 4)
      container.add(badgeG)

      const lvlUpText = this.add.text(0, badgeY + 7, `LVL ${nextLevel}`, {
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
      fontSize: '20px',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(nameLabel)

    // ── Description (next level text) ─────────────────────────────────────
    const descMaxY = ly + CARD_H - 30
    const descStartY = nameY + 14
    const descAvail = descMaxY - descStartY
    const descStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: isPersonal ? '#cccccc' : '#999999',
      stroke: '#000000',
      strokeThickness: 1,
      wordWrap: { width: CARD_W - 16 },
      align: 'center',
      lineSpacing: 2,
    }
    const [descLabel, descHL] = addHighlightedDesc(this, 0, descStartY, nextDesc, descStyle)
    if (descLabel.height > descAvail) {
      descLabel.setCrop(0, 0, descLabel.width, descAvail)
      descHL.setCrop(0, 0, descHL.width, descAvail)
    }
    container.add(descLabel)
    container.add(descHL)

    // ── SELECT button ─────────────────────────────────────────────────────
    const btnY = ly + CARD_H - 14
    const btnLabel = isLevelUp ? '[ LVL UP ]' : '[ SELECT ]'
    const btnColor = isPersonal ? '#ffd700' : '#88ff88'
    const selectText = this.add.text(0, btnY, btnLabel, {
      fontFamily: 'monospace',
      fontSize: '14px',
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

  // ── Looping confetti (desktop only) ──────────────────────────────────
  private confettiTimer?: Phaser.Time.TimerEvent
  private spawnConfetti(w: number, h: number) {
    const burst = () => {
      const colors = [0xffd700, 0xff4444, 0x44ff44, 0x4488ff, 0xff88ff, 0xffaa22]
      for (let i = 0; i < 40; i++) {
        const x = w * 0.2 + Math.random() * w * 0.6
        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = 3 + Math.random() * 5
        const piece = this.add.graphics().setDepth(30)
        piece.fillStyle(color, 0.9)
        if (Math.random() < 0.5) {
          piece.fillRect(-size / 2, -size, size, size * 2)
        } else {
          piece.fillCircle(0, 0, size / 2)
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
    burst()
    this.confettiTimer = this.time.addEvent({ delay: 2200, callback: burst, loop: true })
  }

  // ── Looping mobile confetti ────────────────────────────────────────────
  private spawnMobileConfetti(w: number, h: number) {
    const burst = () => {
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
    burst()
    this.confettiTimer = this.time.addEvent({ delay: 1000, callback: burst, loop: true })
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
    if (this.confettiTimer) { this.confettiTimer.destroy(); this.confettiTimer = undefined }

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
      if (upgrade.id === 'aq1' && shouldShowHint('amun_stance_tutorial')) {
        this.showStanceTutorial()
      } else {
        this.scene.resume(this.callerSceneKey)
        this.scene.stop()
      }
    })
  }

  // ── Bonus Specialization layout (quest reward: free Bastion pick) ────────

  /**
   * Shows Wrath (locked — already chosen) and Bastion (selectable) as two
   * branch cards. When Bastion is picked, shows its 3 upgrade cards so the
   * player can take one for free, then resumes GameScene.
   */
  private _buildBonusSpecializationLayout(width: number, height: number, isMob: boolean) {
    const branches = HERO_BRANCHES[this.player.heroType] || []
    const bastionDef = branches.find(b => b.name === 'Bastion')
    if (!bastionDef) {
      // Fallback: just resume
      this.scene.resume(this.callerSceneKey)
      this.scene.stop()
      return
    }

    // Skip the Wrath/Bastion selector screen entirely — Bastion is the only
    // valid choice. Go straight to the 3 Bastion skill cards.
    this._showBastionUpgrades(bastionDef, width, height, isMob)
  }

  /**
   * Shows the 3 Bastion upgrade cards. Player picks one, gets it for free, then resumes.
   */
  private _showBastionUpgrades(
    bastionDef: BranchDef,
    width: number, height: number, isMob: boolean,
  ) {
    // Clear existing scene objects — just wipe everything and rebuild
    this.children.removeAll(true)
    this.cardTriggers = []
    this.cardFlips = []

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, width, height)

    this.add.text(width / 2, height * 0.1, 'CHOOSE A BASTION SKILL', {
      fontFamily: 'monospace',
      fontSize: isMob ? '20px' : '28px',
      color: '#4488ff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // Show ab1, ab2, ab3 (non-ultimate Bastion skills at level 1)
    const regulars = bastionDef.upgrades.filter(u => !u.isUltimate).slice(0, 3)
    const upgrades: Upgrade[] = regulars.map(u => ({
      ...u,
      branch: bastionDef.name,
      branchColor: bastionDef.color,
    }))

    const availW = width - 40
    const rawW = CARD_W * upgrades.length + GAP * (upgrades.length - 1)
    const cardScale = rawW > availW ? availW / rawW : 1
    const scaledCW = CARD_W * cardScale
    const scaledCH = CARD_H * cardScale
    const scaledGap = GAP * cardScale

    const headerBlockH = (32 + 8 + 14 + 20) * cardScale
    const totalBlockH = headerBlockH + scaledCH
    const blockTop = height / 2 - totalBlockH / 2 - 30 * cardScale

    const totalW = scaledCW * upgrades.length + scaledGap * (upgrades.length - 1)
    const startX = width / 2 - totalW / 2
    const targetY = blockTop + headerBlockH

    upgrades.forEach((upgrade, i) => {
      this.createCard(startX + i * (scaledCW + scaledGap), targetY, upgrade, i, cardScale)
    })

    // Auto-flip all cards after entrance animation completes so the player
    // only needs a single click to pick a Bastion skill (no pre-flip tap).
    // Entrance: duration 260ms + max delay (2 * 50ms = 100ms) = ~360ms.
    this.time.delayedCall(400, () => this.flipAllCards(1))

    // Override handlePick to not do the normal "is Amun's aq1" check
    // (the upgrade is Bastion, not Quake — no stance tutorial needed)

    const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']
    KEY_NAMES.forEach((keyName, i) => {
      this.input.keyboard?.on(`keydown-${keyName}`, () => {
        if (this.cardTriggers[i]) this.cardTriggers[i]()
      })
    })
  }

  // ── Graphics helpers ────────────────────────────────────────────────────

  private drawCardNormal(g: Phaser.GameObjects.Graphics, _lx: number, _ly: number, _borderColor: number, _isPersonal: boolean) {
    g.clear()
  }

  private drawCardHover(g: Phaser.GameObjects.Graphics, lx: number, ly: number, _borderColor: number, _isPersonal: boolean) {
    g.clear()
    g.fillStyle(0xffffff, 0.06)
    g.fillRoundedRect(lx, ly, CARD_W, CARD_H, 8)
  }

  // ── Stance tutorial dialog (Amun Quake branch) ──────────────────────────
  private showStanceTutorial() {
    const { width, height } = this.scale

    // Dark overlay with cutout for energy bar
    const bg = this.add.graphics().setDepth(40)
    bg.fillStyle(0x000000, 0.8)
    // Draw overlay in sections, leaving a gap for the energy bar area
    const energyX = 52, energyY = 48, energyW = 200, energyH = 20
    bg.fillRect(0, 0, width, energyY)
    bg.fillRect(0, energyY, energyX, energyH)
    bg.fillRect(energyX + energyW, energyY, width - energyX - energyW, energyH)
    bg.fillRect(0, energyY + energyH, width, height - energyY - energyH)
    bg.setAlpha(0)
    this.tweens.add({ targets: bg, alpha: 1, duration: 200 })

    // Fake energy bars inside cutout so they're visible
    const ebPreview = this.add.graphics().setDepth(41)
    const halfW = (energyW - 6) / 2
    // Left bar (ground/melee — gold)
    ebPreview.fillStyle(0x0a0a0a)
    ebPreview.fillRect(energyX + 2, energyY + 3, halfW, energyH - 6)
    ebPreview.fillStyle(0xddaa22)
    ebPreview.fillRect(energyX + 2, energyY + 3, halfW * 0.7, energyH - 6)
    ebPreview.lineStyle(1, 0x554411, 0.5)
    ebPreview.strokeRect(energyX + 2, energyY + 3, halfW, energyH - 6)
    // Right bar (quake — orange)
    const rightX = energyX + 2 + halfW + 3
    ebPreview.fillStyle(0x0a0a0a)
    ebPreview.fillRect(rightX, energyY + 3, halfW, energyH - 6)
    ebPreview.fillStyle(0xff8833)
    ebPreview.fillRect(rightX, energyY + 3, halfW * 0.4, energyH - 6)
    ebPreview.lineStyle(1, 0x553311, 0.5)
    ebPreview.strokeRect(rightX, energyY + 3, halfW, energyH - 6)

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

    // Energy bars highlight — pulsing border + zoom
    const hlG = this.add.graphics().setDepth(42)
    const drawHighlight = (alpha: number, scale: number) => {
      hlG.clear()
      const sx = energyX + energyW / 2 - (energyW * scale) / 2
      const sy = energyY + energyH / 2 - (energyH * scale) / 2
      hlG.lineStyle(2, 0xffcc44, alpha)
      hlG.strokeRoundedRect(sx, sy, energyW * scale, energyH * scale, 3)
    }
    drawHighlight(0.8, 1)
    this.tweens.addCounter({
      from: 0, to: 1, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: (t) => {
        const v = t.getValue() as number
        drawHighlight(0.4 + v * 0.6, 1 + v * 0.06)
      },
    })

    // Gleam sweep across energy bars
    const gleam = this.add.graphics().setDepth(42)
    gleam.fillStyle(0xffffff, 0.35)
    gleam.fillRect(0, 0, 6, energyH - 4)
    gleam.setPosition(energyX, energyY + 2)
    this.tweens.add({
      targets: gleam, x: energyX + energyW - 6,
      duration: 1200, repeat: -1, repeatDelay: 800, ease: 'Sine.easeInOut',
    })

    const arrow = this.add.text(energyX + energyW + 4, energyY + 2, '◄ energy', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(42)
    this.tweens.add({
      targets: arrow, alpha: 0.4,
      duration: 500, yoyo: true, repeat: -1,
    })

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
    const all = [panel, title, body, qHint, dismiss, hlG, arrow, ebPreview, gleam]
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
