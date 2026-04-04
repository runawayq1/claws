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
  lore: string
  playstyle: string
}

const HERO_INFO: HeroInfo[] = [
  { type: 'ignara', name: 'Ignara', role: 'Fire Mage', color: 0xe84118,
    lore: 'Born in the volcanic forges of Mount Kael, Ignara mastered flame before she could walk. Exiled for burning down the Academy of Elements, she now wanders the cursed lands, turning swarms to ash with a flick of her wrist.',
    playstyle: 'Ranged AoE caster. Fireballs explode on impact. Excels at clearing dense packs. Three paths: raw damage (Inferno), survivability (Fortress), or chaotic destruction (Havoc).',
  },
  { type: 'sifra', name: 'Sifra', role: 'Ice Mage', color: 0x82ccdd,
    lore: 'Sifra was once a scholar of the Frozen Spire, studying the boundary between ice and lightning. An experiment gone wrong fused both elements into her soul. She now channels frost and storm in equal measure.',
    playstyle: 'Dual-stance caster. Switch between Ice shards (piercing projectiles) and Lightning (continuous beam). Branches: Frost (crowd control), Shatter (split projectiles), Crystal (defense), or Lightning (chain damage).',
  },
  { type: 'amun', name: 'Amun', role: 'Guardian', color: 0xfff200,
    lore: 'The last king of a fallen desert kingdom, Amun carries the weight of his people on his shoulders. His divine armor channels the earth itself, creating shockwaves that flatten anything in his path.',
    playstyle: 'Melee tank with shockwave AoE. Slow but devastating. Three paths: Wrath (damage auras), Bastion (near-immortal defense), or Quake (crowd control and knockback).',
  },
  { type: 'nazar', name: 'Nazar', role: 'Samurai', color: 0xc23616,
    lore: 'A ronin who abandoned his clan after discovering their dark pact with the swarm. Nazar wields both blade and venom — his sword cuts through flesh, while his poisoned strikes rot enemies from within.',
    playstyle: 'Dual-stance melee. Sword stance for quick slashes and mobility. Venom stance for poison DoT and area denial. Branches: Blade (assassin), Venom (poison master), or Shadow (stealth and execution).',
  },
  { type: 'huntress', name: 'Lyra', role: 'Spear Thrower', color: 0x2ecc71,
    lore: 'Raised by the forest wardens of the Green Veil, Lyra learned to throw before she could speak. Her spears fly true across any distance, and in close quarters her blade work is equally deadly.',
    playstyle: 'Dual-stance fighter. Spear stance hurls piercing projectiles across the screen. Melee stance delivers fast combo strikes. Branches: Predator (crits and marks), Stalker (mobility and traps), or Warden (spear mastery and AoE).',
  },
]

// ============================================================
// EncyclopediaScene
// ============================================================

// Bookmark frame indices per hero (one frame per hero, left column of bookmarks.png)
const BOOKMARK_FRAMES: Record<string, number> = {
  sifra:    0,
  ignara:   2,
  amun:     4,
  nazar:    6,
  huntress: 8,
}

export class EncyclopediaScene extends Phaser.Scene {
  private selectedHeroType: string | null = null
  private encData!: EncyclopediaData

  // For page system on right page
  private rightPage = 0  // 0 = lore, 1 = branch skills, 2 = generic upgrades

  // Containers rebuilt on hero select / page flip
  private leftContainer!: Phaser.GameObjects.Container
  private rightContainer!: Phaser.GameObjects.Container

  // Bookmark sprite refs so we can update the active offset
  private bookmarkSprites: Phaser.GameObjects.Image[] = []

  constructor() {
    super({ key: 'EncyclopediaScene' })
  }

