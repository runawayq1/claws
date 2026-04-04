import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'

export type HeroType = 'ignara' | 'sifra' | 'amun' | 'nazar' | 'huntress'

interface HeroDef {
  hp: number; speed: number; damage: number; range: number; cooldown: number
  color: number; attackType: 'flamethrower' | 'dash' | 'iceshard' | 'shockwave' | 'poison' | 'melee' | 'fireball' | 'spear'
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
  ignara: { scale: 1.6, bodyW: 22, bodyH: 31, bodyOffX: 63, bodyOffY: 69, anims: { idle: 8, run: 8, attack: 8, hurt: 4, death: 5 } },
  // khet removed from playable roster (re-add: uncomment and add 'khet' back to HeroType)
  // khet:   { scale: 0.75, bodyW: 40, bodyH: 50, bodyOffX: 105, bodyOffY: 150, anims: { idle: 8, run: 8, attack: 8, hurt: 3, death: 7 }, tint: 0xcc44ff },
  sifra:  { scale: 0.9, bodyW: 40, bodyH: 58, bodyOffX: 90, bodyOffY: 84, anims: { idle: 6, run: 8, attack: 8, hurt: 4, death: 7 } },
  nazar:  { scale: 1.25, bodyW: 33, bodyH: 46, bodyOffX: 83, bodyOffY: 77, anims: { idle: 8, run: 8, attack: 6, hurt: 4, death: 6 } },
  amun:   { scale: 1.5, bodyW: 33, bodyH: 46, bodyOffX: 65, bodyOffY: 57, anims: { idle: 8, run: 8, attack: 4, hurt: 4, death: 6 } },
  huntress: { scale: 1.4, bodyW: 28, bodyH: 38, bodyOffX: 58, bodyOffY: 65, anims: { idle: 8, run: 8, attack: 5, hurt: 3, death: 8 } },
}

