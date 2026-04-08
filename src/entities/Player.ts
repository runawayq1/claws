import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import * as ignara from './heroes/ignara'
import * as sifra from './heroes/sifra'
import * as amun from './heroes/amun'
import * as nazar from './heroes/nazar'
import * as huntress from './heroes/huntress'
import * as khashin from './heroes/khashin'
import * as muller from './heroes/muller'
import { MetaProgress } from '../systems/MetaProgress'

export type HeroType = 'ignara' | 'sifra' | 'amun' | 'nazar' | 'huntress' | 'khashin' | 'muller'

interface HeroDef {
  hp: number; speed: number; damage: number; range: number; cooldown: number
  color: number; attackType: 'flamethrower' | 'dash' | 'iceshard' | 'shockwave' | 'poison' | 'melee' | 'fireball' | 'spear' | 'windslash' | 'crystalwave'
}

// Heroes with real spritesheet animations (side-view)
interface SpriteConfig {
  scale: number
  bodyW: number; bodyH: number
  bodyOffX: number; bodyOffY: number
  anims: { idle: number; run: number; attack: number; hurt: number; death: number }
}

interface SpriteHeroCfg extends SpriteConfig {
  /** If set, reuses another hero's spritesheet (same texture keys prefix) */
  reuseFrom?: HeroType
  /** Tint color to differentiate from the original */
  tint?: number
}

const SPRITE_HEROES: Record<HeroType, SpriteHeroCfg> = {
  ignara: { scale: 1.36, bodyW: 22, bodyH: 31, bodyOffX: 63, bodyOffY: 69, anims: { idle: 8, run: 8, attack: 8, hurt: 4, death: 5 } },
  // khet removed from playable roster (re-add: uncomment and add 'khet' back to HeroType)
  // khet:   { scale: 0.75, bodyW: 40, bodyH: 50, bodyOffX: 105, bodyOffY: 150, anims: { idle: 8, run: 8, attack: 8, hurt: 3, death: 7 }, tint: 0xcc44ff },
  sifra:  { scale: 0.77, bodyW: 40, bodyH: 58, bodyOffX: 90, bodyOffY: 84, anims: { idle: 6, run: 8, attack: 8, hurt: 4, death: 7 } },
  nazar:  { scale: 1.25, bodyW: 33, bodyH: 46, bodyOffX: 83, bodyOffY: 77, anims: { idle: 8, run: 8, attack: 6, hurt: 4, death: 6 } },
  amun:   { scale: 1.5, bodyW: 33, bodyH: 46, bodyOffX: 65, bodyOffY: 57, anims: { idle: 8, run: 8, attack: 4, hurt: 4, death: 6 } },
  huntress: { scale: 1.61, bodyW: 22, bodyH: 34, bodyOffX: 62, bodyOffY: 62, anims: { idle: 8, run: 8, attack: 5, hurt: 3, death: 8 } },
  khashin:  { scale: 1.65, bodyW: 26, bodyH: 40, bodyOffX: 129, bodyOffY: 88, anims: { idle: 8, run: 8, attack: 8, hurt: 6, death: 19 } },
  muller:   { scale: 1.35, bodyW: 26, bodyH: 40, bodyOffX: 127, bodyOffY: 87, anims: { idle: 8, run: 8, attack: 7, hurt: 6, death: 15 } },
}

