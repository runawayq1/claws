# CLAWS — Game Design Document
*Generated from source: 2026-04-12*

---

## Overview

**CLAWS** is a Vampire Survivors-style arena survival game built with **Phaser 3 + Vite + TypeScript**.

- Survive waves of enemies for **10 minutes**
- Collect XP → level up → pick upgrades
- Each hero has **3 upgrade branches** with unique playstyles
- Meta-progression via **Forge** (permanent upgrades, hero unlocks)
- Supports **solo**, **local co-op** (`?coop` URL param), and **online multiplayer** (Colyseus)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Engine | Phaser 3 |
| Build | Vite + TypeScript |
| Server | Colyseus.js (WebSocket) |
| Database | Supabase (leaderboard, session logs) |
| Deploy | Vercel (client), Render/Railway (server) |

---

## Scene Flow

```
LoadingScene
    └── StartScene
          ├── NameInputScene
          ├── ForgeScene          (meta upgrades)
          ├── ProfileScene        (achievements)
          ├── LeaderboardScene    (Supabase top scores)
          └── HeroSelectScene
                ├── GameScene ↔ UIScene (parallel)
                │     └── LevelUpScene (on level-up)
                └── LobbyScene (online only)
                      └── GameScene ↔ UIScene
```

**On death/win**: GameScene → HeroSelectScene

---

## Heroes

All heroes extend `Player.ts`. Stats defined in `HERO_DEFS`.

### Base Stats

| Hero | Display | HP | Speed | Damage | Range | Attack CD | Attack Type |
|---|---|---|---|---|---|---|---|
| ignara | Ignara | 80 | 140 | 30 | 180 | 700ms | Fireball AoE |
| sifra | Sifra | 70 | 150 | 12 | 160 | 800ms | Ice Shard / Lightning Cone |
| amun | Amun | 160 | 120 | 22 | 65 | 800ms | Shockwave Ring |
| nazar | Nazar | 90 | 140 | 18 | 55 | 400ms | Melee Slash / Venom Puddle |
| huntress | Lyra | 80 | 140 | 18 | 300 | 500ms | Spear Throw / Earth Slam |
| khashin | Khashin | 90 | 140 | 18 | 160 | 900ms | Sand Swipe / Wind Slash |
| muller | Givi | 160 | 110 | 38 | 260 | 1100ms | Crystal Wave / Crystal Eruption |

All heroes: `armor=0`, `hpRegen=0.25/s`, `splashRadius=0`, `xpMult=1`, `strikeCount=1`

---

### Ignara — Fire Mage
**File**: `src/entities/heroes/ignara.ts`

**Attack**: Fireball → nearest enemy, 350px/s, AoE explosion on impact (radius = 40 + splashRadius×0.8), knockback, camera shake.

**Projectile behavior**:
- **Inferno**: circle projectile, `air_explosion` VFX on impact.
- **Wildfire**: `vfx_firebolt` sprite, **stops on first enemy contact** (explodes immediately).
- **Pyre**: circle projectile, large `air_burst` explosion on impact.

#### Branches

| Branch | Color | Theme |
|---|---|---|
| **Inferno** | 0xff6600 | Burn everything. Ask questions never. |
| **Wildfire** | 0xff3300 | Relentless. Burning. It never stops. |
| **Pyre** | 0xff8800 | Get close. Hit hard. Walk away burning. |

---

#### Branch 1: Inferno

**Skill 1 — Wide Burn** (`if1`): Increases explosion splash radius.
- L1: Explosion radius +2m
- L2: Radius +2m more (total +4m)
- L3: Radius +3m more + applies Scorched Earth burn DOT

**Skill 2 — Inferno Reach** (`if2`): Extends fireball range and boosts damage.
- L1: Fireball range +3m
- L2: Range +2m more, +10% dmg
- L3: Range +2m more, +15% dmg

**Skill 3 — White Fire** (`if3`): Raw damage amplification; unlocks Wildfire chain at max level.
- L1: +30% fireball dmg
- L2: +15% more dmg
- L3: +15% dmg + gains `hasWildfire` (on-kill: chain explosion jumps to nearby enemies)

**Ultimate — Firestorm** (`if5`): Spawns orbiting mini-fireballs that periodically strike the nearest enemy.
- L1: 2 mini-fireballs at 50% dmg in 3.5m AoE, +15% dmg
- L2: +1 more mini-fireball, +10% dmg
- L3: Mini-fireballs also drop Scorched Earth on impact

---

#### Branch 2: Wildfire
*(Uses `vfx_firebolt` projectile that stops on first contact. CD stacking build.)*

**Skill 1 — Sustained Burn** (`bh1`): Applies stacking burn DOT on hits, reduces cooldown.
- L1: Hits apply Burn (4%/tick, max 5 stacks), −10% CD
- L2: Max stacks → 7, −10% CD
- L3: Fully stacked: +20% dmg taken, −10% CD; sets `burnStackedDmgBonus`

**Skill 2 — Powder Keg** (`bh2`): Every N kills the next shot deals massively boosted damage.
- L1: Every 10 kills: next shot ×2 blast; sets `hasPowderKeg`
- L2: Every 8 kills: ×2.5 blast
- L3: Every 6 kills: ×3 blast + 2 shrapnel; sets `powderKegShrapnel`

**Skill 3 — Ember Volley** (`bh3`): On-kill stacking CD reduction; at max level nearby burns also reduce CD.
- L1: −12% CD; on kill: −2% CD permanent stack (cap 20%); sets `hasEmberVolley`
- L2: −12% CD; cap raised to 30%
- L3: −12% CD, +10% dmg; burns nearby enemies also reduce CD; sets `emberVolleyDmg`

**Skill 4 — Flashpoint** (`bh4`): On-kill charges that allow instant free shots.
- L1: On kill: next shot instant (1 charge); sets `hasFlashpoint`
- L2: 2 instant shot charges
- L3: 2 instant shots + 10% dmg burst on instant shots; sets `flashpointBurst`

