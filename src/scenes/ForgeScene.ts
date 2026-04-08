import Phaser from 'phaser'
import { MetaProgress, META_UPGRADES, type MetaUpgradeDef, type MetaData } from '../systems/MetaProgress'

const GOLD_HEX = 0xffd700
const C = {
  BG: 0x0a0a1e, PANEL: 0x1a1a2e, BORDER: 0x444466,
  BORDER_GOLD: GOLD_HEX, PIP_FULL: GOLD_HEX, PIP_EMPTY: 0x333355,
  GOLD: '#FFD700', LABEL: '#ffffff', DESC: '#aabbcc',
  MUTED: '#666666', RED: '#ff4444',
}

export class ForgeScene extends Phaser.Scene {
  private meta!: MetaData
  private goldText!: Phaser.GameObjects.Text
  private cardObjects: Phaser.GameObjects.GameObject[][] = []

  constructor() { super({ key: 'ForgeScene' }) }

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

    this.drawAllCards(goldY + (compact ? 30 : 40), compact)

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
      const cardH = 200
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

    if (compact) {
      const labelY = y + 10, descY = labelY + 18, pipY = descY + 18
      objects.push(this.add.text(x + pad, labelY, def.label, { fontFamily: 'monospace', fontSize: '13px', color: C.LABEL, stroke: '#000000', strokeThickness: 1 }))
      objects.push(this.add.text(x + pad, descY, def.desc, { fontFamily: 'monospace', fontSize: '11px', color: C.DESC }))
      addPips(x + pad, pipY, 10, 4)
      const costX = x + w - pad, costY = y + h / 2 - 8
      objects.push(maxed
        ? this.add.text(costX, costY, 'MAXED', { fontFamily: 'monospace', fontSize: '12px', color: C.GOLD, stroke: '#000000', strokeThickness: 2 }).setOrigin(1, 0.5)
        : this.add.text(costX, costY, `✦ ${cost}`, { fontFamily: 'monospace', fontSize: '13px', color: canAfford ? C.GOLD : C.MUTED, stroke: '#000000', strokeThickness: 2 }).setOrigin(1, 0.5)
      )
    } else {
      const labelY = y + pad + 8, descY = labelY + 26, pipY = y + h - 68, costY = y + h - 42
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
}
