# CLAWS — Huntress Design Document

## 1. Concept

Huntress is a **ranged physical attacker** who hunts enemies from a distance using thrown spears. She is nimble, tactical, and excels at sustained single-target DPS while staying out of melee range. Unlike the mage heroes (Ignara, Sifra) who wield elemental forces, Huntress is a physical warrior — her power comes from precision, momentum, and predatory instinct.

**Fantasy**: A warrior-hunter who outpaces enemies, marks her prey, and brings them down with thrown spears before they can close the gap. The longer she fights, the more dangerous she becomes.

**Role in roster**:
- Only true ranged physical attacker — no element, no magic
- Higher single-target DPS ceiling than any existing hero
- Mobility tools make her the most nimble hero in the game
- Lower AOE than Ignara/Amun/Sifra, compensated by speed and range

**Available spritesheets** (`public/assets/huntress/`):
- Idle, Run, Attack1, Attack2, Attack3
- Spear, Spear move
- Take hit, Death
- Jump, Fall

---

## 2. Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 80 | Moderate — she relies on mobility, not tankiness |
| Speed | 140 | Fastest hero in the game |
| Damage | 18 | High single-target |
| Range | 200 | Longest range of any hero |
| Cooldown | 900ms | Slightly faster than average |

---

## 3. Base Attack: Spear Throw

Huntress automatically hurls a spear at the nearest enemy. The spear is a physics body — it travels through the air and deals damage when it strikes.

**Mechanics:**
- Auto-throw once per cooldown toward the nearest enemy
- Spear projectile launches at speed **400** in a straight line
- Deals `player.damage` on first enemy hit
- Pierces **0** targets by default (hits 1 enemy then stops)
- Spear despawns if it travels beyond `player.range` without hitting anything
- Uses `Attack1` animation on throw; `Spear` sprite for the projectile

**VFX:**
- Spear sprite rotated to face travel direction (point-forward)
- Brief screen-shake-free launch flash at Huntress's hand
- Small dirt/dust puff particle burst at impact point
- Spear embeds visually for ~100ms before despawning

**Implementation notes:**
- Projectile stored in a `spears` physics group (similar to how other projectile heroes work)
- `pierceCount` field on Player starts at 0, incremented by Warden branch skills
- On overlap with enemy: deal damage, then if `piercesRemaining > 0` decrement and continue, else destroy spear

---

## 4. Skill Branches

### Branch 1: Predator (color: `0xff4444` — red)

**Theme**: Damage, crits, execute mechanics. Pure offensive power. The Predator branch is for players who want to maximize how fast individual enemies die. Skills escalate from simple damage boosts into a crit system, then into a hunt-and-execute loop.

| ID | Name | Description | `apply` Effect | VFX |
|----|------|-------------|----------------|-----|
| HP1 | Hunter's Eye | Spears deal +30% damage | `p.damage = Math.round(p.damage * 1.3)` | Projectile gets a faint red glow tint |
| HP2 | Weak Point | Spears have a 20% chance to crit for 2x damage | Set `p.hasCrit = true; p.critChance = 0.20; p.critMult = 2.0` | Critical hit: bright red flash on enemy + larger impact puff |
| HP3 | Headhunter | Crits on enemies below 40% HP are guaranteed | Set `p.hasHeadhunter = true`; on hit check: `if enemy.hp < enemy.maxHp * 0.4 && p.hasCrit` → always crit | Low-HP enemies gain a faint red outline as visual cue |
| HP4 | Marked Prey | First spear to hit an enemy marks it for 5s; all subsequent hits deal +40% damage to marked targets | Set `p.hasMarkPrey = true`; on hit: apply `marked` status to enemy for 5000ms; damage check: `if enemy.hasStatus('marked')` → `damage *= 1.4` | Small red diamond icon floats above marked enemy; damage numbers pulse red |
| HP5 | Spear Volley | Every 5th throw fires a burst of 3 spears in a tight spread | Set `p.hasVolley = true; p.volleyCounter = 0`; on throw: increment counter; if `= 5` reset and fire 3 spears at ±10° spread | Three spears launch simultaneously with a deeper throw-grunt sound; distinct triple-impact puffs |

---

### Branch 2: Stalker (color: `0x44dd44` — green)

