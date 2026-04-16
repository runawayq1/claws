import { Player, type HeroType } from '../entities/Player'
import { MetaProgress } from './MetaProgress'

export interface Upgrade {
  id: string
  label: string
  desc: string[]       // one entry per level (indices 0, 1, 2 = level 1, 2, 3)
  icon: string         // key into spritesheet frame
  branch?: string      // branch name (for personal upgrades)
  branchColor?: number // hex color for card tint
  isUltimate?: boolean // only enters pool once all 3 regulars are ≥ level 2
  _branchDef?: BranchDef  // only present on branch-selection cards
  apply: (p: Player, level: number) => void
}

// ============================================================
// GENERIC POOL (G1–G10) — available to all heroes, 3 levels each
// ============================================================
export const GENERIC_POOL: Upgrade[] = [
  { id: 'g1',  label: 'Sharp Edge',   desc: ['+12% dmg to all attacks', '+6% dmg (total ~19%)', '+6% dmg (total ~26%)'],              icon: 'g1_sharp_edge',   apply: (p, lvl) => { const m = [1.12, 1.06, 1.06][lvl - 1]; p.damage = Math.ceil(p.damage * m) } },
  { id: 'g2',  label: 'Swift Feet',   desc: ['+9% move speed permanently', '+6% more speed', '+6% more speed'],                       icon: 'g2_swift_feet',   apply: (p, lvl) => { const m = [1.09, 1.06, 1.06][lvl - 1]; p.speed = Math.ceil(p.speed * m) } },
  { id: 'g3',  label: 'Eagle Eye',    desc: ['+12% attack range permanently', '+9% more range', '+9% more range'],                    icon: 'g3_eagle_eye',    apply: (p, lvl) => { const m = [1.12, 1.09, 1.09][lvl - 1]; p.range = Math.ceil(p.range * m) } },
  { id: 'g4',  label: 'Quick Hands',  desc: ['+12% attack speed (min 200ms)', '+6% attack speed', '+6% attack speed'],                icon: 'g4_quick_hands',  apply: (p, lvl) => { const m = [0.88, 0.94, 0.94][lvl - 1]; p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * m)) } },
  { id: 'g5',  label: 'Vitality',     desc: ['+15% max HP, heal for the bonus', '+12% more max HP', '+12% more max HP'],              icon: 'g5_vitality',     apply: (p, lvl) => { const pct = [0.15, 0.12, 0.12][lvl - 1]; const b = Math.ceil(p.maxHp * pct); p.maxHp += b; p.hp += b } },
  { id: 'g6',  label: 'Regeneration', desc: ['+1 HP/s passive regen', '+1 HP/s more regen', '+2 HP/s more regen'],                    icon: 'g6_regeneration', apply: (p, lvl) => { p.hpRegen += [1, 1, 2][lvl - 1] } },
  { id: 'g7',  label: 'Cleave',       desc: ['AoE: attacks splash in 4m radius', 'Splash radius +2m', 'Splash radius +2.5m'],         icon: 'g7_cleave',       apply: (p, lvl) => { if (lvl === 1) { p.splashRadius = Math.max(p.splashRadius, 40) } else { p.splashRadius += lvl === 2 ? 20 : 25 } } },
  { id: 'g8',  label: 'Wisdom',       desc: ['+15% XP from all sources', '+9% more XP', '+9% more XP'],                               icon: 'g8_wisdom',       apply: (p, lvl) => { p.xpMult += [0.15, 0.09, 0.09][lvl - 1] } },
  { id: 'g9',  label: 'Multistrike',  desc: ['+1 target for ranged, +1 strike for melee', '+5% dmg to all attacks', '+1 more target/strike'],             icon: 'g9_multistrike',  apply: (p, lvl) => { if (lvl === 1 || lvl === 3) { p.strikeCount += 1 } else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.05) } } },
  { id: 'g10', label: 'Iron Skin',    desc: ['+10% armor (reduces dmg taken)', '+10% more armor', '+10% more armor'],                 icon: 'g10_iron_skin',   apply: (p, _lvl) => { p.armor = Math.min(0.7, p.armor + 0.10) } },
]

// ============================================================
// PERSONAL UPGRADES — per hero, 3 branches × 4 skills (3 regular + 1 ultimate)
// ============================================================
export interface BranchDef {
  name: string
  color: number
  theme?: string
  upgrades: Upgrade[]
}

const IGNARA_BRANCHES: BranchDef[] = [
  {
    name: 'Inferno', color: 0xff6600,
    theme: 'The flame grows. The field burns. Nothing leaves the circle.',
    upgrades: [
      {
        id: 'if1', label: 'Wide Burn', icon: 'if1_wide_burn',
        desc: ['Wider blast\nExplosion radius +2m', 'The fire spreads\n+2m radius (4m total)', 'Earth remembers\n+3m radius. Ground left burning (Scorched Earth DOT)'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.splashRadius += 20 }
          else if (lvl === 2) { p.splashRadius += 20 }
          else { p.splashRadius += 30; p.hasScorchedEarth = true }
        },
      },
      {
        id: 'if2', label: 'Inferno Reach', icon: 'if2_inferno_reach',
        desc: ['Longer arc\nFireball range +3m', 'Hotter throw\n+2m range, +10% dmg', 'Sun-cast\n+2m range, +15% dmg'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.range += 30 }
          else if (lvl === 2) { p.range += 20; p.damage = Math.ceil(p.damage * 1.1) }
          else { p.range += 20; p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
      {
        id: 'if3', label: 'White Fire', icon: 'if3_white_fire',
        desc: ['Heat beyond flame\n+30% fireball dmg', 'Forge-white\n+15% dmg', 'Contagion of flame\n+15% dmg. Kills trigger Wildfire chain blast'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.damage = Math.ceil(p.damage * 1.3) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
          else { p.damage = Math.ceil(p.damage * 1.15); p.hasWildfire = true }
        },
      },
      {
        id: 'if4', label: 'Ashen Veil', icon: 'if4_scorched_earth',
        desc: ['Shroud of cinders\nOn kill: -10% damage taken for 2s', 'Thickening ash\n-14% damage taken, up to 2 stacks', 'Cascade\n-18% damage taken, 2 stacks. Wildfire chain kills also stack'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasAshenVeil = true; p.ashenVeilDR = 0.10; p.ashenVeilMaxStacks = 1 }
          else if (lvl === 2) { p.ashenVeilDR = 0.14; p.ashenVeilMaxStacks = 2 }
          else { p.ashenVeilDR = 0.18 }
        },
      },
      {
        id: 'if5', label: 'Firestorm', icon: 'if5_firestorm', isUltimate: true,
        desc: ['Twin suns orbit\n2 mini-fireballs strike nearby foes (50% dmg). +15% dmg', 'Third companion\n+1 orbiting fireball, +10% dmg', 'Consecrated ground\nMini-fireballs leave Scorched Earth on impact'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasFirestorm = true; p.firestormOrbCount = 2; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.firestormOrbCount = 3; p.damage = Math.ceil(p.damage * 1.1) }
          else { p.hasScorchedEarth = true }
        },
      },
    ],
  },
  {
    name: 'Wildfire', color: 0xff3300,
    theme: 'Relentless. Burning. It never stops.',
    upgrades: [
      {
        id: 'bh1', label: 'Sustained Burn', icon: 'bh1_sustained_burn',
        desc: ['Hits apply Burn (4%/tick, max 5)\n+10% Attack Speed', 'Max stacks → 7\n-10% CD', 'Fully stacked: +20% dmg taken\n-10% CD'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasSustainedBurn = true; p.attackCooldown = Math.max(200, Math.ceil(p.attackCooldown * 0.9)) }
          else if (lvl === 2) { p.burnMaxStacks = 7; p.attackCooldown = Math.max(200, Math.ceil(p.attackCooldown * 0.9)) }
          else { p.burnStackedDmgBonus = true; p.attackCooldown = Math.max(200, Math.ceil(p.attackCooldown * 0.9)) }
        },
      },
      {
        id: 'bh2', label: 'Powder Keg', icon: 'bh2_powder_keg',
        desc: ['Every 10 kills: next shot ×2 blast', 'Every 8 kills: ×2.5 blast', 'Every 6 kills: ×3 blast + 2 shrapnel'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasPowderKeg = true; p.powderKegThreshold = 10 }
          else if (lvl === 2) { p.powderKegThreshold = 8 }
          else { p.powderKegThreshold = 6; p.powderKegShrapnel = true }
        },
      },
      {
        id: 'bh3', label: 'Ember Volley', icon: 'bh3_ember_volley',
        desc: ['-12% CD. On kill: -2% CD (max 20%)', '-12% CD. Cap → 30%', '-12% CD, +10% dmg. Burns nearby also reduce CD'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasEmberVolley = true; p.attackCooldown = Math.max(200, Math.ceil(p.attackCooldown * 0.88)) }
          else if (lvl === 2) { p.attackCooldown = Math.max(200, Math.ceil(p.attackCooldown * 0.88)); p.emberVolleyCap = 0.3 }
          else { p.attackCooldown = Math.max(200, Math.ceil(p.attackCooldown * 0.88)); p.damage = Math.ceil(p.damage * 1.1); p.emberVolleyDmg = true }
        },
      },
      {
        id: 'bh4', label: 'Flashpoint', icon: 'bh4_flashpoint',
        desc: ['On kill: next shot instant', 'On kill: 2 instant shots', '2 instant shots + 10% dmg burst'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasFlashpoint = true; p.flashpointCharges = 1 }
          else if (lvl === 2) { p.flashpointCharges = 2 }
          else { p.flashpointBurst = true }
        },
      },
      {
        id: 'bh5', label: 'Infernal Cadence', icon: 'bh5_infernal_cadence', isUltimate: true,
        desc: ['6s ×3 speed. Burns apply ×2. +15% dmg', '8s duration. Full-stack kills explode', '10s. Explosion radius ×1.5, +10% dmg'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasInfernalCadence = true; p.infernalCadenceDuration = 6000; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.infernalCadenceDuration = 8000 }
          else { p.infernalCadenceDuration = 10000; p.damage = Math.ceil(p.damage * 1.1) }
        },
      },
    ],
  },
  {
    name: 'Pyre', color: 0xff8800,
    theme: 'Get close. Hit hard. Walk away burning.',
    upgrades: [
      {
        id: 'ih1', label: 'Slug Round', icon: 'ih1_backdraft',
        desc: ['Heavy shot\n+60% projectile size, 2m blast, +15% dmg', 'Bigger punch\n+15% dmg, blast → 30px', 'Piercing slug\n+15% dmg, pierces 1 enemy'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasSlugRound = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
          else { p.damage = Math.ceil(p.damage * 1.15); p.slugPierce = 1 }
        },
      },
      {
        id: 'ih2', label: 'Thick Skin', icon: 'ih2_eruption',
        desc: ['Stand your ground\n+5% armor, +0.3 regen', 'Tempered\n+5% armor, +0.3 regen', 'Furnace heart\n+0.5 regen, +15 HP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.armor = Math.min(0.7, p.armor + 0.05); p.hpRegen += 0.3 }
          else if (lvl === 2) { p.armor = Math.min(0.7, p.armor + 0.05); p.hpRegen += 0.3 }
          else { p.hpRegen += 0.5; p.maxHp += 15; p.hp += 15 }
        },
      },
      {
        id: 'ih3', label: 'Immolation', icon: 'ih3_lava_trail',
        desc: ['Burn aura 70px, 12% dmg/s', 'Aura grows\n85px, 16% dmg/s', 'Consecrated pyre\n20% dmg/s. Kills drop Scorched Earth'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasImmolation = true; p.immolationRadius = 70; p.immolationDmgPct = 0.12 }
          else if (lvl === 2) { p.immolationRadius = 85; p.immolationDmgPct = 0.16 }
          else { p.immolationDmgPct = 0.25; p.hasScorchedEarth = true }
        },
      },
      {
        id: 'ih4', label: 'Molten Volley', icon: 'io4_ember_veil',
        desc: ['3 slugs (40% dmg) in cone, burn 1s', '4 slugs, burn 2s. ×2 tick with aura', '5 slugs. 3+ hits = Scorch: -20% armor 4s'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasMoltenVolley = true; p.moltenVolleyCount = 3 }
          else if (lvl === 2) { p.moltenVolleyCount = 4 }
          else { p.moltenVolleyCount = 5; p.moltenVolleyScorch = true }
        },
      },
      {
        id: 'ih5', label: 'Scorched Bastion', icon: 'ih5_meltdown', isUltimate: true,
        desc: ['+15 HP. Aura radius → 100px', '+10 HP. Aura dmg ×1.3', '+10 HP. Aura lifesteal 2%'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasScorchedBastion = true; p.maxHp += 15; p.hp += 15; p.immolationRadius = 100 }
          else if (lvl === 2) { p.maxHp += 10; p.hp += 10; p.immolationDmgPct *= 1.3 }
          else { p.maxHp += 10; p.hp += 10; p.scorchedBastionLifesteal = 0.02 }
        },
      },
    ],
  },
]

