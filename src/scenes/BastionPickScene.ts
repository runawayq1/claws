import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { UpgradeTracker, HERO_BRANCHES, getIconTexture, type Upgrade } from '../systems/UpgradeSystem'
import { unlockUpgrade, unlockBranch } from './EncyclopediaScene'
import { isMobileUserAgent, gameFont } from '../utils/device'

const CARD_W = 210
const CARD_H = 310
const GAP = 14
const ICON_SIZE = 96

/**
 * Standalone scene for the Bastion bonus pick (Amun quest 1 reward).
 * Completely independent from LevelUpScene to avoid Phaser scene re-launch issues.
 */
export class BastionPickScene extends Phaser.Scene {
  private player!: Player
  private tracker!: UpgradeTracker
  private callerSceneKey = 'GameScene'
  private picked = false

  constructor() {
    super({ key: 'BastionPickScene' })
  }

  create(data: { player: Player; tracker: UpgradeTracker; callerSceneKey?: string }) {
    this.player = data.player
    this.tracker = data.tracker
    this.callerSceneKey = data.callerSceneKey ?? 'GameScene'
    this.picked = false

    const isMob = isMobileUserAgent()
    const { width, height } = this.scale

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.85)
    overlay.fillRect(0, 0, width, height)

    // Header
    this.add.text(width / 2, height * 0.08, 'NEW SPECIALIZATION', {
      fontFamily: gameFont(), fontSize: isMob ? '18px' : '28px',
      color: '#4488ff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.08 + (isMob ? 24 : 36), 'Choose a Bastion skill', {
      fontFamily: gameFont(), fontSize: isMob ? '12px' : '14px',
      color: '#aaaaaa', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)

    // Get Bastion branch
    const branches = HERO_BRANCHES[this.player.heroType] || []
    const bastionDef = branches.find(b => b.name === 'Bastion')
    if (!bastionDef) {
      this.scene.resume(this.callerSceneKey)
      this.scene.stop()
      return
    }

    // Build regular Bastion upgrade cards (exclude ab2 Aura of Might — shield orbiter)
    const regulars = bastionDef.upgrades.filter(u => !u.isUltimate && u.id !== 'ab2')
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
    const totalW = scaledCW * upgrades.length + scaledGap * (upgrades.length - 1)
    const startX = width / 2 - totalW / 2
    const targetY = height / 2 - scaledCH / 2

    upgrades.forEach((upgrade, i) => {
      const cx = startX + i * (scaledCW + scaledGap)
      this.createCard(cx, targetY, upgrade, cardScale, isMob)
    })
  }

  private createCard(x: number, y: number, upgrade: Upgrade, cardScale: number, isMob: boolean) {
    const borderColor = upgrade.branchColor || 0x4488ff

    const container = this.add.container(x + CARD_W / 2 * cardScale, y + CARD_H / 2 * cardScale)
    container.setScale(cardScale)
    const lx = -CARD_W / 2
    const ly = -CARD_H / 2

    // Background
    const bgImg = this.add.image(0, 0, 'card_back').setDisplaySize(CARD_W, CARD_H)
    container.add(bgImg)

    // Border glow
    const g = this.add.graphics()
    g.lineStyle(2, borderColor, 0.6)
    g.strokeRoundedRect(lx, ly, CARD_W, CARD_H, 8)
    container.add(g)

    // Bottom gradient
    const gradG = this.add.graphics()
    gradG.fillStyle(0x000000, 0.22)
    gradG.fillRoundedRect(lx, ly + CARD_H / 2, CARD_W, CARD_H / 2, { tl: 0, tr: 0, bl: 8, br: 8 })
    container.add(gradG)

    // Hero skill label
    const topY = ly + Math.round(CARD_H * 0.10)
    const heroLabel = this.add.text(0, topY, '★ BASTION', {
      fontFamily: gameFont(), fontSize: '9px',
      color: '#4488ff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(heroLabel)

    // Icon
    const iconY = topY + 60
    const it = getIconTexture(upgrade.icon, this)
    const icon = this.add.image(0, iconY, it.key, it.frame)
      .setDisplaySize(ICON_SIZE, ICON_SIZE)
    container.add(icon)

    // Glow behind icon
    const glowG = this.add.graphics()
    glowG.fillStyle(borderColor, 0.15)
    glowG.fillCircle(0, iconY, 36)
    container.add(glowG)
    container.moveTo(glowG, container.getIndex(icon))

    // Skill name
    const nameY = iconY + ICON_SIZE / 2 + 8
    const nameLabel = this.add.text(0, nameY, upgrade.label, {
      fontFamily: gameFont(), fontSize: isMob ? '18px' : '14px',
      color: '#FFD700', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(nameLabel)

    // Description
    const descArr = Array.isArray(upgrade.desc) ? upgrade.desc : [upgrade.desc as string]
    const descText = descArr[0] ?? ''
    const descY = nameY + 16
    const descLabel = this.add.text(0, descY, descText, {
      fontFamily: gameFont(), fontSize: isMob ? '12px' : '10px',
      color: '#cccccc', stroke: '#000000', strokeThickness: 1,
      wordWrap: { width: CARD_W - 24 }, align: 'center', lineSpacing: 2,
    }).setOrigin(0.5, 0)
    container.add(descLabel)

    // Select button
    const btnY = ly + CARD_H - 14
    const selectText = this.add.text(0, btnY, '[ SELECT ]', {
      fontFamily: gameFont(), fontSize: isMob ? '14px' : '10px',
      color: '#ffd700', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(selectText)
    this.tweens.add({
      targets: selectText, scaleX: 1.08, scaleY: 1.08,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Interactive zone
    const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true })
    container.add(zone)

    zone.on('pointerover', () => {
      g.clear()
      g.lineStyle(2, borderColor, 1)
      g.strokeRoundedRect(lx, ly, CARD_W, CARD_H, 8)
      g.fillStyle(0xffffff, 0.06)
      g.fillRoundedRect(lx, ly, CARD_W, CARD_H, 8)
    })
    zone.on('pointerout', () => {
      g.clear()
      g.lineStyle(2, borderColor, 0.6)
      g.strokeRoundedRect(lx, ly, CARD_W, CARD_H, 8)
    })
    zone.on('pointerdown', () => this.pickUpgrade(upgrade))

    // Entrance animation
    container.setAlpha(0).setPosition(container.x, container.y + 30)
    this.tweens.add({
      targets: container, alpha: 1, y: container.y - 30,
      duration: 300, ease: 'Back.easeOut',
    })
  }

  private pickUpgrade(upgrade: Upgrade) {
    if (this.picked) return
    this.picked = true
    this.input.enabled = false

    // Apply upgrade
    const nextLevel = (this.tracker.getLevel(upgrade.id) || 0) + 1
    upgrade.apply(this.player, nextLevel)
    this.tracker.pick(upgrade)

    // Encyclopedia
    unlockUpgrade(upgrade.id)
    if (upgrade.branch) unlockBranch(upgrade.branch)

    // Flash + close
    const { width, height } = this.scale
    const flash = this.add.graphics().setDepth(50)
    flash.fillStyle(0x4488ff, 0.3)
    flash.fillRect(0, 0, width, height)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
    })

    this.time.delayedCall(500, () => {
      this.scene.resume(this.callerSceneKey)
      this.scene.stop()
    })
  }

  shutdown() {
    // Kill all tweens so they don't fire on destroyed objects after scene stop
    this.tweens.killAll()
  }
}