**Ultimate — Infernal Cadence** (`bh5`): Temporary frenzy mode — triple attack speed, burns empowered.
- L1: 6s duration: ×3 speed, burns apply ×2, +15% dmg; sets `hasInfernalCadence`
- L2: Duration → 8s; full-stack kills explode
- L3: Duration → 10s; explosion radius ×1.5, +10% dmg

---

#### Branch 3: Pyre
*(Circle projectile with large `air_burst` explosion. Tanky close-range fire build.)*

**Skill 1 — Slug Round** (`ih1`): Heavy oversized shot — large projectile, big explosion, high damage.
- L1: ×1.6 projectile size, 20px blast, +15% dmg; sets `hasSlugRound`
- L2: +15% dmg, blast → 30px
- L3: +15% dmg, pierces 1 enemy; sets `slugPierce = 1`

**Skill 2 — Thick Skin** (`ih2`): Passive armor and regeneration stacking.
- L1: Stand your ground — +5% armor, +0.3 HP/s regen
- L2: Tempered — +5% armor, +0.3 HP/s regen
- L3: Furnace heart — +0.5 HP/s regen, +15 max HP

**Skill 3 — Immolation** (`ih3`): Persistent burn aura centered on Ignara.
- L1: Burn aura 70px, 12% dmg/s; sets `hasImmolation`
- L2: Aura grows — 85px, 16% dmg/s
- L3: Consecrated pyre — 20% dmg/s; kills drop Scorched Earth; sets `hasScorchedEarth`

**Ultimate — Scorched Bastion** (`ih5`): Fortified aura enhancement — HP, aura radius, lifesteal.
- L1: +15 HP, aura radius → 100px; sets `hasScorchedBastion`
- L2: +10 HP, aura dmg ×1.3
- L3: +10 HP, aura lifesteal 2%; sets `scorchedBastionLifesteal = 0.02`

---

### Ignara Icon Prompts

**Wildfire branch — skills needing new icons:**

**Sustained Burn**: A dark background with a single ember-orange flame stack rising into layered tongues, each layer glowing hotter than the last — fantasy RPG icon style with deep red and amber tones.

**Powder Keg**: A centered dark iron barrel wrapped in glowing red-orange fire cracks on a black background, fuse burning bright — fantasy RPG icon style in volcanic ember palette.

**Ember Volley**: A cascade of bright fire sparks erupting upward from a single central point on a dark background, suggesting rapid on-kill chain ignitions — fantasy RPG icon in deep orange and ember-gold.

**Flashpoint**: A single incandescent muzzle flash or lightning-fast fire bolt frozen mid-frame on a black background, white-hot core fading to amber — fantasy RPG icon conveying instant trigger speed.

**Infernal Cadence**: Three overlapping firebolt streaks radiating from a center point on a dark background, suggesting rapid sequential shots — fantasy RPG icon in blazing red-orange with motion-blur trails.

**Pyre branch — skills needing new icons:**

**Slug Round**: A single massive dark iron cannonball wreathed in fire on a black background, oversized and smoldering with a deep orange glow — fantasy RPG icon conveying weight and explosive impact.

**Thick Skin**: A close-up of cracked obsidian-dark scales or armor plating with ember-red heat glowing through the fissures on a dark background — fantasy RPG icon in charcoal and fire tones.

**Immolation**: A symmetrical circular fire aura radiating outward from a central point on a black background, suggesting a standing burn field — fantasy RPG icon in concentric orange and deep red rings.

**Scorched Bastion**: A squat stone fortress tower engulfed in roaring flame on a dark background, walls glowing molten orange — fantasy RPG icon in volcanic fire palette suggesting immovable burning defense.

---

### Nazar — Plague Doctor / Samurai
**File**: `src/entities/heroes/nazar.ts`

**Dual stance**: Sword (melee slash) / Venom (ranged poison puddle)

**Sword attack**: Multi-strike melee. Shadow Step blinks 30px toward enemy pre-attack. Assassinate: 2× vs solo enemy. Hemorrhage: bleed DOT 15% × 6 ticks. Execute (Blood Scent / Death Mark).

**Venom attack**: On-hit poison puddle — 30% dmg/tick for 3s. Pandemic spreads mini-clouds on kill. Necrosis ramps +20%/tick.

#### Branches

| Branch | Color | Theme |
|---|---|---|
| **Way of the Blade** | 0xccccdd | Multi-strike, blink, bleed, execute |
| **Way of Venom** | 0x44cc44 | Poison puddles, pandemic spread, ramp DOT |
| **Way of Shadow** | 0x9955dd | Invulnerability post-melee, slow trail, Smoke Bomb |

**Key Ultimates**:
- *Assassinate*: 2× dmg vs lone enemy, execute below 20% HP
- *Necrosis*: Poison ticks ramp to 3× on last tick at L3
- *Death Mark*: First hit marks; second hit +40% dmg

---

### Sifra — Ice Mage
**File**: `src/entities/heroes/sifra.ts`

**Dual stance**: Ice Shard (ranged, piercing, slows) / Lightning Cone (continuous, chains)

**Ice attack**: Fires `strikeCount` shards, pierces `pierceCount` enemies, slows (0.7× or 0.3× with Deep Freeze). Absolute Zero: freeze stun 2s if speed drops below 0.35× base. Frost Nova: every 4th shot fires 8-shard ring burst.

**Lightning attack**: Cone drain chaining to nearby enemies at 60% dmg. Overcharge: ~8% chance 3× burst. Ball Lightning orbit at L3.

#### Branches

| Branch | Color | Theme |
|---|---|---|
| **Frost** | 0x55aaff | Slow, freeze, Blizzard Aura, Eternal Winter field |
| **Shatter** | 0x88ddff | Bonus vs slowed, Shatter mini-shards, Ice Spear pierce |
| **Lightning** | 0x9966ff | Cone chain, Arc Reach, Storm Lord random strikes |