const NAZAR_BRANCHES: BranchDef[] = [
  {
    name: 'Way of the Blade', color: 0xccccdd,
    theme: 'One cut. One kill. Repeat until the Rift is silent.',
    upgrades: [
      {
        id: 'nb1', label: 'Shadow Step', icon: 'nb1_shadow_step',
        desc: ['Blink 3m toward enemy before melee, +10 range', '+15 range, blink distance +1.5m', '+15 range, blink ignores collision for 0.3s'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasShadowStep = true; p.range += 10 }
          else if (lvl === 2) { p.range += 15 }
          else { p.range += 15 }
        },
      },
      {
        id: 'nb2', label: 'Twin Blades', icon: 'nb2_twin_blades',
        desc: ['+1 strike per melee attack', '+1 more strike', '+1 more strike + Hemorrhage bleed on each hit'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.strikeCount += 1 }
          else if (lvl === 2) { p.strikeCount += 1 }
          else { p.strikeCount += 1; p.hasHemorrhage = true }
        },
      },
      {
        id: 'nb3', label: 'Blade Surge', icon: 'nb3_chain_dash',
        desc: ['Lunge 1.5× range, hit 70% dmg line, +5 dmg', '+8 dmg, lunge hits twice', '+8 dmg + Assassinate: 2× dmg if alone, 1.5× vs few'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasChainDash = true; p.damage += 5 }
          else if (lvl === 2) { p.damage += 8 }
          else { p.damage += 8; p.hasAssassinate = true }
        },
      },
      {
        id: 'nb5', label: 'Assassinate', icon: 'nb5_assassinate', isUltimate: true,
        desc: ['1.5× dmg vs lone/few enemies (2× if truly alone), +15% dmg', '+10% more dmg, execute targets below 10% HP', '+15% dmg, execute range doubled'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasAssassinate = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1); p.hasBloodScent = true }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
  {
    name: 'Way of Venom', color: 0x44cc44,
    theme: 'The desert already wants them dead. Help it along.',
    upgrades: [
      {
        id: 'nv1', label: 'Toxic Slash', icon: 'nv1_toxic_slash',
        desc: ['On hit: DOT puddle 30% dmg/tick 3s, +3 dmg', '+4 dmg, puddle lasts 5s', '+5 dmg, puddles stack (max 3)'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasToxicSlash = true; p.damage += 3 }
          else if (lvl === 2) { p.damage += 4 }
          else { p.damage += 5 }
        },
      },
      {
        id: 'nv2', label: 'Virulent Strain', icon: 'nv2_virulent_strain',
        desc: ['Puddles +80% radius, 5s duration, +15 splash', 'Puddles also slow enemies 25%', 'Puddles slow 40% + Weakness: poisoned take +30% dmg'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasVirulentStrain = true; p.splashRadius += 15 }
          else if (lvl === 2) { p.splashRadius += 15 }
          else { p.hasWeakness = true }
        },
      },
      {
        id: 'nv3', label: 'Pandemic', icon: 'nv3_pandemic',
        desc: ['On kill: spread mini-cloud 50% radius, 50% dmg, +3 dmg', '+4 dmg, cloud lingers 1s longer', '+5 dmg + Necrosis: poison ramps +20%/tick'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasPandemic = true; p.damage += 3 }
          else if (lvl === 2) { p.damage += 4 }
          else { p.damage += 5; p.hasNecrosis = true }
        },
      },
      {
        id: 'nv5', label: 'Necrosis', icon: 'nv5_necrosis', isUltimate: true,
        desc: ['Poison dmg ramps +20%/tick, +15% dmg', '+10% more dmg, ramp resets slower', '+15% dmg, ramp reaches up to 3× on last tick'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasNecrosis = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
  {
    name: 'Way of Shadow', color: 0x9955dd,
    theme: 'Be the thing they don\'t see coming. Be it twice.',
    upgrades: [
      {
        id: 'ns1', label: 'Vanish', icon: 'ns1_vanish',
        desc: ['After melee: 400ms invuln, +10% armor', '+10% more armor, invuln lasts 600ms', '+10% armor, invuln also slows nearby enemies 40%'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasVanish = true; p.armor = Math.min(0.7, p.armor + 0.1) }
          else if (lvl === 2) { p.armor = Math.min(0.7, p.armor + 0.1) }
          else { p.armor = Math.min(0.7, p.armor + 0.1); p.hasSmokeBomb = true }
        },
      },
      {
        id: 'ns2', label: 'Phantom Trail', icon: 'ns2_phantom_trail',
        desc: ['Moving: shadow trail 15% dmg/tick in 1.5m, +10 speed', '+10 speed, trail width doubles', '+10 speed, trail also slows enemies 30%'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasPhantomTrail = true; p.speed += 10 }
          else if (lvl === 2) { p.speed += 10 }
          else { p.speed += 10 }
        },
      },
      {
        id: 'ns3', label: 'Smoke Bomb', icon: 'ns3_smoke_bomb',
        desc: ['On melee: slow enemies 60% in 5m, +15 splash', '+20 splash, slow lasts 0.5s longer', '+20 splash + Blood Scent: execute below 20% HP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasSmokeBomb = true; p.splashRadius += 15 }
          else if (lvl === 2) { p.splashRadius += 20 }
          else { p.splashRadius += 20; p.hasBloodScent = true }
        },
      },
      {
        id: 'ns5', label: 'Death Mark', icon: 'ns5_death_mark', isUltimate: true,
        desc: ['1st hit marks; 2nd hit deals +40% dmg, +15% dmg', '+10% dmg, mark lasts 2s longer', '+15% dmg, marked enemy reveals nearby hidden targets'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasDeathMark = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
]

// Ice path branches
const SIFRA_ICE_BRANCHES: BranchDef[] = [
  {
    name: 'Frost', color: 0x55aaff,
    theme: 'The cold preserves. The cold also kills.',
    upgrades: [
      {
        id: 'sf1', label: 'Deep Freeze', icon: 'sf1_deep_freeze',
        desc: ['+30% enemy slow, +10% dmg', '+10% dmg, frozen enemies shatter for +20% bonus dmg', '+10% dmg, shatter AoE in 3m radius'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasDeepFreeze = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1) }
        },
      },
      {
        id: 'sc2', label: 'Ice Armor', icon: 'sc2_ice_armor',
        desc: ['Absorb shield (30+15% maxHP), regens after 5s', 'Shield strength +10% maxHP, regen timer -1s', '+15% maxHP shield + Blizzard Aura activates when shield is up'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasIceArmor = true; p.iceArmorMax = 30 + p.maxHp * 0.15; p.iceArmorHP = p.iceArmorMax }
          else if (lvl === 2) { p.iceArmorMax += p.maxHp * 0.1; p.iceArmorHP = p.iceArmorMax }
          else { p.iceArmorMax += p.maxHp * 0.15; p.iceArmorHP = p.iceArmorMax; p.hasBlizzardAura = true }
        },
      },
      {
        id: 'sf2', label: 'Blizzard Aura', icon: 'sf2_blizzard_aura',
        desc: ['Aura: slow nearby enemies 40% in 6m', 'Slow increases to 55%, radius +2m', 'Slow 55% + Frost Nova every 4th shot (8 shards ring)'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasBlizzardAura = true }
          else if (lvl === 2) { p.splashRadius += 20 }
          else { p.hasFrostNova = true }
        },
      },
      {
        id: 'sf5', label: 'Eternal Winter', icon: 'sf5_eternal_winter', isUltimate: true,
        desc: ['Frost field: 20% dmg/s + 60% slow in 6m, +15% dmg', 'Field radius +3m, dmg rate +10%/s', '+20% dmg, field also freezes enemies for 0.5s/tick'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasEternalWinter = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.2) }
        },
      },
    ],
  },
  {
    name: 'Shatter', color: 0x88ddff,
    theme: 'Frozen things break beautifully.',
    upgrades: [
      {
        id: 'ss1', label: 'Permafrost', icon: 'ss1_permafrost',
        desc: ['+40% dmg vs slowed enemies, +10% dmg', '+10% more dmg, bonus vs slowed increases to 60%', '+10% dmg, bonus vs frozen is 100% (double dmg)'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasPermafrost = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1) }
        },
      },
      {
        id: 'ss2', label: 'Shatter', icon: 'ss2_shatter',
        desc: ['On hit: +2 mini-shards seek nearby foes', '+2 more shards per hit', '+2 more shards + shards pierce 2 additional targets'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.shatterPieces += 2 }
          else if (lvl === 2) { p.shatterPieces += 2 }
          else { p.shatterPieces += 2; p.pierceCount += 2 }
        },
      },
      {
        id: 'ss3', label: 'Ice Spear', icon: 'ss3_ice_spear',
        desc: ['+8 dmg, +2m range', '+8 dmg, +2m range, shards pierce +1 target', '+10 dmg, +2m range + Mirror Ice: shards pierce +2 more'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.damage += 8; p.range += 20 }
          else if (lvl === 2) { p.damage += 8; p.range += 20; p.pierceCount += 1 }
          else { p.damage += 10; p.range += 20; p.pierceCount += 2 }
        },
      },
      {
        id: 'ss5', label: 'Avalanche', icon: 'ss5_avalanche', isUltimate: true,
        desc: ['+3 shatter shards per hit, +20% dmg', '+3 more shards, +10% dmg', '+4 shards, +15% dmg, shards home more aggressively'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.shatterPieces += 3; p.damage = Math.ceil(p.damage * 1.2) }
          else if (lvl === 2) { p.shatterPieces += 3; p.damage = Math.ceil(p.damage * 1.1) }
          else { p.shatterPieces += 4; p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
]

// Lightning path branch
const SIFRA_LIGHTNING_BRANCH: BranchDef = {
  name: 'Lightning', color: 0x9966ff,
  theme: 'The Bramauthroba gave her this. She intends to return it.',
  upgrades: [
    {
      id: 'sl1', label: 'Spark Initiate', icon: 'sl1_spark_initiate',
      desc: ['Cone: chain to 1 nearby foe within 8m at 60% dmg, +15% dmg', '+10% dmg, chain hits 2 targets', '+15% dmg, chain at 80% dmg instead'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasSparkInitiate = true; p.damage = Math.ceil(p.damage * 1.15) }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
        else { p.damage = Math.ceil(p.damage * 1.15) }
      },
    },
    {
      id: 'sl2', label: 'Arc Reach', icon: 'sl2_arc_reach',
      desc: ['Cone +50% wider, side-arc 40% dmg, +15 range', '+15 range, arc dmg increases to 60%', '+15 range, arc fires on both sides'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasArcReach = true; p.range += 15 }
        else if (lvl === 2) { p.range += 15 }
        else { p.range += 15 }
      },
    },
    {
      id: 'sl3', label: 'Overcharge', icon: 'sl3_overcharge',
      desc: ['~8% chance/frame: cone deals 3× dmg burst, +15% dmg', '+10% dmg, proc chance doubles', '+15% dmg + Ball Lightning orbit (zap 30% dmg/s)'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasOvercharge = true; p.damage = Math.ceil(p.damage * 1.15) }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
        else { p.damage = Math.ceil(p.damage * 1.15); p.hasBallLightning = true }
      },
    },
    {
      id: 'sl5', label: 'Storm Lord', icon: 'sl5_storm_lord', isUltimate: true,
      desc: ['Every 2s: random enemy struck for 2× dmg, +20% dmg', '+15% dmg, strikes 2 enemies at once', '+15% dmg, strike interval reduced to 1.5s'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasStormLord = true; p.damage = Math.ceil(p.damage * 1.2) }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
        else { p.damage = Math.ceil(p.damage * 1.15) }
      },
    },
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
    theme: 'A thousand years of patience, ended.',
    upgrades: [
      {
        id: 'aw1', label: 'Thorns', icon: 'aw1_thorns',
        desc: ['4 orbiting swords slash nearby foes', '+2 swords, +5% sword dmg', '+2 swords, +10% sword dmg'],
        apply: (p, lvl) => {
          p.hasThorns = true
          p.thornsLevel = lvl
          if (lvl === 2) p.thornsDmgBonus += 0.05
          else if (lvl === 3) p.thornsDmgBonus += 0.10
        },
      },
      {
        id: 'aw2', label: 'Wrath', icon: 'aw2_wrath',
        desc: ['When hit: AoE burst 60% dmg in 10m, +5% dmg', '+10% dmg, AoE radius +2m', '+10% dmg + Living Fortress: aura scales with HP%'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasWrath = true; p.damage = Math.ceil(p.damage * 1.05) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1); p.splashRadius += 20 }
          else { p.damage = Math.ceil(p.damage * 1.1); p.hasLivingFortress = true }
        },
      },
      {
        id: 'aw3', label: 'Consecration', icon: 'aw3_consecration',
        desc: ['Aura: pulse 40% dmg in 12m every 1.5s, +25 splash, +3 dmg', '+4 dmg, pulse rate increases to 1.2s', '+5 dmg, splash +20 + gains +30 max HP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.splashRadius += 25; p.damage += 3; p.dmgAuraActive = true }
          else if (lvl === 2) { p.damage += 4 }
          else { p.damage += 5; p.splashRadius += 20; p.maxHp += 30; p.hp += 30 }
        },
      },
      {
        id: 'aw5', label: 'Divine Judgment', icon: 'aw5_divine_judgment', isUltimate: true,
        desc: ['Auto-execute enemies below 15% HP in 12m range, +10% dmg', '+5% dmg, execute range doubled', '+15% dmg, execute threshold rises to 20% HP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasDivineJudgment = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.05) }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
  {
    name: 'Bastion', color: 0x4488ff,
    theme: 'The golem was built to endure. You\'ll see why.',
    upgrades: [
      {
        id: 'ab1', label: 'Fortify', icon: 'ab1_fortify',
        desc: ['+15% armor (cap 60%)\nreduce dmg taken and activate defense aura', '+15% more armor\nstacks with previous, stronger aura', '+10% armor\nIron Will: cap incoming hit at 10% maxHP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.armor = Math.min(0.6, p.armor + 0.15); p.defenseAuraActive = true }
          else if (lvl === 2) { p.armor = Math.min(0.6, p.armor + 0.1) }
          else { p.armor = Math.min(0.6, p.armor + 0.1); p.hasIronWill = true }
        },
      },
      {
        id: 'ab2', label: 'Aura of Might', icon: 'ab2_aura_of_might',
        desc: ['Orbiting shield deflects arrows, +3 dmg', '+3 dmg, +1 shield (2 total)', '+4 dmg, +2 shields (3 total) + low HP regen ×3'],
        apply: (p, lvl) => {
          p.hasPassiveAura = true
          p.passiveAuraLevel = lvl
          if (lvl === 1) { p.damage += 3 }
          else if (lvl === 2) { p.damage += 3; p.splashRadius += 20 }
          else { p.damage += 4; p.hasLowHpRegen = true }
        },
      },
      {
        id: 'ab3', label: 'Iron Will', icon: 'ab3_iron_will',
        desc: ['Any single hit capped at 10% max HP, +10% armor', '+10% more armor, regen +2 HP/s', '+10% armor, +2 HP/s + Undying revive at full HP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasIronWill = true; p.armor = Math.min(0.6, p.armor + 0.1) }
          else if (lvl === 2) { p.armor = Math.min(0.6, p.armor + 0.1); p.hpRegen += 2 }
          else { p.armor = Math.min(0.6, p.armor + 0.1); p.hpRegen += 2; p.rebirthStacks = Math.max(p.rebirthStacks, 1) }
        },
      },
      {
        id: 'ab5', label: 'Undying', icon: 'ab5_undying', isUltimate: true,
        desc: ['1 rebirth at full HP + shockwave, +30 max HP', '+30 max HP, shockwave 15m', '+40 max HP, 2 rebirths'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.rebirthStacks = Math.max(p.rebirthStacks, 1); p.maxHp += 30; p.hp += 30 }
          else if (lvl === 2) { p.maxHp += 30; p.hp += 30 }
          else { p.rebirthStacks = 2; p.maxHp += 40; p.hp += 40 }
        },
      },
    ],
  },
  {
    name: 'Quake', color: 0xffcc44,
    theme: 'The Amunat wastes remember every earthquake. Make more.',
    upgrades: [
      {
        id: 'aq1', label: "Titan's Pulse", icon: 'aq1_titans_pulse',
        desc: ["Unlock stance toggle (Q): melee / quake. Boulder 30m, +5 dmg", '+5 dmg, shockwave boulder splits into 2', '+5 dmg, boulder AoE splash +20'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasQuakeStance = true; p.hasTitansPulse = true; p.damage += 5; p.splashRadius += 15 }
          else if (lvl === 2) { p.damage += 5 }
          else { p.damage += 5; p.splashRadius += 20 }
        },
      },
      {
        id: 'aq2', label: 'Earthquake', icon: 'aq2_earthquake',
        desc: ['Shockwave hit: stun enemies 0.8s, +10% dmg', '+10% dmg, stun duration 1.2s', '+10% dmg + Gravity Well: pull enemies every 2s'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasEarthquake = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1); p.hasGravityWell = true }
        },
      },
      {
        id: 'aq3', label: 'Colossus', icon: 'aq3_colossus',
        desc: ['Shockwave knockback 50m (vs 20m), +5 dmg', '+5 dmg, knockback pulls enemies in after rebound', '+5 dmg + Gravity Well: pull every 2s in 12m range'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasColossus = true; p.damage += 5 }
          else if (lvl === 2) { p.damage += 5 }
          else { p.damage += 5; p.hasGravityWell = true; p.range += 15 }
        },
      },
      {
        id: 'aq5', label: 'Cataclysm', icon: 'aq5_cataclysm', isUltimate: true,
        desc: ['2nd shockwave 60% dmg at 350ms delay, +15% dmg', '+10% dmg, 3rd shockwave 40% dmg at 700ms', '+15% dmg, all shockwaves 15% wider AoE'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasCataclysm = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
]

const KHASHIN_GALE_BRANCH: BranchDef = {
  name: 'Gale', color: 0x88DDFF,
  theme: 'Cut them apart before they know you were there.',
  upgrades: [
    {
      id: 'kw1', label: 'Razor Wind', icon: 'kw1_razor_wind',
      desc: ['Wind slash +25% dmg, pierces +1 target', '+15% dmg, slash width +20%', '+15% dmg, slash fires two waves per attack'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.damage = Math.ceil(p.damage * 1.25); p.windSlashPierce += 1 }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
        else { p.damage = Math.ceil(p.damage * 1.15) }
      },
    },
    {
      id: 'kw2', label: 'Gust Strike', icon: 'kw2_gust_strike',
      desc: ['Wind slash knocks back enemies 15m', 'Knockback stays at 15m, hit targets take +15% dmg', '+15% dmg + Cyclone Surge: Dust Devils +50% bigger'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasGustStrike = true }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
        else { p.damage = Math.ceil(p.damage * 1.15); p.hasCycloneSurge = true }
      },
    },
    {
      id: 'kw3', label: 'Dust Devil', icon: 'kw3_dust_devil',
      desc: ['Every 5th attack spawns a drifting tornado', 'Tornadoes last 1s longer, +10% dmg', '+10% dmg + Cyclone Surge: bigger + Eye of the Storm anchored tornado'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasDustDevil = true }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
        else { p.damage = Math.ceil(p.damage * 1.1); p.hasCycloneSurge = true; p.hasEyeOfTheStorm = true }
      },
    },
    {
      id: 'kw5', label: 'Eye of the Storm', icon: 'kw5_eye_of_the_storm', isUltimate: true,
      desc: ['Anchored tornado every 8s; +20% dmg', '+15% dmg, tornado lasts 2s longer', '+15% dmg, spawn 2 anchored tornadoes at once'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasEyeOfTheStorm = true; p.damage = Math.ceil(p.damage * 1.2) }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
        else { p.damage = Math.ceil(p.damage * 1.15) }
      },
    },
  ],
}

