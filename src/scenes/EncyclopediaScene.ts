import Phaser from 'phaser'
import { HERO_BRANCHES, GENERIC_POOL } from '../systems/UpgradeSystem'

// ============================================================
// localStorage helpers
// ============================================================

export interface EncyclopediaData {
  heroes: string[]
  upgrades: string[]
  branches: string[]
}

const STORAGE_KEY = 'claws_encyclopedia'

export function loadEncyclopedia(): EncyclopediaData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        heroes:   Array.isArray(parsed.heroes)   ? parsed.heroes   : [],
        upgrades: Array.isArray(parsed.upgrades) ? parsed.upgrades : [],
        branches: Array.isArray(parsed.branches) ? parsed.branches : [],
      }
    }
  } catch (_) { /* ignore */ }
  return { heroes: [], upgrades: [], branches: [] }
}

export function saveEncyclopedia(data: EncyclopediaData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (_) { /* ignore */ }
}

export function unlockHero(heroType: string): void {
  const d = loadEncyclopedia()
  if (!d.heroes.includes(heroType)) { d.heroes.push(heroType); saveEncyclopedia(d) }
}

export function unlockUpgrade(upgradeId: string): void {
  const d = loadEncyclopedia()
  if (!d.upgrades.includes(upgradeId)) { d.upgrades.push(upgradeId); saveEncyclopedia(d) }
}

export function unlockBranch(branchName: string): void {
  const d = loadEncyclopedia()
  if (!d.branches.includes(branchName)) { d.branches.push(branchName); saveEncyclopedia(d) }
}

export function isHeroUnlocked(heroType: string): boolean {
  return loadEncyclopedia().heroes.includes(heroType)
}

export function isUpgradeUnlocked(upgradeId: string): boolean {
  return loadEncyclopedia().upgrades.includes(upgradeId)
}

export function isBranchUnlocked(branchName: string): boolean {
  return loadEncyclopedia().branches.includes(branchName)
}

// ============================================================
// Hero display info
// ============================================================

interface HeroInfo {
  type: string
  name: string
  role: string
  color: number
}

const HERO_INFO: HeroInfo[] = [
  { type: 'ignara',   name: 'Ignara', role: 'Fire Mage',      color: 0xe84118 },
  { type: 'sifra',    name: 'Sifra',  role: 'Ice Mage',       color: 0x82ccdd },
  { type: 'amun',     name: 'Amun',   role: 'Guardian',       color: 0xfff200 },
  { type: 'nazar',    name: 'Nazar',  role: 'Samurai',        color: 0xc23616 },
  { type: 'huntress', name: 'Lyra',   role: 'Spear Thrower',  color: 0x2ecc71 },
]

// ============================================================
// EncyclopediaScene
// ============================================================

export class EncyclopediaScene extends Phaser.Scene {
  private selectedHeroType: string | null = null
  private encData!: EncyclopediaData

  // For page system on right page
  private rightPage = 0  // 0 = branch skills, 1 = generic upgrades