**Mastery bonus**: Every 2 mastery levels of ice/lightning → +2 range.

**Key Ultimates**:
- *Eternal Winter*: Frost field 20% dmg/s + 60% slow; freezes at L3
- *Avalanche*: +3 homing shatter shards per hit
- *Storm Lord*: Every 2s (1.5s at L3) random enemy hit for 2× dmg

---

### Amun — Pharaoh Guardian
**File**: `src/entities/heroes/amun.ts`

**Attack**: Shockwave ring AoE centered on player. Ring size = `range`, particle count = `splashRadius`, ring count = `strikeCount`. Knockback = 200 + splashRadius×2 (500 with Colossus).

**Branch gating**: Only **Wrath** available at start. **Bastion** unlocks via tutorial quest "Forged in Battle" (kill 100). **Quake** unlocks via "The Long Watch" (survive 150s).

**Quake stance** (Q key): Titan's Pulse — launches boulder projectile 30m.

#### Branches

| Branch | Color | Theme |
|---|---|---|
| **Wrath** | 0xff6633 | Orbiting swords, on-hit AoE pulse, Consecration aura, execute |
| **Bastion** | 0x4488ff | Armor stacking, Iron Will (cap hits at 10% maxHP), Undying rebirth |
| **Quake** | 0xffcc44 | Boulder throw, stun, Colossus knockback, multi-wave Cataclysm |

**Key Ultimates**:
- *Divine Judgment*: Auto-execute enemies below 15% HP within range
- *Undying*: Rebirth at full HP + shockwave; L3 = 2 rebirths
- *Cataclysm*: 2nd shockwave at 350ms (60% dmg), L3 adds 3rd wave (40% dmg)

---

### Huntress (Lyra) — Spear Thrower
**File**: `src/entities/heroes/huntress.ts`

**Dual stance**: Melee (close stab + Earth Slam line) / Spear (ranged thrown, 350px/s)

**Melee attack**: 80px hit radius. Earth Slam: shockwave line 150px, 60% dmg. Critical Strike: 20% → 2× dmg. Marked Target: +30% dmg vs marked enemies.

**Spear attack**: Flies full screen. Volley: every 5th throw fires 3 spears. Net Throw: every 8th throw roots 1.5s. Explosive Tips: AoE on first hit (radius 40 + splashRadius×0.4, 35% dmg). Splinter Shot: if spear misses all, spawns 3 shards.

**Passives**: Battle Frenzy (kill → attack speed), Kill Stride (kill → +20% speed 3-5s), Camouflage (invisible after kill), Caltrops (spike zones every 800ms while moving), Leap (auto-dash 120px from 4+ enemies, 4s CD), Headhunter (execute below 15%), Spear Wall (3 orbiting spears).

#### Branches

| Branch | Color | Theme |
|---|---|---|
| **Predator** | 0xff4444 | Crit, mark spread, Battle Frenzy, Volley |
| **Stalker** | 0x44cc44 | Kill Stride, Caltrops, Net Throw, Camouflage |
| **[Third branch]** | — | Spear Wall, Earth Slam, Explosive Tips, Splinter Shot |

---

### Khashin — Sand Assassin
**File**: `src/entities/heroes/khashin.ts`

**Dual stance**: Haboob (90° cone, sand AoE) / Sirocco (Wind Slash, ranged crescent arc)

**Haboob attack**: 90° cone, 90px range, base dmg ×1.3. Blinds enemies (60% speed, 2s). Choking Sand: +35% dmg to blinded. Sandstorm Wall: leaves sand cloud per hit (15% dmg/tick, 3s).

**Wind Slash attack**: Crescent arc 400px/s, pierces `windSlashPierce` enemies. Every 5th attack: Dust Devil tornado (100px/s, 30% dmg continuous; Cyclone Surge: 52px radius, 3s).

**Passives**: Sand Armor (absorb shield 25% maxHP), Eye of the Storm (anchored tornado every 8s), Phantom Step (auto-dash 100px away, 6s CD), Drift (slow trail while moving), Desert Wind (omni-knockback every 10s), Scarab Tide (on-kill: 4 seeking scarabs → blind on impact).

#### Branches

| Branch | Color | Theme |
|---|---|---|
| **Gale** | 0x88DDFF | Wind slash damage/pierce, Cyclone Surge, Eye of the Storm |
| **Dune** | 0xE8A040 | Blind amplification, Sand Armor, Scarab Tide |
| **Mirage** | 0xCCAAFF | Speed, Phantom Step, Drift, Desert Wind |

**Key Ultimates**:
- *Eye of the Storm*: Anchored tornado every 8s; L3 = 2 tornadoes
- *Sandstorm Wall*: Haboob arcs leave sand clouds that apply blind
- *[Mirage ultimate]*: Phantom Step + Desert Wind combos

---

### Muller (Givi) — Crystal Gnome
**File**: `src/entities/heroes/muller.ts`

**Dual stance**: Wave (directional crystal spike line) / Eruption (360° crystal burst)

**Wave attack**: 8 crystal spikes (16 with Shardstorm) spawn sequentially with 40ms delay. Deep Vein: +30% dmg at max range. Tectonic Fury: every 5th slam doubles range. Crystal Shrapnel: each spike spawns 3 shards on death. Fault Line: 4s ground hazard. Planted Shard: crystal mine at 60% range, detonates on proximity (80% dmg, 6m radius).

**Eruption attack**: 18 spikes in 3 concentric layers (6×20° spacing). Also triggers on Muller's death.

**Passives**: Stone Skin (on-hit: stack armor/speed/size), Geode Shell (below 50% absorb next hit, 20s CD), Crystal Wall (barrier row every 8s, blocks enemies), Crystal Pillar (auto pillar every 12s, 50px dmg radius), Mother Lode (massive expanding wave every 12s, 600px max radius, 3× dmg).