const HERO_DEFS: Record<HeroType, HeroDef> = {
  ignara:  { hp: 80,  speed: 140, damage: 30, range: 180, cooldown: 700, color: 0xe84118, attackType: 'fireball' },
  // khet removed from playable roster
  // khet:    { hp: 55,  speed: 220, damage: 35, range: 48,  cooldown: 600,  color: 0x4a0072, attackType: 'dash' },
  sifra:   { hp: 70,  speed: 150, damage: 12, range: 160, cooldown: 800,  color: 0x82ccdd, attackType: 'iceshard' },
  amun:    { hp: 160, speed: 100, damage: 22, range: 80,  cooldown: 1200, color: 0xfff200, attackType: 'shockwave' },
  nazar:   { hp: 90,  speed: 130, damage: 18, range: 55,  cooldown: 400,  color: 0xc23616, attackType: 'melee' },
  huntress: { hp: 80,  speed: 140, damage: 18, range: 300, cooldown: 500,  color: 0x2ecc71, attackType: 'spear' },
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
  private lavaTrailTimer = 0

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
  private phantomTrailTimer = 0

  // Sifra ice upgrade mechanic flags
  hasFrostNova = false
  private frostNovaCounter = 0
  hasAbsoluteZero = false
  hasBlizzardAura = false
  private blizzardAuraGfx: Phaser.GameObjects.Graphics | null = null
  hasDeepFreeze = false         // stronger slow (0.3x)
  hasEternalWinter = false      // permanent damaging frost field
  hasPermafrost = false         // bonus dmg to slowed enemies
  hasIceArmor = false           // absorb shield regens when not hit
  iceArmorHP = 0
  iceArmorMax = 0
  private iceArmorRegenDelay = 0
  hasCryoShield = false         // counter shards when hit
  hasSparkInitiate = false      // chain to 1 extra enemy
  hasArcReach = false           // wider cone + arc outside
  hasOvercharge = false         // chance for 3x burst
  hasBallLightning = false      // orbiting zap ball
  private ballLightningGfx: Phaser.GameObjects.Graphics | null = null
  hasStormLord = false          // periodic random lightning strikes
  private stormLordTimer = 0

  xp = 0
  level = 1
  kills = 0
  shieldHp = 0
  shieldMaxHp = 0
  shieldTimer = 0
  speedBuffUntil = 0
  baseSpeedCache = 0

  private touchTarget: Phaser.Math.Vector2 | null = null
  private lastAttackTime = 0
  private isAttacking = false
  private isDead = false
  private heroDef: HeroDef
  private poisonEndTime = 0
  private poisonDps = 0
  private hasSprite: boolean
  private currentAnim = ''
  private flameAngle = 0
  private buffAuraTimer = 0
  defenseAuraActive = false
  private defenseAuraGfx: Phaser.GameObjects.Graphics | null = null
  dmgAuraActive = false
  private dmgAuraCooldown = 1500  // ms between pulses
  private dmgAuraLastPulse = 0
  private passiveAuraGfx: Phaser.GameObjects.Graphics | null = null
  private dmgAuraGfx: Phaser.GameObjects.Graphics | null = null

  // Amun upgrade mechanic flags
  hasTitansPulse = false      // launches boulder projectile on shockwave
  hasEarthquake = false       // stun enemies on shockwave
  hasColossus = false         // massive knockback on shockwave
  hasCataclysm = false        // double shockwave burst
  hasPassiveAura = false      // constant dps ring around player
  hasThorns = false           // reflect damage to melee attackers
  hasIronWill = false         // cap incoming damage to 10% maxHP
  hasLowHpRegen = false       // regen ×3 when below 40% HP
  hasUndying = false          // revive once at full HP
  hasLivingFortress = false   // aura damage scales with HP %
  hasWrath = false            // damage aura spike when hit
  hasGravityWell = false      // pull enemies toward Amun
  private gravityWellTimer = 0
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
  hasSpearMastery = false        // Warden: +2 spear pierce
  hasExplosiveTips = false       // Warden: spears explode on final pierce
  hasSpearWall = false           // Warden: orbiting spears damage nearby
  hasSplinterShot = false        // Warden: miss spawns splinter shards
  hasEarthSlam = false           // Warden: melee creates shockwave line
  volleyCounter = 0       // tracks throws for Volley
  netCounter = 0          // tracks throws for Net
  killStrideUntil = 0     // timer for Kill Stride speed buff
  battleFrenzyUntil = 0   // timer for Battle Frenzy
  camouflageUntil = 0     // timer for Camouflage
  private leapCooldown = 0       // cooldown for auto-leap
  private caltropTimer = 0       // cooldown for caltrops drop
  private spearWallGfx: Phaser.GameObjects.Graphics | null = null
  private spearWallAngle = 0     // rotating spear wall angle

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
  private energyDrainRate = 10     // per second for continuous (lightning)
  private energyDrainPerShot = 8   // per ice shard volley
  private energyRegenRate = 25     // per second for inactive stance
  private lightningAngle = 0
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

    if (sprCfg && hasSpr) {
      this.setScale(sprCfg.scale)
      this.setBodySize(sprCfg.bodyW, sprCfg.bodyH)
      this.setOffset(sprCfg.bodyOffX, sprCfg.bodyOffY)
      if (sprCfg.tint) this.setTint(sprCfg.tint)
      this.playAnim('idle')
    } else {
      this.setScale(1.8)
      this.setBodySize(24, 28)
      this.setOffset(20, 22)
    }

    this.setCollideWorldBounds(true)
    this.setDepth(10)

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
          frameRate: name === 'run' ? 12 : name === 'attack' ? 14 : 8,
          repeat,
        })
      }
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
    // Huntress ranged anim (Attack3, 7 frames)
    if (scene.textures.exists('huntress_ranged') && !scene.anims.exists('huntress_ranged')) {
      scene.anims.create({
        key: 'huntress_ranged',
        frames: scene.anims.generateFrameNumbers('huntress_ranged', { start: 0, end: 4 }),
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
    this.touchTarget = new Phaser.Math.Vector2(x, y)
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
    let reduced = amount * (1 - this.armor)

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

    // Cryo Shield: fire counter shards when hit
    if (this.hasCryoShield && reduced >= 1) {
      const scene = this.scene as any
      if (scene.enemies) {
        const nearby = (scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[])
          .filter((e: any) => e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= 80)
        for (let i = 0; i < Math.min(3, nearby.length); i++) {
          const e = nearby[i]
          ;(e as any).takeDamage(this.damage * 0.25, 'ice')
          // Shard VFX
          const shard = this.scene.add.circle(this.x, this.y, 3, 0x88ddff, 0.8).setDepth(10)
          this.scene.tweens.add({ targets: shard, x: e.x, y: e.y, alpha: 0, duration: 200, onComplete: () => shard.destroy() })
        }
      }
    }

    // Iron Will: cap incoming damage to 10% max HP
    if (this.hasIronWill && reduced > this.maxHp * 0.1) {
      reduced = this.maxHp * 0.1
      // VFX: silver shield flash
      const shield = this.scene.add.circle(this.x, this.y, 18, 0x88aacc, 0.5).setDepth(10)
      this.scene.tweens.add({ targets: shield, scale: 2.5, alpha: 0, duration: 250, onComplete: () => shield.destroy() })
    }

    this.hp -= reduced

    // Thorns: reflect 50% damage to nearby enemies
    if (this.hasThorns && reduced >= 1) {
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= 60) {
            (e as any).takeDamage(reduced * 0.5, 'melee')
          }
        }
        // VFX: yellow spike ring
        const spikes = this.scene.add.circle(this.x, this.y, 10, 0xffdd44, 0.5).setDepth(9)
        this.scene.tweens.add({ targets: spikes, scale: 5, alpha: 0, duration: 250, onComplete: () => spikes.destroy() })
      }
    }

    // Wrath: damage aura spike when hit
    if (this.hasWrath && this.dmgAuraActive && reduced >= 1) {
      const wrathRadius = 70 + this.splashRadius * 0.8
      const wrathDmg = this.damage * 0.6
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= wrathRadius) {
            (e as any).takeDamage(wrathDmg, 'melee')
          }
        }
      }
      // VFX: angry orange burst
      const wrathRing = this.scene.add.circle(this.x, this.y, 15, 0xff6600, 0.6).setDepth(9)
      this.scene.tweens.add({ targets: wrathRing, scale: 6, alpha: 0, duration: 300, onComplete: () => wrathRing.destroy() })
    }

    // Hit flash
    if (reduced >= 1 && this.hasSprite) {
      this.playAnim('hurt')
      this.scene.time.delayedCall(300, () => {
        if (this.active && !this.isDead) this.currentAnim = '' // force re-eval
      })
    }

    // Molten Skin: fire burst when player takes damage
    if (this.hasMoltenSkin) {
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= 50) (e as any).takeDamage(this.damage * 0.3, 'fire')
        }
      }
      const burst = this.scene.add.circle(this.x, this.y, 8, 0xff4400, 0.4).setDepth(9)
      this.scene.tweens.add({ targets: burst, scale: 5, alpha: 0, duration: 200, onComplete: () => burst.destroy() })
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

    // Undying (Amun): revive once at full HP
    if (this.hasUndying) {
      this.hasUndying = false
      this.hp = this.maxHp
      const ring = this.scene.add.circle(this.x, this.y, 10, 0xfff200, 0.7).setDepth(15)
      this.scene.tweens.add({ targets: ring, scale: 10, alpha: 0, duration: 600, onComplete: () => ring.destroy() })
      this.scene.cameras.main.flash(400, 255, 255, 100)
      // Shockwave burst on revive
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= 100) {
            (e as any).takeDamage(this.damage, 'shockwave');
            const kb = Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y);
            (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(kb) * 300, Math.sin(kb) * 300)
          }
        }
      }
      return
    }

    this.isDead = true
    this.touchTarget = null
    this.setVelocity(0, 0)
    if (this.flameSprite) { this.flameSprite.destroy(); this.flameSprite = null }
    if (this.lightningGfx) { this.lightningGfx.destroy(); this.lightningGfx = null }
    if (this.lightningSprite) { this.lightningSprite.destroy(); this.lightningSprite = null }
    if (this.defenseAuraGfx) { this.defenseAuraGfx.destroy(); this.defenseAuraGfx = null }
    if (this.passiveAuraGfx) { this.passiveAuraGfx.destroy(); this.passiveAuraGfx = null }
    if (this.dmgAuraGfx) { this.dmgAuraGfx.destroy(); this.dmgAuraGfx = null }
    if (this.blizzardAuraGfx) { this.blizzardAuraGfx.destroy(); this.blizzardAuraGfx = null }

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
        this.lightningEnergy = Math.max(0, this.lightningEnergy - this.energyDrainRate * (delta / 1000))
        this.attackLightning(enemies, delta)
      }
      return
    }

    if (this.isAttacking) return
    if (time - this.lastAttackTime < this.attackCooldown) return

    // Nazar venom / Huntress spear stance gets extended range
    let searchRange = this.range
    if (this.heroType === 'nazar' && this.nazarStance === 'venom') searchRange += 100
    if (this.heroType === 'huntress' && this.huntressStance === 'melee') searchRange = 80
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
    this.isAttacking = true
    this.setFlipX(closest.x < this.x)
    if (this.hasSprite && this.heroType !== 'huntress') this.playAnim('attack')

    const target = closest
    // Sifra ice energy drain per shot
    if (this.heroType === 'sifra' && this.heroDef.attackType === 'iceshard' && this.stance === 'ice') {
      if (this.iceEnergy <= 0) {
        this.toggleStance()
        this.isAttacking = false
        return
      }
      this.iceEnergy = Math.max(0, this.iceEnergy - this.energyDrainPerShot)
    }
    switch (this.heroDef.attackType) {
      case 'dash':      this.attackDash(target, enemies); break
      case 'iceshard':   this.attackIceShard(target, enemies); break
      case 'shockwave': this.attackShockwave(enemies); break
      case 'poison':    this.attackPoison(target, enemies); break
      case 'fireball':  this.attackFireball(target, enemies); break
      case 'spear':
        if (this.huntressStance === 'melee') {
          if (this.meleeEnergy <= 0) {
            this.toggleHuntressStance()
            this.isAttacking = false
            return
          }
          this.meleeEnergy = Math.max(0, this.meleeEnergy - 8)
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
          this.spearEnergy = Math.max(0, this.spearEnergy - 12)
          const frenzyBonus = (this.hasBattleFrenzy && this.battleFrenzyUntil > this.scene.time.now) ? 0.9 : 1
          this.lastAttackTime += Math.floor(900 * frenzyBonus)  // extra cooldown for ranged
          if (this.hasSprite) {
            const key = 'huntress_ranged'
            if (this.currentAnim !== key) { this.currentAnim = key; this.play(key) }
          }
          this.attackSpear(target, enemies)
        }
        break
      case 'melee':
        if (this.nazarStance === 'venom') {
          if (this.venomEnergy <= 0) {
            this.toggleNazarStance()
            this.isAttacking = false
            return
          }
          this.venomEnergy = Math.max(0, this.venomEnergy - 8)
          this.lastAttackTime += 400  // venom is slower than sword
          this.attackPoison(target, enemies)
        } else {
          if (this.swordEnergy <= 0) {
            this.toggleNazarStance()
            this.isAttacking = false
            return
          }
          this.swordEnergy = Math.max(0, this.swordEnergy - 6)
          this.attackMelee(enemies)
        }
        break
    }
  }

  // NAZAR SWORD — Melee slash around player
  private attackMelee(enemies: Phaser.Physics.Arcade.Group) {
    // Shadow Step: blink 30px toward nearest enemy before slashing
    if (this.hasShadowStep) {
      let closest: Phaser.Physics.Arcade.Sprite | null = null
      let closestDist = Infinity
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
        if (d < closestDist && d <= this.range + 40) { closestDist = d; closest = e }
      }
      if (closest && closestDist > 20) {
        const ang = Phaser.Math.Angle.Between(this.x, this.y, closest.x, closest.y)
        const blinkDist = Math.min(30, closestDist - 15)
        // Ghost afterimage at old position
        const ghost = this.scene.add.circle(this.x, this.y, 8, 0x9955dd, 0.4).setDepth(5)
        this.scene.tweens.add({ targets: ghost, alpha: 0, scale: 2, duration: 250, onComplete: () => ghost.destroy() })
        this.x += Math.cos(ang) * blinkDist
        this.y += Math.sin(ang) * blinkDist
      }
    }
    const hitRadius = this.range
    const dmgRatio = Math.min(this.damage / 18, 4)
    const slashTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0xffcccc : 0xcc4444

    // Slash VFX
    if (this.scene.textures.exists('vfx_slash')) {
      const slashAngle = this.flipX ? Math.PI : 0
      for (let i = 0; i < this.strikeCount; i++) {
        const angleOff = (i - (this.strikeCount - 1) / 2) * 0.4
        const slash = this.scene.add.image(this.x, this.y, 'vfx_slash')
          .setScale(2 + hitRadius * 0.02).setRotation(slashAngle + angleOff).setDepth(10)
          .setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
        this.scene.tweens.add({
          targets: slash, alpha: 0, scale: 3 + hitRadius * 0.03,
          duration: 200, delay: i * 30,
          onComplete: () => slash.destroy(),
        })
      }
    }

    // Count enemies in range for Assassinate
    const enemiesInRange = (enemies.getChildren() as Phaser.Physics.Arcade.Sprite[])
      .filter(e => e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= hitRadius).length
    const isAssassinating = this.hasAssassinate && enemiesInRange === 1
    const meleeDmg = isAssassinating ? this.damage * 2 : this.damage

    // Damage all enemies in range
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= hitRadius) {
        // Weakness: poisoned enemies take +30% damage
        const weakMult = (this.hasWeakness && (e as any)._poisoned) ? 1.3 : 1
        for (let i = 0; i < this.strikeCount; i++) (e as any).takeDamage(meleeDmg * weakMult, 'melee')
        // Hit spark
        if (this.scene.textures.exists('vfx_hitspark')) {
          const spark = this.scene.add.image(e.x, e.y, 'vfx_hitspark')
            .setScale(1.2).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
          this.scene.tweens.add({
            targets: spark, alpha: 0, scale: 2, duration: 150,
            onComplete: () => spark.destroy(),
          })
        }

        // Assassinate VFX — red X on lone target
        if (isAssassinating) {
          const xMark = this.scene.add.text(e.x, e.y - 20, '✕', {
            fontFamily: 'monospace', fontSize: '18px', color: '#ff2222',
            stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5).setDepth(12)
          this.scene.tweens.add({ targets: xMark, y: xMark.y - 20, alpha: 0, scale: 1.5, duration: 400, onComplete: () => xMark.destroy() })
        }

        // Hemorrhage — bleed DOT after melee hit
        if (this.hasHemorrhage && !(e as any)._bleedTimer) {
          (e as any)._bleedTimer = this.scene.time.addEvent({
            delay: 500, repeat: 5, callback: () => {
              if (e.active) (e as any).takeDamage(this.damage * 0.15, 'melee')
              if (!(e as any)._bleedTimer?.repeatCount) (e as any)._bleedTimer = null
            }
          })
        }

        // Blood Scent — execute enemies below 20% HP
        if (this.hasBloodScent && (e as any).hp > 0 && (e as any).hp < (e as any).maxHp * 0.2) {
          (e as any).takeDamage((e as any).hp + 1, 'melee')
          // VFX: blood splatter
          for (let b = 0; b < 4; b++) {
            const ba = Math.random() * Math.PI * 2
            const bd = Phaser.Math.Between(5, 18)
            const drop = this.scene.add.circle(e.x + Math.cos(ba) * bd, e.y + Math.sin(ba) * bd, Phaser.Math.Between(2, 4), 0xcc0000, 0.7).setDepth(6)
            this.scene.tweens.add({ targets: drop, alpha: 0, duration: 800, delay: 200, onComplete: () => drop.destroy() })
          }
        }

        // Death Mark — first hit marks, second hit deals +40%
        if (this.hasDeathMark) {
          if ((e as any)._deathMarked) {
            (e as any).takeDamage(this.damage * 0.4, 'melee');
            (e as any)._deathMarked = false
          } else {
            (e as any)._deathMarked = true
            e.setTint(0xff44ff)
            this.scene.time.delayedCall(3000, () => { if (e.active) { e.clearTint(); (e as any)._deathMarked = false } })
          }
        }
      }
    }

    // Smoke Bomb — AoE slow around player on melee
    if (this.hasSmokeBomb) {
      const smokeR = 50 + this.splashRadius * 0.3
      const smoke = this.scene.add.circle(this.x, this.y, 8, 0x553388, 0.4).setDepth(4)
      this.scene.tweens.add({ targets: smoke, scale: smokeR / 8, alpha: 0, duration: 500, onComplete: () => smoke.destroy() })
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= smokeR) {
          if ((e as any).speed && (e as any).baseSpeed) (e as any).speed = (e as any).baseSpeed * 0.4
        }
      }
    }

    // Blade Surge (hasChainDash) — forward lunge hits a line of enemies
    if (this.hasChainDash) {
      const lungeAngle = this.flipX ? Math.PI : 0
      const lungeRange = this.range * 1.5
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
        if (d > this.range && d <= lungeRange) {
          const aToE = Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y)
          if (Math.abs(Phaser.Math.Angle.Wrap(aToE - lungeAngle)) < 0.6) {
            (e as any).takeDamage(this.damage * 0.7, 'melee')
          }
        }
      }
      if (this.scene.textures.exists('vfx_slash')) {
        const s = this.scene.add.image(this.x + Math.cos(lungeAngle) * 30, this.y, 'vfx_slash')
          .setScale(2.5).setRotation(lungeAngle).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setTint(0xcc4444)
        this.scene.tweens.add({ targets: s, alpha: 0, scale: 3.5, duration: 200, onComplete: () => s.destroy() })
      }
    }

    this.scene.time.delayedCall(150, () => {
      this.isAttacking = false
      // Vanish — brief invulnerability after melee
      if (this.hasVanish) {
        this.vanishUntil = this.scene.time.now + 400
        this.setAlpha(0.5)
        this.scene.time.delayedCall(400, () => { if (this.active) this.setAlpha(1) })
      }
    })
  }

  // IGNARA — Flamethrower (animated sprite from spritesheet)
  private flameSprite: Phaser.GameObjects.Sprite | null = null
  private flameActive = false

  // @ts-ignore — kept for potential future use (Inferno branch upgrades)
  private attackFlamethrower(enemies: Phaser.Physics.Arcade.Group, delta: number) {
    // Dynamic scale based on range upgrades (base range 150 → scale 3)
    const rangeRatio = this.range / 150
    const flameScale = 3 * rangeRatio
    // Tint shifts hotter with damage (base 30)
    const dmgRatio = Math.min(this.damage / 30, 3)
    const flameTint = dmgRatio > 2 ? 0xaaccff : dmgRatio > 1.5 ? 0xffffcc : 0xffffff
    // Spread widens with splashRadius
    const spread = 0.38 + this.splashRadius * 0.003

    // Lazy init flame sprite
    if (!this.flameSprite) {
      this.flameSprite = this.scene.add.sprite(this.x, this.y, 'vfx_flame')
        .setOrigin(0, 0.5)
        .setDepth(9)
        .setScale(flameScale)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setVisible(false)
    }

    // Update flame scale/tint dynamically each frame
    this.flameSprite.setScale(flameScale, flameScale * (1 + this.splashRadius * 0.005))
    this.flameSprite.setTint(flameTint)

    // Find nearest enemy to aim at
    let closest: Phaser.Physics.Arcade.Sprite | null = null
    let closestDist = Infinity
    for (const enemy of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!enemy.active) continue
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist < this.range && dist < closestDist) {
        closestDist = dist
        closest = enemy
      }
    }

    // No target — hide flame
    if (!closest) {
      if (this.flameActive) {
        this.flameSprite.setVisible(false)
        this.flameSprite.stop()
        this.flameActive = false
      }
      return
    }

    // Smoothly rotate toward target
    const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, closest.x, closest.y)
    this.flameAngle = Phaser.Math.Angle.RotateTo(this.flameAngle, targetAngle, 0.15)
    this.setFlipX(Math.cos(this.flameAngle) < 0)

    // Position and rotate flame sprite
    this.flameSprite.setPosition(this.x, this.y)
    this.flameSprite.setRotation(this.flameAngle)
    this.flameSprite.setVisible(true)

    if (!this.flameActive) {
      this.flameSprite.play('flame_loop')
      this.flameActive = true
    }

    // Meltdown: +50% damage when below 40% HP
    let meltdownMult = 1
    if (this.hasMeltdown && this.hp < this.maxHp * 0.4) meltdownMult = 1.5

    // Damage enemies inside the cone
    const dmgThisFrame = this.damage * (delta / 1000) * meltdownMult
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
      if (dist > this.range) continue
      const angleToEnemy = Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y)
      const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - this.flameAngle)
      if (Math.abs(angleDiff) <= spread) {
        (e as any).takeDamage(dmgThisFrame, 'fire')

        // Scorched Earth: apply burn DOT
        if (this.hasScorchedEarth && !(e as any)._burnTimer) {
          const burnDmg = this.damage * 0.3
          const burnDur = 3000
          let burnElapsed = 0;
          (e as any)._burnTimer = this.scene.time.addEvent({
            delay: 500, repeat: Math.floor(burnDur / 500) - 1,
            callback: () => {
              burnElapsed += 500
              if (e.active) {
                (e as any).takeDamage(burnDmg * 0.5, 'fire')
                // Small fire particle
                const fp = this.scene.add.circle(e.x + Phaser.Math.Between(-8, 8), e.y + Phaser.Math.Between(-8, 8), 3, 0xff6600, 0.7).setDepth(10)
                this.scene.tweens.add({ targets: fp, alpha: 0, y: fp.y - 12, scale: 0, duration: 300, onComplete: () => fp.destroy() })
              }
              if (burnElapsed >= burnDur) (e as any)._burnTimer = null
            },
          })
        }
      }
    }
  }

  // IGNARA — Fireball projectile with AOE explosion
  private attackFireball(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    const tx = target.x, ty = target.y
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty)
    const dmgRatio = Math.min(this.damage / 30, 4)
    const ballSize = 6 + dmgRatio * 2
    const explodeRadius = 40 + this.splashRadius * 0.8
    const ballTint = dmgRatio > 2.5 ? 0xffffaa : dmgRatio > 1.5 ? 0xff8800 : 0xff4400

    // Meltdown: +50% damage when below 40% HP
    let effectiveDmg = this.damage
    if (this.hasMeltdown && this.hp < this.maxHp * 0.4) effectiveDmg = Math.ceil(effectiveDmg * 1.5)

    // Create fireball
    const ball = this.scene.add.circle(this.x, this.y, ballSize, ballTint).setDepth(9)
    // Glow trail
    const glow = this.scene.add.circle(this.x, this.y, ballSize * 1.5, ballTint, 0.3).setDepth(8)
      .setBlendMode(Phaser.BlendModes.ADD)

    // Trail particles while flying
    const trailTimer = this.scene.time.addEvent({
      delay: 30, loop: true,
      callback: () => {
        const tp = this.scene.add.circle(
          ball.x + Phaser.Math.Between(-4, 4),
          ball.y + Phaser.Math.Between(-4, 4),
          Phaser.Math.Between(2, 4), 0xff6600, 0.6
        ).setDepth(8)
        this.scene.tweens.add({
          targets: tp, alpha: 0, scale: 0, duration: 200,
          onComplete: () => tp.destroy(),
        })
      },
    })

    // Fly to target
    this.scene.tweens.add({
      targets: [ball, glow],
      x: tx, y: ty,
      duration: Math.max(150, (dist / 350) * 1000),
      onComplete: () => {
        trailTimer.destroy()
        ball.destroy()
        glow.destroy()

        // EXPLOSION
        // Visual: expanding ring + flash
        const explosion = this.scene.add.circle(tx, ty, 10, 0xff4400, 0.6).setDepth(10)
        this.scene.tweens.add({
          targets: explosion,
          scale: explodeRadius / 10, alpha: 0, duration: 350,
          onComplete: () => explosion.destroy(),
        })
        // Inner flash
        const flash = this.scene.add.circle(tx, ty, 8, 0xffff88, 0.8).setDepth(11)
        this.scene.tweens.add({
          targets: flash,
          scale: explodeRadius / 16, alpha: 0, duration: 200,
          onComplete: () => flash.destroy(),
        })
        // Ember particles
        for (let i = 0; i < 6 + Math.floor(dmgRatio * 2); i++) {
          const ea = Math.random() * Math.PI * 2
          const ed = Phaser.Math.Between(10, Math.floor(explodeRadius * 0.8))
          const ember = this.scene.add.circle(tx, ty, Phaser.Math.Between(2, 4), 0xff8800, 0.7).setDepth(10)
          this.scene.tweens.add({
            targets: ember,
            x: tx + Math.cos(ea) * ed, y: ty + Math.sin(ea) * ed,
            alpha: 0, scale: 0, duration: 300 + Math.random() * 200,
            onComplete: () => ember.destroy(),
          })
        }

        // Camera shake
        this.scene.cameras.main.shake(50, 0.003)

        // Damage all enemies in explosion radius
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= explodeRadius) {
            (e as any).takeDamage(effectiveDmg, 'fire')

            // Backdraft: knockback enemies from explosion center
            if (this.hasBackdraft) {
              const kb = Phaser.Math.Angle.Between(tx, ty, e.x, e.y)
              const body = e.body as Phaser.Physics.Arcade.Body
              if (body) body.setVelocity(Math.cos(kb) * 200, Math.sin(kb) * 200)
            }

            // Wildfire: kill triggers mini-explosion on nearby enemies
            if (this.hasWildfire) {
              const hpNow = (e as any).hp ?? 0
              if (hpNow <= 0) {
                for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                  if (!e2.active || e2 === e) continue
                  if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= 50) {
                    (e2 as any).takeDamage(this.damage * 0.4, 'fire')
                  }
                }
                const miniBlast = this.scene.add.circle(e.x, e.y, 8, 0xff6600, 0.5).setDepth(9)
                this.scene.tweens.add({ targets: miniBlast, scale: 5, alpha: 0, duration: 250, onComplete: () => miniBlast.destroy() })
              }
            }

            // Pyromaniac: heal 5 HP per kill
            if (this.hasPyromaniac && (e as any).hp <= 0) {
              this.hp = Math.min(this.maxHp, this.hp + 5)
            }

            // Scorched Earth burn DOT (reuse existing mechanic if hasScorchedEarth)
            if (this.hasScorchedEarth && !(e as any)._burnTimer) {
              const burnDmg = effectiveDmg * 0.3
              let burnElapsed = 0;
              (e as any)._burnTimer = this.scene.time.addEvent({
                delay: 500, repeat: 5,
                callback: () => {
                  burnElapsed += 500
                  if (e.active) (e as any).takeDamage(burnDmg * 0.5, 'fire')
                  if (burnElapsed >= 3000) (e as any)._burnTimer = null
                },
              })
            }
          }
        }

        // Firestorm: spawn 2 extra smaller fireballs at random nearby enemies
        if (this.hasFirestorm) {
          let extras = 0
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || extras >= 2) continue
            if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) > explodeRadius && Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= this.range * 1.5) {
              extras++
              const miniball = this.scene.add.circle(tx, ty, 4, 0xff8800, 0.7).setDepth(9)
              const ex = e.x, ey = e.y
              this.scene.tweens.add({
                targets: miniball, x: ex, y: ey, duration: 200,
                onComplete: () => {
                  miniball.destroy()
                  const boom = this.scene.add.circle(ex, ey, 6, 0xff4400, 0.5).setDepth(9)
                  this.scene.tweens.add({ targets: boom, scale: 4, alpha: 0, duration: 250, onComplete: () => boom.destroy() })
                  for (const e3 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                    if (!e3.active) continue
                    if (Phaser.Math.Distance.Between(ex, ey, e3.x, e3.y) <= 35) (e3 as any).takeDamage(this.damage * 0.5, 'fire')
                  }
                },
              })
            }
          }
        }

        this.isAttacking = false
      },
    })
  }

  // SIFRA LIGHTNING — Cone attack (wide spread, shorter range)
  private lightningGfx: Phaser.GameObjects.Graphics | null = null
  private lightningSprite: Phaser.GameObjects.Image | null = null
  private lightningSparkTimer = 0

  private attackLightning(enemies: Phaser.Physics.Arcade.Group, delta: number) {
    const baseRange = 100
    const rangeRatio = this.range / 160 // Sifra base range
    const lightRange = baseRange * rangeRatio
    const dmgRatio = Math.min(this.damage / 12, 5)
    const spread = 0.6 + this.splashRadius * 0.005
    const useSheet = this.scene.textures.exists('vfx_lightning_sheet')
    const useTex = useSheet || this.scene.textures.exists('vfx_lightning')

    // Lazy init
    if (!this.lightningGfx) {
      this.lightningGfx = this.scene.add.graphics().setDepth(9)
    }
    if (!this.lightningSprite && useTex) {
      if (useSheet) {
        // Animated bolt sprite
        this.lightningSprite = this.scene.add.sprite(this.x, this.y, 'vfx_lightning_sheet', 0) as any
        this.lightningSprite!.setOrigin(0, 0.5).setDepth(9)
          .setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
        if (this.scene.anims.exists('lightning_bolt_loop')) {
          (this.lightningSprite as any).play('lightning_bolt_loop')
        }
      } else {
        this.lightningSprite = this.scene.add.image(this.x, this.y, 'vfx_lightning')
          .setOrigin(0, 0.5).setDepth(9)
          .setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
      }
    }

    // Find nearest enemy
    let closest: Phaser.Physics.Arcade.Sprite | null = null
    let closestDist = Infinity
    for (const enemy of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!enemy.active) continue
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist < lightRange && dist < closestDist) {
        closestDist = dist
        closest = enemy
      }
    }

    this.lightningGfx.clear()

    if (!closest) {
      if (this.lightningSprite) this.lightningSprite.setVisible(false)
      return
    }

    // Aim — smooth rotation tracking
    const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, closest.x, closest.y)
    this.lightningAngle = Phaser.Math.Angle.RotateTo(this.lightningAngle, targetAngle, 0.2)
    this.setFlipX(Math.cos(this.lightningAngle) < 0)

    // Animated lightning bolt sprite
    if (this.lightningSprite) {
      const sprScale = lightRange / 64 // sheet frame is 64px wide
      this.lightningSprite.setPosition(this.x, this.y)
        .setRotation(this.lightningAngle)
        .setScale(sprScale, sprScale * (1 + this.splashRadius * 0.008))
        .setVisible(true)
        .setAlpha(0.7 + Math.random() * 0.3) // flicker
      const tint = dmgRatio > 3 ? 0xffffff : dmgRatio > 1.5 ? 0xccddff : 0x88aaff
      this.lightningSprite.setTint(tint)
    }

    // Impact crackle at the tip — where bolt hits
    const tipX = this.x + Math.cos(this.lightningAngle) * Math.min(closestDist, lightRange)
    const tipY = this.y + Math.sin(this.lightningAngle) * Math.min(closestDist, lightRange)
    const g2 = this.lightningGfx
    // Small radiating sparks at impact point
    for (let i = 0; i < 3; i++) {
      const sa = this.lightningAngle + (Math.random() - 0.5) * 2.5
      const sl = Phaser.Math.FloatBetween(4, 12)
      g2.lineStyle(1, 0xccddff, 0.4 + Math.random() * 0.4)
      g2.beginPath()
      g2.moveTo(tipX, tipY)
      g2.lineTo(tipX + Math.cos(sa) * sl, tipY + Math.sin(sa) * sl)
      g2.strokePath()
    }
    // Fading glow dot at tip
    g2.fillStyle(0xaaccff, 0.25 + Math.random() * 0.2)
    g2.fillCircle(tipX, tipY, 4 + Math.random() * 3)

    // Secondary jagged arcs in the cone (Graphics layer — extra bolts for beefier feel)
    const g = this.lightningGfx
    const boltCount = 1 + Math.floor(dmgRatio * 0.4)
    for (let b = 0; b < boltCount; b++) {
      const boltAngle = this.lightningAngle + (Math.random() - 0.5) * spread * 1.5
      const alpha = 0.3 + Math.random() * 0.35
      g.lineStyle(Phaser.Math.Between(1, 2), 0xaaccff, alpha)
      let bx = this.x, by = this.y
      const segments = Phaser.Math.Between(4, 6)
      const segLen = lightRange / segments
      g.beginPath()
      g.moveTo(bx, by)
      for (let s = 0; s < segments; s++) {
        const jitter = (Math.random() - 0.5) * 14
        bx += Math.cos(boltAngle) * segLen + jitter * Math.sin(boltAngle)
        by += Math.sin(boltAngle) * segLen - jitter * Math.cos(boltAngle)
        g.lineTo(bx, by)
      }
      g.strokePath()

      // Branch bolts — small forks off main bolt
      if (Math.random() < 0.4) {
        const forkSeg = Phaser.Math.Between(1, segments - 1)
        const forkX = this.x + Math.cos(boltAngle) * segLen * forkSeg
        const forkY = this.y + Math.sin(boltAngle) * segLen * forkSeg
        const forkAngle = boltAngle + (Math.random() - 0.5) * 1.2
        g.lineStyle(1, 0x88aaff, alpha * 0.6)
        g.beginPath()
        g.moveTo(forkX, forkY)
        let fx = forkX, fy = forkY
        for (let fs = 0; fs < 3; fs++) {
          fx += Math.cos(forkAngle) * segLen * 0.5 + (Math.random() - 0.5) * 8
          fy += Math.sin(forkAngle) * segLen * 0.5 + (Math.random() - 0.5) * 8
          g.lineTo(fx, fy)
        }
        g.strokePath()
      }
    }

    // Electric spark particles — brighter, more frequent
    this.lightningSparkTimer += delta
    if (this.lightningSparkTimer > 45) {
      this.lightningSparkTimer = 0
      // Sparks along the bolt path
      for (let i = 0; i < 2; i++) {
        const sparkAngle = this.lightningAngle + (Math.random() - 0.5) * spread
        const sparkDist = Phaser.Math.FloatBetween(15, lightRange * 0.9)
        const sx = this.x + Math.cos(sparkAngle) * sparkDist
        const sy = this.y + Math.sin(sparkAngle) * sparkDist
        const sparkTex = this.scene.textures.exists('vfx_spark_elec') ? 'vfx_spark_elec' : 'vfx_spark'
        const spark = this.scene.add.image(sx, sy, sparkTex)
          .setScale(Phaser.Math.FloatBetween(1.2, 3)).setDepth(10)
          .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9)
          .setRotation(Math.random() * Math.PI)
        this.scene.tweens.add({
          targets: spark, alpha: 0, scale: 0.2, duration: 150 + Math.random() * 100,
          onComplete: () => spark.destroy(),
        })
      }
    }

    // Damage enemies inside the wide cone
    const coneSpread = this.hasArcReach ? spread * 1.5 : spread
    const dmgThisFrame = this.damage * (delta / 1000)
    const overcharging = this.hasOvercharge && Math.random() < 0.08 // ~8% per frame = frequent bursts
    const chainTargets: Phaser.Physics.Arcade.Sprite[] = []

    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
      if (dist > lightRange) continue
      const angleToEnemy = Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y)
      const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - this.lightningAngle)
      if (Math.abs(angleDiff) <= coneSpread) {
        const dmg = overcharging ? dmgThisFrame * 3 : dmgThisFrame;
        (e as any).takeDamage(dmg, 'lightning')
        // Slow enemies
        if ((e as any).speed && (e as any).baseSpeed) {
          (e as any).speed = Math.max((e as any).baseSpeed * 0.6, (e as any).speed * 0.98)
        }
        if (this.hasSparkInitiate) chainTargets.push(e)
      }
    }

    // Overcharge VFX: bright flash
    if (overcharging) {
      const flash = this.scene.add.circle(closest.x, closest.y, 12, 0xffffff, 0.7).setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
      this.scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 150, onComplete: () => flash.destroy() })
    }

    // Spark Initiate: chain lightning to 1 nearby enemy outside cone
    if (this.hasSparkInitiate && chainTargets.length > 0) {
      const src = chainTargets[0]
      let chainTarget: Phaser.Physics.Arcade.Sprite | null = null
      let chainDist = Infinity
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active || chainTargets.includes(e)) continue
        const d = Phaser.Math.Distance.Between(src.x, src.y, e.x, e.y)
        if (d < 80 && d < chainDist) { chainDist = d; chainTarget = e }
      }
      if (chainTarget) {
        (chainTarget as any).takeDamage(dmgThisFrame * 0.6, 'lightning')
        // Chain bolt VFX
        const cg = this.scene.add.graphics().setDepth(10)
        cg.lineStyle(2, 0xaaddff, 0.7)
        cg.beginPath(); cg.moveTo(src.x, src.y)
        const mx = (src.x + chainTarget.x) / 2 + (Math.random() - 0.5) * 20
        const my = (src.y + chainTarget.y) / 2 + (Math.random() - 0.5) * 20
        cg.lineTo(mx, my); cg.lineTo(chainTarget.x, chainTarget.y); cg.strokePath()
        this.scene.tweens.add({ targets: cg, alpha: 0, duration: 100, onComplete: () => cg.destroy() })
      }
    }

    // Arc Reach: arc zap to enemies just outside normal cone
    if (this.hasArcReach) {
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
        if (dist > lightRange || dist <= 0) continue
        const ae = Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y)
        const ad = Math.abs(Phaser.Math.Angle.Wrap(ae - this.lightningAngle))
        if (ad > coneSpread && ad <= coneSpread + 0.4) {
          (e as any).takeDamage(dmgThisFrame * 0.4, 'lightning')
        }
      }
    }
  }

  // Dash slash (originally Khet — kept for re-use)
  private attackDash(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    const ox = this.x, oy = this.y
    const dashAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)

    // Dynamic: trail count scales with strikeCount, tint shifts with damage
    const trailCount = 3 + this.strikeCount
    const hitRadius = 48 + this.splashRadius * 0.5
    const dmgRatio = Math.min(this.damage / 35, 3)
    const slashTint = dmgRatio > 2 ? 0xffffff : dmgRatio > 1.5 ? 0xdd99ff : 0xbb88ff
    const slashScale = 2.5 + (this.range - 48) * 0.02

    // Afterimage trail during dash
    for (let i = 1; i <= trailCount; i++) {
      const t = i / (trailCount + 1)
      const tx = ox + (target.x - ox) * t
      const ty = oy + (target.y - oy) * t
      this.scene.time.delayedCall(i * 15, () => {
        const ghost = this.scene.add.sprite(tx, ty, this.texture.key, this.frame.name)
          .setScale(this.scaleX, this.scaleY)
          .setAlpha(0.4)
          .setTint(slashTint)
          .setFlipX(this.flipX)
          .setDepth(8)
        this.scene.tweens.add({
          targets: ghost, alpha: 0, scale: this.scaleX * 0.6,
          duration: 250, onComplete: () => ghost.destroy(),
        })
      })
    }

    // Dash to target
    this.scene.tweens.add({
      targets: this, x: target.x, y: target.y,
      duration: 80,
      onComplete: () => {
        // Slash all enemies in hit radius
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= hitRadius) {
            for (let i = 0; i < this.strikeCount; i++) (e as any).takeDamage(this.damage, 'melee')
            // Hit spark — size scales with damage
            if (this.scene.textures.exists('vfx_hitspark')) {
              const spark = this.scene.add.image(e.x, e.y, 'vfx_hitspark')
                .setScale(1.5 + dmgRatio * 0.5).setDepth(10)
                .setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
              this.scene.tweens.add({
                targets: spark, alpha: 0, scale: 2.5 + dmgRatio, duration: 200,
                onComplete: () => spark.destroy(),
              })
            }
          }
        }

        // Smoke Bomb — slow all enemies in radius
        if (this.hasSmokeBomb) {
          const smokeRadius = 60 + this.splashRadius * 0.5
          // Visual: expanding purple smoke
          const smoke = this.scene.add.circle(this.x, this.y, 10, 0x553388, 0.5).setDepth(4)
          this.scene.tweens.add({
            targets: smoke, scale: smokeRadius / 10, alpha: 0, duration: 600,
            onComplete: () => smoke.destroy(),
          })
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= smokeRadius) {
              if ((e as any).speed && (e as any).baseSpeed) {
                (e as any).speed = (e as any).baseSpeed * 0.4
              }
            }
          }
        }

        // Slash arc — multiple arcs for strikeCount > 1
        if (this.scene.textures.exists('vfx_slash')) {
          for (let s = 0; s < this.strikeCount; s++) {
            const angleOff = (s - (this.strikeCount - 1) / 2) * 0.3
            const slash = this.scene.add.image(this.x, this.y, 'vfx_slash')
              .setScale(slashScale).setRotation(dashAngle + angleOff).setDepth(10)
              .setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
            this.scene.tweens.add({
              targets: slash, alpha: 0, scale: slashScale + 1.5,
              duration: 250, delay: s * 40,
              onComplete: () => slash.destroy(),
            })
          }
        }

        // Chain Dash — bounce to a second target
        if (this.hasChainDash) {
          let chainTarget: Phaser.Physics.Arcade.Sprite | null = null
          let chainDist = Infinity
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || e === target) continue
            const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
            if (d < this.range * 1.2 && d < chainDist) { chainDist = d; chainTarget = e }
          }
          if (chainTarget) {
            const ct = chainTarget
            this.scene.tweens.add({
              targets: this, x: ct.x, y: ct.y, duration: 60,
              onComplete: () => {
                for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                  if (!e.active) continue
                  if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= hitRadius) {
                    (e as any).takeDamage(this.damage * 0.7, 'melee')
                  }
                }
                // Slash VFX at chain target
                if (this.scene.textures.exists('vfx_slash')) {
                  const chainAngle = Phaser.Math.Angle.Between(target.x, target.y, ct.x, ct.y)
                  const s = this.scene.add.image(this.x, this.y, 'vfx_slash')
                    .setScale(slashScale * 0.8).setRotation(chainAngle).setDepth(10)
                    .setBlendMode(Phaser.BlendModes.ADD).setTint(0xcc88ff)
                  this.scene.tweens.add({ targets: s, alpha: 0, scale: slashScale + 1, duration: 200, onComplete: () => s.destroy() })
                }
                // Return from chain target
                this.scene.tweens.add({
                  targets: this, x: ox, y: oy, duration: 80,
                  onComplete: () => {
                    this.isAttacking = false
                    if (this.hasVanish) {
                      this.vanishUntil = this.scene.time.now + 600
                      this.setAlpha(0.5)
                      this.scene.time.delayedCall(600, () => { if (this.active) this.setAlpha(1) })
                    }
                  },
                })
              },
            })
            return  // Skip the normal return tween
          }
        }

        // Return
        this.scene.tweens.add({
          targets: this, x: ox, y: oy, duration: 80,
          onComplete: () => {
            this.isAttacking = false
            if (this.hasVanish) {
              this.vanishUntil = this.scene.time.now + 600
              this.setAlpha(0.5)
              this.scene.time.delayedCall(600, () => { if (this.active) this.setAlpha(1) })
            }
          },
        })
      },
    })
  }

  // SIFRA — Ice shard (piercing crystal with frost trail)
  private attackIceShard(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)
    const useShard = this.scene.textures.exists('vfx_iceshard')
    const hasFrost = this.scene.textures.exists('vfx_frost')

    // Dynamic: shard size from damage + splash, hit radius from splash, multi-shard from strikeCount
    const dmgRatio = Math.min(this.damage / 12, 4)
    const hitRadius = 24 + this.splashRadius * 0.5
    const shardScale = 1.5 + dmgRatio * 0.4 + this.splashRadius * 0.025
    const shatterCount = 3 + Math.floor(this.splashRadius / 15)
    const shardTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0xccf0ff : 0x88ddff
    const shardCount = this.strikeCount

    // Frost Nova: every 4th shot fires a ring burst
    if (this.hasFrostNova) {
      this.frostNovaCounter++
      if (this.frostNovaCounter >= 4) {
        this.frostNovaCounter = 0
        // Fire 8 shards in a ring
        for (let i = 0; i < 8; i++) {
          const novaAngle = (i / 8) * Math.PI * 2
          const novaShard = useShard
            ? this.scene.add.image(this.x, this.y, 'vfx_iceshard').setScale(shardScale * 0.7).setDepth(9)
                .setBlendMode(Phaser.BlendModes.ADD).setTint(0xaaeeff)
            : this.scene.add.rectangle(this.x, this.y, 10, 3, 0x88ddff).setDepth(9)
          novaShard.rotation = novaAngle - Math.PI / 2
          const novaEndX = this.x + Math.cos(novaAngle) * this.range * 0.7
          const novaEndY = this.y + Math.sin(novaAngle) * this.range * 0.7
          const novaHitSet = new Set<Phaser.Physics.Arcade.Sprite>()
          this.scene.tweens.add({
            targets: novaShard, x: novaEndX, y: novaEndY, duration: 250,
            onUpdate: () => {
              for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e.active || novaHitSet.has(e)) continue
                if (Phaser.Math.Distance.Between(novaShard.x, novaShard.y, e.x, e.y) <= hitRadius * 0.8) {
                  (e as any).takeDamage(this.damage * 0.5, 'ice')
                  if ((e as any).speed) (e as any).speed *= 0.6
                  novaHitSet.add(e)
                }
              }
            },
            onComplete: () => novaShard.destroy(),
          })
        }
        // Ring flash VFX
        const ring = this.scene.add.circle(this.x, this.y, 10, 0x88ddff, 0.4).setDepth(8)
        this.scene.tweens.add({
          targets: ring, scale: this.range * 0.7 / 10, alpha: 0, duration: 400,
          onComplete: () => ring.destroy(),
        })
      }
    }

    // Fire multiple shards in a spread pattern
    for (let s = 0; s < shardCount; s++) {
      const angleOff = (s - (shardCount - 1) / 2) * 0.15
      const angle = baseAngle + angleOff

      const shard = useShard
        ? this.scene.add.image(this.x, this.y, 'vfx_iceshard').setScale(shardScale).setDepth(9)
            .setBlendMode(Phaser.BlendModes.ADD).setTint(shardTint)
        : this.scene.add.rectangle(this.x, this.y, 12, 4, 0x00d2d3).setDepth(9)
      shard.rotation = angle - Math.PI / 2
      const endX = this.x + Math.cos(angle) * this.range
      const endY = this.y + Math.sin(angle) * this.range
      const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()

      // Frost trail
      let trailTimer: Phaser.Time.TimerEvent | null = null
      if (hasFrost) {
        trailTimer = this.scene.time.addEvent({
          delay: 25, loop: true,
          callback: () => {
            const frost = this.scene.add.image(
              shard.x + Phaser.Math.Between(-4, 4),
              shard.y + Phaser.Math.Between(-4, 4),
              'vfx_frost'
            ).setScale(Phaser.Math.FloatBetween(1, 1.5 + dmgRatio * 0.3)).setDepth(8)
              .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7).setTint(shardTint)
            this.scene.tweens.add({
              targets: frost, alpha: 0, scale: 0.3, duration: 300,
              onComplete: () => frost.destroy(),
            })
          },
        })
      }

      this.scene.tweens.add({
        targets: shard, x: endX, y: endY,
        duration: 300,
        onUpdate: () => {
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || hitSet.has(e)) continue
            if (Phaser.Math.Distance.Between(shard.x, shard.y, e.x, e.y) <= hitRadius) {
              // Permafrost: bonus dmg to slowed enemies
              const isSlowed = (e as any).speed && (e as any).baseSpeed && (e as any).speed < (e as any).baseSpeed * 0.9
              const permaDmg = (this.hasPermafrost && isSlowed) ? this.damage * 1.4 : this.damage;
              (e as any).takeDamage(permaDmg, 'ice')
              // Deep Freeze: stronger slow (0.3x vs 0.7x)
              const slowMult = this.hasDeepFreeze ? 0.3 : 0.7
              if ((e as any).speed) (e as any).speed *= slowMult
              // Absolute Zero: freeze stun if very slow
              if (this.hasAbsoluteZero && (e as any).speed && (e as any).baseSpeed) {
                if ((e as any).speed < (e as any).baseSpeed * 0.35 && !(e as any)._frozenUntil) {
                  (e as any)._frozenUntil = this.scene.time.now + 2000;
                  (e as any).speed = 0
                  e.setTintFill(0x88ccff)
                  this.scene.time.delayedCall(2000, () => {
                    if (e.active) {
                      e.clearTint()
                      ;(e as any)._frozenUntil = 0
                      ;(e as any).speed = (e as any).baseSpeed * 0.5
                    }
                  })
                }
              }
              hitSet.add(e)
              // Cosmetic ice burst particles
              for (let i = 0; i < shatterCount; i++) {
                const sa = Math.random() * Math.PI * 2
                const sd = Phaser.Math.Between(8, 15 + Math.floor(this.splashRadius * 0.3))
                const sp = this.scene.add.image(e.x, e.y, hasFrost ? 'vfx_frost' : 'vfx_spark')
                  .setScale(Phaser.Math.FloatBetween(1, 2 + dmgRatio * 0.3)).setDepth(10).setAlpha(0.8)
                  .setBlendMode(Phaser.BlendModes.ADD).setTint(shardTint)
                this.scene.tweens.add({
                  targets: sp,
                  x: e.x + Math.cos(sa) * sd, y: e.y + Math.sin(sa) * sd,
                  alpha: 0, scale: 0.2, duration: 250,
                  onComplete: () => sp.destroy(),
                })
              }
              // Shatter mechanic — split into mini-shards that seek nearby mobs
              if (this.shatterPieces > 0) {
                this.spawnShatterShards(e, enemies, hitSet, useShard, hasFrost, shardTint, dmgRatio)
              }
              // Pierce limit reached — destroy shard early
              if (hitSet.size >= this.pierceCount) {
                if (trailTimer) { trailTimer.destroy(); trailTimer = null }
                shard.destroy()
                if (s === shardCount - 1) this.isAttacking = false
                return
              }
            }
          }
        },
        onComplete: () => {
          if (trailTimer) trailTimer.destroy()
          if (shard.scene) shard.destroy()  // guard: may already be destroyed by pierce limit
          if (s === shardCount - 1) this.isAttacking = false
        },
      })
    }
  }

  /** Shatter: on-hit ice shard splits into mini-shards that fly to nearby mobs */
  private spawnShatterShards(
    hitEnemy: Phaser.Physics.Arcade.Sprite,
    enemies: Phaser.Physics.Arcade.Group,
    parentHitSet: Set<Phaser.Physics.Arcade.Sprite>,
    useShard: boolean, hasFrost: boolean,
    tint: number, dmgRatio: number,
  ) {
    // Find nearby targets (not already hit by parent shard)
    const nearby: Phaser.Physics.Arcade.Sprite[] = []
    const seekRange = 80 + this.splashRadius * 0.5
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active || e === hitEnemy || parentHitSet.has(e)) continue
      if (Phaser.Math.Distance.Between(hitEnemy.x, hitEnemy.y, e.x, e.y) <= seekRange) {
        nearby.push(e)
      }
    }
    // Shuffle and take up to shatterPieces targets
    nearby.sort(() => Math.random() - 0.5)
    const targets = nearby.slice(0, this.shatterPieces)
    const shatterDmg = Math.ceil(this.damage * 0.5)
    const miniScale = 0.8 + dmgRatio * 0.2

    for (const t of targets) {
      const mini = useShard
        ? this.scene.add.image(hitEnemy.x, hitEnemy.y, 'vfx_iceshard')
            .setScale(miniScale).setDepth(9).setAlpha(0.85)
            .setBlendMode(Phaser.BlendModes.ADD).setTint(tint)
        : this.scene.add.rectangle(hitEnemy.x, hitEnemy.y, 8, 3, 0x88ddff).setDepth(9)
      const ang = Phaser.Math.Angle.Between(hitEnemy.x, hitEnemy.y, t.x, t.y)
      mini.rotation = ang - Math.PI / 2

      this.scene.tweens.add({
        targets: mini,
        x: t.x, y: t.y,
        duration: 180,
        onComplete: () => {
          mini.destroy()
          if (t.active) {
            (t as any).takeDamage(shatterDmg, 'ice')
            if ((t as any).speed) (t as any).speed *= 0.8
            parentHitSet.add(t)
            // Small burst on impact
            for (let i = 0; i < 3; i++) {
              const sa = Math.random() * Math.PI * 2
              const sp = this.scene.add.image(t.x, t.y, hasFrost ? 'vfx_frost' : 'vfx_spark')
                .setScale(Phaser.Math.FloatBetween(0.5, 1.2)).setDepth(10).setAlpha(0.7)
                .setBlendMode(Phaser.BlendModes.ADD).setTint(tint)
              this.scene.tweens.add({
                targets: sp,
                x: t.x + Math.cos(sa) * 10, y: t.y + Math.sin(sa) * 10,
                alpha: 0, scale: 0.1, duration: 200,
                onComplete: () => sp.destroy(),
              })
            }
          }
        },
      })
    }
  }

  // AMUN — Shockwave ring
  private attackShockwave(enemies: Phaser.Physics.Arcade.Group) {
    const cx = this.x, cy = this.y
    const useRing = this.scene.textures.exists('vfx_shockring')
    const useSpark = this.scene.textures.exists('vfx_hitspark')

    // Dynamic: ring size from range, particles from splash, multi-ring from strikeCount
    const rangeRatio = this.range / 80
    const maxScale = (useRing ? 4 : 8) * rangeRatio
    const dmgRatio = Math.min(this.damage / 10, 4)
    const dustCount = 6 + Math.floor(this.splashRadius / 10)
    const ringCount = this.strikeCount
    const ringTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0xffffaa : 0xfff200
    const kbForce = (this.hasColossus ? 500 : 200) + this.splashRadius * 2

    // Center flash — bigger with damage
    if (useSpark) {
      const flash = this.scene.add.image(cx, cy, 'vfx_hitspark')
        .setScale(2 + dmgRatio).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setTint(ringTint)
      this.scene.tweens.add({
        targets: flash, alpha: 0, scale: 4 + dmgRatio, duration: 300,
        onComplete: () => flash.destroy(),
      })
    }

    // Ground dust particles — count scales with splash
    for (let i = 0; i < dustCount; i++) {
      const a = (i / dustCount) * Math.PI * 2
      const dustDist = Phaser.Math.Between(30, 50) * rangeRatio
      const dust = this.scene.add.circle(cx, cy, Phaser.Math.Between(2, 4), 0xccaa55, 0.6).setDepth(8)
      this.scene.tweens.add({
        targets: dust,
        x: cx + Math.cos(a) * dustDist,
        y: cy + Math.sin(a) * dustDist,
        alpha: 0, scale: 0.3, duration: 400,
        onComplete: () => dust.destroy(),
      })
    }

    // Ground crack lines when range is boosted (Titan's Pulse visual)
    if (rangeRatio > 1.2) {
      const crackG = this.scene.add.graphics().setDepth(7)
      const crackCount = Math.floor(rangeRatio * 4)
      crackG.lineStyle(2, 0xccaa44, 0.5)
      for (let i = 0; i < crackCount; i++) {
        const a = (i / crackCount) * Math.PI * 2 + Math.random() * 0.3
        const len = (40 + Math.random() * 30) * rangeRatio
        crackG.beginPath()
        crackG.moveTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10)
        // Jagged line with mid-point offset
        const mx = cx + Math.cos(a) * len * 0.5 + (Math.random() - 0.5) * 8
        const my = cy + Math.sin(a) * len * 0.5 + (Math.random() - 0.5) * 8
        crackG.lineTo(mx, my)
        crackG.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len)
        crackG.strokePath()
      }
      this.scene.tweens.add({
        targets: crackG, alpha: 0, duration: 600,
        onComplete: () => crackG.destroy(),
      })
    }

    // Titan's Pulse: launch a boulder projectile toward nearest enemy
    if (this.hasTitansPulse) {
      let nearest: Phaser.Physics.Arcade.Sprite | null = null
      let nearDist = Infinity
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const d = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
        if (d < nearDist) { nearDist = d; nearest = e }
      }
      if (nearest) {
        const angle = Phaser.Math.Angle.Between(cx, cy, nearest.x, nearest.y)
        const boulderRadius = 18
        const boulderSpeed = 320
        const boulderRange = 300
        const boulderDmg = this.damage * 1.5
        const splashR = 60 + this.splashRadius * 0.5

        // Create boulder graphics
        const boulder = this.scene.add.graphics().setDepth(11)
        boulder.fillStyle(0x887744, 1)
        boulder.fillCircle(0, 0, boulderRadius)
        boulder.fillStyle(0xaa9966, 0.7)
        boulder.fillCircle(-4, -5, boulderRadius * 0.6)
        boulder.lineStyle(2, 0x665533, 0.8)
        boulder.strokeCircle(0, 0, boulderRadius)
        boulder.setPosition(cx, cy)

        const startX = cx, startY = cy
        const vx = Math.cos(angle) * boulderSpeed
        const vy = Math.sin(angle) * boulderSpeed
        const boulderHitSet = new Set<Phaser.Physics.Arcade.Sprite>()

        const boulderUpdate = this.scene.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            boulder.x += vx * 0.016
            boulder.y += vy * 0.016
            boulder.rotation += 0.15

            // Check if out of range
            const traveled = Phaser.Math.Distance.Between(startX, startY, boulder.x, boulder.y)
            if (traveled > boulderRange) {
              // Explode at end
              this.boulderExplode(boulder.x, boulder.y, splashR, boulderDmg, enemies, boulderHitSet)
              boulder.destroy()
              boulderUpdate.destroy()
              return
            }

            // Check hit with enemies
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active || boulderHitSet.has(e)) continue
              const d = Phaser.Math.Distance.Between(boulder.x, boulder.y, e.x, e.y)
              if (d < boulderRadius + 20) {
                // Explode on contact
                this.boulderExplode(boulder.x, boulder.y, splashR, boulderDmg, enemies, boulderHitSet)
                boulder.destroy()
                boulderUpdate.destroy()
                return
              }
            }
          },
        })
      }
    }

    // Multi-ring: spawn staggered rings
    const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()
    let ringsFinished = 0

    for (let r = 0; r < ringCount; r++) {
      this.scene.time.delayedCall(r * 120, () => {
        const ring = useRing
          ? this.scene.add.image(cx, cy, 'vfx_shockring')
              .setScale(0.5).setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setTint(ringTint)
          : this.scene.add.circle(cx, cy, 10, ringTint, 0.6).setDepth(9)

        this.scene.tweens.add({
          targets: ring,
          scale: maxScale,
          alpha: 0,
          duration: 400,
          onUpdate: () => {
            const radius = useRing ? ring.scale * 24 : ring.scale * 10
            const band = 25 + this.splashRadius * 0.3
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active || hitSet.has(e)) continue
              const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
              if (dist <= radius && dist >= radius - band) {
                (e as any).takeDamage(this.damage, 'shockwave')
                hitSet.add(e)
                const kbAngle = Phaser.Math.Angle.Between(cx, cy, e.x, e.y);
                (e.body as Phaser.Physics.Arcade.Body).setVelocity(
                  Math.cos(kbAngle) * kbForce, Math.sin(kbAngle) * kbForce
                )

                // Earthquake: stun enemies for 0.8s
                if (this.hasEarthquake && (e as any).speed !== undefined) {
                  const origSpeed = (e as any).baseSpeed || (e as any).speed
                  ;(e as any).speed = 0
                  // VFX: stun indicator — spinning star above enemy
                  const starGfx = this.scene.add.graphics().setDepth(12)
                  const stunEvt = this.scene.time.addEvent({
                    delay: 16, loop: true,
                    callback: () => {
                      if (!e.active) { starGfx.destroy(); stunEvt.destroy(); return }
                      starGfx.clear()
                      const st = this.scene.time.now
                      const sr = 6
                      for (let s = 0; s < 3; s++) {
                        const sa = (st / 200) + s * Math.PI * 2 / 3
                        starGfx.fillStyle(0xffff66, 0.8)
                        starGfx.fillCircle(
                          e.x + Math.cos(sa) * sr,
                          e.y - 20 + Math.sin(sa) * sr * 0.5,
                          2
                        )
                      }
                    },
                  })
                  this.scene.time.delayedCall(800, () => {
                    if (e.active) (e as any).speed = origSpeed
                    starGfx.destroy()
                    stunEvt.destroy()
                  })
                }

                if (useSpark) {
                  const hs = this.scene.add.image(e.x, e.y, 'vfx_hitspark')
                    .setScale(1 + dmgRatio * 0.5).setDepth(10)
                    .setBlendMode(Phaser.BlendModes.ADD).setTint(ringTint)
                  this.scene.tweens.add({
                    targets: hs, alpha: 0, scale: 2 + dmgRatio, duration: 200,
                    onComplete: () => hs.destroy(),
                  })
                }
              }
            }
          },
          onComplete: () => {
            ring.destroy()
            ringsFinished++
            if (ringsFinished >= ringCount) this.isAttacking = false
          },
        })
      })
    }

    // Cataclysm: second delayed shockwave burst
    if (this.hasCataclysm) {
      this.scene.time.delayedCall(350, () => {
        const hitSet2 = new Set<Phaser.Physics.Arcade.Sprite>()
        const ring2 = useRing
          ? this.scene.add.image(cx, cy, 'vfx_shockring')
              .setScale(0.5).setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff8800)
          : this.scene.add.circle(cx, cy, 10, 0xff8800, 0.6).setDepth(9)
        this.scene.tweens.add({
          targets: ring2, scale: maxScale * 1.2, alpha: 0, duration: 450,
          onUpdate: () => {
            const radius = useRing ? ring2.scale * 24 : ring2.scale * 10
            const band = 25 + this.splashRadius * 0.3
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active || hitSet2.has(e)) continue
              const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
              if (dist <= radius && dist >= radius - band) {
                (e as any).takeDamage(this.damage * 0.6, 'shockwave')
                hitSet2.add(e)
                const kb = Phaser.Math.Angle.Between(cx, cy, e.x, e.y);
                (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(kb) * kbForce * 0.6, Math.sin(kb) * kbForce * 0.6)
              }
            }
          },
          onComplete: () => ring2.destroy(),
        })
      })
    }
  }

  // Titan's Pulse boulder explosion
  private boulderExplode(bx: number, by: number, radius: number, dmg: number, enemies: Phaser.Physics.Arcade.Group, hitSet: Set<Phaser.Physics.Arcade.Sprite>) {
    // AOE damage
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active || hitSet.has(e)) continue
      const d = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
      if (d < radius) {
        (e as any).takeDamage(dmg, 'shockwave')
        hitSet.add(e)
        const kb = Phaser.Math.Angle.Between(bx, by, e.x, e.y);
        (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(kb) * 250, Math.sin(kb) * 250)
      }
    }
    // VFX: explosion ring
    const ring = this.scene.add.circle(bx, by, 8, 0xffcc44, 0.7).setDepth(11)
    this.scene.tweens.add({
      targets: ring, scale: radius / 8, alpha: 0, duration: 350,
      onComplete: () => ring.destroy(),
    })
    // Debris particles
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const dist = 30 + Math.random() * 30
      const debris = this.scene.add.circle(bx, by, 3 + Math.random() * 3, 0x887744, 0.9).setDepth(12)
      this.scene.tweens.add({
        targets: debris,
        x: bx + Math.cos(a) * dist, y: by + Math.sin(a) * dist,
        alpha: 0, scale: 0.3, duration: 300 + Math.random() * 150,
        onComplete: () => debris.destroy(),
      })
    }
    // Screen shake
    this.scene.cameras.main.shake(80, 0.005)
  }

  // NAZAR — Poison cloud (animated expanding puffs → ring → dissipate)
  private attackPoison(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    const tx = target.x, ty = target.y
    // Dynamic: vial size scales with damage
    const dmgRatio = Math.min(this.damage / 6, 4)
    const vialSize = 3 + dmgRatio
    const vialColor = dmgRatio > 2.5 ? 0xddff44 : dmgRatio > 1.5 ? 0x88ee33 : 0xa3cb38
    const vial = this.scene.add.circle(this.x, this.y, vialSize, vialColor).setDepth(9)
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty)

    this.scene.tweens.add({
      targets: vial, x: tx, y: ty,
      duration: (dist / 250) * 1000,
      onComplete: () => {
        vial.destroy()
        this.spawnPoisonCloud(tx, ty, enemies)
        this.isAttacking = false
      },
    })
  }

  private spawnPoisonCloud(cx: number, cy: number, enemies: Phaser.Physics.Arcade.Group) {
    const cloudGfx = this.scene.add.graphics().setDepth(9)
    // Dynamic: pool radius scales with splashRadius, duration with damage
    const dmgRatio = Math.min(this.damage / 6, 4)
    const poolRadius = 48 + this.splashRadius * 0.8
    const totalDuration = 4000 + Math.floor(dmgRatio * 500)
    const startTime = this.scene.time.now

    // Puff count scales with stats
    const numPuffs = 6 + Math.floor(dmgRatio * 2) + Math.floor(this.splashRadius / 20)
    const puffs: { angle: number; dist: number; size: number; phase: number; speed: number }[] = []
    for (let i = 0; i < numPuffs; i++) {
      puffs.push({
        angle: (i / numPuffs) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2),
        dist: 0,
        size: Phaser.Math.FloatBetween(10, 16),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        speed: Phaser.Math.FloatBetween(0.8, 1.2),
      })
    }

    // Small wisp fragments that appear during dissipation
    const wisps: { angle: number; dist: number; size: number; phase: number }[] = []
    for (let i = 0; i < 6; i++) {
      wisps.push({
        angle: (i / 6) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3),
        dist: poolRadius * 0.6,
        size: Phaser.Math.FloatBetween(4, 7),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      })
    }

    // Damage timer — tick every 500ms
    let tickCount = 0
    this.scene.time.addEvent({
      delay: 500,
      repeat: 7,
      callback: () => {
        tickCount++
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= poolRadius) {
            const hpBefore = (e as any).hp || 0
            // Necrosis: poison DPS ramps +20% per tick
            const necroMult = this.hasNecrosis ? (1 + tickCount * 0.2) : 1;
            (e as any).takeDamage(this.damage * necroMult, 'poison')
            // Tag as poisoned for Weakness
            ;(e as any)._poisoned = true
            e.setTint(0x88ff88)
            // Clear poison tag after 3s
            if (!(e as any)._poisonClearTimer) {
              (e as any)._poisonClearTimer = this.scene.time.delayedCall(3000, () => {
                if (e.active) { (e as any)._poisoned = false; e.clearTint() }
                ;(e as any)._poisonClearTimer = null
              })
            }
            // Pandemic: spread mini-cloud on kill
            if (this.hasPandemic && hpBefore > 0 && ((e as any).hp <= 0 || !e.active)) {
              const miniRadius = poolRadius * 0.5
              const miniGfx = this.scene.add.circle(e.x, e.y, miniRadius * 0.3, 0x44cc44, 0.3).setDepth(3)
              this.scene.tweens.add({ targets: miniGfx, scale: 2, alpha: 0, duration: 1500, onComplete: () => miniGfx.destroy() })
              // Mini cloud damage
              let miniTicks = 0
              this.scene.time.addEvent({
                delay: 500, repeat: 3,
                callback: () => {
                  miniTicks++
                  for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                    if (!e2.active) continue
                    if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= miniRadius) {
                      (e2 as any).takeDamage(this.damage * 0.5, 'poison')
                    }
                  }
                },
              })
            }
          }
        }
      },
    })

    // Toxic Slash: lingering poison puddle at hit location
    if (this.hasToxicSlash) {
      const puddleR = this.hasVirulentStrain ? poolRadius * 0.8 : poolRadius * 0.5
      const puddleDur = this.hasVirulentStrain ? 5000 : 3000
      const puddleGfx = this.scene.add.graphics().setDepth(2)
      const puddleStart = this.scene.time.now
      // Puddle damage tick
      this.scene.time.addEvent({
        delay: 400, repeat: Math.floor(puddleDur / 400),
        callback: () => {
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= puddleR) {
              (e as any).takeDamage(this.damage * 0.3, 'poison')
              ;(e as any)._poisoned = true
            }
          }
        },
      })
      // Puddle visual animation
      const puddleVfx = this.scene.time.addEvent({
        delay: 16, loop: true,
        callback: () => {
          const el = this.scene.time.now - puddleStart
          if (el >= puddleDur) { puddleGfx.destroy(); puddleVfx.destroy(); return }
          const fade = 1 - el / puddleDur
          puddleGfx.clear()
          puddleGfx.fillStyle(0x33aa33, fade * 0.25)
          puddleGfx.fillEllipse(cx, cy, puddleR * 2, puddleR * 1.2)
          puddleGfx.lineStyle(1, 0x44cc44, fade * 0.4)
          puddleGfx.strokeEllipse(cx, cy, puddleR * 2, puddleR * 1.2)
          // Bubbles
          if (Math.random() < 0.15) {
            const ba = Math.random() * Math.PI * 2
            const bd = Math.random() * puddleR * 0.7
            const bubble = this.scene.add.circle(cx + Math.cos(ba) * bd, cy + Math.sin(ba) * bd * 0.6, 2, 0x66ee66, 0.5).setDepth(3)
            this.scene.tweens.add({ targets: bubble, y: bubble.y - 10, alpha: 0, duration: 400, onComplete: () => bubble.destroy() })
          }
        },
      })
    }

    // Animation loop
    const updateEvent = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const elapsed = this.scene.time.now - startTime
        const progress = Math.min(elapsed / totalDuration, 1)

        cloudGfx.clear()

        if (progress >= 1) {
          cloudGfx.destroy()
          updateEvent.destroy()
          return
        }

        const t = elapsed / 1000

        // Phase 1 (0-0.15): small cloud appears, puffs grow from center
        // Phase 2 (0.15-0.5): puffs expand outward into a ring, center darkens
        // Phase 3 (0.5-0.75): ring fully formed, bubbling animation
        // Phase 4 (0.75-1.0): ring breaks apart, wisps scatter, fade out

        let ringProgress: number // how far puffs are from center (0=center, 1=ring)
        let overallAlpha: number
        let centerHole: number // 0 = no hole, 1 = full hole

        if (progress < 0.15) {
          // Growing from center
          ringProgress = 0
          overallAlpha = progress / 0.15
          centerHole = 0
        } else if (progress < 0.5) {
          // Expanding into ring
          const p = (progress - 0.15) / 0.35
          ringProgress = p
          overallAlpha = 1
          centerHole = p * 0.8
        } else if (progress < 0.75) {
          // Full ring, bubbling
          ringProgress = 1
          overallAlpha = 1
          centerHole = 0.8 + ((progress - 0.5) / 0.25) * 0.2
        } else {
          // Dissipating
          const p = (progress - 0.75) / 0.25
          ringProgress = 1 + p * 0.5
          overallAlpha = 1 - p
          centerHole = 1
        }

        // Draw center fill (dark green, fading as hole opens)
        if (centerHole < 0.9) {
          const centerAlpha = overallAlpha * (1 - centerHole) * 0.25
          cloudGfx.fillStyle(0x2d5a1e, centerAlpha)
          const cSize = poolRadius * (0.3 + ringProgress * 0.4) * (1 - centerHole * 0.6)
          cloudGfx.fillCircle(cx, cy, cSize)
        }

        // Draw puffs
        for (const puff of puffs) {
          const pDist = ringProgress * poolRadius * puff.speed
          const wobble = Math.sin(t * 4 + puff.phase) * 4
          const px = cx + Math.cos(puff.angle) * (pDist + wobble)
          const py = cy + Math.sin(puff.angle) * (pDist + wobble)

          // Puff size: grows during expansion, shrinks during dissipation
          let pSize = puff.size
          if (progress < 0.15) {
            pSize *= progress / 0.15
          } else if (progress > 0.75) {
            pSize *= (1 - (progress - 0.75) / 0.25)
          }
          // Breathing effect
          pSize += Math.sin(t * 6 + puff.phase) * 2

          if (pSize <= 0) continue

          // Color shifts with damage ratio (more toxic = brighter/yellower)
          const glowColor = dmgRatio > 2.5 ? 0x88aa22 : 0x4a8b2c
          const mainColor = dmgRatio > 2.5 ? 0xaaee33 : dmgRatio > 1.5 ? 0x88dd33 : 0x6fbf3b
          const hlColor = dmgRatio > 2.5 ? 0xddff66 : dmgRatio > 1.5 ? 0xaaff44 : 0x8fef5b

          // Outer glow
          cloudGfx.fillStyle(glowColor, overallAlpha * 0.15)
          cloudGfx.fillCircle(px, py, pSize * 1.5)

          // Main puff
          cloudGfx.fillStyle(mainColor, overallAlpha * 0.5)
          cloudGfx.fillCircle(px, py, pSize)

          // Bright highlight
          const hlOff = Math.sin(t * 3 + puff.phase) * 2
          cloudGfx.fillStyle(hlColor, overallAlpha * 0.35)
          cloudGfx.fillCircle(px - pSize * 0.25 + hlOff, py - pSize * 0.3, pSize * 0.5)

          // Dark inner shadow (gives depth)
          cloudGfx.fillStyle(0x2d5a1e, overallAlpha * 0.3)
          cloudGfx.fillCircle(px + pSize * 0.15, py + pSize * 0.2, pSize * 0.45)
        }

        // Draw wisps (small fragments during dissipation phase)
        if (progress > 0.6) {
          const wispAlpha = overallAlpha * Math.min((progress - 0.6) / 0.15, 1)
          for (const wisp of wisps) {
            const wDist = wisp.dist + (progress - 0.6) * poolRadius * 1.5
            const wAngle = wisp.angle + t * 0.5
            const wx = cx + Math.cos(wAngle) * wDist
            const wy = cy + Math.sin(wAngle) * wDist
            const wSize = wisp.size * (1 - (progress - 0.6) / 0.4)
            if (wSize <= 0) continue

            cloudGfx.fillStyle(0x6fbf3b, wispAlpha * 0.4)
            cloudGfx.fillCircle(wx, wy, wSize)
            cloudGfx.fillStyle(0x8fef5b, wispAlpha * 0.2)
            cloudGfx.fillCircle(wx, wy, wSize * 0.5)
          }
        }

        // Subtle toxic particle sparks
        if (progress < 0.85 && Math.random() < 0.4) {
          const sparkAngle = Math.random() * Math.PI * 2
          const sparkDist = Phaser.Math.FloatBetween(5, poolRadius * ringProgress)
          const sx = cx + Math.cos(sparkAngle) * sparkDist
          const sy = cy + Math.sin(sparkAngle) * sparkDist
          const spark = this.scene.add.circle(sx, sy, Phaser.Math.Between(1, 3), 0xaaff44, 0.7).setDepth(9)
          this.scene.tweens.add({
            targets: spark,
            alpha: 0, y: sy - Phaser.Math.Between(10, 25), scale: 0.2,
            duration: Phaser.Math.Between(200, 500),
            onComplete: () => spark.destroy(),
          })
        }
      },
    })
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

    if (this.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * (delta / 1000))
    }

    // Sifra stance energy regen — inactive stance recharges
    if (this.heroType === 'sifra') {
      const regenAmt = this.energyRegenRate * (delta / 1000)
      if (this.stance === 'ice') {
        this.lightningEnergy = Math.min(this.maxEnergy, this.lightningEnergy + regenAmt)
      } else {
        this.iceEnergy = Math.min(this.maxEnergy, this.iceEnergy + regenAmt)
      }
    }

    // Nazar stance energy regen — inactive stance recharges
    if (this.heroType === 'nazar') {
      const regenAmt = this.energyRegenRate * (delta / 1000)
      if (this.nazarStance === 'sword') {
        this.venomEnergy = Math.min(this.maxEnergy, this.venomEnergy + regenAmt)
      } else {
        this.swordEnergy = Math.min(this.maxEnergy, this.swordEnergy + regenAmt)
      }
    }

    // Huntress stance energy regen — inactive stance recharges
    if (this.heroType === 'huntress') {
      const regenAmt = this.energyRegenRate * (delta / 1000)
      if (this.huntressStance === 'melee') {
        this.spearEnergy = Math.min(this.maxEnergy, this.spearEnergy + regenAmt)
      } else {
        this.meleeEnergy = Math.min(this.maxEnergy, this.meleeEnergy + regenAmt)
      }
    }

    // === Huntress skill timers & passive mechanics ===
    if (this.heroType === 'huntress') {
      const now = this.scene.time.now

      // Battle Frenzy: temporary attack speed boost
      if (this.hasBattleFrenzy && this.battleFrenzyUntil > now) {
        // Frenzy is active — cooldown reduction applied in attack via lastAttackTime offset
      }

      // Kill Stride: +20% speed while active
      if (this.hasKillStride && this.killStrideUntil > now) {
        // Speed buff already applied on kill, decays naturally
      } else if (this.hasKillStride && this.killStrideUntil > 0 && this.killStrideUntil <= now) {
        this.killStrideUntil = 0
        this.speed = Math.ceil(this.speed / 1.2)
      }

      // Camouflage: alpha while invisible, enemies can't target
      if (this.hasCamouflage && this.camouflageUntil > now) {
        this.setAlpha(0.3)
      } else if (this.hasCamouflage && this.camouflageUntil > 0 && this.camouflageUntil <= now) {
        this.camouflageUntil = 0
        this.setAlpha(1)
      }

      // Caltrops: drop spike zone behind while moving
      if (this.hasCaltrops) {
        this.caltropTimer += delta
        if (this.caltropTimer >= 800) {
          const pBody2 = this.body as Phaser.Physics.Arcade.Body
          const isMoving = Math.abs(pBody2.velocity.x) > 10 || Math.abs(pBody2.velocity.y) > 10
          if (isMoving) {
            this.caltropTimer = 0
            const cx = this.x, cy = this.y
            // VFX: small spike cluster
            const calt = this.scene.add.circle(cx, cy, 10, 0x44cc44, 0.3).setDepth(3)
            // Spike marks
            for (let i = 0; i < 3; i++) {
              const sp = this.scene.add.rectangle(
                cx + Phaser.Math.Between(-8, 8), cy + Phaser.Math.Between(-8, 8),
                3, 3, 0x228822, 0.6
              ).setDepth(3).setRotation(Math.random() * Math.PI)
              this.scene.tweens.add({ targets: sp, alpha: 0, duration: 3000, delay: 500, onComplete: () => sp.destroy() })
            }
            // Damage + slow enemies over time
            let ticks = 0
            const caltTimer = this.scene.time.addEvent({
              delay: 300, repeat: 10,
              callback: () => {
                ticks++
                const scn = this.scene as any
                if (scn.enemies) {
                  for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                    if (!e.active) continue
                    if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= 18) {
                      (e as any).takeDamage(this.damage * 0.15, 'melee')
                      if ((e as any).speed && (e as any).baseSpeed) {
                        (e as any).speed = (e as any).baseSpeed * 0.5
                      }
                    }
                  }
                }
                if (ticks >= 10) { calt.destroy(); caltTimer.destroy() }
              },
            })
            this.scene.tweens.add({ targets: calt, alpha: 0, duration: 3500 })
          }
        }
      }

      // Leap: auto-leap away when 4+ enemies within 50px
      if (this.hasLeap) {
        this.leapCooldown -= delta
        if (this.leapCooldown <= 0) {
          const scn = this.scene as any
          if (scn.enemies) {
            let nearCount = 0
            let avgAngle = 0
            for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active) continue
              const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
              if (d <= 50) {
                nearCount++
                avgAngle += Phaser.Math.Angle.Between(e.x, e.y, this.x, this.y)
              }
            }
            if (nearCount >= 4) {
              this.leapCooldown = 4000 // 4s cooldown
              avgAngle /= nearCount
              const leapDist = 120
              // Ghost at old position
              const ghost = this.scene.add.circle(this.x, this.y, 10, 0x44cc44, 0.4).setDepth(5)
              this.scene.tweens.add({ targets: ghost, alpha: 0, scale: 3, duration: 300, onComplete: () => ghost.destroy() })
              this.x += Math.cos(avgAngle) * leapDist
              this.y += Math.sin(avgAngle) * leapDist
              // Landing dust
              const dust = this.scene.add.circle(this.x, this.y, 8, 0x888888, 0.3).setDepth(3)
              this.scene.tweens.add({ targets: dust, scale: 3, alpha: 0, duration: 300, onComplete: () => dust.destroy() })
            }
          }
        }
      }

      // Headhunter: execute enemies below 15% HP in range
      if (this.hasHeadhunter) {
        const execR = 100 + this.range * 0.3
        const scn = this.scene as any
        if (scn.enemies) {
          for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if ((e as any).hp > 0 && (e as any).maxHp && (e as any).hp < (e as any).maxHp * 0.15) {
              if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= execR) {
                (e as any).takeDamage((e as any).hp + 1, 'melee')
                // VFX: red slash mark
                const xMark = this.scene.add.text(e.x, e.y - 10, '✕', {
                  fontFamily: 'monospace', fontSize: '18px', color: '#ff2222',
                  stroke: '#000', strokeThickness: 2,
                }).setOrigin(0.5).setDepth(21)
                this.scene.tweens.add({ targets: xMark, y: xMark.y - 20, alpha: 0, scale: 2, duration: 400, onComplete: () => xMark.destroy() })
              }
            }
          }
        }
      }

      // Spear Wall: orbiting spears that damage nearby enemies
      if (this.hasSpearWall) {
        this.spearWallAngle += 2.5 * (delta / 1000) // ~2.5 rad/s rotation
        if (!this.spearWallGfx) this.spearWallGfx = this.scene.add.graphics().setDepth(9)
        this.spearWallGfx.clear()
        const orbitR = 55
        const spearCount = 3
        const scn = this.scene as any
        for (let i = 0; i < spearCount; i++) {
          const a = this.spearWallAngle + (i * Math.PI * 2 / spearCount)
          const sx = this.x + Math.cos(a) * orbitR
          const sy = this.y + Math.sin(a) * orbitR
          // Draw spear
          this.spearWallGfx.lineStyle(3, 0x2ecc71, 0.7)
          this.spearWallGfx.beginPath()
          this.spearWallGfx.moveTo(sx - Math.cos(a) * 8, sy - Math.sin(a) * 8)
          this.spearWallGfx.lineTo(sx + Math.cos(a) * 8, sy + Math.sin(a) * 8)
          this.spearWallGfx.strokePath()
          // Tip
          this.spearWallGfx.fillStyle(0xeeeeee, 0.8)
          this.spearWallGfx.fillCircle(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10, 2)
          // Damage enemies
          if (scn.enemies) {
            for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active) continue
              if (Phaser.Math.Distance.Between(sx, sy, e.x, e.y) <= 18) {
                (e as any).takeDamage(this.damage * 0.2 * (delta / 1000), 'melee')
              }
            }
          }
        }
      } else if (this.spearWallGfx) {
        this.spearWallGfx.clear()
      }

      // Mark timer decay on enemies
      const scn2 = this.scene as any
      if (this.hasMarkedTarget && scn2.enemies) {
        for (const e of scn2.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || !(e as any).isMarked) continue
          ;(e as any).markTimer -= delta
          if ((e as any).markTimer <= 0) {
            (e as any).isMarked = false
          }
        }
      }
    }

    // Shield timer decay
    if (this.shieldTimer > 0) {
      this.shieldTimer -= delta
      if (this.shieldTimer <= 0) { this.shieldHp = 0; this.shieldTimer = 0 }
    }

    // Speed buff expiry
    if (this.speedBuffUntil > 0 && this.scene.time.now > this.speedBuffUntil) {
      this.speedBuffUntil = 0
      // Restore base speed (approximate — just reduce by the 30% buff)
      this.speed = Math.ceil(this.speed / 1.3)
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

    // Amun defense aura visual (Bastion)
    if (this.heroType === 'amun' && this.defenseAuraActive) {
      if (!this.defenseAuraGfx) {
        this.defenseAuraGfx = this.scene.add.graphics().setDepth(4)
      }
      this.defenseAuraGfx.clear()
      const auraRadius = 45 + this.armor * 40  // grows with armor
      const pulse = 0.15 + Math.sin(this.scene.time.now / 600) * 0.05
      // Outer glow ring
      this.defenseAuraGfx.lineStyle(3, 0x4488ff, pulse + 0.1)
      this.defenseAuraGfx.strokeCircle(this.x, this.y, auraRadius)
      // Inner fill
      this.defenseAuraGfx.fillStyle(0x2266cc, pulse * 0.5)
      this.defenseAuraGfx.fillCircle(this.x, this.y, auraRadius)
      // Bright inner ring
      this.defenseAuraGfx.lineStyle(1, 0x88bbff, pulse + 0.15)
      this.defenseAuraGfx.strokeCircle(this.x, this.y, auraRadius * 0.6)
    }

    // Amun passive aura (3 dmg/s in 60px — requires Aura of Might skill)
    if (this.heroType === 'amun' && this.hasPassiveAura) {
      const hpScale = this.hasLivingFortress ? (0.5 + (this.hp / this.maxHp) * 1.5) : 1
      const auraDps = 3 * hpScale
      const auraR = 60
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= auraR) {
            (e as any).takeDamage(auraDps * (delta / 1000), 'shockwave')
          }
        }
      }

      // Persistent passive aura visual — golden ring centered on player
      if (!this.passiveAuraGfx) {
        this.passiveAuraGfx = this.scene.add.graphics().setDepth(3)
      }
      this.passiveAuraGfx.clear()
      const t = this.scene.time.now
      const pulse = 0.10 + Math.sin(t / 500) * 0.04
      const breathe = auraR + Math.sin(t / 800) * 3
      // Outer ring
      this.passiveAuraGfx.lineStyle(2, 0xfff200, pulse + 0.12)
      this.passiveAuraGfx.strokeCircle(this.cx, this.cy, breathe)
      // Inner fill
      this.passiveAuraGfx.fillStyle(0xffcc00, pulse * 0.3)
      this.passiveAuraGfx.fillCircle(this.cx, this.cy, breathe)
      // Rotating accent segments (4 small arcs)
      const rot = (t / 1200) % (Math.PI * 2)
      this.passiveAuraGfx.lineStyle(1.5, 0xffe066, pulse + 0.08)
      for (let i = 0; i < 4; i++) {
        const a = rot + i * Math.PI / 2
        this.passiveAuraGfx.beginPath()
        this.passiveAuraGfx.arc(this.cx, this.cy, breathe - 4, a, a + 0.4)
        this.passiveAuraGfx.strokePath()
      }
    }

    // Amun Low HP Regen: ×3 regen when below 40% HP
    if (this.hasLowHpRegen && this.hp < this.maxHp * 0.4 && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * 2 * (delta / 1000))
      // VFX: periodic green healing sparkle
      if (Math.random() < delta / 300) {
        const angle = Math.random() * Math.PI * 2
        const dist = Phaser.Math.Between(5, 15)
        const spark = this.scene.add.circle(
          this.x + Math.cos(angle) * dist,
          this.y + Math.sin(angle) * dist,
          2, 0x44ff66, 0.7
        ).setDepth(10)
        this.scene.tweens.add({
          targets: spark, y: spark.y - 18, alpha: 0, scale: 0.3,
          duration: 500, onComplete: () => spark.destroy(),
        })
      }
    }

    // Amun Gravity Well: pull enemies toward player every 2s
    if (this.hasGravityWell) {
      this.gravityWellTimer += delta
      if (this.gravityWellTimer >= 2000) {
        this.gravityWellTimer = 0
        const pullRadius = 120 + this.range
        const scene2 = this.scene as any
        if (scene2.enemies) {
          for (const e of scene2.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y)
            if (dist <= pullRadius && dist > 20) {
              const angle = Phaser.Math.Angle.Between(e.x, e.y, this.x, this.y);
              (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150)
            }
          }
        }
        // VFX: inward pulse
        const pullRing = this.scene.add.circle(this.x, this.y, pullRadius, 0x9966ff, 0.2).setDepth(4)
        this.scene.tweens.add({ targets: pullRing, scale: 0.1, alpha: 0, duration: 400, onComplete: () => pullRing.destroy() })
      }
    }

    // Amun Divine Judgment: execute enemies below 15% HP in range
    if (this.hasDivineJudgment) {
      const execRadius = 80 + this.range
      const scene3 = this.scene as any
      if (scene3.enemies) {
        for (const e of scene3.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if ((e as any).hp > 0 && (e as any).maxHp && (e as any).hp < (e as any).maxHp * 0.15) {
            if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= execRadius) {
              (e as any).takeDamage((e as any).hp + 1, 'shockwave')
              // VFX: golden beam
              const beam = this.scene.add.rectangle(
                (this.x + e.x) / 2, (this.y + e.y) / 2,
                Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y), 3,
                0xfff200, 0.7
              ).setDepth(10).setRotation(Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y))
              this.scene.tweens.add({ targets: beam, alpha: 0, scaleY: 3, duration: 200, onComplete: () => beam.destroy() })
            }
          }
        }
      }
    }

    // Sifra Blizzard Aura — slow nearby enemies passively
    if (this.heroType === 'sifra' && this.hasBlizzardAura && this.stance === 'ice') {
      const auraRadius = 60 + this.splashRadius * 0.3
      // Visual
      if (!this.blizzardAuraGfx) {
        this.blizzardAuraGfx = this.scene.add.graphics().setDepth(4)
      }
      this.blizzardAuraGfx.clear()
      const pulse = 0.12 + Math.sin(this.scene.time.now / 500) * 0.04
      this.blizzardAuraGfx.fillStyle(0x55aaff, pulse)
      this.blizzardAuraGfx.fillCircle(this.x, this.y, auraRadius)
      this.blizzardAuraGfx.lineStyle(1, 0x88ddff, pulse + 0.1)
      this.blizzardAuraGfx.strokeCircle(this.x, this.y, auraRadius)

      // Slow enemies in range
      const sifraScene = this.scene as any
      if (sifraScene.enemies) {
        for (const e of sifraScene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= auraRadius) {
            if ((e as any).speed && (e as any).baseSpeed) {
              const blizSlow = this.hasDeepFreeze ? 0.3 : 0.6
              ;(e as any).speed = Math.min((e as any).speed, (e as any).baseSpeed * blizSlow)
            }
          }
        }
      }
    } else if (this.blizzardAuraGfx) {
      this.blizzardAuraGfx.clear()
    }

    // Sifra Eternal Winter — permanent damaging frost field
    if (this.heroType === 'sifra' && this.hasEternalWinter && this.stance === 'ice') {
      const frostR = 55 + this.splashRadius * 0.3
      const scene = this.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= frostR) {
            (e as any).takeDamage(this.damage * 0.2 * (delta / 1000), 'ice')
            if ((e as any).speed && (e as any).baseSpeed) (e as any).speed = (e as any).baseSpeed * 0.4
          }
        }
      }
      // VFX: frost particles on ground
      if (Math.random() < delta / 200) {
        const a = Math.random() * Math.PI * 2
        const d = Math.random() * frostR
        const flake = this.scene.add.circle(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, 2, 0xaaddff, 0.5).setDepth(3)
        this.scene.tweens.add({ targets: flake, alpha: 0, y: flake.y - 8, duration: 600, onComplete: () => flake.destroy() })
      }
    }

    // Sifra Ball Lightning — orbiting electric ball
    if (this.heroType === 'sifra' && this.hasBallLightning && this.stance === 'lightning') {
      if (!this.ballLightningGfx) this.ballLightningGfx = this.scene.add.graphics().setDepth(9)
      this.ballLightningGfx.clear()
      const orbitR = 45
      const orbitAngle = (this.scene.time.now / 600) % (Math.PI * 2)
      const bx = this.x + Math.cos(orbitAngle) * orbitR
      const by = this.y + Math.sin(orbitAngle) * orbitR
      // Ball glow
      this.ballLightningGfx.fillStyle(0x9966ff, 0.6)
      this.ballLightningGfx.fillCircle(bx, by, 8)
      this.ballLightningGfx.fillStyle(0xccbbff, 0.8)
      this.ballLightningGfx.fillCircle(bx, by, 4)
      this.ballLightningGfx.lineStyle(1, 0xbb99ff, 0.4)
      this.ballLightningGfx.strokeCircle(bx, by, 12)
      // Zap nearby enemies
      const scene2 = this.scene as any
      if (scene2.enemies) {
        for (const e of scene2.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(bx, by, e.x, e.y) <= 40) {
            (e as any).takeDamage(this.damage * 0.3 * (delta / 1000), 'lightning')
            // Mini bolt
            if (Math.random() < 0.1) {
              const mg = this.scene.add.graphics().setDepth(10)
              mg.lineStyle(1, 0xccddff, 0.6)
              mg.beginPath(); mg.moveTo(bx, by); mg.lineTo(e.x, e.y); mg.strokePath()
              this.scene.tweens.add({ targets: mg, alpha: 0, duration: 80, onComplete: () => mg.destroy() })
            }
          }
        }
      }
    } else if (this.ballLightningGfx) {
      this.ballLightningGfx.clear()
    }

    // Sifra Storm Lord — random lightning strikes every 2s
    if (this.heroType === 'sifra' && this.hasStormLord && this.stance === 'lightning') {
      this.stormLordTimer += delta
      if (this.stormLordTimer >= 2000) {
        this.stormLordTimer = 0
        const scene3 = this.scene as any
        if (scene3.enemies) {
          const alive = (scene3.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]).filter((e: any) => e.active)
          if (alive.length > 0) {
            const target = alive[Math.floor(Math.random() * alive.length)]
            ;(target as any).takeDamage(this.damage * 2, 'lightning')
            // Lightning strike VFX
            const strikeG = this.scene.add.graphics().setDepth(11)
            strikeG.lineStyle(3, 0xeeddff, 0.9)
            let sx = target.x + (Math.random() - 0.5) * 10
            let sy = target.y - 200
            strikeG.beginPath(); strikeG.moveTo(sx, sy)
            for (let s = 0; s < 5; s++) {
              sx += (Math.random() - 0.5) * 20
              sy += 40
              strikeG.lineTo(sx, sy)
            }
            strikeG.lineTo(target.x, target.y); strikeG.strokePath()
            // Impact flash
            const imp = this.scene.add.circle(target.x, target.y, 10, 0xffffff, 0.8).setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
            this.scene.tweens.add({ targets: imp, scale: 3, alpha: 0, duration: 200, onComplete: () => imp.destroy() })
            this.scene.tweens.add({ targets: strikeG, alpha: 0, duration: 250, onComplete: () => strikeG.destroy() })
          }
        }
      }
    }

    // Sifra Ice Armor — absorb shield
    if (this.heroType === 'sifra' && this.hasIceArmor) {
      this.iceArmorRegenDelay -= delta
      if (this.iceArmorRegenDelay <= 0 && this.iceArmorHP < this.iceArmorMax) {
        this.iceArmorHP = Math.min(this.iceArmorMax, this.iceArmorHP + this.iceArmorMax * 0.1 * (delta / 1000))
      }
    }

    // Amun pulsing damage aura (Sovereign — Consecration)
    if (this.heroType === 'amun' && this.dmgAuraActive) {
      const dmgR = 70 + this.splashRadius * 0.8
      // Persistent orange ring visual
      if (!this.dmgAuraGfx) {
        this.dmgAuraGfx = this.scene.add.graphics().setDepth(3)
      }
      this.dmgAuraGfx.clear()
      const dt = this.scene.time.now
      const dPulse = 0.12 + Math.sin(dt / 400) * 0.06
      const dBreathe = dmgR + Math.sin(dt / 600) * 4
      this.dmgAuraGfx.lineStyle(2, 0xff8800, dPulse + 0.1)
      this.dmgAuraGfx.strokeCircle(this.cx, this.cy, dBreathe)
      this.dmgAuraGfx.fillStyle(0xff6600, dPulse * 0.2)
      this.dmgAuraGfx.fillCircle(this.cx, this.cy, dBreathe)
      // Flame-like segments rotating
      const dRot = (dt / 900) % (Math.PI * 2)
      this.dmgAuraGfx.lineStyle(2, 0xffaa33, dPulse + 0.15)
      for (let i = 0; i < 6; i++) {
        const a = dRot + i * Math.PI / 3
        this.dmgAuraGfx.beginPath()
        this.dmgAuraGfx.arc(this.cx, this.cy, dBreathe - 5, a, a + 0.3)
        this.dmgAuraGfx.strokePath()
      }

      this.dmgAuraLastPulse += delta
      if (this.dmgAuraLastPulse >= this.dmgAuraCooldown) {
        this.dmgAuraLastPulse = 0
        const pulseRadius = 70 + this.splashRadius * 0.8
        const pulseDmg = this.damage * 0.4

        // Visual: expanding ring
        const ring = this.scene.add.graphics().setDepth(4)
        let currentR = 10
        const expandSpeed = pulseRadius / 400  // pixels per ms
        const pulseEvent = this.scene.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            currentR += expandSpeed * 16
            ring.clear()
            const alpha = 1 - (currentR / pulseRadius)
            if (alpha <= 0 || currentR >= pulseRadius) {
              ring.destroy()
              pulseEvent.destroy()
              return
            }
            ring.lineStyle(3, 0xffaa33, alpha * 0.7)
            ring.strokeCircle(this.x, this.y, currentR)
            ring.fillStyle(0xff8800, alpha * 0.15)
            ring.fillCircle(this.x, this.y, currentR)
          },
        })

        // Damage enemies in range
        const scene = this.scene as any
        if (scene.enemies) {
          for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= pulseRadius) {
              (e as any).takeDamage(pulseDmg, 'shockwave')
            }
          }
        }
      }
    }

    const pBody = this.body as Phaser.Physics.Arcade.Body

    // Keyboard movement (WASD / arrows) — takes priority
    let kbX = 0, kbY = 0
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) kbX = -1
      if (this.cursors.right.isDown || this.wasd.D.isDown) kbX = 1
      if (this.cursors.up.isDown || this.wasd.W.isDown) kbY = -1
      if (this.cursors.down.isDown || this.wasd.S.isDown) kbY = 1
    }

    let moving = false
    if ((kbX !== 0 || kbY !== 0) && !this.isAttacking) {
      // Keyboard movement — normalize diagonal
      const len = Math.sqrt(kbX * kbX + kbY * kbY)
      pBody.setVelocity((kbX / len) * this.speed, (kbY / len) * this.speed)
      this.setFlipX(kbX < 0)
      this.touchTarget = null
      this.joystickDir = null
      moving = true
    } else if (this.joystickDir && !this.isAttacking) {
      // Virtual joystick movement
      const { dx, dy } = this.joystickDir
      pBody.setVelocity(dx * this.speed, dy * this.speed)
      this.setFlipX(dx < 0)
      moving = true
    } else if (this.touchTarget && !this.isAttacking) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.touchTarget.x, this.touchTarget.y)
      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.touchTarget.x, this.touchTarget.y)
        pBody.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)
        this.setFlipX(this.touchTarget.x < this.x)
        moving = true
      } else {
        pBody.setVelocity(0, 0)
        this.touchTarget = null
      }
    } else if (!this.isAttacking) {
      pBody.setVelocity(0, 0)
    }

    // Lava Trail — drop fire pools while moving
    if (this.hasLavaTrail && moving) {
      this.lavaTrailTimer += delta
      if (this.lavaTrailTimer >= 300) {
        this.lavaTrailTimer = 0
        const lx = this.x, ly = this.y
        const lava = this.scene.add.circle(lx, ly, 8, 0xff4400, 0.5).setDepth(3)
        // Damage enemies that walk over it
        let lavaTicks = 0
        const lavaTimer = this.scene.time.addEvent({
          delay: 300, repeat: 6,
          callback: () => {
            lavaTicks++
            const scene = this.scene as any
            if (scene.enemies) {
              for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e.active) continue
                if (Phaser.Math.Distance.Between(lx, ly, e.x, e.y) <= 12) {
                  (e as any).takeDamage(this.damage * 0.2, 'fire')
                }
              }
            }
            if (lavaTicks >= 6) { lava.destroy(); lavaTimer.destroy() }
          },
        })
        this.scene.tweens.add({ targets: lava, alpha: 0, scale: 0.3, duration: 2100, delay: 0 })
      }
    }

    // Phantom Trail — damage trail while moving
    if (this.hasPhantomTrail && moving) {
      this.phantomTrailTimer += delta
      if (this.phantomTrailTimer >= 250) {
        this.phantomTrailTimer = 0
        const tx = this.x, ty = this.y
        const trail = this.scene.add.circle(tx, ty, 6, 0x9955dd, 0.4).setDepth(3)
        let ticks = 0
        const trailTimer = this.scene.time.addEvent({
          delay: 300, repeat: 4, callback: () => {
            ticks++
            const scene = this.scene as any
            if (scene.enemies) {
              for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e.active) continue
                if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= 15) (e as any).takeDamage(this.damage * 0.15, 'melee')
              }
            }
            if (ticks >= 4) { trail.destroy(); trailTimer.destroy() }
          }
        })
        this.scene.tweens.add({ targets: trail, alpha: 0, scale: 0.3, duration: 1500 })
      }
    }

    // Animation state (spritesheet heroes only)
    if (this.hasSprite && !this.isAttacking) {
      this.playAnim(moving ? 'run' : 'idle')
    }
  }

  // HUNTRESS MELEE — quick stab around player
  private attackHuntressMelee(enemies: Phaser.Physics.Arcade.Group) {
    const hitRadius = 80
    const dmgRatio = Math.min(this.damage / 18, 4)
    const slashTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0x7bed9f : 0x2ecc71

    // Stab VFX — short line in facing direction
    const stabAngle = this.flipX ? Math.PI : 0
    const stabX = this.cx + Math.cos(stabAngle) * 25
    const stabY = this.cy + Math.sin(stabAngle) * 25
    const stab = this.scene.add.rectangle(stabX, stabY, 20, 3, slashTint).setDepth(10).setRotation(stabAngle)
    this.scene.tweens.add({
      targets: stab, alpha: 0, scaleX: 2, duration: 150,
      onComplete: () => stab.destroy(),
    })

    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(this.cx, this.cy, e.x, e.y) <= hitRadius) {
        let dmg = this.damage
        // Critical Strike: 20% chance for 2x damage
        const isCrit = this.hasCriticalStrike && Math.random() < 0.2
        if (isCrit) dmg *= 2
        // Marked Target: +30% damage to marked enemies
        if (this.hasMarkedTarget && (e as any).isMarked) dmg *= 1.3
        ;(e as any).takeDamage(dmg, 'melee')
        // Mark enemy on hit
        if (this.hasMarkedTarget) {
          (e as any).isMarked = true
          ;(e as any).markTimer = 5000
        }
        this.spearHitVfx(e.x, e.y, isCrit ? 0xff4444 : slashTint)
        // Crit text
        if (isCrit) {
          const ct = this.scene.add.text(e.x, e.y - 30, 'CRIT!', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
            stroke: '#000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(21)
          this.scene.tweens.add({ targets: ct, y: ct.y - 20, alpha: 0, duration: 500, onComplete: () => ct.destroy() })
        }
      }
    }

    // Earth Slam: melee creates shockwave line in facing direction
    if (this.hasEarthSlam) {
      const slamAngle = this.flipX ? Math.PI : 0
      const slamLen = 150
      const slamW = 20
      const hitEnemies = new Set<Phaser.Physics.Arcade.Sprite>()
      // VFX: expanding ground crack
      for (let i = 0; i < 5; i++) {
        const dist = (i + 1) * (slamLen / 5)
        const sx = this.cx + Math.cos(slamAngle) * dist
        const sy = this.cy + Math.sin(slamAngle) * dist
        this.scene.time.delayedCall(i * 40, () => {
          if (!this.scene) return
          const crack = this.scene.add.rectangle(sx, sy, 16, 6, 0x8b7355, 0.7).setDepth(3).setRotation(slamAngle)
          this.scene.tweens.add({ targets: crack, scaleX: 2, alpha: 0, duration: 400, onComplete: () => crack.destroy() })
          // Damage enemies along the line
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || hitEnemies.has(e)) continue
            if (Phaser.Math.Distance.Between(sx, sy, e.x, e.y) <= slamW) {
              (e as any).takeDamage(this.damage * 0.6, 'shockwave')
              hitEnemies.add(e)
            }
          }
        })
      }
      this.scene.cameras.main.shake(60, 0.003)
    }

    // Hold isAttacking for anim duration
    this.scene.time.delayedCall(350, () => { this.isAttacking = false })
  }

  // HUNTRESS RANGED — spear flies across visible zone with pierce limit
  private attackSpear(target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
    const angle = Phaser.Math.Angle.Between(this.cx, this.cy, target.x, target.y)
    const cam = this.scene.cameras.main
    const maxDist = Math.sqrt(cam.width * cam.width + cam.height * cam.height)
    const spearSpeed = 350
    const flyTime = (maxDist / spearSpeed) * 1000
    const hitRadius = 22 + this.splashRadius * 0.4
    const dmgRatio = Math.min(this.damage / 18, 4)
    const spearLen = 28 + dmgRatio * 4
    const spearW = 3
    const spearTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0x7bed9f : 0x2ecc71

    // Volley counter: every 5th throw fires 3 spears
    this.volleyCounter++
    const isVolley = this.hasVolley && this.volleyCounter % 5 === 0

    // Net counter: every 8th throw roots enemies
    this.netCounter++
    const isNetThrow = this.hasNetThrow && this.netCounter % 8 === 0

    const launchSpear = (sa: number, isExtra = false) => {
      const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()
      let spearDead = false
      const eX = this.cx + Math.cos(sa) * maxDist
      const eY = this.cy + Math.sin(sa) * maxDist

      const spear = this.scene.add.rectangle(this.cx, this.cy, spearLen, spearW, spearTint).setDepth(9)
      spear.rotation = sa
      const tip = this.scene.add.triangle(this.cx, this.cy, 0, -3, 8, 0, 0, 3, 0xeeeeee).setDepth(10)
      tip.rotation = sa

      const trailTimer = this.scene.time.addEvent({
        delay: 30, loop: true,
        callback: () => {
          if (!spear.scene || spearDead) return
          const tp = this.scene.add.rectangle(
            spear.x + Phaser.Math.Between(-2, 2),
            spear.y + Phaser.Math.Between(-2, 2),
            8, 1.5, isNetThrow ? 0x44cc44 : spearTint, 0.4
          ).setDepth(8).setRotation(sa)
          this.scene.tweens.add({
            targets: tp, alpha: 0, scale: 0, duration: 200,
            onComplete: () => tp.destroy(),
          })
        },
      })

      const killSpear = () => {
        spearDead = true
        trailTimer.destroy()
        if (spear.scene) spear.destroy()
        if (tip.scene) tip.destroy()
      }

      this.scene.tweens.add({
        targets: [spear, tip], x: eX, y: eY, duration: flyTime,
        onUpdate: () => {
          if (spearDead) return
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || hitSet.has(e)) continue
            if (Phaser.Math.Distance.Between(spear.x, spear.y, e.x, e.y) <= hitRadius) {
              let dmg = isExtra ? this.damage * 0.6 : this.damage
              // Critical Strike
              const isCrit = this.hasCriticalStrike && Math.random() < 0.2
              if (isCrit) dmg *= 2
              // Marked Target bonus
              if (this.hasMarkedTarget && (e as any).isMarked) dmg *= 1.3
              ;(e as any).takeDamage(dmg, 'melee')
              hitSet.add(e)
              // Mark enemy
              if (this.hasMarkedTarget) {
                (e as any).isMarked = true
                ;(e as any).markTimer = 5000
              }
              // Net Throw: root enemies
              if (isNetThrow) {
                (e as any).isRooted = true
                ;(e as any).rootTimer = 1500
                // Net VFX
                const net = this.scene.add.circle(e.x, e.y, 14, 0x44cc44, 0.3).setDepth(9)
                this.scene.tweens.add({ targets: net, alpha: 0, scale: 2, duration: 1500, onComplete: () => net.destroy() })
              }
              this.spearHitVfx(e.x, e.y, isCrit ? 0xff4444 : spearTint)
              if (isCrit) {
                const ct = this.scene.add.text(e.x, e.y - 30, 'CRIT!', {
                  fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
                  stroke: '#000', strokeThickness: 2,
                }).setOrigin(0.5).setDepth(21)
                this.scene.tweens.add({ targets: ct, y: ct.y - 20, alpha: 0, duration: 500, onComplete: () => ct.destroy() })
              }
              // Explosive Tips: small AOE on every hit
              if (this.hasExplosiveTips) {
                const blastR = 40 + this.splashRadius * 0.4
                const blast = this.scene.add.circle(e.x, e.y, 8, 0xff6600, 0.5).setDepth(10)
                this.scene.tweens.add({ targets: blast, scale: blastR / 8, alpha: 0, duration: 250, onComplete: () => blast.destroy() })
                for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                  if (!e2.active || hitSet.has(e2)) continue
                  if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= blastR) {
                    (e2 as any).takeDamage(this.damage * 0.35, 'shockwave')
                    hitSet.add(e2)
                  }
                }
              }
            }
          }
        },
        onComplete: () => {
          // Splinter Shot: if spear reached end, spawn splinter shards
          if (this.hasSplinterShot && !spearDead && hitSet.size === 0) {
            const sx = spear.x, sy = spear.y
            for (let i = 0; i < 3; i++) {
              const shardAngle = sa + (i - 1) * 0.5
              const shard = this.scene.add.rectangle(sx, sy, 10, 2, 0x7bed9f, 0.8).setDepth(8).setRotation(shardAngle)
              const sdx = sx + Math.cos(shardAngle) * 80
              const sdy = sy + Math.sin(shardAngle) * 80
              this.scene.tweens.add({
                targets: shard, x: sdx, y: sdy, alpha: 0, duration: 300,
                onUpdate: () => {
                  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                    if (!e.active) continue
                    if (Phaser.Math.Distance.Between(shard.x, shard.y, e.x, e.y) <= 18) {
                      (e as any).takeDamage(this.damage * 0.3, 'melee')
                    }
                  }
                },
                onComplete: () => shard.destroy(),
              })
            }
          }
          killSpear()
        },
      })
    }

    // Main spear
    launchSpear(angle)

    // Extra spears from Multistrike
    for (let s = 1; s < this.strikeCount; s++) {
      const angleOff = (s - (this.strikeCount - 1) / 2) * 0.12
      launchSpear(angle + angleOff)
    }

    // Volley: fire 2 extra spears at slight angles
    if (isVolley) {
      launchSpear(angle - 0.25, true)
      launchSpear(angle + 0.25, true)
      // VFX: volley flash
      const flash = this.scene.add.circle(this.cx, this.cy, 15, 0xff4444, 0.4).setDepth(10)
      this.scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 200, onComplete: () => flash.destroy() })
    }

    // Hold isAttacking for ranged anim duration
    this.scene.time.delayedCall(580, () => { this.isAttacking = false })
  }

  /** Small impact burst when spear hits an enemy */
  private spearHitVfx(x: number, y: number, tint: number) {
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
