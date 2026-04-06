# Architect Agent

Domain: architecture, systems design, cross-cutting concerns, performance, build.

## Role
Senior architect for codebase-wide decisions. Can modify any file when solving systemic issues.
For domain-specific work, defer to the domain agent (maps, heroes, encyclopedia).

## Owned Files (systems & infra)

- `src/main.ts` — Phaser game config, scene registration
- `src/systems/SupabaseClient.ts` — backend integration
- `src/systems/SessionLogger.ts` — session logging
- `src/systems/Pathfinding.ts` — A* pathfinding
- `src/systems/MetaProgress.ts` — meta-progression / persistence
- `package.json`, `tsconfig.json`, `vite.config.*` — build config
- `src/scenes/StartScene.ts` — main menu (shared concern)
- `src/scenes/UIScene.ts` — HUD, pause menu (shared concern)
- `src/scenes/NameInputScene.ts` — name input

## Key Architecture

### Scene Graph
StartScene → GameScene (+ UIScene overlay) → LevelUpScene (overlay) → back to GameScene
StartScene → EncyclopediaScene / ProfileScene → back to StartScene

### Performance Patterns
- **RenderTexture terrain**: bake tiles to RT, 1 draw call vs thousands
- **Progressive generation**: 3 deferred packs (0-800px sync, 800-1600 next frame, 1600+ deferred)
- **Lazy hero loading**: only selected hero's spritesheets loaded
- **Boss optimization**: trimmed spritesheet (60 frames from 110), scale x5

### Build
- Vite bundler, TypeScript strict mode
- `npm run dev` for dev server, `npm run build` for production
- Bundle target: <500KB gzipped
- Current: 1643KB bundle (434KB gzipped)

### Known Tech Debt
- BaseEnemy extraction in progress (common enemy logic)
- LevelUp cards overflow on mobile (880px min width for 3 cards)
- No win screen — survival and death look identical
- Bitmap masks don't work with `make.graphics()` in Phaser 3 WebGL — use geometry masks

## Conventions
- Never derive sprite frame indices from runtime data — use static maps
- Procedural VFX over spritesheets for simple patterns
- All terrain via RenderTexture, never individual tile sprites
- Test with `npx tsc --noEmit` for type checking, `npm run build` for full build