#### Branches

| Branch | Color | Theme |
|---|---|---|
| **Shardfall** | 0x44AAFF | Wider cone, Deep Vein, Crystal Shrapnel, Tectonic Fury |
| **Geode Shell** | 0x99DDCC | Stone Skin stacks, absorb shield, Crystal Wall, Living Geode |
| **Deep Seam** | 0xCC99FF | Crystal mines, Pillar, Fault Line, Mother Lode |

**Key Ultimates**:
- *Tectonic Fury*: Every 5th slam → eruption ring; L2 ring +3m radius
- *Living Geode*: +HP, melee reflect 15/25 dmg
- *The Mother Lode*: Massive crystal wave every 10-12s; 3× dmg

---

## Enemy Roster

All enemies extend `BaseEnemy` (`src/entities/BaseEnemy.ts`).

### BaseEnemy — Shared Behavior
- Stats: `hp`, `speed`, `damagePerSecond`, `attackRange`, `xpValue`, `goldValue`
- On hit: white flash, knockback from player direction, batched floating damage text (every 400ms)
- Poison: tick DOT at 200ms intervals
- Death: tint by damage type, VFX, emits `enemy-died` (XP, gold, flags)
- Movement: steering around rocks (cached 4 frames). Slow enemies skip steering → direct moveTo (every 3 frames). Retarget every 2000ms.
- Melee: collision-based DPS within `attackRange`

### Enemy Types

| Key | Name | HP (wave 1) | Speed | DPS | XP | Gold | Notes |
|---|---|---|---|---|---|---|---|
| orc0 | Grunt | 20 | 90+w×4 | 4 | 5 | 35% mob | Scale 2.0, weakest |
| orc1 | Goblin | 30 | 140+w×8 | 6 | 8 | 35% mob | Scale 1.58, fastest |
| orc2 | Skeleton | 45 | 80+w×4 | 7 | 8 | 35% mob | Scale 2.0, medium |
| orc3 | Heavy Skeleton | 70 | 65+w×3 | 10 | 12 | 35% mob | Scale 2.0, `isLarge` |
| flyingeye | Flying Eye | 20 | 130+w×7 | 10 | 12 | 35% mob | Scale 1.12, no steering, flying |
| flyingeye (boss) | Eye Boss | 150 | 80+w×4 | — | 25+ | 5-10+w×3 | Scale 3.0, pulsing red aura |
| sandgolem | Sand Golem | 180 | 45+w×2 | 12 | 25+ | 5-10+w×3 | Scale 3.2, slam ability, mini-boss |

**HP scaling**: `BASE × (1 + floor(wave/5) × RATE) + (wave-1) × FLAT`

**Mini-bosses**: Every 30s. SandGolem default; FlyingEye boss added from wave 5 with `min(50%, (wave-5)×10%)` chance.

**CLAWS boss**: At 10:00, `claws-incoming` event stops wave spawns, `claws-spawn` 3s later.

---

## Wave System

**File**: `src/systems/WaveManager.ts`

- Tick: 100ms loop
- Wave tier = `floor(elapsedMs / 30000) + 1` — new wave every 30 seconds
- Spawn interval = `max(200, 800 - wave × 50)` ms
- Mob cap = `min(200, 20 + wave × 12)`
- Max 2 mobs per spawn interval

### Zone Spawn Tables (weighted)

| Zone | Threshold | Orc0 | Orc1 | Orc2 | Orc3 | FlyingEye |
|---|---|---|---|---|---|---|
| Crossroads | 0–600px | 50% | 30% | 20% | — | — |
| Meadow | 600–1200px | 35% | 35% | 30% | — | — |
| Ruins | 1200–1800px | — | 25% | 20% | 30% | 25% |
| Dark Forest | 1800–2400px | — | 25% | 15% | 35% | 25% |
| Wastes | 2400px+ | — | 20% | 10% | 40% | 30% |

---

## Upgrade System

**File**: `src/systems/UpgradeSystem.ts`

### Generic Pool (all heroes)

| ID | Name | Effect (L1/L2/L3) |
|---|---|---|
| g1 | Sharp Edge | +12% / +6% / +6% damage |
| g2 | Swift Feet | +9% / +6% / +6% move speed |
| g3 | Eagle Eye | +12% / +9% / +9% attack range |
| g4 | Quick Hands | -12% / -6% / -6% attack CD (min 200ms) |
| g5 | Vitality | +15% / +12% / +12% max HP + heal |
| g6 | Regeneration | +1 / +1 / +2 HP/s regen |
| g7 | Cleave | Splash 40px / +20px / +25px radius |
| g8 | Wisdom | +15% / +9% / +9% XP mult |
| g9 | Multistrike | +1 strike / +5% dmg / +1 strike |
| g10 | Iron Skin | +10% / +10% / +10% armor (cap 70%) |

### Hero Branch System
- Each hero: **3 branches × 4 upgrades** (3 regular + 1 ultimate)
- Branch locked in at start of run via branch-selection card picker
- Ultimates enter pool only when **all 3 regulars ≥ level 2**
- Upgrade picks: 3 cards shown, keyboard shortcuts 1/2/3

### Mastery System
Tracks XP per attack branch (fireball, ice, lightning, sword, venom, melee, spear, wind, sand, crystal, quake). 3 mastery levels — each grants a `getMasteryDamageMult()` bonus. Sifra: +2 range per mastery level (up to level 2).

---

## XP & Leveling

**File**: `src/systems/XPSystem.ts`

- **XP per level**: `120 + 55 × (level - 1)`
- XP orbs: blue gem 16×16 (standard); purple gem 32×32 (2× value = large orbs)
- Magnet radius: 100px. Acceleration toward nearest player: `200 + (1 - dist/100) × 300` px/s
- Orbs expire after 30 seconds

---

## Gold Economy