  preload() {
    this.load.image('book_page', 'assets/book/pages_apper.png')
    this.load.spritesheet('book_icons', 'assets/book/Icons.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('book_sells', 'assets/book/sells_full.png', { frameWidth: 24, frameHeight: 24 })
    this.load.spritesheet('book_bookmarks', 'assets/book/bookmarks.png', { frameWidth: 32, frameHeight: 28 })
    this.load.image('book_tileset', 'assets/book/info_tileset.png')
  }

  create() {
    this.encData = loadEncyclopedia()
    const { width, height } = this.scale

    // Full screen dark bg
    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0, 0)

    // Book dimensions
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
    leftPageBg.fillStyle(0xd4b483, 0.6)
    leftPageBg.fillRoundedRect(leftPageX + 10, bookY + 10, pageW - 14, bookH - 20, { tl: 6, tr: 0, bl: 6, br: 0 })

    // Right page parchment
    const rightPageBg = this.add.graphics()
    rightPageBg.fillStyle(0xc8a97a)
    rightPageBg.fillRoundedRect(rightPageX, bookY + 4, pageW, bookH - 8, { tl: 0, tr: 8, bl: 0, br: 8 })
    rightPageBg.fillStyle(0xd4b483, 0.6)
    rightPageBg.fillRoundedRect(rightPageX + 4, bookY + 10, pageW - 14, bookH - 20, { tl: 0, tr: 6, bl: 0, br: 6 })

    // Page texture overlays from pages_apper.png (4 variants, each 120×176)
    // Left page uses frame crop at x=0, right page at x=240 (lighter variant)
    if (this.textures.exists('book_page')) {
      const leftTex = this.add.image(leftPageX + 4, bookY + 4, 'book_page')
        .setOrigin(0, 0)
        .setCrop(0, 0, 120, 176)
        .setDisplaySize(pageW, bookH - 8)
        .setAlpha(0.15)
      leftTex.setTint(0xb8936a)

      const rightTex = this.add.image(rightPageX, bookY + 4, 'book_page')
        .setOrigin(0, 0)
        .setCrop(240, 0, 120, 176)
        .setDisplaySize(pageW, bookH - 8)
        .setAlpha(0.15)
      rightTex.setTint(0xc8a97a)
    }

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

    // Bookmark tabs on the left edge (drawn before containers so they're below content)
    this.bookmarkSprites = []
    if (this.textures.exists('book_bookmarks')) {
      const bRowH = Math.min((bookH - 60) / HERO_INFO.length, 68)
      const bStartY = bookY + 44
      HERO_INFO.forEach((hero, i) => {
        const frame = BOOKMARK_FRAMES[hero.type] ?? i * 2
        const bY = bStartY + i * bRowH + bRowH / 2
        const isActive = this.selectedHeroType === hero.type
        const bX = leftPageX - 4 + (isActive ? 10 : 0)
        const bm = this.add.image(bX, bY, 'book_bookmarks', frame)
          .setOrigin(1, 0.5)
          .setDepth(5)
          .setInteractive({ useHandCursor: true })
        this.bookmarkSprites.push(bm)

        bm.on('pointerdown', () => {
          this.selectedHeroType = hero.type
          this.rightPage = 0
          this._rebuild()
        })
      })
    }

    // Build containers
    this.leftContainer  = this.add.container(0, 0)
    this.rightContainer = this.add.container(0, 0)

    this.buildLeftPage(leftPageX, bookY, pageW, bookH)
    this.buildRightPage(rightPageX, bookY, pageW, bookH)
  }

  // Helper: recalculate layout constants and rebuild both pages
  private _rebuild() {
    const { width: w, height: h } = this.scale
    const bookW = Math.min(w * 0.9, 900)
    const bookH = Math.min(h * 0.82, 620)
    const bookX = (w - bookW) / 2
    const bookY = (h - bookH) / 2
    const pageW = bookW / 2 - 8
    const leftPageX = bookX
    const rightPageX = bookX + bookW / 2 + 8

    // Update bookmark active offsets
    const bRowH = Math.min((bookH - 60) / HERO_INFO.length, 68)
    const bStartY = bookY + 44
    HERO_INFO.forEach((hero, i) => {
      const bm = this.bookmarkSprites[i]
      if (!bm) return
      const isActive = this.selectedHeroType === hero.type
      const bY = bStartY + i * bRowH + bRowH / 2
      const bX = leftPageX - 4 + (isActive ? 10 : 0)
      bm.setPosition(bX, bY)
    })

    this.buildLeftPage(leftPageX, bookY, pageW, bookH)
    this.buildRightPage(rightPageX, bookY, pageW, bookH)
  }