const KHASHIN_DUNE_BRANCH: BranchDef = {
  name: 'Dune', color: 0xE8A040,
  theme: 'The Pishane is a weapon. Use it.',
  upgrades: [
    {
      id: 'kd1', label: 'Choking Sand', icon: 'kd1_choking_sand',
      desc: ['Blinded enemies take +35% dmg', '+15% more dmg vs blinded, blind lasts 0.5s longer', '+10% dmg + Abrasion: blinded enemies -20% armor'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasChokingSand = true }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
        else { p.damage = Math.ceil(p.damage * 1.1); p.hasAbrasion = true }
      },
    },
    {
      id: 'kd2', label: 'Sand Armor', icon: 'kd2_sand_armor',
      desc: ['Absorb shield 25% max HP, regens 4s after break', 'Shield +10% max HP, regen timer -1s', '+10% max HP shield + Scarab Tide on break'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasSandArmor = true; (p as any)._sandArmorHP = Math.ceil(p.maxHp * 0.25); (p as any)._sandArmorMax = (p as any)._sandArmorHP; (p as any)._sandArmorRegenDelay = 0 }
        else if (lvl === 2) { (p as any)._sandArmorMax = Math.ceil(((p as any)._sandArmorMax || p.maxHp * 0.25) + p.maxHp * 0.1); (p as any)._sandArmorHP = (p as any)._sandArmorMax }
        else { (p as any)._sandArmorMax = Math.ceil(((p as any)._sandArmorMax || p.maxHp * 0.25) + p.maxHp * 0.1); (p as any)._sandArmorHP = (p as any)._sandArmorMax; p.hasScarabTide = true }
      },
    },
    {
      id: 'kd3', label: 'Abrasion', icon: 'kd3_abrasion',
      desc: ['Blinded enemies -20% armor; +3 dmg', '+4 dmg, armor reduction deepens to -35%', '+5 dmg + Scarab Tide: on kill 4 seeking blind scarabs'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasAbrasion = true; p.damage += 3 }
        else if (lvl === 2) { p.damage += 4 }
        else { p.damage += 5; p.hasScarabTide = true }
      },
    },
    {
      id: 'kd5', label: 'Sandstorm Wall', icon: 'kd5_sandstorm_wall', isUltimate: true,
      desc: ['Haboob arcs spawn lingering sand clouds', 'Clouds linger 2s longer, +10% dmg', '+15% dmg, clouds apply Blind to all who enter'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasSandstormWall = true }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
        else { p.damage = Math.ceil(p.damage * 1.15) }
      },
    },
  ],
}

