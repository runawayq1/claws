# Project Status — v0.3.3

> Last updated: 2026-04-06

## What is CLAWS

Vampire Survivors-style top-down survival roguelite. Phaser 3.90 + Vite 8 + TypeScript 5.9. Auto-attack, upgrade branches, 10-minute runs, encyclopedia meta-progression.

## Stack

- **Runtime:** Phaser 3.90, Arcade Physics
- **Build:** Vite 8, TypeScript 5.9
- **Deploy:** Vercel (https://claws-chi.vercel.app)
- **No:** linting, testing, CI/CD

## Git Workflow

- `main` — production deploys only (Vercel)
- `dev` — active development branch
- `feat/*` — feature branches off dev, merge back into dev
- Release flow: `feat/* → dev → main`

## Heroes (7 playable)

| Hero | Type | Attack Style | Stances |
|------|------|-------------|---------|
| Ignara | `ignara` | Fireball AoE | — |
| Sifra | `sifra` | Ice shards / Lightning beam | ice ↔ lightning (Q) |
| Amun | `amun` | Ground shockwave | — |
| Nazar | `nazar` | Fast melee / Poison puddles | sword ↔ venom (Q) |
| Lyra | `huntress` | Piercing spear / Melee combo | spear ↔ melee (Q) |
| Khashin | `khashin` | Sand Assassin | — |
| Muller | `muller` | Crystal Golem | — |

Each hero has 3 upgrade branches × 5 skills + 10 shared generic upgrades.

## Maps (2)

- **Grasslands** (`GameScene`) — 3000×3000 grass tiles, 5 radial biome zones, rocks, trees
- **Undead** (`UndeadMapScene`) — extends GameScene, 9 stone islands + 16 bridges over void

## Enemies (6 types + boss)

| Enemy | Class | Style | Notes |
|-------|-------|-------|-------|
| Orc1 | `Orc1` | 64×64 top-down | Fast, weak (replaces Goblin) |
| Orc2 | `Orc2` | 64×64 top-down | Medium (replaces Skeleton) |
| Orc3 | `Orc3` | 64×64 top-down | Tanky (replaces Skeleton2) |
| FlyingEye | `FlyingEye` | 150×150 side-view | Flies over rocks, poison immune |
| SandGolem | `SandGolem` | 150×150 side-view | Ground slam AoE |
| Vampire | `Vampire` | 32×32 | Lifesteal |
| Boss (Klaus) | spawned inline | 288×160 | Spawns at 10min, instant kill on contact |

All scale HP/speed/damage per wave tier (30s per tier).

## Scenes (8 registered)

| Scene | Purpose |
|-------|---------|
| StartScene | Hero select, map toggle, encyclopedia/profile buttons, boss preview |
| GameScene | Grasslands gameplay |
| UndeadMapScene | Undead map gameplay |
| UIScene | HUD overlay (HP, kills, timer, minimap, pause) |
| LevelUpScene | Upgrade card selection + branch specialization |
| EncyclopediaScene | Pixel-art book with hero lore, skill reference |
| ProfileScene | Lifetime stats + 25 achievements |
| TestScene | Debug hitbox sandbox |

## Key Systems

| System | File | Role |
|--------|------|------|
| WaveManager | `systems/WaveManager.ts` | Spawn ticks, zone mob selection, boss trigger |
| XPSystem | `systems/XPSystem.ts` | Orb spawning, magnet pull, collection |
| UpgradeSystem | `systems/UpgradeSystem.ts` | All upgrade pools, branch defs, icon mapping, level-up tracker |
| MetaProgress | `systems/MetaProgress.ts` | localStorage persistence, 25 achievements |
| Pathfinding | `systems/Pathfinding.ts` | Obstacle avoidance for ground mobs |
| BaseEnemy | `entities/BaseEnemy.ts` | Abstract enemy base: combat, KB, VFX, movement |

## Architecture

- Heroes extracted into `src/entities/heroes/` (one file per hero)
- Enemies extend `BaseEnemy` abstract class
- Terrain uses RenderTexture baking (1 draw call vs thousands)
- Progressive map generation in deferred packs for instant first frame
- Only selected hero's assets loaded (lazy loading in preload)
- Icon spritesheet: 1280×1280, 10×10 grid of 128×128 (100 frames total)

## Recent Milestones

- **v0.4.0** — Orc enemies, boss spawn anim, blood VFX, heart progression, fixes
- **v0.3.3** — Fix game freeze after branch selection on Undead Map
- **v0.3.2** — Restore boss demon animations on hero select screen
- **v0.3.1** — Hero extraction, Amun icons, encyclopedia unlock, new enemies
- **v0.2.0** — Undead map, encyclopedia polish, bug fixes

## Known Issues

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | Map loading delay after hero select | Medium | ~35 assets load synchronously in preload(). Solution researched: LoadingScene with progress bar |
| 2 | Sifra Lightning icons are placeholders | Low | Uses Shatter branch icons (frames 45-49). Needs dedicated art |
| 3 | boss_demon loads twice | Low | Loaded lazily in StartScene AND in GameScene.preload() without exists() guard |
| 4 | Khashin/Muller combat skills not implemented | High | Hero classes exist, branch upgrades defined, but skill effects are stubs |
| 5 | Evil Wizard assets unused | Info | Returned to assets/ for future hero, no code references |
| 6 | SandGolem uses mushroom sprite | Low | Visually a mushroom, named SandGolem in code |
| 7 | debug: true in Phaser config | Low | `main.ts` — should disable for production |
| 8 | Supabase uses placeholder credentials | Low | SessionLogger is a silent no-op |

## Ideas / Roadmap

| # | Idea | Category | Priority |
|---|------|----------|----------|
| 1 | LoadingScene with progress bar between hero select and gameplay | Performance | High |
| 2 | Khashin combat mechanics (Sand Assassin — dash, sand armor, mirage) | Gameplay | High |
| 3 | Muller combat mechanics (Crystal Golem — shards, geode, pillars) | Gameplay | High |
| 4 | Generate icons for all heroes (prompts ready in icon-generation-prompts.md) | Art | Medium |
| 5 | Evil Wizard → new hero (8th hero, assets ready) | Content | Medium |
| 6 | Meta-progression currency system (design doc exists) | Systems | Medium |
| 7 | Skill levels — upgrades scale with repeated picks (design doc exists) | Systems | Medium |
| 8 | 3rd map — dungeon/cave theme | Content | Medium |
| 9 | Sound effects + music | Polish | Medium |
| 10 | Mobile touch controls | Platform | Low |
| 11 | Leaderboard (Supabase integration) | Social | Low |
| 12 | Progressive encyclopedia unlock toggle (flag exists, default: all unlocked) | UX | Low |
| 13 | Minimap enemy dots / boss indicator | UX | Low |
| 14 | Chest/loot system expansion | Gameplay | Low |
| 15 | Achievements visual polish (ProfileScene) | Polish | Low |
| 16 | **Mini-bosses every minute** (see below) | Gameplay | High |
| 17 | Skill challenge system for progressive unlock (design doc in progress) | Systems | High |

### Mini-Boss System (Idea #16)

Every 60 seconds a **mini-boss** spawns — a stronger elite enemy with unique mechanics. Replaces the current "nothing interesting until 10min boss" pacing.

**Spawn schedule:**
- 1:00 — **Orc Warchief** (large orc, 3× HP, charges at player, ground slam)
- 2:00 — **Plague Eye** (giant flying eye, poison cloud trail, splits into 3 eyes on death)
- 3:00 — **Crystal Golem** (slow tank, crystal armor that must be shattered, reflects projectiles)
- 4:00 — **Shadow Stalker** (fast vampire elite, teleports behind player, lifesteal burst)
- 5:00 — **Bone Colossus** (giant skeleton, summons skeleton minions, AoE stomp)
- 6:00 — **Sand Wyrm** (burrows underground, erupts under player, wide AoE)
- 7:00 — **Necromancer** (stands back, raises dead enemies as zombies, shield while minions live)
- 8:00 — **Infernal Knight** (armor phases — fire/ice/lightning, immune to matching element)
- 9:00 — **Void Herald** (pre-boss, gravity pull + void zones, telegraphs final boss)
- 10:00 — **Klaus** (final boss, existing behavior)

**Design principles:**
- Each mini-boss has 1 unique mechanic that forces the player to adapt (not just a stat sponge)
- HP scales with wave tier at spawn time
- Drop guaranteed heart + rare pickup on death
- Warning announcement 5s before spawn ("A powerful enemy approaches...")
- Mini-boss health bar shown at top of screen (like boss bar)
- Kill grants bonus XP (equivalent to ~20 normal kills)
- Mini-bosses use existing enemy sprites scaled up + tinted, or reuse boss_demon frames
- Later mini-bosses can use the evil_wizard assets (reserved for this)

## Doc Index

Obsidian reference (`docs/obsidian/`):
- `systems-overview.md` — full systems reference with tables and formulas
- `upgrade-registry.md` — all upgrades with exact effects
- `player-fields.md` — every field on the Player class
- `enemy-registry.md` — enemy stats, scaling, behaviors
- `asset-inventory.md` — asset file inventory

Design docs (`docs/`):
- `icon-generation-prompts.md` — GPT prompts for all 100 skill icons
- `skill-descriptions-all-heroes.md` — narrative skill descriptions
- `skill-levels-design.md` — skill level scaling design
- `khashin-design.md` — Khashin hero design
- `crystal-muller-design.md` — Muller hero design
- `game-design-roadmap.md` — feature roadmap
- `meta-progression-currency-design.md` — currency/meta design
