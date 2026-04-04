# CLAWS -- New Heroes Design Document

## Overview

This document specifies two new playable heroes for CLAWS: **Zara** (Sand Summoner) and **Ra** (Solar Priest). Both heroes introduce fundamentally new attack paradigms -- minion management and ramping beam DPS respectively -- that do not exist in the current roster. Each hero is gated behind an achievement-based unlock condition using the existing `MetaProgress` system.

Current roster for reference:

| # | Hero | Role | Attack Type | Branches |
|---|------|------|-------------|----------|
| 1 | Ignara | Fire Mage | Flamethrower (continuous cone) | Inferno, Fortress, Havoc |
| 2 | Khet | Shadow Assassin | Dash slash | Shares Nazar's branches |
| 3 | Sifra | Frost/Lightning Mage | Ice shard / Lightning cone toggle | Frost, Shatter, Crystal + Lightning |
| 4 | Amun | Pharaoh Tank | Shockwave + auras | Quake, Bastion, Sovereign |
| 5 | Nazar | Samurai | Melee sword / Venom stance toggle | Way of Blade, Way of Venom, Way of Shadow |

---

## Hero 6: Zara -- Sand Summoner

### Concept

Zara commands the desert itself. Instead of directly damaging enemies, she summons sand warriors that auto-attack nearby targets. The player's job is positioning and deciding when/where to summon, creating a unique micro-management playstyle unlike any existing hero.

### Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 65 | Low -- summoner should stay back |
| Speed | 120 | Moderate |
| Damage | 8 | Per minion hit (not per player attack) |
| Range | 120 | Summon placement range from player |
| Cooldown | 2000ms | Time between summon casts |

### Base Attack: Sand Summon

- On attack (automatic, like other heroes), Zara summons a **Sand Warrior** at the nearest enemy's location (capped to `range` distance from player).
- The warrior materializes with a sand-swirl particle effect.
- Each warrior has its own HP pool (starts at 15), lasts up to **8 seconds**, and auto-attacks the nearest enemy in melee range for the player's `damage` value per hit (attack rate: once per 800ms).
- Warriors walk toward the nearest enemy at speed 80.
- When a warrior dies (timer or killed), it crumbles with a sand-burst particle.
- **Max active minions**: controlled by `minionCount` field on Player, starts at **2**. If the player summons while at max, the oldest minion crumbles immediately.

### Unique Mechanic: `minionCount`

A new numeric field on the Player class. Starts at 2, upgradeable through the Horde branch. Caps at 5 to prevent performance issues. The attack logic checks `activeMinions.length < player.minionCount` before spawning; if at cap, it destroys the oldest minion first.

### Skill Branches

#### Branch 1: Horde (color: 0xff8800 -- orange)

Theme: More minions, faster summoning, swarm tactics.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| ZH1 | Sand Legion | Max minions +1 | `p.minionCount += 1` (cap at 5) |
| ZH2 | Rapid Conjuring | Summon faster | `p.attackCooldown = Math.floor(p.attackCooldown * 0.7)` |
| ZH3 | War Cry | Minions attack 30% faster | Set flag `p.hasMinionFrenzy = true`; minion attack interval from 800ms to 560ms |
| ZH4 | Sand Storm | Summoning creates a brief AoE sand burst at summon point dealing 50% of damage | Set flag `p.hasSummonBurst = true`; on summon, deal `p.damage * 0.5` in radius 50 |
| ZH5 | Endless Horde | Max minions +2, minion duration +4s | `p.minionCount += 2` (cap at 5); set `p.minionDurationBonus = 4000` |

#### Branch 2: Architect (color: 0x00ccaa -- teal)

Theme: Minion durability, healing, and defensive utility.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| ZA1 | Hardened Sand | Minion HP +50% | Set `p.minionHpMult = (p.minionHpMult ?? 1) * 1.5`; minion base HP scales |
| ZA2 | Desert Mending | Minions slowly regenerate HP | Set flag `p.hasMinionRegen = true`; minions heal 2 HP/sec |
| ZA3 | Stone Skin | Minions take 30% less damage | Set `p.minionArmor = 0.3` |
| ZA4 | Guardian Golems | Minions taunt nearby enemies (enemies prefer targeting minions) | Set flag `p.hasMinionTaunt = true`; enemies within 60px of a minion retarget to it |
| ZA5 | Sand Fortress | Zara takes 5% less damage per active minion | Set flag `p.hasSandFortress = true`; on damage calc: `armor += activeMinions.length * 0.05` |

#### Branch 3: Overlord (color: 0x9933ff -- purple)

Theme: Sacrificial mechanics, minion explosions, offensive synergy.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| ZO1 | Unstable Sand | Minions explode on death dealing AoE damage | Set flag `p.hasMinionExplosion = true`; on death: deal `p.damage * 2` in radius 60 |
| ZO2 | Blood Offering | Sacrifice a minion to heal Zara for 15 HP | Set flag `p.hasSacrifice = true`; every 5th summon when at max: oldest minion explodes, Zara heals 15 |
| ZO3 | Frenzy Aura | Minions near each other deal +20% damage per adjacent minion | Set flag `p.hasFrenzyAura = true`; minions within 80px of another minion get damage bonus |
| ZO4 | Detonation Wave | Activate to explode ALL minions simultaneously for massive AoE | Set flag `p.hasDetonation = true`; when Zara takes lethal-threshold damage (below 20% HP), all minions detonate for `p.damage * 3` each |
| ZO5 | Pharaoh's Curse | Enemies killed by minions spawn a temporary mini-minion (lasts 3s, half damage) | Set flag `p.hasCursedSpawn = true`; on minion-kill, 40% chance to spawn a 3s mini-minion |

