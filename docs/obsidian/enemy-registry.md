# Enemy Registry

**Files:** `src/entities/Skeleton.ts`, `Zergling.ts` (class `Goblin`), `Scorpion.ts` (class `FlyingEye`), `SandGolem.ts`

## Shared Fields (all enemies)

| Field | Type | Notes |
|---|---|---|
| `isMarked` | boolean | Set by Huntress `hasMarkedTarget`; marked enemies take +30% dmg |
| `markTimer` | number | ms remaining on mark (5000ms on apply) |
| `isRooted` | boolean | Set by Huntress `hasNetThrow`; rooted enemies cannot move |
| `rootTimer` | number | ms remaining on root (1500ms on apply) |
| `lastDamageType` | string | `'fire' \| 'ice' \| 'lightning' \| 'poison' \| 'melee' \| 'shockwave'` |

---

## Skeleton

| Property | Value |
|---|---|
| Class | `Skeleton extends Phaser.Physics.Arcade.Sprite` |
| Sprite key | `skeleton_attack` (`assets/skeleton/Attack3.png`) |
| Frame size | 150×150 px |
| Scale | 1.5 |
| Body size | 30×38, offset (60, 56) |
| Base HP | `floor(45 × hpMult + (wave-1) × 5)` where hpMult = 1 + floor(wave/5)×0.3 |
| Base speed | `80 + wave×4` |
| Base DPS | `7 + floor(wave/4)` |
| XP value | `8 + floor(wave/3)` |

**Behavior:** Pure melee chaser. Plays `skeleton_walk` anim; switches to attack anim in range.
**Respects:** `isRooted` (stops and counts down `rootTimer`).

---

## Goblin (class name: `Goblin`, imported as `Zergling`)

| Property | Value |
|---|---|
| Class | `Goblin extends Phaser.Physics.Arcade.Sprite` |
| Sprite key | `goblin_attack` (`assets/goblin/Attack3.png`) |
| Frame size | 150×150 px |
| Scale | 1.6 |
| Body size | 32×40, offset (59, 65) |
| Base HP | `floor(40 × hpMult + (wave-1) × 5)` |
| Base speed | `90 + wave×5` |
| Base DPS | `8 + floor(wave/4)` |
| XP value | `10 + floor(wave/3)` |

**Death behavior:** Plays `goblin_death` anim (frames 8–11), color tint by damage type, camera shake 60ms/0.003. Emits `enemy-died` event.

---

## FlyingEye (class name: `FlyingEye`, imported as `Scorpion`)

| Property | Value |
|---|---|
| Class | `FlyingEye extends Phaser.Physics.Arcade.Sprite` |
| Sprite key | `flyingeye_attack` (`assets/flying_eye/Attack3.png`) |
| Frame size | 150×150 px |
| Scale | 1.4 |
| Body size | 32×32, offset (59, 59) |
| `isFlying` | `true` — skips rock collisions |
| Base HP | `floor(25 × hpMult + (wave-1) × 3)` where hpMult = 1 + floor(wave/5)×0.2 |
| Base speed | `130 + wave×7` |
| Base DPS | `5 + floor(wave/5)` |
| XP value | `8 + floor(wave/3)` |

**Special:** On each melee hit applies poison to player (2 DPS, 3000ms). Flies over rocks.
**Death:** Tween shrink+fade (300ms), camera shake 40ms/0.002.

---

## SandGolem

| Property | Value |
|---|---|
| Class | `SandGolem extends Phaser.Physics.Arcade.Sprite` |
| Sprite key | `mushroom_attack` (`assets/mushroom/Attack3.png`) |
| Frame size | 150×150 px |
| Scale | 2.0 |
| Body size | 32×40, offset (59, 65) |
| Base HP | `floor(180 × hpMult + (wave-1) × 12)` where hpMult = 1 + floor(wave/5)×0.4 |
| Base speed | `45 + wave×2` |
| Base DPS | `12 + floor(wave/4)` |
| XP value | `25 + floor(wave/2) × 3` |

**Special — Ground Slam:** Every 5s when player within 80px; expanding ring VFX, DPS×2 damage, pushes player at 250 velocity, camera shake 80ms/0.004.
**Knockback immunity:** Takes almost no knockback (velocity 30 only on hit vs normal enemies).
**Death:** Plays `mushroom_death` anim (frames 7–10), spawns 5 debris circle particles (color `#8b7355`), camera shake 100ms/0.006.

---

## Wave-tier Buffs (WaveManager)

| Tier | Condition | Effect |
|------|-----------|--------|
| ≥5 | 30% chance | +30% speed on spawn |
| ≥8 | 30% chance | +50% HP on spawn |