**Theme**: Mobility, traps, kiting. Hit-and-run playstyle. The Stalker branch rewards a player who stays moving — skills synergize with repositioning, punish enemies who close range, and let Huntress control space without committing to AOE. Distinct from Nazar (melee dash) because every Stalker skill functions at distance.

| ID | Name | Description | `apply` Effect | VFX |
|----|------|-------------|----------------|-----|
| HS1 | Fleet Foot | +25% movement speed | `p.speed = Math.round(p.speed * 1.25)` | Subtle green motion trail on Huntress for 1s after activation |
| HS2 | Caltrops | On kill, scatter caltrops in a radius of 60 that slow enemies by 50% for 2s | Set `p.hasCaltrops = true`; on enemy death: spawn caltrop zone at kill position (radius 60, duration 4000ms, slow 50%) | Small metal spike particles spread from corpse; zone has a subtle ground texture |
| HS3 | Kill Stride | Killing an enemy grants +40% speed for 3 seconds | Set `p.hasKillStride = true`; on kill: apply `speedBuff` status to player, `p.speed * 1.4` for 3000ms | Green speed lines trail Huntress during buff; Run animation plays slightly faster |
| HS4 | Ensnaring Net | Every 8th spear throw fires a net instead; net stops enemy movement for 3s | Set `p.hasNet = true; p.netCounter = 0`; on throw: increment counter; if `= 8`: spawn net projectile; on net hit: apply `rooted` to enemy for 3000ms | Net projectile: wider spread sprite, green tint; on hit enemy is wrapped in rope overlay |
| HS5 | Predator's Leap | Every 6s, Huntress auto-leaps away from the nearest enemy (opposite direction, 200px) and is briefly invulnerable | Set `p.hasLeap = true; p.leapCooldown = 6000`; on timer: if enemy within 100px — fire leap vector 180° from enemy, move 200px instantly, invuln for 400ms | Uses `Jump` and `Fall` animations; green flash at launch and land; short afterimage trail |

---

### Branch 3: Warden (color: `0x4488ff` — blue)

**Theme**: AOE, piercing, utility. Area control and crowd management. Warden compensates for Huntress's low default AOE and turns her into a zone-clearing machine — spears rip through ranks, fragments cover angles, and a single empowered throw can punish clustered groups. Feels like the tactical/crowd-control counterpart to Predator's single-target focus.

| ID | Name | Description | `apply` Effect | VFX |
|----|------|-------------|----------------|-----|
| HW1 | Piercing Head | Spears pierce through 2 additional enemies | `p.pierceCount += 2` | Spear sprite gains a faint blue glow; passes through enemies with a brief flash on each |
| HW2 | Explosive Tips | 25% chance for spear to explode on hit dealing 80% damage in a radius of 50 | Set `p.hasExplosiveTips = true; p.explosiveChance = 0.25`; on hit: roll chance; if success: deal `p.damage * 0.8` in radius 50 around impact point | Blue-white burst particle explosion at impact; small shockwave ring |
| HW3 | Splinter | Spears that reach full range without hitting anything split into 3 fragments that fan outward | Set `p.hasSplinter = true`; on spear despawn at range: spawn 3 fragment projectiles at ±20° with speed 300, damage 40%, range 80 | Spear tip shatters visually into 3 smaller shards with blue tint; brief flash at split point |
| HW4 | Spear Wall | Every 12s, Huntress plants 6 spinning spears in a circle around herself that last 4s and deal 50% damage per hit | Set `p.hasSpearWall = true; p.wallCooldown = 12000`; on timer: spawn 6 spear sprites rotating at 60° intervals, radius 70, duration 4000ms, dealing `p.damage * 0.5` on overlap | Blue ring of orbiting spears; distinct rotation whoosh; enemies that walk in take rapid hits |
| HW5 | Earth Slam | Every 15s, throw a charged spear straight down that creates a shockwave line dealing 3x damage to all enemies in a 200px long, 60px wide strip | Set `p.hasEarthSlam = true; p.slamCooldown = 15000`; on timer: fire slam projectile toward nearest enemy; on land: spawn line hitbox 200px × 60px, deal `p.damage * 3`, brief stun 500ms | Camera-shake on impact; large dust column + cracked ground decal; blue impact glow |