### Build Path Synergies (Zara)

- **Swarm Master** (full Horde): Sand Legion + Rapid Conjuring + War Cry + Endless Horde -> 5 fast-attacking minions flooding the screen
- **Immortal Architect** (Horde + Architect): Sand Legion + Hardened Sand + Guardian Golems + Sand Fortress -> tanky player surrounded by damage-soaking golems
- **Suicide Squad** (Horde + Overlord): Sand Legion + Endless Horde + Unstable Sand + Detonation Wave -> summon minions just to explode them
- **Iron Army** (full Architect): Hardened Sand + Desert Mending + Stone Skin + Guardian Golems + Sand Fortress -> unkillable minion wall
- **Chain Reaction** (Overlord + Horde): Unstable Sand + Pharaoh's Curse + Sand Legion + Rapid Conjuring -> kills spawn mini-minions that also explode on death

---

## Hero 7: Ra -- Solar Priest

### Concept

Ra channels the power of the sun through a continuous beam that ramps up in damage the longer it stays locked onto a single target. The player is rewarded for positioning well and committing to targets, creating a high-risk, high-reward playstyle -- stay still and melt a boss, or constantly reposition and lose your charge.

### Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 75 | Below average -- glass cannon |
| Speed | 110 | Slow, encourages standing and channeling |
| Damage | 15 | Base beam DPS before ramp multiplier |
| Range | 160 | Long range beam |
| Cooldown | 0ms | Continuous like Ignara's flamethrower |

### Base Attack: Solar Beam

- Ra fires a continuous golden beam toward the nearest enemy.
- The beam locks onto the target. While hitting the **same target**, the damage multiplier ramps:
  - 0.0s: 50% damage (7.5 effective DPS)
  - 1.0s: 100% damage (15 effective DPS)
  - 2.0s: 150% damage (22.5 effective DPS)
  - 3.0s: 200% damage (30 effective DPS) -- MAX