**In-run**:
- 35% drop chance per mob; value 1–3 gold
- Mini-boss: guaranteed 5–10 + wave×3 gold
- Coins: 8-frame spin animation, same magnet behavior as XP orbs

**Meta (Forge)**:

| ID | Name | Bonus/tier | Costs (T1–T5) |
|---|---|---|---|
| mu_hp | Iron Constitution | +20 Max HP | 100 / 400 / 1,500 / 6,000 / 34,000 |
| mu_dmg | Sharpened Claws | +3 Damage | 120 / 450 / 1,600 / 6,500 / 36,000 |
| mu_spd | Wanderer's Boots | +8 Speed | 80 / 350 / 1,400 / 5,500 / 33,000 |
| mu_regen | Blood Mender | +0.5 HP Regen/s | 100 / 400 / 1,500 / 6,000 / 34,000 |
| mu_cd | Honed Reflexes | -8% Attack CD | 150 / 500 / 1,800 / 7,500 / 38,000 |

Total to max all 5 upgrades: ~215,000 gold  
Design target: 100h playtime (~1200 runs × ~180 gold/run)

**Hero unlock cost**: Lyra (Huntress) = 1,000 gold at Forge

---

## Map & World

**File**: `src/systems/ChunkManager.ts`

- Infinite procedural world, no bounds
- **Chunk size**: 960×960px (15×15 tiles at 64px/tile)
- **Active grid**: 3×3 chunks around player; stale chunks recycled max 1/frame

### Zone System (distance from origin)

| Zone | Radius | Terrain | Enemy Focus |
|---|---|---|---|
| 0 — Crossroads | 0–600px | Default grass | Grunts + Goblins |
| 1 — Meadow | 600–1200px | Default grass | Mixed standard |
| 2 — Ruins | 1200–1800px | Default grass | Skeletons + Eyes |
| 3 — Dark Forest | 1800–2400px | Tint 0x8f9f8f | Heavy + flying |
| 4 — Wastes | 2400px+ | Tint 0x7e8f7e | Heavy + flying elite |

### Terrain Generation
- **Base**: `TX Tileset Grass.png` RenderTexture bake (1 draw call). Frames: GRASS_FRAMES `[4,5,6,7,12,13,14,15,20,21,22,23,28,29,30,31]`. Deterministic RNG seeded per tile.
- **Rocks**: 6 variants (rock1_1 → rock3_2), static physics bodies, min 120px apart
- **Decorations**: tree1/2/3, grass_tuft1/3, min 110px apart
- **Chests**: Common (col 0, brown) or Rare (col 6, gold) from chests spritesheet. Common: 2–4 drops; Rare: 4–6 drops. Min 200px apart.
- **Zone 3–4 extra**: Undead props (Bones, Broken_tree, Crystal, Dead_arm, Dead_tree, Grave×4, Ground_rocks, Pile_sculls, Ruin×3, Thorn_plant×2)

---

## HUD / UI

**File**: `src/scenes/UIScene.ts` (parallel overlay to GameScene)

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [HP bar] HP text  Lv.N    ·  KILLS  ·  TIER N  ·  MM:SS  ·  💰N │
│ [XP bar]                                               [Pause]  │
│ [Energy bars for dual-stance heroes]                            │
│                                                                  │
│                     (gameplay)                                   │
│                                                                  │
│                                          ┌──────────────────┐   │
│                                          │  Minimap (140px) │   │
│                                          │  circle, 1200px  │   │
│                                          │  world radius    │   │
│                                          └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Top-left**: HP bar (red, white flash on dmg, pink pulse at low HP), HP text, Level text, XP bar (below HP), dual energy bars (for dual-stance heroes)

**Top-center**: Kill counter, Wave tier, Timer (countdown from 10:00)

**Top-right**: Gold (icon + text), Pause button

**Bottom-right**: Minimap — circle, 140px. Shows player (white), enemies (red), XP (blue), gold (gold), rocks (grey), Sifra NPC (blinking blue on discovery), zone boundaries.

**Mobile extra**: Stance toggle pill button

### Overlays
- **Kill milestones**: Announcements at 50/100/250/500/1000 kills
- **Vignette**: Red pulse at low HP
- **Quest panel**: Sidebar visible during Amun tutorial (title, progress bar, goal)
- **Mastery diamonds**: Near HP bar, per-branch level indicator
- **Pause menu**: Stats tab (hero stats, time, kills, gold) + Inventory tab (upgrades list). ESC toggles.

### LevelUpScene
`src/scenes/LevelUpScene.ts`

- 5 cards (210×310px, 14px gap) or branch mode: 3 larger cards (320×450px)
- Each card: colored top strip (branch color), icon (96×96 from skill_icons_sheet), name, 3 level dots, description with number highlights
- Keyboard shortcuts: 1/2/3
- Cards can flip for additional info

### ForgeScene
`src/scenes/ForgeScene.ts`

- Dark background (0x0a0a1e)
- 5 upgrade cards in row (desktop) or 2-column grid (compact/mobile)
- Card: icon, label, description, tier pips (gold/dark), cost
- Recruit section below (only after tutorial complete): hero portrait, cost, role text

---

## Meta-Progression

**File**: `src/systems/MetaProgress.ts` → `localStorage` key: `claws_meta`

**Tracked data**: totalKills, totalRuns, totalTimeMs, totalWins, bestKills, bestWave, bestTime, per-hero stats, last 20 sessions, achievements, goldTotal, metaUpgrades, unlockedHeroes, unlockedBranches, completedQuests.

### Hero Unlock Conditions

| Hero | Unlock |
|---|---|
| Amun | Default unlocked |
| Sifra | Complete Amun tutorial ("Find Sifra" quest) |
| Ignara | Complete 3 runs (any hero) |
| Nazar | Win at least 1 run |
| Khashin | Survive 8 minutes as Sifra |
| Lyra (Huntress) | Purchase at Forge for 1,000 gold |
| Givi (Muller) | **Locked** ("Someone is working in the deep crystal...") |