const KHASHIN_MIRAGE_BRANCH: BranchDef = {
  name: 'Mirage', color: 0xCCAAFF,
  theme: 'Be somewhere else. Always somewhere else.',
  upgrades: [
    {
      id: 'km1', label: 'Tailwind', icon: 'km1_tailwind',
      desc: ['+20 speed, +10% attack speed', '+15 speed, +10% attack speed', '+15 speed, +10% attack speed + Drift: leave slow trails while moving'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.speed += 20; p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.9)) }
        else if (lvl === 2) { p.speed += 15; p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.9)) }
        else { p.speed += 15; p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.9)); p.hasDrift = true }
      },
    },
    {
      id: 'km2', label: 'Phantom Step', icon: 'km2_phantom_step',
      desc: ['Auto-dash 10m away every 6s', 'Dash CD reduced to 4s, +15 speed', '+10 speed + Mirage: dash leaves a decoy for 2s'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasPhantomStep = true }
        else if (lvl === 2) { p.speed += 15 }
        else { p.speed += 10; p.hasMirage = true }
      },
    },
    {
      id: 'km3', label: 'Mirage', icon: 'km3_mirage',
      desc: ['Phantom Step leaves a decoy for 2s', 'Decoy lasts 3s, attacks enemies for 30% dmg', 'Decoy lasts 4s + Desert Wind burst every 10s'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasMirage = true }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
        else { p.hasDesertWind = true }
      },
    },
    {
      id: 'km5', label: 'Desert Wind', icon: 'km5_desert_wind', isUltimate: true,
      desc: ['Every 10s: 18m wind burst + 3s DR', 'Burst radius +5m, DR extends to 5s', '+15% dmg, burst knocks back all enemies 20m'],
      apply: (p, lvl) => {
        if (lvl === 1) { p.hasDesertWind = true }
        else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
        else { p.damage = Math.ceil(p.damage * 1.15) }
      },
    },
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
    theme: 'Hit the ground hard enough. Everything shatters.',
    upgrades: [
      {
        id: 'cm1', label: 'Coarse Cut', icon: 'cm1_coarse_cut',
        desc: ['Crystal wave cone +15° wider', 'Cone +15° wider (total +30°), +5% dmg', '+5% dmg, cone waves pierce through walls'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.crystalWaveConeAngle += 15 }
          else if (lvl === 2) { p.crystalWaveConeAngle += 15; p.damage = Math.ceil(p.damage * 1.05) }
          else { p.damage = Math.ceil(p.damage * 1.05) }
        },
      },
      {
        id: 'cm2', label: 'Deep Vein', icon: 'cm2_deep_vein',
        desc: ['Spikes +30% dmg at max range', '+15% dmg at all ranges', '+15% dmg + Crystal Shrapnel: spikes spray 3 shards on death'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasDeepVein = true }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
          else { p.damage = Math.ceil(p.damage * 1.15); p.hasCrystalShrapnel = true }
        },
      },
      {
        id: 'cm3', label: 'Shardstorm', icon: 'cm3_shardstorm',
        desc: ['Double wave per slam', '+10% dmg, waves stagger by 0.15s', '+10% dmg + Crystal Shrapnel: spikes spray shards on death'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasShardstorm = true }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1); p.hasCrystalShrapnel = true }
        },
      },
      {
        id: 'cm5', label: 'Tectonic Fury', icon: 'cm5_tectonic_fury', isUltimate: true,
        desc: ['Every 5th slam: crystal eruption ring', 'Eruption ring radius +3m, +15% dmg', '+15% dmg, eruption chains to 2 nearby enemies'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasTectonicFury = true }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
  {
    name: 'Geode Shell', color: 0x99DDCC,
    theme: 'Dense. Close to the ground. Hard to kill.',
    upgrades: [
      {
        id: 'cr1', label: 'Stone Skin', icon: 'cr1_stone_skin',
        desc: ['On hit: +5% armor, +5 speed, +5% size. Max 5 stacks', 'Max stacks increase to 7', 'Max stacks 7 + Resonance Armor: 0.5s invuln on wave impact'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasStoneSkin = true }
          else if (lvl === 2) { /* expanded stacks handled at runtime */ }
          else { p.hasResonanceArmor = true }
        },
      },
      {
        id: 'cr2', label: 'Geode Shell', icon: 'cr2_geode_shell',
        desc: ['Below 50% HP: absorb next hit, 20s CD', 'CD reduced to 14s', 'CD 14s + Resonance Armor: wave impact grants 0.5s invuln'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasGeodeShell = true }
          else if (lvl === 2) { /* shorter CD handled at runtime */ }
          else { p.hasResonanceArmor = true }
        },
      },
      {
        id: 'cr3', label: 'Crystal Wall', icon: 'cr3_crystal_wall',
        desc: ['Barrier every 8s blocking enemies', 'Barrier every 6s, wall lasts longer', 'Barrier every 5s + Living Geode: +25 HP, melee reflect 15 dmg'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasCrystalWall = true }
          else if (lvl === 2) { /* shorter CD handled at runtime */ }
          else { p.hasLivingGeode = true; p.maxHp += 25; p.hp += 25 }
        },
      },
      {
        id: 'cr5', label: 'Living Geode', icon: 'cr5_living_geode', isUltimate: true,
        desc: ['+25 HP, melee reflect 15 dmg', '+25 HP, reflect increases to 25 dmg', '+30 HP, reflect 25 dmg + wall reflects projectiles'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasLivingGeode = true; p.maxHp += 25; p.hp += 25 }
          else if (lvl === 2) { p.maxHp += 25; p.hp += 25 }
          else { p.maxHp += 30; p.hp += 30 }
        },
      },
    ],
  },
  {
    name: 'Deep Seam', color: 0xCC99FF,
    theme: 'Every inch of ground becomes a hazard. Welcome to the mine.',
    upgrades: [
      {
        id: 'cf1', label: 'Planted Shard', icon: 'cf1_planted_shard',
        desc: ['Slams leave crystal mines', 'Mines deal +30% more dmg', '+20% mine dmg + Fault Line: slams carve 4s ground hazard'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasPlantedShard = true }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1); p.hasFaultLine = true }
        },
      },
      {
        id: 'cf2', label: 'Crystal Pillar', icon: 'cf2_crystal_pillar',
        desc: ['Auto pillar every 12s', 'Pillar CD reduced to 8s', 'Pillar CD 8s + Resonance Field: structures slow enemies 20%'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasCrystalPillar = true }
          else if (lvl === 2) { /* shorter CD handled at runtime */ }
          else { p.hasResonanceField = true }
        },
      },
      {
        id: 'cf3', label: 'Fault Line', icon: 'cf3_fault_line',
        desc: ['Wave carves 4s ground hazard', 'Hazard lasts 6s, +10% dmg', '+10% dmg + Resonance Field: structures slow enemies 20%'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasFaultLine = true }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1); p.hasResonanceField = true }
        },
      },
      {
        id: 'cf5', label: 'The Mother Lode', icon: 'cf5_mother_lode', isUltimate: true,
        desc: ['Massive crystal eruption every 12s', '+15% dmg, eruption interval 10s', '+15% dmg, eruption spawns 3 Planted Shards'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasMotherLode = true }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
]

const HUNTRESS_BRANCHES: BranchDef[] = [
  {
    name: 'Predator', color: 0xff4444,
    theme: 'First you mark them. Then you hunt them.',
    upgrades: [
      {
        id: 'hp1', label: 'Critical Strike', icon: 'g1_sharp_edge',
        desc: ['20% chance to deal 2× dmg, +10% dmg', '+10% dmg, crit chance rises to 30%', '+10% dmg + Headhunter: auto-execute below 15% HP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasCriticalStrike = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1); p.hasHeadhunter = true }
        },
      },
      {
        id: 'hp2', label: 'Marked Target', icon: 'g3_eagle_eye',
        desc: ['Hit marks enemy 5s; marked take +25% dmg, +3 dmg', '+3 dmg, mark lasts 8s, +25% dmg vs marked', '+4 dmg, marks spread to adjacent enemies on kill'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasMarkedTarget = true; p.damage += 3 }
          else if (lvl === 2) { p.damage += 3 }
          else { p.damage += 4 }
        },
      },
      {
        id: 'hp3', label: 'Battle Frenzy', icon: 'g4_quick_hands',
        desc: ['On kill: +10% attack speed for 5s, +3 dmg', '+3 dmg, frenzy duration 8s', '+4 dmg + Headhunter: auto-execute enemies below 15% HP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasBattleFrenzy = true; p.damage += 3 }
          else if (lvl === 2) { p.damage += 3 }
          else { p.damage += 4; p.hasHeadhunter = true }
        },
      },
      {
        id: 'hp5', label: 'Volley', icon: 'g9_multistrike', isUltimate: true,
        desc: ['Every 5th spear: fires 3 at once (extra 60% dmg), +10% dmg', '+10% dmg, volley fires 4 spears instead of 3', '+10% dmg, volley threshold drops to every 4th spear'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasVolley = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1) }
        },
      },
    ],
  },
  {
    name: 'Stalker', color: 0x44cc44,
    theme: 'The desert teaches patience. Lyra has plenty.',
    upgrades: [
      {
        id: 'hs1', label: 'Kill Stride', icon: 'g2_swift_feet',
        desc: ['On kill: +20% speed for 3s, +10 speed', '+10 speed, stride duration 5s', '+10 speed + Camouflage: invisible 2s after kill'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasKillStride = true; p.speed += 10 }
          else if (lvl === 2) { p.speed += 10 }
          else { p.speed += 10; p.hasCamouflage = true }
        },
      },
      {
        id: 'hs2', label: 'Caltrops', icon: 'ns3_smoke_bomb',
        desc: ['Moving: drop 2m spike zone every 800ms, 15% dmg/tick, +3 dmg', '+3 dmg, zones last 1s longer', '+4 dmg + Net Throw: every 8th spear roots enemies 1.5s'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasCaltrops = true; p.damage += 3 }
          else if (lvl === 2) { p.damage += 3 }
          else { p.damage += 4; p.hasNetThrow = true }
        },
      },
      {
        id: 'hs3', label: 'Net Throw', icon: 'nv1_toxic_slash',
        desc: ['Every 8th spear roots enemies 1.5s, +3 dmg', '+3 dmg, root duration 2.5s', '+4 dmg + Camouflage: invisible 2s after kill'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasNetThrow = true; p.damage += 3 }
          else if (lvl === 2) { p.damage += 3 }
          else { p.damage += 4; p.hasCamouflage = true }
        },
      },
      {
        id: 'hs5', label: 'Leap', icon: 'ns2_phantom_trail', isUltimate: true,
        desc: ['Auto-leap 12m away when 4+ enemies within 5m, 4s CD, +15 speed', '+15 speed, leap CD 2.5s', '+15 speed, leap knocks away nearby enemies on landing'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasLeap = true; p.speed += 15 }
          else if (lvl === 2) { p.speed += 15 }
          else { p.speed += 15 }
        },
      },
    ],
  },
  {
    name: 'Warden', color: 0x4488ff,
    theme: 'One spear. One line through the horde.',
    upgrades: [
      {
        id: 'hw1', label: 'Heavy Spear', icon: 'sc3_mirror_ice',
        desc: ['Spears +40% dmg and knock enemies back, +5 dmg', '+5 dmg, knockback distance doubles', '+5 dmg + Explosive Tips: spears explode on pierce'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasHeavySpear = true; p.damage = Math.ceil(p.damage * 1.4) }
          else if (lvl === 2) { p.damage += 5 }
          else { p.damage += 5; p.hasExplosiveTips = true }
        },
      },
      {
        id: 'hw2', label: 'Explosive Tips', icon: 'if1_wide_burn',
        desc: ['On first spear pierce: AoE 35% dmg in 4m, +15 splash', '+15 splash, AoE dmg increases to 50%', '+15 splash + Splinter Shot: miss spawns 3 shards 30% dmg'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasExplosiveTips = true; p.splashRadius += 15 }
          else if (lvl === 2) { p.splashRadius += 15 }
          else { p.splashRadius += 15; p.hasSplinterShot = true }
        },
      },
      {
        id: 'hw3', label: 'Splinter Shot', icon: 'ss2_shatter',
        desc: ['Spear miss: spawns 3 shards 30% dmg in 8m, +4 dmg', '+4 dmg, shards home toward nearest enemy', '+5 dmg + Spear Wall: 3 orbiting spears 20% dmg/s each'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasSplinterShot = true; p.damage += 4 }
          else if (lvl === 2) { p.damage += 4 }
          else { p.damage += 5; p.hasSpearWall = true }
        },
      },
      {
        id: 'hw5', label: 'Earth Slam', icon: 'aq2_earthquake', isUltimate: true,
        desc: ['Melee: shockwave line 15m, 60% dmg, +20% dmg', '+15% dmg, shockwave width doubles', '+15% dmg, shockwave ricochets off walls once'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasEarthSlam = true; p.damage = Math.ceil(p.damage * 1.2) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
          else { p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
    ],
  },
]

