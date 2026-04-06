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
  // Always return all heroes, upgrades, and branches as unlocked so the
  // encyclopedia is fully browsable regardless of save state.
  const allHeroes = ['ignara', 'sifra', 'amun', 'nazar', 'huntress', 'khashin', 'muller']
  const allUpgrades: string[] = []
  const allBranches: string[] = []
  for (const [, branches] of Object.entries(HERO_BRANCHES)) {
    for (const branch of branches) {
      allBranches.push(branch.name)
      for (const upgrade of branch.upgrades) allUpgrades.push(upgrade.id)
    }
  }
  for (const upgrade of GENERIC_POOL) allUpgrades.push(upgrade.id)

  // Merge with any existing save data so earned progress is preserved too.
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const savedHeroes:   string[] = Array.isArray(parsed.heroes)   ? parsed.heroes   : []
      const savedUpgrades: string[] = Array.isArray(parsed.upgrades) ? parsed.upgrades : []
      const savedBranches: string[] = Array.isArray(parsed.branches) ? parsed.branches : []
      return {
        heroes:   [...new Set([...allHeroes,   ...savedHeroes])],
        upgrades: [...new Set([...allUpgrades, ...savedUpgrades])],
        branches: [...new Set([...allBranches, ...savedBranches])],
      }
    }
  } catch (_) { /* ignore */ }
  return { heroes: allHeroes, upgrades: allUpgrades, branches: allBranches }
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
  { type: 'khashin', name: 'Khashin', role: 'Sand Assassin', color: 0xf39c12,
    lore: 'Khashin has no origin that the desert remembers. The nomads who cross the Kharan Wastes speak of a figure glimpsed at dusk — walking against the wind when there is no wind, leaving no footprints in the sand. Some say he was a court sorcerer who bound the spirit of a dying sandstorm into his own body to survive a betrayal. Others say he is the storm, and the man-shape is simply the eye of it.',
    playstyle: 'Khashin rewards players who treat survival as a geometry problem. His exceptional base speed and auto-dash tools mean he is rarely where the horde expects him to be — but low HP punishes anyone who stands still. Toggle between Sirocco (cutting wind arcs) and Haboob (blinding sand) with Q.',
  },
  { type: 'muller', name: 'Givi', role: 'Crystal Gnome', color: 0x9b59b6,
    lore: 'Givi was born three levels below the surface, in a mining settlement so deep that sunlight was a rumor. She spent her first forty years cracking open rock faces with a hammer twice her height, and it was during a routine deep-bore operation that she broke through into a vein of living crystal — formations that pulsed with warmth, that grew toward her lantern.',
    playstyle: 'Givi does not cast spells — she reads the ground. Her hammer drives crystal shards erupting from the earth in a chain toward enemies. With Tectonic Fury, every 5th slam detonates a ring of massive crystals outward from a dark impact core. Upgrades leave crystal mines, walls, and pillars across the battlefield.',
  },
]

// ============================================================
// book_content.png — crop regions for hero element medallions
// Each entry is [cropX, cropY, cropW, cropH] within the 336x448 image
// ============================================================
const HERO_MEDALLION: Record<string, [number, number, number, number]> = {
  ignara:   [14,  13,  91, 101],  // fire medallion (orange)
  sifra:    [66,  13, 120, 101],  // water/ice medallion (blue)
  amun:     [146, 13, 120, 101],  // earth medallion (warm brown)
  nazar:    [226, 13,  93, 100],  // dark element (navy blue)
  huntress: [14, 136,  91, 121],  // nature/leaf art (green)
}

// ============================================================
// Hero sprite definitions for animated portraits
// ============================================================
const HERO_SPRITE_DEFS: Record<string, { asset: string; fw: number; fh: number; scale: number; frames: number; yOff?: number }> = {
  ignara:   { asset: 'assets/ignara/Idle.png',     fw: 150, fh: 150, scale: 1.1,   frames: 8 },
  sifra:    { asset: 'assets/sifra/Idle.png',          fw: 231, fh: 190, scale: 0.65,  frames: 6 },
  amun:     { asset: 'assets/amun/Idle.png',            fw: 160, fh: 111, scale: 1.3,   frames: 8, yOff: -30 },
  nazar:    { asset: 'assets/nazar/Idle.png',    fw: 200, fh: 200, scale: 1.0,   frames: 8, yOff: 8 },
  huntress: { asset: 'assets/lyra/Idle.png',        fw: 150, fh: 150, scale: 1.265, frames: 8 },
}

// ============================================================
// Icon frame helpers
// ============================================================

// Per-hero icon base frames for the branch overview and skills pages.
// For most heroes the formula is: iconBase + branchIdx * 9 + skillIdx
// Amun's branches are packed 5-apart (not 9), so we use explicit per-branch bases.
const HERO_ICON_BASE: Record<string, number> = {
  ignara: 0, sifra: 27, nazar: 18, huntress: 9,
  // khashin/muller branches start at 70/85 but use the generic formula too
  khashin: 70, muller: 85,
}

// For heroes with non-uniform branch spacing, list each branch's icon base explicitly.
const HERO_BRANCH_ICON_BASES: Record<string, number[]> = {
  amun: [55, 60, 65], // Wrath(55-59), Bastion(60-64), Quake(65-69)
}

/** Return the icon frame for a given hero's branch + skill. */
function branchIconFrame(heroType: string, branchIdx: number, skillIdx: number): number {
  const perBranch = HERO_BRANCH_ICON_BASES[heroType]
  if (perBranch) {
    const base = perBranch[branchIdx] ?? 0
    return base + skillIdx
  }
  const base = HERO_ICON_BASE[heroType] ?? 0
  return (base + branchIdx * 9 + skillIdx) % 90
}

// ============================================================
// EncyclopediaScene
// ============================================================

// Bookmark frame indices per hero:
// bookmarks.png is 2 cols x 5 rows (32x28 per frame).
// Left column = inactive frame, right column = active frame.
// Frame numbering (Phaser row-major): 0=sifra-inactive, 1=sifra-active, 2=ignara-inactive...
const BOOKMARK_FRAMES: Record<string, { inactive: number; active: number }> = {
  sifra:    { inactive: 0, active: 1 },
  ignara:   { inactive: 2, active: 3 },
  amun:     { inactive: 4, active: 5 },
  nazar:    { inactive: 6, active: 7 },
  huntress: { inactive: 8, active: 9 },
}

