# CLAWS — Systems Overview

> Reference doc. Sources: `src/entities/`, `src/scenes/`, `src/systems/`, `src/config/GameConfig.ts`

---

## Heroes

**File:** `src/entities/Player.ts` — `HERO_DEFS`, `SPRITE_HEROES`, `HeroType`

| Hero | Internal Type | Name | HP | Speed | Damage | Range | Cooldown | Attack Type |
|------|--------------|------|----|-------|--------|-------|----------|-------------|
| Ignara | `ignara` | Ignara | 80 | 140 | 30 | 180 | 700ms | fireball (AoE explosion, knockback 120) |
| Sifra | `sifra` | Sifra | 70 | 150 | 12 | 160 | 800ms | iceshard OR lightning cone (stance toggle) |
| Amun | `amun` | Amun | 160 | 100 | 22 | 80 | 1200ms | shockwave (ground slam ring) |
| Nazar | `nazar` | Nazar | 90 | 130 | 18 | 55 | 400ms | melee (fast multi-strike) |
| Huntress | `huntress` | Lyra | 80 | 140 | 18 | 300 | 500ms | spear (piercing projectile) OR melee combo |

**Khet** (`khet`) — removed from playable roster; code/assets retained but commented out.

### Sprite configs (`SPRITE_HEROES`)

| Hero | Scale | Body W×H | Frame Size | Source Sheet |
|------|-------|----------|------------|-------------|
| ignara | 1.6 | 22×31 | 150×150 | `assets/fire_wizard/` |
| sifra | 0.9 | 40×58 | 231×190 | `assets/wizard/` |
| amun | 1.5 | 33×46 | 160×111 | `assets/king/` |
| nazar | 1.25 | 33×46 | 200×200 | `assets/martial_hero/` |
| huntress | 1.4 | 28×38 | 150×150 | `assets/huntress/` |

**Shadow:** All heroes have `_shadow` — a dark ellipse (`Phaser.GameObjects.Ellipse`, 40×16, alpha 0.35) at feet level, animated with a breathing tween (scaleX 0.9→1.1, 800ms yoyo).

### Stance systems

- **Sifra** — `stance: 'ice' | 'lightning'`, toggle Q. Affects branch selection at level-up.
- **Nazar** — `nazarStance: 'sword' | 'venom'`, toggle Q.
- **Huntress** — `huntressStance: 'melee' | 'spear'`, toggle Q. `meleeEnergy`/`spearEnergy` (each 100).

---

## Enemies

**Files:** `src/entities/Skeleton.ts`, `Zergling.ts` (Goblin), `Scorpion.ts` (FlyingEye), `SandGolem.ts`

| Enemy | Class | Sprite Key | Base HP | Speed | DPS | XP |
|-------|-------|-----------|---------|-------|-----|----|
| Skeleton | `Skeleton` | `skeleton_attack` | 45×hpMult+(wave-1)×5 | 80+wave×4 | 7+floor(wave/4) | 8+floor(wave/3) |
| Goblin (Zergling) | `Goblin` | `goblin_attack` | 40×hpMult+(wave-1)×5 | 90+wave×5 | 8+floor(wave/4) | 10+floor(wave/3) |
| FlyingEye (Scorpion) | `FlyingEye` | `flyingeye_attack` | 25×hpMult+(wave-1)×3 | 130+wave×7 | 5+floor(wave/5) | 8+floor(wave/3) |
| SandGolem | `SandGolem` | `mushroom_attack` | 180×hpMult+(wave-1)×12 | 45+wave×2 | 12+floor(wave/4) | 25+floor(wave/2)×3 |

**hpMult formula:** `1 + floor(wave/5) × scaleFactor` (0.3 for most, 0.4 for Golem, 0.2 for FlyingEye)

**Shared enemy fields:** `isMarked` (bool), `markTimer` (ms), `isRooted` (bool), `rootTimer` (ms), `lastDamageType`.

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

**Spawn table by zone (distance from world center):**

| Zone | Range | Skeleton | Goblin | FlyingEye | SandGolem |
|------|-------|----------|--------|-----------|-----------|
| 0 | 0–600px | 100% | — | — | — |
| 1 | 600–1200px | 70% | 30% | — | — |
| 2 | 1200–1800px | 40% | 30% | 20% | 10% |
| 3 | 1800–2400px | 15% | 30% | 30% | 25% |
| 4 | 2400px+ | 10% | 20% | 30% | 40% |

Boss spawns at 10 min; spawner stops. 3s warning (`claws-incoming` event) before `claws-spawn`.

