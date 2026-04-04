# CLAWS — Systems Overview

> Auto-generated reference. Sources: `src/entities/`, `src/scenes/GameScene.ts`, `src/systems/`, `src/config/GameConfig.ts`

---

## Heroes

**File:** `src/entities/Player.ts` — `HERO_DEFS`, `SPRITE_HEROES`, `HeroType`

| Hero | HP | Speed | Damage | Range | Cooldown | Attack Type |
|------|----|-------|--------|-------|----------|-------------|
| ignara | 80 | 140 | 30 | 180 | 700ms | fireball (AoE explosion) |
| sifra | 70 | 150 | 12 | 160 | 800ms | iceshard (ice) OR lightning (cone, continuous) |
| amun | 160 | 100 | 22 | 80 | 1200ms | shockwave (ground slam ring) |
| nazar | 90 | 130 | 18 | 55 | 400ms | melee (fast multi-strike) |

**Sifra Stance System** — toggle between `ice` (iceshard projectile) and `lightning` (continuous cone, frame-by-frame). Stance affects branch selection at level-up.

**Nazar Stance System** — toggles between melee and venom (extended range throwing). Stance tracked via `nazarStance`.

**Base stats from `GameConfig`:** HP 100, Speed 160, Damage 25, Range 120, Attack CD 800ms, Regen 0 (heroes override these).

---

## Enemies

**Files:** `src/entities/Zergling.ts`, `Scorpion.ts`, `SandGolem.ts`

| Enemy | Sprite | Base HP | Speed | DPS | XP | Special |
|-------|--------|---------|-------|-----|----|---------|
| Zergling (Orc) | `goblin_attack` | 40 + wave scaling | 90 + wave×5 | 8/s + wave | 10 + wave/3 | Standard; knockback 120 |
| Scorpion | `flyingeye_attack` | 25 + wave scaling | 130 + wave×7 | 5/s + wave | 8 + wave/3 | Applies poison (2 DPS, 3s) on hit |
| Sand Golem | `mushroom_attack` | 180 + wave scaling | 45 + wave×2 | 12/s + wave | 25 + wave | Ground slam AoE (r=80, 5s CD, 2× DPS dmg); debris on death |

**HP scaling formula:** `BaseHP × (1 + floor(wave/5) × mult) + (wave−1) × perWave`  
**Tier buffs (WaveManager):** tier≥5 → 30% chance +30% speed; tier≥8 → 30% chance +50% HP.

---

## Waves

**File:** `src/systems/WaveManager.ts`

| Property | Value |
|----------|-------|
| Tick interval | 100ms |
| Wave tier | `floor(elapsedMs / 30000) + 1` — new tier every 30s |
| Spawn interval | `max(200, 800 − wave×50)` ms |
| Spawn radius | 600px from player |
| Mob cap | `min(200, 40 + wave×15)` alive at once |
| Run duration | 600,000ms (10 minutes) |

**Spawn table (by tier):**

| Tier | Enemy | Chance |
|------|-------|--------|
| any | Zergling | fallback (majority) |
| 3+ | Scorpion | 25% |
| 6+ | Sand Golem | 8% |

Boss spawns at 10 min; regular spawner stops. 3s warning before boss appears.

---

## Boss

**File:** `src/scenes/GameScene.ts` — `spawnClawsBoss()`

- Spawns at screen edge after `RUN_DURATION` (10 min), moves toward player at speed 120.
- One-hit kill on contact — instant game-over condition.
- Texture procedurally generated (`claws_boss`), scale 2.5×.
- Preceded by `claws-incoming` event (UI warning), then `claws-spawn` 3s later.

---

## Upgrades

**File:** `src/systems/UpgradeSystem.ts` — `GENERIC_POOL`, `HERO_BRANCHES`, `BranchDef`

### Generic Pool (G1–G10, all heroes)

| ID | Label | Effect |
|----|-------|--------|
| g1 | Sharp Edge | +20% damage |
| g2 | Swift Feet | +15% speed |
| g3 | Eagle Eye | +20% range |
| g4 | Quick Hands | −20% attack cooldown (min 200ms) |
| g5 | Vitality | +25% max HP |
| g6 | Regeneration | +2 HP/s regen |
| g7 | Cleave | Splash radius ≥60px |
| g8 | Wisdom | +25% XP gain |
| g9 | Multistrike | +1 strike per attack |
| g10 | Iron Skin | +25% armor (cap 70%) |

### Hero Branches (3 branches × 5 skills each)

| Hero | Branch | Color | Theme |
|------|--------|-------|-------|
| ignara | Inferno | orange | Bigger/stronger fireballs, burn DOT, chaining |
| ignara | Fortress | red | Armor, heal-on-kill, revive (Phoenix Heart) |
| ignara | Havoc | amber | Knockback, lava trail, low-HP damage bonus |
| nazar | Way of the Blade | silver | Blink-on-melee, bleed DOT, assassinate (2× lone) |
| nazar | Way of Venom | green | Poison puddles, pandemic spread, necrosis ramp |
| nazar | Way of Shadow | purple | Invuln after melee, phantom trail, execute <20% HP |
| sifra (ice) | Frost | blue | Slow to 0.3×, blizzard aura, freeze stun |
| sifra (ice) | Shatter | light blue | Shard splits, ice spear, avalanche chain |
| sifra (ice) | Crystal | pale blue | Pierce count, ice armor shield, cryo counter |
| sifra (lightning) | Lightning | violet | Chain, wide cone, ball lightning, random strikes |
| amun | Wrath | orange-red | Thorns reflect, consecration aura, execute |
| amun | Bastion | blue | Fortify armor, iron will (cap hit to 10% HP), revive |
| amun | Quake | yellow | Boulder projectile, earthquake stun, gravity pull |

**Level-up flow:** First level-up = branch selection (3 branch previews). Subsequent = 2 generic + 1 branch skill in sequence.

---

## Map / Terrain

**File:** `src/scenes/GameScene.ts` — `drawTerrain()`, `scatterRocks()`  
**Config:** `src/config/GameConfig.ts`

| Property | Value |
|----------|-------|
| World size | 3000 × 3000px |
| Tile size | 64px (terrain drawn at 32px sprites) |
| Terrain | Grass + stone tileset blend; stone patches near center |
| Rocks | ~150 scattered, static physics colliders, scale 0.6–1.2×, min spacing 120px |
| Rock assets | `rock1_1/2`, `rock2_1/2`, `rock3_1/2` (PNG, no shadow) |
| Trees | 3 variants (`deco_tree1/2/3`), decorative only, min spacing 130px |
| Camera | Follows player with 0.1 lerp, bounded to world |

Both player and enemies collide with rocks. Trees are visual only (no collision).

---

## Pickups

**File:** `src/entities/Pickup.ts`

| Type | Visual | Effect | Notes |
|------|--------|--------|-------|
| `hp` | Red circle + cross | Heal 15% max HP | Green float text |
| `heart` | Pink heart | Heal 10% max HP | Pink float text |
| `magnet` | Blue circle + U | Pull all XP orbs to player | Blue flash VFX |

All pickups float (sine tween ±5px), auto-despawn after 10s with fade-out. Collected via overlap; sparkle VFX on pickup.

---

*Key config file: `/Users/squad/Documents/claws/src/config/GameConfig.ts`*