---

## 5. Full Skill Reference Table

### Predator Branch (HP — red, `0xff4444`)

| ID | Name | Description (card UI) | `apply` Effect | VFX |
|----|------|----------------------|----------------|-----|
| HP1 | Hunter's Eye | Spears hit 30% harder | `p.damage = Math.round(p.damage * 1.3)` | Red glow tint on projectile |
| HP2 | Weak Point | 20% chance to crit for 2× damage | `p.hasCrit = true; p.critChance = 0.20; p.critMult = 2.0` | Red flash + large puff on crit |
| HP3 | Headhunter | Crits guaranteed vs enemies below 40% HP | `p.hasHeadhunter = true` + crit-check logic on hit | Red outline aura on wounded enemies |
| HP4 | Marked Prey | First hit marks target; +40% dmg to marked | `p.hasMarkPrey = true` + `marked` status, 5000ms | Red diamond icon over target |
| HP5 | Spear Volley | Every 5th throw: 3-spear spread burst | `p.hasVolley = true; p.volleyCounter = 0` + burst logic | Triple simultaneous launches |

### Stalker Branch (HS — green, `0x44dd44`)

| ID | Name | Description (card UI) | `apply` Effect | VFX |
|----|------|----------------------|----------------|-----|
| HS1 | Fleet Foot | +25% movement speed | `p.speed = Math.round(p.speed * 1.25)` | Green motion trail on activation |
| HS2 | Caltrops | Kills scatter caltrops that slow 50% for 2s | `p.hasCaltrops = true` + caltrop zone on death | Spike particles; subtle ground zone |
| HS3 | Kill Stride | Kills grant +40% speed for 3s | `p.hasKillStride = true` + temp speed buff on kill | Green speed lines during buff |
| HS4 | Ensnaring Net | Every 8th throw fires a rooting net (3s) | `p.hasNet = true; p.netCounter = 0` + net projectile | Rope-wrap overlay on trapped enemy |
| HS5 | Predator's Leap | Auto-leap away from danger every 6s + brief invuln | `p.hasLeap = true; p.leapCooldown = 6000` + leap logic | Jump/Fall animation + green flash |

### Warden Branch (HW — blue, `0x4488ff`)

| ID | Name | Description (card UI) | `apply` Effect | VFX |
|----|------|----------------------|----------------|-----|
| HW1 | Piercing Head | Spears pierce 2 extra enemies | `p.pierceCount += 2` | Blue glow on spear, flash on each pierce |
| HW2 | Explosive Tips | 25% chance to explode on hit (80% dmg, r=50) | `p.hasExplosiveTips = true; p.explosiveChance = 0.25` + AoE on hit | Blue-white burst ring at impact |
| HW3 | Splinter | Spears at max range split into 3 fragments | `p.hasSplinter = true` + fragment spawn on range-despawn | Shard visual; triple-fragment blue tint |
| HW4 | Spear Wall | 6 orbiting spears for 4s every 12s | `p.hasSpearWall = true; p.wallCooldown = 12000` + orbiting hitboxes | Blue rotating ring; whoosh SFX |
| HW5 | Earth Slam | Charged slam every 15s: line shockwave 3× dmg | `p.hasEarthSlam = true; p.slamCooldown = 15000` + slam hitbox | Camera shake; cracked ground decal |

---

## 6. Build Synergies

### "Headhunter" — Predator focus
**Skills**: HP1 + HP2 + HP3 + HP4 + HP5 + Generic Damage (G1)

Huntress snowballs into a precision killing machine. Mark a target with the first throw, guarantee crits at low HP, then volley them with 3 spears simultaneously. Best against bosses and tanky enemies. Weakest against dense swarms. Unlock order: HP1 → HP2 → HP4 → HP3 → HP5.

---

### "Ghost Hunter" — Stalker focus
**Skills**: HS1 + HS3 + HS5 + HS4 + HP1 + Generic Speed (G2)

Maximum mobility with combat payoff. Fleet Foot + Kill Stride stacks speed so high that Huntress is constantly outrunning enemies. Predator's Leap auto-escapes dangerous moments. Ensnaring Net catches anything that gets too close. The player barely needs to think about taking damage — they're never in one place long enough.