// ============================================================
// VAEL — Pale Doctor
// ============================================================
const VAEL_BRANCHES: BranchDef[] = [
  {
    name: 'Pale Harvest', color: 0xcbd5e1,
    theme: 'Life through killing. Up to 20% lifesteal on hit, 10% per drain tick, 11 armor stacks (up to 11% less damage taken). Ultimate: 12s feeding window, 22% max HP per kill.',
    upgrades: [
      {
        id: 'ph1', label: 'Hollow Touch', icon: 'ph1_hollow_touch',
        desc: [
          'Attacks heal you\nOrbs: 8% on hit · Drain: 4% per tick',
          'Stronger lifesteal\nOrbs: heal 14% on hit\nDrain: heal 7% per tick\n+1 HP per armor stack gained',
          'Maximum harvest\nOrbs: heal 20%, overkill heals at half rate\nDrain: heal 10% per tick\nCollecting a bone heals +3 HP',
        ],
        apply: (p, lvl) => {
          p.hasHollowTouch = true
          p.hollowTouchRate = [0.08, 0.14, 0.20][lvl - 1]
          p.hollowTouchDrainRate = [0.04, 0.07, 0.10][lvl - 1]
          p.hollowTouchArmorHeal = lvl >= 2
          p.hollowTouchBoneHeal = lvl >= 3
          p.hollowTouchOverkillHalf = lvl >= 3
        },
      },
      {
        id: 'ph2', label: 'Soul Siphon', icon: 'ph2_soul_siphon',
        desc: [
          'Kills drop bones — shield stacks\nEach stack absorbs 2 damage · Orbs: 35% · Drain: always',
          'Stronger bones\nOrbs: 50% chance, +10 HP on pickup\nDrain: 2 bones per kill · Max stacks +2 (10)',
          'Bone mastery\nOrbs: auto-collect within 1.5m\nDrain: 15% extra chance · Max stacks +3 (11)',
        ],
        apply: (p, lvl) => {
          p.hasSoulSiphon = true
          p.soulSiphonDropChance = [0.35, 0.50, 0.50][lvl - 1]
          p.soulSiphonMaxStacks = [8, 10, 11][lvl - 1]
          p.soulSiphonDrainAlwaysDrop = true
          p.soulSiphonDrainKillCount = lvl >= 2 ? 2 : 1
          p.soulSiphonBoneHeal = lvl >= 2 ? 10 : 0
          p.soulSiphonAutoCollectRadius = lvl >= 3 ? 60 : 0
          p.soulSiphonExtraDropChance = lvl >= 3 ? 0.15 : 0
        },
      },
      {
        id: 'ph3', label: 'Wound Memory', icon: 'ph3_wound_memory',
        desc: [
          'Soul Bolts root enemies on hit\nRooted: +20% damage taken, 0.7s',
          'Deeper roots\nRooted enemies take +30% damage, root 0.9s\nRe-rooting within 4s gives +1 free armor stack',
          'Nothing escapes\nEnemies hit in last 3s take +20% bonus damage\nRoot duration 1.1s',
        ],
        apply: (p, lvl) => {
          p.hasWoundMemory = true
          p.woundMemoryBonus = [0.20, 0.30, 0.40][lvl - 1]
          p.woundMemoryRootDur = [700, 900, 1100][lvl - 1]
          p.woundMemoryFreeArmorOnRepeat = lvl >= 2
          p.woundMemoryRecentHitWindow = lvl >= 3 ? 3000 : 0
        },
      },
      {
        id: 'ph4', label: 'Exsanguination', icon: 'ph4_exsanguination',
        desc: [
          '◉ Soul Orbs: Soul Bolt chains to 2 nearby enemies (60% damage)\n✦ Lifedrain: tendril range +20%',
          '◉ Soul Orbs: chains to 3 enemies (65% damage)\n✦ Lifedrain: tendril range +35%, +10% tick damage',
          '◉ Soul Orbs: chains to 3 (70%); a second arc fires 0.5s later\n✦ Lifedrain: tendril range +45%; second arc also heals',
        ],
        apply: (p, lvl) => {
          p.hasExsanguination = true
          p.exsangChainCount = lvl >= 2 ? 3 : 2
          p.exsangDmgPct = [0.60, 0.65, 0.70][lvl - 1]
          p.exsangRangeBonus = [20, 40, 50][lvl - 1]
          p.exsangDoubleArc = lvl >= 3
          p.exsangDrainTickDmgBonus = lvl >= 2 ? 0.10 : 0
          // TODO(vael): exsangDrainChainAnchor stub — post-merge polish
          p.exsangDrainSecondArcLifesteal = lvl >= 3
        },
      },
      {
        id: 'ph5', label: 'Sanguine Ascendancy', icon: 'ph5_sanguine_ascendancy', isUltimate: true,
        desc: [
          'Auto-cast every 25s: opens a 6s feeding window\n◉ Soul Orbs: kills restore 12% max HP\n✦ Lifedrain: 20% heal per tick',
          'Window extends to 9s\n◉ Soul Orbs: kills restore 18% max HP; bones auto-arc to Vael\n✦ Lifedrain: 28% heal; tick rate doubles',
          '12s window\n◉ Soul Orbs: kills restore 22% max HP; 40% damage reduction if below 30% HP\n✦ Lifedrain: 35% heal per tick (capped at 25 HP total)',
        ],
        apply: (p, lvl) => {
          p.hasSanguineAscendancy = true
          p.sanguineWindowDuration = [6000, 9000, 12000][lvl - 1]
          p.sanguineHealPct = [0.12, 0.18, 0.22][lvl - 1]
          p.sanguineInstantOrbs = lvl >= 2
          p.sanguineLowHpDR = lvl >= 3
          p.sanguineDrainTickPct = [0.20, 0.28, 0.35][lvl - 1]
          p.sanguineDrainTickRateDouble = lvl >= 2
          p.sanguineDrainHealCapPerTick = lvl >= 3 ? 25 : 0
          p.sanguineBonesAutoArc = lvl >= 2
          // TODO(vael): sanguineBonesPulseArmor stub — post-merge polish
        },
      },
    ],
  },
  {
    name: 'Ossuary', color: 0xfde68a,
    theme: 'Raise the dead. Command up to 5 Zombies that buff your attack speed and damage. The horde grows with every kill.',
    upgrades: [
      {
        id: 'os1', label: 'Risen', icon: 'os1_risen',
        desc: [
          'Kills raise Zombies that fight for you\nOrbs: 25% chance, 4s · Drain: 40% chance',
          'Stronger zombies\nOrbs: 35% chance, 6s lifetime, 35% of your damage\nDrain: 55% chance, zombies auto-target enemies',
          'Zombie army\nOrbs: 45% chance, 8s lifetime, 40% damage, max 3\nDrain: 65% chance, zombies gain +20% HP',
        ],
        apply: (p, lvl) => {
          p.hasRisen = true
          p.risenProcChance = [0.25, 0.35, 0.45][lvl - 1]
          p.risenDrainProcChance = [0.40, 0.55, 0.65][lvl - 1]
          p.risenDuration = [4000, 6000, 8000][lvl - 1]
          p.risenDmgPct = [0.30, 0.35, 0.40][lvl - 1]
          p.risenMaxThralls = lvl >= 3 ? 3 : 999
          p.risenDrainAutoTarget = lvl >= 2
          p.risenDrainHPBonus = lvl >= 3 ? 0.20 : 0
          // TODO(vael): risenDrainOrbit stub — post-merge polish
        },
      },
      {
        id: 'os2', label: 'Grave Pact', icon: 'os2_grave_pact',
        desc: [
          '✦ Lifedrain: Zombies gain +20% HP\n+1 flat damage per tick per active Zombie\nEach Zombie reduces drain cost by 5%',
          '✦ Lifedrain: Zombies gain +40% HP\nEach nearby Zombie extends tendril reach\nZombies burst on death (1m radius, 60% damage)',
          '✦ Lifedrain: Zombies gain +60% HP\nZombies act as relay points, extending tendril reach further\nDeath burst also roots enemies 0.4s',
        ],
        apply: (p, lvl) => {
          p.hasGravePact = true
          p.gravePactHPBonus = [0.20, 0.40, 0.60][lvl - 1]
          p.gravePactDrainFlatDmg = true
          p.gravePactDrainEnergyReduc = 0.05
          p.gravePactDrainReachPerThrall = lvl >= 2 ? 15 : 0
          p.gravePactDeathBurst = lvl >= 2
          p.gravePactBurstDmgPct = 0.60
          p.gravePactBurstRadiusBonus = lvl >= 3 ? 20 : 0
          p.gravePactDeathRoot = lvl >= 3
          p.gravePactDrainRelayBonus = lvl >= 3 ? 30 : 0
        },
      },
      {
        id: 'os3', label: 'Undying Labor', icon: 'os3_undying_labor',
        desc: [
          '+5% attack speed per active Zombie (max +15%)\n+4% damage per Zombie',
          '+7% attack speed per Zombie (max +21%)\n+6% damage per Zombie\nZombies last 2s longer',
          '+9% attack speed per Zombie (max +27%)\n+8% damage per Zombie',
        ],
        apply: (p, lvl) => {
          p.hasUndyingLabor = true
          p.undyingLaborAtkSpeedPct = [0.05, 0.07, 0.09][lvl - 1]
          p.undyingLaborDmgBonus = [0.04, 0.06, 0.08][lvl - 1]
          if (lvl >= 2) p.risenDuration += 2000
          p.undyingLaborStanceSwitchDiscount = lvl >= 3 ? 0.15 : 0
        },
      },
      {
        id: 'os4', label: 'Charnel Tide', icon: 'os4_charnel_tide',
        desc: [
          'Auto-cast: raise up to 5 corpses within 6m as Zombies (8s lifetime, 20s cooldown)\n◉ Soul Orbs: each raised Zombie also drops a bone\n✦ Lifedrain: raised Zombies instantly draw tendril fire',
          '7.5m radius, up to 6 Zombies, 10s lifetime (18s cooldown)\n◉ Soul Orbs: raised Zombies deal +15% damage\n✦ Lifedrain: tendril range boosted 4s after cast',
          '7.5m, 6 Zombies, 10s (16s cooldown)\nSurviving Zombies explode on expiry (80% damage, 1.5m radius)\n◉ Soul Orbs: explosions drop 2 bones each\n✦ Lifedrain: explosions apply 1 Rot stack',
        ],
        apply: (p, lvl) => {
          p.hasCharnelTide = true
          p.charnelTideRadius = lvl >= 2 ? 300 : 250
          p.charnelTideMax = lvl >= 2 ? 6 : 5
          p.charnelTideDuration = lvl >= 2 ? 10000 : 8000
          p.charnelTideCooldown = [20000, 18000, 16000][lvl - 1]
          p.charnelTideExplode = lvl >= 3
          p.charnelTideOrbsBoneDrop = true
          p.charnelTideOrbsDmgBonus = lvl >= 2 ? 0.15 : 0
          p.charnelTideDrainRangeBoost = lvl >= 2 ? 10 : 0
          p.charnelTideExplodeBoneDrop = lvl >= 3 ? 2 : 0
          p.charnelTideExplodeRot = lvl >= 3
        },
      },
      {
        id: 'os5', label: 'Undying Horde', icon: 'os5_lich_dominion', isUltimate: true,
        desc: [
          'Zombies become permanent\nMax 4 Zombies. On death: reform after 8s',
          'Max 5 Zombies, +30% zombie damage\nNearby zombies heal Vael 1 HP/s',
          'On zombie death: explosion + free Charnel Tide\nZombies gain +50% HP',
        ],
        apply: (p, lvl) => {
          p.hasUndyingHorde = true
          p.risenDuration = 999999
          p.risenMaxThralls = lvl >= 2 ? 5 : 4
          p.undyingHordeReformTime = [8000, 8000, 8000][lvl - 1]
          p.undyingHordeDmgBonus = lvl >= 2 ? 0.30 : 0
          p.undyingHordeHealPerSec = lvl >= 2 ? 1 : 0
          p.undyingHordeDeathExplosion = lvl >= 3
          p.undyingHordeCharnelOnDeath = lvl >= 3
          p.undyingHordeHPBonus = lvl >= 3 ? 0.50 : 0
        },
      },
    ],
  },
  {
    name: 'Wasting Plague', color: 0x84cc16,
    theme: 'Rot stacks make enemies take up to 25% more damage. Blight Pools (max 4) deal 20% damage per second. Permanent 6m aura weakens enemies 10%.',
    upgrades: [
      {
        id: 'wp1', label: 'Festering Wound', icon: 'wp1_festering_wound',
        desc: [
          'Attacks apply Rot stacks to enemies\n3+ Rot: +15% damage taken · Drain applies every 2 ticks',
          'Rot spreads deeper\nOrbs: 3+ stacks take +20% damage, Rot decays 1 per 3s\nDrain: applies 1 Rot every tick',
          'Plague carrier\nOrbs: 2 Rot per hit, 6+ stacks slow enemies 15%\nDrain: 5+ stacks trigger 10% damage burst per tick',
        ],
        apply: (p, lvl) => {
          p.hasFesteringWound = true
          p.festeringWoundStacks = lvl >= 3 ? 2 : 1
          p.festeringWoundDmgBonus = [0.15, 0.20, 0.25][lvl - 1]
          p.rotSlowDecay = lvl >= 2
          p.rotSlow = lvl >= 3
          p.festeringDrainEveryNTicks = lvl >= 2 ? 1 : 2
          p.festeringDrainBurstOnHigh = lvl >= 3
        },
      },
      {
        id: 'wp2', label: 'Virulent Spread', icon: 'wp2_virulent_spread',
        desc: [
          'On kill: Rot stacks transfer to enemies within 2m (10% damage per stack burst)\n✦ Lifedrain: tendril-kills also re-anchor drain to nearest recipient',
          'Transfer radius 2.75m, 15% damage per stack\n◉ Soul Orbs: bolt-kills spread to 2 targets simultaneously\n✦ Lifedrain: re-anchor lasts 1.5s',
          'Transfer radius 3.5m, 15% per stack; 4+ stacks stun enemies 0.5s\n◉ Soul Orbs: stunned enemies drop a bonus bone',
        ],
        apply: (p, lvl) => {
          p.hasVirulentSpread = true
          p.virulentSpreadRadius = [80, 110, 140][lvl - 1]
          p.virulentDmgPerStack = [0.10, 0.15, 0.15][lvl - 1]
          p.virulentStunAt = lvl >= 3 ? 4 : 999
          p.virulentOrbsMultiTarget = lvl >= 2
          // TODO(vael): virulentDrainReAnchor / virulentDrainReAnchorLong / virulentStunFreezeCost stubs — post-merge polish
          p.virulentStunBonusBone = lvl >= 3
        },
      },
      {
        id: 'wp3', label: 'Necrotic Bloom', icon: 'wp3_necrotic_bloom',
        desc: [
          'Enemies dying with 5+ Rot stacks leave a Blight Pool (2.5m radius, 12% damage per second, 5s, max 4 active)\n✦ Lifedrain: tendrils in a Pool deal +20% damage',
          'Threshold 4 stacks; Pools last 7s, 16% damage per second\n✦ Lifedrain: enemies in Pools take doubled tendril tick rate',
          'Threshold 3 stacks; Pools last 8s, 20% damage per second\n◉ Soul Orbs: Soul Bolt hitting a Pool detonates it (+30% damage, 0.3s root)\n✦ Lifedrain: bones dropped in Pools grant 2 armor instead of 1',
        ],
        apply: (p, lvl) => {
          p.hasNecroticBloom = true
          p.necroticBloomThreshold = [5, 4, 3][lvl - 1]
          p.necroticBloomDuration = [5000, 7000, 8000][lvl - 1]
          p.necroticBloomDmgPct = [0.12, 0.16, 0.20][lvl - 1]
          p.necroticBloomAddRot = false
          p.necroticBloomMaxPools = 4
          p.necroticBloomDrainDmgBonus = 0.20
          p.necroticBloomDrainDoubleTick = lvl >= 2
          p.necroticBloomOrbsDetonate = lvl >= 3
          p.necroticBloomDrainBoneArmor = lvl >= 3
        },
      },
      {
        id: 'wp4', label: 'Pandemic', icon: 'wp4_pandemic',
        desc: [
          'Auto-cast: 5m miasma ring applies 5 Rot stacks (18s cooldown)\n◉ Soul Orbs: hit enemies drop a bone on next death\n✦ Lifedrain: tendril range boosted for 3s after cast',
          '6m radius; second pulse 2s later adds +3 Rot (16s cooldown)\n◉ Soul Orbs: 100% bone drop during boost window\n✦ Lifedrain: boost window lasts 6s, +15% tick rate',
          '7m radius (14s cooldown)\n◉ Soul Orbs: pool detonations inside cloud cover double radius\n✦ Lifedrain: drain costs no energy during boost window',
        ],
        apply: (p, lvl) => {
          p.hasVaelPandemic = true
          p.pandemicRadius = [200, 240, 280][lvl - 1]
          p.pandemicCooldown = [18000, 16000, 14000][lvl - 1]
          p.pandemicDoublePulse = lvl >= 2
          p.pandemicDoubleRadiusBlight = lvl >= 3
          p.pandemicRangeBoostDuration = lvl >= 2 ? 6000 : 3000
          p.pandemicOrbsBoneOnNextDeath = true
          p.pandemicOrbsBoneOnKill = lvl >= 2
          p.pandemicTendrilTickRateBoost = lvl >= 2 ? 0.15 : 0
          p.pandemicDrainFreeCost = lvl >= 3
        },
      },
      {
        id: 'wp5', label: 'Carrion Crown', icon: 'wp5_carrion_crown', isUltimate: true,
        desc: [
          'Passive aura 3.75m: enemies gain 1 Rot stack every 2s\n◉ Soul Orbs: aura-marked enemies gain +1 bonus stack on bolt hit\n✦ Lifedrain: −10% drain cost on aura-marked enemies',
          'Aura 5m, 1 stack per 1.5s; stacks persist after leaving\n◉ Soul Orbs: aura-marked enemies take +10% bolt damage\n✦ Lifedrain: tendril tick rate +5% per Rot stack (max +30%)',
          'Aura 6m, 1 stack per second\nAura enemies deal 10% less damage\nOn kill: 10m pulse applies 3 Rot stacks\n◉ Soul Orbs: pulse detonates all active Pools (15% damage)\n✦ Lifedrain: pulse grants +20 drain energy',
        ],
        apply: (p, lvl) => {
          p.hasCarrionCrown = true
          p.carrionAuraRadius = [150, 200, 240][lvl - 1]
          p.carrionAuraInterval = [2000, 1500, 1000][lvl - 1]
          p.carrionWeaken = lvl >= 3
          p.carrionKillPulse = lvl >= 3
          // carrionRetainStacks: stacks already persist naturally (rot decay-based), flag not needed
          p.carrionOrbsBonusStack = true
          p.carrionDrainCostReduc = 0.10
          p.carrionOrbsDmgBonus = lvl >= 2 ? 0.10 : 0
          // TODO(vael): carrionDrainScaleWithStacks stub — post-merge polish
          p.carrionOrbsKillPulseBlight = lvl >= 3
          p.carrionDrainKillPulseEnergy = lvl >= 3
        },
      },
    ],
  },
]