---

## Boss

**File:** `src/scenes/GameScene.ts` — `spawnClawsBoss()`

- Spawns at screen edge after `RUN_DURATION` (10 min), speed 120, moves toward player.
- One-hit kill on contact — instant game-over.
- Texture procedurally generated (`claws_boss`), scale 2.5×.

---

## Upgrades

**File:** `src/systems/UpgradeSystem.ts` — `GENERIC_POOL`, `HERO_BRANCHES`, `BranchDef`

### Generic Pool (all heroes)

| ID | Label | Effect |
|----|-------|--------|
| g1 | Sharp Edge | +20% damage |
| g2 | Swift Feet | +15% speed |
| g3 | Eagle Eye | +20% range |
| g4 | Quick Hands | −20% attack cooldown (min 200ms) |
| g5 | Vitality | +25% max HP + heal |
| g6 | Regeneration | +2 HP/s regen |
| g7 | Cleave | Splash radius ≥60px |
| g8 | Wisdom | +25% XP gain |
| g9 | Multistrike | +1 strike per attack |
| g10 | Iron Skin | +25% armor (cap 70%) |

### Hero Branches

| Hero | Branch | Color |
|------|--------|-------|
| ignara | Inferno / Fortress / Havoc | orange / red / amber |
| nazar | Way of the Blade / Way of Venom / Way of Shadow | silver / green / purple |
| sifra (ice) | Frost / Shatter / Crystal | blue / light-blue / pale-blue |
| sifra (lightning) | Lightning | violet |
| amun | Wrath / Bastion / Quake | orange-red / blue / yellow |
| huntress | Predator / Stalker / Warden | red / green / blue |

**Level-up flow:** First level-up = branch selection (3 branch previews, header "CHOOSE YOUR PATH / Choose Specialization"). Subsequent = 2 generic + 1 branch skill in sequence.

---

## GameScene — Grasslands Map

**File:** `src/scenes/GameScene.ts`
**Key:** `'GameScene'`

| Property | Value |
|----------|-------|
| World size | 3000 × 3000px |
| Tile size | 64px (drawn from 32px sprites at scale 2) |
| Terrain | Pure grass tiles (`terrain_grass`, frames 4–31); no roads or stone patches |
| Zone tints | Zone 3: `0xccddcc`, Zone 4: `0xbbccbb` |
| Rocks | ~50 per 5 zones, static colliders, scale 0.6–1.2×, min spacing 120px |
| Rock assets | `rock1_1/2`, `rock2_1/2`, `rock3_1/2` |
| Trees | Zones 1–3: `deco_tree1/2/3`, decorative, depth 3 |
| Grass tufts | Zones 0–4: `prop_grass_tuft1`, `prop_grass_tuft3` |

Zone radii (from world center): 0–600 / 600–1200 / 1200–1800 / 1800–2400 / 2400+

---

## UndeadMapScene

**File:** `src/scenes/UndeadMapScene.ts`
**Key:** `'UndeadMapScene'`
**Extends:** `GameScene`

Island + bridge terrain over a dark void background (`0x0a0812`).

### Islands

| Idx | Name | Offset (from center) | Radius |
|-----|------|-----------------------|--------|
| 0 | Central Plateau | 0, 0 | 620px |
| 1 | NW Graveyard | −750, −600 | 450px |
| 2 | NE Ruins | +750, −600 | 480px |
| 3 | SW Crystal Cave | −800, +600 | 420px |
| 4 | SE Bone Fields | +800, +600 | 450px |
| 5 | N Dark Shrine | 0, −1050 | 380px |
| 6 | S Lich Domain | 0, +1050 | 400px |
| 7 | W Outpost | −1250, 0 | 350px |
| 8 | E Outpost | +1250, 0 | 350px |

16 bridges connect the islands (widths 120–220px). Solid ground check via `isOnGround()`.

**Tileset:** `undead_ground` (`Ground_rocks.png`, 416×1392, 16×16 tiles, scale 4 = 64px game tiles).
- Central island (idx 0): mostly `FILL_LIGHT` (frames 54, 253, 256, 433), 15% `FILL_VARIED`
- Inner ring (idx 1–4): 30% `FILL_VARIED`, rest `FILL_LIGHT`
- Outer islands (idx 5–8): mostly `FILL_DARK` (frame 1495)

### Undead Props (19 keys)