### Tutorial (Run 1 — Amun only)

| Quest | Goal | Reward |
|---|---|---|
| Forged in Battle | Kill 100 enemies | Unlocks Amun's **Bastion** branch |
| The Long Watch | Survive 150 seconds | Unlocks Amun's **Quake** branch |
| Find Sifra | Walk to Sifra NPC on map | Unlocks **Sifra** as hero, marks tutorial complete |

### Achievements (25 total, 6 categories)

| Category | Achievements |
|---|---|
| Kills | kill_100, kill_500, kill_2000, kill_50_run, kill_150_run |
| Survival | survive_3m, survive_5m, survive_10m, win_3, win_10 |
| Hero | play_all, win per-hero ×7, win_all |
| Progression | level_5, level_10, branch_max, runs_10, runs_50 |
| Wave | wave_5, wave_10, wave_20 |
| Secret | speed_kill, no_damage |

---

## Multiplayer

**Architecture**: Colyseus.js WebSocket server

| Component | File | Role |
|---|---|---|
| NetworkManager | `src/systems/NetworkManager.ts` | Colyseus client singleton; connect/join/create/leave |
| NetworkGameAdapter | `src/systems/NetworkGameAdapter.ts` | Bridges Colyseus room state ↔ GameScene; 20Hz input send |
| LobbyScene | `src/scenes/LobbyScene.ts` | Online lobby; hero lock-out; host START button |
| Server | `server/` | Colyseus game room (not in src/) |

**Online flow**: LobbyScene → host starts → all clients enter GameScene. Server-authoritative enemy positions. Remote players rendered as sprites (per-hero scale constants).

**Local co-op** (`?coop` URL param): 2-player same screen. P1 = chosen hero, P2 = auto-assigned different hero. Camera targets midpoint between players. Shared gold pool.

**Env**: `VITE_COLYSEUS_URL` (dev default: `ws://localhost:2567`).

---

## Systems Summary

| System | File | Purpose |
|---|---|---|
| WaveManager | `systems/WaveManager.ts` | Wave tiers, spawn tables, mini-boss spawns, CLAWS boss |
| XPSystem | `systems/XPSystem.ts` | XP orbs, gold coins, magnet, expire sweep |
| UpgradeSystem | `systems/UpgradeSystem.ts` | Generic pool, hero branches, upgrade tracker |
| ChunkManager | `systems/ChunkManager.ts` | Infinite map, terrain RenderTexture, rocks, chests |
| MetaProgress | `systems/MetaProgress.ts` | localStorage persistence, hero unlocks, achievements |
| Pathfinding | `systems/Pathfinding.ts` | Steering around rocks, 4-frame cache |
| InputController | `systems/InputController.ts` | WASD/arrows, Q (stance), P (pause) |
| NetworkManager | `systems/NetworkManager.ts` | Colyseus client |
| NetworkGameAdapter | `systems/NetworkGameAdapter.ts` | Online game bridge |
| SessionLogger | `systems/SessionLogger.ts` | Post-run Supabase log |
| SupabaseClient | `systems/SupabaseClient.ts` | Supabase JS singleton |
| HintFlags | `systems/HintFlags.ts` | One-shot tutorial hints via localStorage |

---

## Key Config Constants

**File**: `src/config/GameConfig.ts`

| Constant | Value |
|---|---|
| Run duration | 600,000 ms (10 minutes) |
| XP per level | 120 + 55 × (level - 1) |
| Mob cap | min(200, 20 + wave × 12) |
| Spawn interval | max(200ms, 800 - wave×50 ms) |
| Chunk size | 960px (15 tiles × 64px) |
| Minimap size | 140px circle, 1200px world radius |
| Gold drop chance | 35% per mob, 1–3 value |
| Magnet radius | 100px |
| Orb expire | 30 seconds |
| Min rock spacing | 120px |
| Min chest spacing | 200px |

---

## Assets Reference

### Hero Spritesheets (`public/assets/<hero>/`)

| Hero | Key files | Frame size |
|---|---|---|
| amun | Attack1/2/3, Death, Idle, Run, Take Hit | 160×111 |
| ignara | Attack, Death, Idle, Move, Take Hit | 150×150 |
| nazar | Attack1/2, Death, Idle, Run, Take Hit | 200×200 |
| lyra | Attack1/2/3, Death, Idle, Run, Take hit | 150×150 |
| khashin | Air_attack, Attack, Death, Idle, Run, Special, Take_hit | 48×42 |
| givi | Attack, Death, Ground_slam, Idle, Run, Special, Take_hit | 51×44 |
| sifra | Attack1/2, Death, Hit, Idle, Run | 231×190 |

### Enemy Spritesheets (`public/assets/orc/`, `orc2/`, `orc3/`, `flying_eye/`)
- orc1/2/3: attack, death, hurt, idle, run — 64×64
- flying_eye: Attack3.png — 150×150, 6 frames
- boss_demon: spritesheet.png — idle (0-5), cleave (18-32), death (38-59)

### UI Assets
- `icons/skill_icons_sheet.png` — 128×128 per frame
- `ui/card_back.png`, `card_back_lg.png`, `card_sealed.png`, `card_sealed_lg.png`
- `chests/chests.png` — 9 cols × 4 rows spritesheet
- `book/book_anim.png` — 542×542 per frame (HeroSelectScene opening animation)

### Terrain
- `terrain/TX Tileset Grass.png` — grass tileset
- `rocks/Rock1_1` … `Rock3_2` (no shadow variants)
- `undead/` — 20 undead props (zone 3+)
- `props/grass_tuft1/3.png`, `terrain/tree1/2/3.png`

---

## New Content Design

### Enemy: Skeleton Archer (BoneArcher)

**Name**: Skeleton Archer

> *"They do not tire. They do not breathe. They only aim, and aim again, until the last bone crumbles to dust — and even then the arrows keep coming."*