  // Containers rebuilt on hero select / page flip
  private leftContainer!: Phaser.GameObjects.Container
  private rightContainer!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'EncyclopediaScene' })
  }

  create() {
    this.encData = loadEncyclopedia()
    const { width, height } = this.scale

    // Full screen dark bg
    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0, 0)

    // Book dimensions — 80% wide, 75% tall
    const bookW = Math.min(width * 0.9, 900)
    const bookH = Math.min(height * 0.82, 620)
    const bookX = (width - bookW) / 2
    const bookY = (height - bookH) / 2

    const pageW = bookW / 2 - 8
    const leftPageX = bookX
    const rightPageX = bookX + bookW / 2 + 8

    // Book outer shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.5)
    shadow.fillRoundedRect(bookX + 6, bookY + 6, bookW, bookH, 10)

    // Book background (spine area)
    const bookBg = this.add.graphics()
    bookBg.fillStyle(0x2a1810)
    bookBg.fillRoundedRect(bookX, bookY, bookW, bookH, 10)

    // Spine center divider
    bookBg.fillStyle(0x1a0f08)
    bookBg.fillRect(bookX + bookW / 2 - 6, bookY + 4, 12, bookH - 8)

    // Left page parchment
    const leftPageBg = this.add.graphics()
    leftPageBg.fillStyle(0xc8a97a)
    leftPageBg.fillRoundedRect(leftPageX + 4, bookY + 4, pageW, bookH - 8, { tl: 8, tr: 0, bl: 8, br: 0 })
    // Left page inner texture
    leftPageBg.fillStyle(0xd4b483, 0.6)
    leftPageBg.fillRoundedRect(leftPageX + 10, bookY + 10, pageW - 14, bookH - 20, { tl: 6, tr: 0, bl: 6, br: 0 })

    // Right page parchment
    const rightPageBg = this.add.graphics()
    rightPageBg.fillStyle(0xc8a97a)
    rightPageBg.fillRoundedRect(rightPageX, bookY + 4, pageW, bookH - 8, { tl: 0, tr: 8, bl: 0, br: 8 })
    rightPageBg.fillStyle(0xd4b483, 0.6)
    rightPageBg.fillRoundedRect(rightPageX + 4, bookY + 10, pageW - 14, bookH - 20, { tl: 0, tr: 6, bl: 0, br: 6 })

    // Left page title
    this.add.text(leftPageX + pageW / 2, bookY + 22, 'HEROES', {
      fontFamily: 'monospace', fontSize: '14px',
      color: '#2a1810', stroke: '#c8a97a', strokeThickness: 1,
    }).setOrigin(0.5)

    // Decorative title underline
    const titleLine = this.add.graphics()
    titleLine.lineStyle(1, 0x2a1810, 0.4)
    titleLine.lineBetween(leftPageX + 16, bookY + 34, leftPageX + pageW - 10, bookY + 34)

    // Close button
    const closeBtn = this.add.text(bookX + bookW - 6, bookY - 2, 'X', {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#d4b483', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#2a1810', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10)
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'))
    closeBtn.on('pointerout',  () => closeBtn.setColor('#d4b483'))
    closeBtn.on('pointerdown', () => this.scene.start('StartScene'))

    // Build containers
    this.leftContainer  = this.add.container(0, 0)
    this.rightContainer = this.add.container(0, 0)

    this.buildLeftPage(leftPageX, bookY, pageW, bookH)
    this.buildRightPage(rightPageX, bookY, pageW, bookH)
  }

  // ── Left page: hero list ──────────────────────────────────────────────────

  private buildLeftPage(px: number, py: number, pw: number, ph: number) {
    this.leftContainer.removeAll(true)

    const startY = py + 44
    const rowH = Math.min((ph - 60) / HERO_INFO.length, 68)

    HERO_INFO.forEach((hero, i) => {
      const unlocked = this.encData.heroes.includes(hero.type)
      const isSelected = this.selectedHeroType === hero.type
      const rowY = startY + i * rowH
      const colorHex = '#' + hero.color.toString(16).padStart(6, '0')

      // Row highlight for selected
      if (isSelected) {
        const highlight = this.add.graphics()
        highlight.fillStyle(0x2a1810, 0.18)
        highlight.fillRoundedRect(px + 10, rowY, pw - 18, rowH - 4, 4)
        this.leftContainer.add(highlight)
      }

      // Color circle
      const circleG = this.add.graphics()
      circleG.fillStyle(unlocked ? hero.color : 0x555555, unlocked ? 0.85 : 0.4)
      circleG.fillCircle(px + 26, rowY + rowH / 2, 10)
      circleG.lineStyle(1.5, unlocked ? hero.color : 0x666666, 0.7)
      circleG.strokeCircle(px + 26, rowY + rowH / 2, 10)
      this.leftContainer.add(circleG)

      // Hero name
      const nameText = this.add.text(px + 42, rowY + rowH / 2 - 8, unlocked ? hero.name : '???', {
        fontFamily: 'monospace', fontSize: '12px',
        color: unlocked ? colorHex : '#888888',
      }).setOrigin(0, 0.5)
      this.leftContainer.add(nameText)

      // Role
      const roleText = this.add.text(px + 42, rowY + rowH / 2 + 8, unlocked ? hero.role : 'Unknown', {
        fontFamily: 'monospace', fontSize: '9px',
        color: '#665544',
      }).setOrigin(0, 0.5)
      this.leftContainer.add(roleText)

      // Lock indicator
      if (!unlocked) {
        const lockText = this.add.text(px + pw - 18, rowY + rowH / 2, '[?]', {
          fontFamily: 'monospace', fontSize: '10px', color: '#888888',
        }).setOrigin(1, 0.5)
        this.leftContainer.add(lockText)
      }

      // Row separator
      if (i < HERO_INFO.length - 1) {
        const sepG = this.add.graphics()
        sepG.lineStyle(0.5, 0x2a1810, 0.25)
        sepG.lineBetween(px + 14, rowY + rowH - 2, px + pw - 14, rowY + rowH - 2)
        this.leftContainer.add(sepG)
      }

      // Interactive zone (only for unlocked heroes)
      if (unlocked) {
        const zone = this.add.zone(px + pw / 2, rowY + rowH / 2, pw - 20, rowH - 6)
          .setInteractive({ useHandCursor: true })

        zone.on('pointerover', () => {
          if (this.selectedHeroType !== hero.type) nameText.setColor('#ffffff')
        })
        zone.on('pointerout', () => {
          if (this.selectedHeroType !== hero.type) nameText.setColor(colorHex)
        })
        zone.on('pointerdown', () => {
          this.selectedHeroType = hero.type
          this.rightPage = 0
          const { width: w, height: h } = this.scale
          const bookW = Math.min(w * 0.9, 900)
          const bookH = Math.min(h * 0.82, 620)
          const bookX = (w - bookW) / 2
          const bookY = (h - bookH) / 2
          const pageW = bookW / 2 - 8
          const leftPageX = bookX
          const rightPageX = bookX + bookW / 2 + 8
          this.buildLeftPage(leftPageX, bookY, pageW, bookH)
          this.buildRightPage(rightPageX, bookY, pageW, bookH)
        })

        this.leftContainer.add(zone)
      }
    })

    // Footer hint
    const hintText = this.add.text(px + pw / 2, py + ph - 14, 'Tap a hero to view skills', {
      fontFamily: 'monospace', fontSize: '8px', color: '#998866',
    }).setOrigin(0.5)
    this.leftContainer.add(hintText)
  }

  // ── Right page: skills or empty ───────────────────────────────────────────

  private buildRightPage(px: number, py: number, pw: number, ph: number) {
    this.rightContainer.removeAll(true)

    if (!this.selectedHeroType) {
      const emptyText = this.add.text(px + pw / 2, py + ph / 2, 'Select a hero\nto view their skills', {
        fontFamily: 'monospace', fontSize: '12px', color: '#998866',
        align: 'center',
      }).setOrigin(0.5)
      this.rightContainer.add(emptyText)
      return
    }

    if (this.rightPage === 0) {
      this.buildSkillsPage(px, py, pw, ph)
    } else {
      this.buildGenericsPage(px, py, pw, ph)
    }

    // Page nav arrows at bottom
    const heroInfo = HERO_INFO.find(h => h.type === this.selectedHeroType)
    const heroColorHex = heroInfo ? '#' + heroInfo.color.toString(16).padStart(6, '0') : '#d4b483'

    const navY = py + ph - 18
    const labels = ['Branch Skills', 'Generic Upgrades']

    labels.forEach((label, idx) => {
      const isActive = this.rightPage === idx
      const btnX = px + pw * 0.25 + idx * pw * 0.5
      const btn = this.add.text(btnX, navY, label, {
        fontFamily: 'monospace', fontSize: '9px',
        color: isActive ? heroColorHex : '#998866',
        stroke: '#c8a97a', strokeThickness: 0.5,
        backgroundColor: isActive ? 'rgba(42,24,16,0.2)' : undefined,
        padding: isActive ? { x: 4, y: 2 } : undefined,
      }).setOrigin(0.5).setInteractive({ useHandCursor: !isActive })

      if (!isActive) {
        btn.on('pointerover', () => btn.setColor('#2a1810'))
        btn.on('pointerout',  () => btn.setColor('#998866'))
        btn.on('pointerdown', () => {
          this.rightPage = idx
          const { width: w, height: h } = this.scale
          const bookW = Math.min(w * 0.9, 900)
          const bookH = Math.min(h * 0.82, 620)
          const bookX = (w - bookW) / 2
          const bookY2 = (h - bookH) / 2
          const pageW = bookW / 2 - 8
          const rightPageX = bookX + bookW / 2 + 8
          this.buildRightPage(rightPageX, bookY2, pageW, bookH)
        })
      }
      this.rightContainer.add(btn)
    })
  }

  // ── Branch skills page ────────────────────────────────────────────────────

  private buildSkillsPage(px: number, py: number, pw: number, ph: number) {
    const heroType = this.selectedHeroType!
    const heroInfo = HERO_INFO.find(h => h.type === heroType)!
    const heroColorHex = '#' + heroInfo.color.toString(16).padStart(6, '0')

    // Page title
    const titleText = this.add.text(px + pw / 2, py + 22, heroInfo.name + ' — Branches', {
      fontFamily: 'monospace', fontSize: '12px', color: '#2a1810',
    }).setOrigin(0.5)
    this.rightContainer.add(titleText)

    const titleLineG = this.add.graphics()
    titleLineG.lineStyle(1, 0x2a1810, 0.4)
    titleLineG.lineBetween(px + 6, py + 34, px + pw - 6, py + 34)
    this.rightContainer.add(titleLineG)

    const branches = HERO_BRANCHES[heroType] || []
    const contentH = ph - 60  // leave room for nav
    const branchH = contentH / Math.max(branches.length, 1)

    branches.forEach((branch, bi) => {
      const bY = py + 38 + bi * branchH
      const branchUnlocked = this.encData.branches.includes(branch.name)
      const branchColorHex = '#' + branch.color.toString(16).padStart(6, '0')

      // Branch name row
      const bNameText = this.add.text(px + 12, bY + 4, branchUnlocked ? branch.name : '??? Branch', {
        fontFamily: 'monospace', fontSize: '10px',
        color: branchUnlocked ? branchColorHex : '#888888',
      }).setOrigin(0, 0)
      this.rightContainer.add(bNameText)

      // Lock badge
      if (!branchUnlocked) {
        const lockBadge = this.add.text(px + pw - 12, bY + 4, '[?]', {
          fontFamily: 'monospace', fontSize: '9px', color: '#888888',
        }).setOrigin(1, 0)
        this.rightContainer.add(lockBadge)
      }

      // Branch separator line
      const bLineG = this.add.graphics()
      bLineG.lineStyle(0.5, branchUnlocked ? branch.color : 0x888888, 0.35)
      bLineG.lineBetween(px + 10, bY + 16, px + pw - 10, bY + 16)
      this.rightContainer.add(bLineG)

      // Upgrades
      const upgradeH = Math.min((branchH - 20) / branch.upgrades.length, 16)
      branch.upgrades.forEach((upgrade, ui) => {
        const uY = bY + 20 + ui * upgradeH
        const upgradeUnlocked = this.encData.upgrades.includes(upgrade.id)

        if (branchUnlocked && upgradeUnlocked) {
          const labelText = this.add.text(px + 16, uY, `· ${upgrade.label}`, {
            fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
          }).setOrigin(0, 0)
          this.rightContainer.add(labelText)

          const descText = this.add.text(px + pw - 10, uY, upgrade.desc, {
            fontFamily: 'monospace', fontSize: '8px', color: '#665544',
          }).setOrigin(1, 0)
          this.rightContainer.add(descText)
        } else if (branchUnlocked) {
          const lockedLabel = this.add.text(px + 16, uY, '· ???', {
            fontFamily: 'monospace', fontSize: '9px', color: '#aaaaaa',
          }).setOrigin(0, 0)
          this.rightContainer.add(lockedLabel)

          const lockedDesc = this.add.text(px + pw - 10, uY, '[?]', {
            fontFamily: 'monospace', fontSize: '8px', color: '#aaaaaa',
          }).setOrigin(1, 0)
          this.rightContainer.add(lockedDesc)
        } else {
          // Whole branch locked
          const lockedLabel = this.add.text(px + 16, uY, '· ???', {
            fontFamily: 'monospace', fontSize: '9px', color: '#cccccc',
          }).setOrigin(0, 0)
          this.rightContainer.add(lockedLabel)
        }
      })
    })

    // Suppress unused var warning
    void heroColorHex
  }

  // ── Generic upgrades page ─────────────────────────────────────────────────

  private buildGenericsPage(px: number, py: number, pw: number, ph: number) {
    const heroInfo = HERO_INFO.find(h => h.type === this.selectedHeroType)!

    // Page title
    const titleText = this.add.text(px + pw / 2, py + 22, heroInfo.name + ' — Generic Upgrades', {
      fontFamily: 'monospace', fontSize: '11px', color: '#2a1810',
    }).setOrigin(0.5)
    this.rightContainer.add(titleText)

    const titleLineG = this.add.graphics()
    titleLineG.lineStyle(1, 0x2a1810, 0.4)
    titleLineG.lineBetween(px + 6, py + 34, px + pw - 6, py + 34)
    this.rightContainer.add(titleLineG)

    const contentH = ph - 60
    const rowH = Math.min(contentH / GENERIC_POOL.length, 20)

    GENERIC_POOL.forEach((upgrade, i) => {
      const rowY = py + 40 + i * rowH
      const unlocked = this.encData.upgrades.includes(upgrade.id)

      if (unlocked) {
        const labelText = this.add.text(px + 14, rowY, `· ${upgrade.label}`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
        }).setOrigin(0, 0)
        this.rightContainer.add(labelText)

        const descText = this.add.text(px + pw - 10, rowY, upgrade.desc, {
          fontFamily: 'monospace', fontSize: '8px', color: '#665544',
        }).setOrigin(1, 0)
        this.rightContainer.add(descText)
      } else {
        const lockedLabel = this.add.text(px + 14, rowY, `· ???`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#aaaaaa',
        }).setOrigin(0, 0)
        this.rightContainer.add(lockedLabel)

        const lockedDesc = this.add.text(px + pw - 10, rowY, '[?]', {
          fontFamily: 'monospace', fontSize: '8px', color: '#aaaaaa',
        }).setOrigin(1, 0)
        this.rightContainer.add(lockedDesc)
      }

      // Row divider every 2 items
      if (i % 2 === 1 && i < GENERIC_POOL.length - 1) {
        const divG = this.add.graphics()
        divG.lineStyle(0.5, 0x2a1810, 0.15)
        divG.lineBetween(px + 10, rowY + rowH - 1, px + pw - 10, rowY + rowH - 1)
        this.rightContainer.add(divG)
      }
    })
  }
}
