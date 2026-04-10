import Phaser from 'phaser'
import { MetaProgress, META_UPGRADES, type MetaUpgradeDef, type MetaData } from '../systems/MetaProgress'
import { getIconFrame } from '../systems/UpgradeSystem'
import { type HeroType } from '../entities/Player'

const GOLD_HEX = 0xffd700
const C = {
  BG: 0x0a0a1e, PANEL: 0x1a1a2e, BORDER: 0x444466,
  BORDER_GOLD: GOLD_HEX, PIP_FULL: GOLD_HEX, PIP_EMPTY: 0x333355,
  GOLD: '#FFD700', LABEL: '#ffffff', DESC: '#aabbcc',
  MUTED: '#666666', RED: '#ff4444',
}

// ── Recruit heroes (gold purchase unlocks) ──────────────────────────
interface RecruitDef {
  id: HeroType
  name: string
  role: string
  cost: number
  color: number
  asset: string
  fw: number; fh: number; scale: number; frames: number
}
const RECRUITS: RecruitDef[] = [
  { id: 'huntress', name: 'Lyra', role: 'Spear Thrower', cost: 300, color: 0x2ecc71,
    asset: 'assets/lyra/Idle.png', fw: 150, fh: 150, scale: 1.0, frames: 8 },
]

// Each forge upgrade reuses the matching generic-pool icon for visual parity
// with in-run upgrade cards (g5_vitality / g1_sharp_edge / etc.).
const META_ICON_NAMES: Record<string, string> = {
  mu_hp:    'g5_vitality',
  mu_dmg:   'g1_sharp_edge',
  mu_spd:   'g2_swift_feet',
  mu_regen: 'g6_regeneration',
  mu_cd:    'g4_quick_hands',
}

export class ForgeScene extends Phaser.Scene {
  private meta!: MetaData
  private goldText!: Phaser.GameObjects.Text
  private cardObjects: Phaser.GameObjects.GameObject[][] = []
  private recruitObjects: Phaser.GameObjects.GameObject[] = []

  constructor() { super({ key: 'ForgeScene' }) }