const HERO_DEFS: Record<HeroType, HeroDef> = {
  ignara:  { hp: 80,  speed: 140, damage: 30, range: 180, cooldown: 700, color: 0xe84118, attackType: 'fireball' },
  // khet removed from playable roster
  // khet:    { hp: 55,  speed: 220, damage: 35, range: 48,  cooldown: 600,  color: 0x4a0072, attackType: 'dash' },
  sifra:   { hp: 70,  speed: 150, damage: 12, range: 160, cooldown: 800,  color: 0x82ccdd, attackType: 'iceshard' },
  amun:    { hp: 160, speed: 120, damage: 22, range: 65,  cooldown: 800, color: 0xfff200, attackType: 'shockwave' },
  nazar:   { hp: 90,  speed: 140, damage: 18, range: 55,  cooldown: 400,  color: 0xc23616, attackType: 'melee' },
  huntress: { hp: 80,  speed: 140, damage: 18, range: 300, cooldown: 500,  color: 0x2ecc71, attackType: 'spear' },
  khashin:  { hp: 90,  speed: 140, damage: 18, range: 160, cooldown: 900,  color: 0x88ddff, attackType: 'windslash' },
  muller:   { hp: 160, speed: 110, damage: 38, range: 260, cooldown: 1100, color: 0x44aaff, attackType: 'crystalwave' },
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  /** Center of physics body in world coords — use for VFX positioning */
  get cx(): number { const b = this.body as Phaser.Physics.Arcade.Body; return b ? b.center.x : this.x }
  get cy(): number { const b = this.body as Phaser.Physics.Arcade.Body; return b ? b.center.y : this.y }

  hp: number
  maxHp: number
  speed: number
  damage: number
  range: number
  attackCooldown: number
  hpRegen: number
  splashRadius: number
  xpMult: number
  strikeCount: number
  armor: number
  heroType: HeroType
  chosenBranch: string | null = null  // set when player picks a branch on first level-up

  // Ignara upgrade mechanic flags
  hasPhoenixHeart = false
  hasScorchedEarth = false
  hasMeltdown = false
  hasLavaTrail = false
  hasBackdraft = false
  hasWildfire = false
  hasFirestorm = false
  hasPyromaniac = false
  hasMoltenSkin = false
  lavaTrailTimer = 0

  // Nazar upgrade mechanic flags
  hasChainDash = false
  hasVanish = false
  vanishUntil = 0
  hasSmokeBomb = false
  hasPandemic = false
  hasHemorrhage = false
  hasAssassinate = false
  hasPhantomTrail = false
  hasBloodScent = false
  hasDeathMark = false
  hasShadowStep = false      // blink toward enemy before melee
  hasToxicSlash = false      // poison puddle at venom hit
  hasVirulentStrain = false  // bigger + longer poison puddles
  hasWeakness = false        // poisoned enemies take +30% dmg
  hasNecrosis = false        // poison DPS ramps per tick
  phantomTrailTimer = 0

  // Sifra ice upgrade mechanic flags
  hasFrostNova = false
  frostNovaCounter = 0
  hasAbsoluteZero = false
  hasBlizzardAura = false
  blizzardAuraGfx: Phaser.GameObjects.Graphics | null = null
  hasDeepFreeze = false         // stronger slow (0.3x)
  hasEternalWinter = false      // permanent damaging frost field
  hasPermafrost = false         // bonus dmg to slowed enemies
  hasIceArmor = false           // absorb shield regens when not hit
  iceArmorHP = 0
  iceArmorMax = 0
  iceArmorRegenDelay = 0
  hasCryoShield = false         // counter shards when hit
  hasSparkInitiate = false      // chain to 1 extra enemy
  hasArcReach = false           // wider cone + arc outside
  hasOvercharge = false         // chance for 3x burst
  hasBallLightning = false      // orbiting zap ball
  ballLightningGfx: Phaser.GameObjects.Graphics | null = null
  hasStormLord = false          // periodic random lightning strikes
  stormLordTimer = 0

  xp = 0
  level = 1
  kills = 0
  goldThisRun = 0
  shieldHp = 0
  shieldMaxHp = 0
  shieldTimer = 0
  speedBuffUntil = 0
  baseSpeedCache = 0

  private _lastDmgVfxTime = 0
  private touchTarget: Phaser.Math.Vector2 | null = null
  private _shadow!: Phaser.GameObjects.Ellipse
  private lastAttackTime = 0
  isAttacking = false
  private isDead = false
  private heroDef: HeroDef
  private poisonEndTime = 0
  private poisonDps = 0
  private hasSprite: boolean
  currentAnim = ''
  private buffAuraTimer = 0
  defenseAuraActive = false
  defenseAuraGfx: Phaser.GameObjects.Graphics | null = null
  dmgAuraActive = false
  dmgAuraCooldown = 1500  // ms between pulses
  dmgAuraLastPulse = 0
  passiveAuraGfx: Phaser.GameObjects.Graphics | null = null
  dmgAuraGfx: Phaser.GameObjects.Graphics | null = null

  // Amun stance system (unlocked by Quake branch)
  amunStance: 'quake' | 'melee' = 'quake'
  hasQuakeStance = false       // unlocked by aq1
  quakeEnergy = 100
  groundEnergy = 100

  // Amun upgrade mechanic flags
  hasTitansPulse = false      // launches boulder projectile on shockwave
  hasEarthquake = false       // stun enemies on shockwave
  hasColossus = false         // massive knockback on shockwave
  hasCataclysm = false        // double shockwave burst
  hasPassiveAura = false      // orbiting shield projectiles
  passiveAuraLevel = 0        // 1/2/3 — controls shield count & appearance
  orbitShields: Phaser.GameObjects.Image[] = []  // managed by updateAmunPassives
  hasThorns = false           // reflect damage to melee attackers
  hasIronWill = false         // cap incoming damage to 10% maxHP
  hasLowHpRegen = false       // regen ×3 when below 40% HP
  rebirthStacks = 0           // revive N times at full HP (Undying)
  hasLivingFortress = false   // aura damage scales with HP %
  hasWrath = false            // damage aura spike when hit
  hasGravityWell = false      // pull enemies toward Amun
  gravityWellTimer = 0
  hasDivineJudgment = false   // execute enemies below 15% HP in range

  // Huntress (Lyra) upgrade mechanic flags
  hasMarkedTarget = false        // Predator: mark enemies on hit
  hasCriticalStrike = false      // Predator: 20% chance for 2x damage
  hasHeadhunter = false          // Predator: execute below 15% HP
  hasVolley = false              // Predator: every 5th throw fires 3 spears
  hasBattleFrenzy = false        // Predator: kill gives +10% attack speed 5s
  hasKillStride = false          // Stalker: +20% speed for 3s after kill
  hasCaltrops = false            // Stalker: drop caltrops zone on dodge
  hasNetThrow = false            // Stalker: every 8th throw roots enemies
  hasLeap = false                // Stalker: auto-leap away when enemies close
  hasCamouflage = false          // Stalker: invisible for 2s after kill
  hasHeavySpear = false          // Warden: +40% dmg, knockback on spear hit
  hasExplosiveTips = false       // Warden: spears explode on final pierce
  hasSpearWall = false           // Warden: orbiting spears damage nearby
  hasSplinterShot = false        // Warden: miss spawns splinter shards
  hasEarthSlam = false           // Warden: melee creates shockwave line
  volleyCounter = 0       // tracks throws for Volley
  netCounter = 0          // tracks throws for Net
  killStrideUntil = 0     // timer for Kill Stride speed buff
  battleFrenzyUntil = 0   // timer for Battle Frenzy
  camouflageUntil = 0     // timer for Camouflage
  leapCooldown = 0       // cooldown for auto-leap
  caltropTimer = 0       // cooldown for caltrops drop
  spearWallGfx: Phaser.GameObjects.Graphics | null = null
  spearWallAngle = 0     // rotating spear wall angle

  // Khashin (Wind) upgrade mechanic flags
  khashinStance: 'sirocco' | 'haboob' = 'sirocco'
  windEnergy = 100
  sandEnergy = 100
  hasRazorWind = false          // +25% dmg, pierce +1
  hasGustStrike = false         // knockback 150px on slash
  hasDustDevil = false          // every 5th attack spawns tornado
  hasCycloneSurge = false       // bigger dust devils, +15% dmg
  hasEyeOfTheStorm = false      // anchored tornado every 8s
  hasChokingSand = false        // blinded enemies +35% dmg
  hasSandArmor = false          // 25% maxHP absorb shield
  hasAbrasion = false           // blinded enemies -20% armor
  hasScarabTide = false         // on kill: 4 seeking blind scarabs
  hasSandstormWall = false      // haboob arcs leave lingering clouds
  hasTailwind = false           // +20 speed, -10% CD
  hasPhantomStep = false        // auto-dash every 6s
  hasMirage = false             // decoy on phantom step
  hasDrift = false              // movement slow trails
  hasDesertWind = false         // omni-burst every 10s
  dustDevilCounter = 0
  eyeOfStormTimer = 0
  phantomStepTimer = 0
  desertWindTimer = 0
  driftTimer = 0
  windSlashPierce = 2           // base pierce for wind slash

  // Crystal Muller upgrade mechanic flags
  mullerStance: 'spike' | 'eruption' = 'spike'
  crystalEnergy = 100
  eruptionEnergy = 100
  hasCoarseCut = false          // wider cone
  hasDeepVein = false           // +30% dmg at max range
  hasShardstorm = false         // double wave
  hasCrystalShrapnel = false    // shrapnel on spike death
  hasTectonicFury = false       // every 5th slam superwave
  hasStoneSkin = false          // +2% DR per kill, 5 stacks
  hasGeodeShell = false         // one-hit absorb below 50%
  hasCrystalWall = false        // barrier every 8s
  hasResonanceArmor = false     // 0.5s invuln on wave impact
  hasLivingGeode = false        // +25 HP + melee reflect
  hasPlantedShard = false       // mines per slam
  hasCrystalPillar = false      // periodic pillar
  hasFaultLine = false          // persistent ground hazard
  hasResonanceField = false     // debuff aura on structures
  hasMotherLode = false         // periodic full-screen eruption every 12s
  private tectonicCounter = 0
  stoneSkinStacks = 0
  stoneSkinTimer = 0
  private _stoneSkinAccum = 0
  geodeShellCooldown = 0
  crystalWallTimer = 0
  crystalPillarTimer = 0
  crystalWaveConeAngle = 40     // degrees
  motherLodeTimer = 0

  stance: 'ice' | 'lightning' = 'ice'
  iceEnergy = 100
  lightningEnergy = 100
  maxEnergy = 100
  nazarStance: 'sword' | 'venom' = 'sword'
  swordEnergy = 100
  venomEnergy = 100
  huntressStance: 'melee' | 'spear' = 'spear'
  meleeEnergy = 100
  spearEnergy = 100
  private huntressMeleeCombo = false
  shatterPieces = 0  // ice shards split into N fragments on hit
  pierceCount = 2    // max enemies an ice shard can pierce through
  spearPierceCount = 999  // unlimited pierce by default; Explosive Tips triggers when set lower
  energyDrainRate = 10     // per second for continuous (lightning)
  energyDrainPerShot = 8   // per ice shard volley
  energyRegenRate = 25     // per second for inactive stance
  lightningAngle = 0

  // Branch Mastery system — XP earned by casting, levels up branch damage & reduces energy cost
  static readonly MASTERY_THRESHOLDS = [50, 150, 300]
  static readonly MASTERY_COST_MULT = [1.0, 0.90, 0.82, 0.76]  // energy cost multiplier per level
  static readonly MASTERY_NAMES = ['', 'Practiced', 'Adept', 'Master']
  branchMasteryXP: Record<string, number> = {}
  branchMasteryLevel: Record<string, number> = {}
  /** Which branch is currently attacking — set in tryAutoAttack, read by hero modules for kill XP */
  currentAttackBranch = ''
  private _lightningMasteryAccum = 0  // throttle continuous lightning XP

  awardMasteryXP(branch: string, amount: number) {
    if (!branch) return
    const xp = (this.branchMasteryXP[branch] ?? 0) + amount
    this.branchMasteryXP[branch] = xp
    const curLevel = this.branchMasteryLevel[branch] ?? 0
    if (curLevel < 3 && xp >= Player.MASTERY_THRESHOLDS[curLevel]) {
      this.branchMasteryLevel[branch] = curLevel + 1
      this.scene.events.emit('branch-mastery-levelup', { branch, level: curLevel + 1 })
    }
  }

  getMasteryLevel(branch: string): number {
    return this.branchMasteryLevel[branch] ?? 0
  }

  getMasteryDamageMult(branch: string): number {
    return 1 + 0.1 * this.getMasteryLevel(branch)
  }

  getMasteryCostMult(branch: string): number {
    return Player.MASTERY_COST_MULT[this.getMasteryLevel(branch)] ?? 0.76
  }

  // flameGfx removed — using sprite-based flamethrower now
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, heroType: HeroType = 'ignara') {
    const sprCfg = SPRITE_HEROES[heroType]
    // For reuse heroes (ignara→sifra sheets), check the source texture
    const srcHero = sprCfg?.reuseFrom || heroType
    const hasSpr = scene.textures.exists(`${srcHero}_idle`)
    const texKey = hasSpr ? `${srcHero}_idle` : `hero_${heroType}`

    if (!hasSpr) Player.generateTexture(scene, heroType)
    super(scene, x, y, texKey, 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.heroType = heroType
    this.heroDef = HERO_DEFS[heroType]
    this.hasSprite = hasSpr

    this.hp = this.heroDef.hp
    this.maxHp = this.heroDef.hp
    this.speed = this.heroDef.speed
    this.damage = this.heroDef.damage
    this.range = this.heroDef.range
    this.attackCooldown = this.heroDef.cooldown
    this.hpRegen = 0.25
    this.splashRadius = 0
    this.xpMult = 1
    this.strikeCount = 1
    this.armor = 0

    // Apply permanent meta-upgrades from Forge
    const meta = MetaProgress.load()
    const ups = meta.metaUpgrades || {}
    if (ups['mu_hp'])    { this.maxHp += 20 * ups['mu_hp']; this.hp = this.maxHp }
    if (ups['mu_dmg'])   { this.damage += 3 * ups['mu_dmg'] }
    if (ups['mu_spd'])   { this.speed += 8 * ups['mu_spd'] }
    if (ups['mu_regen']) { this.hpRegen += 0.5 * ups['mu_regen'] }
    if (ups['mu_cd'])    { this.attackCooldown = Math.max(200, Math.floor(this.attackCooldown * Math.pow(0.92, ups['mu_cd']))) }

    this.baseSpeed = this.speed
    this.baseSpeedCache = this.speed
    if (sprCfg && hasSpr) {
      this.setScale(sprCfg.scale)
      this.baseScale = sprCfg.scale
      this.setBodySize(sprCfg.bodyW, sprCfg.bodyH)
      this._baseBodyW = sprCfg.bodyW
      this._baseBodyH = sprCfg.bodyH
      this.setOffset(sprCfg.bodyOffX, sprCfg.bodyOffY)
      if (sprCfg.tint) this.setTint(sprCfg.tint)
      this.playAnim('idle')
    } else {
      this.setScale(1.8)
      this.setBodySize(24, 28)
      this._baseBodyW = 24
      this._baseBodyH = 28
      this.setOffset(20, 22)
    }

    this.setCollideWorldBounds(false)
    this.setDepth(10)

    // Shadow under hero — dark ellipse at feet level
    const shadowBody = this.body as Phaser.Physics.Arcade.Body
    const shadow = scene.add.ellipse(x, shadowBody.bottom, 40, 16, 0x000000, 0.35).setDepth(9)
    scene.tweens.add({
      targets: shadow,
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.85, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    this._shadow = shadow

    // Player can't be pushed by enemies
    const body = this.body as Phaser.Physics.Arcade.Body
    body.pushable = false

    // Keyboard controls (desktop)
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys()
      this.wasd = {
        W: scene.input.keyboard.addKey('W'),
        A: scene.input.keyboard.addKey('A'),
        S: scene.input.keyboard.addKey('S'),
        D: scene.input.keyboard.addKey('D'),
      }
      // Stance toggle for Sifra (Q key)
      if (heroType === 'sifra') {
        scene.input.keyboard.addKey('Q').on('down', () => this.toggleStance())
      }
      // Stance toggle for Nazar (Q key)
      if (heroType === 'nazar') {
        scene.input.keyboard.addKey('Q').on('down', () => this.toggleNazarStance())
      }
      // Stance toggle for Huntress (Q key)
      if (heroType === 'huntress') {
        scene.input.keyboard.addKey('Q').on('down', () => this.toggleHuntressStance())
      }
      // Stance toggle for Khashin (Q key)
      if (heroType === 'khashin') {
        scene.input.keyboard.addKey('Q').on('down', () => this.toggleKhashinStance())
      }
      // Amun stance toggle (Q key) — activated when Quake branch chosen
      if (heroType === 'amun') {
        scene.input.keyboard.addKey('Q').on('down', () => this.toggleAmunStance())
      }
      // Muller has no stance toggle — eruption is an upgrade ability
    }
  }

  toggleStance() {
    if (this.heroType !== 'sifra') return
    this.stance = this.stance === 'ice' ? 'lightning' : 'ice'
    // Clean up lightning visuals when switching away
    if (this.stance === 'ice') {
      if (this.lightningGfx) this.lightningGfx.clear()
      if (this.lightningSprite) this.lightningSprite.setVisible(false)
    }
    this.scene.events.emit('stance-changed', this.stance)
  }

  toggleNazarStance() {
    if (this.heroType !== 'nazar') return
    this.nazarStance = this.nazarStance === 'sword' ? 'venom' : 'sword'
    this.scene.events.emit('nazar-stance-changed', this.nazarStance)
  }

  toggleHuntressStance() {
    if (this.heroType !== 'huntress') return
    this.huntressStance = this.huntressStance === 'melee' ? 'spear' : 'melee'
    this.scene.events.emit('huntress-stance-changed', this.huntressStance)
  }

  /** Returns the active stance string for any hero — used by UpgradeSystem */
  getActiveStance(): string {
    switch (this.heroType) {
      case 'sifra': return this.stance
      case 'nazar': return this.nazarStance
      case 'huntress': return this.huntressStance
      case 'khashin': return this.khashinStance
      case 'muller': return this.mullerStance
      case 'amun': return this.hasQuakeStance ? this.amunStance : ''
      default: return ''
    }
  }

  toggleKhashinStance() {
    if (this.heroType !== 'khashin') return
    this.khashinStance = this.khashinStance === 'sirocco' ? 'haboob' : 'sirocco'
    this.scene.events.emit('khashin-stance-changed', this.khashinStance)
  }

  toggleAmunStance() {
    if (this.heroType !== 'amun' || !this.hasQuakeStance) return
    this.amunStance = this.amunStance === 'quake' ? 'melee' : 'quake'
    this.scene.events.emit('amun-stance-changed', this.amunStance)
  }

  private baseScale = 1
  private _baseBodyW = 0
  private _baseBodyH = 0
  private baseSpeed = 0

  /** Apply Stone Skin visual: +5% scale and hitbox per stack, smooth tween */
  applyStoneSkinVisuals(animate = true) {
    const stacks = this.stoneSkinStacks
    const targetScale = this.baseScale * (1 + stacks * 0.05)
    // Speed INCREASES with stacks (+5 per stack)
    this.speed = Math.floor(this.baseSpeed + stacks * 5)
    // Armor increases (+5% per stack)
    // (DR is handled in takeDamage via stoneSkinDR calculation)

    if (this.hasSprite) {
      if (animate) {
        // Smooth tween to avoid jumps
        this.scene.tweens.add({
          targets: this,
          scaleX: targetScale,
          scaleY: targetScale,
          duration: 300,
          ease: 'Back.easeOut',
        })
      } else {
        this.setScale(targetScale)
      }
    }
    // Scale hitbox proportionally
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body && this._baseBodyW) {
      body.setSize(
        this._baseBodyW * (1 + stacks * 0.05),
        this._baseBodyH * (1 + stacks * 0.05)
      )
    }
  }

  toggleMullerStance() {
    if (this.heroType !== 'muller') return
    this.mullerStance = this.mullerStance === 'spike' ? 'eruption' : 'spike'
    this.scene.events.emit('muller-stance-changed', this.mullerStance)
  }

  /** Create spritesheet animations for heroes that have real sprite sheets */
  static createAnimations(scene: Phaser.Scene) {
    for (const [hero, cfg] of Object.entries(SPRITE_HEROES) as [HeroType, SpriteHeroCfg][]) {
      if (cfg.reuseFrom) continue // reuse heroes share animations from source
      if (!scene.textures.exists(`${hero}_idle`)) continue
      const animDefs: [string, number, number][] = [
        ['idle', cfg.anims.idle, -1],
        ['run', cfg.anims.run, -1],
        ['attack', cfg.anims.attack, 0],
        ['hurt', cfg.anims.hurt, 0],
        ['death', cfg.anims.death, 0],
      ]
      for (const [name, count, repeat] of animDefs) {
        const key = `${hero}_${name}`
        if (scene.anims.exists(key)) continue
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(key, { start: 0, end: count - 1 }),
          frameRate: name === 'run' ? 12 : name === 'attack' ? (hero === 'amun' ? 22 : 14) : 8,
          repeat,
        })
      }
    }
    // Khashin air attack (wind stance, 7 frames)
    if (scene.textures.exists('khashin_air_attack') && !scene.anims.exists('khashin_air_attack')) {
      scene.anims.create({
        key: 'khashin_air_attack',
        frames: scene.anims.generateFrameNumbers('khashin_air_attack', { start: 0, end: 6 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Khashin special (30 frames)
    if (scene.textures.exists('khashin_special') && !scene.anims.exists('khashin_special')) {
      scene.anims.create({
        key: 'khashin_special',
        frames: scene.anims.generateFrameNumbers('khashin_special', { start: 0, end: 29 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Muller ground slam (eruption stance, 17 frames)
    if (scene.textures.exists('muller_ground_slam') && !scene.anims.exists('muller_ground_slam')) {
      scene.anims.create({
        key: 'muller_ground_slam',
        frames: scene.anims.generateFrameNumbers('muller_ground_slam', { start: 0, end: 16 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Muller special windup (frames 0-6: spinning arrows)
    if (scene.textures.exists('muller_special') && !scene.anims.exists('muller_special_windup')) {
      scene.anims.create({
        key: 'muller_special_windup',
        frames: scene.anims.generateFrameNumbers('muller_special', { start: 0, end: 6 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Muller special attack (frames 7-14: crystals erupt from ground)
    if (scene.textures.exists('muller_special') && !scene.anims.exists('muller_special_attack')) {
      scene.anims.create({
        key: 'muller_special_attack',
        frames: scene.anims.generateFrameNumbers('muller_special', { start: 7, end: 14 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Crystal VFX anims — individual crystals per color
    for (const key of ['crystal_green_0', 'crystal_green_1', 'crystal_pink_0', 'crystal_pink_1', 'crystal_blue_0', 'crystal_blue_1']) {
      if (scene.textures.exists(key) && !scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
          frameRate: 12,
          repeat: 0,
        })
      }
    }
    // Sifra Attack2 (8 frames, alt attack anim)
    if (scene.textures.exists('sifra_attack2') && !scene.anims.exists('sifra_attack2')) {
      scene.anims.create({
        key: 'sifra_attack2',
        frames: scene.anims.generateFrameNumbers('sifra_attack2', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Nazar Attack2 (6 frames, alt attack anim)
    if (scene.textures.exists('nazar_attack2') && !scene.anims.exists('nazar_attack2')) {
      scene.anims.create({
        key: 'nazar_attack2',
        frames: scene.anims.generateFrameNumbers('nazar_attack2', { start: 0, end: 5 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Amun Attack2 (4 frames, alt attack anim)
    if (scene.textures.exists('amun_attack2') && !scene.anims.exists('amun_attack2')) {
      scene.anims.create({
        key: 'amun_attack2',
        frames: scene.anims.generateFrameNumbers('amun_attack2', { start: 0, end: 3 }),
        frameRate: 22,
        repeat: 0,
      })
    }
    // Amun Attack3 (4 frames, third attack anim)
    if (scene.textures.exists('amun_attack3') && !scene.anims.exists('amun_attack3')) {
      scene.anims.create({
        key: 'amun_attack3',
        frames: scene.anims.generateFrameNumbers('amun_attack3', { start: 0, end: 3 }),
        frameRate: 22,
        repeat: 0,
      })
    }
    // Huntress melee alt anim (Attack2, 5 frames)
    if (scene.textures.exists('huntress_attack2') && !scene.anims.exists('huntress_attack2')) {
      scene.anims.create({
        key: 'huntress_attack2',
        frames: scene.anims.generateFrameNumbers('huntress_attack2', { start: 0, end: 4 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    // Huntress ranged anim (Attack3, reversed: wind-up from low to throw)
    if (scene.textures.exists('huntress_ranged') && !scene.anims.exists('huntress_ranged')) {
      scene.anims.create({
        key: 'huntress_ranged',
        frames: scene.anims.generateFrameNumbers('huntress_ranged', { start: 4, end: 0 }),
        frameRate: 12,
        repeat: 0,
      })
    }
  }

  /** Get the animation key prefix (source hero for reuse heroes) */
  private get animPrefix(): string {
    const cfg = SPRITE_HEROES[this.heroType]
    return cfg?.reuseFrom || this.heroType
  }

  /** Returns branch-specific attack anim key, or null for default */
  private getBranchAttackAnim(): string | null {
    if (!this.chosenBranch) return null
    // Branch → alt attack animation mapping
    const BRANCH_ANIMS: Record<string, string> = {
      // Sifra ice branches
      'Shatter':          'sifra_attack2',
      'Crystal':          'sifra_attack2',
      // Nazar branches
      'Way of Venom':     'nazar_attack2',
      'Way of Shadow':    'nazar_attack2',
      // Amun branches
      'Wrath':            'amun_attack2',
      'Bastion':          'amun_attack3',
    }
    return BRANCH_ANIMS[this.chosenBranch] || null
  }

  private playAnim(name: string) {
    const key = `${this.animPrefix}_${name}`
    if (this.currentAnim === key) return
    if (!this.hasSprite) return
    this.currentAnim = key
    this.play(key, true)
  }

  static generateTexture(scene: Phaser.Scene, heroType: HeroType) {
    const key = `hero_${heroType}`
    if (scene.textures.exists(key)) return

    const g = scene.add.graphics()
    const w = 64, h = 64

    switch (heroType) {
      case 'ignara': {
        // === IGNARA — Fire Sorceress ===
        // Feet / boots
        g.fillStyle(0x8b4513)
        g.fillRect(22, 56, 6, 6); g.fillRect(36, 56, 6, 6)
        g.fillStyle(0x6b3410)
        g.fillRect(22, 60, 6, 2); g.fillRect(36, 60, 6, 2)

        // Legs
        g.fillStyle(0xc0392b)
        g.fillRect(24, 46, 5, 12); g.fillRect(36, 46, 5, 12)

        // Robe body — flowing red with orange trim
        g.fillStyle(0xc0392b)
        g.fillRoundedRect(18, 26, 28, 22, 3)
        // Robe darker inner fold
        g.fillStyle(0x922b21)
        g.fillRect(26, 30, 12, 16)
        // Orange trim at edges
        g.fillStyle(0xe67e22)
        g.fillRect(18, 26, 2, 22); g.fillRect(44, 26, 2, 22)
        // Belt
        g.fillStyle(0xf39c12)
        g.fillRect(19, 36, 26, 3)
        g.fillStyle(0xe74c3c)
        g.fillCircle(32, 37, 2) // belt jewel

        // Arms — robe sleeves
        g.fillStyle(0xc0392b)
        g.fillRect(10, 28, 8, 14); g.fillRect(46, 28, 8, 14)
        g.fillStyle(0xe67e22) // cuff trim
        g.fillRect(10, 40, 8, 2); g.fillRect(46, 40, 8, 2)

        // Hands — skin tone
        g.fillStyle(0xe8b88a)
        g.fillRect(11, 42, 6, 4); g.fillRect(47, 42, 6, 4)

        // Left hand holds fireball
        g.fillStyle(0xff6600, 0.7)
        g.fillCircle(14, 48, 5)
        g.fillStyle(0xffaa00, 0.8)
        g.fillCircle(14, 47, 3)
        g.fillStyle(0xffdd44)
        g.fillCircle(14, 46, 1.5)

        // Neck
        g.fillStyle(0xe8b88a)
        g.fillRect(28, 22, 8, 6)

        // Head
        g.fillStyle(0xe8b88a)
        g.fillCircle(32, 16, 8)

        // Hair — fiery red/orange
        g.fillStyle(0xd35400)
        g.fillEllipse(32, 10, 18, 10)
        g.fillStyle(0xe74c3c)
        g.fillRect(23, 6, 18, 6)
        // Hair flowing down sides
        g.fillStyle(0xd35400)
        g.fillRect(22, 10, 3, 10); g.fillRect(39, 10, 3, 10)

        // Face
        g.fillStyle(0x2c3e50) // eyes
        g.fillRect(28, 14, 3, 3); g.fillRect(34, 14, 3, 3)
        g.fillStyle(0xffffff) // eye whites
        g.fillRect(28, 14, 2, 2); g.fillRect(34, 14, 2, 2)
        g.fillStyle(0xc0392b) // lips
        g.fillRect(30, 19, 4, 1)

        // Fire crown / circlet
        g.fillStyle(0xf1c40f)
        g.fillRect(25, 8, 14, 2)
        g.fillStyle(0xff6600)
        g.fillCircle(32, 6, 2) // crown gem
        g.fillStyle(0xf39c12)
        g.fillCircle(28, 7, 1); g.fillCircle(36, 7, 1)
        break
      }

      // khet case removed from playable roster (kept in comment for re-adding)
      // case 'khet': { ... }

      case 'sifra': {
        // === SIFRA — Ice Mage / Frost Scholar ===
        // Feet — light boots
        g.fillStyle(0x5dade2)
        g.fillRect(23, 56, 6, 6); g.fillRect(35, 56, 6, 6)
        g.fillStyle(0x2e86c1)
        g.fillRect(23, 60, 6, 2); g.fillRect(35, 60, 6, 2)

        // Legs
        g.fillStyle(0x85c1e9)
        g.fillRect(24, 44, 5, 14); g.fillRect(36, 44, 5, 14)

        // Robe body — icy blue with white accents
        g.fillStyle(0x5dade2)
        g.fillRoundedRect(18, 24, 28, 24, 4)
        // Inner robe fold
        g.fillStyle(0x3498db)
        g.fillRect(28, 28, 8, 18)
        // Frost patterns on robe
        g.fillStyle(0xd6eaf8, 0.5)
        g.fillCircle(24, 34, 2); g.fillCircle(40, 38, 2); g.fillCircle(22, 42, 1.5)
        // White fur collar
        g.fillStyle(0xecf0f1)
        g.fillEllipse(32, 26, 26, 6)
        g.fillStyle(0xd5dbdb)
        g.fillEllipse(32, 26, 22, 4)
        // Belt — silver
        g.fillStyle(0xbdc3c7)
        g.fillRect(19, 38, 26, 2)
        g.fillStyle(0x00d2d3)
        g.fillCircle(32, 39, 2) // ice crystal buckle

        // Arms
        g.fillStyle(0x5dade2)
        g.fillRect(10, 26, 8, 14); g.fillRect(46, 26, 8, 14)
        // Cuff frost trim
        g.fillStyle(0xecf0f1)
        g.fillRect(10, 38, 8, 2); g.fillRect(46, 38, 8, 2)

        // Hands
        g.fillStyle(0xfdebd0)
        g.fillRect(11, 40, 5, 4); g.fillRect(48, 40, 5, 4)

        // Staff — right hand (ice crystal staff)
        g.fillStyle(0x85c1e9)
        g.fillRect(50, 14, 3, 34) // shaft
        g.fillStyle(0xaed6f1)
        g.fillRect(50, 14, 3, 2) // shaft detail
        // Crystal top
        g.fillStyle(0x00d2d3)
        g.fillTriangle(51, 6, 47, 14, 55, 14)
        g.fillStyle(0x76d7ea, 0.7)
        g.fillTriangle(51, 8, 48, 13, 54, 13)
        // Crystal glow
        g.fillStyle(0xaaeeff, 0.3)
        g.fillCircle(51, 10, 6)

        // Neck
        g.fillStyle(0xfdebd0)
        g.fillRect(28, 20, 8, 6)

        // Head
        g.fillStyle(0xfdebd0)
        g.fillCircle(32, 14, 8)

        // Hair — white/silver
        g.fillStyle(0xd5f5e3)
        g.fillEllipse(32, 9, 18, 10)
        g.fillStyle(0xabebc6)
        g.fillRect(24, 4, 16, 6)
        // Hair side strands
        g.fillStyle(0xd5f5e3)
        g.fillRect(22, 8, 3, 12); g.fillRect(39, 8, 3, 12)

        // Face
        g.fillStyle(0x2e86c1) // eyes — icy blue
        g.fillRect(28, 13, 3, 3); g.fillRect(34, 13, 3, 3)
        g.fillStyle(0xaed6f1) // eye highlights
        g.fillRect(28, 13, 2, 2); g.fillRect(34, 13, 2, 2)
        // Lips
        g.fillStyle(0xe8b4b8)
        g.fillRect(30, 19, 4, 1)

        // Circlet — ice
        g.fillStyle(0x85c1e9)
        g.fillRect(25, 7, 14, 2)
        g.fillStyle(0x00d2d3)
        g.fillCircle(32, 6, 2)
        break
      }

      case 'amun': {
        // === AMUN — Pharaoh Guardian ===
        // Feet — golden sandals
        g.fillStyle(0xd4a017)
        g.fillRect(22, 56, 7, 6); g.fillRect(35, 56, 7, 6)
        g.fillStyle(0xb8860b)
        g.fillRect(22, 60, 7, 2); g.fillRect(35, 60, 7, 2)

        // Legs — white linen skirt
        g.fillStyle(0xfdfefe)
        g.fillRect(20, 40, 24, 18)
        g.fillStyle(0xeaecee)
        g.fillRect(30, 40, 2, 18) // center fold
        // Gold trim on skirt
        g.fillStyle(0xf1c40f)
        g.fillRect(20, 40, 24, 2)
        g.fillRect(20, 56, 24, 2)

        // Torso — golden armor
        g.fillStyle(0xf1c40f)
        g.fillRoundedRect(18, 22, 28, 20, 3)
        // Chest plate — pharaoh eagle emblem
        g.fillStyle(0xd4a017)
        g.fillRect(24, 24, 16, 14)
        g.fillStyle(0xf39c12)
        g.fillTriangle(32, 24, 26, 36, 38, 36) // emblem
        g.fillStyle(0x00bcd4) // turquoise inlay
        g.fillCircle(32, 30, 3)
        g.fillStyle(0x00838f)
        g.fillCircle(32, 30, 1.5)
        // Shoulder pauldrons
        g.fillStyle(0xf1c40f)
        g.fillEllipse(16, 24, 10, 8)
        g.fillEllipse(48, 24, 10, 8)
        g.fillStyle(0xd4a017) // pauldron detail
        g.lineStyle(1, 0xb8860b)
        g.strokeCircle(16, 24, 3); g.strokeCircle(48, 24, 3)

        // Arms
        g.fillStyle(0xc68642) // skin
        g.fillRect(10, 26, 8, 14); g.fillRect(46, 26, 8, 14)
        // Gold arm bands
        g.fillStyle(0xf1c40f)
        g.fillRect(10, 28, 8, 2); g.fillRect(46, 28, 8, 2)
        g.fillRect(10, 34, 8, 2); g.fillRect(46, 34, 8, 2)

        // Hands
        g.fillStyle(0xc68642)
        g.fillRect(11, 40, 6, 4); g.fillRect(47, 40, 6, 4)

        // Shield — left hand (ankh shaped)
        g.fillStyle(0xd4a017)
        g.fillRect(4, 24, 10, 22)
        g.fillStyle(0xf1c40f)
        g.fillRect(5, 25, 8, 20)
        // Ankh symbol on shield
        g.fillStyle(0x00bcd4)
        g.fillCircle(9, 30, 3)
        g.fillStyle(0xf1c40f)
        g.fillCircle(9, 30, 1.5)
        g.fillStyle(0x00bcd4)
        g.fillRect(8, 33, 2, 8)
        g.fillRect(6, 36, 6, 2)

        // Head — pharaoh headdress
        g.fillStyle(0xc68642) // face skin
        g.fillCircle(32, 14, 8)
        // Nemes headdress (striped)
        g.fillStyle(0x1a237e)
        g.fillRect(22, 4, 20, 12)
        g.fillStyle(0xf1c40f)
        g.fillRect(24, 4, 2, 12); g.fillRect(28, 4, 2, 12)
        g.fillRect(32, 4, 2, 12); g.fillRect(36, 4, 2, 12)
        g.fillRect(40, 4, 2, 12)
        // Headdress sides flowing down
        g.fillStyle(0x1a237e)
        g.fillRect(20, 10, 4, 16); g.fillRect(40, 10, 4, 16)
        g.fillStyle(0xf1c40f) // gold stripes on sides
        g.fillRect(20, 12, 4, 2); g.fillRect(40, 12, 4, 2)
        g.fillRect(20, 18, 4, 2); g.fillRect(40, 18, 4, 2)
        // Uraeus (cobra) on forehead
        g.fillStyle(0xf1c40f)
        g.fillCircle(32, 5, 2)
        g.fillStyle(0xff0000)
        g.fillCircle(32, 4, 1) // ruby eye

        // Face
        g.fillStyle(0xffffff) // eyes
        g.fillRect(28, 12, 3, 3); g.fillRect(34, 12, 3, 3)
        g.fillStyle(0x1a1a1a) // pupils
        g.fillRect(29, 13, 2, 2); g.fillRect(35, 13, 2, 2)
        // Kohl eyeliner (Egyptian style)
        g.lineStyle(1, 0x1a1a1a)
        g.lineBetween(26, 13, 28, 13); g.lineBetween(37, 13, 39, 13)
        // Gold aura glow
        g.fillStyle(0xfff59d, 0.15)
        g.fillCircle(32, 32, 24)
        break
      }

      case 'nazar': {
        // === NAZAR — Plague Doctor ===
        // Feet — heavy boots
        g.fillStyle(0x34495e)
        g.fillRect(22, 56, 6, 6); g.fillRect(36, 56, 6, 6)
        g.fillStyle(0x2c3e50)
        g.fillRect(22, 60, 6, 2); g.fillRect(36, 60, 6, 2)
        // Boot buckles
        g.fillStyle(0x7f8c8d)
        g.fillRect(24, 56, 2, 1); g.fillRect(38, 56, 2, 1)

        // Legs
        g.fillStyle(0x515a5a)
        g.fillRect(24, 44, 5, 14); g.fillRect(36, 44, 5, 14)

        // Long coat body — dark grey-green
        g.fillStyle(0x515a5a)
        g.fillRoundedRect(16, 22, 32, 26, 3)
        // Coat inner lining — darker
        g.fillStyle(0x3d4646)
        g.fillRect(26, 26, 12, 20)
        // Coat buttons
        g.fillStyle(0x7f8c8d)
        g.fillCircle(32, 28, 1); g.fillCircle(32, 32, 1)
        g.fillCircle(32, 36, 1); g.fillCircle(32, 40, 1)
        // Coat flared bottom
        g.fillStyle(0x515a5a)
        g.fillTriangle(16, 46, 14, 56, 24, 56)
        g.fillTriangle(48, 46, 50, 56, 40, 56)
        // Belt with vials
        g.fillStyle(0x6b4226)
        g.fillRect(17, 38, 30, 3)
        // Potion vials on belt
        g.fillStyle(0xa3cb38)
        g.fillRect(20, 36, 3, 4); g.fillRect(26, 36, 3, 4)
        g.fillStyle(0x009432)
        g.fillRect(41, 36, 3, 4)
        g.fillStyle(0xf39c12)
        g.fillRect(35, 36, 3, 4)

        // Arms — coat sleeves
        g.fillStyle(0x515a5a)
        g.fillRect(8, 24, 8, 16); g.fillRect(48, 24, 8, 16)
        // Cuff detail
        g.fillStyle(0x3d4646)
        g.fillRect(8, 38, 8, 2); g.fillRect(48, 38, 8, 2)

        // Gloved hands
        g.fillStyle(0x2c3e50)
        g.fillRect(9, 40, 6, 4); g.fillRect(49, 40, 6, 4)

        // Right hand — poison vial (large)
        g.fillStyle(0x2ecc71, 0.7)
        g.fillRoundedRect(50, 42, 8, 10, 2)
        g.fillStyle(0x27ae60)
        g.fillRect(52, 40, 4, 3) // vial neck
        g.fillStyle(0x6b4226)
        g.fillRect(52, 39, 4, 2) // cork
        // Bubbles in vial
        g.fillStyle(0x82e0aa, 0.6)
        g.fillCircle(54, 47, 1.5); g.fillCircle(52, 49, 1)

        // Neck
        g.fillStyle(0x515a5a)
        g.fillRect(28, 18, 8, 6)

        // Head — plague doctor mask
        g.fillStyle(0x2d3436)
        g.fillCircle(32, 12, 9)
        // Hat — wide brim
        g.fillStyle(0x2d3436)
        g.fillEllipse(32, 6, 24, 6)
        g.fillStyle(0x1a1a2e)
        g.fillRect(26, 2, 12, 6) // hat crown
        // Hat band
        g.fillStyle(0x6b4226)
        g.fillRect(26, 6, 12, 2)
        g.fillStyle(0xa3cb38) // green feather accent
        g.fillRect(38, 2, 2, 6)

        // Plague mask beak
        g.fillStyle(0xbaaa7c)
        g.fillTriangle(32, 12, 24, 18, 32, 24)
        g.fillStyle(0xa89060)
        g.fillTriangle(32, 14, 26, 18, 32, 22)
        // Mask nostril detail
        g.fillStyle(0x2d3436)
        g.fillCircle(28, 18, 1)

        // Eye lenses — yellow/green glow
        g.fillStyle(0xfdcb6e)
        g.fillCircle(28, 10, 3); g.fillCircle(36, 10, 3)
        g.fillStyle(0xf9e79f)
        g.fillCircle(28, 10, 1.5); g.fillCircle(36, 10, 1.5)
        // Lens frame
        g.lineStyle(1, 0x2d3436)
        g.strokeCircle(28, 10, 3); g.strokeCircle(36, 10, 3)

        // Poison drip effect from vial
        g.fillStyle(0xa3cb38, 0.5)
        g.fillCircle(54, 54, 2)
        g.fillCircle(55, 57, 1)
        break
      }
    }

    g.generateTexture(key, w, h)
    g.destroy()
  }

  setTouchTarget(x: number, y: number) {
    if (this.isDead) return
    if (this.touchTarget) this.touchTarget.set(x, y)
    else this.touchTarget = new Phaser.Math.Vector2(x, y)
  }

  clearTouchTarget() { this.touchTarget = null }

  // Virtual joystick: dx/dy normalized direction, 0/0 = stop
  private joystickDir: { dx: number; dy: number } | null = null

  setJoystickDirection(dx: number, dy: number) {
    if (this.isDead) return
    if (dx === 0 && dy === 0) {
      this.joystickDir = null
    } else {
      this.joystickDir = { dx, dy }
    }
    this.touchTarget = null
  }

  clearJoystick() { this.joystickDir = null }

  takeDamage(amount: number) {
    if (this.isDead) return
    if (this.vanishUntil > this.scene.time.now) return  // Invulnerable after dash
    // Shield absorbs damage first
    if (this.shieldHp > 0) {
      if (amount <= this.shieldHp) {
        this.shieldHp -= amount
        return // fully absorbed
      }
      amount -= this.shieldHp
      this.shieldHp = 0
    }
    // Stone Skin DR: +2% per stack, max 5
    const stoneSkinDR = this.hasStoneSkin ? this.stoneSkinStacks * 0.05 : 0
    let reduced = amount * (1 - Math.min(0.7, this.armor + stoneSkinDR))

    // Sand Armor (Khashin): absorb shield
    if (this.hasSandArmor && (this as any)._sandArmorHP > 0) {
      const absorbed = Math.min(reduced, (this as any)._sandArmorHP)
      ;(this as any)._sandArmorHP -= absorbed
      reduced -= absorbed
      ;(this as any)._sandArmorRegenDelay = 4000
      if (absorbed > 0) {
        const fx = this.scene.add.circle(this.x, this.y, 16, 0xe8a040, 0.4).setDepth(10)
        this.scene.tweens.add({ targets: fx, scale: 2, alpha: 0, duration: 200, onComplete: () => fx.destroy() })
      }
    }

    // Geode Shell (Muller): absorb next hit below 50% HP
    if (this.hasGeodeShell && this.geodeShellCooldown <= 0 && this.hp < this.maxHp * 0.5) {
      this.geodeShellCooldown = 20000
      const fx = this.scene.add.circle(this.x, this.y, 20, 0x99ddcc, 0.6).setDepth(10)
      this.scene.tweens.add({ targets: fx, scale: 3, alpha: 0, duration: 400, onComplete: () => fx.destroy() })
      return // fully absorbed
    }

    // Ice Armor: absorb damage with shield
    if (this.hasIceArmor && this.iceArmorHP > 0) {
      const absorbed = Math.min(reduced, this.iceArmorHP)
      this.iceArmorHP -= absorbed
      reduced -= absorbed
      this.iceArmorRegenDelay = 3000 // 3s before regen starts
      if (absorbed > 0) {
        const shieldFx = this.scene.add.circle(this.x, this.y, 16, 0x88ddff, 0.4).setDepth(10)
        this.scene.tweens.add({ targets: shieldFx, scale: 2, alpha: 0, duration: 200, onComplete: () => shieldFx.destroy() })
      }
    }

    // Iron Will: cap incoming damage to 10% max HP
    if (this.hasIronWill && reduced > this.maxHp * 0.1) {
      reduced = this.maxHp * 0.1
      const shield = this.scene.add.circle(this.x, this.y, 18, 0x88aacc, 0.5).setDepth(10)
      this.scene.tweens.add({ targets: shield, scale: 2.5, alpha: 0, duration: 250, onComplete: () => shield.destroy() })
    }

    this.hp -= reduced

    // Stone Skin: accumulate damage, gain stack every 10 HP lost
    if (this.hasStoneSkin && reduced > 0 && this.stoneSkinStacks < 5) {
      this._stoneSkinAccum += reduced
      if (this._stoneSkinAccum >= 10) {
        this._stoneSkinAccum -= 10
        this.stoneSkinStacks++
        this.stoneSkinTimer = 0
        this.applyStoneSkinVisuals(true)
        // Proc VFX — stone dust ring
        const ring = this.scene.add.circle(this.x, this.y, 8, 0x99ddcc, 0.6).setDepth(12)
        this.scene.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 300, onComplete: () => ring.destroy() })
      }
    }

    // Combined on-hit enemy scan — single loop for all reactive passives
    const needsScan = reduced >= 1 && (this.hasCryoShield || this.hasThorns || this.hasLivingGeode || this.hasWrath || this.hasMoltenSkin)
    if (needsScan) {
      const scene = this.scene as any
      if (scene.enemies) {
        const wrathRadius = this.hasWrath ? 70 + this.splashRadius * 0.8 : 0
        const maxRadius = Math.max(80, 60, wrathRadius, 50)
        let cryoCount = 0
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
          if (dist > maxRadius) continue

          if (this.hasCryoShield && dist <= 80 && cryoCount < 3) {
            ;(e as any).takeDamage(this.damage * 0.25, 'ice')
            const shard = this.scene.add.circle(this.x, this.y, 3, 0x88ddff, 0.8).setDepth(10)
            this.scene.tweens.add({ targets: shard, x: e.x, y: e.y, alpha: 0, duration: 200, onComplete: () => shard.destroy() })
            cryoCount++
          }
          if (this.hasThorns && dist <= 60) {
            (e as any).takeDamage(reduced * 0.5, 'melee')
          }
          if (this.hasLivingGeode && dist <= 60) {
            ;(e as any).takeDamage?.(15, 'melee')
          }
          if (this.hasWrath && dist <= wrathRadius) {
            (e as any).takeDamage(this.damage * 0.6, 'melee')
          }
          if (this.hasMoltenSkin && dist <= 50) {
            (e as any).takeDamage(this.damage * 0.3, 'fire')
          }
        }
        // VFX rings for active passives
        if (this.hasThorns) {
          const spikes = this.scene.add.circle(this.x, this.y, 10, 0xffdd44, 0.5).setDepth(9)
          this.scene.tweens.add({ targets: spikes, scale: 5, alpha: 0, duration: 250, onComplete: () => spikes.destroy() })
        }
        if (this.hasLivingGeode) {
          const fx = this.scene.add.circle(this.x, this.y, 10, 0x44aaff, 0.4).setDepth(9)
          this.scene.tweens.add({ targets: fx, scale: 4, alpha: 0, duration: 250, onComplete: () => fx.destroy() })
        }
        if (this.hasWrath) {
          const wrathRing = this.scene.add.circle(this.x, this.y, 15, 0xff6600, 0.6).setDepth(9)
          this.scene.tweens.add({ targets: wrathRing, scale: 6, alpha: 0, duration: 300, onComplete: () => wrathRing.destroy() })
        }
        if (this.hasMoltenSkin) {
          const burst = this.scene.add.circle(this.x, this.y, 8, 0xff4400, 0.4).setDepth(9)
          this.scene.tweens.add({ targets: burst, scale: 5, alpha: 0, duration: 200, onComplete: () => burst.destroy() })
        }
      }
    }

    // Hit flash + damage VFX
    if (reduced >= 1 && this.hasSprite) {
      // Hurt anim on every hit
      this.playAnim('hurt')
      this.scene.time.delayedCall(300, () => {
        if (this.active && !this.isDead) this.currentAnim = '' // force re-eval
      })

      // Rate-limit text/particles to 300ms debounce (like BaseEnemy)
      const now = this.scene.time.now
      if (now - this._lastDmgVfxTime > 300) {
        this._lastDmgVfxTime = now

        // Floating damage number — large, bold, shakes up
        const dmgText = this.scene.add.text(this.x + Phaser.Math.Between(-10, 10), this.y - 30, `-${Math.ceil(reduced)}`, {
          fontFamily: 'monospace', fontSize: '22px', color: '#ff2222',
          stroke: '#000000', strokeThickness: 4,
        }).setDepth(20).setOrigin(0.5)
        this.scene.tweens.add({
          targets: dmgText, y: dmgText.y - 50, alpha: 0,
          duration: 800, ease: 'Power2',
          onComplete: () => dmgText.destroy(),
        })

        // Blood particles — larger, more visible
        const particleCount = Math.min(12, Math.ceil(reduced / 3))
        for (let i = 0; i < particleCount; i++) {
          const size = Phaser.Math.Between(3, 6)
          const blood = this.scene.add.circle(
            this.x, this.y,
            size, 0xdd0000, 0.9
          ).setDepth(10)
          const angle = Math.random() * Math.PI * 2
          const dist = Phaser.Math.Between(20, 50)
          this.scene.tweens.add({
            targets: blood,
            x: blood.x + Math.cos(angle) * dist,
            y: blood.y + Math.sin(angle) * dist,
            alpha: 0, scale: 0.2,
            duration: Phaser.Math.Between(300, 600),
            ease: 'Power2',
            onComplete: () => blood.destroy(),
          })
        }

        // Camera shake on every hit (mild), stronger flash for heavy hits
        this.scene.cameras.main.shake(80, 0.003)
        if (reduced > this.maxHp * 0.1) {
          this.scene.cameras.main.flash(200, 200, 20, 20)
        }
      }
    }

    if (this.hp <= 0) {
      this.hp = 0
      this.die()
    }
  }

  applyPoison(dps: number, duration: number) {
    if (this.isDead) return
    this.poisonDps = Math.max(this.poisonDps, dps)
    this.poisonEndTime = Math.max(this.poisonEndTime, this.scene.time.now + duration)
  }

  private die() {
    // Phoenix Heart: revive once at 50% HP instead of dying
    if (this.hasPhoenixHeart) {
      this.hasPhoenixHeart = false
      this.hp = Math.ceil(this.maxHp * 0.5)
      const ring = this.scene.add.circle(this.x, this.y, 10, 0xff4400, 0.6).setDepth(15)
      this.scene.tweens.add({ targets: ring, scale: 8, alpha: 0, duration: 500, onComplete: () => ring.destroy() })
      this.scene.cameras.main.flash(300, 255, 100, 0)
      return
    }

    // Undying (Amun): revive at full HP, consume one rebirth stack
    if (this.rebirthStacks > 0) {
      this.rebirthStacks--
      this.hp = this.maxHp

      // --- Enhanced rebirth VFX ---
      const cx = this.x, cy = this.y

      // 1. Light beam from above
      const beam = this.scene.add.rectangle(cx, cy - 300, 40, 600, 0xfff8cc, 0.8)
        .setDepth(16).setBlendMode(Phaser.BlendModes.ADD).setOrigin(0.5, 1)
      beam.setScale(0.3, 0)
      this.scene.tweens.add({
        targets: beam, scaleX: 1.5, scaleY: 1, alpha: 0.9, duration: 300, ease: 'Quad.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: beam, scaleX: 0.2, alpha: 0, duration: 500, delay: 200,
            onComplete: () => beam.destroy(),
          })
        },
      })

      // 2. Expanding golden ring
      const ring = this.scene.add.circle(cx, cy, 10, 0xfff200, 0.7).setDepth(15)
      this.scene.tweens.add({ targets: ring, scale: 12, alpha: 0, duration: 700, onComplete: () => ring.destroy() })

      // 3. Second slower ring
      this.scene.time.delayedCall(150, () => {
        const ring2 = this.scene.add.circle(cx, cy, 10, 0xffe066, 0.5).setDepth(15)
        this.scene.tweens.add({ targets: ring2, scale: 8, alpha: 0, duration: 600, onComplete: () => ring2.destroy() })
      })

      // 4. Smoke/dust burst — 12 particles radiating outward
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        const dist = 40 + Math.random() * 50
        const size = 6 + Math.random() * 6
        const smoke = this.scene.add.circle(cx, cy, size, 0xccaa66, 0.6).setDepth(14)
        this.scene.tweens.add({
          targets: smoke,
          x: cx + Math.cos(a) * dist,
          y: cy + Math.sin(a) * dist,
          alpha: 0, scale: 2.5, duration: 500 + Math.random() * 300,
          onComplete: () => smoke.destroy(),
        })
      }

      // 5. Rising golden sparkles
      for (let i = 0; i < 8; i++) {
        this.scene.time.delayedCall(i * 60, () => {
          const sx = cx + (Math.random() - 0.5) * 30
          const spark = this.scene.add.circle(sx, cy, 2, 0xfff200, 0.9).setDepth(16)
          this.scene.tweens.add({
            targets: spark, y: cy - 40 - Math.random() * 30, alpha: 0,
            duration: 400 + Math.random() * 200,
            onComplete: () => spark.destroy(),
          })
        })
      }

      // Camera flash + shake
      this.scene.cameras.main.flash(500, 255, 255, 100)
      this.scene.cameras.main.shake(200, 0.008)

      // Shockwave burst on revive — damages + knocks back enemies
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= 120) {
            (e as any).takeDamage(this.damage, 'shockwave');
            const kb = Phaser.Math.Angle.Between(cx, cy, e.x, e.y);
            (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(kb) * 400, Math.sin(kb) * 400)
          }
        }
      }
      return
    }

    this.isDead = true
    this.touchTarget = null
    this.setVelocity(0, 0)
    if (this.lightningGfx) { this.lightningGfx.destroy(); this.lightningGfx = null }
    if (this.lightningSprite) { this.lightningSprite.destroy(); this.lightningSprite = null }
    if (this.defenseAuraGfx) { this.defenseAuraGfx.destroy(); this.defenseAuraGfx = null }
    if (this.passiveAuraGfx) { this.passiveAuraGfx.destroy(); this.passiveAuraGfx = null }
    if (this.dmgAuraGfx) { this.dmgAuraGfx.destroy(); this.dmgAuraGfx = null }
    for (const s of this.orbitShields) if (s) s.destroy()
    this.orbitShields = []

    // Givi death: crystal ring burst VFX
    if (this.heroType === 'muller') {
      this.crystalRingBurst(this.cx, this.cy)
    }

    if (this.hasSprite) {
      this.playAnim('death')
      this.once('animationcomplete', () => {
        this.scene.events.emit('player-died')
      })
    } else {
      this.setTintFill(0xff0000)
      this.scene.time.delayedCall(500, () => {
        this.scene.events.emit('player-died')
      })
    }
  }

  addXP(amount: number) {
    if (this.isDead) return
    this.xp += Math.floor(amount * this.xpMult)
    const needed = this.xpToNextLevel()
    if (this.xp >= needed) {
      this.xp -= needed
      this.level++
      // Base stat growth per level
      this.damage += 3
      this.maxHp += 8
      this.hp = Math.min(this.hp + 8, this.maxHp)
      this.showLevelUpVfx()
      this.scene.events.emit('player-levelup')
    }
  }

  private showLevelUpVfx() {
    // Golden starburst
    if (this.scene.textures.exists('vfx_levelup')) {
      const burst = this.scene.add.image(this.x, this.y, 'vfx_levelup')
        .setScale(1).setDepth(12).setBlendMode(Phaser.BlendModes.ADD)
      this.scene.tweens.add({
        targets: burst, scale: 5, alpha: 0, duration: 500, ease: 'Quad.easeOut',
        onComplete: () => burst.destroy(),
      })
    }

    // Expanding gold ring
    const ring = this.scene.add.circle(this.x, this.y, 10, 0xffd700, 0.6).setDepth(11)
    this.scene.tweens.add({
      targets: ring, scale: 6, alpha: 0, duration: 600, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    })

    // Rising sparkles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const dist = Phaser.Math.Between(15, 35)
      const px = this.x + Math.cos(angle) * 5
      const py = this.y + Math.sin(angle) * 5
      const sparkle = this.scene.add.circle(px, py, Phaser.Math.Between(2, 4), 0xffd700, 0.9)
        .setDepth(12)
      this.scene.tweens.add({
        targets: sparkle,
        x: px + Math.cos(angle) * dist,
        y: py + Math.sin(angle) * dist - 20,
        alpha: 0, scale: 0.2,
        duration: Phaser.Math.Between(400, 700),
        delay: i * 30,
        onComplete: () => sparkle.destroy(),
      })
    }

    // Brief golden tint on hero
    this.setTint(0xffd700)
    this.scene.time.delayedCall(300, () => {
      if (this.active && !this.isDead) this.clearTint()
    })

    // Camera flash
    this.scene.cameras.main.flash(150, 255, 215, 0, false)
  }

  xpToNextLevel(): number {
    if (this.level <= 2) {
      return Math.floor(CONFIG.XP_BASE * Math.pow(CONFIG.XP_SCALE, this.level - 1))
    }
    // Level 3+: +25% more XP needed per level
    const base = CONFIG.XP_BASE * Math.pow(CONFIG.XP_SCALE, 1) // level 2 base
    return Math.floor(base * Math.pow(CONFIG.XP_SCALE * 1.25, this.level - 2))
  }

  tryAutoAttack(enemies: Phaser.Physics.Arcade.Group, time: number, delta: number) {
    if (this.isDead) return

    // Continuous cone attacks — run every frame, ignore cooldown
    if (this.heroType === 'sifra' && this.stance === 'lightning') {
      if (this.lightningEnergy <= 0) {
        this.toggleStance()
      } else {
        this.currentAttackBranch = 'lightning'
        this.lightningEnergy = Math.max(0, this.lightningEnergy - this.energyDrainRate * this.getMasteryCostMult('lightning') * (delta / 1000))
        // Award mastery XP ~1.0 per second of channeling
        this._lightningMasteryAccum += delta
        if (this._lightningMasteryAccum >= 1000) {
          this.awardMasteryXP('lightning', 1.0)
          this._lightningMasteryAccum -= 1000
        }
        this.attackLightning(enemies, delta)
      }
      return
    }

    if (this.isAttacking) return
    let cd = this.attackCooldown
    if (time - this.lastAttackTime < cd) return

    // Nazar venom / Huntress spear stance gets extended range
    let searchRange = this.range
    if (this.heroType === 'nazar' && this.nazarStance === 'venom') searchRange += 100
    if (this.heroType === 'huntress' && this.huntressStance === 'melee') searchRange = 80
    if (this.heroType === 'khashin' && this.khashinStance === 'haboob') searchRange = 90
    if (this.heroType === 'amun' && this.hasQuakeStance && this.amunStance === 'melee') searchRange = 65
    if (this.heroType === 'amun' && this.hasQuakeStance && this.amunStance === 'quake') searchRange = Math.ceil(this.range * 1.5)
    let closest: Phaser.Physics.Arcade.Sprite | null = null
    let closestDist = Infinity
    for (const enemy of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!enemy.active) continue
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist < searchRange && dist < closestDist) {
        closestDist = dist
        closest = enemy
      }
    }
    if (!closest) return

    this.lastAttackTime = time
    const melee = (this.heroType === 'nazar' && this.nazarStance === 'sword')
      || (this.heroType === 'amun' && (this.amunStance === 'melee' || !this.hasQuakeStance))
      || (this.heroType === 'huntress' && this.huntressStance === 'melee')
    this.isAttacking = melee
    this.setFlipX(closest.x < this.x)
    if (this.hasSprite && this.heroType !== 'huntress' && this.heroType !== 'khashin' && this.heroType !== 'muller' && !(this.heroType === 'amun' && this.hasQuakeStance)) {
      const branchAnim = this.getBranchAttackAnim()
      if (branchAnim && this.scene.anims.exists(branchAnim)) {
        this.currentAnim = branchAnim; this.play(branchAnim)
      } else {
        this.playAnim('attack')
      }
    }

    const target = closest
    // Sifra ice energy drain per shot
    if (this.heroType === 'sifra' && this.heroDef.attackType === 'iceshard' && this.stance === 'ice') {
      if (this.iceEnergy <= 0) {
        this.toggleStance()
        this.isAttacking = false
        return
      }
      this.currentAttackBranch = 'ice'
      this.iceEnergy = Math.max(0, this.iceEnergy - this.energyDrainPerShot * this.getMasteryCostMult('ice'))
      this.awardMasteryXP('ice', 1.0)
    }
    switch (this.heroDef.attackType) {
      case 'dash':      this.attackDash(target, enemies); break
      case 'iceshard':   this.attackIceShard(target, enemies); break
      case 'shockwave':
        if (this.hasQuakeStance && this.amunStance === 'quake') {
          if (this.quakeEnergy <= 0) {
            this.toggleAmunStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'quake'
          this.quakeEnergy = Math.max(0, this.quakeEnergy - 15 * this.getMasteryCostMult('quake'))
          this.awardMasteryXP('quake', 1.0)
          this.attackShockwave(enemies)
        } else if (this.hasQuakeStance && this.amunStance === 'melee') {
          if (this.groundEnergy <= 0) {
            this.toggleAmunStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'ground'
          this.groundEnergy = Math.max(0, this.groundEnergy - 10 * this.getMasteryCostMult('ground'))
          this.awardMasteryXP('ground', 1.0)
          if (this.hasSprite) {
            this.playAnim('attack')
          }
          this.attackAmunMelee(target, enemies)
        } else {
          // Base attack — always melee (no stance)
          this.attackAmunMelee(target, enemies)
        }
        break
      case 'poison':    this.attackPoison(target, enemies); break
      case 'fireball':
        this.currentAttackBranch = 'fireball'
        this.awardMasteryXP('fireball', 1.0)
        this.attackFireball(target, enemies)
        break
      case 'spear':
        if (this.huntressStance === 'melee') {
          if (this.meleeEnergy <= 0) {
            this.toggleHuntressStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'melee'
          this.meleeEnergy = Math.max(0, this.meleeEnergy - 8 * this.getMasteryCostMult('melee'))
          this.awardMasteryXP('melee', 1.0)
          // Alternate Attack1 / Attack2 for melee combo
          if (this.hasSprite) {
            this.huntressMeleeCombo = !this.huntressMeleeCombo
            const key = this.huntressMeleeCombo ? 'huntress_attack2' : `${this.animPrefix}_attack`
            if (this.currentAnim !== key) { this.currentAnim = key; this.play(key) }
          }
          this.attackHuntressMelee(enemies)
        } else {
          if (this.spearEnergy <= 0) {
            this.toggleHuntressStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'spear'
          this.spearEnergy = Math.max(0, this.spearEnergy - 12 * this.getMasteryCostMult('spear'))
          this.awardMasteryXP('spear', 1.0)
          const frenzyBonus = (this.hasBattleFrenzy && this.battleFrenzyUntil > this.scene.time.now) ? 0.9 : 1
          this.lastAttackTime += Math.floor(900 * frenzyBonus)  // extra cooldown for ranged
          if (this.hasSprite) {
            const key = 'huntress_ranged'
            if (this.currentAnim !== key) { this.currentAnim = key; this.play(key) }
          }
          this.attackSpear(target, enemies)
        }
        break
      case 'windslash':
        if (this.khashinStance === 'haboob') {
          if (this.sandEnergy <= 0) {
            this.toggleKhashinStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'sand'
          this.sandEnergy = Math.max(0, this.sandEnergy - 10 * this.getMasteryCostMult('sand'))
          this.awardMasteryXP('sand', 1.0)
          // Haboob stance uses regular attack anim (melee)
          if (this.hasSprite) {
            const key = `${this.animPrefix}_attack`
            this.currentAnim = key; this.play(key)
          }
          this.attackSandSwipe(target, enemies)
        } else {
          if (this.windEnergy <= 0) {
            this.toggleKhashinStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'wind'
          this.windEnergy = Math.max(0, this.windEnergy - 8 * this.getMasteryCostMult('wind'))
          this.awardMasteryXP('wind', 1.0)
          // Wind stance uses air attack anim (ranged)
          if (this.hasSprite) {
            const key = 'khashin_air_attack'
            this.currentAnim = key; this.play(key)
          }
          this.attackWindSlash(target, enemies)
        }
        break
      case 'crystalwave': {
        this.currentAttackBranch = 'crystal'
        this.awardMasteryXP('crystal', 1.0)
        // Base attack: crystal wave toward target
        const isTectonicProc = this.hasTectonicFury && this.tectonicCounter > 0 && (this.tectonicCounter + 1) % 5 === 0
        if (this.hasSprite) {
          // Ground slam for regular wave, special attack for Tectonic Fury
          const key = isTectonicProc && this.scene.anims.exists('muller_special_attack')
            ? 'muller_special_attack'
            : this.scene.anims.exists('muller_ground_slam') ? 'muller_ground_slam' : `${this.animPrefix}_attack`
          this.currentAnim = key; this.play(key)
        }
        this.attackCrystalWave(target, enemies)
        // Tectonic Fury: every 5th attack also triggers eruption ring burst + giant pillar
        if (this.hasTectonicFury && this.tectonicCounter > 0 && this.tectonicCounter % 5 === 0) {
          this.attackCrystalEruption(enemies)
          // Giant crystal pillar at player position
          const pillar = muller.spawnCrystalSpike(this, this.cx, this.cy, 2.0)
          if (pillar) {
            pillar.setDepth(13).setScale(0.01)
            this.scene.tweens.add({
              targets: pillar, scaleX: 2.0, scaleY: 2.0,
              duration: 250, ease: 'Back.easeOut',
            })
            this.scene.tweens.add({
              targets: pillar, alpha: 0, scaleY: 2.5,
              duration: 600, delay: 500,
              onComplete: () => pillar.destroy(),
            })
          }
        }
        break
      }
      case 'melee':
        if (this.nazarStance === 'venom') {
          if (this.venomEnergy <= 0) {
            this.toggleNazarStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'venom'
          this.venomEnergy = Math.max(0, this.venomEnergy - 8 * this.getMasteryCostMult('venom'))
          this.awardMasteryXP('venom', 1.0)
          this.lastAttackTime += 400  // venom is slower than sword
          this.attackPoison(target, enemies)
        } else {
          if (this.swordEnergy <= 0) {
            this.toggleNazarStance()
            this.isAttacking = false
            return
          }
          this.currentAttackBranch = 'sword'
          this.swordEnergy = Math.max(0, this.swordEnergy - 6 * this.getMasteryCostMult('sword'))
          this.awardMasteryXP('sword', 1.0)
          this.attackMelee(enemies)
        }
        break
    }
  }

  // NAZAR SWORD — Melee slash around player
  private attackMelee(enemies: Phaser.Physics.Arcade.Group) {
    nazar.attackMelee(this, enemies)
  }

  // IGNARA — Fireball projectile with AOE explosion
  private attackFireball(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    ignara.attackFireball(this, target, enemies)
  }

  // SIFRA LIGHTNING — Cone attack (wide spread, shorter range)
  lightningGfx: Phaser.GameObjects.Graphics | null = null
  lightningSprite: Phaser.GameObjects.Image | null = null
  lightningSparkTimer = 0

  private attackLightning(enemies: Phaser.Physics.Arcade.Group, delta: number) {
    sifra.attackLightning(this, enemies, delta)
  }

  // Dash slash (originally Khet — kept for re-use)
  private attackDash(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    nazar.attackDash(this, target, enemies)
  }

  // SIFRA — Ice shard (piercing crystal with frost trail)
  private attackIceShard(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    sifra.attackIceShard(this, target, enemies)
  }

  // AMUN — Shockwave ring (quake stance)
  private attackShockwave(enemies: Phaser.Physics.Arcade.Group) {
    amun.attackShockwave(this, enemies)
  }

  // AMUN — Melee ground slam (melee stance)
  private attackAmunMelee(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    amun.attackMelee(this, target, enemies)
  }

  // NAZAR — Poison cloud (animated expanding puffs → ring → dissipate)
  private attackPoison(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    nazar.attackPoison(this, target, enemies)
  }

  private spawnBuffParticles() {
    // Only show buff auras if the hero has been upgraded (level > 1)
    if (this.level <= 1) return

    const buffColors: number[] = []

    // Determine which buff categories are active based on stat changes
    if (this.armor > 0) buffColors.push(0x8888ff) // blue — armor/defense
    if (this.hpRegen > 0) buffColors.push(0x44ff44) // green — regen
    if (this.splashRadius > 0) buffColors.push(0xff8844) // orange — splash/AoE
    if (this.strikeCount > 1) buffColors.push(0xffffff) // white — multistrike
    if (this.xpMult > 1) buffColors.push(0xffd700) // gold — wisdom

    if (buffColors.length === 0) return

    // Pick a random active buff color and spawn a small particle
    const color = buffColors[Math.floor(Math.random() * buffColors.length)]
    const angle = Math.random() * Math.PI * 2
    const dist = Phaser.Math.Between(10, 22)
    const px = this.x + Math.cos(angle) * dist
    const py = this.y + Math.sin(angle) * dist

    const particle = this.scene.add.circle(px, py, Phaser.Math.Between(1, 3), color, 0.6).setDepth(7)
    this.scene.tweens.add({
      targets: particle,
      y: py - Phaser.Math.Between(15, 30),
      alpha: 0, scale: 0.2,
      duration: Phaser.Math.Between(500, 800),
      onComplete: () => particle.destroy(),
    })
  }

  update(_time: number, delta: number) {
    if (this.isDead) return

    // Shadow follows player — at feet level
    if (this._shadow) {
      const body = this.body as Phaser.Physics.Arcade.Body
      this._shadow.setPosition(this.x, body.bottom)
    }

    if (this.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * (delta / 1000))
    }

    // Hero-specific energy regen
    if (this.heroType === 'sifra') sifra.updateSifraEnergy(this, delta)
    if (this.heroType === 'nazar') nazar.updateNazarEnergy(this, delta)
    if (this.heroType === 'huntress') huntress.updateHuntressEnergy(this, delta)
    if (this.heroType === 'amun') amun.updateAmunEnergy(this, delta)

    // Hero-specific passive mechanics
    if (this.heroType === 'huntress') huntress.updateHuntressPassives(this, delta)

    // Shield timer decay
    if (this.shieldTimer > 0) {
      this.shieldTimer -= delta
      if (this.shieldTimer <= 0) { this.shieldHp = 0; this.shieldTimer = 0 }
    }

    // Speed buff expiry
    if (this.speedBuffUntil > 0 && this.scene.time.now > this.speedBuffUntil) {
      this.speedBuffUntil = 0
      // Restore speed from cache instead of dividing (avoids floating-point drift / compounding)
      this.speed = this.baseSpeedCache
    }

    // Poison tick
    if (this.poisonEndTime > this.scene.time.now) {
      this.takeDamage(this.poisonDps * (delta / 1000))
      this.setTint(0x88ff88) // green tint while poisoned
    } else if (this.poisonDps > 0) {
      this.poisonDps = 0
      this.clearTint()
    }

    // Buff aura particles — spawn periodic visual indicators
    this.buffAuraTimer += delta
    if (this.buffAuraTimer >= 400) {
      this.buffAuraTimer = 0
      this.spawnBuffParticles()
    }

    // Hero-specific aura/passive updates
    if (this.heroType === 'amun') amun.updateAmunPassives(this, delta)
    if (this.heroType === 'sifra') sifra.updateSifraPassives(this, delta)

    const pBody = this.body as Phaser.Physics.Arcade.Body

    // Keyboard movement (WASD / arrows) — takes priority
    let kbX = 0, kbY = 0
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) kbX = -1
      if (this.cursors.right.isDown || this.wasd.D.isDown) kbX = 1
      if (this.cursors.up.isDown || this.wasd.W.isDown) kbY = -1
      if (this.cursors.down.isDown || this.wasd.S.isDown) kbY = 1
    }

    // During melee attack: allow movement at 50% speed (no full freeze)
    const atkSpeedMult = this.isAttacking ? 0.5 : 1
    let moving = false
    if (kbX !== 0 || kbY !== 0) {
      const len = Math.sqrt(kbX * kbX + kbY * kbY)
      pBody.setVelocity((kbX / len) * this.speed * atkSpeedMult, (kbY / len) * this.speed * atkSpeedMult)
      if (!this.isAttacking) this.setFlipX(kbX < 0)
      this.touchTarget = null
      this.joystickDir = null
      moving = true
    } else if (this.joystickDir) {
      const { dx, dy } = this.joystickDir
      pBody.setVelocity(dx * this.speed * atkSpeedMult, dy * this.speed * atkSpeedMult)
      if (!this.isAttacking) this.setFlipX(dx < 0)
      moving = true
    } else if (this.touchTarget) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.touchTarget.x, this.touchTarget.y)
      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.touchTarget.x, this.touchTarget.y)
        pBody.setVelocity(Math.cos(angle) * this.speed * atkSpeedMult, Math.sin(angle) * this.speed * atkSpeedMult)
        if (!this.isAttacking) this.setFlipX(this.touchTarget.x < this.x)
        moving = true
      } else {
        pBody.setVelocity(0, 0)
        this.touchTarget = null
      }
    } else {
      pBody.setVelocity(0, 0)
    }

    // Hero-specific movement-based passives
    if (this.hasLavaTrail && moving) ignara.updateLavaTrail(this, delta)
    if (this.hasPhantomTrail && moving) nazar.updatePhantomTrail(this, delta, moving)

    // Hero-specific passive mechanics (per-hero)
    if (this.heroType === 'khashin') khashin.updateKhashinPassives(this, delta, moving)
    if (this.heroType === 'muller') muller.updateMullerPassives(this, delta)

    // Animation state (spritesheet heroes only)
    if (this.hasSprite && !this.isAttacking) {
      this.playAnim(moving ? 'run' : 'idle')
    }
  }

  // HUNTRESS MELEE — quick stab around player
  private attackHuntressMelee(enemies: Phaser.Physics.Arcade.Group) {
    huntress.attackHuntressMelee(this, enemies)
  }

  // HUNTRESS RANGED — spear flies across visible zone with pierce limit
  private attackSpear(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    huntress.attackSpear(this, target, enemies)
  }

  // -----------------------------------------------------------------------
  // Khashin — Wind Slash (ranged, sirocco stance)
  // -----------------------------------------------------------------------
  private attackWindSlash(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    khashin.attackWindSlash(this, target, enemies)
  }

  // Khashin — Sand Swipe (melee, haboob stance)
  // -----------------------------------------------------------------------
  private attackSandSwipe(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    khashin.attackSandSwipe(this, target, enemies)
  }


  // -----------------------------------------------------------------------
  // Crystal Muller — Crystal Wave attack (directional cone)
  // -----------------------------------------------------------------------
  private attackCrystalWave(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    muller.attackCrystalWave(this, target, enemies)
  }

  /** Shared crystal ring burst VFX — crystals evenly spaced by angle, all fly outward from epicenter simultaneously.
   *  Used by eruption attack and death. radius scales crystals proportionally. */
  private crystalRingBurst(cx: number, cy: number, radius = 80) {
    return muller.crystalRingBurst(this, cx, cy, radius)
  }

  // Crystal Muller — Eruption stance (AoE around self)
  private attackCrystalEruption(enemies: Phaser.Physics.Arcade.Group) {
    muller.attackCrystalEruption(this, enemies)
  }

  /** Small impact burst when spear hits an enemy */
  spearHitVfx(x: number, y: number, tint: number) {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Phaser.Math.Between(6, 14)
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(1, 3), tint, 0.7).setDepth(10)
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
        alpha: 0, scale: 0, duration: 200,
        onComplete: () => p.destroy(),
      })
    }
  }
}