// ============================================================
// NIGHTBORNE BRANCHES — Void Blade hero
// IDs: vb* (Void Blade), vp* (Phantom), vr* (Rift) — avoids collision with Nazar nb/ns/nv
// ============================================================
const NIGHTBORNE_BRANCHES: BranchDef[] = [
  {
    name: 'Void Blade', color: 0x9933FF,
    theme: 'Pure offensive escalation — deeper cut, wider arc, void energy overload.',
    upgrades: [
      {
        id: 'vb1', label: 'Void Edge', icon: 'vb1_void_edge',
        desc: ['+20% dmg; arc range → 105px', '+35% dmg total; range → 115px', '+50% dmg total; range → 130px; crescent lingers 0.3s'],
        branch: 'Void Blade', branchColor: 0x9933FF,
        apply: (p, lvl) => {
          p.hasVoidEdge = true
          p.voidEdgeLevel = lvl
          if (lvl === 1) { p.damage = Math.ceil(p.damage * 1.20); p.voidArcRange = 105 }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.146); p.voidArcRange = 115 }
          else { p.damage = Math.ceil(p.damage * 1.107); p.voidArcRange = 130 }
        },
      },
      {
        id: 'vb2', label: 'Cleave', icon: 'vb2_cleave',
        desc: ['Arc angle → 190°', 'Arc → 220°; +10% dmg to outer-edge enemies', 'Arc → 270°; outer-edge dmg bonus +20%'],
        branch: 'Void Blade', branchColor: 0x9933FF,
        apply: (p, lvl) => {
          p.hasCleave = true
          if (lvl === 1) { p.voidArcAngle = 190 }
          else if (lvl === 2) { p.voidArcAngle = 220; p.voidCleaveEdgeBonus = 0.10 }
          else { p.voidArcAngle = 270; p.voidCleaveEdgeBonus = 0.20 }
        },
      },
      {
        id: 'vb3', label: 'Void Surge', icon: 'vb3_void_surge',
        desc: ['Every 4th attack: void ring (140px, 60% dmg)', 'Ring → 180px, 80% dmg; every 3rd attack', 'Ring → 220px, 100% dmg; surge leaves slow zone'],
        branch: 'Void Blade', branchColor: 0x9933FF,
        apply: (p, lvl) => {
          p.hasVoidSurge = true
          p.voidSurgeLevel = lvl
          if (lvl === 1) { p.voidSurgeRadius = 140; p.voidSurgeDmgPct = 0.60; p.voidSurgeEvery = 4 }
          else if (lvl === 2) { p.voidSurgeRadius = 180; p.voidSurgeDmgPct = 0.80; p.voidSurgeEvery = 3 }
          else { p.voidSurgeRadius = 220; p.voidSurgeDmgPct = 1.00 }
        },
      },
      {
        id: 'vb4', label: 'Dark Resonance', icon: 'vb4_dark_resonance',
        desc: ['2nd hit within 1.5s → resonance burst (40px, 50% dmg)', 'Burst → 60px, 70% dmg', 'Burst → 80px, 100% dmg; 0.4s stagger'],
        branch: 'Void Blade', branchColor: 0x9933FF,
        apply: (p, lvl) => {
          p.hasDarkResonance = true
          p.darkResonanceLevel = lvl
          if (lvl === 1) { p.darkResonanceRadius = 40; p.darkResonanceDmgPct = 0.50 }
          else if (lvl === 2) { p.darkResonanceRadius = 60; p.darkResonanceDmgPct = 0.70 }
          else { p.darkResonanceRadius = 80; p.darkResonanceDmgPct = 1.00 }
        },
      },
      {
        id: 'vb5', label: 'Void Ascendant', icon: 'vb5_void_ascendant', isUltimate: true,
        desc: ['6s: CD halved, +80% dmg, secondary crescent per slash. 45s CD', 'Duration 8s, CD 38s; crescents pierce 2', 'Duration 10s, CD 30s; burst 180px on activation'],
        branch: 'Void Blade', branchColor: 0x9933FF,
        apply: (p, lvl) => {
          p.hasVoidAscendant = true
          p.voidAscendantLevel = lvl
          p._ascendantCDTimer = 0
          if (lvl === 1) { p.voidAscendantDuration = 6000; p.voidAscendantCooldown = 45000 }
          else if (lvl === 2) { p.voidAscendantDuration = 8000; p.voidAscendantCooldown = 38000 }
          else { p.voidAscendantDuration = 10000; p.voidAscendantCooldown = 30000 }
        },
      },
    ],
  },
  {
    name: 'Phantom', color: 0xCC66FF,
    theme: 'Spectral duplication — multiply strikes, echo damage, shadow split.',
    upgrades: [
      {
        id: 'vp1', label: 'Echo Strike', icon: 'vp1_echo_strike',
        desc: ['Echo slash 0.2s after each attack (35% dmg)', 'Echo → 50% dmg; inherits Void Edge bonus', 'Second echo 0.15s after first (25% dmg)'],
        branch: 'Phantom', branchColor: 0xCC66FF,
        apply: (p, lvl) => {
          p.hasEchoStrike = true
          p.echoStrikeLevel = lvl
          if (lvl === 1) { p.echoStrikeDmgPct = 0.35 }
          else if (lvl === 2) { p.echoStrikeDmgPct = 0.50 }
        },
      },
      {
        id: 'vp2', label: 'Split Shade', icon: 'vp2_split_shade',
        desc: ['On hit: decoy shade 80px away (1.5s), 6s CD', 'Shade 2.5s, CD 4s; shade echo-slashes on expiry', 'Shade 3s, CD 3s; 2 shades spawn'],
        branch: 'Phantom', branchColor: 0xCC66FF,
        apply: (p, lvl) => {
          p.hasSplitShade = true
          p.splitShadeLevel = lvl
        },
      },
      {
        id: 'vp3', label: 'Phantom Veil', icon: 'vp3_phantom_veil',
        desc: ['30% chance to negate dmg during attack cooldown', 'Chance → 55%', 'Chance → 80%; negate resets attack CD'],
        branch: 'Phantom', branchColor: 0xCC66FF,
        apply: (p, lvl) => {
          p.hasPhantomVeil = true
          p.phantomVeilLevel = lvl
          if (lvl === 1) { p.phantomVeilChance = 0.30 }
          else if (lvl === 2) { p.phantomVeilChance = 0.55 }
          else { p.phantomVeilChance = 0.80 }
        },
      },
      {
        id: 'vp4', label: 'Mirror Swarm', icon: 'vp4_mirror_swarm',
        desc: ['On kill: phantom ally does 1 slash (100% dmg)', '2 slashes', '3 slashes; chain kill spawns smaller phantom'],
        branch: 'Phantom', branchColor: 0xCC66FF,
        apply: (p, lvl) => {
          p.hasMirrorSwarm = true
          p.mirrorSwarmSlashes = lvl
        },
      },
      {
        id: 'vp5', label: 'Shade Legion', icon: 'vp5_shade_legion', isUltimate: true,
        desc: ['5s: 4 duplicates (70% dmg, 600ms). Invulnerable. 50s CD', '7s, CD 42s; duplicates 85% dmg', '8s, CD 35s; on expiry: 160px void implosion 150% dmg'],
        branch: 'Phantom', branchColor: 0xCC66FF,
        apply: (p, lvl) => {
          p.hasShadeLegion = true
          p.shadeLegionLevel = lvl
          p._shadeLegionCDTimer = 0
          if (lvl === 1) { p.shadeLegionDuration = 5000; p.shadeLegionCooldown = 50000; p.shadeLegionDmgPct = 0.70 }
          else if (lvl === 2) { p.shadeLegionDuration = 7000; p.shadeLegionCooldown = 42000; p.shadeLegionDmgPct = 0.85 }
          else { p.shadeLegionDuration = 8000; p.shadeLegionCooldown = 35000 }
        },
      },
    ],
  },
  {
    name: 'Rift', color: 0x4400BB,
    theme: 'Dimensional manipulation — blink strikes, void zones, spatial anchors.',
    upgrades: [
      {
        id: 'vr1', label: 'Void Step', icon: 'vr1_void_step',
        desc: ['Blink 50px toward enemy before each attack', 'Blink → 75px; +15% dmg when landing ≤25px', 'Blink → 100px; micro-rift at origin (20px, 0.5s, 20% dmg)'],
        branch: 'Rift', branchColor: 0x4400BB,
        apply: (p, lvl) => {
          p.hasVoidStep = true
          p.voidStepLevel = lvl
          if (lvl === 1) { p.voidStepDist = 50 }
          else if (lvl === 2) { p.voidStepDist = 75 }
          else { p.voidStepDist = 100 }
        },
      },
      {
        id: 'vr2', label: 'Rift Anchor', icon: 'vr2_rift_anchor',
        desc: ['Every 12s: anchor placed; auto-teleport when HP<25%', 'CD 9s, lasts 10s; HP threshold 35%; return dmg 80px', 'CD 6s; return dmg 130%; placement stuns 40px 0.6s'],
        branch: 'Rift', branchColor: 0x4400BB,
        apply: (p, lvl) => {
          p.hasRiftAnchor = true
          p.riftAnchorLevel = lvl
          p._anchorTimer = 0
          if (lvl === 1) { p.riftAnchorCooldown = 12000; p.riftAnchorDuration = 8000; p.riftAnchorHpThreshold = 0.25 }
          else if (lvl === 2) { p.riftAnchorCooldown = 9000; p.riftAnchorDuration = 10000; p.riftAnchorHpThreshold = 0.35 }
          else { p.riftAnchorCooldown = 6000 }
        },
      },
      {
        id: 'vr3', label: 'Void Zone', icon: 'vr3_void_zone',
        desc: ['On kill: void zone (40px, 3s, 35% slow, 8% DoT/s)', 'Zone → 60px, 4s, 14% DoT/s', 'Zone → 80px, 6s, 20% DoT/s'],
        branch: 'Rift', branchColor: 0x4400BB,
        apply: (p, lvl) => {
          p.hasVoidZone = true
          if (lvl === 1) { p.voidZoneRadius = 40; p.voidZoneDuration = 3000; p.voidZoneDotPct = 0.08 }
          else if (lvl === 2) { p.voidZoneRadius = 60; p.voidZoneDuration = 4000; p.voidZoneDotPct = 0.14 }
          else { p.voidZoneRadius = 80; p.voidZoneDuration = 6000; p.voidZoneDotPct = 0.20 }
        },
      },
      {
        id: 'vr4', label: 'Spatial Tear', icon: 'vr4_spatial_tear',
        desc: ['Every 8s: void burst at nearest enemy (80px, 120% dmg)', 'CD 6s; AoE → 110px', 'CD 5s; AoE → 140px; drops void zone at burst'],
        branch: 'Rift', branchColor: 0x4400BB,
        apply: (p, lvl) => {
          p.hasSpatialTear = true
          p.spatialTearLevel = lvl
          p._spatialTearTimer = 0
          if (lvl === 1) { p.spatialTearCooldown = 8000; p.spatialTearRadius = 80 }
          else if (lvl === 2) { p.spatialTearCooldown = 6000; p.spatialTearRadius = 110 }
          else { p.spatialTearCooldown = 5000; p.spatialTearRadius = 140 }
        },
      },
      {
        id: 'vr5', label: 'Rift Collapse', icon: 'vr5_rift_collapse', isUltimate: true,
        desc: ['0.8s wind-up; 200px pull + 180% dmg. 40s CD', 'Pull → 240px, 220% dmg; CD 34s', 'Pull → 280px, 280% dmg; CD 28s; void zone at collapse'],
        branch: 'Rift', branchColor: 0x4400BB,
        apply: (p, lvl) => {
          p.hasRiftCollapse = true
          p.riftCollapseLevel = lvl
          p._riftCollapseCDTimer = 0
          if (lvl === 1) { p.riftCollapseRadius = 200; p.riftCollapseDmgPct = 1.80; p.riftCollapseCooldown = 40000 }
          else if (lvl === 2) { p.riftCollapseRadius = 240; p.riftCollapseDmgPct = 2.20; p.riftCollapseCooldown = 34000 }
          else { p.riftCollapseRadius = 280; p.riftCollapseDmgPct = 2.80; p.riftCollapseCooldown = 28000 }
        },
      },
    ],
  },
]