export class EncyclopediaScene extends Phaser.Scene {
  private selectedHeroType: string | null = null
  private encData!: EncyclopediaData

  // For page system on right page
  private rightPage = 0  // 0 = lore, 1 = branch skills, 2 = generic upgrades

  // Containers rebuilt on hero select / page flip
  private leftContainer!: Phaser.GameObjects.Container
  private rightContainer!: Phaser.GameObjects.Container

  // Bookmark sprite refs so we can update the active offset and frame
  private bookmarkSprites: Phaser.GameObjects.Image[] = []

  // Main content container (hidden during open/close animation)
  private bookContent!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'EncyclopediaScene' })
  }

  preload() {
    this.load.image('book_page',     'assets/book/pages_apper.png')
    this.load.image('book_tileset',  'assets/book/info_tileset.png')
    this.load.image('book_content',  'assets/book/book_content.png')
    this.load.spritesheet('book_icons',     'assets/book/Icons.png',      { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('book_sells',     'assets/book/sells_full.png', { frameWidth: 32, frameHeight: 24 })
    this.load.spritesheet('book_bookmarks', 'assets/book/bookmarks.png',  { frameWidth: 32, frameHeight: 28 })

    // Hero idle spritesheets — reuse StartScene texture keys (already loaded)
    for (const [, def] of Object.entries(HERO_SPRITE_DEFS)) {
      const texKey = def.asset.replace(/[^a-z0-9]/gi, '_')
      if (!this.textures.exists(texKey)) {
        this.load.spritesheet(texKey, def.asset, { frameWidth: def.fw, frameHeight: def.fh })
      }
    }
  }

  create() {
    // Create idle animations for hero portraits (reuse StartScene texture keys)
    for (const [type, def] of Object.entries(HERO_SPRITE_DEFS)) {
      const animKey = `enc_idle_${type}`
      const texKey = def.asset.replace(/[^a-z0-9]/gi, '_')
      if (!this.anims.exists(animKey) && this.textures.exists(texKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: def.frames - 1 }),
          frameRate: 8,
          repeat: -1,
        })
      }
    }

    this.encData = loadEncyclopedia()
    const { width, height } = this.scale

    // Full screen dark bg
    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0, 0)

    this.bookContent = this.add.container(0, 0)

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
    this.bookContent.add(shadow)

    // Book background (spine area)
    const bookBg = this.add.graphics()
    bookBg.fillStyle(0x2a1810)
    bookBg.fillRoundedRect(bookX, bookY, bookW, bookH, 10)
    bookBg.fillStyle(0x1a0f08)
    bookBg.fillRect(bookX + bookW / 2 - 6, bookY + 4, 12, bookH - 8)
    this.bookContent.add(bookBg)

    // Spine decorations — gold accent lines and dot pattern on the binding
    const spineDecG = this.add.graphics()
    const spX = bookX + bookW / 2 - 6
    const spW = 12
    // Gold outer edge lines on spine
    spineDecG.lineStyle(1, 0xc9a227, 0.55)
    spineDecG.lineBetween(spX + 1, bookY + 4, spX + 1, bookY + bookH - 4)
    spineDecG.lineBetween(spX + spW - 1, bookY + 4, spX + spW - 1, bookY + bookH - 4)
    // Horizontal accent bands near top and bottom
    spineDecG.lineStyle(1, 0xc9a227, 0.45)
    spineDecG.lineBetween(spX, bookY + 18, spX + spW, bookY + 18)
    spineDecG.lineBetween(spX, bookY + 22, spX + spW, bookY + 22)
    spineDecG.lineBetween(spX, bookY + bookH - 18, spX + spW, bookY + bookH - 18)
    spineDecG.lineBetween(spX, bookY + bookH - 22, spX + spW, bookY + bookH - 22)
    // Dot pattern down the center of the spine
    spineDecG.fillStyle(0xc9a227, 0.4)
    const spCenterX = spX + spW / 2
    const dotSpacing = 18
    const dotsStart = bookY + 32
    const dotsEnd   = bookY + bookH - 32
    for (let dy = dotsStart; dy < dotsEnd; dy += dotSpacing) {
      spineDecG.fillCircle(spCenterX, dy, 1.5)
    }
    // Central diamond ornament on spine
    spineDecG.fillStyle(0xc9a227, 0.5)
    const midY = bookY + bookH / 2
    spineDecG.fillTriangle(spCenterX, midY - 5, spCenterX - 3, midY, spCenterX, midY + 5)
    spineDecG.fillTriangle(spCenterX, midY - 5, spCenterX + 3, midY, spCenterX, midY + 5)
    this.bookContent.add(spineDecG)

    // Left page parchment
    const leftPageBg = this.add.graphics()
    leftPageBg.fillStyle(0xc8a97a)
    leftPageBg.fillRoundedRect(leftPageX + 4, bookY + 4, pageW, bookH - 8, { tl: 8, tr: 0, bl: 8, br: 0 })
    leftPageBg.fillStyle(0xd4b483, 0.6)
    leftPageBg.fillRoundedRect(leftPageX + 10, bookY + 10, pageW - 14, bookH - 20, { tl: 6, tr: 0, bl: 6, br: 0 })
    this.bookContent.add(leftPageBg)

    // Right page parchment
    const rightPageBg = this.add.graphics()
    rightPageBg.fillStyle(0xc8a97a)
    rightPageBg.fillRoundedRect(rightPageX, bookY + 4, pageW, bookH - 8, { tl: 0, tr: 8, bl: 0, br: 8 })
    rightPageBg.fillStyle(0xd4b483, 0.6)
    rightPageBg.fillRoundedRect(rightPageX + 4, bookY + 10, pageW - 14, bookH - 20, { tl: 0, tr: 6, bl: 0, br: 6 })
    this.bookContent.add(rightPageBg)

    // Page-stack edge lines on left page outer edge (gives depth like stacked pages)
    const leftEdgeG = this.add.graphics()
    leftEdgeG.lineStyle(1, 0xa07040, 0.35)
    leftEdgeG.lineBetween(leftPageX + 2, bookY + 10, leftPageX + 2, bookY + bookH - 10)
    leftEdgeG.lineStyle(1, 0x8a5e30, 0.22)
    leftEdgeG.lineBetween(leftPageX + 1, bookY + 12, leftPageX + 1, bookY + bookH - 12)
    leftEdgeG.lineStyle(1, 0xd4b483, 0.18)
    leftEdgeG.lineBetween(leftPageX + 3, bookY + 8, leftPageX + 3, bookY + bookH - 8)
    this.bookContent.add(leftEdgeG)

    // Page-stack edge lines on right page outer edge
    const rightEdgeG = this.add.graphics()
    const reX = rightPageX + pageW
    rightEdgeG.lineStyle(1, 0xa07040, 0.35)
    rightEdgeG.lineBetween(reX - 2, bookY + 10, reX - 2, bookY + bookH - 10)
    rightEdgeG.lineStyle(1, 0x8a5e30, 0.22)
    rightEdgeG.lineBetween(reX - 1, bookY + 12, reX - 1, bookY + bookH - 12)
    rightEdgeG.lineStyle(1, 0xd4b483, 0.18)
    rightEdgeG.lineBetween(reX - 3, bookY + 8, reX - 3, bookY + bookH - 8)
    this.bookContent.add(rightEdgeG)

    // Inner shadow on left page (near spine edge) — depth where pages meet binding
    const leftSpineShadow = this.add.graphics()
    const lsX = leftPageX + pageW - 12
    leftSpineShadow.fillStyle(0x000000, 0.22)
    leftSpineShadow.fillRect(lsX, bookY + 4, 12, bookH - 8)
    leftSpineShadow.fillStyle(0x000000, 0.10)
    leftSpineShadow.fillRect(lsX - 6, bookY + 4, 6, bookH - 8)
    this.bookContent.add(leftSpineShadow)

    // Inner shadow on right page (near spine edge)
    const rightSpineShadow = this.add.graphics()
    rightSpineShadow.fillStyle(0x000000, 0.22)
    rightSpineShadow.fillRect(rightPageX, bookY + 4, 12, bookH - 8)
    rightSpineShadow.fillStyle(0x000000, 0.10)
    rightSpineShadow.fillRect(rightPageX + 12, bookY + 4, 6, bookH - 8)
    this.bookContent.add(rightSpineShadow)

    // Thin ornate border lines along page edges (inside the page, inset from corners)
    const leftBorderG = this.add.graphics()
    leftBorderG.lineStyle(1, 0x8b6914, 0.28)
    leftBorderG.strokeRoundedRect(leftPageX + 10, bookY + 10, pageW - 14, bookH - 20, { tl: 6, tr: 0, bl: 6, br: 0 })
    this.bookContent.add(leftBorderG)

    const rightBorderG = this.add.graphics()
    rightBorderG.lineStyle(1, 0x8b6914, 0.28)
    rightBorderG.strokeRoundedRect(rightPageX + 4, bookY + 10, pageW - 14, bookH - 20, { tl: 0, tr: 6, bl: 0, br: 6 })
    this.bookContent.add(rightBorderG)

    // Page texture overlays (pages_apper.png: 4 texture variants, each ~120x176 in a 480x176 strip)
    if (this.textures.exists('book_page')) {
      const leftTex = this.add.image(leftPageX + 4, bookY + 4, 'book_page')
        .setOrigin(0, 0).setCrop(0, 0, 120, 176).setDisplaySize(pageW, bookH - 8).setAlpha(0.18).setTint(0xb8936a)
      this.bookContent.add(leftTex)

      const rightTex = this.add.image(rightPageX, bookY + 4, 'book_page')
        .setOrigin(0, 0).setCrop(240, 0, 120, 176).setDisplaySize(pageW, bookH - 8).setAlpha(0.18).setTint(0xc8a97a)
      this.bookContent.add(rightTex)
    }

    // Decorative corner ornaments from info_tileset.png
    // Top section of tileset (y=0-39): left corner at x=9-39 (31px), right corner at x=89-121 (33px)
    // We render them as small tinted images at page corners
    this._addPageCorners(leftPageX + 4, bookY + 4, pageW, bookH - 8, false)
    this._addPageCorners(rightPageX, bookY + 4, pageW, bookH - 8, true)

    // Left page title
    const heroesTitle = this.add.text(leftPageX + pageW / 2, bookY + 22, 'HEROES', {
      fontFamily: 'monospace', fontSize: '14px',
      color: '#2a1810', stroke: '#c8a97a', strokeThickness: 1,
    }).setOrigin(0.5)
    this.bookContent.add(heroesTitle)

    // Title flourish — decorative dashes and dots on either side of "HEROES"
    const titleFlourishG = this.add.graphics()
    const titleCX = leftPageX + pageW / 2
    const titleY = bookY + 22
    // Left flourish: line + dot + line
    titleFlourishG.lineStyle(1, 0x8b6914, 0.55)
    titleFlourishG.lineBetween(titleCX - 58, titleY, titleCX - 48, titleY)
    titleFlourishG.fillStyle(0x8b6914, 0.55)
    titleFlourishG.fillCircle(titleCX - 44, titleY, 2)
    titleFlourishG.lineBetween(titleCX - 40, titleY, titleCX - 34, titleY)
    // Right flourish (mirrored)
    titleFlourishG.lineStyle(1, 0x8b6914, 0.55)
    titleFlourishG.lineBetween(titleCX + 58, titleY, titleCX + 48, titleY)
    titleFlourishG.fillStyle(0x8b6914, 0.55)
    titleFlourishG.fillCircle(titleCX + 44, titleY, 2)
    titleFlourishG.lineBetween(titleCX + 40, titleY, titleCX + 34, titleY)
    this.bookContent.add(titleFlourishG)

    // Decorative title underline — double line with gap
    const titleLine = this.add.graphics()
    titleLine.lineStyle(1.5, 0x8b6914, 0.5)
    titleLine.lineBetween(leftPageX + 18, bookY + 33, leftPageX + pageW - 12, bookY + 33)
    titleLine.lineStyle(0.5, 0x8b6914, 0.3)
    titleLine.lineBetween(leftPageX + 22, bookY + 36, leftPageX + pageW - 16, bookY + 36)
    this.bookContent.add(titleLine)

    // Footer decoration — small ornamental line + center dot at page bottoms
    const footerDecG = this.add.graphics()
    const footY = bookY + bookH - 10
    // Left page footer
    const lfCX = leftPageX + pageW / 2
    footerDecG.lineStyle(1, 0x8b6914, 0.35)
    footerDecG.lineBetween(lfCX - 30, footY, lfCX - 6, footY)
    footerDecG.lineBetween(lfCX + 6, footY, lfCX + 30, footY)
    footerDecG.fillStyle(0x8b6914, 0.45)
    footerDecG.fillCircle(lfCX, footY, 2.5)
    footerDecG.fillCircle(lfCX - 3, footY, 1)
    footerDecG.fillCircle(lfCX + 3, footY, 1)
    // Right page footer
    const rfCX = rightPageX + pageW / 2
    footerDecG.lineStyle(1, 0x8b6914, 0.35)
    footerDecG.lineBetween(rfCX - 30, footY, rfCX - 6, footY)
    footerDecG.lineBetween(rfCX + 6, footY, rfCX + 30, footY)
    footerDecG.fillStyle(0x8b6914, 0.45)
    footerDecG.fillCircle(rfCX, footY, 2.5)
    footerDecG.fillCircle(rfCX - 3, footY, 1)
    footerDecG.fillCircle(rfCX + 3, footY, 1)
    this.bookContent.add(footerDecG)

    // Close button — plays closing animation then goes to StartScene
    const closeBtn = this.add.text(bookX + bookW - 6, bookY - 2, 'X', {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#d4b483', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#2a1810', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10)
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'))
    closeBtn.on('pointerout',  () => closeBtn.setColor('#d4b483'))
    closeBtn.on('pointerdown', () => this.scene.start('StartScene'))

    // Bookmark tabs on left edge — use active/inactive frames
    this.bookmarkSprites = []
    if (this.textures.exists('book_bookmarks')) {
      const bRowH = Math.min((bookH - 60) / HERO_INFO.length, 68)
      const bStartY = bookY + 44
      HERO_INFO.forEach((hero, i) => {
        const frames = BOOKMARK_FRAMES[hero.type] ?? { inactive: i * 2, active: i * 2 + 1 }
        const isActive = this.selectedHeroType === hero.type
        const frame = isActive ? frames.active : frames.inactive
        const bY = bStartY + i * bRowH + bRowH / 2
        const bX = leftPageX - 4 + (isActive ? 10 : 0)
        const bm = this.add.image(bX, bY, 'book_bookmarks', frame)
          .setOrigin(1, 0.5)
          .setDepth(5)
          .setInteractive({ useHandCursor: true })
        this.bookmarkSprites.push(bm)
        this.bookContent.add(bm)

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
    this.bookContent.add(this.leftContainer)
    this.bookContent.add(this.rightContainer)

    this.buildLeftPage(leftPageX, bookY, pageW, bookH)
    this.buildRightPage(rightPageX, bookY, pageW, bookH)
  }

  // Draw corner ornaments using info_tileset.png
  // The tileset has two small square corner pieces at top (y=0-39):
  //   Left corner: x=9-39 (31x40), Right corner: x=89-121 (33x40)
  // We crop and display at the four corners of each page
  private _addPageCorners(px: number, py: number, pw: number, ph: number, mirrorX: boolean) {
    if (!this.textures.exists('book_tileset')) return

    const cornerSize = 36  // display size for corner ornaments (was 22, now much more visible)
    const alpha = 0.72      // opacity (was 0.55)

    // Top-left corner
    const tlCorner = this.add.image(px, py, 'book_tileset')
      .setOrigin(0, 0)
      .setCrop(9, 0, 31, 40)
      .setDisplaySize(cornerSize, cornerSize)
      .setAlpha(alpha)
      .setTint(0x8b6914)
    this.bookContent.add(tlCorner)

    // Top-right corner (mirror horizontally for right page)
    const trCorner = this.add.image(px + pw, py, 'book_tileset')
      .setOrigin(1, 0)
      .setCrop(89, 0, 33, 40)
      .setDisplaySize(cornerSize, cornerSize)
      .setAlpha(alpha)
      .setTint(0x8b6914)
    if (mirrorX) trCorner.setFlipX(true)
    this.bookContent.add(trCorner)

    // Bottom-left corner
    const blCorner = this.add.image(px, py + ph, 'book_tileset')
      .setOrigin(0, 1)
      .setCrop(9, 0, 31, 40)
      .setDisplaySize(cornerSize, cornerSize)
      .setAlpha(alpha)
      .setTint(0x8b6914)
      .setFlipY(true)
    this.bookContent.add(blCorner)

    // Bottom-right corner
    const brCorner = this.add.image(px + pw, py + ph, 'book_tileset')
      .setOrigin(1, 1)
      .setCrop(89, 0, 33, 40)
      .setDisplaySize(cornerSize, cornerSize)
      .setAlpha(alpha)
      .setTint(0x8b6914)
      .setFlipY(true)
    if (mirrorX) brCorner.setFlipX(true)
    this.bookContent.add(brCorner)

    // Additional small diamond accents mid-edge (top/bottom center of each page)
    const edgeDecG = this.add.graphics()
    edgeDecG.fillStyle(0x8b6914, 0.42)
    // Top center small diamond
    const tcX = px + pw / 2
    edgeDecG.fillTriangle(tcX, py + 3, tcX - 4, py + 7, tcX, py + 11)
    edgeDecG.fillTriangle(tcX, py + 3, tcX + 4, py + 7, tcX, py + 11)
    // Bottom center small diamond
    edgeDecG.fillTriangle(tcX, py + ph - 3, tcX - 4, py + ph - 7, tcX, py + ph - 11)
    edgeDecG.fillTriangle(tcX, py + ph - 3, tcX + 4, py + ph - 7, tcX, py + ph - 11)
    this.bookContent.add(edgeDecG)
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

    // Update bookmark active offsets and frames
    const bRowH = Math.min((bookH - 60) / HERO_INFO.length, 68)
    const bStartY = bookY + 44
    HERO_INFO.forEach((hero, i) => {
      const bm = this.bookmarkSprites[i]
      if (!bm) return
      const isActive = this.selectedHeroType === hero.type
      const frames = BOOKMARK_FRAMES[hero.type] ?? { inactive: i * 2, active: i * 2 + 1 }
      const frame = isActive ? frames.active : frames.inactive
      const bY = bStartY + i * bRowH + bRowH / 2
      const bX = leftPageX - 4 + (isActive ? 10 : 0)
      bm.setPosition(bX, bY)
      bm.setFrame(frame)
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

      // Row highlight for selected — use a sell slot as background texture
      if (isSelected) {
        const highlight = this.add.graphics()
        highlight.fillStyle(hero.color, 0.12)
        highlight.fillRoundedRect(px + 10, rowY + 2, pw - 18, rowH - 6, 4)
        highlight.lineStyle(1, hero.color, 0.35)
        highlight.strokeRoundedRect(px + 10, rowY + 2, pw - 18, rowH - 6, 4)
        this.leftContainer.add(highlight)
      }

      // Element medallion from book_content for the active hero's row
      // For non-selected rows: small colored bookmark-icon-sized medallion
      const medallion = HERO_MEDALLION[hero.type]
      if (medallion && this.textures.exists('book_content')) {
        const [cx, cy, cw, ch] = medallion
        const displaySz = isSelected ? Math.min(rowH - 8, 36) : Math.min(rowH - 12, 28)
        const img = this.add.image(px + 22, rowY + rowH / 2, 'book_content')
          .setOrigin(0.5)
          .setCrop(cx, cy, cw, ch)
          .setDisplaySize(displaySz, displaySz)
          .setAlpha(isSelected ? 0.95 : 0.55)
        this.leftContainer.add(img)
      } else {
        // Fallback: color circle
        const circleG = this.add.graphics()
        circleG.fillStyle(hero.color, 0.85)
        circleG.fillCircle(px + 22, rowY + rowH / 2, 10)
        this.leftContainer.add(circleG)
      }

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

      // "Played" indicator — use a sell slot with golden tint
      if (played) {
        if (this.textures.exists('book_sells')) {
          const badge = this.add.image(px + pw - 16, rowY + rowH / 2, 'book_sells', 0)
            .setDisplaySize(18, 14)
            .setTint(0xddaa22)
            .setOrigin(0.5)
          this.leftContainer.add(badge)
          this.leftContainer.add(this.add.text(px + pw - 16, rowY + rowH / 2, '✓', {
            fontFamily: 'monospace', fontSize: '8px', color: '#2a1810',
          }).setOrigin(0.5))
        } else {
          this.leftContainer.add(this.add.text(px + pw - 16, rowY + rowH / 2, '✓', {
            fontFamily: 'monospace', fontSize: '10px', color: '#44aa44',
          }).setOrigin(0.5))
        }
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
      // No hero selected — show a welcome panel with page-frame texture
      if (this.textures.exists('book_tileset')) {
        // Draw the large page frame from info_tileset (y=89-165, w=113x77)
        const frameImg = this.add.image(px + pw / 2, py + ph / 2 - 30, 'book_tileset')
          .setOrigin(0.5)
          .setCrop(9, 89, 113, 77)
          .setDisplaySize(pw - 30, 100)
          .setAlpha(0.25)
          .setTint(0x8b6914)
        this.rightContainer.add(frameImg)
      }
      this.rightContainer.add(this.add.text(px + pw / 2, py + ph / 2 - 30,
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

      // Sell slot background for active tab
      if (isActive && this.textures.exists('book_sells')) {
        const tabSlot = this.add.image(btnX, navY, 'book_sells', 3)
          .setDisplaySize(52, 18)
          .setTint(heroInfo ? heroInfo.color : 0xd4b483)
          .setAlpha(0.35)
          .setOrigin(0.5)
        this.rightContainer.add(tabSlot)
      }

      const btn = this.add.text(btnX, navY, label, {
        fontFamily: 'monospace', fontSize: '9px',
        color: isActive ? heroColorHex : '#998866',
        stroke: '#c8a97a', strokeThickness: 0.5,
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

    // Animated hero portrait in circle frame — top-right of page
    const spriteDef = HERO_SPRITE_DEFS[heroType]
    const animKey = `enc_idle_${heroType}`
    const texKey = spriteDef ? spriteDef.asset.replace(/[^a-z0-9]/gi, '_') : ''
    const r = 48
    const circleCX = px + pw - r - 8
    const circleCY = py + r + 8

    // Circle background (dark fill)
    const circleBg = this.add.graphics()
    circleBg.fillStyle(0x111122, 1)
    circleBg.fillCircle(circleCX, circleCY, r)
    this.rightContainer.add(circleBg)

    // Animated sprite with circular mask
    if (spriteDef && this.textures.exists(texKey)) {
      const sprite = this.add.sprite(circleCX, circleCY + (spriteDef.yOff || 0), texKey)
        .setScale(spriteDef.scale * 1.0)
        .setOrigin(0.5)
      if (this.anims.exists(animKey)) sprite.play(animKey)

      // Circular geometry mask — use world coordinates (rightContainer is at 0,0)
      const maskShape = this.make.graphics()
      maskShape.fillStyle(0xffffff)
      maskShape.fillCircle(circleCX, circleCY, r - 3)
      sprite.setMask(maskShape.createGeometryMask())

      this.rightContainer.add(sprite)
    }

    // Circle border (hero-colored)
    const circleBorder = this.add.graphics()
    circleBorder.lineStyle(2, hero.color, 0.6)
    circleBorder.strokeCircle(circleCX, circleCY, r)
    // Inner ring
    circleBorder.lineStyle(1, hero.color, 0.2)
    circleBorder.strokeCircle(circleCX, circleCY, r - 4)
    this.rightContainer.add(circleBorder)

    // Hero name + role
    this.rightContainer.add(this.add.text(px + 12, py + 18, hero.name, {
      fontFamily: 'monospace', fontSize: '16px', color: colorHex,
    }).setOrigin(0, 0))
    this.rightContainer.add(this.add.text(px + 12, py + 38, hero.role, {
      fontFamily: 'monospace', fontSize: '10px', color: '#665544',
    }).setOrigin(0, 0))

    // Decorative line below header — shifted below circle bottom (circleCY + r = py + 104)
    const lineG = this.add.graphics()
    lineG.lineStyle(1.5, hero.color, 0.45)
    lineG.lineBetween(px + 12, py + 108, px + pw - 12, py + 108)
    this.rightContainer.add(lineG)

    // Lore text — wrapped, starts just below the line
    const textW = pw - 24
    this.rightContainer.add(this.add.text(px + 15, py + 114, hero.lore, {
      fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
      wordWrap: { width: textW }, lineSpacing: 4,
    }))

    // Playstyle section
    const playstyleY = py + 114 + 80
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
    const branchStartY = playstyleY + 22 + 72
    const lineG3 = this.add.graphics()
    lineG3.lineStyle(0.5, 0x2a1810, 0.25)
    lineG3.lineBetween(px + 20, branchStartY, px + pw - 20, branchStartY)
    this.rightContainer.add(lineG3)

    this.rightContainer.add(this.add.text(px + 15, branchStartY + 6, 'BRANCHES', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a1810',
    }))

    branches.forEach((branch, i) => {
      const bY = branchStartY + 22 + i * 22
      const bColorHex = '#' + branch.color.toString(16).padStart(6, '0')
      const branchUnlocked = this.encData.branches.includes(branch.name)

      // Small branch icon — use the first skill's icon frame for the branch
      if (this.textures.exists('book_icons')) {
        const iconFrame = branchIconFrame(heroType, i, 0)
        const branchIcon = this.add.image(px + 16, bY + 9, 'book_icons', iconFrame)
          .setDisplaySize(14, 14)
          .setOrigin(0.5)
          .setAlpha(branchUnlocked ? 0.9 : 0.3)
        this.rightContainer.add(branchIcon)
      }

      this.rightContainer.add(this.add.text(px + 26, bY, `${branch.name}`, {
        fontFamily: 'monospace', fontSize: '9px', color: branchUnlocked ? bColorHex : '#998866',
      }))
      this.rightContainer.add(this.add.text(px + pw - 10, bY, branch.upgrades[0].desc, {
        fontFamily: 'monospace', fontSize: '8px', color: '#665544',
      }).setOrigin(1, 0))
    })
  }

  // ── Branch skills page ────────────────────────────────────────────────────

  // Track which branch tab and which skill slot is selected within this page
  private selectedBranchIdx = 0
  private selectedSkillIdx = -1

  // Decoration rows in book_content.png (336x448) for each hero's element header.
  // Each entry: [leftPieceX, leftPieceY, leftPieceW, leftPieceH,
  //              centerX, centerY, centerW, centerH,
  //              stripY, stripH]  — strip covers the full decoration band
  private static readonly HERO_DECO: Record<string, {
    stripY: number, stripH: number,
    centerX: number, centerY: number, centerW: number, centerH: number,
    leftX: number, leftY: number, leftW: number, leftH: number,
  }> = {
    ignara:   { stripY: 115, stripH: 60, centerX: 100, centerY: 115, centerW: 80, centerH: 60, leftX: 0,   leftY: 115, leftW: 60,  leftH: 60  },
    sifra:    { stripY: 180, stripH: 60, centerX: 100, centerY: 180, centerW: 80, centerH: 60, leftX: 0,   leftY: 180, leftW: 60,  leftH: 60  },
    huntress: { stripY: 245, stripH: 60, centerX: 100, centerY: 245, centerW: 80, centerH: 60, leftX: 0,   leftY: 245, leftW: 60,  leftH: 60  },
    amun:     { stripY: 310, stripH: 60, centerX: 100, centerY: 310, centerW: 80, centerH: 60, leftX: 0,   leftY: 310, leftW: 60,  leftH: 60  },
    nazar:    { stripY: 115, stripH: 60, centerX: 100, centerY: 115, centerW: 80, centerH: 60, leftX: 0,   leftY: 115, leftW: 60,  leftH: 60  },
  }

  private buildSkillsPage(px: number, py: number, pw: number, ph: number) {
    const heroType = this.selectedHeroType!
    const branches = HERO_BRANCHES[heroType] || []
    if (this.selectedBranchIdx >= branches.length) this.selectedBranchIdx = 0

    // ── Compact branch tabs (35px) ───────────────────────────────────
    const tabH = 34
    const tabGap = 4
    const tabW = (pw - tabGap * (branches.length + 1)) / branches.length
    const tabY = py + 8

    branches.forEach((branch, bi) => {
      const tabX = px + tabGap + bi * (tabW + tabGap)
      const isActive = bi === this.selectedBranchIdx
      const branchColorHex = '#' + branch.color.toString(16).padStart(6, '0')

      const tabG = this.add.graphics()
      if (isActive) {
        tabG.fillStyle(branch.color, 0.22)
        tabG.fillRoundedRect(tabX, tabY, tabW, tabH, { tl: 6, tr: 6, bl: 0, br: 0 })
        tabG.lineStyle(1.5, branch.color, 0.85)
        tabG.strokeRoundedRect(tabX, tabY, tabW, tabH, { tl: 6, tr: 6, bl: 0, br: 0 })
      } else {
        tabG.fillStyle(0x2a1810, 0.10)
        tabG.fillRoundedRect(tabX, tabY + 2, tabW, tabH - 4, { tl: 5, tr: 5, bl: 0, br: 0 })
        tabG.lineStyle(1, branch.color, 0.25)
        tabG.strokeRoundedRect(tabX, tabY + 2, tabW, tabH - 4, { tl: 5, tr: 5, bl: 0, br: 0 })
      }
      this.rightContainer.add(tabG)

      // Small icon + name on one line — use first skill's icon for tab
      const iconFrame = branchIconFrame(heroType, bi, 0)
      if (this.textures.exists('book_icons')) {
        const iconImg = this.add.image(tabX + 10, tabY + tabH / 2 + (isActive ? 0 : 1), 'book_icons', iconFrame)
          .setDisplaySize(isActive ? 18 : 14, isActive ? 18 : 14).setOrigin(0.5)
        if (!isActive) iconImg.setAlpha(0.5)
        this.rightContainer.add(iconImg)
      }
      this.rightContainer.add(this.add.text(tabX + 22, tabY + tabH / 2 + (isActive ? 0 : 1), branch.name, {
        fontFamily: 'monospace', fontSize: isActive ? '9px' : '8px',
        color: isActive ? branchColorHex : '#665544',
      }).setOrigin(0, 0.5))

      const tabZone = this.add.zone(tabX + tabW / 2, tabY + tabH / 2, tabW, tabH)
        .setInteractive({ useHandCursor: !isActive })
      if (!isActive) {
        tabZone.on('pointerdown', () => {
          this.selectedBranchIdx = bi
          this.selectedSkillIdx = -1
          this._rebuild()
        })
      }
      this.rightContainer.add(tabZone)
    })

    const activeBranch = branches[this.selectedBranchIdx]
    if (!activeBranch) return

    // ── Element header decoration ────────────────────────────────────
    const headerY = tabY + tabH + 2
    const headerH = 54
    const deco = EncyclopediaScene.HERO_DECO[heroType]

    // Full-width decoration strip as background (tinted, subtle)
    if (deco && this.textures.exists('book_content')) {
      const strip = this.add.image(px + pw / 2, headerY, 'book_content')
        .setOrigin(0.5, 0)
        .setCrop(0, deco.stripY, 336, deco.stripH)
        .setDisplaySize(pw - 8, headerH)
        .setAlpha(0.18)
      if (heroType === 'nazar') strip.setTint(0xff6666)
      this.rightContainer.add(strip)
    }

    // Medallion portrait centered in header
    const medallion = HERO_MEDALLION[heroType]
    if (medallion && this.textures.exists('book_content')) {
      const [mx, my, mw, mh] = medallion
      const mSize = Math.min(headerH - 4, 44)
      const medallionImg = this.add.image(px + pw / 2, headerY + headerH / 2, 'book_content')
        .setOrigin(0.5)
        .setCrop(mx, my, mw, mh)
        .setDisplaySize(mSize, mSize)
        .setAlpha(0.88)
      if (heroType === 'nazar') medallionImg.setTint(0xff9999)
      this.rightContainer.add(medallionImg)
    }

    // Branch name centered in header
    const branchColorHex = '#' + activeBranch.color.toString(16).padStart(6, '0')
    const headerLabel = this.add.text(px + pw / 2, headerY + headerH - 10, activeBranch.name.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '9px',
      color: branchColorHex,
      stroke: '#c8a97a', strokeThickness: 2,
    }).setOrigin(0.5, 1)
    this.rightContainer.add(headerLabel)

    // Divider below header
    const divY = headerY + headerH + 2
    const divG = this.add.graphics()
    divG.lineStyle(1.5, activeBranch.color, 0.45)
    divG.lineBetween(px + 6, divY, px + pw - 6, divY)
    this.rightContainer.add(divG)

    // ── Skill icon grid ──────────────────────────────────────────────
    const gridStartY = divY + 8
    const numSkills = activeBranch.upgrades.length
    // Layout: all skills in a single row (up to 5 fit fine)
    const cellDisplayW = 36
    const cellDisplayH = 28
    const cellGap = 6
    const gridTotalW = numSkills * cellDisplayW + (numSkills - 1) * cellGap
    const gridStartX = px + (pw - gridTotalW) / 2

    activeBranch.upgrades.forEach((upgrade, ui) => {
      const cellX = gridStartX + ui * (cellDisplayW + cellGap)
      const cellCX = cellX + cellDisplayW / 2
      const cellCY = gridStartY + cellDisplayH / 2
      const unlocked = this.encData.upgrades.includes(upgrade.id)
      const iconFrame = branchIconFrame(heroType, this.selectedBranchIdx, ui)
      const isSelectedSkill = ui === this.selectedSkillIdx

      // Slot frame background from sells_full.png (32x24 per frame, use frame 0 unlocked / frame 6 locked)
      if (this.textures.exists('book_sells')) {
        const slotFrame = unlocked ? (isSelectedSkill ? 3 : 0) : 6
        const slot = this.add.image(cellCX, cellCY, 'book_sells', slotFrame)
          .setDisplaySize(cellDisplayW, cellDisplayH)
          .setOrigin(0.5)
        if (!unlocked) {
          slot.setTint(0x443322).setAlpha(0.7)
        } else if (isSelectedSkill) {
          slot.setTint(activeBranch.color).setAlpha(0.7)
        } else {
          slot.setTint(0xd4b483).setAlpha(0.55)
        }
        this.rightContainer.add(slot)
      }

      // Selection highlight ring
      if (isSelectedSkill) {
        const ringG = this.add.graphics()
        ringG.lineStyle(2, activeBranch.color, 0.9)
        ringG.strokeRect(cellX - 1, gridStartY - 1, cellDisplayW + 2, cellDisplayH + 2)
        this.rightContainer.add(ringG)
      }

      // Skill icon or lock symbol
      if (unlocked && this.textures.exists('book_icons')) {
        const iconImg = this.add.image(cellCX, cellCY - 2, 'book_icons', iconFrame)
          .setDisplaySize(18, 18).setOrigin(0.5).setDepth(1)
        this.rightContainer.add(iconImg)
      } else if (!unlocked) {
        // Grey locked slot with '?' text
        this.rightContainer.add(this.add.text(cellCX, cellCY - 2, '?', {
          fontFamily: 'monospace', fontSize: '12px', color: '#665544',
        }).setOrigin(0.5).setAlpha(0.6))
      }

      // Skill index number below icon (1-based) as tiny label
      this.rightContainer.add(this.add.text(cellCX, gridStartY + cellDisplayH - 7, `${ui + 1}`, {
        fontFamily: 'monospace', fontSize: '7px',
        color: unlocked ? branchColorHex : '#554433',
      }).setOrigin(0.5, 1).setAlpha(0.75))

      // Interactive zone for the cell
      const zone = this.add.zone(cellCX, cellCY, cellDisplayW, cellDisplayH)
        .setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => {
        if (ui !== this.selectedSkillIdx) {
          zone.setData('hover', true)
        }
      })
      zone.on('pointerdown', () => {
        this.selectedSkillIdx = (this.selectedSkillIdx === ui) ? -1 : ui
        this._rebuild()
      })
      this.rightContainer.add(zone)
    })

    // ── Skill detail card (appears below grid when a skill is selected) ──
    const cardStartY = gridStartY + cellDisplayH + 12

    if (this.selectedSkillIdx >= 0 && this.selectedSkillIdx < activeBranch.upgrades.length) {
      const skill = activeBranch.upgrades[this.selectedSkillIdx]
      const unlocked = this.encData.upgrades.includes(skill.id)
      const iconFrame = branchIconFrame(heroType, this.selectedBranchIdx, this.selectedSkillIdx)
      const cardW = pw - 16
      const cardX = px + 8
      const cardH = ph - (cardStartY - py) - 34  // leave room for nav

      // Card background using info_tileset page frame (y=89-165, 113x77px)
      const cardBgG = this.add.graphics()
      cardBgG.fillStyle(0xc8a97a, 0.22)
      cardBgG.fillRoundedRect(cardX, cardStartY, cardW, cardH, 4)
      cardBgG.lineStyle(1, activeBranch.color, 0.45)
      cardBgG.strokeRoundedRect(cardX, cardStartY, cardW, cardH, 4)
      this.rightContainer.add(cardBgG)

      // Page frame texture overlay (info_tileset y=89 large frame)
      if (this.textures.exists('book_tileset')) {
        const frameOverlay = this.add.image(cardX, cardStartY, 'book_tileset')
          .setOrigin(0, 0)
          .setCrop(9, 89, 113, 77)
          .setDisplaySize(cardW, cardH)
          .setAlpha(0.10)
          .setTint(0x8b6914)
        this.rightContainer.add(frameOverlay)
      }

      // Large skill icon top-left of card
      const iconDisplaySize = 28
      const iconX = cardX + 10 + iconDisplaySize / 2
      const iconY = cardStartY + 10 + iconDisplaySize / 2

      if (this.textures.exists('book_sells')) {
        const iconSlot = this.add.image(iconX, iconY, 'book_sells', unlocked ? 3 : 6)
          .setDisplaySize(iconDisplaySize + 8, iconDisplaySize + 6)
          .setTint(unlocked ? activeBranch.color : 0x443322)
          .setAlpha(unlocked ? 0.55 : 0.4)
          .setOrigin(0.5)
        this.rightContainer.add(iconSlot)
      }

      if (unlocked && this.textures.exists('book_icons')) {
        const bigIcon = this.add.image(iconX, iconY, 'book_icons', iconFrame)
          .setDisplaySize(iconDisplaySize, iconDisplaySize).setOrigin(0.5).setDepth(2)
        this.rightContainer.add(bigIcon)
      } else if (!unlocked) {
        this.rightContainer.add(this.add.text(iconX, iconY, '?', {
          fontFamily: 'monospace', fontSize: '18px', color: '#665544',
        }).setOrigin(0.5).setAlpha(0.6))
      }

      // Skill name (right of icon)
      const nameX = cardX + 10 + iconDisplaySize + 8
      const nameW = cardW - iconDisplaySize - 24
      this.rightContainer.add(this.add.text(nameX, cardStartY + 8, skill.label, {
        fontFamily: 'monospace', fontSize: '11px',
        color: unlocked ? branchColorHex : '#887766',
      }).setOrigin(0, 0))

      // Branch tag below name
      this.rightContainer.add(this.add.text(nameX, cardStartY + 22, activeBranch.name, {
        fontFamily: 'monospace', fontSize: '8px', color: '#998866',
      }).setOrigin(0, 0))

      // Divider under header row
      const cardDivY = cardStartY + iconDisplaySize + 16
      const cdivG = this.add.graphics()
      cdivG.lineStyle(0.5, activeBranch.color, 0.3)
      cdivG.lineBetween(cardX + 6, cardDivY, cardX + cardW - 6, cardDivY)
      this.rightContainer.add(cdivG)

      // Description text
      if (unlocked) {
        this.rightContainer.add(this.add.text(cardX + 10, cardDivY + 6, skill.desc, {
          fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
          wordWrap: { width: nameW + iconDisplaySize + 4 }, lineSpacing: 3,
        }).setOrigin(0, 0))
      } else {
        this.rightContainer.add(this.add.text(cardX + 10, cardDivY + 6, 'Undiscovered ability.\nDefeat enemies to reveal this skill.', {
          fontFamily: 'monospace', fontSize: '9px', color: '#998866',
          fontStyle: 'italic', wordWrap: { width: cardW - 20 }, lineSpacing: 3,
        }).setOrigin(0, 0))
      }

      // Skill number badge (bottom-right of card)
      this.rightContainer.add(this.add.text(cardX + cardW - 8, cardStartY + cardH - 6,
        `${this.selectedSkillIdx + 1} / ${numSkills}`, {
          fontFamily: 'monospace', fontSize: '8px', color: branchColorHex,
        }).setOrigin(1, 1).setAlpha(0.6))

    } else {
      // No skill selected — prompt
      this.rightContainer.add(this.add.text(px + pw / 2, cardStartY + 16,
        'Tap a skill slot to view details', {
          fontFamily: 'monospace', fontSize: '9px', color: '#998866',
          fontStyle: 'italic',
        }).setOrigin(0.5, 0))
    }
  }

  // ── Generic upgrades page ─────────────────────────────────────────────────

  private buildGenericsPage(px: number, py: number, pw: number, ph: number) {
    const heroInfo = HERO_INFO.find(h => h.type === this.selectedHeroType)!
    const heroColor = heroInfo.color

    // Page title
    const titleText = this.add.text(px + pw / 2, py + 22, 'Generic Upgrades', {
      fontFamily: 'monospace', fontSize: '11px', color: '#2a1810',
    }).setOrigin(0.5)
    this.rightContainer.add(titleText)

    const titleLineG = this.add.graphics()
    titleLineG.lineStyle(1, 0x2a1810, 0.4)
    titleLineG.lineBetween(px + 6, py + 34, px + pw - 6, py + 34)
    this.rightContainer.add(titleLineG)

    const contentH = ph - 62
    const rowH = Math.min(contentH / GENERIC_POOL.length, 22)

    GENERIC_POOL.forEach((upgrade, i) => {
      const rowY = py + 40 + i * rowH
      const unlocked = this.encData.upgrades.includes(upgrade.id)
      const iconFrame = (54 + i) % 90  // generic icons from row 6+

      // Row background — alternating sell slot frames
      if (this.textures.exists('book_sells')) {
        const slotFrame = unlocked ? (i % 3) : 9  // vary frames for unlocked
        const rowSlot = this.add.image(px + pw / 2, rowY + rowH / 2, 'book_sells', slotFrame)
          .setDisplaySize(pw - 12, rowH - 2)
          .setAlpha(unlocked ? 0.15 : 0.08)
          .setTint(unlocked ? heroColor : 0x665544)
          .setOrigin(0.5)
        this.rightContainer.add(rowSlot)
      }

      if (unlocked) {
        // Skill icon
        if (this.textures.exists('book_icons')) {
          const icon = this.add.image(px + 14, rowY + rowH / 2, 'book_icons', iconFrame)
            .setDisplaySize(12, 12)
            .setOrigin(0.5)
          this.rightContainer.add(icon)
        }

        const labelText = this.add.text(px + 24, rowY + 2, `${upgrade.label}`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#2a1810',
        }).setOrigin(0, 0)
        this.rightContainer.add(labelText)

        const descText = this.add.text(px + pw - 10, rowY + 2, upgrade.desc, {
          fontFamily: 'monospace', fontSize: '8px', color: '#665544',
        }).setOrigin(1, 0)
        this.rightContainer.add(descText)
      } else {
        // Locked slot — lock icon + dashes
        if (this.textures.exists('book_sells')) {
          const slot = this.add.image(px + 14, rowY + rowH / 2, 'book_sells', 9)
            .setDisplaySize(12, 12)
            .setTint(0x665544)
            .setAlpha(0.5)
            .setOrigin(0.5)
          this.rightContainer.add(slot)
        }

        this.rightContainer.add(this.add.text(px + 24, rowY + 2, `— Undiscovered —`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#998866',
        }).setOrigin(0, 0))
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