  // ── Left page: hero list ──────────────────────────────────────────────────

  private buildLeftPage(px: number, py: number, pw: number, ph: number) {
    this.leftContainer.removeAll(true)

    const startY = py + 44
    const rowH = Math.min((ph - 60) / HERO_INFO.length, 68)

    HERO_INFO.forEach((hero, i) => {
      const played = this.encData.heroes.includes(hero.type)
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
      circleG.fillStyle(hero.color, 0.85)
      circleG.fillCircle(px + 26, rowY + rowH / 2, 10)
      circleG.lineStyle(1.5, hero.color, 0.7)
      circleG.strokeCircle(px + 26, rowY + rowH / 2, 10)
      this.leftContainer.add(circleG)

      // Hero name — always visible
      const nameText = this.add.text(px + 42, rowY + rowH / 2 - 8, hero.name, {
        fontFamily: 'monospace', fontSize: '12px',
        color: isSelected ? '#ffffff' : colorHex,
      }).setOrigin(0, 0.5)
      this.leftContainer.add(nameText)

      // Role
      this.leftContainer.add(this.add.text(px + 42, rowY + rowH / 2 + 8, hero.role, {
        fontFamily: 'monospace', fontSize: '9px', color: '#665544',
      }).setOrigin(0, 0.5))

      // "Played" checkmark
      if (played) {
        this.leftContainer.add(this.add.text(px + pw - 16, rowY + rowH / 2, '✓', {
          fontFamily: 'monospace', fontSize: '10px', color: '#44aa44',
        }).setOrigin(0.5))
      }

      // Row separator
      if (i < HERO_INFO.length - 1) {
        const sepG = this.add.graphics()
        sepG.lineStyle(0.5, 0x2a1810, 0.25)
        sepG.lineBetween(px + 14, rowY + rowH - 2, px + pw - 14, rowY + rowH - 2)
        this.leftContainer.add(sepG)
      }

      // Interactive zone — always clickable
      const zone = this.add.zone(px + pw / 2, rowY + rowH / 2, pw - 20, rowH - 6)
        .setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => { if (!isSelected) nameText.setColor('#ffffff') })
      zone.on('pointerout', () => { if (!isSelected) nameText.setColor(colorHex) })
      zone.on('pointerdown', () => {
        this.selectedHeroType = hero.type
        this.rightPage = 0
        this._rebuild()
      })
      this.leftContainer.add(zone)
    })