- If the target dies or the beam switches targets (nearest enemy changes), `beamCharge` resets to 0.
- The beam deals damage per frame (like Ignara's flamethrower), scaled by `(deltaMs / 1000) * damage * chargeMultiplier`.

### Visual Design

- **0% charge**: Thin (2px wide) pale yellow line from Ra to target.
- **50% charge**: Medium (4px wide) bright gold beam, small particle emitter at hit point.
- **100% charge**: Wide (6px wide) intense white-gold beam with solar flare particles at both ends, screen-edge glow effect.
- The beam width and brightness should interpolate smoothly using the `beamCharge` value (0.0 to 1.0).

### Unique Mechanic: `beamCharge`

A new float field on the Player class, range 0.0 to 1.0. Increases at rate `1/3` per second while hitting the same target (takes 3s to reach max). Resets to 0 on target switch. The `chargeMultiplier` is calculated as `0.5 + 1.5 * beamCharge` (ranges from 0.5x to 2.0x).

Additional fields needed:
- `beamTargetId: number | null` -- tracks which enemy the beam is locked to
- `beamChargeRate: number` -- base rate of charge gain (default: 0.333/s, upgradeable)
- `beamMaxMult: number` -- maximum damage multiplier at full charge (default: 2.0, upgradeable)

### Skill Branches

#### Branch 1: Radiance (color: 0xFFD700 -- gold)

Theme: Faster charging, AoE at max charge, blinding effects.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| RR1 | Solar Flare | Beam charges 30% faster | `p.beamChargeRate *= 1.3` |
| RR2 | Sunburst | At max charge, beam splashes to enemies near target | Set flag `p.hasSunburst = true`; at beamCharge >= 0.9, deal 40% damage in radius 50 around target |
| RR3 | Blinding Light | Max-charged beam blinds target (miss 50% attacks for 2s) | Set flag `p.hasBlindingLight = true`; applies blind debuff at full charge |
| RR4 | Corona | Beam width at max charge triples, hitting enemies along the path | Set flag `p.hasCorona = true`; beam collision box widens to 40px at full charge, damages everything it touches |
| RR5 | Supernova | When target dies at full charge, solar explosion at death location | Set flag `p.hasSupernova = true`; on kill at beamCharge >= 0.8, explosion deals `p.damage * 4` in radius 80 |

#### Branch 2: Eclipse (color: 0x8B0000 -- dark red)

Theme: Lifesteal, self-damage for power, execute mechanics.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| RE1 | Solar Drain | Beam heals Ra for 15% of damage dealt | Set flag `p.hasBeamLifesteal = true`; heal `damage * 0.15` per tick |
| RE2 | Dark Sun | Beam max multiplier increases to 3.0x, but Ra loses 1 HP/sec while channeling | `p.beamMaxMult = 3.0`; set flag `p.hasDarkSun = true` |
| RE3 | Umbral Fire | Below 40% HP, beam charges instantly to 50% | Set flag `p.hasUmbralFire = true`; if `hp/maxHp < 0.4`, `beamCharge = Math.max(beamCharge, 0.5)` |
| RE4 | Soul Burn | Enemies below 25% HP take double beam damage | Set flag `p.hasSoulBurn = true`; if target HP < 25%, multiply damage by 2 |
| RE5 | Total Eclipse | Activate: drain 30% of current HP to set beam to max charge and freeze it there for 5s | Set flag `p.hasTotalEclipse = true`; on Q key: spend HP, lock beamCharge at 1.0 for 5000ms |

#### Branch 3: Prism (color: 0xE0E0FF -- white/rainbow)

Theme: Beam splitting, chain targeting, prismatic damage types.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| RP1 | Refraction | Beam splits to hit a 2nd target at 40% damage | Set flag `p.hasRefraction = true`; secondary beam to next-nearest enemy at 40% damage |
| RP2 | Prismatic Shift | Beam cycles damage types (fire/ice/lightning) every 2s, applying respective debuffs | Set flag `p.hasPrismaticShift = true`; rotate element every 2s: fire=burn, ice=slow, lightning=stun |
| RP3 | Light Speed | Beam charge is retained at 50% on target switch instead of full reset | Set `p.beamChargeRetention = 0.5`; on switch: `beamCharge *= p.beamChargeRetention` |
| RP4 | Cascade | At full charge, beam chains through up to 3 enemies, each at -20% damage | Set flag `p.hasCascade = true`; at full charge, beam hits up to 3 targets in a line, -20% per bounce |
| RP5 | Singularity | Full-charge beam pulls all enemies within 120px toward the target | Set flag `p.hasSingularity = true`; at beamCharge >= 0.9, gravity well at beam target pulling enemies inward |

### Build Path Synergies (Ra)

- **Solar Cannon** (full Radiance): Solar Flare + Sunburst + Corona + Supernova -> fast-charging wide beam that detonates targets on death
- **Vampire Sun** (Eclipse + Radiance): Solar Drain + Dark Sun + Solar Flare + Sunburst -> massive DPS with sustain to offset the self-damage
- **Berserker Priest** (full Eclipse): Dark Sun + Umbral Fire + Soul Burn + Total Eclipse -> extremely dangerous glass cannon that gets stronger as HP drops
- **Prismatic Engine** (Prism + Radiance): Refraction + Light Speed + Solar Flare + Corona -> multiple beams charging quickly, wide coverage
- **Death Laser** (Eclipse + Prism): Dark Sun + Cascade + Soul Burn + Light Speed -> chaining beam that executes low-HP targets across the screen
- **Rainbow God** (full Prism): Refraction + Prismatic Shift + Cascade + Singularity -> beam splits, chains, debuffs, and pulls everything into a kill zone

---

## Unlock System

### Achievement-Based Hero Unlocking

Both new heroes start **locked** on the hero select screen. They are unlocked by earning specific achievements through the existing `MetaProgress` system.

| Hero | Required Achievement | Achievement ID | Condition | Flavor Text |
|------|---------------------|----------------|-----------|-------------|
| Zara | Slayer | `kill_500` | 500 total kills across all runs | "The sands answer your call." |
| Ra | Veteran | `win_3` | Win 3 runs (survive full 10 minutes) | "The sun god has chosen you." |
| Khet | Roster Call | `play_all` | Play 1 run with each base hero (Ignara, Sifra, Amun, Nazar) | "A shadow emerges from the darkness." |

Note: `kill_500` and `win_3` already exist as achievement definitions in `MetaProgress.ts`. No new achievement definitions are needed for Zara and Ra. Khet's unlock uses `play_all` which also already exists.

### Data Model Changes

#### `MetaProgress.ts`

1. **Add hero unlock mapping** -- a new constant that maps hero types to their unlock achievement:

```
const HERO_UNLOCK_REQUIREMENTS: Record<string, { achievementId: string; flavorText: string } | null> = {
  ignara: null,   // always available
  sifra:  null,   // always available
  amun:   null,   // always available
  nazar:  null,   // always available
  khet:   { achievementId: 'play_all', flavorText: 'A shadow emerges from the darkness.' },
  zara:   { achievementId: 'kill_500', flavorText: 'The sands answer your call.' },
  ra:     { achievementId: 'win_3',    flavorText: 'The sun god has chosen you.' },
}
```

2. **Add static helper method** `isHeroUnlocked(heroType: string): boolean` that checks whether the required achievement (if any) is unlocked in the current `MetaData`.

3. **Update `HEROES` array** (line 46) to include `'zara'` and `'ra'` so hero-related achievements that iterate heroes include them.

4. **Add new hero-mastery achievements**:
   - `win_zara`: "Desert Queen" -- Win with Zara
   - `win_ra`: "Sun King" -- Win with Ra

#### `StartScene.ts`

1. **Update `HeroDef` interface** to add an optional `locked` state:

```
interface HeroDef {
  type: HeroType
  name: string
  role: string
  color: number
  asset: string
  fw: number; fh: number; scale: number
  tint?: number
  frames: number
  yOff?: number
  unlockAchievement?: string   // NEW: achievement ID required, or undefined if always available
  unlockFlavorText?: string    // NEW: text shown on locked hero tooltip
}
```

2. **Add Zara and Ra to `HEROES` array** with their `unlockAchievement` fields.

3. **Locked hero visual treatment in `create()`**:
   - Locked heroes render with a dark silhouette (grayscale tint + 50% alpha).
   - A lock icon overlays the hero circle.
   - Clicking a locked hero shows a tooltip: achievement name, progress (e.g., "342 / 500 kills"), and flavor text.
   - Locked heroes cannot be selected for play.

4. **On scene create**, call `MetaProgress.isHeroUnlocked(hero.type)` for each hero to determine locked state.

#### `Player.ts`

1. **Expand `HeroType` union** to include `'zara' | 'ra'`.

2. **Add entries to `HERO_DEFS`** and `SPRITE_HEROES` for both new heroes.

---

## Implementation Notes

### Zara -- Required Code Changes

#### New Fields on Player

```typescript
// Zara minion mechanic
minionCount = 2               // max active sand warriors
minionHpMult = 1.0            // multiplier to minion base HP
minionArmor = 0               // damage reduction for minions
minionDurationBonus = 0       // extra ms added to minion lifetime

// Zara upgrade flags
hasMinionFrenzy = false        // ZH3: minions attack faster
hasSummonBurst = false         // ZH4: AoE on summon
hasMinionRegen = false         // ZA2: minion HP regen
hasMinionTaunt = false         // ZA4: minions taunt enemies
hasSandFortress = false        // ZA5: armor per active minion
hasMinionExplosion = false     // ZO1: AoE on minion death
hasSacrifice = false           // ZO2: sacrifice oldest minion to heal
hasFrenzyAura = false          // ZO3: minion proximity damage bonus
hasDetonation = false          // ZO4: mass-detonate all minions
hasCursedSpawn = false         // ZO5: kills spawn mini-minions
```

#### New Entity: `SandMinion.ts`

A new entity class extending `Phaser.Physics.Arcade.Sprite`:

- **Properties**: `hp`, `maxHp`, `damage`, `lifetime`, `spawnTime`, `owner` (ref to Player), `attackInterval`, `lastAttackTime`
- **Constructor**: Takes scene, x, y, owner Player, reads `minionHpMult` and `minionArmor` from owner
- **`update(time, delta)`**: 
  - Move toward nearest enemy (use same enemy group reference pattern as `Scorpion.ts`)
  - If within melee range (30px), attack at interval
  - Check lifetime expiry: `if (time - spawnTime > 8000 + owner.minionDurationBonus) die()`
  - If `hasMinionRegen`, heal 2 HP/sec
- **`die()`**: 
  - If `owner.hasMinionExplosion`, deal AoE damage
  - Sand-burst particle, then destroy
- **`takeDamage(amount)`**: Apply `minionArmor` reduction, then subtract HP
- Visual: reuse/recolor an existing small enemy sprite, or generate a sandy-textured circle. Approximately 60% of player sprite size.

#### New Attack Method in Player

Add `attackType: 'summon'` to the `HeroDef` attackType union.

In the Player's attack dispatch logic (wherever attack types are handled, likely in `update()` or a dedicated attack method), add a `case 'summon'` that:

1. Finds nearest enemy
2. Spawns a `SandMinion` at enemy location (or at `range` distance toward enemy if too far)
3. Adds minion to a `Phaser.Physics.Arcade.Group` tracked on `GameScene`
4. If `activeMinions.length > minionCount`, destroy oldest
5. If `hasSummonBurst`, deal AoE at summon point

#### VFX Textures for GameScene

Generate the following textures in `GameScene.create()` (following the existing pattern of `generateTexture` calls):

- `sand_minion`: 16x16 sandy yellow circle with dark outline (0xD4A574)
- `sand_burst`: 8x8 light yellow particle (0xEDC9AF) for summon/death particle effects
- `sand_swirl`: 4x4 brown particle (0xC19A6B) for ambient minion particles

### Ra -- Required Code Changes

#### New Fields on Player

```typescript
// Ra beam mechanic
beamCharge = 0                 // 0.0 to 1.0, ramp progress
beamTargetId: number | null = null  // currently locked target entity ID
beamChargeRate = 0.333         // charge gained per second (1/3 = 3s to max)
beamMaxMult = 2.0              // damage multiplier at full charge
beamChargeRetention = 0        // fraction of charge kept on target switch (default: 0 = full reset)

// Ra upgrade flags
hasSunburst = false            // RR2: splash at max charge
hasBlindingLight = false       // RR3: blind debuff at max charge
hasCorona = false              // RR4: wide beam at max charge
hasSupernova = false           // RR5: explosion on kill at max charge
hasBeamLifesteal = false       // RE1: heal from beam damage
hasDarkSun = false             // RE2: +max mult but self-damage
hasUmbralFire = false          // RE3: instant 50% charge when low HP
hasSoulBurn = false            // RE4: double damage to low-HP enemies
hasTotalEclipse = false        // RE5: spend HP to lock max charge
totalEclipseUntil = 0          // timestamp when Total Eclipse expires
hasRefraction = false          // RP1: beam splits to 2nd target
hasPrismaticShift = false      // RP2: cycling damage types
hasCascade = false             // RP4: chain beam at full charge
hasSingularity = false         // RP5: gravity pull at full charge
```

#### New Attack Method in Player

Add `attackType: 'beam'` to the `HeroDef` attackType union.

The beam attack operates continuously (cooldown 0, like `flamethrower`):

1. **Target acquisition**: Find nearest enemy in range. Store its `id` as `beamTargetId`.
2. **Charge tracking**: 
   - If same target as last frame: `beamCharge = Math.min(1.0, beamCharge + beamChargeRate * (delta / 1000))`
   - If different target: `beamCharge = beamCharge * beamChargeRetention` (default 0 = full reset), update `beamTargetId`
   - If `hasUmbralFire` and HP < 40%: `beamCharge = Math.max(beamCharge, 0.5)`
   - If `hasTotalEclipse` and `totalEclipseUntil > time`: `beamCharge = 1.0`
3. **Damage calculation**: 
   - `mult = 0.5 + (beamMaxMult - 0.5) * beamCharge` (ranges from 0.5x to beamMaxMult)
   - `dmg = damage * mult * (delta / 1000)`
   - If `hasSoulBurn` and target HP < 25% of max: `dmg *= 2`
4. **Apply damage** to target
5. **Secondary effects** (per-frame checks):
   - `hasSunburst` and `beamCharge >= 0.9`: splash damage around target
   - `hasBeamLifesteal`: heal `dmg * 0.15`
   - `hasDarkSun`: lose `1 * (delta / 1000)` HP per frame
   - `hasRefraction`: fire secondary beam to 2nd nearest enemy at 40% damage
   - `hasCascade` and `beamCharge >= 1.0`: chain to up to 3 targets
   - `hasSingularity` and `beamCharge >= 0.9`: pull enemies toward target
6. **On target kill at high charge**:
   - `hasSupernova` and `beamCharge >= 0.8`: explosion at death location
   - `hasBlindingLight`: apply blind to nearby enemies

#### Visual: Beam Rendering

The beam should be rendered using `Phaser.GameObjects.Graphics` (similar pattern to Ignara's flame rendering):

1. Each frame, draw a line from Ra's position to the beam target.
2. Line width: `2 + 4 * beamCharge` pixels.
3. Line color interpolation: 
   - 0% charge: `0xFFFF99` (pale yellow, alpha 0.5)
   - 50% charge: `0xFFD700` (gold, alpha 0.7)
   - 100% charge: `0xFFFFFF` (white-hot, alpha 1.0)
4. At `beamCharge > 0.5`, add particle emitter at hit point (solar sparks).
5. At `beamCharge > 0.8`, add glow effect (second wider line at low alpha behind the main beam).
6. If `hasCorona` and charge >= 0.9, draw beam at 40px width with collision detection along its path.
7. If `hasRefraction` or `hasCascade`, draw additional thinner beams to secondary targets.
8. If `hasPrismaticShift`, tint the beam based on current element cycle (red/blue/yellow).

#### VFX Textures for GameScene

Generate the following textures:

- `solar_spark`: 4x4 bright gold particle (0xFFD700) for beam hit particles
- `solar_flare`: 8x8 white-hot particle (0xFFFACD) for supernova/sunburst effects
- `beam_glow`: 6x6 soft yellow glow particle (0xFFEE88) for ambient beam particles

#### Q-Key Activation (Ra)

Ra uses the Q key (same pattern as Sifra's stance toggle and Nazar's stance toggle) for:
- **Total Eclipse** (RE5): If `hasTotalEclipse`, pressing Q spends 30% current HP and locks `beamCharge` at 1.0 for 5 seconds. Cooldown: 15 seconds.
- If no Q-activated skill is unlocked, Q does nothing.

---

## Shared Implementation Notes

### UpgradeSystem.ts Changes

Add two new branch definition arrays following the exact pattern of existing heroes:

```
const ZARA_BRANCHES: BranchDef[] = [
  { name: 'Horde',    color: 0xff8800, upgrades: [ /* ZH1-ZH5 */ ] },
  { name: 'Architect', color: 0x00ccaa, upgrades: [ /* ZA1-ZA5 */ ] },
  { name: 'Overlord', color: 0x9933ff, upgrades: [ /* ZO1-ZO5 */ ] },
]

const RA_BRANCHES: BranchDef[] = [
  { name: 'Radiance', color: 0xFFD700, upgrades: [ /* RR1-RR5 */ ] },
  { name: 'Eclipse',  color: 0x8B0000, upgrades: [ /* RE1-RE5 */ ] },
  { name: 'Prism',    color: 0xE0E0FF, upgrades: [ /* RP1-RP5 */ ] },
]
```

Register these in the `PERSONAL_BRANCHES` record (wherever `IGNARA_BRANCHES`, `NAZAR_BRANCHES`, etc. are mapped to hero types).

### GameScene.ts Changes

1. **Minion group**: Add `sandMinions: Phaser.Physics.Arcade.Group` for Zara's minions.
2. **Minion-enemy collision**: Set up overlap between `sandMinions` and `enemies` group.
3. **Minion cleanup**: On player death or scene shutdown, destroy all active minions.
4. **Beam graphics**: Add a `Graphics` object for Ra's beam (similar to existing flame/aura graphics).

### WaveManager.ts Changes

No changes expected. Minions are player-spawned, not wave-spawned.

### Asset Requirements

| Hero | Spritesheet Needed | Notes |
|------|-------------------|-------|
| Zara | `assets/sand_summoner/Idle.png`, `Run.png`, `Attack.png`, `Hurt.png`, `Death.png` | Robed desert sorceress with gold/sand palette |
| Zara minion | `assets/sand_minion/Walk.png`, `Attack.png`, `Death.png` | Small humanoid sand warrior, 3-4 frame anims |
| Ra | `assets/solar_priest/Idle.png`, `Run.png`, `Attack.png`, `Hurt.png`, `Death.png` | Egyptian priest with solar disk headpiece, white/gold robes |

If spritesheets are not available, both heroes should have procedural texture generation (following the `Player.generateTexture()` fallback pattern):
- **Zara**: Sandy gold circle (0xD4A574) with darker robe outline
- **Ra**: Bright gold circle (0xFFD700) with white center glow

---

## Balance Considerations

### Zara

- **Weakness**: Low personal HP (65), no direct damage -- if all minions die, Zara is helpless until cooldown completes.
- **Strength**: Effective DPS scales with minion count. At 3 minions (post-ZH1), sustained DPS is `8 * 3 / 0.8 = 30` -- comparable to Ignara's flamethrower at close range.
- **Scaling concern**: Minion damage uses player's `damage` stat, so generic upgrades (Sharp Edge, Multistrike) apply indirectly. Multistrike should NOT affect minions (it increases the player's `strikeCount`, minions have their own attack logic).
- **Performance cap**: Hard cap of 5 minions + any cursed spawn mini-minions (max ~3 at a time). Total entity cap around 8 player-controlled entities. If performance is a concern, mini-minions from ZO5 should be capped at 3.

### Ra

- **Weakness**: Very low effective DPS in chaotic situations where targets change frequently. Against swarms, the beam resets constantly and deals only 50% base damage per target.
- **Strength**: Against bosses or tanky targets, Ra has the highest single-target DPS in the game at full charge (30 effective DPS base, up to 45 with Dark Sun).
- **Counterplay**: Movement resets don't affect charge -- only target switching does. This means Ra is strong against single threats but weak against diverse swarms (the opposite of Ignara).
- **Eclipse self-damage**: Dark Sun's 1 HP/sec drain is trivial early but meaningful over 10 minutes. Total Eclipse's 30% HP cost is a high-stakes gamble. Solar Drain provides the sustain needed to offset these costs.

### Cross-Hero Balance

| Situation | Best Hero | Ra's Rank | Zara's Rank |
|-----------|-----------|-----------|-------------|
| Dense swarm | Ignara | 5th (worst) | 3rd |
| Single boss | Ra | 1st (best) | 4th |
| Kiting needed | Nazar/Khet | 6th | 2nd (minions fight while she runs) |
| Sustained survival | Amun | 4th | 3rd (Sand Fortress build) |
| Speed clear | Khet | 7th | 5th |

---

## File Summary

Files to create:
- `src/entities/SandMinion.ts` -- new entity for Zara's minions

Files to modify:
- `src/entities/Player.ts` -- add `HeroType` variants, `HERO_DEFS`, `SPRITE_HEROES`, new fields, new attack methods
- `src/systems/UpgradeSystem.ts` -- add `ZARA_BRANCHES` and `RA_BRANCHES`, register in personal upgrades map
- `src/systems/MetaProgress.ts` -- add `HERO_UNLOCK_REQUIREMENTS` map, `isHeroUnlocked()` method, update `HEROES` array, add `win_zara` and `win_ra` achievements
- `src/scenes/StartScene.ts` -- add Zara/Ra to hero list, implement locked hero UI, check unlock state
- `src/scenes/GameScene.ts` -- add minion group, beam graphics, new VFX textures, minion-enemy overlap setup
- `src/config/GameConfig.ts` -- if hero-specific config values exist, add Zara/Ra entries

---

## Hero 8: Huntress -- Ranged DPS

### Concept

The Huntress is a precision ranged fighter who fires fast single-target arrows at exceptional range. Unlike existing heroes who either deal continuous damage (Ignara, Ra) or melee damage (Nazar, Khet, Amun), the Huntress introduces a true projectile-based attack loop. Her unique mechanic rewards mobile, target-switching play: keeping arrows flying at a steady pace against different enemies builds `quiverStacks`, boosting her already-fast attack speed into blinding territory. Coming to a stop or missing a shot punishes passivity and poor aim.

### Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 60 | Lowest in roster -- must kite effectively |
| Speed | 160 | Highest in roster -- built to stay mobile |
| Damage | 14 | Moderate; scales well with crit and stack multipliers |
| Range | 200 | Longest range in roster |
| Cooldown | 500ms | Fast base attack rate |

### Base Attack: Arrow Shot (`attackArrow`)

- On each attack cycle, the Huntress fires a single arrow projectile toward the nearest enemy.
- The arrow travels in a straight line at high velocity (suggested: 600px/s) and hits the first enemy it contacts.
- On hit: deal `damage` to the target, trigger `quiverStacks` logic (see below).
- On miss (arrow reaches max range with no hit): reset `quiverStacks` to 0.
- The attack method name in Player is `attackArrow`. It follows the same dispatch pattern as other `attackType` entries in `HERO_DEFS`.
- Add `attackType: 'arrow'` to the `HeroDef` attackType union.

### Unique Mechanic: `quiverStacks`

A new integer field on the Player class, range 0 to `quiverStackCap` (default 5).

**Stack rules:**
- Each arrow that hits a target increments `quiverStacks` by 1, **but only if the hit target is different from the last hit target** (`lastArrowTargetId`).
  - Hitting the same target consecutively does NOT build stacks (it holds current count).
- Stacks reset to 0 if:
  - An arrow misses (travels full range with no contact).
  - The Huntress is standing still for more than 200ms (check `body.velocity` magnitude < 5).
- Each stack grants **+8% attack speed** (implemented as a multiplier on `attackCooldown`):
  - Effective cooldown = `attackCooldown * (1 - 0.08 * quiverStacks)`
  - At 5 stacks (default cap): 500ms * 0.6 = **300ms** effective cooldown -- a 40% attack speed increase.
- A stack HUD indicator (5 small pip icons above the health bar) should display current stack count in the UI.

Additional fields needed:
- `quiverStacks: number` -- current stack count (default: 0)
- `quiverStackCap: number` -- maximum stacks (default: 5, doubled by Barrage)
- `lastArrowTargetId: number | null` -- tracks previous hit target to evaluate stack eligibility
- `lastMoveTime: number` -- timestamp of last frame where velocity was non-negligible (for still-reset check)

### Skill Branches

#### Branch 1: Precision (color: 0xffdd44 -- gold)

Theme: Single-target damage amplification, critical hits, and extended range.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| HU1 | Steady Aim | +20% damage to targets at full HP | Set flag `p.hasSteadyAim = true`; on hit: if `target.hp === target.maxHp`, multiply damage by 1.2 |
| HU2 | Piercing Arrow | Arrows pierce through 1 extra enemy | `p.pierceCount = (p.pierceCount ?? 0) + 1`; arrow projectile continues after first hit, damages the next enemy in its path |
| HU3 | Headshot | 25% chance per arrow to deal 2x crit damage | Set flag `p.hasHeadshot = true`; on hit: roll `Math.random() < 0.25`, if true deal `damage * 2` instead |
| HU4 | Sniper | +30 range, +15% damage | `p.range += 30`; `p.damage = Math.floor(p.damage * 1.15)` |
| HU5 | Deadeye | Critical hits chain to the nearest other enemy for 50% damage | Set flag `p.hasDeadeye = true`; when a Headshot crit fires, immediately deal `damage * 0.5` to the closest other enemy in range |

#### Branch 2: Trapper (color: 0x88cc44 -- green)

Theme: Area denial, roots, slows, and persistent hazards.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| HT1 | Caltrops | Dodging (moving faster than 90% speed for 0.3s) drops a caltrop cluster that slows enemies 50% for 2s | Set flag `p.hasCaltrops = true`; track sprint burst; on trigger, spawn a caltrop zone object at drop point |
| HT2 | Bear Trap | Every 10th arrow spawns a trap at the hit location that roots the next enemy to walk over it for 2s | Set flag `p.hasBearTrap = true`; track `p.arrowsFiredCount`; every 10th arrow, spawn a `BearTrap` hazard at impact point |
| HT3 | Poison Tips | Arrows apply a poison DOT dealing `damage * 0.15` per second for 3s | Set flag `p.hasPoisonTips = true`; on hit, apply a poison debuff object to target; debuff ticks at its stored rate independently of the arrow |
| HT4 | Net Shot | Every 8th arrow fires a net that snares all enemies in a 60px radius, reducing their speed by 70% for 2s | Set flag `p.hasNetShot = true`; track `p.arrowsFiredCount`; every 8th arrow, the projectile deals no extra damage but spawns an AOE snare on impact |
| HT5 | Minefield | Caltrops also deal `damage * 0.5` as burst damage when triggered, in addition to slowing | Enhances `hasCaltrops`; set flag `p.hasMineField = true`; caltrop zone deals damage on enemy entry |

#### Branch 3: Agility (color: 0x44bbff -- blue)

Theme: Attack speed, evasion, and multi-arrow volleys.

| ID | Name | Description | `apply` Effect |
|----|------|-------------|----------------|
| HA1 | Quick Draw | -20% base attack cooldown | `p.attackCooldown = Math.floor(p.attackCooldown * 0.8)` |
| HA2 | Evasive Roll | 15% chance to dodge incoming damage entirely | Set flag `p.hasEvasiveRoll = true`; in `takeDamage()`: if `Math.random() < 0.15`, skip damage entirely (flash dodge VFX) |
| HA3 | Rain of Arrows | Every 5th attack fires 3 arrows in a spread (center + ±15 degrees) instead of 1 | Set flag `p.hasRainOfArrows = true`; track `p.arrowsFiredCount`; on the 5th arrow, spawn 3 projectiles instead of 1 |
| HA4 | Fleet Foot | +25% movement speed | `p.speed = Math.floor(p.speed * 1.25)` |
| HA5 | Barrage | Doubles `quiverStackCap` (5 -> 10) and adds +3 additional arrows to Rain of Arrows volleys (3 -> 6) | `p.quiverStackCap *= 2`; set flag `p.hasBarrage = true`; Rain of Arrows fires 6 arrows at ±10°/±20°/±30° spread instead of 3 |

### Build Path Synergies (Huntress)

- **Glass Sniper** (full Precision): Steady Aim + Piercing Arrow + Headshot + Sniper + Deadeye -> one arrow hits full-HP targets for huge damage, pierces, crits, and chains -- wipes grouped enemies in a single shot
- **Kill Zone** (full Trapper): Caltrops + Bear Trap + Poison Tips + Net Shot + Minefield -> every approach lane becomes a gauntlet of roots, slows, and DOTs; Huntress deals sustained damage while enemies are locked down
- **Speed Demon** (full Agility): Quick Draw + Evasive Roll + Rain of Arrows + Fleet Foot + Barrage -> 10-stack quiver on a 300ms base cooldown (post Quick Draw) firing 6-arrow salvos with 15% dodge; overwhelming projectile density
- **Ambush Hunter** (Precision + Agility): Steady Aim + Headshot + Quick Draw + Fleet Foot + Barrage -> stay mobile to hold stacks, open every engagement on full-HP targets for massive crits
- **Sticky Swarm** (Trapper + Agility): Poison Tips + Net Shot + Rain of Arrows + Barrage -> 6-arrow volleys each applying poison to different targets, nets interrupt any enemy that gets past the initial wave
- **Deadeye Minefield** (Precision + Trapper): Piercing Arrow + Headshot + Deadeye + Caltrops + Minefield -> piercing crits chain across lines of slowed/rooted enemies, caltrop zones deal burst damage when crits pull enemies together

---

## Implementation Notes -- Huntress

### New Fields on Player

```typescript
// Huntress quiver mechanic
quiverStacks = 0               // current stack count (0 to quiverStackCap)
quiverStackCap = 5             // max stacks; doubled by Barrage
lastArrowTargetId: number | null = null  // tracks previous hit target for stack eligibility
lastMoveTime = 0               // timestamp of last frame with non-negligible velocity

// Huntress projectile fields
pierceCount = 0                // extra enemies an arrow passes through (HU2 adds 1)
arrowsFiredCount = 0           // running total of arrows fired; used for Bear Trap and Net Shot modulo checks

// Huntress upgrade flags
hasSteadyAim = false           // HU1: bonus damage to full-HP targets
hasHeadshot = false            // HU3: 25% crit chance for 2x damage
hasDeadeye = false             // HU5: crits chain to nearest other enemy
hasCaltrops = false            // HT1: drop caltrops on sprint
hasBearTrap = false            // HT2: every 10th arrow spawns a root trap
hasPoisonTips = false          // HT3: arrows apply 3s poison DOT
hasNetShot = false             // HT4: every 8th arrow is a net snare
hasMineField = false           // HT5: caltrops also deal damage
hasEvasiveRoll = false         // HA2: 15% dodge chance
hasRainOfArrows = false        // HA3: every 5th attack fires 3 arrows
hasBarrage = false             // HA5: double stack cap, 6-arrow rain
```

### Attack Method: `attackArrow`

Add `attackType: 'arrow'` to the `HeroDef` attackType union and implement a `case 'arrow'` branch in the Player attack dispatch:

1. **Find target**: nearest enemy within `range`.
2. **Apply quiver speed**: compute effective cooldown as `attackCooldown * (1 - 0.08 * quiverStacks)` before scheduling the next attack.
3. **Check Rain of Arrows**: if `hasRainOfArrows` and `arrowsFiredCount % 5 === 4` (the about-to-fire shot is the 5th), spawn 3 arrow projectiles (or 6 if `hasBarrage`) at spread angles. Each counts toward `arrowsFiredCount`.
4. **Otherwise**: spawn 1 arrow projectile toward target.
5. **Arrow projectile behavior**:
   - Travels at ~600 px/s in a straight line.
   - Hits up to `1 + pierceCount` enemies sequentially.
   - On each hit:
     - Apply damage (with Steady Aim, Headshot, and Poison Tips modifiers).
     - If this target's id !== `lastArrowTargetId`: increment `quiverStacks` (cap at `quiverStackCap`), update `lastArrowTargetId`.
     - If `hasBearTrap` and `arrowsFiredCount % 10 === 0`: spawn a `BearTrap` hazard at impact point.
     - If `hasNetShot` and `arrowsFiredCount % 8 === 0`: spawn AOE net snare at impact point.
     - If `hasHeadshot` crit fires and `hasDeadeye`: deal chain damage to nearest other enemy.
   - On expiry with no hit: reset `quiverStacks = 0`.
6. **Still-reset check** (in Player `update()`): if `body.velocity` magnitude < 5 for > 200ms (`time - lastMoveTime > 200`), reset `quiverStacks = 0`.

### Sprite Assets

Assets are already present at `public/assets/huntress/`. Load them in `GameScene.preload()` or `StartScene.preload()` following the existing `this.load.spritesheet(...)` pattern:

| Key | File | Frame Size | Frames |
|-----|------|------------|--------|
| `huntress_idle` | `public/assets/huntress/Idle.png` | 150x150 | 8 |
| `huntress_run` | `public/assets/huntress/Run.png` | 150x150 | 8 |
| `huntress_attack` | `public/assets/huntress/Attack1.png` | 150x150 | 5 |
| `huntress_death` | `public/assets/huntress/Death.png` | 150x150 | 8 |
| `huntress_hit` | `public/assets/huntress/Take Hit.png` | 150x150 | 3 |

### VFX Textures for GameScene

Generate the following textures in `GameScene.create()`:

- `arrow_projectile`: 12x3 dark brown/amber elongated rectangle (0x8B4513) representing the arrow shaft; rotate to travel direction each frame
- `arrow_hit_spark`: 4x4 bright yellow particle (0xFFEE44) for impact burst on enemy hit
- `caltrop_zone`: 20x20 dark grey spiky shape (0x555555), semi-transparent, rendered as a static hazard sprite in the world
- `bear_trap`: 16x16 dark iron color (0x444444), rendered as a static hazard sprite in the world
- `net_aoe`: 40x40 soft green ring (0x88cc44, alpha 0.4) flash at net-snare impact point, fades over 0.4s
- `dodge_flash`: 32x32 white circle (0xFFFFFF, alpha 0.5) centered on player, fades over 0.2s, plays on Evasive Roll trigger

### Unlock Condition

Add Huntress to the `HERO_UNLOCK_REQUIREMENTS` map in `MetaProgress.ts`:

```
huntress: { achievementId: 'headshot_100', flavorText: 'The forest has eyes.' }
```

Add the `headshot_100` achievement definition: "Bull's Eye" -- land 100 critical hits across all runs (track via a new `MetaData` counter `critHits: number`).

Also add `win_huntress`: "Queen of the Hunt" -- Win a run with Huntress.

### UpgradeSystem.ts

```
const HUNTRESS_BRANCHES: BranchDef[] = [
  { name: 'Precision', color: 0xffdd44, upgrades: [ /* HU1-HU5 */ ] },
  { name: 'Trapper',   color: 0x88cc44, upgrades: [ /* HT1-HT5 */ ] },
  { name: 'Agility',   color: 0x44bbff, upgrades: [ /* HA1-HA5 */ ] },
]
```

Register in the `PERSONAL_BRANCHES` record alongside `ZARA_BRANCHES` and `RA_BRANCHES`.

### Files to Create or Modify (Huntress additions)

Files to create:
- No new entity files required. Arrow projectiles can reuse or extend the existing projectile/bullet pattern already in the codebase (check `GameScene` for any existing `bulletGroup` or similar).

Files to modify:
- `src/entities/Player.ts` -- add `'huntress'` to `HeroType`, add `HERO_DEFS` entry, add new fields, add `attackArrow` method, update `quiverStacks` still-reset in `update()`
- `src/systems/UpgradeSystem.ts` -- add `HUNTRESS_BRANCHES`, register in personal upgrades map
- `src/systems/MetaProgress.ts` -- add `huntress` to `HERO_UNLOCK_REQUIREMENTS`, add `headshot_100` and `win_huntress` achievements, add `critHits` counter to `MetaData`
- `src/scenes/StartScene.ts` -- add Huntress to hero list with `unlockAchievement: 'headshot_100'`
- `src/scenes/GameScene.ts` -- add arrow projectile group, caltrop/trap hazard groups, new VFX textures, overlap callbacks for arrow-enemy and hazard-enemy collisions
- `src/config/GameConfig.ts` -- add Huntress entries if hero-specific config values exist
