import Phaser from 'phaser'
import { gameFont } from '../utils/device'
import { CONFIG } from '../config/GameConfig'
import * as ignara from './heroes/ignara'
import * as sifra from './heroes/sifra'
import * as amun from './heroes/amun'
import * as nazar from './heroes/nazar'
import * as huntress from './heroes/huntress'
import * as khashin from './heroes/khashin'
import * as muller from './heroes/muller'
import * as nightborne from './heroes/nightborne'
import * as vael from './heroes/vael'
import { generateHeroFallbackTexture } from './heroes/fallbackTextures'
import { MetaProgress } from '../systems/MetaProgress'
import { type IInputController, KeyboardInputController } from '../systems/InputController'

export type HeroType = 'ignara' | 'sifra' | 'amun' | 'nazar' | 'huntress' | 'khashin' | 'muller' | 'nightborne' | 'vael'

const ZERO_DIR = { dx: 0, dy: 0 } as const

interface HeroDef {
  hp: number; speed: number; damage: number; range: number; cooldown: number
  color: number; attackType: 'flamethrower' | 'dash' | 'iceshard' | 'shockwave' | 'poison' | 'melee' | 'fireball' | 'spear' | 'windslash' | 'crystalwave' | 'voidslash' | 'soulbolt'
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
  /**
   * If set, hero uses ONE combined sheet (key = sheetKey) instead of separate
   * per-animation textures. Frame ranges override the anims frame counts.
   */
  sheetKey?: string
  /** Frame ranges for single-sheet heroes — [start, end] inclusive */
  animFrames?: { idle: [number, number]; run: [number, number]; attack: [number, number]; hurt: [number, number]; death: [number, number] }
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
  muller:     { scale: 1.35, bodyW: 26, bodyH: 40, bodyOffX: 127, bodyOffY: 87, anims: { idle: 8, run: 8, attack: 7, hurt: 6, death: 15 } },
  nightborne: { scale: 0.65, bodyW: 43, bodyH: 60, bodyOffX: 95, bodyOffY: 141, anims: { idle: 9, run: 6, attack: 12, hurt: 5, death: 23 } },
  vael: {
    scale: 1.6, bodyW: 24, bodyH: 40, bodyOffX: 68, bodyOffY: 78,
    anims: { idle: 8, run: 8, attack: 13, hurt: 5, death: 9 },
    sheetKey: 'vael_sheet',
    animFrames: {
      // 17-col grid. Row 0: idle (8), Row 1: run (8), Row 2: cast+star (13),
      // Row 4: attack (17), Row 5: hurt (5), Row 6: death (9)
      idle:   [0,   7],
      run:    [17,  24],
      attack: [34,  46],  // row 2 — cast with star burst (visible attack anim)
      hurt:   [85,  89],
      death:  [102, 110],
    },
  },
}

