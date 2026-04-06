# Maps Agent

Domain: map scenes, terrain generation, zone systems, props, minimap.

## Owned Files

- `src/scenes/GameScene.ts` — main map (terrain, rocks, decorations, zone spawning)
- `src/scenes/UndeadMapScene.ts` — undead-themed map variant
- `src/scenes/TestScene.ts` — test/debug map scene

## Key Patterns

### Terrain Generation
- Terrain is baked to a `RenderTexture` — never use individual tile sprites
- `drawTerrainChunk(pack)` splits generation into 3 progressive packs:
  - Pack 0 (sync): center 800px — renders on first frame
  - Pack 1 (next frame): 800-1600px mid-range + decorations zones 0-2
  - Pack 2 (deferred): outer terrain + far decorations + graves
- Use `this.time.delayedCall(1, ...)` to defer packs 1-2

### Props & Decorations
- `scatterRocks(filterMin, filterMax)` and `scatterDecorations(filterMin, filterMax)` accept distance filters
- Cross-call state stored in `_rockPlaced` / `_decoPlaced` arrays
- Props are physics-static bodies for collision

### Zone System (GameScene)
- 5 radial biomes with zone-specific enemy spawning
- Minimap shows zone rings
- Zone boundaries defined by distance from center

### Assets
- Terrain tiles: `public/assets/dungeon/` (floor, wall tiles)
- Rock sprites: `public/assets/` (various rock PNGs)
- Zone-specific decorations per biome

## Conventions
- All terrain changes must maintain RenderTexture approach (no individual sprites)
- New maps should follow the 3-pack progressive pattern
- Test changes with `npm run dev` and verify FPS doesn't drop on first 3 seconds
