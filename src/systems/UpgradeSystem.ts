import { Player, type HeroType } from '../entities/Player'

export interface Upgrade {
  id: string
  label: string
  desc: string
  icon: string        // key into spritesheet frame
  branch?: string     // branch name (for personal upgrades)
  branchColor?: number // hex color for card tint
  _branchDef?: BranchDef  // only present on branch-selection cards
  apply: (p: Player) => void
}

// ============================================================
// GENERIC POOL (G1–G10) — available to all heroes
// ============================================================
export const GENERIC_POOL: Upgrade[] = [
  { id: 'g1', label: 'Sharp Edge',         desc: '+20% dmg to all attacks',            icon: 'g1_sharp_edge',   apply: p => { p.damage = Math.ceil(p.damage * 1.2) } },
  { id: 'g2', label: 'Swift Feet',         desc: '+15% move speed permanently',        icon: 'g2_swift_feet',   apply: p => { p.speed = Math.ceil(p.speed * 1.15) } },
  { id: 'g3', label: 'Eagle Eye',          desc: '+20% attack range permanently',      icon: 'g3_eagle_eye',    apply: p => { p.range = Math.ceil(p.range * 1.2) } },
  { id: 'g4', label: 'Quick Hands',        desc: '-20% attack cooldown (min 200ms)',   icon: 'g4_quick_hands',  apply: p => { p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.8)) } },
  { id: 'g5', label: 'Vitality',           desc: '+25% max HP, heal for the bonus',    icon: 'g5_vitality',     apply: p => { const bonus = Math.ceil(p.maxHp * 0.25); p.maxHp += bonus; p.hp += bonus } },
  { id: 'g6', label: 'Regeneration',       desc: '+2 HP/s passive regen',              icon: 'g6_regeneration', apply: p => { p.hpRegen += 2 } },
  { id: 'g7', label: 'Cleave',             desc: 'AoE: attacks splash in 60px radius', icon: 'g7_cleave',       apply: p => { p.splashRadius = Math.max(p.splashRadius, 60) } },
  { id: 'g8', label: 'Wisdom',             desc: '+25% XP from all sources',           icon: 'g8_wisdom',       apply: p => { p.xpMult += 0.25 } },
  { id: 'g9', label: 'Multistrike',        desc: '+1 strike: attack hits one more time', icon: 'g9_multistrike', apply: p => { p.strikeCount += 1 } },
  { id: 'g10', label: 'Iron Skin',         desc: '+25% armor (reduces dmg taken)',     icon: 'g10_iron_skin',   apply: p => { p.armor = Math.min(0.7, p.armor + 0.25) } },
]

// ============================================================
// PERSONAL UPGRADES — per hero, 3 branches × 5 skills
// ============================================================
export interface BranchDef {
  name: string
  color: number
  upgrades: Upgrade[]
}

