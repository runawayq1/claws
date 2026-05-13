import Phaser from 'phaser'
import { type HeroType, HERO_DEFS } from '../entities/Player'
import { unlockHero } from './EncyclopediaScene'
import { MetaProgress } from '../systems/MetaProgress'
import { NotificationBell } from '../ui/NotificationBell'
import { makeCircleButton } from '../ui/CircleButton'
import { HERO_BRANCHES, getIconTexture, type BranchDef } from '../systems/UpgradeSystem'
import { addDiagonalBg } from '../utils/bgScroll'
import { isMobileDevice, gameFont } from '../utils/device'


// Attack animation sheets for the popup portrait.
// Heroes listed here play their attack anim once when a stance is selected.
// Khashin, Muller use cropped idle sheets in HEROES but their attack sheets
// have different dimensions — we skip them here and use a pulse fallback.
// Vael is excluded by user request.
type PopupAttackDef = { asset: string; fw: number; fh: number; frames: number; frameRate?: number }
const HERO_POPUP_ATTACK: Partial<Record<HeroType, PopupAttackDef>> = {
  ignara:     { asset: 'assets/ignara/Attack.png',      fw: 150, fh: 150, frames: 8, frameRate: 16 },
  sifra:      { asset: 'assets/sifra/Attack1.png',      fw: 231, fh: 190, frames: 8, frameRate: 16 },
  amun:       { asset: 'assets/amun/Attack1.png',       fw: 160, fh: 111, frames: 4, frameRate: 10 },
  nazar:      { asset: 'assets/nazar/Attack1.png',      fw: 200, fh: 200, frames: 6, frameRate: 14 },
  huntress:   { asset: 'assets/lyra/Attack1.png',       fw: 150, fh: 150, frames: 5, frameRate: 12 },
  nightborne: { asset: 'assets/nightborne/attack.png',  fw: 240, fh: 240, frames: 12, frameRate: 18 },
}

// Per-hero ambient particle config for the portrait frame.
// `style` picks a predefined emitter behavior, `tint` controls the particle color.
type ParticleStyle = 'embers' | 'snow' | 'leaves' | 'sand' | 'void' | 'crystals' | 'sparks' | 'plague'
const HERO_PARTICLES: Partial<Record<HeroType, { style: ParticleStyle; tint: number }>> = {
  ignara:     { style: 'embers',   tint: 0xf97316 },
  sifra:      { style: 'snow',     tint: 0x67e8f9 },
  amun:       { style: 'sparks',   tint: 0xfbbf24 },
  nazar:      { style: 'sparks',   tint: 0xf43f5e },
  huntress:   { style: 'leaves',   tint: 0x10b981 },
  khashin:    { style: 'sand',     tint: 0xfde68a },
  muller:     { style: 'crystals', tint: 0x60a5fa },
  vael:       { style: 'plague',   tint: 0xa78bfa },
  nightborne: { style: 'void',     tint: 0xa855f7 },
}

// Per-hero vertical nudge applied on top of bottom-alignment in the popup portrait.
// Positive values push the sprite DOWN (show more of the top); negative = UP.
const HERO_POPUP_Y_NUDGE: Partial<Record<HeroType, number>> = {
  sifra:      40,
  ignara:     70,
  huntress:   95,
  nazar:      120,
  vael:       30,
  nightborne: 25,
}

// Per-hero extra scale multiplier on top of the base popup scale
const HERO_POPUP_SCALE: Partial<Record<HeroType, number>> = {
  sifra:      1.1,
  ignara:     1.1,
  nazar:      1.1,
  nightborne: 0.9,
}

// Concise bonus summary per branch — rendered bold on the stance card.
// Keyed by the BranchDef.name from UpgradeSystem.
const BRANCH_SUMMARY: Record<string, string> = {
  // Ignara
  'Inferno':        'Massive fireball aoe · wider blast · scorched earth',
  'Wildfire':       'Attack speed · Chain-kill explosions',
  'Pyre':           'Burn aura · Short range · Huge damage',
  // Nazar
  'Way of the Blade':  '+35% crit chance · dual-strike combos',
  'Way of Venom':      'Poison DoT · area denial · +30% damage',
  'Way of Shadow':     'Stealth · +100% execution damage',
  // Sifra
  'Frost':          'Freeze enemies · Ice armor',
  'Shatter':        'Ice shards splits · chain shatter',
  'Lightning':      'Chain beam · +50% attack speed',
  // Amun
  'Wrath':          'Damage aura · thorns · consecration',
  'Bastion':        '+50% damage reduction · undying',
  'Quake':          'Knockback AoE ·  Ranged stance ',
  // Khashin
  'Gale':           '+50% attack speed · cyclone pulls',
  'Dune':           '+40% damage reduction · sand armor',
  'Mirage':         '+40% move speed · phantom dashes',
  // Muller
  'Shardfall':      'Crystal shrapnel · tectonic fury',
  'Geode Shell':    '+60% damage reduction · resonance shield',
  'Deep Seam':      'Crystal pillars · fault lines · mother lode',
  // Huntress (Lyra)
  'Predator':       '+35% crit · battle frenzy on kill',
  'Stalker':        '+40% move speed · mobility traps',
  'Warden':         'Orbiting spears · spear wall AoE',
  // Vael (Necra)
  'Pale Harvest':   'Life drain · +50% attack speed',
  'Ossuary':        'Zombie army · +27% attack speed · +24% damage per zombie',
  'Wasting Plague': 'Plague spread · necrotic bloom DoT',
  // Nightborne
  'Void Blade':     '+50% damage · void surge cleave',
  'Phantom':        'Echo strikes · shade legion',
  'Rift':           'Void step · rift collapse AoE',
}


interface HeroDef {
  type: HeroType
  name: string
  role: string
  color: number
  asset: string
  fw: number
  fh: number
  scale: number
  tint?: number
  frames: number
  frameStart?: number
  yOff?: number
}

// Hero colors use Tailwind-inspired palette for harmonized look across roster
export const HEROES: HeroDef[] = [
  { type: 'amun', name: 'Amun', role: 'Guardian', color: 0xfbbf24,
    asset: 'assets/amun/Idle.png', fw: 160, fh: 111, scale: 1.3, frames: 8, yOff: -30 },
  { type: 'sifra', name: 'Sifra', role: 'Ice Mage', color: 0x38bdf8,
    asset: 'assets/sifra/Idle.png', fw: 231, fh: 190, scale: 0.65, frames: 6 },
  { type: 'ignara', name: 'Ignara', role: 'Fire Mage', color: 0xf97316,
    asset: 'assets/ignara/Idle.png', fw: 150, fh: 150, scale: 1.1, frames: 8 },
  { type: 'nazar', name: 'Nazar', role: 'Samurai', color: 0xf43f5e,
    asset: 'assets/nazar/Idle.png', fw: 200, fh: 200, scale: 1.0, frames: 8, yOff: 8 },
  { type: 'huntress', name: 'Lyra', role: 'Spear Thrower', color: 0x10b981,
    asset: 'assets/lyra/Idle.png', fw: 150, fh: 150, scale: 1.265, frames: 8 },
  { type: 'khashin', name: 'Khashin', role: 'Sand Assassin', color: 0x67e8f9,
    asset: 'assets/khashin/Idle_cropped.png', fw: 48, fh: 42, scale: 1.36, frames: 8 },
  { type: 'muller', name: 'Givi', role: 'Crystal Gnome', color: 0x60a5fa,
    asset: 'assets/givi/Idle_cropped.png', fw: 51, fh: 44, scale: 1.12, frames: 8, yOff: 10 },
  { type: 'vael', name: 'Vael', role: 'Pale Doctor', color: 0xa78bfa,
    asset: 'assets/vael/sheet.png', fw: 160, fh: 128, scale: 1.33, frames: 13, frameStart: 34, yOff: -30 },
  { type: 'nightborne', name: 'Nightborne', role: 'Void Blade', color: 0xa855f7,
    asset: 'assets/nightborne/idle.png', fw: 240, fh: 240, scale: 0.55, frames: 9 },
]

export const HERO_UNLOCK_HINTS: Partial<Record<HeroType, string>> = {
  sifra:    "Find her in the Ruin. (Complete Amun's tutorial)",
  ignara:   'Complete 3 runs to unlock.',
  nazar:    'Win a run to unlock.',
  huntress: 'Purchase at the Forge for 1000 gold.',
  khashin:  'Survive 8 minutes as Ignara to unlock.',
  muller:   'Someone is working in the deep crystal...',
}

export class HeroSelectScene extends Phaser.Scene {
  private circles: Phaser.GameObjects.Graphics[] = []
  private selectedIndex = -1
  private activeLockedHint: Phaser.GameObjects.Text | null = null
  private playerName = ''
  private popupRoot: Phaser.GameObjects.Container | null = null
  private selectedMap: 'GameScene' | 'UndeadMapScene' = 'GameScene'
  private popupKeyboardHandler: ((ev: KeyboardEvent) => void) | null = null
  private popupTracerTween: Phaser.Tweens.Tween | null = null
  private popupPlayTracerTween: Phaser.Tweens.Tween | null = null
  private popupSwipeDownHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null
  private popupSwipeUpHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null

  constructor() {
    super({ key: 'HeroSelectScene' })
  }