// Map hero → branches
export const HERO_BRANCHES: Record<string, BranchDef[]> = {
  ignara: IGNARA_BRANCHES,
  nazar:  NAZAR_BRANCHES,
  sifra:  SIFRA_BRANCHES,
  amun:   AMUN_BRANCHES,
  huntress: HUNTRESS_BRANCHES,
  khashin: KHASHIN_BRANCHES,
  muller:  MULLER_BRANCHES,
  vael:    VAEL_BRANCHES,
  nightborne: NIGHTBORNE_BRANCHES,
}

// ============================================================
// SELECTION LOGIC
// ============================================================

const MAX_SKILL_LEVEL = 3
const MAX_TOTAL_SKILLS = 8

/** Track which upgrades have been picked and to what level */
export class UpgradeTracker {
  pickedGeneric = new Set<string>()
  /** id → current level (0 = not yet learned) */
  skillLevels: Record<string, number> = {}
  chosenBranch: string | null = null          // branch name chosen at level 1
  isFirstLevel = true                          // tracks if this is the first level-up

  /** @deprecated kept for compatibility with dot display; computed from skillLevels */
  get branchProgress(): Record<string, number> {
    // sum of all skill levels in each branch (approximates old sequential counter)
    const result: Record<string, number> = {}
    for (const [id, lvl] of Object.entries(this.skillLevels)) {
      // find which branch this id belongs to
      for (const branches of Object.values(HERO_BRANCHES)) {
        for (const b of branches) {
          if (b.upgrades.some(u => u.id === id)) {
            result[b.name] = (result[b.name] || 0) + lvl
          }
        }
      }
    }
    return result
  }

