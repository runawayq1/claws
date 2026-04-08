import { Player, type HeroType } from '../entities/Player'

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
// GENERIC POOL (G1–G10) — available to all heroes, one-shot
// ============================================================
export const GENERIC_POOL: Upgrade[] = [
  { id: 'g1',  label: 'Sharp Edge',   desc: ['+20% dmg to all attacks', '+10% dmg (total +32%)', '+10% dmg (total +45%)'],            icon: 'g1_sharp_edge',   apply: (p, lvl) => { if (lvl === 1) { p.damage = Math.ceil(p.damage * 1.2) } else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) } else { p.damage = Math.ceil(p.damage * 1.1) } } },
  { id: 'g2',  label: 'Swift Feet',   desc: ['+15% move speed permanently', '+10% more speed', '+10% more speed'],                    icon: 'g2_swift_feet',   apply: (p, lvl) => { if (lvl === 1) { p.speed = Math.ceil(p.speed * 1.15) } else if (lvl === 2) { p.speed = Math.ceil(p.speed * 1.1) } else { p.speed = Math.ceil(p.speed * 1.1) } } },
  { id: 'g3',  label: 'Eagle Eye',    desc: ['+20% attack range permanently', '+15% more range', '+15% more range'],                  icon: 'g3_eagle_eye',    apply: (p, lvl) => { if (lvl === 1) { p.range = Math.ceil(p.range * 1.2) } else if (lvl === 2) { p.range = Math.ceil(p.range * 1.15) } else { p.range = Math.ceil(p.range * 1.15) } } },
  { id: 'g4',  label: 'Quick Hands',  desc: ['-20% attack cooldown (min 200ms)', '-10% more cooldown', '-10% more cooldown'],         icon: 'g4_quick_hands',  apply: (p, lvl) => { if (lvl === 1) { p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.8)) } else if (lvl === 2) { p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.9)) } else { p.attackCooldown = Math.max(200, Math.floor(p.attackCooldown * 0.9)) } } },
  { id: 'g5',  label: 'Vitality',     desc: ['+25% max HP, heal for the bonus', '+20% more max HP', '+20% more max HP'],              icon: 'g5_vitality',     apply: (p, lvl) => { if (lvl === 1) { const b = Math.ceil(p.maxHp * 0.25); p.maxHp += b; p.hp += b } else if (lvl === 2) { const b = Math.ceil(p.maxHp * 0.2); p.maxHp += b; p.hp += b } else { const b = Math.ceil(p.maxHp * 0.2); p.maxHp += b; p.hp += b } } },
  { id: 'g6',  label: 'Regeneration', desc: ['+2 HP/s passive regen', '+2 HP/s more regen', '+3 HP/s more regen'],                   icon: 'g6_regeneration', apply: (p, lvl) => { if (lvl === 1) { p.hpRegen += 2 } else if (lvl === 2) { p.hpRegen += 2 } else { p.hpRegen += 3 } } },
  { id: 'g7',  label: 'Cleave',       desc: ['AoE: attacks splash in 6m radius', 'Splash radius +3m', 'Splash radius +4m'],           icon: 'g7_cleave',       apply: (p, lvl) => { if (lvl === 1) { p.splashRadius = Math.max(p.splashRadius, 60) } else if (lvl === 2) { p.splashRadius += 30 } else { p.splashRadius += 40 } } },
  { id: 'g8',  label: 'Wisdom',       desc: ['+25% XP from all sources', '+15% more XP', '+15% more XP'],                             icon: 'g8_wisdom',       apply: (p, lvl) => { if (lvl === 1) { p.xpMult += 0.25 } else if (lvl === 2) { p.xpMult += 0.15 } else { p.xpMult += 0.15 } } },
  { id: 'g9',  label: 'Multistrike',  desc: ['+1 strike: attack hits one more time', '+1 more strike', '+1 more strike'],             icon: 'g9_multistrike',  apply: (p, _lvl) => { p.strikeCount += 1 } },
  { id: 'g10', label: 'Iron Skin',    desc: ['+25% armor (reduces dmg taken)', '+15% more armor', '+15% more armor'],                 icon: 'g10_iron_skin',   apply: (p, lvl) => { if (lvl === 1) { p.armor = Math.min(0.7, p.armor + 0.25) } else if (lvl === 2) { p.armor = Math.min(0.7, p.armor + 0.15) } else { p.armor = Math.min(0.7, p.armor + 0.15) } } },
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
    theme: 'Burn everything. Ask questions never.',
    upgrades: [
      {
        id: 'if1', label: 'Wide Burn', icon: 'if1_wide_burn',
        desc: ['Explosion radius +2m', 'Radius +2m more (total +4m)', 'Radius +3m more + applies Scorched Earth burn DOT'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.splashRadius += 20 }
          else if (lvl === 2) { p.splashRadius += 20 }
          else { p.splashRadius += 30; p.hasScorchedEarth = true }
        },
      },
      {
        id: 'if2', label: 'Inferno Reach', icon: 'if2_inferno_reach',
        desc: ['Fireball range +3m', 'Range +2m more, +10% dmg', 'Range +2m more, +15% dmg'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.range += 30 }
          else if (lvl === 2) { p.range += 20; p.damage = Math.ceil(p.damage * 1.1) }
          else { p.range += 20; p.damage = Math.ceil(p.damage * 1.15) }
        },
      },
      {
        id: 'if3', label: 'White Fire', icon: 'if3_white_fire',
        desc: ['+30% fireball dmg', '+15% more dmg', '+15% dmg + gains Wildfire on-kill chain explosion'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.damage = Math.ceil(p.damage * 1.3) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.15) }
          else { p.damage = Math.ceil(p.damage * 1.15); p.hasWildfire = true }
        },
      },
      {
        id: 'if5', label: 'Firestorm', icon: 'if5_firestorm', isUltimate: true,
        desc: ['2 mini-fireballs: 50% dmg in 3.5m AoE, +15% dmg', '+1 more mini-fireball, +10% dmg', 'Mini-fireballs also drop Scorched Earth on impact'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasFirestorm = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.hasScorchedEarth = true }
        },
      },
    ],
  },
  {
    name: 'Fortress', color: 0xff4444,
    theme: 'Stand in the fire. Let the Swarm come to you.',
    upgrades: [
      {
        id: 'io1', label: 'Heat Shield', icon: 'io1_heat_shield',
        desc: ['+15% armor (dmg reduction)', '+10% more armor', '+10% armor + Ember Veil aura (reflect 10% dmg)'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.armor = Math.min(0.7, p.armor + 0.15) }
          else if (lvl === 2) { p.armor = Math.min(0.7, p.armor + 0.1) }
          else { p.armor = Math.min(0.7, p.armor + 0.1); p.hasMoltenSkin = true }
        },
      },
      {
        id: 'io2', label: 'Pyromaniac', icon: 'io2_pyromaniac',
        desc: ['On kill: +2 HP, +1 HP/s regen', 'On kill: +3 HP instead, +1 HP/s regen', 'On kill: +4 HP, +2 HP/s more regen'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasPyromaniac = true; p.hpRegen += 1 }
          else if (lvl === 2) { p.hpRegen += 1 }
          else { p.hpRegen += 2 }
        },
      },
      {
        id: 'io3', label: 'Molten Skin', icon: 'io3_molten_skin',
        desc: ['When hit: AoE 30% dmg in 5m, +10% armor', 'AoE range +3m, +10% more armor', 'AoE range +3m + grants Phoenix Heart revive'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasMoltenSkin = true; p.armor = Math.min(0.7, p.armor + 0.1) }
          else if (lvl === 2) { p.splashRadius += 30; p.armor = Math.min(0.7, p.armor + 0.1) }
          else { p.splashRadius += 30; p.hasPhoenixHeart = true }
        },
      },
      {
        id: 'io5', label: 'Phoenix Heart', icon: 'io5_phoenix_heart', isUltimate: true,
        desc: ['Revive once at 50% HP, +30 max HP', '+30 more max HP, heal on revive to 70%', '+40 max HP, revive spawns fire burst'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasPhoenixHeart = true; p.maxHp += 30; p.hp += 30 }
          else if (lvl === 2) { p.maxHp += 30; p.hp += 30 }
          else { p.maxHp += 40; p.hp += 40 }
        },
      },
    ],
  },
  {
    name: 'Havoc', color: 0xffaa00,
    theme: 'Chaos is a weapon. Learn to throw it.',
    upgrades: [
      {
        id: 'ih1', label: 'Backdraft', icon: 'ih1_backdraft',
        desc: ['Fireball knockback 12→30m, +10% dmg', '+10% more dmg, knockback pulls enemies back in', '+10% dmg + adds Meltdown berserker threshold'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasBackdraft = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1); p.hasMeltdown = true }
        },
      },
      {
        id: 'ih2', label: 'Eruption', icon: 'ih2_eruption',
        desc: ['Explosion radius +4m', 'Radius +3m more, +5% dmg', 'Radius +3m more, +10% dmg'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.splashRadius += 40 }
          else if (lvl === 2) { p.splashRadius += 30; p.damage = Math.ceil(p.damage * 1.05) }
          else { p.splashRadius += 30; p.damage = Math.ceil(p.damage * 1.1) }
        },
      },
      {
        id: 'ih3', label: 'Lava Trail', icon: 'ih3_lava_trail',
        desc: ['Moving: drop fire pools, 20% dmg/tick, +10 speed', '+10 more speed, longer pool duration', '+10 speed + gains Wildfire on-kill chain explosion'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasLavaTrail = true; p.speed += 10 }
          else if (lvl === 2) { p.speed += 10 }
          else { p.speed += 10; p.hasWildfire = true }
        },
      },
      {
        id: 'ih5', label: 'Meltdown', icon: 'ih5_meltdown', isUltimate: true,
        desc: ['Below 40% HP: ×1.5 dmg; +15% base dmg', 'Threshold rises to 50% HP, +10% dmg', 'Also below threshold: +20 speed and armor +10%'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasMeltdown = true; p.damage = Math.ceil(p.damage * 1.15) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.speed += 20; p.armor = Math.min(0.7, p.armor + 0.1) }
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
        desc: ['Lunge 1.5× range, hit 70% dmg line, +5 dmg', '+8 dmg, lunge hits twice', '+8 dmg + Assassinate: 2× dmg vs lone enemy'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasChainDash = true; p.damage += 5 }
          else if (lvl === 2) { p.damage += 8 }
          else { p.damage += 8; p.hasAssassinate = true }
        },
      },
      {
        id: 'nb5', label: 'Assassinate', icon: 'nb5_assassinate', isUltimate: true,
        desc: ['2× dmg when only 1 enemy in melee range, +15% dmg', '+10% more dmg, execute targets below 10% HP', '+15% dmg, execute range doubled'],
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
        desc: ['Shards slow enemies +30%, +10% dmg', '+10% dmg, frozen enemies shatter for +20% bonus dmg', '+10% dmg, shatter AoE in 3m radius'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasDeepFreeze = true; p.damage = Math.ceil(p.damage * 1.1) }
          else if (lvl === 2) { p.damage = Math.ceil(p.damage * 1.1) }
          else { p.damage = Math.ceil(p.damage * 1.1) }
        },
      },
      {
        id: 'sc2', label: 'Ice Armor', icon: 'sc2_ice_armor',
        desc: ['Absorb shield (30+15% maxHP), regens after 3s', 'Shield strength +10% maxHP, regen timer -1s', '+15% maxHP shield + Blizzard Aura activates when shield is up'],
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
        desc: ['When hit: reflect 50% dmg to enemies in 6m, +5% armor', 'Reflect radius +2m, +5% armor', '+5% armor + Wrath AoE burst every 4 seconds'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasThorns = true; p.armor = Math.min(0.7, p.armor + 0.05) }
          else if (lvl === 2) { p.splashRadius += 20; p.armor = Math.min(0.7, p.armor + 0.05) }
          else { p.armor = Math.min(0.7, p.armor + 0.05); p.hasWrathPulse = true }
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
        desc: ['+15% armor, activates defense aura', '+15% more armor', '+10% armor, Iron Will: cap incoming hit at 10% maxHP'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.armor = Math.min(0.7, p.armor + 0.15); p.defenseAuraActive = true }
          else if (lvl === 2) { p.armor = Math.min(0.7, p.armor + 0.1) }
          else { p.armor = Math.min(0.7, p.armor + 0.1); p.hasIronWill = true }
        },
      },
      {
        id: 'ab2', label: 'Aura of Might', icon: 'ab2_aura_of_might',
        desc: ['Orbiting shield, +3 dmg', '+3 dmg, +1 shields', '+4 dmg, +2 shields + low HP regen ×3'],
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
          if (lvl === 1) { p.hasIronWill = true; p.armor = Math.min(0.7, p.armor + 0.1) }
          else if (lvl === 2) { p.armor = Math.min(0.7, p.armor + 0.1); p.hpRegen += 2 }
          else { p.armor = Math.min(0.7, p.armor + 0.1); p.hpRegen += 2; p.rebirthStacks = Math.max(p.rebirthStacks, 1) }
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
      desc: ['Wind slash knocks back enemies 15m', 'Knockback pushes 25m, hit targets take +15% dmg', '+15% dmg + Cyclone Surge: Dust Devils +50% bigger'],
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
      desc: ['+20 speed, -10% attack CD', '+15 speed, -10% more attack CD', '+15 speed, -10% CD + Drift: leave slow trails while moving'],
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
        desc: ['Hit marks enemy 5s; marked take +30% dmg, +3 dmg', '+3 dmg, mark lasts 8s, +40% dmg vs marked', '+4 dmg, marks spread to adjacent enemies on kill'],
        apply: (p, lvl) => {
          if (lvl === 1) { p.hasMarkedTarget = true; p.damage += 3 }
          else if (lvl === 2) { p.damage += 3 }
          else { p.damage += 4 }
        },
      },
      {
        id: 'hp3', label: 'Battle Frenzy', icon: 'g4_quick_hands',
        desc: ['On kill: -10% attack CD for 5s, +3 dmg', '+3 dmg, frenzy duration 8s', '+4 dmg + Headhunter: auto-execute enemies below 15% HP'],
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

// Map hero → branches
export const HERO_BRANCHES: Record<string, BranchDef[]> = {
  ignara: IGNARA_BRANCHES,
  nazar:  NAZAR_BRANCHES,
  sifra:  SIFRA_BRANCHES,
  amun:   AMUN_BRANCHES,
  huntress: HUNTRESS_BRANCHES,
  khashin: KHASHIN_BRANCHES,
  muller:  MULLER_BRANCHES,
}

// ============================================================
// SELECTION LOGIC
// ============================================================

const MAX_SKILL_LEVEL = 3

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
   *    (3 regulars always available; ultimate only when all 3 regulars are at level ≥ 2)
   *    Skills at max level (3) are excluded.
   *  - 2 random generic cards (one-shot)
   */
  getChoices(heroType: HeroType, _stance?: string): Upgrade[] {
    // ── Generic portion ──────────────────────────────────────────────────
    const availGenerics = GENERIC_POOL.filter(u => !this.pickedGeneric.has(u.id))
    const shuffledGen = [...availGenerics].sort(() => Math.random() - 0.5)

    // ── Branch portion ───────────────────────────────────────────────────
    const branchCards: Upgrade[] = []

    if (this.chosenBranch) {
      const allBranches = HERO_BRANCHES[heroType] || []
      const chosenBranchDef = allBranches.find(b => b.name === this.chosenBranch)

      if (chosenBranchDef) {
        const regulars = chosenBranchDef.upgrades.filter(u => !u.isUltimate)
        const ultimate = chosenBranchDef.upgrades.find(u => u.isUltimate)

        // Ultimate unlocks when ALL regulars are at level ≥ 2
        const ultimateUnlocked = ultimate &&
          regulars.every(u => (this.skillLevels[u.id] || 0) >= 2)

        // Build the available pool (exclude maxed skills)
        const pool: Upgrade[] = []
        for (const u of regulars) {
          if ((this.skillLevels[u.id] || 0) < MAX_SKILL_LEVEL) {
            pool.push({ ...u, branch: chosenBranchDef.name, branchColor: chosenBranchDef.color })
          }
        }
        if (ultimateUnlocked && (this.skillLevels[ultimate.id] || 0) < MAX_SKILL_LEVEL) {
          pool.push({ ...ultimate, branch: chosenBranchDef.name, branchColor: chosenBranchDef.color })
        }

        // Shuffle and pick up to 3
        const shuffled = [...pool].sort(() => Math.random() - 0.5)
        branchCards.push(...shuffled.slice(0, 3))
      }
    }

    // ── Combine: 2-3 branch + 3-2 generic (random split), shuffled positions ──
    const branchCount = Math.min(branchCards.length, Math.random() < 0.5 ? 2 : 3)
    const choices: Upgrade[] = []
    choices.push(...branchCards.slice(0, branchCount))

    const genNeeded = Math.max(2, 5 - choices.length)
    for (let i = 0; i < genNeeded && i < shuffledGen.length; i++) {
      choices.push(shuffledGen[i])
    }

    // Pad to 5 if still short (edge case: very few generics left)
    while (choices.length < 5 && shuffledGen.length > choices.length - branchCount) {
      const next = shuffledGen.find(u => !choices.includes(u))
      if (next) choices.push(next)
      else break
    }

    // Shuffle positions so branch cards aren't always first
    const result = choices.slice(0, 5)
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
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
      // Generics are one-shot but still track a level for display
      this.skillLevels[upgrade.id] = 1
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
