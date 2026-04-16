# Project Status — v0.5.1

> Last updated: 2026-04-16

## What is CLAWS

Vampire Survivors-style top-down survival roguelite. Phaser 3.90 + Vite 8 + TypeScript 5.9. Auto-attack, upgrade branches, 10-minute runs, encyclopedia meta-progression.

## Stack

- **Runtime:** Phaser 3.90, Arcade Physics
- **Build:** Vite 8, TypeScript 5.9
- **Deploy:** Vercel (direct `vercel --prod --yes`, no git remote deploy)
- **No:** linting, testing, CI/CD

## Git Workflow

- `main` — production deploys only (Vercel)
- `dev` — active development branch
- `feat/*` — feature branches off dev, merge back into dev
- Release flow: `feat/* → dev → main`

## Heroes (9 playable)

| Hero | Type | Attack Style | Stances | Color (Tailwind) |
|------|------|-------------|---------|-------------------|
| Ignara | `ignara` | Fireball AoE | — | Orange-500 |
| Sifra | `sifra` | Ice shards / Lightning beam | ice ↔ lightning (Q) | Sky-400 |
| Amun | `amun` | Ground shockwave | melee ↔ quake (Q, unlockable) | Amber-400 |
| Nazar | `nazar` | Fast melee / Poison puddles | blade ↔ venom (Q) | Rose-500 |
| Lyra | `huntress` | Piercing spear / Melee combo | spear ↔ melee (Q) | Emerald-500 |
| Khashin | `khashin` | Wind slash / Sand | sirocco ↔ haboob (Q) | Cyan-300 |
| Givi | `muller` | Crystal wave | — | Blue-400 |
| Vael | `vael` | Soul bolt / Life drain | orbs ↔ drain (Q) | Violet-400 |
| Nightborne | `nightborne` | Void slash | — | Purple-500 |

Each hero has 3 upgrade branches × 4-5 skills + 10 shared generic upgrades. All hero/branch colors use Tailwind-inspired harmonized palette.

## Maps (2)

- **Grasslands** (`GameScene`) — infinite chunk-based map, 5 radial biome zones, rocks, trees
- **Undead** (`UndeadMapScene`) — extends GameScene, 9 stone islands + 16 bridges over void

## Enemies (6 types + boss)

| Enemy | Class | Style | Notes |
|-------|-------|-------|-------|
| Orc1 | `Orc1` | 64×64 top-down | Fast, weak |
| Orc2 | `Orc2` | 64×64 top-down | Medium |
| Orc3 | `Orc3` | 64×64 top-down | Tanky |
| FlyingEye | `FlyingEye` | 150×150 side-view | Flies over rocks, poison immune |
| SandGolem | `SandGolem` | 150×150 side-view | Ground slam AoE |
| Vampire | `Vampire` | 32×32 | Lifesteal |
| Boss (CLAWS) | `ClawsBoss` | 288×160 | 10min, 4000 HP, 3 phases |

## Scenes (13 registered)

| Scene | Purpose |
|-------|---------|
| StartScene | Main menu — SOLO/MULTIPLAYER mode buttons, PROFILE/SCORES/FORGE bottom pills, notification bell, logout button |
| HeroSelectScene | Hero grid (5-col landscape / 3-col portrait) + hero popup with stance selection |
| LoadingScene | Progress bar between hero select and gameplay |
| LobbyScene | Online lobby — create/join room, ready-up |
| GameScene | Grasslands gameplay |
| UndeadMapScene | Undead map gameplay |
| UIScene | HUD overlay (HP, kills, timer, minimap, pause) |
| LevelUpScene | Upgrade card selection (stance pre-selected from hero popup, no more level-1 branch picker in solo) |
| EncyclopediaScene | Pixel-art book with hero lore, skill reference |
| ForgeScene | Meta-upgrade shop + hero recruit section |
| ProfileScene | Lifetime stats + 25 achievements |
| LeaderboardScene | Online leaderboard (Supabase) |
| NameInputScene | Player name entry for leaderboard |