  preload() {
    // Forge can be opened straight from StartScene without going through a
    // run, so the skill_icons sheet may not be loaded yet — pull it on demand.
    if (!this.textures.exists('skill_icons')) {
      this.load.spritesheet('skill_icons', 'assets/icons/skill_icons_sheet.png', { frameWidth: 128, frameHeight: 128 })
    }
    // Recruit hero portraits
    for (const r of RECRUITS) {
      const key = r.asset.replace(/[^a-z0-9]/gi, '_')
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, r.asset, { frameWidth: r.fw, frameHeight: r.fh })
      }
    }
  }

  create() {
    this.cameras.main.fadeIn(200)
    this.meta = MetaProgress.load()
    const { width, height } = this.scale
    const compact = width < 700

    const bg = this.add.graphics()
    bg.fillStyle(C.BG)
    bg.fillRect(0, 0, width, height)

    const titleY = compact ? 28 : 36
    this.add.text(width / 2, titleY, 'FORGE', {
      fontFamily: 'monospace', fontSize: compact ? '32px' : '42px',
      color: C.GOLD, stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5)
    this.add.text(width / 2, titleY + (compact ? 30 : 40), 'Permanent Upgrades', {
      fontFamily: 'monospace', fontSize: compact ? '13px' : '16px', color: C.DESC,
    }).setOrigin(0.5)

    const goldY = titleY + (compact ? 62 : 76)
    this.goldText = this.add.text(width / 2, goldY, `✦ ${this.meta.goldTotal}`, {
      fontFamily: 'monospace', fontSize: compact ? '18px' : '22px',
      color: C.GOLD, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    const cardsTopY = goldY + (compact ? 30 : 40)
    this.drawAllCards(cardsTopY, compact)

    // Recruit section below meta-upgrades (only if tutorial is complete)
    if (this.meta.tutorialComplete) {
      const cardRows = compact ? Math.ceil(META_UPGRADES.length / 2) : 1
      const cardH = compact ? 90 : 240
      const gap = compact ? 10 : 14
      const recruitTopY = cardsTopY + cardRows * (cardH + gap) + (compact ? 10 : 20)
      this.drawRecruitSection(recruitTopY, compact)
    }

    const back = this.add.text(20, 20, '< BACK', {
      fontFamily: 'monospace', fontSize: compact ? '14px' : '16px',
      color: C.MUTED, stroke: '#000000', strokeThickness: 2,
    }).setInteractive({ useHandCursor: true })
    back.on('pointerover', () => back.setColor('#ffffff'))
    back.on('pointerout', () => back.setColor(C.MUTED))
    back.on('pointerdown', () => { this.cameras.main.fadeOut(200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StartScene')) })

    // ESC to go back
    this.input.keyboard!.on('keydown-ESC', () => { this.cameras.main.fadeOut(200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StartScene')) })
  }

  private drawAllCards(topY: number, compact: boolean) {
    for (const group of this.cardObjects) for (const obj of group) obj.destroy()
    this.cardObjects = []
    const { width } = this.scale
    const count = META_UPGRADES.length

    if (compact) {
      // 2-column grid on mobile to avoid vertical overflow
      const cols = 2
      const gap = 10
      const cardW = Math.floor((width - 20 - gap * (cols - 1)) / cols)
      const cardH = 90
      for (let i = 0; i < count; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const cx = 10 + col * (cardW + gap)
        const cy = topY + row * (cardH + gap)
        this.cardObjects.push(this.drawCard(META_UPGRADES[i], cx, cy, cardW, cardH, true))
      }
    } else {
      const gapSize = 14
      const cardW = Math.floor((width - 40 - gapSize * (count - 1)) / count)
      const cardH = 240
      for (let i = 0; i < count; i++) {
        this.cardObjects.push(this.drawCard(META_UPGRADES[i], 20 + i * (cardW + gapSize), topY, cardW, cardH, false))
      }
    }
  }

  private drawCard(def: MetaUpgradeDef, x: number, y: number, w: number, h: number, compact: boolean): Phaser.GameObjects.GameObject[] {
    const objects: Phaser.GameObjects.GameObject[] = []
    const tier = this.meta.metaUpgrades[def.id] ?? 0
    const maxed = tier >= def.maxTier
    const cost = maxed ? 0 : def.costs[tier]
    const canAfford = !maxed && this.meta.goldTotal >= cost
    const pad = 12, midX = x + w / 2

    const g = this.add.graphics()
    objects.push(g)
    this.renderCardBg(g, x, y, w, h, maxed ? C.BORDER_GOLD : C.BORDER)

    const addPips = (startX: number, pipY: number, pipSize: number, pipGap: number) => {
      for (let p = 0; p < def.maxTier; p++) {
        const pg = this.add.graphics()
        pg.fillStyle(p < tier ? C.PIP_FULL : C.PIP_EMPTY)
        pg.fillRoundedRect(startX + p * (pipSize + pipGap), pipY, pipSize, pipSize, 2)
        objects.push(pg)
      }
    }

    const iconName = META_ICON_NAMES[def.id]
    const hasIcon = iconName && this.textures.exists('skill_icons')

    if (compact) {
      // Mobile layout: small icon left of label
      const iconSize = 28
      const iconX = x + pad + iconSize / 2
      const iconY = y + 10 + iconSize / 2
      if (hasIcon) {
        const ic = this.add.image(iconX, iconY, 'skill_icons', getIconFrame(iconName!))
        ic.setDisplaySize(iconSize, iconSize)
        if (maxed) ic.setAlpha(0.85)
        objects.push(ic)
      }
      const textX = x + pad + iconSize + 8
      const labelY = y + 10, descY = labelY + 18, pipY = descY + 18
      objects.push(this.add.text(textX, labelY, def.label, { fontFamily: 'monospace', fontSize: '13px', color: C.LABEL, stroke: '#000000', strokeThickness: 1 }))
      objects.push(this.add.text(textX, descY, def.desc, { fontFamily: 'monospace', fontSize: '11px', color: C.DESC }))
      addPips(textX, pipY, 10, 4)
      const costX = x + w - pad, costY = y + h / 2 - 8
      objects.push(maxed
        ? this.add.text(costX, costY, 'MAXED', { fontFamily: 'monospace', fontSize: '12px', color: C.GOLD, stroke: '#000000', strokeThickness: 2 }).setOrigin(1, 0.5)
        : this.add.text(costX, costY, `✦ ${cost}`, { fontFamily: 'monospace', fontSize: '13px', color: canAfford ? C.GOLD : C.MUTED, stroke: '#000000', strokeThickness: 2 }).setOrigin(1, 0.5)
      )
    } else {
      // Desktop layout: large icon centered above label
      const iconSize = Math.min(64, w - pad * 4)
      const iconY = y + pad + iconSize / 2
      if (hasIcon) {
        const ic = this.add.image(midX, iconY, 'skill_icons', getIconFrame(iconName!))
        ic.setDisplaySize(iconSize, iconSize)
        if (maxed) ic.setAlpha(0.85)
        objects.push(ic)
      }
      const labelY = iconY + iconSize / 2 + 10
      const descY = labelY + 22, pipY = y + h - 68, costY = y + h - 42
      objects.push(this.add.text(midX, labelY, def.label, { fontFamily: 'monospace', fontSize: '14px', color: C.LABEL, stroke: '#000000', strokeThickness: 1, wordWrap: { width: w - pad * 2 }, align: 'center' }).setOrigin(0.5, 0))
      objects.push(this.add.text(midX, descY, def.desc, { fontFamily: 'monospace', fontSize: '11px', color: C.DESC, wordWrap: { width: w - pad * 2 }, align: 'center' }).setOrigin(0.5, 0))
      const pipSize = 12, pipGap = 6
      const pipsW = def.maxTier * pipSize + (def.maxTier - 1) * pipGap
      addPips(midX - pipsW / 2, pipY, pipSize, pipGap)
      objects.push(maxed
        ? this.add.text(midX, costY, 'MAXED', { fontFamily: 'monospace', fontSize: '14px', color: C.GOLD, stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5)
        : this.add.text(midX, costY, `✦ ${cost}`, { fontFamily: 'monospace', fontSize: '14px', color: canAfford ? C.GOLD : C.MUTED, stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5)
      )
    }

    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: !maxed })
    objects.push(zone)
    zone.on('pointerover', () => { if (!maxed) this.renderCardBg(g, x, y, w, h, C.BORDER_GOLD) })
    zone.on('pointerout', () => { this.renderCardBg(g, x, y, w, h, maxed ? C.BORDER_GOLD : C.BORDER) })
    zone.on('pointerdown', () => {
      if (maxed) return
      if (!canAfford) {
        const costObj = objects.find(o => o instanceof Phaser.GameObjects.Text && (o as Phaser.GameObjects.Text).text.includes(String(cost))) as Phaser.GameObjects.Text | undefined
        if (costObj) { costObj.setColor(C.RED); this.time.delayedCall(300, () => costObj.setColor(C.MUTED)) }
        return
      }
      this.meta.goldTotal -= cost
      this.meta.metaUpgrades[def.id] = tier + 1
      MetaProgress.save(this.meta)
      this.goldText.setText(`✦ ${this.meta.goldTotal}`)
      const isCompact = this.scale.width < 700
      const titleY = isCompact ? 28 : 36
      const goldY = titleY + (isCompact ? 62 : 76)
      this.drawAllCards(goldY + (isCompact ? 30 : 40), isCompact)
    })

    return objects
  }

  private renderCardBg(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, borderColor: number) {
    g.clear()
    g.fillStyle(C.PANEL)
    g.fillRoundedRect(x, y, w, h, 8)
    g.lineStyle(2, borderColor)
    g.strokeRoundedRect(x, y, w, h, 8)
  }

  // ============================================================
  // RECRUIT HEROES SECTION
  // ============================================================
  private drawRecruitSection(topY: number, compact: boolean) {
    for (const obj of this.recruitObjects) obj.destroy()
    this.recruitObjects = []
    const { width } = this.scale

    // Section label
    const labelY = topY
    const label = this.add.text(width / 2, labelY, '— RECRUIT HEROES —', {
      fontFamily: 'monospace', fontSize: compact ? '14px' : '16px',
      color: C.GOLD, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)
    this.recruitObjects.push(label)

    const tileTopY = labelY + (compact ? 24 : 32)
    const tileH = compact ? 80 : 120
    const tileW = compact ? Math.min(width - 20, 320) : Math.min(360, width / 2)
    const tileX = width / 2 - tileW / 2

    for (const recruit of RECRUITS) {
      const alreadyUnlocked = MetaProgress.isHeroUnlocked(recruit.id)
      const canAfford = !alreadyUnlocked && this.meta.goldTotal >= recruit.cost

      // Card background
      const g = this.add.graphics()
      const borderCol = alreadyUnlocked ? 0x555555 : (canAfford ? GOLD_HEX : C.BORDER)
      this.renderCardBg(g, tileX, tileTopY, tileW, tileH, borderCol)
      this.recruitObjects.push(g)

      // Portrait circle
      const circR = compact ? 24 : 32
      const circX = tileX + 16 + circR
      const circY = tileTopY + tileH / 2
      const circG = this.add.graphics()
      circG.fillStyle(alreadyUnlocked ? 0x222222 : 0x111122)
      circG.fillCircle(circX, circY, circR)
      circG.lineStyle(2, alreadyUnlocked ? 0x555555 : recruit.color, alreadyUnlocked ? 0.4 : 0.8)
      circG.strokeCircle(circX, circY, circR)
      this.recruitObjects.push(circG)

      // Portrait sprite
      const texKey = recruit.asset.replace(/[^a-z0-9]/gi, '_')
      if (this.textures.exists(texKey)) {
        const sprite = this.add.sprite(circX, circY, texKey, 0).setScale(recruit.scale * 0.65)
        if (alreadyUnlocked) sprite.setTint(0x666666)
        // Circular mask
        const maskShape = this.make.graphics({ x: 0, y: 0 })
        maskShape.fillStyle(0xffffff)
        maskShape.fillCircle(circX, circY, circR - 2)
        sprite.setMask(maskShape.createGeometryMask())
        this.recruitObjects.push(sprite)
      }

      // Name + role
      const textX = circX + circR + 14
      const nameColor = alreadyUnlocked ? '#666666' : `#${recruit.color.toString(16).padStart(6, '0')}`
      const nameT = this.add.text(textX, circY - (compact ? 14 : 18), recruit.name, {
        fontFamily: 'monospace', fontSize: compact ? '14px' : '16px',
        color: nameColor, stroke: '#000000', strokeThickness: 2,
      })
      this.recruitObjects.push(nameT)

      const roleT = this.add.text(textX, circY + (compact ? 2 : 4), recruit.role, {
        fontFamily: 'monospace', fontSize: compact ? '10px' : '12px',
        color: alreadyUnlocked ? '#444444' : C.DESC, stroke: '#000000', strokeThickness: 1,
      })
      this.recruitObjects.push(roleT)

      // Cost / status — right side
      const costX = tileX + tileW - 16
      if (alreadyUnlocked) {
        const t = this.add.text(costX, circY, 'RECRUITED', {
          fontFamily: 'monospace', fontSize: compact ? '12px' : '14px',
          color: '#555555', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(1, 0.5)
        this.recruitObjects.push(t)
      } else {
        const costT = this.add.text(costX, circY, `✦ ${recruit.cost}`, {
          fontFamily: 'monospace', fontSize: compact ? '14px' : '16px',
          color: canAfford ? C.GOLD : C.MUTED, stroke: '#000000', strokeThickness: 2,
        }).setOrigin(1, 0.5)
        this.recruitObjects.push(costT)

        // Interactive zone
        const zone = this.add.zone(tileX, tileTopY, tileW, tileH).setOrigin(0)
          .setInteractive({ useHandCursor: canAfford })
        this.recruitObjects.push(zone)
        zone.on('pointerover', () => {
          if (!alreadyUnlocked) this.renderCardBg(g, tileX, tileTopY, tileW, tileH, GOLD_HEX)
        })
        zone.on('pointerout', () => {
          this.renderCardBg(g, tileX, tileTopY, tileW, tileH, canAfford ? GOLD_HEX : C.BORDER)
        })
        zone.on('pointerdown', () => {
          if (this.meta.goldTotal < recruit.cost) {
            // Flash red on cost text
            costT.setColor(C.RED)
            this.time.delayedCall(300, () => costT.setColor(C.MUTED))
            return
          }
          // Purchase!
          this.meta.goldTotal -= recruit.cost
          MetaProgress.unlockHero(recruit.id)
          // Re-save gold
          MetaProgress.save(this.meta)
          this.goldText.setText(`✦ ${this.meta.goldTotal}`)
          // Redraw recruit section
          this.drawRecruitSection(topY, compact)
        })
      }
    }
  }
}
