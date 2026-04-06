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

- **v0.3.3** — Fix game freeze after branch selection on Undead Map
- **v0.3.2** — Restore boss demon animations on hero select screen
- **v0.3.1** — Hero extraction, Amun icons, encyclopedia unlock, new enemies
- **v0.2.0** — Undead map, encyclopedia polish, bug fixes

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