**Behavior**: Ranged attacker. Maintains distance from the player, firing bone-tipped arrows at a fixed interval. When the player closes within melee range, the Archer retreats laterally — circling rather than fleeing directly — to maintain optimal firing distance. Does not rush to attack; prefers sustained pressure from range. Low HP but deals consistent chip damage if left unchecked.

**Suggested Stats** (wave 1 baseline):

| Stat | Value |
|---|---|
| HP | 35 |
| Arrow Damage | 8 per hit |
| Arrow Range | 280px |
| Attack Cooldown | 1800ms |
| Retreat Trigger Range | 120px |
| Move Speed | 100 + wave×5 |
| XP Value | 10 |
| Gold Drop | 35% chance, 1–2 gold |

**HP Scaling**: Standard scaling formula applies. Becomes threatening in mid-wave packs where multiple Archers can pin a player while melee enemies close in.

**On-Death Flavor**:
> *The arrows clatter to the ground. The bones scatter. For a moment, something like relief hangs in the air.*

---

### Hero Concept: Vael — the Pale Doctor

**Working name**: `vael`
**Role**: Death mage, soul harvester, summoner of undead servants.
**Moral alignment**: Ambiguous. Not evil — but no longer fully human.

#### Backstory

Vael was the finest field surgeon the northern armies ever produced — a healer who could pull men back from the edge of death with nothing but steady hands and an understanding of the body too precise to be natural. When the Rift tore open above the ruins of Amunat and the first wave of the Swarm poured through, Vael was treating wounded soldiers at a camp three days' march away. He watched every one of them die anyway — not from wounds, but from something the Rift exhaled, a resonance that rotted the soul before the body. He could not stop it. He had no tools for it.

So he found new tools.

Now he walks the edge of the Sand Sea, neither servant of the Swarm nor wholly opposed to it — a man who has learned to speak the language of death by practicing it. The same force that ruined him now threads through his fingertips. He tells himself he is looking for a cure. The souls he drains along the way are simply... necessary fuel for the search. Ignara finds him repugnant. Amun watches him with something older than suspicion. Khashin is the only one who doesn't flinch — he has lived long enough to understand that the line between healer and harvester is drawn entirely in intention.

Vael carries a fragment of the Equilibrium Key embedded in his sternum, where a Swarm tendril once pierced him. He survived. He does not know if that was luck or a trap.

#### Base Attack — Soul Bolt

Vael raises a jagged spike of compressed soul-energy from the ground at the target's feet — it erupts upward, dealing damage and briefly rooting the enemy in place. At close range the spike takes the shape of a bone shard; at longer distances it manifests as a pale streak of light. Mechanically: a short-delay ground-eruption projectile, single target, moderate damage, 0.4s root on hit.

> *"The body remembers dying. I only remind it."*

---

#### Branch 1: Pale Harvest
*Theme: Soul drain, lifesteal, regeneration through killing. Every death feeds you.*

Color: `0xaaddff` (pale icy blue)

**Skill 1 — Hollow Touch** *(passive)*
Each Soul Bolt drains a sliver of life force — Vael heals for 8% of damage dealt.
> *"I take only what the body no longer needs."*

**Skill 2 — Soul Siphon** *(active upgrade)*
On kill, a visible soul orb erupts from the corpse and curves toward Vael, healing 15 HP on contact. Orbs persist for 3s before dissipating.
> *"They always look surprised. They shouldn't."*

**Skill 3 — Wound Memory** *(synergy)*
Enemies afflicted by the Soul Bolt root take +20% damage from all sources while rooted. The root duration increases to 0.7s.
> *"I wrote this into your bones. You just haven't read it yet."*

**Skill 4 — Exsanguination** *(ultimate, isUltimate: true)*
Soul Bolt now fires a chain — hits primary target and arcs to up to 3 nearby enemies at 60% damage each. Each enemy in the chain feeds the heal. At L3, the chain triggers a second arc 0.5s later.
> *"There is no waste in the Pale Harvest. Only transfer."*

---

#### Branch 2: Ossuary
*Theme: Raise the fallen as temporary undead servants. The battlefield becomes your army.*

Color: `0xccbb88` (aged bone yellow)

**Skill 1 — Risen** *(passive)*
Enemies killed by Soul Bolt have a 25% chance to rise as a Bone Thrall — a fragile undead minion that attacks nearby enemies for 4s before collapsing.
> *"The Swarm taught me that death is not an ending. It's just a reassignment."*

**Skill 2 — Grave Pact** *(active upgrade)*
Increase Risen proc chance to 50%. Bone Thralls now persist for 8s and deal 40% of Vael's base damage per hit.
> *"Loyalty is so much cleaner when the other party has no choice."*

**Skill 3 — Undying Labor** *(synergy)*
Each active Bone Thrall passively boosts Vael's attack speed by 4% (stacks, max 3 Thralls active at once).
> *"The more the dead work, the less I have to."*

**Skill 4 — Charnel Tide** *(ultimate, isUltimate: true)*
On activation, all corpses within 300px rise simultaneously as Bone Thralls (up to 6). Duration 10s. At L3, surviving Thralls explode on timeout — dealing 80% Vael's damage in a 60px radius each.
> *"You brought so many with you. Good. I was running low."*

---

#### Branch 3: Wasting Plague
*Theme: AoE disease, debuffs, spreading contagion. Attrition warfare through rot.*

Color: `0x88cc55` (sickly green)

**Skill 1 — Festering Wound** *(passive)*
Soul Bolt applies a Rot stack on hit. Enemies with 3+ Rot stacks take +15% damage from all sources.
> *"It doesn't hurt at first. That's the insidious part."*

**Skill 2 — Virulent Spread** *(active upgrade)*
On kill, Rot stacks transfer to all enemies within 80px of the corpse. Each transferred stack deals a burst of 10% Vael's damage.
> *"One carrier is all you need."*