const IGNARA_BRANCHES: BranchDef[] = [
  {
    name: 'Inferno', color: 0xff6600,
    upgrades: [
      { id: 'if1', label: 'Wide Burn',       desc: 'Explosion radius +20px',                       icon: 'if1_wide_burn',       apply: p => { p.splashRadius += 20 } },
      { id: 'if2', label: 'Inferno Reach',   desc: 'Fireball range +30px',                          icon: 'if2_inferno_reach',   apply: p => { p.range += 30 } },
      { id: 'if3', label: 'White Fire',      desc: '+30% fireball dmg',                             icon: 'if3_white_fire',      apply: p => { p.damage = Math.ceil(p.damage * 1.3) } },
      { id: 'if4', label: 'Scorched Earth',  desc: 'Hit: burn DOT 15% dmg ×6 ticks/3s, +15% dmg',   icon: 'if4_scorched_earth',  apply: p => { p.hasScorchedEarth = true; p.damage = Math.ceil(p.damage * 1.15) } },
      { id: 'if5', label: 'Firestorm',       desc: '2 mini-fireballs: 50% dmg in 35px AoE, +15% dmg', icon: 'if5_firestorm', apply: p => { p.hasFirestorm = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
  {
    name: 'Fortress', color: 0xff4444,
    upgrades: [
      { id: 'io1', label: 'Heat Shield',     desc: '+15% armor (dmg reduction)',                    icon: 'io1_heat_shield',     apply: p => { p.armor = Math.min(0.7, p.armor + 0.15) } },
      { id: 'io2', label: 'Pyromaniac',       desc: 'On kill: +5 HP, +1 HP/s regen',                icon: 'io2_pyromaniac',      apply: p => { p.hasPyromaniac = true; p.hpRegen += 1 } },
      { id: 'io3', label: 'Molten Skin',      desc: 'When hit: AoE 30% dmg in 50px, +10% armor',   icon: 'io3_molten_skin',     apply: p => { p.hasMoltenSkin = true; p.armor = Math.min(0.7, p.armor + 0.1) } },
      { id: 'io4', label: 'Ember Veil',       desc: '+10% armor (dmg reduction)',                    icon: 'io4_ember_veil',      apply: p => { p.armor = Math.min(0.7, p.armor + 0.1) } },
      { id: 'io5', label: 'Phoenix Heart',    desc: 'Revive once at 50% HP, +30 max HP',            icon: 'io5_phoenix_heart',   apply: p => { p.hasPhoenixHeart = true; p.maxHp += 30; p.hp += 30 } },
    ],
  },
  {
    name: 'Havoc', color: 0xffaa00,
    upgrades: [
      { id: 'ih1', label: 'Backdraft',       desc: 'Fireball knockback 120→300px, +10% dmg',        icon: 'ih1_backdraft', apply: p => { p.hasBackdraft = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'ih2', label: 'Eruption',         desc: 'Explosion radius +40px',                        icon: 'ih2_eruption',        apply: p => { p.splashRadius += 40 } },
      { id: 'ih3', label: 'Lava Trail',       desc: 'Moving: drop 12px fire pools, 20% dmg/tick, +10 speed', icon: 'ih3_lava_trail', apply: p => { p.hasLavaTrail = true; p.speed += 10 } },
      { id: 'ih4', label: 'Wildfire',         desc: 'On kill: chain explosion 50px, 40% dmg, +5 dmg', icon: 'ih4_wildfire',      apply: p => { p.hasWildfire = true; p.damage += 5 } },
      { id: 'ih5', label: 'Meltdown',         desc: 'Below 40% HP: ×1.5 dmg; also base +15% dmg',   icon: 'ih5_meltdown',        apply: p => { p.hasMeltdown = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
]

const NAZAR_BRANCHES: BranchDef[] = [
  {
    name: 'Way of the Blade', color: 0xccccdd,
    upgrades: [
      { id: 'nb1', label: 'Shadow Step',     desc: 'Blink 30px toward enemy before melee, +10 range', icon: 'nb1_shadow_step', apply: p => { p.hasShadowStep = true; p.range += 10 } },
      { id: 'nb2', label: 'Twin Blades',     desc: '+1 strike per melee attack',              icon: 'nb2_twin_blades',     apply: p => { p.strikeCount += 1 } },
      { id: 'nb3', label: 'Blade Surge',     desc: 'Lunge 1.5× range, hit 70% dmg line, +5 dmg', icon: 'nb3_chain_dash', apply: p => { p.hasChainDash = true; p.damage += 5 } },
      { id: 'nb4', label: 'Hemorrhage',      desc: 'Melee: bleed 15% dmg ×6 ticks over 3s, +10% dmg', icon: 'nb4_hemorrhage', apply: p => { p.hasHemorrhage = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'nb5', label: 'Assassinate',     desc: '2× dmg when only 1 enemy in melee range, +15% dmg', icon: 'nb5_assassinate', apply: p => { p.hasAssassinate = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
  {
    name: 'Way of Venom', color: 0x44cc44,
    upgrades: [
      { id: 'nv1', label: 'Toxic Slash',     desc: 'On hit: DOT puddle 30% dmg/tick, 3s, +3 dmg', icon: 'nv1_toxic_slash',     apply: p => { p.hasToxicSlash = true; p.damage += 3 } },
      { id: 'nv2', label: 'Virulent Strain', desc: 'Puddles: 80% radius, 5s duration, +15 splash', icon: 'nv2_virulent_strain', apply: p => { p.hasVirulentStrain = true; p.splashRadius += 15 } },
      { id: 'nv3', label: 'Pandemic',        desc: 'On kill: spreads mini-cloud 50% radius, 50% dmg, +3 dmg', icon: 'nv3_pandemic', apply: p => { p.hasPandemic = true; p.damage += 3 } },
      { id: 'nv4', label: 'Weakness',        desc: 'Poisoned enemies take +30% dmg, +10% dmg',  icon: 'nv4_weakness',        apply: p => { p.hasWeakness = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'nv5', label: 'Necrosis',        desc: 'Poison dmg ramps +20% per tick, +15% dmg',  icon: 'nv5_necrosis',        apply: p => { p.hasNecrosis = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
  {
    name: 'Way of Shadow', color: 0x9955dd,
    upgrades: [
      { id: 'ns1', label: 'Vanish',          desc: 'After melee: 400ms invuln, +10% armor',         icon: 'ns1_vanish',         apply: p => { p.hasVanish = true; p.armor = Math.min(0.7, p.armor + 0.1) } },
      { id: 'ns2', label: 'Phantom Trail',   desc: 'Moving: shadow trail 15% dmg/tick in 15px, +10 speed', icon: 'ns2_phantom_trail', apply: p => { p.hasPhantomTrail = true; p.speed += 10 } },
      { id: 'ns3', label: 'Smoke Bomb',      desc: 'On melee: slow enemies 60% in 50px, +15 splash', icon: 'ns3_smoke_bomb',     apply: p => { p.hasSmokeBomb = true; p.splashRadius += 15 } },
      { id: 'ns4', label: 'Blood Scent',     desc: 'Execute melee targets below 20% HP, +10% dmg',  icon: 'ns4_blood_scent',    apply: p => { p.hasBloodScent = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'ns5', label: 'Death Mark',      desc: '1st hit marks; 2nd hit deals +40% dmg, +15% dmg', icon: 'ns5_death_mark',   apply: p => { p.hasDeathMark = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
]

// Ice path branches (available if player chose ice on first pick)
const SIFRA_ICE_BRANCHES: BranchDef[] = [
  {
    name: 'Frost', color: 0x55aaff,
    upgrades: [
      { id: 'sf1', label: 'Deep Freeze',     desc: 'Shards slow enemies +30%, +10% dmg', icon: 'sf1_deep_freeze',   apply: p => { p.hasDeepFreeze = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'sf2', label: 'Blizzard Aura',   desc: 'Aura: slow nearby enemies 40% in 60px',          icon: 'sf2_blizzard_aura', apply: p => { p.hasBlizzardAura = true } },
      { id: 'sf3', label: 'Frost Nova',      desc: 'Every 4th shot: 8 shards ring 50% dmg, +3 dmg', icon: 'sf3_frost_nova',    apply: p => { p.hasFrostNova = true; p.damage += 3 } },
      { id: 'sf4', label: 'Absolute Zero',   desc: 'Freeze stun 2s when enemy slowed below 35%, +15% dmg', icon: 'sf4_absolute_zero', apply: p => { p.hasAbsoluteZero = true; p.damage = Math.ceil(p.damage * 1.15) } },
      { id: 'sf5', label: 'Eternal Winter',  desc: 'Frost field: 20% dmg/s + 60% slow in 55px, +15% dmg', icon: 'sf5_eternal_winter', apply: p => { p.hasEternalWinter = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
  {
    name: 'Shatter', color: 0x88ddff,
    upgrades: [
      { id: 'ss1', label: 'Permafrost',      desc: '+40% dmg vs slowed enemies, +10% dmg',         icon: 'ss1_permafrost',      apply: p => { p.hasPermafrost = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'ss2', label: 'Shatter',         desc: 'On hit: +2 mini-shards seek nearby foes',       icon: 'ss2_shatter',         apply: p => { p.shatterPieces += 2 } },
      { id: 'ss3', label: 'Ice Spear',       desc: '+8 dmg, +20px range',                           icon: 'ss3_ice_spear',       apply: p => { p.damage += 8; p.range += 20 } },
      { id: 'ss4', label: 'Frostbite',       desc: '+1 shatter shard, shards seek +20px further',   icon: 'ss4_frostbite',       apply: p => { p.shatterPieces += 1; p.splashRadius += 20 } },
      { id: 'ss5', label: 'Avalanche',       desc: '+3 shatter shards per hit, +20% dmg',           icon: 'ss5_avalanche',       apply: p => { p.shatterPieces += 3; p.damage = Math.ceil(p.damage * 1.2) } },
    ],
  },
  {
    name: 'Crystal', color: 0xaaeeff,
    upgrades: [
      { id: 'sc1', label: 'Wide Shard',       desc: 'Shard AoE radius +20px',                         icon: 'sc1_glacial_pierce',  apply: p => { p.splashRadius += 20 } },
      { id: 'sc2', label: 'Ice Armor',       desc: 'Absorb shield (30+15% maxHP), regens after 3s',  icon: 'sc2_ice_armor',       apply: p => { p.hasIceArmor = true; p.iceArmorMax = 30 + p.maxHp * 0.15; p.iceArmorHP = p.iceArmorMax } },
      { id: 'sc3', label: 'Mirror Ice',      desc: 'Shards pierce +2 extra targets',                  icon: 'sc3_mirror_ice',      apply: p => { p.pierceCount += 2 } },
      { id: 'sc4', label: 'Cryo Shield',     desc: 'When hit: fire 3 shards at 25% dmg in 80px, +5% armor', icon: 'sc4_cryo_shield', apply: p => { p.hasCryoShield = true; p.armor = Math.min(0.7, p.armor + 0.05) } },
      { id: 'sc5', label: 'Diamond Dust',    desc: '+2 shard pierce, +25% dmg',                      icon: 'sc5_diamond_dust',    apply: p => { p.pierceCount += 2; p.damage = Math.ceil(p.damage * 1.25) } },
    ],
  },
]

// Lightning path branch
const SIFRA_LIGHTNING_BRANCH: BranchDef = {
  name: 'Lightning', color: 0x9966ff,
  upgrades: [
    { id: 'sl1', label: 'Spark Initiate',  desc: 'Cone: chain to 1 nearby foe within 80px at 60% dmg, +15% dmg', icon: 'sf1_deep_freeze',   apply: p => { p.hasSparkInitiate = true; p.damage = Math.ceil(p.damage * 1.15) } },
    { id: 'sl2', label: 'Arc Reach',       desc: 'Cone +50% wider, side-arc 40% dmg, +15 range',                  icon: 'sf2_blizzard_aura', apply: p => { p.hasArcReach = true; p.range += 15 } },
    { id: 'sl3', label: 'Overcharge',      desc: '~8% chance per frame: cone deals 3× dmg burst, +15% dmg',       icon: 'sf3_frost_nova',    apply: p => { p.hasOvercharge = true; p.damage = Math.ceil(p.damage * 1.15) } },
    { id: 'sl4', label: 'Ball Lightning',  desc: 'Orbit 45px: zap enemies in 40px for 30% dmg/s, +3 dmg',         icon: 'sf4_absolute_zero', apply: p => { p.hasBallLightning = true; p.damage += 3 } },
    { id: 'sl5', label: 'Storm Lord',      desc: 'Every 2s: random enemy struck for 2× dmg, +20% dmg',            icon: 'sf5_eternal_winter', apply: p => { p.hasStormLord = true; p.damage = Math.ceil(p.damage * 1.2) } },
  ],
}

// Combined: Lightning first, then ice branches (for branch selection logic)
const SIFRA_BRANCHES: BranchDef[] = [
  SIFRA_LIGHTNING_BRANCH,
  ...SIFRA_ICE_BRANCHES,
]

const AMUN_BRANCHES: BranchDef[] = [
  {
    name: 'Wrath', color: 0xff6633,
    upgrades: [
      { id: 'aw1', label: 'Thorns',          desc: 'When hit: reflect 50% dmg to enemies in 60px, +5% armor', icon: 'aq1_titans_pulse',    apply: p => { p.hasThorns = true; p.armor = Math.min(0.7, p.armor + 0.05) } },
      { id: 'aw2', label: 'Wrath',           desc: 'When hit: AoE burst 60% dmg in 70px, +10% dmg',          icon: 'aq2_earthquake',      apply: p => { p.hasWrath = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'aw3', label: 'Consecration',    desc: 'Aura: pulse 40% dmg in 70px every 1.5s, +25 splash, +3 dmg', icon: 'aq3_colossus',     apply: p => { p.splashRadius += 25; p.damage += 3; p.dmgAuraActive = true } },
      { id: 'aw4', label: 'Living Fortress', desc: 'Aura dmg scales 0.5–2× with HP %, +30 max HP',           icon: 'aq4_rally_cry',       apply: p => { p.hasLivingFortress = true; p.maxHp += 30; p.hp += 30 } },
      { id: 'aw5', label: 'Divine Judgment', desc: 'Auto-execute enemies below 15% HP in 80+range px, +15% dmg', icon: 'aq5_cataclysm',    apply: p => { p.hasDivineJudgment = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
  {
    name: 'Bastion', color: 0x4488ff,
    upgrades: [
      { id: 'ab1', label: 'Fortify',         desc: '+15% armor, activates defense aura visual',       icon: 'ab1_fortify',         apply: p => { p.armor = Math.min(0.7, p.armor + 0.15); p.defenseAuraActive = true } },
      { id: 'ab2', label: 'Aura of Might',   desc: 'Aura: 3 DPS to all enemies in 60px, +3 dmg',     icon: 'ab2_thorns',          apply: p => { p.hasPassiveAura = true; p.damage += 3 } },
      { id: 'ab3', label: 'Iron Will',       desc: 'Any single hit capped at 10% max HP, +10% armor', icon: 'ab3_iron_will',       apply: p => { p.hasIronWill = true; p.armor = Math.min(0.7, p.armor + 0.1) } },
      { id: 'ab4', label: 'Regenerate',      desc: 'Below 40% HP: regen ×3, +2 HP/s',               icon: 'ab4_regenerate',      apply: p => { p.hasLowHpRegen = true; p.hpRegen += 2 } },
      { id: 'ab5', label: 'Undying',         desc: 'Revive once at full HP + 100px shockwave, +30 max HP', icon: 'ab5_undying',    apply: p => { p.hasUndying = true; p.maxHp += 30; p.hp += 30 } },
    ],
  },
  {
    name: 'Quake', color: 0xffcc44,
    upgrades: [
      { id: 'aq1', label: "Titan's Pulse",   desc: 'Shockwave: launch boulder 300px, 1.5× dmg AoE, +5 dmg', icon: 'as1_living_fortress', apply: p => { p.hasTitansPulse = true; p.damage += 5; p.splashRadius += 15 } },
      { id: 'aq2', label: 'Earthquake',      desc: 'Shockwave hit: stun enemies 0.8s, +10% dmg',             icon: 'as2_consecration',    apply: p => { p.hasEarthquake = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'aq3', label: 'Colossus',        desc: 'Shockwave knockback 500px (vs 200px), +5 dmg',           icon: 'as3_wrath',           apply: p => { p.hasColossus = true; p.damage += 5 } },
      { id: 'aq4', label: 'Gravity Well',    desc: 'Every 2s: pull enemies in 120+range px toward you, +15 range', icon: 'as4_gravity_well', apply: p => { p.hasGravityWell = true; p.range += 15 } },
      { id: 'aq5', label: 'Cataclysm',       desc: '2nd shockwave 60% dmg at 350ms delay, +15% dmg',        icon: 'as5_divine_judgment',  apply: p => { p.hasCataclysm = true; p.damage = Math.ceil(p.damage * 1.15) } },
    ],
  },
]

const KHASHIN_GALE_BRANCH: BranchDef = {
  name: 'Gale', color: 0x88DDFF,
  upgrades: [
    { id: 'kw1', label: 'Razor Wind',      desc: 'Wind slash +25% dmg, pierces +1 target',                   icon: 'kw1_razor_wind',      apply: p => { p.damage = Math.ceil(p.damage * 1.25); p.windSlashPierce += 1 } },
    { id: 'kw2', label: 'Gust Strike',     desc: 'Wind slash knocks back enemies 150px',                     icon: 'kw2_gust_strike',     apply: p => { p.hasGustStrike = true } },
    { id: 'kw3', label: 'Dust Devil',      desc: 'Every 5th attack spawns a drifting tornado',               icon: 'kw3_dust_devil',      apply: p => { p.hasDustDevil = true } },
    { id: 'kw4', label: 'Cyclone Surge',   desc: 'Dust Devils +50% bigger, +1s longer; +15% dmg',           icon: 'kw4_cyclone_surge',   apply: p => { p.hasCycloneSurge = true; p.damage = Math.ceil(p.damage * 1.15) } },
    { id: 'kw5', label: 'Eye of the Storm', desc: 'Anchored tornado every 8s; +20% dmg',                    icon: 'kw5_eye_of_the_storm', apply: p => { p.hasEyeOfTheStorm = true; p.damage = Math.ceil(p.damage * 1.2) } },
  ],
}

const KHASHIN_DUNE_BRANCH: BranchDef = {
  name: 'Dune', color: 0xE8A040,
  upgrades: [
    { id: 'kd1', label: 'Choking Sand',    desc: 'Blinded enemies take +35% dmg',                            icon: 'kd1_choking_sand',    apply: p => { p.hasChokingSand = true } },
    { id: 'kd2', label: 'Sand Armor',      desc: 'Absorb shield 25% max HP, regens 4s after break',          icon: 'kd2_sand_armor',      apply: p => { p.hasSandArmor = true; (p as any)._sandArmorHP = Math.ceil(p.maxHp * 0.25); (p as any)._sandArmorMax = (p as any)._sandArmorHP; (p as any)._sandArmorRegenDelay = 0 } },
    { id: 'kd3', label: 'Abrasion',        desc: 'Blinded enemies -20% armor; +3 dmg',                       icon: 'kd3_abrasion',        apply: p => { p.hasAbrasion = true; p.damage += 3 } },
    { id: 'kd4', label: 'Scarab Tide',     desc: 'On kill: 4 seeking scarabs apply Blind',                   icon: 'kd4_scarab_tide',     apply: p => { p.hasScarabTide = true } },
    { id: 'kd5', label: 'Sandstorm Wall',  desc: 'Haboob arcs spawn lingering sand clouds',                  icon: 'kd5_sandstorm_wall',  apply: p => { p.hasSandstormWall = true } },
  ],
}

const KHASHIN_MIRAGE_BRANCH: BranchDef = {
  name: 'Mirage', color: 0xCCAAFF,
  upgrades: [
    { id: 'km1', label: 'Tailwind',        desc: '+20 speed, -10% attack CD',                                icon: 'km1_tailwind',        apply: p => { p.speed += 20; p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.9)) } },
    { id: 'km2', label: 'Phantom Step',    desc: 'Auto-dash 100px away every 6s',                            icon: 'km2_phantom_step',    apply: p => { p.hasPhantomStep = true } },
    { id: 'km3', label: 'Mirage',          desc: 'Phantom Step leaves a decoy for 2s',                       icon: 'km3_mirage',          apply: p => { p.hasMirage = true } },
    { id: 'km4', label: 'Drift',           desc: 'Moving leaves slow trails (40% slow)',                     icon: 'km4_drift',           apply: p => { p.hasDrift = true } },
    { id: 'km5', label: 'Desert Wind',     desc: 'Every 10s: 180px wind burst + 3s DR',                      icon: 'km5_desert_wind',     apply: p => { p.hasDesertWind = true } },
  ],
}

const KHASHIN_BRANCHES: BranchDef[] = [
  KHASHIN_GALE_BRANCH,
  KHASHIN_DUNE_BRANCH,
  KHASHIN_MIRAGE_BRANCH,
]

const MULLER_BRANCHES: BranchDef[] = [
  {
    name: 'Shardfall', color: 0x44AAFF,
    upgrades: [
      { id: 'cm1', label: 'Coarse Cut',       desc: 'Crystal wave cone +15° wider',                          icon: 'cm1_coarse_cut',      apply: p => { p.crystalWaveConeAngle += 15 } },
      { id: 'cm2', label: 'Deep Vein',        desc: 'Spikes +30% dmg at max range',                          icon: 'cm2_deep_vein',       apply: p => { p.hasDeepVein = true } },
      { id: 'cm3', label: 'Shardstorm',       desc: 'Double wave per slam',                                  icon: 'cm3_shardstorm',      apply: p => { p.hasShardstorm = true } },
      { id: 'cm4', label: 'Crystal Shrapnel', desc: 'Spikes spray 3 shards on death',                        icon: 'cm4_crystal_shrapnel', apply: p => { p.hasCrystalShrapnel = true } },
      { id: 'cm5', label: 'Tectonic Fury',    desc: 'Every 5th slam: crystal eruption ring',                  icon: 'cm5_tectonic_fury',   apply: p => { p.hasTectonicFury = true } },
    ],
  },
  {
    name: 'Geode Shell', color: 0x99DDCC,
    upgrades: [
      { id: 'cr1', label: 'Stone Skin',       desc: '+2% DR per kill, max 5 stacks',                         icon: 'cr1_stone_skin',      apply: p => { p.hasStoneSkin = true } },
      { id: 'cr2', label: 'Geode Shell',      desc: 'Below 50% HP: absorb next hit, 20s CD',                 icon: 'cr2_geode_shell',     apply: p => { p.hasGeodeShell = true } },
      { id: 'cr3', label: 'Crystal Wall',     desc: 'Barrier every 8s blocking enemies',                     icon: 'cr3_crystal_wall',    apply: p => { p.hasCrystalWall = true } },
      { id: 'cr4', label: 'Resonance Armor',  desc: 'Wave impact grants 0.5s invuln',                        icon: 'cr4_resonance_armor', apply: p => { p.hasResonanceArmor = true } },
      { id: 'cr5', label: 'Living Geode',     desc: '+25 HP, melee reflect 15 dmg',                          icon: 'cr5_living_geode',    apply: p => { p.hasLivingGeode = true; p.maxHp += 25; p.hp += 25 } },
    ],
  },
  {
    name: 'Deep Seam', color: 0xCC99FF,
    upgrades: [
      { id: 'cf1', label: 'Planted Shard',    desc: 'Slams leave crystal mines',                             icon: 'cf1_planted_shard',   apply: p => { p.hasPlantedShard = true } },
      { id: 'cf2', label: 'Crystal Pillar',   desc: 'Auto pillar every 12s',                                 icon: 'cf2_crystal_pillar',  apply: p => { p.hasCrystalPillar = true } },
      { id: 'cf3', label: 'Fault Line',       desc: 'Wave carves 4s ground hazard',                          icon: 'cf3_fault_line',      apply: p => { p.hasFaultLine = true } },
      { id: 'cf4', label: 'Resonance Field',  desc: 'Structures slow enemies 20%',                           icon: 'cf4_resonance_field', apply: p => { p.hasResonanceField = true } },
      { id: 'cf5', label: 'The Mother Lode',  desc: 'Massive crystal eruption every 12s',                    icon: 'cf5_mother_lode',     apply: p => { p.hasMotherLode = true } },
    ],
  },
]

const HUNTRESS_BRANCHES: BranchDef[] = [
  {
    name: 'Predator', color: 0xff4444,
    upgrades: [
      { id: 'hp1', label: 'Critical Strike',  desc: '20% chance to deal 2× dmg, +10% dmg',              icon: 'g1_sharp_edge',    apply: p => { p.hasCriticalStrike = true; p.damage = Math.ceil(p.damage * 1.1) } },
      { id: 'hp2', label: 'Marked Target',    desc: 'Hit marks enemy 5s; marked take +30% dmg, +3 dmg', icon: 'g3_eagle_eye',     apply: p => { p.hasMarkedTarget = true; p.damage += 3 } },
      { id: 'hp3', label: 'Battle Frenzy',    desc: 'On kill: -10% attack CD for 5s, +3 dmg',           icon: 'g4_quick_hands',   apply: p => { p.hasBattleFrenzy = true; p.damage += 3 } },
      { id: 'hp4', label: 'Headhunter',       desc: 'Auto-execute enemies below 15% HP in 100px, +15% dmg', icon: 'nb5_assassinate', apply: p => { p.hasHeadhunter = true; p.damage = Math.ceil(p.damage * 1.15) } },
      { id: 'hp5', label: 'Volley',           desc: 'Every 5th spear: fires 3 at once (extra 60% dmg), +10% dmg', icon: 'g9_multistrike', apply: p => { p.hasVolley = true; p.damage = Math.ceil(p.damage * 1.1) } },
    ],
  },
  {
    name: 'Stalker', color: 0x44cc44,
    upgrades: [
      { id: 'hs1', label: 'Kill Stride',      desc: 'On kill: +20% speed for 3s, +10 speed',             icon: 'g2_swift_feet',     apply: p => { p.hasKillStride = true; p.speed += 10 } },
      { id: 'hs2', label: 'Caltrops',         desc: 'Moving: drop 18px spike zone every 800ms, 15% dmg/tick, +3 dmg', icon: 'ns3_smoke_bomb', apply: p => { p.hasCaltrops = true; p.damage += 3 } },
      { id: 'hs3', label: 'Net Throw',        desc: 'Every 8th spear roots enemies 1.5s, +3 dmg',        icon: 'nv1_toxic_slash',   apply: p => { p.hasNetThrow = true; p.damage += 3 } },
      { id: 'hs4', label: 'Camouflage',       desc: 'On kill: invisible 2s (enemies ignore you), +10 speed', icon: 'ns1_vanish',     apply: p => { p.hasCamouflage = true; p.speed += 10 } },
      { id: 'hs5', label: 'Leap',             desc: 'Auto-leap 120px away when 4+ enemies within 50px, 4s CD, +15 speed', icon: 'ns2_phantom_trail', apply: p => { p.hasLeap = true; p.speed += 15 } },
    ],
  },
  {
    name: 'Warden', color: 0x4488ff,
    upgrades: [
      { id: 'hw1', label: 'Heavy Spear',      desc: 'Spears deal +40% dmg and knock enemies back, +5 dmg',        icon: 'sc3_mirror_ice',    apply: p => { p.hasHeavySpear = true; p.damage = Math.ceil(p.damage * 1.4) } },
      { id: 'hw2', label: 'Explosive Tips',   desc: 'On first spear pierce: AoE 35% dmg in 40px, +15 splash',     icon: 'if1_wide_burn',     apply: p => { p.hasExplosiveTips = true; p.splashRadius += 15 } },
      { id: 'hw3', label: 'Splinter Shot',    desc: 'Spear miss: spawns 3 shards 30% dmg in 80px, +4 dmg',        icon: 'ss2_shatter',       apply: p => { p.hasSplinterShot = true; p.damage += 4 } },
      { id: 'hw4', label: 'Spear Wall',       desc: '3 orbiting spears, 20% dmg/s each in 18px, +3 dmg',          icon: 'aq1_titans_pulse',  apply: p => { p.hasSpearWall = true; p.damage += 3 } },
      { id: 'hw5', label: 'Earth Slam',       desc: 'Melee: shockwave line 150px, 60% dmg, +20% dmg',             icon: 'aq2_earthquake',    apply: p => { p.hasEarthSlam = true; p.damage = Math.ceil(p.damage * 1.2) } },
    ],
  },
]

// Map hero → branches
export const HERO_BRANCHES: Record<string, BranchDef[]> = {
  ignara: IGNARA_BRANCHES,
  nazar:  NAZAR_BRANCHES,
  // khet removed from playable roster (shared NAZAR_BRANCHES)
  sifra:  SIFRA_BRANCHES,
  amun:   AMUN_BRANCHES,
  huntress: HUNTRESS_BRANCHES,
  khashin: KHASHIN_BRANCHES,
  muller:  MULLER_BRANCHES,
}

// ============================================================
// SELECTION LOGIC
// ============================================================

/** Track which upgrades have been picked */
export class UpgradeTracker {
  pickedGeneric = new Set<string>()
  pickedPersonal = new Set<string>()
  branchProgress: Record<string, number> = {} // branchName → count picked
  chosenBranch: string | null = null          // branch name chosen at level 1
  isFirstLevel = true                          // tracks if this is the first level-up

  /** True while the player still needs to pick a branch (i.e. it is the first level-up) */
  get isBranchSelection(): boolean { return this.isFirstLevel }

  /**
   * Returns exactly 3 cards — one per branch (the FIRST skill of each branch).
   * Each card represents the whole branch, not just the skill.
   *
   * For Sifra:
   *  - stance 'lightning': Lightning branch + 2 randomly chosen ice branches (3 total)
   *  - stance 'ice': all 3 ice branches (no Lightning)
   *  - no stance / other heroes: show all 3 branches (or randomly pick 3 if more than 3)
   *
   * For Khashin:
   *  - stance 'sirocco': Gale branch + Mirage branch (+ Dune excluded)
   *  - stance 'haboob': Dune branch + Mirage branch (+ Gale excluded)
   *  - no stance: all 3 branches
   */
  getBranchChoices(heroType: HeroType, stance?: string): Upgrade[] {
    let branches = HERO_BRANCHES[heroType] || []

    if (heroType === 'sifra') {
      if (stance === 'ice') {
        branches = SIFRA_ICE_BRANCHES
      } else if (stance === 'lightning') {
        // Lightning + 2 random ice branches = 3 total
        const shuffledIce = [...SIFRA_ICE_BRANCHES].sort(() => Math.random() - 0.5)
        branches = [SIFRA_LIGHTNING_BRANCH, shuffledIce[0], shuffledIce[1]]
      } else {
        // No stance — pick 3 from all 4 randomly
        branches = [...SIFRA_BRANCHES].sort(() => Math.random() - 0.5).slice(0, 3)
      }
    } else if (heroType === 'khashin') {
      if (stance === 'sirocco') {
        // Gale (sirocco only) + Mirage (always) — exclude Dune
        branches = [KHASHIN_GALE_BRANCH, KHASHIN_MIRAGE_BRANCH]
      } else if (stance === 'haboob') {
        // Dune (haboob only) + Mirage (always) — exclude Gale
        branches = [KHASHIN_DUNE_BRANCH, KHASHIN_MIRAGE_BRANCH]
      }
      // no stance → show all 3 (falls through to the length>3 guard below, which won't fire)
    }

    // For any hero with more than 3 branches, randomly pick 3
    if (branches.length > 3) {
      branches = [...branches].sort(() => Math.random() - 0.5).slice(0, 3)
    }

    return branches.map(b => ({
      ...b.upgrades[0],
      branch: b.name,
      branchColor: b.color,
      _branchDef: b,
    }))
  }

  /** Get 3 choices: 2 generic + 1 personal from the chosen branch (or 3 generic if maxed) */
  getChoices(heroType: HeroType, _stance?: string): Upgrade[] {
    const choices: Upgrade[] = []

    // Available generics
    const availGenerics = GENERIC_POOL.filter(u => !this.pickedGeneric.has(u.id))

    let personal: Upgrade | null = null

    if (this.chosenBranch) {
      // After branch selection: always draw from the chosen branch only
      const allBranches = HERO_BRANCHES[heroType] || []
      const chosenBranchDef = allBranches.find(b => b.name === this.chosenBranch)
      if (chosenBranchDef) {
        const idx = this.branchProgress[chosenBranchDef.name] || 0
        if (idx < chosenBranchDef.upgrades.length) {
          personal = {
            ...chosenBranchDef.upgrades[idx],
            branch: chosenBranchDef.name,
            branchColor: chosenBranchDef.color,
          }
        }
      }
    }

    // Pick 2 random generics (or 3 if no personal)
    const shuffledGen = [...availGenerics].sort(() => Math.random() - 0.5)
    const genCount = personal ? 2 : 3
    for (let i = 0; i < genCount && i < shuffledGen.length; i++) {
      choices.push(shuffledGen[i])
    }

    if (personal) {
      const insertIdx = Math.floor(Math.random() * (choices.length + 1))
      choices.splice(insertIdx, 0, personal)
    }

    while (choices.length < 3 && shuffledGen.length > choices.length) {
      const next = shuffledGen.find(u => !choices.includes(u))
      if (next) choices.push(next)
      else break
    }

    return choices.slice(0, 3)
  }

  /** Mark an upgrade as picked */
  pick(upgrade: Upgrade) {
    if (this.isFirstLevel && upgrade.branch) {
      this.chosenBranch = upgrade.branch
      this.isFirstLevel = false
    }

    if (upgrade.branch) {
      this.pickedPersonal.add(upgrade.id)
      this.branchProgress[upgrade.branch] = (this.branchProgress[upgrade.branch] || 0) + 1
    } else {
      this.pickedGeneric.add(upgrade.id)
    }
  }
}

// Icon name → spritesheet frame index (matches skill_icons_sheet.png layout)
const ICON_FRAME_MAP: Record<string, number> = {
  'g1_sharp_edge': 0, 'g2_swift_feet': 1, 'g3_eagle_eye': 2, 'g4_quick_hands': 3, 'g5_vitality': 4,
  'g6_regeneration': 5, 'g7_cleave': 6, 'g8_wisdom': 7, 'g9_multistrike': 8, 'g10_iron_skin': 9,
  'if1_wide_burn': 10, 'if2_inferno_reach': 11, 'if3_white_fire': 12, 'if4_scorched_earth': 13, 'if5_firestorm': 14,
  'io1_heat_shield': 15, 'io2_pyromaniac': 16, 'io3_molten_skin': 17, 'io4_ember_veil': 18, 'io5_phoenix_heart': 19,
  'ih1_backdraft': 20, 'ih2_eruption': 21, 'ih3_lava_trail': 22, 'ih4_wildfire': 23, 'ih5_meltdown': 24,
  'nb1_shadow_step': 25, 'nb2_twin_blades': 26, 'nb3_chain_dash': 27, 'nb4_hemorrhage': 28, 'nb5_assassinate': 29,
  'nv1_toxic_slash': 30, 'nv2_virulent_strain': 31, 'nv3_pandemic': 32, 'nv4_weakness': 33, 'nv5_necrosis': 34,
  'ns1_vanish': 35, 'ns2_phantom_trail': 36, 'ns3_smoke_bomb': 37, 'ns4_blood_scent': 38, 'ns5_death_mark': 39,
  'sf1_deep_freeze': 40, 'sf2_blizzard_aura': 41, 'sf3_frost_nova': 42, 'sf4_absolute_zero': 43, 'sf5_eternal_winter': 44,
  'ss1_permafrost': 45, 'ss2_shatter': 46, 'ss3_ice_spear': 47, 'ss4_frostbite': 48, 'ss5_avalanche': 49,
  'sc1_glacial_pierce': 50, 'sc2_ice_armor': 51, 'sc3_mirror_ice': 52, 'sc4_cryo_shield': 53, 'sc5_diamond_dust': 54,
  'aq1_titans_pulse': 55, 'aq2_earthquake': 56, 'aq3_colossus': 57, 'aq4_rally_cry': 58, 'aq5_cataclysm': 59,
  'ab1_fortify': 60, 'ab2_thorns': 61, 'ab3_iron_will': 62, 'ab4_regenerate': 63, 'ab5_undying': 64,
  'as1_living_fortress': 65, 'as2_consecration': 66, 'as3_wrath': 67, 'as4_gravity_well': 68, 'as5_divine_judgment': 69,
  // Khashin — Gale
  'kw1_razor_wind': 70, 'kw2_gust_strike': 71, 'kw3_dust_devil': 72, 'kw4_cyclone_surge': 73, 'kw5_eye_of_the_storm': 74,
  // Khashin — Dune
  'kd1_choking_sand': 75, 'kd2_sand_armor': 76, 'kd3_abrasion': 77, 'kd4_scarab_tide': 78, 'kd5_sandstorm_wall': 79,
  // Khashin — Mirage
  'km1_tailwind': 80, 'km2_phantom_step': 81, 'km3_mirage': 82, 'km4_drift': 83, 'km5_desert_wind': 84,
  // Muller — Shardfall
  'cm1_coarse_cut': 85, 'cm2_deep_vein': 86, 'cm3_shardstorm': 87, 'cm4_crystal_shrapnel': 88, 'cm5_tectonic_fury': 89,
  // Muller — Geode Shell
  'cr1_stone_skin': 90, 'cr2_geode_shell': 91, 'cr3_crystal_wall': 92, 'cr4_resonance_armor': 93, 'cr5_living_geode': 94,
  // Muller — Deep Seam
  'cf1_planted_shard': 95, 'cf2_crystal_pillar': 96, 'cf3_fault_line': 97, 'cf4_resonance_field': 98, 'cf5_mother_lode': 99,
}
export function getIconFrame(iconName: string): number {
  return ICON_FRAME_MAP[iconName] ?? 0
}