---

### "Porcupine" — Warden focus
**Skills**: HW1 + HW2 + HW3 + HW4 + HW5 + Generic Range (G3)

Full area-denial build. Spears pierce rows of enemies, 1-in-4 explode on impact, and misses shatter into fan fragments covering missed angles. Spear Wall auto-activates to punish anything that survives the hail, and Earth Slam nukes clustered groups every 15s. Lower single-target DPS than Predator but handles swarms far better.

---

### "Trapper Queen" — Stalker + Warden hybrid
**Skills**: HS2 + HS4 + HW1 + HW2 + HP4 + Generic Attack Speed (G4)

Zone-control playstyle. Caltrops slow everything approaching, Ensnaring Net roots priority targets, then piercing + explosive spears shred the rooted cluster. Mark Prey tags the biggest threat while the rest are stuck in traps. Rewards methodical positioning — move to plant caltrops, net a champion, unload through the pile.

---

## 7. Balance Notes

- Huntress has the **lowest AOE** of any hero by default — Warden branch is the intended solution. Players who skip Warden should compensate with Generic Cleave (G7) or Multistrike (G9).
- `pierceCount` caps at **5** to prevent performance spikes with Glacial Pierce-style infinite pierce.
- Spear Volley (HP5) fires 3 spears counted as separate projectiles — each rolls its own crit chance, applies marks, and triggers Explosive Tips independently.
- Predator's Leap (HS5) invulnerability is **400ms** — enough to survive one hit, not a sustained tank tool. Trigger is proximity-based (nearest enemy within 100px), not player-controlled.
- Earth Slam (HW5) stun is **500ms** — short enough that it doesn't trivialize encounters, long enough to feel impactful.
- Mark Prey (HP4) stacks with Explosive Tips: marked enemy who triggers explosion deals `damage * 1.4 * 0.8` in AoE. This is intentional as a high-investment reward.
- Kill Stride (HS3) and Fleet Foot (HS1) stack multiplicatively: `140 * 1.25 * 1.4 = 245 speed` during buff. This is the highest speed in the game and is the intended fantasy for a full Stalker build.
- Caltrop zones from HS2 do not deal damage — slow only. This keeps Stalker a mobility/control branch, not a DOT branch (that space belongs to Nazar's Venom branch).
- Once-per-interval skills (Spear Wall HW4, Earth Slam HW5, Predator's Leap HS5) use independent cooldown timers on the Player object, not tied to attack cooldown.

## 8. Implementation Notes

- Add `huntress` entries to `personalUpgrades` in `UpgradeSystem` with IDs: `HP1–HP5`, `HS1–HS5`, `HW1–HW5`
- New Player fields needed:
  - `pierceCount: number` (default 0)
  - `hasCrit: boolean`, `critChance: number`, `critMult: number`
  - `hasHeadhunter: boolean`
  - `hasMarkPrey: boolean`
  - `hasVolley: boolean`, `volleyCounter: number`
  - `hasCaltrops: boolean`
  - `hasKillStride: boolean`
  - `hasNet: boolean`, `netCounter: number`
  - `hasLeap: boolean`, `leapCooldown: number`, `leapTimer: number`
  - `hasExplosiveTips: boolean`, `explosiveChance: number`
  - `hasSplinter: boolean`
  - `hasSpearWall: boolean`, `wallCooldown: number`, `wallTimer: number`
  - `hasEarthSlam: boolean`, `slamCooldown: number`, `slamTimer: number`
- Spear projectile group: `this.spears = this.physics.add.group()` — reuse pooling pattern from existing heroes
- Net projectile is a separate group: `this.nets` — uses wider collision box, different sprite
- Caltrop zones: use `this.time.addEvent` with overlap check — static hitbox, no physics body needed
- Spear Wall: 6 child objects parented to player position, updated in `update()` to orbit at fixed radius with angle offset per frame
- Earth Slam line hitbox: thin rectangle physics body, active for 200ms then destroyed
- `marked` status on enemies: add `isMarked: boolean` and `markTimer: number` to enemy base class
- Predator's Leap vector: `Phaser.Math.Vector2` from nearest enemy to player, normalized × 200