// Hero colors use Tailwind-inspired palette (matches HEROES in HeroSelectScene)
export const HERO_DEFS: Record<HeroType, HeroDef> = {
  ignara:    { hp: 80,  speed: 140, damage: 30, range: 230, cooldown: 700,  color: 0xf97316, attackType: 'fireball' },
  sifra:     { hp: 70,  speed: 150, damage: 12, range: 160, cooldown: 800,  color: 0x38bdf8, attackType: 'iceshard' },
  amun:      { hp: 160, speed: 120, damage: 22, range: 65,  cooldown: 800,  color: 0xfbbf24, attackType: 'shockwave' },
  nazar:     { hp: 90,  speed: 140, damage: 18, range: 55,  cooldown: 400,  color: 0xf43f5e, attackType: 'melee' },
  huntress:  { hp: 80,  speed: 140, damage: 18, range: 300, cooldown: 500,  color: 0x10b981, attackType: 'spear' },
  khashin:   { hp: 90,  speed: 140, damage: 18, range: 160, cooldown: 900,  color: 0x67e8f9, attackType: 'windslash' },
  muller:    { hp: 160, speed: 110, damage: 38, range: 260, cooldown: 1100, color: 0x60a5fa, attackType: 'crystalwave' },
  nightborne: { hp: 110, speed: 150, damage: 28, range: 90,  cooldown: 850,  color: 0xa855f7, attackType: 'voidslash' },
  vael:       { hp: 85,  speed: 130, damage: 22, range: 220, cooldown: 700,  color: 0xa78bfa, attackType: 'soulbolt' },
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
  firestormOrbCount = 0
  hasPyromaniac = false
  hasMoltenSkin = false
  hasEmberVolley = false
  emberVolleyCap = 0.2
  emberVolleyDmg = false
  emberVolleyStacks = 0
  lavaTrailTimer = 0
  hasFlashpoint = false
  flashpointCharges = 1
  flashpointBurst = false
  flashpointRemaining = 0

  // Inferno — Ashen Veil
  hasAshenVeil = false
  ashenVeilDR = 0.10
  ashenVeilMaxStacks = 1
  ashenVeilStacks = 0
  ashenVeilUntil = 0

  // Pyre branch
  hasMoltenVolley = false
  moltenVolleyCount = 3
  moltenVolleyScorch = false

  // Pyre — Slug Round
  hasSlugRound = false
  slugPierce = 0
  hasImmolation = false
  immolationRadius = 50
  immolationDmgPct = 0.15
  hasScorchedBastion = false
  scorchedBastionLifesteal = 0

  // Bullet Heaven branch
  hasSustainedBurn = false
  burnMaxStacks = 5
  burnStackedDmgBonus = false
  hasPowderKeg = false
  powderKegThreshold = 10
  powderKegCounter = 0
  powderKegReady = false
  powderKegShrapnel = false
  hasInfernalCadence = false
  infernalCadenceEndTime = 0
  infernalCadenceDuration = 6000
  infernalCadenceCooldownUntil = 0
  infernalCadenceCooldown = 18000
  burnTickTimer = 0

  // Nazar upgrade mechanic flags
  hasChainDash = false
  hasVanish = false
  vanishUntil = 0
  vanishCooldownUntil = 0
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
  _phantomTrails: Phaser.GameObjects.Arc[] = []

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
  _iceArmorAura: Phaser.GameObjects.Graphics | null = null
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
  miniBossKills = 0
  goldThisRun = 0
  damageTakenThisRun = 0
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
  isDead = false
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
  shieldTickTimer = 0         // discrete tick accumulator for shield swept-arc damage
  hasThorns = false           // orbiting swords (Wrath skill)
  thornsLevel = 0             // 1/2/3 — controls sword count & rotation speed
  thornsDmgBonus = 0          // additive % bonus to sword damage (lvl2 +0.05, lvl3 +0.10)
  thornsTickTimer = 0         // discrete tick accumulator for sword damage
  orbitSwords: Phaser.GameObjects.Image[] = []  // managed by updateAmunPassives
  thornsTrailGfx: Phaser.GameObjects.Graphics | null = null  // lvl3 trail VFX
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
  lastHeadhunterCheck = 0  // timestamp of last Headhunter execute scan
  spearWallGfx: Phaser.GameObjects.Graphics | null = null
  spearWallAngle = 0     // rotating spear wall angle

  // Vael stance — 'orbs' (homing soul orbs) or 'drain' (vampiric green bolts)
  vaelStance: 'orbs' | 'drain' = 'orbs'
  orbsEnergy = 100
  drainEnergy = 100

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
  // Khashin ad-hoc runtime fields (written by UpgradeSystem and khashin.ts)
  _sandArmorHP = 0
  _sandArmorMax = 0
  _sandArmorRegenDelay = 0
  _scarabs: Phaser.GameObjects.Arc[] = []
  _scarabDeathListener: ((x: number, y: number) => void) | null = null

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
  tectonicCounter = 0
  stoneSkinStacks = 0
  stoneSkinTimer = 0
  private _stoneSkinAccum = 0
  geodeShellCooldown = 0
  crystalWallTimer = 0
  crystalPillarTimer = 0
  crystalWaveConeAngle = 40     // degrees
  motherLodeTimer = 0

  // Nightborne (Void Blade) upgrade mechanic flags
  // -- Void Blade branch
  hasVoidEdge = false
  voidEdgeLevel = 0
  hasCleave = false                // NOTE: generic g7 also sets splashRadius; this is hero-specific arc widener
  voidCleaveEdgeBonus = 0
  hasVoidSurge = false
  voidSurgeLevel = 0
  _surgeCounter = 0
  voidSurgeEvery = 4
  voidSurgeRadius = 140
  voidSurgeDmgPct = 0.6
  hasDarkResonance = false
  darkResonanceLevel = 0
  darkResonanceRadius = 40
  darkResonanceDmgPct = 0.5
  hasVoidAscendant = false
  voidAscendantLevel = 0
  _ascendantUntil = 0
  _ascendantCDTimer = 999999
  voidAscendantDuration = 6000
  voidAscendantCooldown = 45000
  // -- Phantom branch
  hasEchoStrike = false
  echoStrikeLevel = 0
  echoStrikeDmgPct = 0.35
  hasSplitShade = false
  splitShadeLevel = 0
  _splitShadeCooldownUntil = 0
  hasPhantomVeil = false
  phantomVeilLevel = 0
  phantomVeilChance = 0.3
  hasMirrorSwarm = false
  mirrorSwarmSlashes = 1
  hasShadeLegion = false
  shadeLegionLevel = 0
  shadeLegionDuration = 5000
  shadeLegionCooldown = 50000
  shadeLegionDmgPct = 0.7
  _shadeLegionUntil = 0
  _shadeLegionCDTimer = 999999
  _invulnUntil = 0
  // -- Rift branch
  hasVoidStep = false
  voidStepLevel = 0
  voidStepDist = 50
  hasRiftAnchor = false
  riftAnchorLevel = 0
  _anchorX!: number
  _anchorY!: number
  _anchorExpiry = 0
  _anchorTimer = 0
  riftAnchorCooldown = 12000
  riftAnchorDuration = 8000
  riftAnchorHpThreshold = 0.25
  hasVoidZone = false
  voidZoneRadius = 40
  voidZoneDuration = 3000
  voidZoneDotPct = 0.08
  hasSpatialTear = false
  spatialTearLevel = 0
  _spatialTearTimer = 0
  spatialTearCooldown = 8000
  spatialTearRadius = 80
  hasRiftCollapse = false
  riftCollapseLevel = 0
  _riftCollapseCDTimer = 999999
  riftCollapseCooldown = 40000
  riftCollapseRadius = 200
  riftCollapseDmgPct = 1.8
  // Derived arc stats (set by upgrade apply fns)
  voidArcRange = 90
  voidArcAngle = 150

  // Vael (Pale Doctor) upgrade mechanic flags
  // Pale Harvest branch
  hasHollowTouch = false
  hollowTouchRate = 0.08
  hollowTouchDrainRate = 0.04
  hollowTouchArmorHeal = false
  hollowTouchBoneHeal = false
  hollowTouchOverkillHalf = false
  hasSoulSiphon = false
  soulSiphonDropChance = 0.10
  soulSiphonMaxStacks = 8
  soulStacks = 0   // current armor stacks from collected souls
  soulSiphonDrainAlwaysDrop = false
  soulSiphonDrainKillCount = 1
  soulSiphonBoneHeal = 0
  soulSiphonAutoCollectRadius = 0
  soulSiphonExtraDropChance = 0
  hasWoundMemory = false
  woundMemoryBonus = 0.20
  woundMemoryRootDur = 400
  woundMemoryFreeArmorOnRepeat = false
  woundMemoryRecentHitWindow = 0
  hasExsanguination = false
  exsangChainCount = 2
  exsangDmgPct = 0.60
  exsangRangeBonus = 0
  exsangDoubleArc = false
  exsangDrainTickDmgBonus = 0
  exsangDrainSecondArcLifesteal = false
  hasSanguineAscendancy = false
  sanguineWindowDuration = 6000
  sanguineHealPct = 0.12
  sanguineInstantOrbs = false
  sanguineLowHpDR = false
  sanguineDrainTickPct = 0.20
  sanguineDrainTickRateDouble = false
  sanguineDrainHealCapPerTick = 0
  sanguineBonesAutoArc = false
  // Ossuary branch
  hasRisen = false
  risenProcChance = 0.25
  risenDrainProcChance = 0.40
  risenDuration = 4000
  risenDmgPct = 0.30
  risenMaxThralls = 999
  risenDrainAutoTarget = false
  risenDrainHPBonus = 0
  hasGravePact = false
  gravePactHPBonus = 0
  gravePactDeathBurst = false
  gravePactDeathRoot = false
  gravePactBurstDmgPct = 0.60
  gravePactBurstRadiusBonus = 0
  gravePactDrainFlatDmg = false
  gravePactDrainEnergyReduc = 0
  gravePactDrainReachPerThrall = 0
  gravePactDrainRelayBonus = 0
  hasUndyingLabor = false
  undyingLaborAtkSpeedPct = 0.05
  undyingLaborDmgBonus = 0
  undyingLaborStanceSwitchDiscount = 0
  hasCharnelTide = false
  charnelTideRadius = 250
  charnelTideMax = 5
  charnelTideDuration = 8000
  charnelTideCooldown = 20000
  charnelTideExplode = false
  charnelTideOrbsBoneDrop = false
  charnelTideOrbsDmgBonus = 0
  charnelTideDrainRangeBoost = 0
  charnelTideExplodeBoneDrop = 0
  charnelTideExplodeRot = false
  hasUndyingHorde = false
  undyingHordeReformTime = 8000
  undyingHordeDmgBonus = 0
  undyingHordeHealPerSec = 0
  undyingHordeDeathExplosion = false
  undyingHordeCharnelOnDeath = false
  undyingHordeHPBonus = 0
  // Wasting Plague branch
  hasFesteringWound = false
  festeringWoundStacks = 1
  festeringWoundDmgBonus = 0.15
  rotSlowDecay = false
  rotSlow = false
  festeringDrainEveryNTicks = 2
  festeringDrainBurstOnHigh = false
  hasVirulentSpread = false
  virulentSpreadRadius = 80
  virulentDmgPerStack = 0.10
  virulentStunAt = 999
  virulentOrbsMultiTarget = false
  virulentStunBonusBone = false
  hasNecroticBloom = false
  necroticBloomThreshold = 5
  necroticBloomRadius = 100
  necroticBloomDuration = 5000
  necroticBloomDmgPct = 0.12
  necroticBloomAddRot = false
  necroticBloomMaxPools = 4
  necroticBloomDrainDmgBonus = 0
  necroticBloomDrainDoubleTick = false
  necroticBloomOrbsDetonate = false
  necroticBloomDrainBoneArmor = false
  hasVaelPandemic = false
  pandemicRadius = 200
  pandemicStacks = 5
  pandemicCooldown = 18000
  pandemicDoublePulse = false
  pandemicDoubleRadiusBlight = false
  pandemicRangeBoostDuration = 3000
  pandemicOrbsBoneOnNextDeath = false
  pandemicOrbsBoneOnKill = false
  pandemicTendrilTickRateBoost = 0
  pandemicDrainFreeCost = false
  hasCarrionCrown = false
  carrionAuraRadius = 150
  carrionAuraInterval = 2000
  carrionWeaken = false
  carrionKillPulse = false
  carrionOrbsBonusStack = false
  carrionDrainCostReduc = 0
  carrionOrbsDmgBonus = 0
  carrionOrbsKillPulseBlight = false
  carrionDrainKillPulseEnergy = false

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
  static readonly MASTERY_THRESHOLDS_DOUBLE = [100, 300, 600]
  /** Branches that require 2x XP per level (single-stance heroes + Amun ground) */
  static readonly DOUBLE_XP_BRANCHES = new Set(['fireball', 'crystal', 'ground'])
  static readonly MASTERY_COST_MULT = [1.0, 0.90, 0.82, 0.76]  // energy cost multiplier per level
  static readonly MASTERY_NAMES = ['', 'Practiced', 'Adept', 'Master']
  branchMasteryXP: Record<string, number> = {}
  branchMasteryLevel: Record<string, number> = {}
  /** Which branch is currently attacking — set in tryAutoAttack, read by hero modules for kill XP */
  currentAttackBranch = ''
  private _lightningMasteryAccum = 0  // throttle continuous lightning XP

  static getMasteryThresholds(branch: string): readonly number[] {
    return Player.DOUBLE_XP_BRANCHES.has(branch)
      ? Player.MASTERY_THRESHOLDS_DOUBLE
      : Player.MASTERY_THRESHOLDS
  }

  awardMasteryXP(branch: string, amount: number) {
    if (!branch) return
    const xp = (this.branchMasteryXP[branch] ?? 0) + amount
    this.branchMasteryXP[branch] = xp
    const curLevel = this.branchMasteryLevel[branch] ?? 0
    const thresholds = Player.getMasteryThresholds(branch)
    if (curLevel < 3 && xp >= thresholds[curLevel]) {
      this.branchMasteryLevel[branch] = curLevel + 1
      // Sifra mastery 1 & 2: +2 range per level
      if (this.heroType === 'sifra' && curLevel + 1 <= 2) {
        this.range += 2
      }
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
  private _stanceKey: Phaser.Input.Keyboard.Key | null = null

  public inputController: IInputController | null = null
  public isLocalPlayer = true
  /** In online mode, server is authoritative — skip local physics movement */
  public serverAuthoritative = false

  constructor(scene: Phaser.Scene, x: number, y: number, heroType: HeroType = 'ignara') {
    const sprCfg = SPRITE_HEROES[heroType]
    // Single-sheet heroes (e.g. vael) use sheetKey; reuse heroes use srcHero_idle; else hero_idle
    let hasSpr: boolean
    let texKey: string
    if (sprCfg?.sheetKey) {
      hasSpr = scene.textures.exists(sprCfg.sheetKey)
      texKey = hasSpr ? sprCfg.sheetKey : `hero_${heroType}`
    } else {
      const srcHero = sprCfg?.reuseFrom || heroType
      hasSpr = scene.textures.exists(`${srcHero}_idle`)
      texKey = hasSpr ? `${srcHero}_idle` : `hero_${heroType}`
    }

    if (!hasSpr) generateHeroFallbackTexture(scene, heroType)
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

    // Input controller — handles keyboard/joystick/touch input
    if (this.isLocalPlayer) {
      this.inputController = new KeyboardInputController(scene)
    }
  }

  destroy(fromScene?: boolean) {
    if (this._stanceKey) {
      this._stanceKey.destroy()
      this._stanceKey = null
    }
    if (this.inputController) {
      this.inputController.destroy()
      this.inputController = null
    }
    super.destroy(fromScene)
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
      case 'vael': return this.vaelStance
      default: return ''
    }
  }

  toggleKhashinStance() {
    if (this.heroType !== 'khashin') return
    this.khashinStance = this.khashinStance === 'sirocco' ? 'haboob' : 'sirocco'
    this.scene.events.emit('khashin-stance-changed', this.khashinStance)
  }

  toggleVaelStance() {
    if (this.heroType !== 'vael') return
    // Stance switch is free; Undying Labor L3 / Lich Dominion L3 discount flags
    // are currently cosmetic (no base cost to discount from — reserved for future tuning).
    this.vaelStance = this.vaelStance === 'orbs' ? 'drain' : 'orbs'
    this.scene.events.emit('vael-stance-changed', this.vaelStance)
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
      if (hero === 'nightborne') continue // nightborne anims created below with custom frameRates

      // Single-sheet heroes (e.g. vael): all anims live on one combined texture
      if (cfg.sheetKey && cfg.animFrames) {
        if (!scene.textures.exists(cfg.sheetKey)) continue
        const frames = cfg.animFrames
        const sheetDefs: [string, [number, number], number][] = [
          ['idle',   frames.idle,   -1],
          ['run',    frames.run,    -1],
          ['attack', frames.attack,  0],
          ['hurt',   frames.hurt,    0],
          ['death',  frames.death,   0],
        ]
        for (const [name, [start, end], repeat] of sheetDefs) {
          const key = `${hero}_${name}`
          if (scene.anims.exists(key)) continue
          scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(cfg.sheetKey, { start, end }),
            frameRate: name === 'run' ? 10 : name === 'attack' ? 12 : 8,
            repeat,
          })
        }
        continue
      }

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
    // Nightborne — custom frameRates per spec (240×240 spritesheets)
    if (scene.textures.exists('nightborne_idle')) {
      const nbDefs: [string, number, number, number][] = [
        ['nightborne_idle',   8,  8, -1],
        ['nightborne_run',    5, 10, -1],
        ['nightborne_attack', 11, 18, 0],
        ['nightborne_hurt',   4,  12, 0],
        ['nightborne_death',  22, 12, 0],
      ]
      for (const [key, end, frameRate, repeat] of nbDefs) {
        if (!scene.anims.exists(key)) {
          scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(key, { start: 0, end }),
            frameRate,
            repeat,
          })
        }
      }
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


  setTouchTarget(x: number, y: number) {
    if (this.isDead) return
    const kbic = this.inputController as KeyboardInputController | null
    if (kbic?.setTouchTarget) kbic.setTouchTarget(x, y)
    // Keep local touchTarget in sync for legacy access paths
    if (this.touchTarget) this.touchTarget.set(x, y)
    else this.touchTarget = new Phaser.Math.Vector2(x, y)
  }

  clearTouchTarget() {
    const kbic = this.inputController as KeyboardInputController | null
    if (kbic?.clearTouchTarget) kbic.clearTouchTarget()
    this.touchTarget = null
  }

  // Virtual joystick: dx/dy normalized direction, 0/0 = stop
  setJoystickDirection(dx: number, dy: number) {
    if (this.isDead) return
    const kbic = this.inputController as KeyboardInputController | null
    if (kbic?.setJoystickDirection) kbic.setJoystickDirection(dx, dy)
    this.touchTarget = null
  }

  clearJoystick() {
    const kbic = this.inputController as KeyboardInputController | null
    if (kbic?.clearJoystick) kbic.clearJoystick()
  }

  takeDamage(amount: number) {
    if (this.isDead) return
    if (this.vanishUntil > this.scene.time.now) return  // Invulnerable after dash
    // Shade Legion: invulnerable while fractured
    if (this.hasShadeLegion && this.scene.time.now < this._invulnUntil) return
    // Phantom Veil: chance to negate incoming damage during attack cooldown window
    if (this.hasPhantomVeil) {
      const now = this.scene.time.now
      const sinceLastAtk = now - (this as any).lastAttackTime
      if (sinceLastAtk > 0 && sinceLastAtk < this.attackCooldown) {
        if (Math.random() < this.phantomVeilChance) {
          const veilFx = this.scene.add.circle(this.x, this.y, 14, 0xCC66FF, 0.5).setDepth(10)
          this.scene.tweens.add({ targets: veilFx, alpha: 0, scale: 2, duration: 250, onComplete: () => veilFx.destroy() })
          // L3: reset attack cooldown
          if (this.phantomVeilLevel >= 3) (this as any).lastAttackTime = now - this.attackCooldown
          return
        }
      }
    }
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
    // Ashen Veil DR
    const ashenDR = (this.hasAshenVeil && this.ashenVeilStacks > 0 && this.scene.time.now < this.ashenVeilUntil)
      ? this.ashenVeilDR * this.ashenVeilStacks : 0
    // Soul Siphon: stacks act as a shield, not DR — handled below
    const soulDR = 0
    // Sanguine Ascendancy L3 DR window (set by vael activation when HP < 30%)
    const sanguineDR = ((this as any)._vaelState?.sanguineDR && this.scene.time.now < ((this as any)._vaelState?.sanguineUntil ?? 0)) ? 0.40 : 0
    let reduced = amount * (1 - Math.min(0.85, this.armor + stoneSkinDR + ashenDR + soulDR + sanguineDR))

    // Soul Siphon (Vael): bone stacks absorb damage like a shield
    // Each stack absorbs 5 damage, stacks are consumed on hit
    if (this.hasSoulSiphon && this.soulStacks > 0 && reduced > 0) {
      const absorbPerStack = 2
      const totalAbsorb = this.soulStacks * absorbPerStack
      const absorbed = Math.min(reduced, totalAbsorb)
      const stacksLost = Math.ceil(absorbed / absorbPerStack)
      this.soulStacks = Math.max(0, this.soulStacks - stacksLost)
      reduced -= absorbed
      if (absorbed > 0) {
        const fx = this.scene.add.circle(this.x, this.y, 14, 0xaaddff, 0.5).setDepth(10)
        this.scene.tweens.add({ targets: fx, scale: 2.5, alpha: 0, duration: 250, onComplete: () => fx.destroy() })
      }
    }

    // Sand Armor (Khashin): absorb shield
    if (this.hasSandArmor && this._sandArmorHP > 0) {
      const absorbed = Math.min(reduced, this._sandArmorHP)
      this._sandArmorHP -= absorbed
      reduced -= absorbed
      this._sandArmorRegenDelay = 4000
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
      this.iceArmorRegenDelay = 5000 // 5s before regen starts
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
    this.damageTakenThisRun += reduced

    // Split Shade: spawn decoy on hit received
    if (this.hasSplitShade && reduced >= 1 && this.scene.time.now >= this._splitShadeCooldownUntil) {
      const shadeCD = this.splitShadeLevel >= 2 ? (this.splitShadeLevel >= 3 ? 3000 : 4000) : 6000
      this._splitShadeCooldownUntil = this.scene.time.now + shadeCD
      const shadeCount = this.splitShadeLevel >= 3 ? 2 : 1
      for (let si = 0; si < shadeCount; si++) {
        const ang = Math.random() * Math.PI * 2
        const sx = this.x + Math.cos(ang) * 80
        const sy = this.y + Math.sin(ang) * 80
        const shade = this.scene.add.circle(sx, sy, 10, 0xCC66FF, 0.5).setDepth(9)
        const shadeDur = this.splitShadeLevel >= 2 ? (this.splitShadeLevel >= 3 ? 3000 : 2500) : 1500
        const shadeTween = this.scene.tweens.add({ targets: shade, alpha: 0.1, yoyo: true, repeat: -1, duration: 300 })
        // Echo slash on expiry (L2+)
        this.scene.time.delayedCall(shadeDur, () => {
          shadeTween.stop(); shadeTween.remove()
          shade.destroy()
          if (this.splitShadeLevel >= 2) {
            const scene = this.scene as any
            if (scene.enemies) {
              for (const e of (scene.enemies as Phaser.Physics.Arcade.Group).getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e.active) continue
                if (Phaser.Math.Distance.Between(sx, sy, e.x, e.y) <= 80) {
                  ;(e as any).takeDamage?.(this.damage * 0.2, 'void')
                }
              }
            }
          }
        })
      }
    }

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
    const needsScan = reduced >= 1 && (this.hasCryoShield || this.hasLivingGeode || this.hasWrath || this.hasMoltenSkin)
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
          fontFamily: gameFont(), fontSize: '22px', color: '#ff2222',
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
        if (this.isLocalPlayer) {
          this.scene.cameras.main.shake(80, 0.003)
          if (reduced > this.maxHp * 0.1) {
            this.scene.cameras.main.flash(200, 200, 20, 20)
          }
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
      if (this.isLocalPlayer) this.scene.cameras.main.flash(300, 255, 100, 0)
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
      if (this.isLocalPlayer) {
        this.scene.cameras.main.flash(500, 255, 255, 100)
        this.scene.cameras.main.shake(200, 0.008)
      }

      // Shockwave burst on revive — damages + knocks back enemies
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= 120) {
            (e as any).takeDamage(this.damage, 'shockwave');
            (e as any).applyKnockback?.(cx, cy, 400)
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
    for (const s of this.orbitSwords) if (s) s.destroy()
    this.orbitSwords = []
    if (this.thornsTrailGfx) { this.thornsTrailGfx.destroy(); this.thornsTrailGfx = null }

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
      this.scene.events.emit('player-levelup', this)
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
    if (this.isLocalPlayer) this.scene.cameras.main.flash(150, 255, 215, 0, false)
  }

  xpToNextLevel(): number {
    // Early levels (1-5): easy ramp. Later levels: quadratic growth so final
    // levels land around minute 6-7 of a 10-min run.
    const n = this.level
    if (n <= 5) {
      return CONFIG.XP_BASE + CONFIG.XP_PER_LEVEL * (n - 1)
    }
    // n >= 6: base cost of level 5 + extra quadratic per level past 5
    const baseAt5 = CONFIG.XP_BASE + CONFIG.XP_PER_LEVEL * 4
    const over = n - 5
    return Math.ceil(baseAt5 + CONFIG.XP_PER_LEVEL * over + over * over * 35)
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
    if (this.hasInfernalCadence && time < this.infernalCadenceEndTime) cd = Math.max(100, Math.floor(cd / 3))
    const usingFlashpoint = this.flashpointRemaining > 0
    if (!usingFlashpoint && time - this.lastAttackTime < cd) return

    // Nazar venom / Huntress spear stance gets extended range
    let searchRange = this.range
    if (this.heroType === 'ignara' && this.splashRadius > 0) searchRange = Math.max(60, this.range - this.splashRadius * 0.6)
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
    if (usingFlashpoint) {
      this.flashpointRemaining--
    }
    const flashBurstActive = usingFlashpoint && this.flashpointBurst
    if (flashBurstActive) this.damage = Math.ceil(this.damage * 1.1)
    const melee = (this.heroType === 'nazar' && this.nazarStance === 'sword')
      || (this.heroType === 'amun' && (this.amunStance === 'melee' || !this.hasQuakeStance))
      || (this.heroType === 'huntress' && this.huntressStance === 'melee')
    this.isAttacking = melee
    this.setFlipX(closest.x < this.x)
    if (this.hasSprite && this.heroType !== 'huntress' && this.heroType !== 'khashin' && this.heroType !== 'muller' && this.heroType !== 'ignara' && !(this.heroType === 'amun' && this.hasQuakeStance)) {
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
          // Base attack — always melee (no stance); still earns 'ground' mastery XP
          this.currentAttackBranch = 'ground'
          this.awardMasteryXP('ground', 1.0)
          this.attackAmunMelee(target, enemies)
        }
        break
      case 'poison':    this.attackPoison(target, enemies); break
      case 'fireball':
        this.currentAttackBranch = 'fireball'
        this.awardMasteryXP('fireball', 1.0)
        this.attackFireball(target, enemies)
        if (flashBurstActive) this.damage = Math.ceil(this.damage / 1.1)
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
      case 'voidslash':
        this.currentAttackBranch = 'void'
        this.awardMasteryXP('void', 1.0)
        // Void Ascendant: halve CD during ascendant window
        if (this.hasVoidAscendant && this.scene.time.now < this._ascendantUntil) {
          this.lastAttackTime -= Math.floor(this.attackCooldown / 2)
        }
        this.attackVoidSlash(target, enemies)
        break
      case 'soulbolt': {
        // Drain stance: no Soul Bolt (drain handles DPS passively)
        if (this.vaelStance === 'drain') {
          this.isAttacking = false
          return
        }
        // Orbs stance: drain per shot, auto-switch on empty
        if (this.orbsEnergy <= 0) {
          this.toggleVaelStance()
          this.isAttacking = false
          return
        }
        this.orbsEnergy = Math.max(0, this.orbsEnergy - this.energyDrainPerShot)
        this.currentAttackBranch = 'orbs'
        this.awardMasteryXP('orbs', 1.0)
        // Undying Labor: reduce CD by thrall count
        if (this.hasUndyingLabor) {
          const bonus = (this as any)._vaelAttackCDMult ?? 1
          if (bonus < 1) this.lastAttackTime -= Math.floor(this.attackCooldown * (1 - bonus))
        }
        vael.attackSoulBolt(this, target, enemies)
        break
      }
    }
  }

  // NIGHTBORNE — Void Slash arc
  private attackVoidSlash(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    nightborne.attackVoidSlash(this, target, enemies)
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

  private _buffParticlePool: Phaser.GameObjects.Arc[] = []
  private _buffColors: number[] = []

  private spawnBuffParticles() {
    if (this.level <= 1) return

    // Reuse array to avoid per-call allocation
    const bc = this._buffColors
    bc.length = 0
    if (this.armor > 0) bc.push(0x8888ff)
    if (this.hpRegen > 0) bc.push(0x44ff44)
    if (this.splashRadius > 0) bc.push(0xff8844)
    if (this.strikeCount > 1) bc.push(0xffffff)
    if (this.xpMult > 1) bc.push(0xffd700)
    if (bc.length === 0) return

    // Ensure pool exists (3 particles covers 400ms interval × 500-800ms lifetime)
    if (this._buffParticlePool.length === 0) {
      for (let i = 0; i < 3; i++) {
        this._buffParticlePool.push(
          this.scene.add.circle(0, 0, 2, 0xffffff, 0.6).setDepth(7).setVisible(false)
        )
      }
    }

    // Find a free particle from pool (manual loop — avoids closure alloc)
    let particle: Phaser.GameObjects.Arc | null = null
    for (const pp of this._buffParticlePool) { if (!pp.visible) { particle = pp; break } }
    if (!particle) return

    const color = bc[Math.floor(Math.random() * bc.length)]
    const angle = Math.random() * Math.PI * 2
    const dist = Phaser.Math.Between(10, 22)
    const px = this.x + Math.cos(angle) * dist
    const py = this.y + Math.sin(angle) * dist

    particle.setPosition(px, py).setRadius(Phaser.Math.Between(1, 3))
    particle.setFillStyle(color, 0.6).setAlpha(1).setScale(1).setVisible(true)
    this.scene.tweens.add({
      targets: particle,
      y: py - Phaser.Math.Between(15, 30),
      alpha: 0, scale: 0.2,
      duration: Phaser.Math.Between(500, 800),
      onComplete: () => particle.setVisible(false),
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
    if (this.heroType === 'vael') vael.updateVaelPassives(this, delta)

    const pBody = this.body as Phaser.Physics.Arcade.Body

    // Update input controller before reading direction
    if (this.inputController) this.inputController.update()

    // Handle stance toggle via inputController
    if (this.inputController?.getStanceToggle()) {
      switch (this.heroType) {
        case 'sifra': this.toggleStance(); break
        case 'nazar': this.toggleNazarStance(); break
        case 'huntress': this.toggleHuntressStance(); break
        case 'khashin': this.toggleKhashinStance(); break
        case 'amun': this.toggleAmunStance(); break
        case 'vael': this.toggleVaelStance(); break
      }
    }

    // During melee attack: allow movement at 50% speed (no full freeze)
    const atkSpeedMult = this.isAttacking ? 0.5 : 1
    let moving = false

    // Get direction from inputController (keyboard + joystick)
    const dir = this.inputController?.getDirection() ?? ZERO_DIR

    // Resolve touch target from inputController (KeyboardInputController exposes it)
    const kbic = this.inputController as KeyboardInputController | null
    const activeTouchTarget = kbic?.getTouchTarget?.() ?? this.touchTarget

    if (this.serverAuthoritative) {
      // Online mode: server controls position — only play animations from input
      if (dir.dx !== 0 || dir.dy !== 0) {
        if (!this.isAttacking) this.setFlipX(dir.dx < 0)
        moving = true
      }
      // Don't set velocity — NetworkGameAdapter handles positioning
    } else if (dir.dx !== 0 || dir.dy !== 0) {
      pBody.setVelocity(dir.dx * this.speed * atkSpeedMult, dir.dy * this.speed * atkSpeedMult)
      if (!this.isAttacking) this.setFlipX(dir.dx < 0)
      // Clear touch target when keyboard/joystick is active
      kbic?.clearTouchTarget?.()
      this.touchTarget = null
      moving = true
    } else if (activeTouchTarget) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, activeTouchTarget.x, activeTouchTarget.y)
      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, activeTouchTarget.x, activeTouchTarget.y)
        pBody.setVelocity(Math.cos(angle) * this.speed * atkSpeedMult, Math.sin(angle) * this.speed * atkSpeedMult)
        if (!this.isAttacking) this.setFlipX(activeTouchTarget.x < this.x)
        moving = true
      } else {
        pBody.setVelocity(0, 0)
        kbic?.consumeTouchTarget?.()
        this.touchTarget = null
      }
    } else {
      pBody.setVelocity(0, 0)
    }

    // Hero-specific movement-based passives
    if (this.hasLavaTrail && moving) ignara.updateLavaTrail(this, delta)
    if (this.hasFirestorm) { ignara.initFirestormOrbit(this); ignara.updateFirestormOrbit(this, delta) }
    if (this.hasImmolation) ignara.updateImmolation(this, delta)
    if (this.hasSustainedBurn) ignara.updateBurnTicks(this, delta)
    // Ashen Veil decay
    if (this.hasAshenVeil && this.ashenVeilStacks > 0 && this.scene.time.now >= this.ashenVeilUntil) {
      this.ashenVeilStacks = 0
    }

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

  /** Impact burst when spear hits an enemy */
  spearHitVfx(x: number, y: number, tint: number) {
    const scene = this.scene

    // Flash ring
    const ring = scene.add.circle(x, y, 4, tint, 0.85).setDepth(10).setBlendMode(Phaser.BlendModes.ADD)
    scene.tweens.add({ targets: ring, displayWidth: 32, displayHeight: 32, alpha: 0, duration: 160, ease: 'Quad.easeOut', onComplete: () => ring.destroy() })

    // Bright core flash
    const flash = scene.add.circle(x, y, 3, 0xffffff, 0.9).setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
    scene.tweens.add({ targets: flash, displayWidth: 14, displayHeight: 14, alpha: 0, duration: 100, onComplete: () => flash.destroy() })

    // 6 sparks
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5
      const d = Phaser.Math.Between(10, 22)
      const spark = scene.add.circle(x, y, Phaser.Math.Between(1, 3), tint, 0.85)
        .setDepth(10).setBlendMode(Phaser.BlendModes.ADD)
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
        alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 220,
        ease: 'Quad.easeOut', onComplete: () => spark.destroy(),
      })
    }
  }
}
