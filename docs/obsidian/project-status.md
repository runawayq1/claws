# Project Status — v0.2.1

> Last updated: 2026-04-05

## What is CLAWS

Vampire Survivors-style top-down survival roguelite. Phaser 3.90 + Vite 8 + TypeScript 5.9. Auto-attack, upgrade branches, 10-minute runs, encyclopedia meta-progression.

## Stack

- **Runtime:** Phaser 3.90, Arcade Physics (debug: true still on in main.ts)
- **Build:** Vite 8, TypeScript 5.9
- **Backend:** Supabase JS (placeholder creds — session logging is silent no-op)
- **No:** linting, testing, CI/CD

## Heroes (5 playable)

| Hero | Type | Attack Style | Stances |
|------|------|-------------|---------|
| Ignara | `ignara` | Fireball AoE | — |
| Sifra | `sifra` | Ice shards / Lightning beam | ice ↔ lightning (Q) |
| Amun | `amun` | Ground shockwave | — |
| Nazar | `nazar` | Fast melee / Poison puddles | sword ↔ venom (Q) |
| Lyra | `huntress` | Piercing spear / Melee combo | spear ↔ melee (Q) |

**Khet** (evil_wizard) — removed from roster, code commented out, assets retained.

Each hero has 3 upgrade branches × 5 skills + 10 shared generic upgrades = ~25 upgrades per hero.

## Maps (2)

- **Grasslands** (`GameScene`) — 3000×3000 grass tiles, 5 radial biome zones, rocks, trees
- **Undead** (`UndeadMapScene`) — extends GameScene, 9 stone islands + 16 bridges over void

## Enemies (4 types)

Skeleton, Goblin, FlyingEye (flies over rocks), SandGolem (ground slam AoE). All scale HP/speed/damage per wave tier (30s per tier). Boss spawns at 10 min — instant kill on contact.

## Scenes (8 registered)

| Scene | Purpose |
|-------|---------|
| StartScene | Hero select, map toggle, encyclopedia/profile buttons |
| GameScene | Grasslands gameplay |
| UndeadMapScene | Undead map gameplay |
| UIScene | HUD overlay (HP, kills, timer, minimap, pause) |
| LevelUpScene | Upgrade card selection |
| EncyclopediaScene | Pixel-art book with hero lore, skill reference |
| ProfileScene | Lifetime stats + 25 achievements |
| TestScene | Debug hitbox sandbox |

## Key Systems

| System | File | Role |
|--------|------|------|
| WaveManager | `systems/WaveManager.ts` | Spawn ticks, zone mob selection, boss trigger |
| XPSystem | `systems/XPSystem.ts` | Orb spawning, magnet pull, collection |
| UpgradeSystem | `systems/UpgradeSystem.ts` | All upgrade pools, branch defs, level-up tracker |
| MetaProgress | `systems/MetaProgress.ts` | localStorage persistence, 25 achievements |
| Pathfinding | `systems/Pathfinding.ts` | Obstacle avoidance for ground mobs |
| SessionLogger | `systems/SessionLogger.ts` | Supabase writes (currently no-op) |

## Recent Milestones (git log)

- **v0.2.0** — Undead map, encyclopedia polish, bug fixes, 10 hero designs doc
- Encyclopedia: all heroes accessible, lore pages, branch names visible
- Encyclopedia: pixel art book assets, icons, bookmarks, parchment cells
- Encyclopedia scene + spear pierce fix + explosive tips per-hit
- Phase 3: zoned map with 5 radial biomes, props, zone spawning, minimap rings

## Known Issues / WIP

- `debug: true` still on in Phaser config (`main.ts`)
- Supabase uses placeholder credentials
- NameInputScene exists in src/ but NOT registered in scene list
- 10 new hero designs documented (`docs/heroes-new-10-design.md`) but not implemented
- Many unused assets on disk (see `asset-inventory.md`)

## Doc Index

Detailed docs in `docs/obsidian/`:
- `systems-overview.md` — full systems reference with tables and formulas
- `upgrade-registry.md` — all ~65 upgrades with exact effects
- `player-fields.md` — every field on the Player class
- `enemy-registry.md` — enemy stats, scaling, behaviors
- `asset-inventory.md` — every asset file, loaded vs unused
- `project-status.md` — this file (high-level overview)

Design docs in `docs/`:
- `skill-descriptions-all-heroes.md` — narrative skill descriptions
- `heroes-new-10-design.md` — 10 planned new heroes
- `huntress-design.md` — Lyra design doc
- Various agent briefs (encyclopedia, hero mechanics, map)