| Key | Source File | Island Theme |
|-----|-------------|-------------|
| undead_grave1–4 | `Grave_shadow1_1–4.png` | NW Graveyard, S Lich Domain |
| undead_ruin1–3 | `Ruin_shadow1_1–3.png` | NE Ruins, N Dark Shrine, S Lich |
| undead_dead_tree1–2 | `Dead_tree_shadow1_1–2.png` | Central, NW, SW |
| undead_broken_tree1–2 | `Broken_tree_shadow1_1–2.png` | NE Ruins |
| undead_crystal1–2 | `Crystal_shadow1_1–2.png` | SW Crystal Cave, N Dark Shrine |
| undead_bones1–2 | `Bones_shadow1_1–2.png` | Central, NW, SE |
| undead_skulls | `Pile_sculls_shadow1.png` | SE Bone Fields |
| undead_dead_arm | `Dead_arm_shadow1_1.png` | SE Bone Fields, S Lich |
| undead_thorn1–2 | `Thorn_plant_shadow1_1–2.png` | Central, SW |

---

## StartScene — Map & Hero Selection

**File:** `src/scenes/StartScene.ts`

- 5 animated hero circles (idle animation), click to select + start game.
- On hero select: calls `unlockHero(hero.type)` (encyclopedia tracking), then starts `selectedMap` scene.
- **Map selector** button (bottom-left): toggles `selectedMap` between `'GameScene'` (label: "MAP: GRASSLANDS") and `'UndeadMapScene'` (label: "MAP: UNDEAD", color `#aa88ff`).
- **Encyclopedia** book icon (bottom-right): animated sprite (`book_anim`, 12 frames, 542×542). Desktop: hover opens, click navigates. Mobile: tap animates then transitions.
- **Profile** button (bottom-center-right): goes to `ProfileScene`.
- **TEST** button (bottom-right corner): goes to `TestScene`.

---

## Encyclopedia System

**File:** `src/scenes/EncyclopediaScene.ts`
**Key:** `'EncyclopediaScene'`

Persistent knowledge base unlocked through gameplay.

### localStorage

| Key | `'claws_encyclopedia'` |
|-----|------------------------|
| Schema | `{ heroes: string[], upgrades: string[], branches: string[] }` |
| Functions | `loadEncyclopedia()`, `saveEncyclopedia()`, `unlockHero()`, `unlockUpgrade()`, `unlockBranch()`, `isHeroUnlocked()`, `isUpgradeUnlocked()`, `isBranchUnlocked()` |

### Hero Lore (5 heroes)

| Type | Display Name | Role | Unlock Trigger |
|------|-------------|------|----------------|
| ignara | Ignara | Fire Mage | Hero select in StartScene |
| sifra | Sifra | Ice Mage | Hero select |
| amun | Amun | Guardian | Hero select |
| nazar | Nazar | Samurai | Hero select |
| huntress | Lyra | Spear Thrower | Hero select |

### Book UI

- 2-page spread: left = hero list + medallion art from `book_content.png`; right = lore / branch skills / generic upgrades (3 pages, `rightPage` 0–2).
- Bookmarks: `book_bookmarks.png` (2×5 grid, 32×28 per frame; inactive/active columns).
- Book assets in `assets/book/`: `pages_apper.png`, `info_tileset.png`, `book_content.png`, `Icons.png`, `sells_full.png`, `bookmarks.png`, `book_anim.png` (12-frame animation, 542×542).

---

## Pickups

**File:** `src/entities/Pickup.ts`

| Type | Effect | Notes |
|------|--------|-------|
| `hp` | Heal 15% max HP | Drop: 8% chance on enemy death |
| `heart` | Heal 10% max HP | Drop: every 100 kills |
| `magnet` | Pull all XP orbs to player | Drop: 2% chance |
| `bomb` | — | Drop: 1% chance, tier≥3 |
| `shield` | — | Drop: 0.5% chance, tier≥4 |
| `speed` | — | Drop: 0.5% chance, tier≥2 |
| `xpstar` | — | Drop: 0.5% chance, tier≥5 |

Auto-despawn after 10s with fade-out. Collected via overlap.

---

## Config

**File:** `src/config/GameConfig.ts`

| Key | Value |
|-----|-------|
| `WORLD_WIDTH/HEIGHT` | 3000 |
| `TILE_SIZE` | 64 |
| `SPAWN_RADIUS` | 600 |
| `RUN_DURATION` | 600,000ms |
| `MOB_CAP_BASE` | 40 |
| `MOB_CAP_PER_WAVE` | 15 |
| `MOB_CAP_MAX` | 200 |
| `XP_BASE` | 100 |
| `XP_SCALE` | 1.4 |