    // Footer: discover counter
    const allUpgradeIds = new Set<string>()
    HERO_INFO.forEach(h => {
      const branches = HERO_BRANCHES[h.type] || []
      branches.forEach(br => br.upgrades.forEach(u => allUpgradeIds.add(u.id)))
    })
    GENERIC_POOL.forEach(u => allUpgradeIds.add(u.id))
    const totalSkills = allUpgradeIds.size
    const discoveredSkills = this.encData.upgrades.filter(id => allUpgradeIds.has(id)).length
    this.leftContainer.add(this.add.text(px + pw / 2, py + ph - 22,
      `Discovered: ${discoveredSkills}/${totalSkills}`, {
        fontFamily: 'monospace', fontSize: '9px', color: '#665544',
      }).setOrigin(0.5))
    this.leftContainer.add(this.add.text(px + pw / 2, py + ph - 10,
      'Tap a hero to read about them', {
        fontFamily: 'monospace', fontSize: '8px', color: '#998866',
      }).setOrigin(0.5))
  }

  // ── Right page: skills or empty ───────────────────────────────────────────

  private buildRightPage(px: number, py: number, pw: number, ph: number) {
    this.rightContainer.removeAll(true)

    if (!this.selectedHeroType) {
      this.rightContainer.add(this.add.text(px + pw / 2, py + ph / 2,
        'Select a hero\nto read about them', {
          fontFamily: 'monospace', fontSize: '12px', color: '#998866', align: 'center',
        }).setOrigin(0.5))
      return
    }

    if (this.rightPage === 0) {
      this.buildLorePage(px, py, pw, ph)
    } else if (this.rightPage === 1) {
      this.buildSkillsPage(px, py, pw, ph)
    } else {
      this.buildGenericsPage(px, py, pw, ph)
    }

    // Page nav tabs at bottom
    const heroInfo = HERO_INFO.find(h => h.type === this.selectedHeroType)
    const heroColorHex = heroInfo ? '#' + heroInfo.color.toString(16).padStart(6, '0') : '#d4b483'
    const navY = py + ph - 18
    const labels = ['Lore', 'Branches', 'Generics']

    labels.forEach((label, idx) => {
      const isActive = this.rightPage === idx
      const btnX = px + pw * ((idx + 0.5) / labels.length)
      const btn = this.add.text(btnX, navY, label, {
        fontFamily: 'monospace', fontSize: '9px',
        color: isActive ? heroColorHex : '#998866',
        stroke: '#c8a97a', strokeThickness: 0.5,
        backgroundColor: isActive ? 'rgba(42,24,16,0.2)' : undefined,
        padding: isActive ? { x: 4, y: 2 } : undefined,
      }).setOrigin(0.5).setInteractive({ useHandCursor: !isActive })

      if (!isActive) {
        btn.on('pointerover', () => btn.setColor('#2a1810'))
        btn.on('pointerout', () => btn.setColor('#998866'))
        btn.on('pointerdown', () => {
          this.rightPage = idx
          this._rebuild()
        })
      }
      this.rightContainer.add(btn)
    })

    // Separator above nav
    const navLineG = this.add.graphics()
    navLineG.lineStyle(0.5, 0x2a1810, 0.2)
    navLineG.lineBetween(px + 10, py + ph - 28, px + pw - 10, py + ph - 28)
    this.rightContainer.add(navLineG)
  }

  // ── Lore page ─────────────────────────────────────────────────────────────

  private buildLorePage(px: number, py: number, pw: number, _ph: number) {
    const heroType = this.selectedHeroType!
    const hero = HERO_INFO.find(h => h.type === heroType)!
    const colorHex = '#' + hero.color.toString(16).padStart(6, '0')

    // Hero name + role
    this.rightContainer.add(this.add.text(px + pw / 2, py + 20, hero.name, {
      fontFamily: 'monospace', fontSize: '16px', color: colorHex,
    }).setOrigin(0.5))
    this.rightContainer.add(this.add.text(px + pw / 2, py + 38, hero.role, {
      fontFamily: 'monospace', fontSize: '10px', color: '#665544',
    }).setOrigin(0.5))

    // Decorative line
    const lineG = this.add.graphics()
    lineG.lineStyle(1, hero.color, 0.3)
    lineG.lineBetween(px + 20, py + 50, px + pw - 20, py + 50)
    this.rightContainer.add(lineG)

    // Lore text — wrapped
    const textW = pw - 30
    this.rightContainer.add(this.add.text(px + 15, py + 58, hero.lore, {
      fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
      wordWrap: { width: textW }, lineSpacing: 4,
    }))

    // Playstyle section
    const playstyleY = py + 58 + 80
    const lineG2 = this.add.graphics()
    lineG2.lineStyle(0.5, 0x2a1810, 0.25)
    lineG2.lineBetween(px + 20, playstyleY, px + pw - 20, playstyleY)
    this.rightContainer.add(lineG2)

    this.rightContainer.add(this.add.text(px + 15, playstyleY + 6, 'PLAYSTYLE', {
      fontFamily: 'monospace', fontSize: '10px', color: colorHex,
    }))
    this.rightContainer.add(this.add.text(px + 15, playstyleY + 22, hero.playstyle, {
      fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
      wordWrap: { width: textW }, lineSpacing: 4,
    }))

    // Branch overview — always visible
    const branches = HERO_BRANCHES[heroType] || []
    const branchStartY = playstyleY + 22 + 70
    const lineG3 = this.add.graphics()
    lineG3.lineStyle(0.5, 0x2a1810, 0.25)
    lineG3.lineBetween(px + 20, branchStartY, px + pw - 20, branchStartY)
    this.rightContainer.add(lineG3)

    this.rightContainer.add(this.add.text(px + 15, branchStartY + 6, 'BRANCHES', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a1810',
    }))

    branches.forEach((branch, i) => {
      const bY = branchStartY + 22 + i * 20
      const bColorHex = '#' + branch.color.toString(16).padStart(6, '0')
      // Branch name + first upgrade desc as preview
      this.rightContainer.add(this.add.text(px + 15, bY, `◆ ${branch.name}`, {
        fontFamily: 'monospace', fontSize: '9px', color: bColorHex,
      }))
      this.rightContainer.add(this.add.text(px + pw - 10, bY, branch.upgrades[0].desc, {
        fontFamily: 'monospace', fontSize: '8px', color: '#665544',
      }).setOrigin(1, 0))
    })
  }

  // ── Branch skills page ────────────────────────────────────────────────────

  private buildSkillsPage(px: number, py: number, pw: number, ph: number) {
    const heroType = this.selectedHeroType!
    const heroInfo = HERO_INFO.find(h => h.type === heroType)!

    // Page title (centered, slightly larger)
    const titleText = this.add.text(px + pw / 2, py + 22, heroInfo.name + ' — Branches', {
      fontFamily: 'monospace', fontSize: '13px', color: '#2a1810',
    }).setOrigin(0.5)
    this.rightContainer.add(titleText)

    const titleLineG = this.add.graphics()
    titleLineG.lineStyle(1, 0x2a1810, 0.4)
    titleLineG.lineBetween(px + 6, py + 34, px + pw - 6, py + 34)
    this.rightContainer.add(titleLineG)

    const branches = HERO_BRANCHES[heroType] || []
    const contentH = ph - 62  // leave room for nav
    const branchH = contentH / Math.max(branches.length, 1)

    // Determine icon category base for this hero
    const iconBaseMap: Record<string, number> = {
      ignara: 0, sifra: 27, amun: 18, nazar: 18, huntress: 9,
    }
    const iconBase = iconBaseMap[heroType] ?? 0

    branches.forEach((branch, bi) => {
      const bY = py + 38 + bi * branchH
      const branchColorHex = '#' + branch.color.toString(16).padStart(6, '0')

      // Branch header — always visible with real name and color
      const bHeaderG = this.add.graphics()
      bHeaderG.lineStyle(0.5, branch.color, 0.35)
      bHeaderG.lineBetween(px + 10, bY + 16, px + pw - 10, bY + 16)
      this.rightContainer.add(bHeaderG)

      this.rightContainer.add(this.add.text(px + 12, bY + 4, branch.name, {
        fontFamily: 'monospace', fontSize: '10px', color: branchColorHex,
      }))

      // Upgrades — names always shown, desc locked until discovered
      const upgradeH = Math.min((branchH - 20) / branch.upgrades.length, 16)
      branch.upgrades.forEach((upgrade, ui) => {
        const uY = bY + 20 + ui * upgradeH
        const upgradeUnlocked = this.encData.upgrades.includes(upgrade.id)
        const iconFrame = (iconBase + bi * 9 + ui) % 90

        // Skill name always visible
        this.rightContainer.add(this.add.text(px + 22, uY, `· ${upgrade.label}`, {
          fontFamily: 'monospace', fontSize: '9px',
          color: upgradeUnlocked ? '#2a1810' : '#999988',
        }))

        if (upgradeUnlocked) {
          // Icon + description
          if (this.textures.exists('book_icons')) {
            this.rightContainer.add(this.add.image(px + 14, uY + upgradeH / 2, 'book_icons', iconFrame)
              .setDisplaySize(12, 12).setOrigin(0.5))
          }
          this.rightContainer.add(this.add.text(px + pw - 10, uY, upgrade.desc, {
            fontFamily: 'monospace', fontSize: '8px', color: '#665544',
          }).setOrigin(1, 0))
        } else {
          // Locked slot + ???
          if (this.textures.exists('book_sells')) {
            this.rightContainer.add(this.add.image(px + 14, uY + upgradeH / 2, 'book_sells', 0)
              .setDisplaySize(12, 12).setTint(0x555555).setAlpha(0.6).setOrigin(0.5))
          }
          this.rightContainer.add(this.add.text(px + pw - 10, uY, '???', {
            fontFamily: 'monospace', fontSize: '8px', color: '#aaaaaa',
          }).setOrigin(1, 0))
        }
      })

      // Section divider between branches
      if (bi < branches.length - 1) {
        const divG = this.add.graphics()
        divG.lineStyle(0.5, 0x2a1810, 0.12)
        divG.lineBetween(px + 14, bY + branchH - 2, px + pw - 14, bY + branchH - 2)
        this.rightContainer.add(divG)
      }
    })
  }

  // ── Generic upgrades page ─────────────────────────────────────────────────

  private buildGenericsPage(px: number, py: number, pw: number, ph: number) {
    const heroInfo = HERO_INFO.find(h => h.type === this.selectedHeroType)!

    // Page title (centered, slightly larger)
    const titleText = this.add.text(px + pw / 2, py + 22, heroInfo.name + ' — Generic Upgrades', {
      fontFamily: 'monospace', fontSize: '11px', color: '#2a1810',
    }).setOrigin(0.5)
    this.rightContainer.add(titleText)

    const titleLineG = this.add.graphics()
    titleLineG.lineStyle(1, 0x2a1810, 0.4)
    titleLineG.lineBetween(px + 6, py + 34, px + pw - 6, py + 34)
    this.rightContainer.add(titleLineG)

    const contentH = ph - 62
    const rowH = Math.min(contentH / GENERIC_POOL.length, 20)

    GENERIC_POOL.forEach((upgrade, i) => {
      const rowY = py + 40 + i * rowH
      const unlocked = this.encData.upgrades.includes(upgrade.id)
      const iconFrame = (54 + i) % 90  // generic icons from row 6+

      if (unlocked) {
        // Skill icon
        if (this.textures.exists('book_icons')) {
          const icon = this.add.image(px + 14, rowY + rowH / 2, 'book_icons', iconFrame)
            .setDisplaySize(12, 12)
            .setOrigin(0.5)
          this.rightContainer.add(icon)
        }

        const labelText = this.add.text(px + 22, rowY, `· ${upgrade.label}`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
        }).setOrigin(0, 0)
        this.rightContainer.add(labelText)

        const descText = this.add.text(px + pw - 10, rowY, upgrade.desc, {
          fontFamily: 'monospace', fontSize: '8px', color: '#665544',
        }).setOrigin(1, 0)
        this.rightContainer.add(descText)
      } else {
        if (this.textures.exists('book_sells')) {
          const slot = this.add.image(px + 14, rowY + rowH / 2, 'book_sells', 0)
            .setDisplaySize(12, 12)
            .setTint(0x555555)
            .setAlpha(0.6)
            .setOrigin(0.5)
          this.rightContainer.add(slot)
        }

        const lockedLabel = this.add.text(px + 22, rowY, `· ???`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#aaaaaa',
        }).setOrigin(0, 0)
        this.rightContainer.add(lockedLabel)

        if (this.textures.exists('book_sells')) {
          const descSlot = this.add.image(px + pw - 18, rowY + rowH / 2, 'book_sells', 0)
            .setDisplaySize(14, 14)
            .setTint(0x555555)
            .setAlpha(0.5)
            .setOrigin(0.5)
          this.rightContainer.add(descSlot)
          const descLockTxt = this.add.text(px + pw - 18, rowY + rowH / 2, '???', {
            fontFamily: 'monospace', fontSize: '7px', color: '#aaaaaa',
          }).setOrigin(0.5)
          this.rightContainer.add(descLockTxt)
        } else {
          const lockedDesc = this.add.text(px + pw - 10, rowY, '[?]', {
            fontFamily: 'monospace', fontSize: '8px', color: '#aaaaaa',
          }).setOrigin(1, 0)
          this.rightContainer.add(lockedDesc)
        }
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