## Key Systems

| System | File | Role |
|--------|------|------|
| WaveManager | `systems/WaveManager.ts` | Spawn ticks, zone mob selection, boss trigger; O(1) alive count |
| XPSystem | `systems/XPSystem.ts` | Orb spawning, magnet pull, collection; 5s sweep expiry |
| UpgradeSystem | `systems/UpgradeSystem.ts` | All upgrade pools, branch defs, icon mapping, level-up tracker |
| MetaProgress | `systems/MetaProgress.ts` | localStorage persistence, 25 achievements, per-hero aggregates (heroRuns/Wins/Kills/TimeMs), lastHero tracking |
| NotificationCenter | `systems/NotificationCenter.ts` | Client-side inbox (localStorage), per-seedId delivery for patch notes |
| NotificationBell | `ui/NotificationBell.ts` | Gold bell icon with unread badge + halo pulse, popup message list |
| CircleButton | `ui/CircleButton.ts` | Reusable circular icon button (used across all scenes for back/logout) |
| Pathfinding | `systems/Pathfinding.ts` | Obstacle avoidance for ground mobs |
| BaseEnemy | `entities/BaseEnemy.ts` | Abstract enemy base: combat, KB (timestamp), VFX, movement throttle |
| NetworkGameAdapter | `systems/NetworkGameAdapter.ts` | Colyseus multiplayer bridge |

## Hero Select Popup (v0.5.1 — major feature)

Clicking a hero in the grid opens a modal popup with:
- **Left column**: animated portrait (gold frame + gold tracer + ambient particles per hero), stat bars (HEALTH/SPEED/DAMAGE/ATK SPD/RANGE with animated fill + tick markers), HERO STATS block (RUNS/KILLS/TIME from MetaProgress aggregates)
- **Right column**: 3 vertical stance cards (icon + title + theme + bold branch summary), hover glow, shine sweep on select, attack anim playback
- **Bottom**: starting-bonus panel (shows first skill of chosen stance), PLAY (green) + BACK buttons, PLAY gold tracer
- Arrow buttons outside panel + keyboard Left/Right + swipe for hero cycling
- Stance pre-seeds `UpgradeTracker.chosenBranch` + applies first skill at level 1 → first level-up shows normal cards, not branch picker
- Multiplayer not affected (`!this._online` guard)
- `prefers-reduced-motion` respected for all loop animations

## Architecture

- Heroes extracted into `src/entities/heroes/` (one file per hero)
- Fallback textures in `src/entities/heroes/fallbackTextures.ts`
- Enemies extend `BaseEnemy` abstract class
- Terrain uses RenderTexture baking + chunk-based infinite map
- Progressive map generation in deferred packs for instant first frame
- Only selected hero's assets loaded (lazy loading in preload)
- Icon spritesheet: 1280×1280, 10×10 grid of 128×128 (120 frames mapped)
- `src/ui/CircleButton.ts` — reusable back/logout button component
- `src/ui/NotificationBell.ts` — inbox bell with gold badge
- LevelUpScene uses Graphics pools (40 confetti + 15 sparks + 1 flash)
- Scene re-entry safety: all scenes reset stale state (popups, tweens, handlers, arrays) in `create()`
- SW cache: `claws-v0.5.1` (forces client refresh on deploy)

## Recent Milestones

