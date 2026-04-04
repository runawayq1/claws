# Map/Scene Sub-Agent Briefing

## Project Overview
**CLAWS** — Phaser 3.90 top-down survivor game (TypeScript + Vite). `pixelArt: true`.
Repo: `/Users/squad/Documents/claws/`

## Your Scope
You own **map generation, terrain, decorations, biomes, and zone systems**. You write full code.

---

## Key Files

### Primary (you edit these)
- `/Users/squad/Documents/claws/src/scenes/GameScene.ts` — `drawTerrain()`, `scatterDecorations()`, `scatterRocks()`, `getZone()`, asset loading in `preload()`
- `/Users/squad/Documents/claws/src/config/GameConfig.ts` — world size, tile size, terrain colors

### Reference (read-only context)
- `/Users/squad/Documents/claws/src/entities/Player.ts` — player spawn at world center
- `/Users/squad/Documents/claws/src/systems/WaveManager.ts` — wave/spawn system, uses `getZone()`

---

## Current Map System

### World
- 3000x3000px world, player spawns at center (1500, 1500)
- TILE_SIZE = 64, tiles drawn at scale 2 (32px source → 64px display)

### Zones (radial from center)
```
Zone 0 — Crossroads: 0-600px (stone roads, grass, minimal decor)
Zone 1 — Meadow: 600-1200px (grass, trees, tufts)
Zone 2 — Ruins: 1200-1800px (30% stone patches, grey-tinted trees)
Zone 3 — Dark Forest: 1800-2400px (dark-tinted grass, many trees)
Zone 4 — Wastes: 2400px+ (80% stone, sparse tufts)
```

### Terrain (drawTerrain)
- `terrain_grass` spritesheet (TX Tileset Grass.png, 32x32 frames)
- `terrain_stone` spritesheet (TX Tileset Stone Ground.png, 32x32 frames)
- Stone roads in zones 0-1 using cross pattern
- Deterministic RNG: `sin(x * 127.1 + y * 311.7 + salt * 42)`

### Decorations (scatterDecorations)
- Trees: `deco_tree1`, `deco_tree2`, `deco_tree3` (terrain/)
- Grass: `prop_grass_tuft1`, `prop_grass_tuft3` (props/)
- Radial placement with MIN_DIST=110 collision check
- Zone-based tinting (0x889988 for dark, 0xbbaa99 for wastes)

### Rocks (scatterRocks)
- Physics static group for collision obstacles
- Generated procedural textures (generateGraveTextures)

---

## Available Undead Asset Pack

Location: `/Users/squad/Downloads/craftpix-net-695666-free-undead-tileset-top-down-pixel-art/PNG/`

### Tilesets (spritesheets)
| File | Size | Content |
|------|------|---------|
| `Ground_rocks.png` | 496x592 | Ground/cliff terrain tiles, dark stone variants |
| `Water_coasts.png` | 1056x256 | Water edge tiles, rocks, puddles, 4 rows |
| `Details.png` | 576x176 | Small details: thorns, cracks, pebbles, dead small trees |
| `water_detilazation.png` | 688x576 | Water surface detail animations |

### Objects Combined
| File | Size | Content |
|------|------|---------|
| `Objects.png` | 768x704 | ALL objects on one sheet: lich statues, skull doors, ruins, graves, crystals, dead trees, broken trees, bones, rocks, thorn plants, dead arms, pile of skulls |

### Animations (spritesheets)
| File | Size | Content |
|------|------|---------|
| `Animation1.png` | 592x384 | Large dead tree — animated (wind sway) |
| `Animation2.png` | 480x288 | Broken tree animation |
| `Animation3.png` | 384x192 | Crystal glow animation |
| `Animation4.png` | 480x336 | Thorn plant animation |
| `Animation5.png` | 576x336 | Another plant animation |
| `Animation6.png` | 288x240 | Small detail animation |

### Separate Objects (240 PNGs)
Location: `Objects_separately/`
Each object has 3 shadow variants: `_shadow1_N`, `_shadow2_N`, `_shadow3_N`

Categories:
- **Bones** (18 variants) — scattered bone piles
- **Graves** (17 variants) — tombstones, crosses, burial mounds
- **Ruins** (5 variants) — broken walls, arches, pillars
- **Dead_tree** (3 variants) — large dead trees
- **Broken_tree** (7 variants) — fallen/broken trees
- **Crystal** (4 variants) — dark glowing crystals
- **Dead_arm** (4 variants) — zombie arms from ground
- **Lich** (1 variant) — lich statue
- **Scull_door** (1 variant) — skull gate
- **Pile_sculls** (1 variant) — skull pile
- **Plant** (5 variants) — withered plants
- **Thorn_plant** (6 variants) — thorny vines
- **Rock** (5 variants) — dark rocks
- **Tree** (3 variants) — smaller dead trees

Use `_shadow1_` variants (consistent light direction).

---

## Rules
1. **`npx tsc --noEmit` must pass** — zero TS errors
2. **Never add offset hacks** — trim assets if misaligned
3. **Copy needed assets** to `public/assets/` before loading them
4. **Don't break existing code** — the current map must still work. Add the undead map as a new option or extend zones 3-4
5. **Phaser patterns**: `this.add.image()` for static props, `this.add.sprite()` for animated, `.setScale()` for sizing, `.setTint()` for color
6. **Performance**: don't load 240 separate PNGs — use the combined `Objects.png` spritesheet with `setCrop()`, or pick only the best 15-20 separate objects
7. **Report concisely** — what changed, which files, what it looks like

---

## Pixel Art Notes
- All images use nearest-neighbor scaling (pixelArt: true in Phaser config)
- Source tiles are 32x32, displayed at 2x scale = 64px
- Separate object PNGs vary in size (48x48 to 128x128), scale them to fit the 64px tile grid