**Skill 3 — Necrotic Bloom** *(synergy)*
Enemies who die with 5+ Rot stacks leave a Blight Pool on the ground — a 100px radius zone dealing 12% Vael's damage per second for 5s. Pools do not stack, but overlap in coverage.
> *"Even the ground remembers what walked on it."*

**Skill 4 — Pandemic** *(ultimate, isUltimate: true)*
Vael exhales a cloud of corrupted miasma in a 200px ring around himself. All enemies in range immediately gain 5 Rot stacks. At L2, the cloud pulses a second time 2s later. At L3, enemies that die while in the cloud zone spread Blight Pools at double radius.
> *"The Rift does not discriminate. Neither do I."*

---

### Hero Redesign: Ignara — Branch Overhaul

*Ignara is the last student of the Flame Word school — fire as judgment, not destruction. Her flame is divine in origin, and that should be felt in every branch: even "chaos" reads as wrath, not randomness.*

---

#### Branch 1: Buckshot
**Tagline**: *One trigger pull. A dozen points of light.*

Color: `0xff8800` (deep amber)

**Skill 1 — Scatter Shot** *(passive)*
Ignara's fireball splits into 5 small fireballs on cast, spreading in a 40° cone. Each deals 40% of base damage. Enemies at close range can be hit by multiple pellets.
> *"The Flame Word was never meant for one sinner at a time."*

**Skill 2 — Dense Pattern** *(active upgrade)*
Increase pellet count to 7 and tighten cone to 30°. Enemies caught in the center overlap zone take an additional 30% damage.
> *"Closer together. Hotter. More honest."*

**Skill 3 — Point Blank** *(synergy)*
Pellets that hit an enemy within 100px deal a bonus 50% damage and apply a 0.3s stagger (interrupts enemy attack animations).
> *"There is a particular kind of judgment delivered only at arm's reach."*

**Skill 4 — Last Rites** *(active upgrade)*
Every 5th cast fires a full-density spread — all 7 pellets compressed into a single tight burst (20° cone), each dealing 80% damage. Applies a Scorched mark on all hit enemies (+15% damage taken for 3s).
> *"I remember their faces. That is my penance."*

**Skill 5 — Congregation of Flame** *(ultimate, isUltimate: true)*
Ignara fires a massive spread of 12 pellets in a 60° cone. Every pellet that hits the same target causes a micro-explosion (50px AoE, 60% dmg). Can theoretically one-shot dense clusters. 8s cooldown.
> *"The First Flame burned them all. I carry only a splinter of it. A splinter is enough."*

---

#### Branch 2: Hellfire
**Tagline**: *Relentless. Burning. It never stops.*

Color: `0xff3300` (hellish red-orange)

**Skill 1 — Sustained Burn** *(passive)*
Ignara's fireballs no longer deal AoE damage on impact. Instead, each hit applies a Burn stack (4% base dmg/tick, 0.5s duration, refreshes on re-hit). Stacks up to 5 times.
> *"One flame doesn't kill a man. The persistence does."*

**Skill 2 — Rapid Discharge** *(active upgrade)*
Attack cooldown reduced by 35%. At max Burn stacks on a target, Ignara's next attack automatically crits for 2× damage.
> *"She does not pause. She does not deliberate. There is no room for mercy in the cadence."*

**Skill 3 — Fan the Flames** *(synergy)*
Each Burn stack on any enemy within 200px reduces Ignara's attack cooldown by an additional 2% (stacks across enemies, max 30% bonus). Crowded fights become blazingly fast.
> *"A field of burning men keeps the fire fed. The fire needs feeding."*

**Skill 4 — Combustion Point** *(active upgrade)*
Every 10 kills resets Ignara's attack cooldown to 0. The next 3 attacks after a reset deal +40% damage.
> *"When enough have burned, she breathes again. Then begins again."*

**Skill 5 — Infernal Cadence** *(ultimate, isUltimate: true)*
For 6 seconds, Ignara fires at triple speed and all Burn stacks are applied at double rate. Enemies that die while fully stacked explode, spreading 2 Burn stacks to all enemies within 100px. 15s cooldown.
> *"The Flame Word taught her rhythm as discipline. She has made it a weapon."*

---

#### Branch 3: Cataclysm
**Tagline**: *One shot. One moment. Everything burns.*

Color: `0xffcc00` (blinding gold)

**Skill 1 — Weight of Heaven** *(passive)*
Ignara's fireball travels more slowly (250px/s instead of 350px/s) but explodes with +50% increased AoE radius on impact.
> *"Judgment should be seen coming. It should be inescapable anyway."*

**Skill 2 — Groundbreaker** *(active upgrade)*
The explosion now leaves a Scorched Earth zone (150px radius) that deals 15% Ignara's damage per second for 4s. Enemies that walk through it take a brief knockback.
> *"She does not need to be present for the burning to continue."*

**Skill 3 — Shockwave** *(synergy)*
The fireball explosion triggers a secondary pressure wave — all enemies in a 200px radius are knocked back 150px regardless of mass. The knockback briefly stuns small enemies (0.5s).
> *"The fire is the point. The force is the sermon."*

**Skill 4 — Consecrated Impact** *(active upgrade)*
Ignara's fireball is now visibly larger (2× sprite scale). If it travels more than 200px before hitting, the explosion radius is doubled again. Long-range shots become divine artillery strikes.
> *"Sent from far enough, a flame becomes an act of god."*

**Skill 5 — The Pyre Absolute** *(ultimate, isUltimate: true)*
Ignara launches a single massive fireball that is three times the normal size and travels at half speed. On impact: screen shake (0.8s), explosion radius 400px, all enemies in range take full damage (no falloff), and the impact zone is consecrated — enemies cannot enter it for 5s (they are repelled). 20s cooldown.
> *"This is what the First Flame looked like. Before anyone thought to contain it."*