  preload() {
    const loaded = new Set<string>()
    for (const hero of HEROES) {
      if (loaded.has(hero.asset)) continue
      loaded.add(hero.asset)
      const key = hero.asset.replace(/[^a-z0-9]/gi, '_')
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, hero.asset, { frameWidth: hero.fw, frameHeight: hero.fh })
      }
    }
    // Attack sheets for popup "play attack on stance select" effect
    for (const [heroType, def] of Object.entries(HERO_POPUP_ATTACK)) {
      const key = `popup_atk_${heroType}`
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, def.asset, { frameWidth: def.fw, frameHeight: def.fh })
      }
    }
    if (!this.textures.exists('book_anim')) {
      this.load.spritesheet('book_anim', 'assets/book/book_anim.png', { frameWidth: 542, frameHeight: 542 })
    }
    if (!this.textures.exists('skill_icons')) {
      this.load.spritesheet('skill_icons', 'assets/icons/skill_icons_sheet.png', { frameWidth: 128, frameHeight: 128 })
    }
    // 4x4 white dot texture for popup ambient particles (generated once)
    if (!this.textures.exists('popup_particle')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false)
      g.fillStyle(0xffffff, 1)
      g.fillCircle(4, 4, 4)
      g.generateTexture('popup_particle', 8, 8)
      g.destroy()
    }
  }

  create(data?: { playerName?: string; mode?: 'solo' | 'multiplayer' }) {
    // Reset popup state from previous scene lifecycle
    if (this.popupSwipeDownHandler) { this.input.off('pointerdown', this.popupSwipeDownHandler); this.popupSwipeDownHandler = null }
    if (this.popupSwipeUpHandler) { this.input.off('pointerup', this.popupSwipeUpHandler); this.popupSwipeUpHandler = null }
    if (this.popupKeyboardHandler) { this.input.keyboard?.off('keydown', this.popupKeyboardHandler); this.popupKeyboardHandler = null }
    if (this.popupTracerTween) { this.popupTracerTween.stop(); this.popupTracerTween = null }
    if (this.popupPlayTracerTween) { this.popupPlayTracerTween.stop(); this.popupPlayTracerTween = null }
    this.popupRoot = null

    this.cameras.main.fadeIn(200)
    const { width, height } = this.scale
    const compact = height < 500
    this.circles = []
    this.selectedIndex = -1
    this.activeLockedHint = null
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    this.playerName = data?.playerName
      || localStorage.getItem('claws_player_name')
      || ''

    // Ensure popup_particle exists at scene create time (preload may be skipped on re-entry)
    if (!this.textures.exists('popup_particle')) {
      const gp = this.make.graphics({ x: 0, y: 0 }, false)
      gp.fillStyle(0xffffff, 1)
      gp.fillCircle(4, 4, 4)
      gp.generateTexture('popup_particle', 8, 8)
      gp.destroy()
    }

    this.cameras.main.setBackgroundColor(0x0d0d1a)
    addDiagonalBg(this)

    // #13 Scene entry — camera zoom-in from 0.96 → 1 alongside fadeIn.
    // We do NOT wrap all elements in a container because masks, zones, and
    // the popup-root lookup depend on world-space coordinates. Instead we use
    // the camera zoom, which scales everything visually without changing coords.
    this.cameras.main.setZoom(0.96)
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1,
      duration: 250,
      ease: 'Sine.easeOut',
    })
    // No-op addToBody (kept so downstream code doesn't need rewriting)
    const addToBody = (_obj: Phaser.GameObjects.GameObject) => { /* pass-through */ }

    // #1 Ambient background particles — drifting motes under the grid
    if (!reducedMotion) {
      const particleCount = 50
      const ambient = this.add.particles(0, 0, 'popup_particle', {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: { min: 6000, max: 10000 },
        speedX: { min: 6, max: 14 },
        speedY: { min: 3, max: 8 },
        scale: { start: 0.35, end: 0.1 },
        alpha: { start: 0.15, end: 0 },
        tint: 0xffffff,
        frequency: 180,
        blendMode: 'NORMAL',
        quantity: 1,
      })
      ambient.setDepth(0)
      // Prime with existing particles so the screen isn't empty for the first 3s
      ambient.emitParticle(particleCount)
      addToBody(ambient as any)
    }

    // Title
    const heroSelectTitle = this.add.text(width / 2, compact ? 18 : height * 0.08, 'CLAWS', {
      fontFamily: gameFont(), fontSize: compact ? '28px' : '48px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    heroSelectTitle.setShadow(0, 1, '#000000', 2, true, true)
    addToBody(heroSelectTitle as any)

    const subtitleY = compact ? 46 : height * 0.08 + 60
    const subtitle = this.add.text(width / 2, subtitleY, 'Survive the Swarm', {
      fontFamily: gameFont(), fontSize: compact ? '13px' : '16px',
      color: '#888888',
    }).setOrigin(0.5)
    addToBody(subtitle as any)

    // Decorative gold horizontal rule below subtitle
    const rule = this.add.graphics()
    rule.lineStyle(1, 0xffd700, 0.4)
    rule.lineBetween(width / 2 - 60, subtitleY + 22, width / 2 + 60, subtitleY + 22)
    addToBody(rule as any)

    if (this.playerName) {
      const playerLabel = this.add.text(16, compact ? 8 : 16, `Playing as: ${this.playerName}`, {
        fontFamily: gameFont(), fontSize: compact ? '13px' : '13px',
        color: '#FFD700',
      }).setOrigin(0, 0)
      addToBody(playerLabel as any)
    }

    const chooseText = this.add.text(width / 2, compact ? 64 : height * 0.22, 'Choose your Hero', {
      fontFamily: gameFont(), fontSize: compact ? '13px' : '14px',
      color: '#999999',
    }).setOrigin(0.5)
    addToBody(chooseText as any)

    // #8 Grid: 5 cols landscape, 3 cols portrait
    const isPortrait = height > width
    const circleRadius = isPortrait
      ? (compact ? 34 : 42)
      : (compact ? 44 : 56)
    const gap = isPortrait
      ? (compact ? 12 : 18)
      : (compact ? 16 : 22)

    const cols = isPortrait ? 3 : 5
    const rows = Math.ceil(HEROES.length / cols)
    // rowH includes space below circle for name + role pill
    const rowH = circleRadius * 2 + (compact ? 48 : 60)

    const gridW = cols * (circleRadius * 2) + (cols - 1) * gap
    const gridH = rows * (circleRadius * 2) + (rows - 1) * (rowH - circleRadius * 2 + gap)
    const startX = width / 2 - gridW / 2 + circleRadius
    // Center grid vertically between the "Choose your Hero" text and the back-button area
    const topMargin = (compact ? 82 : Math.max(height * 0.22, 130))
    const bottomMargin = compact ? 44 : 80
    const availH = height - topMargin - bottomMargin
    const heroY = topMargin + Math.max(0, (availH - gridH) / 2) + circleRadius

    // Create idle animations for each hero
    HEROES.forEach((hero) => {
      const animKey = `start_idle_${hero.type}`
      if (!this.anims.exists(animKey)) {
        const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(texKey, { start: hero.frameStart ?? 0, end: (hero.frameStart ?? 0) + hero.frames - 1 }),
          frameRate: 8,
          repeat: -1,
        })
      }
    })

    // Sort: unlocked heroes first
    const sortedHeroes = [...HEROES].sort((a, b) => {
      const aLocked = MetaProgress.isHeroUnlocked(a.type) ? 0 : 1
      const bLocked = MetaProgress.isHeroUnlocked(b.type) ? 0 : 1
      return aLocked - bLocked
    })

    // Helper: grid cell → center position
    const cellPos = (idx: number) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const cx = startX + col * (circleRadius * 2 + gap)
      const cy = heroY + row * (rowH + gap)
      return { cx, cy }
    }


    // Track all hero elements for staggered entry
    const heroEntryTargets: Phaser.GameObjects.GameObject[] = []
    const heroEntryContainers: Phaser.GameObjects.Container[] = []

    // Tooltip state — only ONE tooltip at a time
    const closeTooltip = () => {
      if (this.activeLockedHint) {
        this.tweens.killTweensOf(this.activeLockedHint)
        this.activeLockedHint.destroy()
        this.activeLockedHint = null
      }
    }

    sortedHeroes.forEach((hero, i) => {
      const { cx, cy } = cellPos(i)
      const colorHex = `#${hero.color.toString(16).padStart(6, '0')}`
      const isLocked = !MetaProgress.isHeroUnlocked(hero.type)

      // Per-hero container (for staggered fade-in)
      const heroContainer = this.add.container(0, 0)
      heroContainer.setAlpha(0)
      addToBody(heroContainer as any)
      heroEntryContainers.push(heroContainer)

      // #2 Gold halo behind unlocked circles
      let halo: Phaser.GameObjects.Graphics | null = null
      if (!isLocked) {
        halo = this.add.graphics()
        const haloAlphas = [0.08, 0.06, 0.04, 0.02]
        for (let k = 0; k < 4; k++) {
          halo.fillStyle(0xffd700, haloAlphas[k])
          halo.fillCircle(cx, cy, circleRadius + 6 + k * 5)
        }
        heroContainer.add(halo)
        if (!reducedMotion) {
          this.tweens.add({
            targets: halo,
            alpha: { from: 0.8, to: 1 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: i * 180,
          })
        }
      }

      // Circle background + border
      const g = this.add.graphics().setDepth(0)
      this.circles.push(g)
      this.drawCircle(g, cx, cy, circleRadius, isLocked ? 0x444444 : hero.color, false)
      heroContainer.add(g)

      // Animated sprite — circular mask
      const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
      const sprY = cy + (hero.yOff || 0)
      const baseSpriteScale = hero.scale * 0.85 * (circleRadius / 52)
      const sprite = this.add.sprite(cx, sprY, texKey, 0)
        .setScale(baseSpriteScale).setDepth(1)
      if (hero.tint) sprite.setTint(hero.tint)
      sprite.play(`start_idle_${hero.type}`)
      heroContainer.add(sprite)

      // Circular mask to clip sprite inside the circle
      const maskShape = this.make.graphics({ x: 0, y: 0 })
      maskShape.fillStyle(0xffffff)
      maskShape.fillCircle(cx, cy, circleRadius - 3)
      const mask = maskShape.createGeometryMask()
      sprite.setMask(mask)

      // Locked overlay: very dark tint + lock icon
      if (isLocked) {
        sprite.setTint(0x111111)
        const lockOverlay = this.add.graphics().setDepth(3)
        lockOverlay.fillStyle(0x000000, 0.5)
        lockOverlay.fillCircle(cx, cy, circleRadius - 3)
        heroContainer.add(lockOverlay)
        const lx = cx, ly = cy
        const lockG = this.add.graphics().setDepth(4)
        lockG.lineStyle(2, 0x888888, 1)
        lockG.beginPath()
        lockG.arc(lx, ly - 6, 7, Math.PI, 0, false)
        lockG.strokePath()
        lockG.fillStyle(0x666666, 1)
        lockG.fillRect(lx - 9, ly - 6, 18, 14)
        lockG.lineStyle(1, 0x888888, 1)
        lockG.strokeRect(lx - 9, ly - 6, 18, 14)
        lockG.fillStyle(0x222222, 1)
        lockG.fillCircle(lx, ly, 2)
        lockG.fillRect(lx - 1, ly, 2, 5)
        heroContainer.add(lockG)
      }

      // #12 Hero name below circle — bumped size + bold
      const nameText = this.add.text(cx, cy + circleRadius + (compact ? 10 : 16), isLocked ? '???' : hero.name, {
        fontFamily: gameFont(), fontSize: isPortrait ? '13px' : (compact ? '13px' : '16px'),
        color: isLocked ? '#555555' : colorHex,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2)
      heroContainer.add(nameText)

      // #3 Accent stripe under name
      if (!isLocked) {
        const stripe = this.add.graphics().setDepth(2)
        const stripeY = nameText.y + nameText.height / 2 + 2
        stripe.fillStyle(hero.color, 0.9)
        stripe.fillRect(cx - 20, stripeY, 40, 3)
        heroContainer.add(stripe)
      }

      // #9 Role pill below name
      const pillY = cy + circleRadius + (compact ? 28 : 38)
      const pillText = isLocked ? '???' : hero.role
      const pillFontSize = isPortrait ? '10px' : (compact ? '10px' : '11px')
      const pillLabel = this.add.text(cx, pillY, pillText, {
        fontFamily: gameFont(), fontSize: pillFontSize,
        color: isLocked ? '#666677' : colorHex,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2)
      const pillW = pillLabel.width + 12
      const pillH = pillLabel.height + 4
      const pillBg = this.add.graphics().setDepth(1)
      const pillFill = isLocked ? 0x333344 : hero.color
      const pillFillAlpha = isLocked ? 1 : 0.12
      const pillBorder = isLocked ? 0x555566 : hero.color
      const pillBorderAlpha = isLocked ? 1 : 0.6
      pillBg.fillStyle(pillFill, pillFillAlpha)
      pillBg.fillRoundedRect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH, 4)
      pillBg.lineStyle(1, pillBorder, pillBorderAlpha)
      pillBg.strokeRoundedRect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH, 4)
      heroContainer.add(pillBg)
      heroContainer.add(pillLabel)

      // #5 Idle breathe on circles (unlocked only)
      if (!isLocked && !reducedMotion) {
        this.tweens.add({
          targets: sprite,
          scale: { from: baseSpriteScale, to: baseSpriteScale * 1.02 },
          duration: 2200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: i * 140,
        })
      }

      // Interactive zone over the circle
      const zone = this.add.zone(cx, cy, circleRadius * 2, circleRadius * 2 + 50)
        .setInteractive({ useHandCursor: !isLocked })
      heroContainer.add(zone)

      heroEntryTargets.push(heroContainer)

      if (isLocked) {
        // #6 Hover tooltip (desktop) — replaces the text-on-tap UX, but tap still works on mobile
        const showTooltip = () => {
          closeTooltip()
          const hint = HERO_UNLOCK_HINTS[hero.type] || 'Play more runs to unlock.'
          const tooltipW = Math.max(circleRadius * 2 + 80, 180)
          // Build tooltip as a small container-like group (bg + text)
          const tipText = this.add.text(0, 0, hint, {
            fontFamily: gameFont(), fontSize: compact ? '10px' : '11px',
            color: '#fde68a',
            wordWrap: { width: tooltipW - 16 },
            align: 'center',
          }).setOrigin(0.5).setDepth(1001)
          const tw = Math.max(tipText.width + 16, 80)
          const th = tipText.height + 10
          const tx = cx
          const ty = cy - circleRadius - th / 2 - 12
          const tipBg = this.add.graphics().setDepth(1000)
          tipBg.fillStyle(0x1a1a2e, 0.95)
          tipBg.fillRoundedRect(tx - tw / 2, ty - th / 2, tw, th, 4)
          tipBg.lineStyle(1, 0x555566, 1)
          tipBg.strokeRoundedRect(tx - tw / 2, ty - th / 2, tw, th, 4)
          tipText.setPosition(tx, ty)
          // Group cleanup via hintTxt pointer — attach bg as data so we can destroy both
          tipText.setData('bg', tipBg)
          this.activeLockedHint = tipText
          // Add to scene body (under the transform) so it scales with the scene
          addToBody(tipBg as any)
          addToBody(tipText as any)
        }

        zone.on('pointerover', showTooltip)
        zone.on('pointerout', () => {
          if (this.activeLockedHint) {
            const bg = this.activeLockedHint.getData('bg') as Phaser.GameObjects.Graphics | undefined
            if (bg) bg.destroy()
            this.activeLockedHint.destroy()
            this.activeLockedHint = null
          }
        })

        zone.on('pointerdown', () => {
          // Mobile tap fallback — show tooltip briefly
          this.tweens.add({ targets: g, x: 3, duration: 40, yoyo: true, repeat: 2, onComplete: () => g.setX(0) })
          if (!this.activeLockedHint) showTooltip()
          if (this.activeLockedHint) {
            const tip = this.activeLockedHint
            const bg = tip.getData('bg') as Phaser.GameObjects.Graphics | undefined
            this.tweens.add({
              targets: [tip, bg].filter(Boolean),
              alpha: 0, duration: 500, delay: 1800,
              onComplete: () => {
                if (bg) bg.destroy()
                tip.destroy()
                if (this.activeLockedHint === tip) this.activeLockedHint = null
              },
            })
          }
        })
      } else {
        zone.on('pointerover', () => {
          if (this.selectedIndex !== i) {
            this.drawCircle(g, cx, cy, circleRadius, hero.color, true)
            // Kill breathe so hover scale wins
            this.tweens.killTweensOf(sprite)
            sprite.setScale(baseSpriteScale * 1.15)
            nameText.setColor('#ffffff')
          }
        })

        zone.on('pointerout', () => {
          if (this.selectedIndex !== i) {
            this.drawCircle(g, cx, cy, circleRadius, hero.color, false)
            this.tweens.killTweensOf(sprite)
            sprite.setScale(baseSpriteScale)
            nameText.setColor(colorHex)
            // Restart idle breathe
            if (!reducedMotion) {
              this.tweens.add({
                targets: sprite,
                scale: { from: baseSpriteScale, to: baseSpriteScale * 1.02 },
                duration: 2200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              })
            }
          }
        })

        zone.on('pointerdown', () => {
          if (this.popupRoot) return
          // Deselect previous
          if (this.selectedIndex >= 0 && this.selectedIndex !== i) {
            const prev = sortedHeroes[this.selectedIndex]
            const prevPos = cellPos(this.selectedIndex)
            this.drawCircle(this.circles[this.selectedIndex], prevPos.cx, prevPos.cy, circleRadius, prev.color, false)
          }

          this.selectedIndex = i
          this.drawCircle(g, cx, cy, circleRadius, hero.color, true)
          this.tweens.killTweensOf(sprite)
          sprite.setScale(baseSpriteScale * 1.15)

          this.openHeroPopup(hero)
        })
      }
    })

    // Notification bell — top-right
    new NotificationBell(this, width - (compact ? 22 : 30), compact ? 20 : 26)

    // #4 Staggered entry animation
    // Title + subtitle + chooseText + playerLabel: fade in starting at 120ms
    const headerTargets = [heroSelectTitle, subtitle, rule, chooseText].filter(Boolean)
    for (const o of headerTargets) (o as any).setAlpha(0)
    this.tweens.add({
      targets: headerTargets, alpha: 1,
      duration: 220, delay: 120, ease: 'Sine.easeOut',
    })
    // Hero containers: per-circle stagger
    heroEntryContainers.forEach((c, i) => {
      this.tweens.add({
        targets: c, alpha: 1,
        duration: 260, delay: 200 + i * 60, ease: 'Sine.easeOut',
      })
    })

    // #13 Exit transition — camera zoom-down + fade-out
    const exitToStart = () => {
      this.tweens.add({
        targets: this.cameras.main, zoom: 0.96, duration: 200, ease: 'Sine.easeIn',
      })
      this.cameras.main.fadeOut(200)
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('StartScene', { playerName: this.playerName })
      )
    }

    // #7 BACK button — circular + chevron, matches popup close-X style
    const backBtn = makeCircleButton(this, {
      x: compact ? 28 : 40,
      y: compact ? height - 22 : height * 0.92,
      radius: compact ? 13 : 16,
      icon: '‹',
      label: 'BACK',
      onClick: () => {
        if (this.popupRoot) { this.closeHeroPopup(); return }
        exitToStart()
      },
    })

    // Map toggle button — next to BACK, switches between Grasslands / Undead
    const mapBtnX = compact ? 90 : 120
    const mapBtnY = compact ? height - 22 : height * 0.92
    const mapBtn = makeCircleButton(this, {
      x: mapBtnX,
      y: mapBtnY,
      radius: compact ? 13 : 16,
      icon: '☠',
      label: this.selectedMap === 'GameScene' ? 'GRASS' : 'UNDEAD',
      onClick: () => {
        this.selectedMap = this.selectedMap === 'GameScene' ? 'UndeadMapScene' : 'GameScene'
        const isUndead = this.selectedMap === 'UndeadMapScene'
        mapBtn.iconText.setText(isUndead ? '🌿' : '☠')
        if (mapBtn.labelText) mapBtn.labelText.setText(isUndead ? 'UNDEAD' : 'GRASS')
      },
    })

    // Back button fades in last at 600ms
    const backObjs = [backBtn.graphics, backBtn.iconText, backBtn.labelText, mapBtn.graphics, mapBtn.iconText, mapBtn.labelText].filter(Boolean)
    for (const o of backObjs) (o as any).setAlpha(0)
    this.tweens.add({
      targets: backObjs, alpha: 1,
      duration: 220, delay: 600, ease: 'Sine.easeOut',
    })

    // ESC = back (close popup if open, else back to start)
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.popupRoot) { this.closeHeroPopup(); return }
      exitToStart()
    })
  }

  private buildPopupParticleConfig(style: ParticleStyle, tint: number, x: number, y: number, w: number, h: number): any {
    const rect = new Phaser.Geom.Rectangle(x, y, w, h)
    const base = {
      emitZone: { type: 'random', source: rect, quantity: 1 },
      tint,
      blendMode: 'ADD' as const,
    }
    switch (style) {
      case 'embers':
        return {
          ...base, blendMode: 'ADD',
          frequency: 120, lifespan: { min: 1400, max: 2200 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.9, end: 0 },
          speedY: { min: -18, max: -8 }, speedX: { min: -4, max: 4 },
        }
      case 'snow':
        return {
          ...base, blendMode: 'NORMAL',
          frequency: 200, lifespan: { min: 2200, max: 3200 },
          scale: { start: 0.45, end: 0.2 },
          alpha: { start: 0.8, end: 0 },
          speedY: { min: 8, max: 18 }, speedX: { min: -6, max: 6 },
          rotate: { min: 0, max: 360 },
        }
      case 'leaves':
        return {
          ...base, blendMode: 'NORMAL',
          frequency: 300, lifespan: { min: 2500, max: 3500 },
          scale: { start: 0.55, end: 0.25 },
          alpha: { start: 0.75, end: 0 },
          speedY: { min: 6, max: 14 }, speedX: { min: -10, max: 10 },
          rotate: { min: -45, max: 45 },
        }
      case 'sand':
        return {
          ...base, blendMode: 'NORMAL',
          frequency: 140, lifespan: { min: 1600, max: 2200 },
          scale: { start: 0.35, end: 0.1 },
          alpha: { start: 0.6, end: 0 },
          speedX: { min: 20, max: 40 }, speedY: { min: -2, max: 2 },
        }
      case 'void':
        return {
          ...base, blendMode: 'ADD',
          frequency: 200, lifespan: { min: 1800, max: 2600 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 0.75, end: 0 },
          speedY: { min: -6, max: 6 }, speedX: { min: -6, max: 6 },
        }
      case 'crystals':
        return {
          ...base, blendMode: 'ADD',
          frequency: 260, lifespan: { min: 1800, max: 2400 },
          scale: { start: 0.35, end: 0.1 },
          alpha: { start: 0.85, end: 0 },
          speedY: { min: -4, max: 4 }, speedX: { min: -4, max: 4 },
        }
      case 'sparks':
        return {
          ...base, blendMode: 'ADD',
          frequency: 150, lifespan: { min: 800, max: 1400 },
          scale: { start: 0.45, end: 0 },
          alpha: { start: 1, end: 0 },
          speedY: { min: -12, max: 12 }, speedX: { min: -12, max: 12 },
        }
      case 'plague':
        return {
          ...base, blendMode: 'NORMAL',
          frequency: 220, lifespan: { min: 2200, max: 3000 },
          scale: { start: 0.5, end: 0.15 },
          alpha: { start: 0.55, end: 0 },
          speedY: { min: -6, max: 6 }, speedX: { min: -4, max: 4 },
        }
    }
  }

  private closeHeroPopup() {
    if (!this.popupRoot) return
    const root = this.popupRoot
    this.popupRoot = null  // prevent double close
    if (this.popupKeyboardHandler) {
      this.input.keyboard?.off('keydown', this.popupKeyboardHandler)
      this.popupKeyboardHandler = null
    }
    if (this.popupTracerTween) {
      this.popupTracerTween.stop()
      this.popupTracerTween = null
    }
    if (this.popupPlayTracerTween) {
      this.popupPlayTracerTween.stop()
      this.popupPlayTracerTween = null
    }
    if (this.popupSwipeDownHandler) {
      this.input.off('pointerdown', this.popupSwipeDownHandler)
      this.popupSwipeDownHandler = null
    }
    if (this.popupSwipeUpHandler) {
      this.input.off('pointerup', this.popupSwipeUpHandler)
      this.popupSwipeUpHandler = null
    }
    // Fade out before destroy (reverse of open)
    this.tweens.add({
      targets: root, alpha: 0,
      duration: 160, ease: 'Sine.easeIn',
      onComplete: () => root.destroy(),
    })
  }

  private cycleToHero(direction: 1 | -1, currentHero: HeroDef) {
    const currentIdx = HEROES.findIndex(h => h.type === currentHero.type)
    if (currentIdx < 0) return
    const n = HEROES.length
    for (let step = 1; step < n; step++) {
      const idx = ((currentIdx + direction * step) % n + n) % n
      const candidate = HEROES[idx]
      if (MetaProgress.isHeroUnlocked(candidate.type)) {
        // Close current popup and open the new one. closeHeroPopup nulls
        // popupRoot + clears handlers synchronously, so openHeroPopup can be
        // called immediately while the old root fades out.
        this.closeHeroPopup()
        this.openHeroPopup(candidate)
        return
      }
    }
    // No other unlocked hero — do nothing
  }

  private openHeroPopup(hero: HeroDef) {
    const { width, height } = this.scale
    const compact = height < 500
    const colorHex = `#${hero.color.toString(16).padStart(6, '0')}`
    const PLAY_GREEN = 0x2ecc71
    const PLAY_GREEN_DARK = 0x1e7a43
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // Root container for entry animation
    const root = this.add.container(0, 0).setDepth(100)
    this.popupRoot = root

    // Modal dimmer — click outside panel closes
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0).setInteractive()
    dim.on('pointerdown', () => this.closeHeroPopup())
    root.add(dim)
    this.tweens.add({ targets: dim, fillAlpha: 0.72, duration: 180, ease: 'Sine.easeOut' })

    // ── Panel dimensions (wider, more breathing room between columns) ──
    const _portraitSize = compact ? 110 : 140
    const _rightTarget = compact ? 280 : 340
    const _colGapExtra = compact ? 20 : 36
    const _idealInnerW = _portraitSize + _colGapExtra + _rightTarget
    const panelW = Math.min(width * 0.94, _idealInnerW + (compact ? 24 : 36))
    const panelH = Math.min(height * 0.94, 560)
    const panelX = Math.round(width / 2 - panelW / 2)
    const panelY = Math.round(height / 2 - panelH / 2)

    // Inner content container (scale animated on open; alpha stays at 1 so per-group staggers read correctly)
    const body = this.add.container(0, 0)
    root.add(body)
    body.setScale(0.96)
    this.tweens.add({
      targets: body, scale: 1,
      duration: 260, ease: 'Back.easeOut',
    })
    // Per-group fade-in helper — tracks elements that should fade in with a delay
    const stagger = (objs: Phaser.GameObjects.GameObject[], delay: number, dur = 200) => {
      for (const o of objs) (o as any).setAlpha?.(0)
      this.tweens.add({ targets: objs, alpha: 1, duration: dur, delay, ease: 'Sine.easeOut' })
    }

    // Panel background — two-layer for depth
    const panel = this.add.graphics()
    panel.fillStyle(0x08080f, 0.98)
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12)
    // Top accent strip
    panel.fillStyle(hero.color, 0.12)
    panel.fillRoundedRect(panelX, panelY, panelW, 6, { tl: 12, tr: 12, bl: 0, br: 0 })
    panel.lineStyle(2, hero.color, 0.85)
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12)
    // Subtle vignette — 4 nested rounded rects for a soft center glow-through
    const vignetteAlphas = [0.06, 0.04, 0.02, 0.01]
    for (let i = 0; i < 4; i++) {
      const inset = (i + 1) * 10
      panel.fillStyle(0x000000, vignetteAlphas[i])
      panel.fillRoundedRect(
        panelX + inset, panelY + inset,
        panelW - inset * 2, panelH - inset * 2,
        Math.max(2, 12 - inset),
      )
    }
    body.add(panel)

    // Blocker zone — absorbs clicks over panel so dim's click-outside-to-close
    // only fires when clicking outside the panel area
    const panelBlocker = this.add.zone(panelX + panelW / 2, panelY + panelH / 2, panelW, panelH)
      .setInteractive()
    panelBlocker.on('pointerdown', () => { /* swallow */ })
    body.add(panelBlocker)

    // ── Layout zones ──
    const pad = compact ? 10 : 16
    const headerH = compact ? 28 : 38
    const btnH = compact ? 28 : 34
    const bonusH = compact ? 50 : 62
    const footerGap = compact ? 10 : 16
    const contentY = panelY + headerH
    // Pre-compute footer boundary so columns don't overflow into it
    const footerTopY = panelY + panelH - pad - btnH - footerGap - bonusH - footerGap

    // Hero name + role header
    const nameText = this.add.text(panelX + pad, panelY + (compact ? 7 : 10), hero.name.toUpperCase(), {
      fontFamily: gameFont(), fontSize: compact ? '14px' : '18px', color: colorHex,
      fontStyle: 'bold',
    }).setOrigin(0, 0)
    nameText.setShadow(0, 1, '#000000', 2, true, true)
    body.add(nameText)

    const roleText = this.add.text(panelX + pad + nameText.width + 10, panelY + (compact ? 10 : 15), hero.role, {
      fontFamily: gameFont(), fontSize: compact ? '9px' : '11px', color: '#888899',
    }).setOrigin(0, 0)
    body.add(roleText)

    // Divider under header
    const divider = this.add.graphics()
    divider.lineStyle(1, hero.color, 0.25)
    divider.lineBetween(panelX + pad, panelY + headerH - 2, panelX + panelW - pad, panelY + headerH - 2)
    body.add(divider)
    stagger([nameText, roleText, divider], 60)

    // ── Close X (top-right) ──
    const xSize = compact ? 20 : 24
    const xCx = panelX + panelW - pad - xSize / 2
    const xCy = panelY + (compact ? 7 : 10) + xSize / 2
    const xBg = this.add.graphics()
    const drawXBg = (hovered: boolean) => {
      xBg.clear()
      xBg.fillStyle(hovered ? 0x3a1420 : 0x1a1a28, 0.9)
      xBg.fillCircle(xCx, xCy, xSize / 2)
      xBg.lineStyle(1, hovered ? 0xff6677 : 0x555566, 1)
      xBg.strokeCircle(xCx, xCy, xSize / 2)
    }
    drawXBg(false)
    const xLabel = this.add.text(xCx, xCy, '×', {
      fontFamily: gameFont(), fontSize: compact ? '16px' : '20px', color: '#aaaabb',
    }).setOrigin(0.5, 0.5)
    const xZone = this.add.zone(xCx, xCy, xSize + 4, xSize + 4)
      .setInteractive({ useHandCursor: true })
    xZone.on('pointerover', () => { drawXBg(true); xLabel.setColor('#ffffff') })
    xZone.on('pointerout',  () => { drawXBg(false); xLabel.setColor('#aaaabb') })
    xZone.on('pointerdown', () => this.closeHeroPopup())
    body.add([xBg, xLabel, xZone])
    stagger([xBg, xLabel], 60)

    // ── Prev/Next hero arrows (left/right of panel) ──
    const hasOtherUnlocked = HEROES.some(h => h.type !== hero.type && MetaProgress.isHeroUnlocked(h.type))
    const arrowSize = compact ? 32 : 40
    const arrowGap = compact ? 14 : 20
    const makeArrow = (dir: 1 | -1) => {
      const cx = dir === -1
        ? panelX - arrowGap - arrowSize / 2
        : panelX + panelW + arrowGap + arrowSize / 2
      const cy = panelY + panelH / 2
      const abg = this.add.graphics()
      const drawArrowBg = (hovered: boolean) => {
        abg.clear()
        abg.fillStyle(hovered ? 0x22223a : 0x1a1a28, 0.85)
        abg.fillCircle(cx, cy, arrowSize / 2)
        abg.lineStyle(1, hovered ? 0x888899 : 0x555566, 1)
        abg.strokeCircle(cx, cy, arrowSize / 2)
      }
      drawArrowBg(false)
      const chev = this.add.text(cx, cy - 1, dir === 1 ? '›' : '‹', {
        fontFamily: gameFont(), fontSize: compact ? '20px' : '26px', color: '#aaaabb',
        fontStyle: 'bold',
      }).setOrigin(0.5)
      const zone = this.add.zone(cx, cy, arrowSize + 8, arrowSize + 8)
        .setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => { drawArrowBg(true); chev.setColor('#ffffff') })
      zone.on('pointerout', () => { drawArrowBg(false); chev.setColor('#aaaabb') })
      zone.on('pointerdown', () => {
        if (!hasOtherUnlocked) {
          // Dead click — small shake feedback
          this.tweens.add({
            targets: [abg, chev], x: '+=2',
            yoyo: true, duration: 50, repeat: 2,
          })
          return
        }
        this.cycleToHero(dir, hero)
      })
      body.add([abg, chev, zone])
      stagger([abg, chev], 100)
    }
    makeArrow(-1)
    makeArrow(1)

    // ── Two-column content layout ──
    const colGap = _colGapExtra
    const innerW = panelW - pad * 2
    const portraitSize = _portraitSize
    const leftColW = portraitSize
    const rightColW = innerW - colGap - leftColW
    const leftColX = panelX + pad
    const rightColX = leftColX + leftColW + colGap
    const colY = contentY + (compact ? 4 : 8)

    // ── Left column: portrait + stats + desc + stance info ──
    const portraitX = leftColX
    const portraitY = colY
    const portraitW = portraitSize
    const portraitH = portraitSize

    // Layered gold glow behind portrait frame (minimalistic halo)
    const GOLD = 0xffd700
    const goldGlow = this.add.graphics()
    for (let i = 4; i >= 1; i--) {
      const off = i * 3
      goldGlow.fillStyle(GOLD, 0.045 + (5 - i) * 0.008)
      goldGlow.fillRoundedRect(portraitX - off, portraitY - off, portraitW + off * 2, portraitH + off * 2, 8 + off)
    }
    body.add(goldGlow)

    // Portrait frame with hero-color aura inside
    const pf = this.add.graphics()
    pf.fillStyle(0x040410, 1)
    pf.fillRoundedRect(portraitX, portraitY, portraitW, portraitH, 8)
    const auraCx = portraitX + portraitW / 2
    const auraCy = portraitY + portraitH / 2
    const auraR = portraitW * 0.55
    for (let i = 6; i >= 1; i--) {
      pf.fillStyle(hero.color, 0.04 + (7 - i) * 0.012)
      pf.fillCircle(auraCx, auraCy, (auraR * i) / 6)
    }
    // Subtle gold inner line + hero-color outer line (double border)
    pf.lineStyle(1, GOLD, 0.35)
    pf.strokeRoundedRect(portraitX + 2, portraitY + 2, portraitW - 4, portraitH - 4, 6)
    pf.lineStyle(1.5, hero.color, 0.8)
    pf.strokeRoundedRect(portraitX, portraitY, portraitW, portraitH, 8)
    body.add(pf)

    // Gold L-bracket accents at portrait frame corners (bevel feel)
    const br = this.add.graphics()
    br.lineStyle(2, 0xfde68a, 0.85)
    const brLen = 12
    const brPad = 2
    const brL = portraitX - brPad
    const brT = portraitY - brPad
    const brR = portraitX + portraitW + brPad
    const brB = portraitY + portraitH + brPad
    // top-left
    br.lineBetween(brL, brT + brLen, brL, brT)
    br.lineBetween(brL, brT, brL + brLen, brT)
    // top-right
    br.lineBetween(brR - brLen, brT, brR, brT)
    br.lineBetween(brR, brT, brR, brT + brLen)
    // bottom-right
    br.lineBetween(brR, brB - brLen, brR, brB)
    br.lineBetween(brR, brB, brR - brLen, brB)
    // bottom-left
    br.lineBetween(brL + brLen, brB, brL, brB)
    br.lineBetween(brL, brB, brL, brB - brLen)
    body.add(br)

    // Animated gold tracer — thin line travels clockwise along the frame perimeter
    const tracer = this.add.graphics()
    body.add(tracer)
    const tracerLen = Math.max(14, Math.floor(portraitW * 0.22))
    const perimeter = 2 * (portraitW + portraitH)
    const tracerState = { t: 0 }
    // Compute (x,y) on the rectangle perimeter at distance d (clockwise from top-left)
    const perimeterPoint = (rx: number, ry: number, rw: number, rh: number, d: number) => {
      const dd = ((d % perimeter) + perimeter) % perimeter
      if (dd < rw)                 return { x: rx + dd,          y: ry }
      if (dd < rw + rh)            return { x: rx + rw,          y: ry + (dd - rw) }
      if (dd < rw * 2 + rh)        return { x: rx + rw - (dd - rw - rh), y: ry + rh }
      return { x: rx, y: ry + rh - (dd - rw * 2 - rh) }
    }
    const drawTracer = () => {
      if (!tracer.active) return
      tracer.clear()
      // Compute head + tail positions along the rectangle perimeter
      const headDist = tracerState.t * perimeter
      // Draw several fading segments to form a trailing streak
      const segments = 10
      for (let s = segments - 1; s >= 0; s--) {
        const f = s / segments
        const dist = (headDist - tracerLen * f + perimeter) % perimeter
        const next = (dist + tracerLen / segments) % perimeter
        const p1 = perimeterPoint(portraitX, portraitY, portraitW, portraitH, dist)
        const p2 = perimeterPoint(portraitX, portraitY, portraitW, portraitH, next)
        const alpha = 0.15 + (1 - f) * 0.75
        tracer.lineStyle(1.5, GOLD, alpha)
        tracer.lineBetween(p1.x, p1.y, p2.x, p2.y)
      }
    }
    if (reducedMotion) {
      // Single static frame — no loop
      drawTracer()
    } else {
      this.popupTracerTween = this.tweens.add({
        targets: tracerState, t: 1,
        duration: 3200, repeat: -1, ease: 'Linear',
        onUpdate: drawTracer,
      })
    }

    // Animated portrait sprite — bigger than circle select, bottom-aligned to frame
    const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
    const pcx = portraitX + portraitW / 2
    const sprScale = hero.scale * 1.6 * (HERO_POPUP_SCALE[hero.type] || 1)
    const sprDisplayH = hero.fh * sprScale
    const bottomPad = compact ? 4 : 6
    const yNudge = HERO_POPUP_Y_NUDGE[hero.type] || 0
    const pcy = portraitY + portraitH - sprDisplayH / 2 - bottomPad + yNudge
    const portrait = this.add.sprite(pcx, pcy, texKey, hero.frameStart ?? 0)
      .setScale(sprScale)
    if (hero.tint) portrait.setTint(hero.tint)
    portrait.play(`start_idle_${hero.type}`)
    const maskShape = this.make.graphics({ x: 0, y: 0 })
    maskShape.fillStyle(0xffffff)
    maskShape.fillRoundedRect(portraitX + 3, portraitY + 3, portraitW - 6, portraitH - 6, 6)
    portrait.setMask(maskShape.createGeometryMask())
    body.add(portrait)
    // Attack animation (for "play attack on stance select")
    const attackDef = HERO_POPUP_ATTACK[hero.type]
    const attackAnimKey = `popup_attack_${hero.type}`
    const idleAnimKey = `start_idle_${hero.type}`
    if (attackDef && !this.anims.exists(attackAnimKey)) {
      const atkTex = `popup_atk_${hero.type}`
      if (this.textures.exists(atkTex)) {
        this.anims.create({
          key: attackAnimKey,
          frames: this.anims.generateFrameNumbers(atkTex, { start: 0, end: attackDef.frames - 1 }),
          frameRate: attackDef.frameRate ?? 14,
          repeat: 0,
        })
      }
    }

    // Stagger in the portrait assembly
    stagger([goldGlow, pf, portrait, tracer], 120, 260)

    // Idle breathe — subtle sine rotation on portrait
    if (!reducedMotion) {
      this.tweens.add({
        targets: portrait, angle: { from: -1.2, to: 1.2 },
        duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
    }

    // Hero-themed ambient particles inside portrait frame
    const pStyle = HERO_PARTICLES[hero.type]
    if (pStyle) {
      const emitterConfig = this.buildPopupParticleConfig(
        pStyle.style, pStyle.tint,
        portraitX + 4, portraitY + 4, portraitW - 8, portraitH - 8,
      )
      const emitter = this.add.particles(0, 0, 'popup_particle', emitterConfig)
      emitter.setDepth(103)
      // Clip to portrait frame with the same mask shape as the sprite
      const pMaskShape = this.make.graphics({ x: 0, y: 0 })
      pMaskShape.fillStyle(0xffffff)
      pMaskShape.fillRoundedRect(portraitX + 3, portraitY + 3, portraitW - 6, portraitH - 6, 6)
      emitter.setMask(pMaskShape.createGeometryMask())
      body.add(emitter)
      // Stagger in with the rest of the portrait assembly
      stagger([emitter], 160, 300)
    }

    // Stats block — below portrait, aligned to portrait width (not full column)
    const statsX = portraitX
    const statsY = portraitY + portraitH + (compact ? 6 : 10)
    const statsW = portraitW
    const def = HERO_DEFS[hero.type]
    const atkPerSec = 1000 / def.cooldown
    const rangeMeters = def.range / 10
    const statRows: Array<[string, string, number]> = [
      ['HEALTH',   `${def.hp}`,                  def.hp     / 200],
      ['SPEED',    `${def.speed}`,               def.speed  / 220],
      ['DAMAGE',   `${def.damage}`,              def.damage / 40],
      ['ATK SPD',  `${atkPerSec.toFixed(1)}/s`,  atkPerSec  / 2.5],
      ['RANGE',    `${rangeMeters.toFixed(0)} m`, rangeMeters / 32],
    ]
    const statFontSize = compact ? '10px' : '11px'
    const statRowH = compact ? 18 : 21
    statRows.forEach(([label, val, ratio], idx) => {
      const ly = statsY + idx * statRowH
      const labelTxt = this.add.text(statsX, ly, label, {
        fontFamily: gameFont(), fontSize: statFontSize, color: '#8a8a9e',
      }).setOrigin(0, 0).setAlpha(0)
      const valTxt = this.add.text(statsX + statsW, ly, val, {
        fontFamily: gameFont(), fontSize: statFontSize, color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(1, 0).setAlpha(0)
      this.tweens.add({
        targets: [labelTxt, valTxt], alpha: 1,
        duration: 220, delay: 200 + idx * 70, ease: 'Sine.easeOut',
      })
      // Animated bar fill — grow from 0 to target with stagger
      const barY = ly + (compact ? 13 : 15)
      const barW = statsW
      const barBg = this.add.graphics()
      body.add([labelTxt, valTxt, barBg])
      const targetFill = Math.max(2, Math.min(barW, Math.round(Math.min(1, ratio) * barW)))
      // Initial draw: track only
      barBg.fillStyle(0x1a1a2a, 1)
      barBg.fillRect(statsX, barY, barW, 2)
      // Tween a proxy object from 0 → targetFill, redraw each step
      const proxy = { w: 0 }
      this.tweens.add({
        targets: proxy,
        w: targetFill,
        duration: 480,
        delay: 220 + idx * 70,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          barBg.clear()
          barBg.fillStyle(0x1a1a2a, 1)
          barBg.fillRect(statsX, barY, barW, 2)
          barBg.fillStyle(hero.color, 0.9)
          barBg.fillRect(statsX, barY, Math.round(proxy.w), 2)
          // Tick markers at 25/50/75%
          for (const t of [0.25, 0.5, 0.75]) {
            const tx = statsX + Math.round(barW * t)
            barBg.fillStyle(0x000000, 0.5)
            barBg.fillRect(tx, barY - 1, 1, 4)
          }
        },
      })
      // MAX state: tint the value gold instead of adding an overflowing label
      if (ratio >= 1) {
        valTxt.setColor('#fde68a')
      }
    })

    // Per-hero run statistics (computed from MetaProgress)
    let leftColumnBottomY = statsY + statRows.length * statRowH + (compact ? 8 : 12)
    {
      const meta = MetaProgress.load()
      const runs = meta.heroRuns[hero.type] || 0
      const totalKills = meta.heroKills[hero.type] || 0
      const totalTimeMs = meta.heroTimeMs[hero.type] || 0
      const totalMin = Math.floor(totalTimeMs / 60000)
      const timeStr = totalMin >= 60
        ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
        : `${totalMin}m`

      // Hero stats — same visual style as the stat bars above, with a bold header
      const hsY = statsY + statRows.length * statRowH + (compact ? 8 : 12)

      // Bold section header
      const hsLabel = this.add.text(portraitX, hsY, 'HERO STATS', {
        fontFamily: gameFont(), fontSize: statFontSize, color: '#888899',
        fontStyle: 'bold',
      }).setOrigin(0, 0)
      body.add(hsLabel)

      // Thin separator line under header (same width as portrait)
      const hsSep = this.add.graphics()
      hsSep.lineStyle(1, hero.color, 0.3)
      hsSep.lineBetween(portraitX, hsY + (compact ? 14 : 16), portraitX + portraitW, hsY + (compact ? 14 : 16))
      body.add(hsSep)

      const hsDataY = hsY + (compact ? 18 : 22)
      const hsEntries: Array<[string, string]> = [
        ['RUNS', `${runs}`],
        ['KILLS', totalKills > 999 ? `${(totalKills / 1000).toFixed(1)}k` : `${totalKills}`],
        ['TIME', timeStr],
      ]
      const hsTexts: Phaser.GameObjects.Text[] = []
      hsEntries.forEach(([label, val], idx) => {
        const ly = hsDataY + idx * statRowH
        const l = this.add.text(statsX, ly, label, {
          fontFamily: gameFont(), fontSize: statFontSize, color: '#8a8a9e',
        }).setOrigin(0, 0)
        const v = this.add.text(statsX + statsW, ly, val, {
          fontFamily: gameFont(), fontSize: statFontSize, color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(1, 0)
        body.add([l, v])
        hsTexts.push(l, v)
      })
      // Bottom edge for card alignment
      leftColumnBottomY = Math.min(hsDataY + hsEntries.length * statRowH + (compact ? 4 : 6), footerTopY)
      stagger([hsLabel, hsSep, ...hsTexts], 560, 240)
    }

    // ── Right column: 3 vertical stance cards ──
    const allBranches: BranchDef[] = HERO_BRANCHES[hero.type] || []
    const unlockedNames = MetaProgress.getUnlockedBranches(hero.type)
    const anyUnlocked = unlockedNames.includes('__all__')
    const branches = allBranches.slice(0, 3)

    const stanceGap = compact ? 6 : 9
    const cardW = rightColW
    const stanceAreaH = Math.min(leftColumnBottomY, footerTopY) - colY
    const cardH = Math.floor((stanceAreaH - stanceGap * 2) / 3)

    let chosenBranchName: string | null = null
    const cardGfx: Phaser.GameObjects.Graphics[] = []
    const cardContainers: Phaser.GameObjects.Container[] = []
    const cardGlows: Phaser.GameObjects.Graphics[] = []
    const cardRefs: Array<{ b: BranchDef; locked: boolean }> = []
    const cardIcons: (Phaser.GameObjects.Image | null)[] = []

    // ── Starting-bonus panel (two-row: header + description) ──
    const previewBoxH = bonusH
    const previewBoxX = panelX + pad
    const previewBoxW = innerW
    const previewY = panelY + panelH - pad - btnH - footerGap - previewBoxH
    const previewPadX = compact ? 12 : 16
    const previewTopY = previewY + (compact ? 6 : 9)
    const previewBottomY = previewY + (compact ? 22 : 28)

    const previewBg = this.add.graphics().setAlpha(0)
    // Row 1: small label (left) + skill name (right of label)
    const previewLabel = this.add.text(previewBoxX + previewPadX, previewTopY, 'STARTING BONUS', {
      fontFamily: gameFont(), fontSize: compact ? '9px' : '10px', color: '#888899',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setAlpha(0)
    const previewSkill = this.add.text(previewBoxX + previewPadX, previewTopY - 1, '', {
      fontFamily: gameFont(), fontSize: compact ? '12px' : '14px', color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setAlpha(0)
    // Row 2: full-width description (wraps if long)
    const previewDesc = this.add.text(previewBoxX + previewPadX, previewBottomY, '', {
      fontFamily: gameFont(), fontSize: compact ? '10px' : '11px', color: '#cccccc',
      wordWrap: { width: previewBoxW - previewPadX * 2 }, lineSpacing: 1,
    }).setOrigin(0, 0).setAlpha(0)
    body.add([previewBg, previewLabel, previewSkill, previewDesc])

    const updatePreview = (b: BranchDef | null) => {
      if (!b) {
        this.tweens.killTweensOf([previewBg, previewLabel, previewSkill, previewDesc])
        previewBg.setAlpha(0)
        previewLabel.setAlpha(0)
        previewSkill.setAlpha(0)
        previewDesc.setAlpha(0)
        return
      }
      const first = b.upgrades[0]
      if (!first) return
      const firstLine = first.desc[0] || ''
      previewSkill.setText(first.label.toUpperCase())
      previewSkill.setColor(`#${b.color.toString(16).padStart(6, '0')}`)
      previewDesc.setText(firstLine)
      // Skill label sits to the right of "STARTING BONUS" label with a divider dot
      previewSkill.setX(previewBoxX + previewPadX + previewLabel.width + 10)
      // Redraw background in branch color
      previewBg.clear()
      previewBg.fillStyle(b.color, 0.12)
      previewBg.fillRoundedRect(previewBoxX, previewY, previewBoxW, previewBoxH, 8)
      previewBg.lineStyle(1.5, b.color, 0.9)
      previewBg.strokeRoundedRect(previewBoxX, previewY, previewBoxW, previewBoxH, 8)
      // Left accent stripe
      previewBg.fillStyle(b.color, 0.9)
      previewBg.fillRoundedRect(previewBoxX, previewY, 4, previewBoxH, { tl: 8, tr: 0, bl: 8, br: 0 })
      // Fade in all layers
      this.tweens.killTweensOf([previewBg, previewLabel, previewSkill, previewDesc])
      previewBg.setAlpha(0)
      previewLabel.setAlpha(0)
      previewSkill.setAlpha(0)
      previewDesc.setAlpha(0)
      this.tweens.add({
        targets: [previewBg, previewLabel, previewSkill, previewDesc],
        alpha: 1, duration: 240, ease: 'Sine.easeOut',
      })
    }

    // ── Footer buttons (declared before stance cards so click handlers capture them) ──
    const btnW = compact ? 100 : 140
    const btnGap = compact ? 12 : 18
    const btnsTotalW = btnW * 2 + btnGap
    const btnY = panelY + panelH - pad - btnH
    const centerX = panelX + panelW / 2

    // PLAY (left, green)
    const playX = Math.round(centerX - btnsTotalW / 2)
    const playW = btnW
    const playH = btnH
    const playY = btnY
    // Glow ring rendered behind the button, animated when enabled
    const playGlow = this.add.graphics().setAlpha(0)
    playGlow.fillStyle(PLAY_GREEN, 0.35)
    playGlow.fillRoundedRect(playX - 6, playY - 6, playW + 12, playH + 12, 12)
    body.add(playGlow)

    // Gold-style tracer around PLAY button (activated on stance select)
    const playTracer = this.add.graphics().setAlpha(0)
    body.add(playTracer)
    const playPerimeter = 2 * (playW + playH)
    const playTracerLen = Math.max(12, Math.floor(playW * 0.25))
    const playTracerState = { t: 0 }
    const playPerimPoint = (d: number) => {
      const dd = ((d % playPerimeter) + playPerimeter) % playPerimeter
      if (dd < playW)                  return { x: playX + dd,          y: playY }
      if (dd < playW + playH)          return { x: playX + playW,       y: playY + (dd - playW) }
      if (dd < playW * 2 + playH)      return { x: playX + playW - (dd - playW - playH), y: playY + playH }
      return { x: playX, y: playY + playH - (dd - playW * 2 - playH) }
    }
    const drawPlayTracer = () => {
      if (!playTracer.active) return
      playTracer.clear()
      const headDist = playTracerState.t * playPerimeter
      const segments = 8
      for (let s = segments - 1; s >= 0; s--) {
        const f = s / segments
        const dist = (headDist - playTracerLen * f + playPerimeter) % playPerimeter
        const next = (dist + playTracerLen / segments) % playPerimeter
        const p1 = playPerimPoint(dist)
        const p2 = playPerimPoint(next)
        const alpha = 0.2 + (1 - f) * 0.8
        playTracer.lineStyle(1.5, 0xfff2a8, alpha)
        playTracer.lineBetween(p1.x, p1.y, p2.x, p2.y)
      }
    }
    const playBg = this.add.graphics()
    const drawPlayBg = (enabled: boolean, hovered: boolean) => {
      playBg.clear()
      if (enabled) {
        const fillCol = hovered ? PLAY_GREEN : PLAY_GREEN_DARK
        playBg.fillStyle(fillCol, 1)
        playBg.fillRoundedRect(playX, playY, playW, playH, 8)
        playBg.lineStyle(2, PLAY_GREEN, 1)
        playBg.strokeRoundedRect(playX, playY, playW, playH, 8)
      } else {
        playBg.fillStyle(0x142018, 0.9)
        playBg.fillRoundedRect(playX, playY, playW, playH, 8)
        playBg.lineStyle(1, 0x2a4a34, 0.7)
        playBg.strokeRoundedRect(playX, playY, playW, playH, 8)
      }
    }
    drawPlayBg(false, false)
    const playLabel = this.add.text(playX + playW / 2, playY + playH / 2, 'PLAY', {
      fontFamily: gameFont(), fontSize: compact ? '14px' : '17px', color: '#6a9b75',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    // Ensure PLAY label + zone render above the glow pulse ring
    playBg.setDepth(1)
    playLabel.setDepth(2)
    const playZone = this.add.zone(playX + playW / 2, playY + playH / 2, playW, playH)
      .setInteractive({ useHandCursor: true }).setDepth(3)
    playZone.on('pointerover', () => { if (chosenBranchName) drawPlayBg(true, true) })
    playZone.on('pointerout',  () => { if (chosenBranchName) drawPlayBg(true, false) })
    playZone.on('pointerdown', () => {
      if (!chosenBranchName) {
        // Pulse stance cards to point user at what they need to pick
        for (const cc of cardContainers) {
          this.tweens.add({
            targets: cc, alpha: { from: 1, to: 0.55 },
            yoyo: true, duration: 140, repeat: 1,
          })
        }
        return
      }
      // Press-depth feedback
      this.tweens.add({
        targets: [playBg, playLabel], y: '+=1',
        yoyo: true, duration: 80,
      })
      const isMob = isMobileDevice()
      if (isMob) {
        const el = document.documentElement as any
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {})
          if (p && typeof p.then === 'function') {
            p.then(() => { (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {}) })
          }
        } else {
          (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
        }
      }
      unlockHero(hero.type)
      const branchPicked = chosenBranchName
      this.cameras.main.flash(200, 255, 255, 255, false, (_c: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) {
          this.scene.start('LoadingScene', {
            hero: hero.type, map: this.selectedMap,
            playerName: this.playerName,
            startingBranch: branchPicked,
          })
        }
      })
    })
    body.add([playBg, playLabel, playZone])

    // BACK (right)
    const backX = playX + btnW + btnGap
    const backBg = this.add.graphics()
    const drawBackBg = (hovered: boolean) => {
      backBg.clear()
      backBg.fillStyle(hovered ? 0x22223a : 0x16162a, 0.95)
      backBg.fillRoundedRect(backX, btnY, btnW, btnH, 8)
      backBg.lineStyle(1, hovered ? 0x888899 : 0x555566, 1)
      backBg.strokeRoundedRect(backX, btnY, btnW, btnH, 8)
    }
    drawBackBg(false)
    const backLabel = this.add.text(backX + btnW / 2, btnY + btnH / 2, 'BACK', {
      fontFamily: gameFont(), fontSize: compact ? '14px' : '17px', color: '#aaaabb',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    const backZone = this.add.zone(backX + btnW / 2, btnY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true })
    backZone.on('pointerover', () => { drawBackBg(true); backLabel.setColor('#ffffff') })
    backZone.on('pointerout',  () => { drawBackBg(false); backLabel.setColor('#aaaabb') })
    backZone.on('pointerdown', () => {
      this.tweens.add({
        targets: [backBg, backLabel], y: '+=1',
        yoyo: true, duration: 80,
      })
      this.closeHeroPopup()
    })
    body.add([backBg, backLabel, backZone])
    // Buttons always visible (no stagger — avoids alpha conflicts during hero cycling)

    // ── Stance card redraw (horizontal cards, stacked vertically in right column) ──
    const redrawCard = (i: number, hovered: boolean) => {
      const g = cardGfx[i]
      const ref = cardRefs[i]
      const cx = rightColX
      const cy = colY + i * (cardH + stanceGap)
      g.clear()
      const selected = chosenBranchName === ref.b.name
      const baseCol = ref.locked ? 0x0a0a14 : (selected ? 0x161630 : (hovered ? 0x121226 : 0x0c0c1a))
      g.fillStyle(baseCol, 0.98)
      g.fillRoundedRect(cx, cy, cardW, cardH, 8)
      if (selected && !ref.locked) {
        g.fillStyle(ref.b.color, 0.1)
        g.fillRoundedRect(cx, cy, cardW, cardH, 8)
      }
      // Left accent stripe (vertical cards are horizontal, so stripe on left edge)
      if (!ref.locked) {
        g.fillStyle(ref.b.color, selected ? 0.95 : (hovered ? 0.7 : 0.4))
        g.fillRoundedRect(cx, cy, 3, cardH, { tl: 8, tr: 0, bl: 8, br: 0 })
      }
      const borderColor = ref.locked ? 0x33333a : ref.b.color
      const borderAlpha = selected ? 1 : (hovered ? 0.8 : 0.4)
      g.lineStyle(selected ? 2.5 : 1.5, borderColor, borderAlpha)
      g.strokeRoundedRect(cx, cy, cardW, cardH, 8)
    }

    branches.forEach((b, i) => {
      const locked = !anyUnlocked && !unlockedNames.includes(b.name)
      const cx = rightColX
      const cy = colY + i * (cardH + stanceGap)

      const cardContainer = this.add.container(0, 0)
      cardContainers.push(cardContainer)
      body.add(cardContainer)

      // Soft branch-color halo behind card (visible only when selected)
      const glow = this.add.graphics().setAlpha(0)
      cardGlows.push(glow)
      if (!locked) {
        for (let k = 4; k >= 1; k--) {
          const off = k * 4
          glow.fillStyle(b.color, 0.06 + (5 - k) * 0.02)
          glow.fillRoundedRect(cx - off, cy - off, cardW + off * 2, cardH + off * 2, 8 + off)
        }
      }
      cardContainer.add(glow)

      const g = this.add.graphics()
      cardGfx.push(g)
      cardRefs.push({ b, locked })
      cardContainer.add(g)
      redrawCard(i, false)

      const bColorHex = `#${b.color.toString(16).padStart(6, '0')}`

      // Icon — circular, left side of card
      const iconSize = Math.min(compact ? 30 : 40, cardH - 12)
      const iconCx = cx + iconSize / 2 + (compact ? 10 : 14)
      const iconCy = cy + cardH / 2
      const firstUpgrade = b.upgrades[0]
      if (firstUpgrade) {
        const fit = getIconTexture(firstUpgrade.icon, this)
        const iconBg = this.add.graphics()
        iconBg.fillStyle(0x000000, 0.55)
        iconBg.fillCircle(iconCx, iconCy, iconSize / 2 + 2)
        iconBg.lineStyle(1.5, locked ? 0x333333 : b.color, locked ? 0.5 : 0.9)
        iconBg.strokeCircle(iconCx, iconCy, iconSize / 2 + 2)
        cardContainer.add(iconBg)
        if (this.textures.exists(fit.key)) {
          const icon = this.add.image(iconCx, iconCy, fit.key, fit.frame)
          // Use scale (not setDisplaySize) so we can tween scale on hover
          const srcW = icon.width || iconSize
          const srcH = icon.height || iconSize
          const baseScale = iconSize / Math.max(srcW, srcH)
          icon.setScale(baseScale)
          icon.setData('baseScale', baseScale)
          if (locked) icon.setTint(0x333333)
          cardContainer.add(icon)
          cardIcons.push(locked ? null : icon)
        } else {
          cardIcons.push(null)
        }
      } else {
        cardIcons.push(null)
      }

      // Text column to the right of the icon
      const textX = iconCx + iconSize / 2 + (compact ? 8 : 12)
      const textW = cx + cardW - textX - (compact ? 8 : 12)

      // Branch name
      const titleY = cy + (compact ? 8 : 10)
      const title = this.add.text(textX, titleY, b.name.toUpperCase(), {
        fontFamily: gameFont(), fontSize: compact ? '12px' : '14px',
        color: locked ? '#555555' : bColorHex,
        fontStyle: 'bold',
      }).setOrigin(0, 0)
      title.setShadow(0, 1, '#000000', 2, true, true)
      cardContainer.add(title)

      // Theme
      const themeY = titleY + (compact ? 14 : 17)
      const themeTxt = locked
        ? 'LOCKED — complete tutorial'
        : (b.theme || '')
      if (themeTxt) {
        const theme = this.add.text(textX, themeY, themeTxt, {
          fontFamily: gameFont(), fontSize: compact ? '9px' : '10px',
          color: locked ? '#444444' : '#bbbbcc',
          wordWrap: { width: textW }, lineSpacing: 1,
        }).setOrigin(0, 0)
        cardContainer.add(theme)
      }

      // Branch summary — bold bonus line, bottom of card
      if (!locked) {
        const summary = BRANCH_SUMMARY[b.name] || ''
        if (summary) {
          const summaryText = this.add.text(textX, cy + cardH - (compact ? 8 : 10), summary, {
            fontFamily: gameFont(), fontSize: compact ? '9px' : '10px',
            color: '#dddde8',
            fontStyle: 'bold',
            wordWrap: { width: textW }, lineSpacing: 2,
          }).setOrigin(0, 1)
          cardContainer.add(summaryText)
        }
      }

      const zone = this.add.zone(cx + cardW / 2, cy + cardH / 2, cardW, cardH)
        .setInteractive({ useHandCursor: !locked })
      cardContainer.add(zone)

      if (locked) {
        zone.on('pointerdown', () => {
          this.tweens.add({ targets: cardContainer, x: 3, duration: 40, yoyo: true, repeat: 2, onComplete: () => cardContainer.setX(0) })
        })
        return
      }

      zone.on('pointerover', () => {
        if (chosenBranchName !== b.name) {
          redrawCard(i, true)
          this.tweens.killTweensOf(cardContainer)
          this.tweens.add({ targets: cardContainer, x: -3, duration: 140, ease: 'Sine.easeOut' })
        }
        const hoverIcon = cardIcons[i]
        if (hoverIcon) {
          const base = (hoverIcon.getData('baseScale') as number) || hoverIcon.scale
          this.tweens.killTweensOf(hoverIcon)
          this.tweens.add({
            targets: hoverIcon, scale: { from: hoverIcon.scale, to: base * 1.1 },
            duration: 200, ease: 'Sine.easeOut',
          })
        }
      })
      zone.on('pointerout', () => {
        if (chosenBranchName !== b.name) {
          redrawCard(i, false)
          this.tweens.killTweensOf(cardContainer)
          this.tweens.add({ targets: cardContainer, x: 0, duration: 140, ease: 'Sine.easeOut' })
        }
        const hoverIcon = cardIcons[i]
        if (hoverIcon) {
          const base = (hoverIcon.getData('baseScale') as number) || hoverIcon.scale / 1.1
          this.tweens.killTweensOf(hoverIcon)
          this.tweens.add({
            targets: hoverIcon, scale: base,
            duration: 200, ease: 'Sine.easeOut',
          })
        }
      })
      zone.on('pointerdown', () => selectStance(i))
    })

    // Shine sweep — diagonal light bar sliding across the newly selected card
    const shineSweep = (cardIdx: number) => {
      const cx = rightColX
      const cy = colY + cardIdx * (cardH + stanceGap)
      const shine = this.add.graphics()
      cardContainers[cardIdx].add(shine)
      // Mask the shine to the card rect so it doesn't bleed out
      const shineMask = this.make.graphics({ x: 0, y: 0 })
      shineMask.fillStyle(0xffffff)
      shineMask.fillRoundedRect(cx, cy, cardW, cardH, 8)
      shine.setMask(shineMask.createGeometryMask())
      const proxy = { t: -0.4 }
      const shineW = 30
      const drawShine = () => {
        shine.clear()
        const px = cx + proxy.t * (cardW + shineW * 2) - shineW
        // 3 stacked diagonal lines with fading alpha for a band effect
        for (let k = 0; k < 3; k++) {
          const a = [0.28, 0.22, 0.14][k]
          const xs = px + k * 6
          shine.fillStyle(0xffffff, a)
          shine.beginPath()
          shine.moveTo(xs, cy)
          shine.lineTo(xs + shineW, cy)
          shine.lineTo(xs + shineW - cardH * 0.4, cy + cardH)
          shine.lineTo(xs - cardH * 0.4, cy + cardH)
          shine.closePath()
          shine.fillPath()
        }
      }
      this.tweens.add({
        targets: proxy, t: 1.2,
        duration: 500, ease: 'Sine.easeOut',
        onUpdate: drawShine,
        onComplete: () => shine.destroy(),
      })
    }

    // ── Stance selection helper (shared by click + keyboard) ──
    const selectStance = (i: number) => {
      const ref = cardRefs[i]
      if (!ref || ref.locked) return
      if (chosenBranchName === ref.b.name) return  // already selected — no jitter
      chosenBranchName = ref.b.name
      shineSweep(i)
      for (let j = 0; j < cardGfx.length; j++) redrawCard(j, false)
      for (let j = 0; j < cardContainers.length; j++) {
        this.tweens.killTweensOf(cardContainers[j])
        this.tweens.add({
          targets: cardContainers[j],
          x: j === i ? -5 : 0,
          duration: 180, ease: 'Sine.easeOut',
        })
        // Fade glow: on for selected, off for others
        this.tweens.killTweensOf(cardGlows[j])
        this.tweens.add({
          targets: cardGlows[j],
          alpha: j === i ? 1 : 0,
          duration: 220, ease: 'Sine.easeOut',
        })
      }
      // Enable PLAY — green fill + bright label + glow pulse loop
      drawPlayBg(true, false)
      playLabel.setColor('#ffffff')
      this.tweens.killTweensOf(playLabel)
      playLabel.setScale(1)
      this.tweens.add({
        targets: playLabel, scale: { from: 1.2, to: 1 },
        duration: 220, ease: 'Back.easeOut',
      })
      this.tweens.killTweensOf(playGlow)
      playGlow.setAlpha(0)
      if (!reducedMotion) {
        this.tweens.add({
          targets: playGlow,
          alpha: { from: 0.9, to: 0 },
          duration: 1100, repeat: -1, ease: 'Sine.easeOut',
        })
      }
      // Start gold tracer loop on PLAY button
      if (!this.popupPlayTracerTween && !reducedMotion) {
        playTracer.setAlpha(1)
        this.popupPlayTracerTween = this.tweens.add({
          targets: playTracerState, t: 1,
          duration: 2200, repeat: -1, ease: 'Linear',
          onUpdate: drawPlayTracer,
        })
      }
      updatePreview(ref.b)

      // Portrait feedback: play attack anim once (heroes with same-sized attack sheet),
      // or fall back to a scale pulse for cropped/excluded heroes.
      if (attackDef && this.anims.exists(attackAnimKey)) {
        const atkTex = `popup_atk_${hero.type}`
        portrait.setTexture(atkTex, 0)
        portrait.play(attackAnimKey)
        portrait.once('animationcomplete', () => {
          if (!this.popupRoot) return
          portrait.setTexture(texKey, hero.frameStart ?? 0)
          portrait.play(idleAnimKey)
        })
      } else {
        this.tweens.killTweensOf(portrait)
        this.tweens.add({
          targets: portrait, scale: { from: sprScale * 1.08, to: sprScale },
          duration: 320, ease: 'Back.easeOut',
        })
      }
    }

    // ── Card entry stagger animation (slide in from right) ──
    cardContainers.forEach((c, i) => {
      c.setAlpha(0)
      c.setX(24)
      this.tweens.add({
        targets: c, alpha: 1, x: 0,
        duration: 260, delay: 120 + i * 70, ease: 'Back.easeOut',
      })
    })

    // ── Keyboard shortcuts: 1/2/3 pick stance, Enter to play, Left/Right cycle heroes ──
    const keyboardHandler = (ev: KeyboardEvent) => {
      if (!this.popupRoot) return
      if (ev.key === '1' || ev.key === '2' || ev.key === '3') {
        const idx = parseInt(ev.key, 10) - 1
        if (idx < cardRefs.length) selectStance(idx)
      } else if (ev.key === 'Enter') {
        if (chosenBranchName) {
          (playZone as any).emit('pointerdown')
        }
      } else if (ev.key === 'ArrowLeft') {
        this.cycleToHero(-1, hero)
      } else if (ev.key === 'ArrowRight') {
        this.cycleToHero(1, hero)
      }
    }
    this.input.keyboard?.on('keydown', keyboardHandler)
    this.popupKeyboardHandler = keyboardHandler

    // ── Touch swipe (mobile only): horizontal swipe on panel cycles heroes ──
    if (isMobileDevice()) {
      let swipeStartX = 0
      let swipeStartY = 0
      let swipeStartT = 0
      let swipeTracked = false
      const inPanel = (p: Phaser.Input.Pointer) =>
        p.x >= panelX && p.x <= panelX + panelW &&
        p.y >= panelY && p.y <= panelY + panelH
      const down = (pointer: Phaser.Input.Pointer) => {
        if (!this.popupRoot) return
        if (!inPanel(pointer)) { swipeTracked = false; return }
        swipeStartX = pointer.x
        swipeStartY = pointer.y
        swipeStartT = pointer.downTime || Date.now()
        swipeTracked = true
      }
      const up = (pointer: Phaser.Input.Pointer) => {
        if (!this.popupRoot || !swipeTracked) return
        swipeTracked = false
        const dx = pointer.x - swipeStartX
        const dy = pointer.y - swipeStartY
        const dt = (pointer.upTime || Date.now()) - swipeStartT
        if (Math.abs(dx) > 60 && Math.abs(dy) < 40 && dt < 500) {
          this.cycleToHero(dx < 0 ? 1 : -1, hero)
        }
      }
      this.input.on('pointerdown', down)
      this.input.on('pointerup', up)
      this.popupSwipeDownHandler = down
      this.popupSwipeUpHandler = up
    }

  }

  private drawCircle(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, r: number,
    color: number, highlighted: boolean,
  ) {
    g.clear()

    if (highlighted) {
      g.fillStyle(color, 0.15)
      g.fillCircle(cx, cy, r + 8)
      g.fillStyle(color, 0.08)
      g.fillCircle(cx, cy, r + 14)
    }

    g.fillStyle(highlighted ? 0x222244 : 0x111122)
    g.fillCircle(cx, cy, r)

    // Hero-color radial aura rings inside the circle (matches popup portrait)
    const auraR = r * 0.7
    for (let i = 5; i >= 1; i--) {
      g.fillStyle(color, 0.03 + (6 - i) * 0.01)
      g.fillCircle(cx, cy, (auraR * i) / 5)
    }

    g.lineStyle(highlighted ? 3 : 2, color, highlighted ? 1 : 0.6)
    g.strokeCircle(cx, cy, r)

    g.lineStyle(1, color, 0.2)
    g.strokeCircle(cx, cy, r - 4)
  }
}
