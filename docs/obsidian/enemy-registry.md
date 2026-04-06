# Enemy Registry

**Files:** `src/entities/Skeleton.ts` (Orc2), `Zergling.ts` (Orc1), `Skeleton2.ts` (Orc3), `Scorpion.ts` (FlyingEye), `SandGolem.ts`, `Vampire.ts`

All enemies extend `BaseEnemy` (`src/entities/BaseEnemy.ts`).

## Shared Fields (BaseEnemy)

| Field | Type | Notes |
|---|---|---|
| `hp`, `maxHp` | number | Wave-scaled |
| `speed`, `baseSpeed` | number | Knockback recovery restores toward baseSpeed |
| `xpValue` | number | XP orb value on death |
| `damagePerSecond` | number | Melee contact DPS |
| `attackRange` | number | px distance to trigger melee |
| `isMarked` | boolean | Marked enemies take +30% dmg |
| `isRooted` | boolean | Rooted enemies cannot move |
| `lastDamageType` | DamageType | `'fire' \| 'ice' \| 'lightning' \| 'poison' \| 'melee' \| 'shockwave'` |
| `usesSteering` | boolean | Uses obstacle avoidance (default true) |

---

## Orc1 (fast — replaces Goblin)

| Property | Value |
|---|---|
| Class | `Orc1` (file: `Skeleton.ts`, alias: `Goblin`) |
| Sprite key | `orc1_idle` + `orc1_run/attack/hurt/death` |
| Frame size | 64×64 px (top-down, row 0) |
| Scale | ~2.5x |
| Base HP | `~30 + wave*3` |
| Base speed | `140 + wave*8` |
| Base DPS | `6 + floor(wave/5)` |
| XP value | `8 + floor(wave/3)` |

**Behavior:** Fastest base enemy. Death: plays `orc1_death` animation.
**Note:** Also registers Mushroom + FlyingEye animations in `createAnimations()`.

---

## Orc2 (medium — replaces Skeleton)

| Property | Value |
|---|---|
| Class | `Orc2` (file: `Zergling.ts`, alias: `Skeleton`) |
| Sprite key | `orc2_idle` + `orc2_run/attack/hurt/death` |
| Frame size | 64×64 px (top-down, row 0) |
| Scale | ~2.5x |
| Base HP | `~45 + wave*5` |
| Base speed | `80 + wave*4` |
| Base DPS | `7 + floor(wave/4)` |
| XP value | `8 + floor(wave/3)` |

**Behavior:** Balanced melee chaser. Death: plays `orc2_death` animation.

---

## Orc3 (tanky — replaces Skeleton2)

| Property | Value |
|---|---|
| Class | `Orc3` (file: `Skeleton2.ts`, alias: `Skeleton2`) |
| Sprite key | `orc3_idle` + `orc3_run/attack/hurt/death` |
| Frame size | 64×64 px (top-down, row 0) |
| Scale | ~2.5x |
| Base HP | `~70 + wave*7` |
| Base speed | `65 + wave*3` |
| Base DPS | `10 + floor(wave/3)` |
| XP value | `12 + floor(wave/3)` |

**Behavior:** Slow but durable. Death: plays `orc3_death` animation.

---

## FlyingEye

| Property | Value |
|---|---|
| Class | `FlyingEye` (file: `Scorpion.ts`) |
| Sprite key | `flyingeye_attack` (`assets/flying_eye/Attack3.png`) |
| Frame size | 150×150 px |
| Scale | 1.4 |
| Body size | 32×32, offset (59, 59) |
| `isFlying` | `true` — skips rock collisions |
| Base HP | `~20 + wave*2` |
| Base speed | `130 + wave*7` |
| Base DPS | `10 + floor(wave/3)` |
| XP value | `12 + floor(wave/3)` |

**Special:** Poison immune (overrides `applyPoison`). Flies over rocks.
**Death:** Alpha+scale tween to 0.3 (300ms).

---

## SandGolem

| Property | Value |
|---|---|
| Class | `SandGolem` (file: `SandGolem.ts`) |
| Sprite key | `mushroom_attack` (`assets/mushroom/Attack3.png`) |
| Frame size | 150×150 px |
| Scale | 2.0 |
| Base HP | `~180 + wave*12` |
| Base speed | `45 + wave*2` |
| Base DPS | `12 + floor(wave/4)` |
| XP value | `25 + floor(wave/2)*3` |

**Special — Ground Slam:** Every 5s when player within 80px; DPS×2, pushes player at 250 velocity, camera shake.
**Knockback immunity:** kbForce = 30 (vs normal ~120).
**Death:** Plays `mushroom_death` anim, spawns 5 debris particles.

---

## Vampire

| Property | Value |
|---|---|
| Class | `Vampire` (file: `Vampire.ts`) |
| Sprite key | `vampire_idle` + `vampire_run/attack/hurt/death` |
| Frame size | 32×32 px |
| Scale | 2.5 |
| Base HP | `~55 + wave*5` |
| Base speed | `100 + wave*5` (fastest non-boss) |
| Base DPS | `12 + floor(wave/3)` |
| XP value | `14 + floor(wave/2)` |

**Special — Lifesteal:** Heals 30% of DPS while attacking, capped at maxHp.
**Death:** Plays `vampire_death` animation.

---

## Boss — Klaus (inline in GameScene)

| Property | Value |
|---|---|
| Sprite key | `boss_demon` (`assets/boss_demon/spritesheet.png`) |
| Frame size | 288×160 px |
| HP | 9999 |
| Speed | 100 |
| Contact | Instant kill |
| Cleave | 30% player max HP, every 3s |
| Spawns at | 10 minutes (600000ms) |
| Spawn pos | Left of player (x - 400) |
| Spawn anim | Reverse death (frames 59→38) |

---

## Spawn Weights (WaveManager)

| Zone | Orc1 | Orc2 | FlyingEye | Orc3 | SandGolem | Vampire |
|------|------|------|-----------|------|-----------|---------|
| 0 Crossroads | — | 100% | — | — | — | — |
| 1 Meadow | 30% | 70% | — | — | — | — |
| 2 Ruins | 25% | 35% | 15% | 15% | 10% | — |
| 3 Dark Forest | 15% | 15% | 20% | 15% | 20% | 15% |
| 4 Wastes | 15% | 10% | 20% | 15% | 20% | 20% |

## Wave-tier Buffs

| Tier | Condition | Effect |
|------|-----------|--------|
| ≥5 | 30% chance | +30% speed on spawn |
| ≥8 | 30% chance | +50% HP on spawn |