  /** True while the player still needs to pick a branch (i.e. it is the first level-up) */
  get isBranchSelection(): boolean { return this.isFirstLevel }

  /**
   * Returns exactly 3 cards — one per branch (the FIRST skill of each branch).
   * Each card represents the whole branch, not just the skill.
   */
  getBranchChoices(heroType: HeroType, _stance?: string): Upgrade[] {
    let branches = HERO_BRANCHES[heroType] || []

    if (heroType === 'sifra') {
      branches = SIFRA_BRANCHES
    } else if (heroType === 'khashin') {
      branches = KHASHIN_BRANCHES
    }

    // Filter out branches that haven't been unlocked yet.
    // For Amun during the tutorial, Bastion and Quake start locked.
    // getUnlockedBranches returns ['__all__'] for heroes with no gating.
    const unlockedBranches = MetaProgress.getUnlockedBranches(heroType)
    if (!unlockedBranches.includes('__all__')) {
      branches = branches.filter(b => unlockedBranches.includes(b.name))
    }

    // Shuffle branch order so positions are random each time
    branches = [...branches].sort(() => Math.random() - 0.5)

    // For any hero with more than 3 branches, pick 3
    if (branches.length > 3) {
      branches = branches.slice(0, 3)
    }

    return branches.map(b => ({
      ...b.upgrades[0],
      branch: b.name,
      branchColor: b.color,
      _branchDef: b,
    }))
  }

  /**
   * Returns 5 cards:
   *  - 3 branch skill cards: randomly drawn from the available pool of the chosen branch
   *    (ultimate available when all regulars are picked; its max level = min level of regulars)
   *    Skills at max level (3) are excluded.
   *  - 2-3 generic cards (3 levels each, capped at MAX_TOTAL_SKILLS distinct)
   */
  getChoices(heroType: HeroType, _stance?: string): Upgrade[] {
    // ── Generic portion ──────────────────────────────────────────────────
    // Count distinct skills the player has learned (branch + generic)
    const totalDistinctSkills = this.pickedGeneric.size +
      Object.keys(this.skillLevels).filter(id => !this.pickedGeneric.has(id) && this.skillLevels[id] > 0).length
    const atSkillCap = totalDistinctSkills >= MAX_TOTAL_SKILLS

    // Per-hero generic exclusions: Ignara gets +15% base range and native AoE,
    // so Eagle Eye (g3, range) and Cleave (g7, splash) are redundant.
    const heroExcluded: Record<string, Set<string>> = {
      ignara: new Set(['g3', 'g7']),
    }
    const excluded = heroExcluded[heroType] || new Set<string>()

    // Generics not yet maxed: already-picked can level up; new ones only if under skill cap
    const availGenerics = GENERIC_POOL.filter(u => {
      if (excluded.has(u.id)) return false
      const lvl = this.skillLevels[u.id] || 0
      if (lvl >= MAX_SKILL_LEVEL) return false          // maxed out
      if (this.pickedGeneric.has(u.id)) return true      // already picked — can level up
      return !atSkillCap                                  // new skill — only if under cap
    })
    const shuffledGen = [...availGenerics].sort(() => Math.random() - 0.5)

    // ── Branch portion ───────────────────────────────────────────────────
    const branchCards: Upgrade[] = []

    if (this.chosenBranch) {
      const allBranches = HERO_BRANCHES[heroType] || []
      const chosenBranchDef = allBranches.find(b => b.name === this.chosenBranch)

      if (chosenBranchDef) {
        const regulars = chosenBranchDef.upgrades.filter(u => !u.isUltimate)
        const ultimate = chosenBranchDef.upgrades.find(u => u.isUltimate)

        // Ultimate available when all regulars are at least N → ultimate can be taken at level N.
        // e.g. all regulars at 1 → ultimate unlocks at lvl 1; all at 2 → can level ult to 2.
        const minRegularLevel = Math.min(...regulars.map(u => this.skillLevels[u.id] || 0))
        const ultLevel = this.skillLevels[ultimate?.id ?? ''] || 0
        const ultimateAvailable = ultimate && minRegularLevel >= 1 && ultLevel < minRegularLevel

        // Build the available pool (exclude maxed skills)
        const pool: Upgrade[] = []
        for (const u of regulars) {
          if ((this.skillLevels[u.id] || 0) < MAX_SKILL_LEVEL) {
            pool.push({ ...u, branch: chosenBranchDef.name, branchColor: chosenBranchDef.color })
          }
        }
        if (ultimateAvailable && ultLevel < MAX_SKILL_LEVEL) {
          pool.push({ ...ultimate, branch: chosenBranchDef.name, branchColor: chosenBranchDef.color })
        }

        // Shuffle and pick up to 2 branch cards
        const shuffled = [...pool].sort(() => Math.random() - 0.5)
        branchCards.push(...shuffled.slice(0, 2))
      }
    }

    // ── Combine: 3 total cards — 1-2 branch + 1-2 generic ──
    // Prefer 2 branch + 1 generic when both pools are healthy;
    // fall back to 1 branch + 2 generic (or all generic) when pool is thin.
    const wantBranch = branchCards.length >= 2 && shuffledGen.length >= 1
      ? 2
      : Math.min(branchCards.length, 1)
    const choices: Upgrade[] = []
    choices.push(...branchCards.slice(0, wantBranch))

    const genNeeded = 3 - choices.length
    for (let i = 0; i < genNeeded && i < shuffledGen.length; i++) {
      choices.push(shuffledGen[i])
    }

    // Pad to 3 if still short
    while (choices.length < 3) {
      const next = shuffledGen.find(u => !choices.includes(u))
         ?? branchCards.find(u => !choices.includes(u))
      if (next) choices.push(next)
      else break
    }

    // Shuffle positions so branch cards aren't always first
    const result = choices.slice(0, 3)
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /**
   * Find upgrade by ID and apply it (for online mode — server sends chosen ID).
   * Searches both GENERIC_POOL and hero branch upgrades.
   */
  pickById(upgradeId: string, heroType: HeroType): void {
    // Check generic pool
    const generic = GENERIC_POOL.find(u => u.id === upgradeId)
    if (generic) { this.pick(generic); return }
    // Check hero branches
    const branches = HERO_BRANCHES[heroType] ?? []
    for (const branch of branches) {
      for (const skill of branch.upgrades) {
        if (skill.id === upgradeId) { this.pick(skill); return }
      }
    }
  }

  /** Get the current level for a skill */
  getLevel(id: string): number {
    return this.skillLevels[id] || 0
  }

  /** Mark an upgrade as picked — increments level or sets level 1 */
  pick(upgrade: Upgrade) {
    if (this.isFirstLevel && upgrade.branch) {
      this.chosenBranch = upgrade.branch
      this.isFirstLevel = false
    }

    if (upgrade.branch) {
      const cur = this.skillLevels[upgrade.id] || 0
      this.skillLevels[upgrade.id] = Math.min(cur + 1, MAX_SKILL_LEVEL)
    } else {
      this.pickedGeneric.add(upgrade.id)
      const cur = this.skillLevels[upgrade.id] || 0
      this.skillLevels[upgrade.id] = Math.min(cur + 1, MAX_SKILL_LEVEL)
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
  'sl1_spark_initiate': 45, 'sl2_arc_reach': 46, 'sl3_overcharge': 47, 'sl4_ball_lightning': 48, 'sl5_storm_lord': 49,
  'ss1_permafrost': 70, 'ss2_shatter': 71, 'ss3_ice_spear': 72, 'ss4_frostbite': 48, 'ss5_avalanche': 73,
  'sc1_glacial_pierce': 50, 'sc2_ice_armor': 51, 'sc3_mirror_ice': 52, 'sc4_cryo_shield': 53, 'sc5_diamond_dust': 54,
  'aw1_thorns': 55, 'aw2_wrath': 56, 'aw3_consecration': 57, 'aw5_divine_judgment': 58,
  'ab1_fortify': 60, 'ab2_aura_of_might': 61, 'ab3_iron_will': 62, 'ab5_undying': 63,
  'aq1_titans_pulse': 65, 'aq2_earthquake': 66, 'aq3_colossus': 67, 'aq5_cataclysm': 68,
  'kw1_razor_wind': 70, 'kw2_gust_strike': 71, 'kw3_dust_devil': 72, 'kw4_cyclone_surge': 73, 'kw5_eye_of_the_storm': 74,
  'kd1_choking_sand': 75, 'kd2_sand_armor': 76, 'kd3_abrasion': 77, 'kd4_scarab_tide': 78, 'kd5_sandstorm_wall': 79,
  'km1_tailwind': 80, 'km2_phantom_step': 81, 'km3_mirage': 82, 'km4_drift': 83, 'km5_desert_wind': 84,
  'cm1_coarse_cut': 85, 'cm2_deep_vein': 86, 'cm3_shardstorm': 87, 'cm4_crystal_shrapnel': 88, 'cm5_tectonic_fury': 89,
  'cr1_stone_skin': 90, 'cr2_geode_shell': 91, 'cr3_crystal_wall': 92, 'cr4_resonance_armor': 93, 'cr5_living_geode': 94,
  'cf1_planted_shard': 95, 'cf2_crystal_pillar': 96, 'cf3_fault_line': 97, 'cf4_resonance_field': 98, 'cf5_mother_lode': 99,
  'bh1_sustained_burn': 100, 'bh2_powder_keg': 101, 'bh3_ember_volley': 102, 'bh4_flashpoint': 103, 'bh5_infernal_cadence': 104,
  // Nightborne — reuse existing frames (no new icons yet; update when spritesheet expands)
  'vb1_void_edge': 25, 'vb2_cleave': 26, 'vb3_void_surge': 27, 'vb4_dark_resonance': 28, 'vb5_void_ascendant': 29,
  'vp1_echo_strike': 35, 'vp2_split_shade': 36, 'vp3_phantom_veil': 37, 'vp4_mirror_swarm': 38, 'vp5_shade_legion': 39,
  'vr1_void_step': 50, 'vr2_rift_anchor': 51, 'vr3_void_zone': 52, 'vr4_spatial_tear': 53, 'vr5_rift_collapse': 54,
  // Vael — dedicated frames (sheet rows 10-11)
  'ph1_hollow_touch': 105, 'ph2_soul_siphon': 106, 'ph3_wound_memory': 107, 'ph4_exsanguination': 108, 'ph5_sanguine_ascendancy': 109,
  'os1_risen': 110, 'os2_grave_pact': 111, 'os3_undying_labor': 112, 'os4_charnel_tide': 113, 'os5_lich_dominion': 114,
  'wp1_festering_wound': 115, 'wp2_virulent_spread': 116, 'wp3_necrotic_bloom': 117, 'wp4_pandemic': 118, 'wp5_carrion_crown': 119,
}
export function getIconFrame(iconName: string): number {
  return ICON_FRAME_MAP[iconName] ?? 0
}

/** Map of icon names that have individual DALL-E textures loaded as separate images */
const INDIVIDUAL_ICON_MAP: Record<string, string> = {
}

/** Returns { key, frame } for use with this.add.image(x, y, key, frame) */
export function getIconTexture(iconName: string, scene: Phaser.Scene): { key: string; frame?: number } {
  const individual = INDIVIDUAL_ICON_MAP[iconName]
  if (individual && scene.textures.exists(individual)) {
    return { key: individual }
  }
  return { key: 'skill_icons', frame: getIconFrame(iconName) }
}