- **v0.5.1** — Hero select popup overhaul (portrait/stats/stances/attack anims/particles/gold tracer), hero grid 5×3/3×3, scene overhaul (gold halos, idle breathe, staggered entry, hover tooltips, circular back buttons), Tailwind color palette across all heroes + 27 branches, ~85 upgrade desc rewrites (px→m, dmg→damage, cd→cooldown), per-hero stats in popup (heroKills/heroTimeMs backend), NotificationCenter per-seedId delivery, CircleButton component, cross-scene visual polish (StartScene pills, ForgeScene card glow/divider, LeaderboardScene table polish), stale-state re-entry fixes (HeroSelect/GameScene/UIScene)
- **v0.5.0** — Vael (Pale Doctor) + Nightborne (Void Blade) heroes, dual-stance Vael rewrite (15 skills), notification bell/inbox, balance pass (Sifra/Nazar/Amun/Huntress/Ignara), HP/energy HUD redesign, mastery diamonds, boss HP bar frame
- **v0.4.4** — Mortal CLAWS boss (3 phases), Run Summary Screen, perf round 3
- **v0.4.3** — Perf pass (20+ fixes), architect review, font/UI cleanup, multiplayer stability
- **v0.4.2** — Multiplayer: server-authoritative movement, hero abilities online
- **v0.4.1** — Online mode groundwork: LobbyScene, NetworkGameAdapter, Colyseus
- **v0.4.0** — Orc enemies, boss spawn anim, blood VFX

## Known Issues

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | Sifra Lightning icons are placeholders | Low | Uses Shatter branch icons. Needs dedicated art |
| 2 | SandGolem uses mushroom sprite | Low | Visually a mushroom, named SandGolem in code |
| 3 | debug: true in Phaser config | Low | `main.ts` — should disable for production |
| 4 | Khashin/Givi combat skills partially implemented | Medium | Branch upgrades defined, many skill effects need tuning |

## Tomorrow's Plan (2026-04-17)

1. **Tune Khashin** — balance wind slash / sand skills, test all 3 branches
2. **Tune Givi** — crystal wave mechanics, shardfall/geode/deep seam branches
3. **Tune Huntress** — predator/stalker/warden balance pass
4. **Tune Nightborne** — void blade/phantom/rift balance pass
5. **Full Vael test** — all 3 branches end-to-end, dual-stance flow, bone thralls
6. **Redesign ProfileScene** — achievements visual overhaul, match popup aesthetic
7. **New map + new mobs** — begin design/prototyping for 3rd map

## Ideas / Roadmap

| # | Idea | Category | Status |
|---|------|----------|--------|
| 1 | LoadingScene with progress bar | Performance | ✅ Done |
| 2 | Khashin combat tuning | Gameplay | 🔜 Tomorrow |
| 3 | Givi combat tuning | Gameplay | 🔜 Tomorrow |
| 4 | Generate icons for all heroes | Art | Medium |
| 5 | Meta-progression currency (Forge) | Systems | ✅ Done |
| 6 | Skill levels — upgrades scale with picks | Systems | ✅ Done |
| 7 | 3rd map — dungeon/cave theme | Content | 🔜 Tomorrow (start) |
| 8 | Sound effects + music | Polish | Medium |
| 9 | Mobile touch controls | Platform | Low |
| 10 | Leaderboard (Supabase) | Social | ✅ Done |
| 11 | Minimap enemy dots / boss indicator | UX | ✅ Done |
| 12 | Achievements visual polish | Polish | 🔜 Tomorrow |
| 13 | **Mini-bosses every minute** | Gameplay | High |
| 14 | Notification inbox system | Social | ✅ Done |
| 15 | Hero select popup + stance pre-selection | UX | ✅ Done |
| 16 | Cross-scene visual consistency | Polish | ✅ Done |

## Doc Index

Obsidian reference (`docs/obsidian/`):
- `systems-overview.md` — full systems reference with tables and formulas
- `upgrade-registry.md` — all upgrades with exact effects
- `player-fields.md` — every field on the Player class
- `enemy-registry.md` — enemy stats, scaling, behaviors
- `asset-inventory.md` — asset file inventory

Design docs (`docs/`):
- `icon-generation-prompts.md` — GPT prompts for all skill icons
- `khashin-design.md` — Khashin hero design
- `crystal-muller-design.md` — Givi (Crystal Gnome) hero design
- `necromancer-design.md` — Vael necromancer design
- `nightborne-design.md` — Nightborne hero design
- `game-design-roadmap.md` — feature roadmap
