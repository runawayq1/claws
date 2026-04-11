# Session: Font & UI Cleanup — 2026-04-11

## What changed

### New files
- `src/utils/textStyles.ts` — centralized font sizes, colors, style presets, shadow helper

### Modified: `src/utils/device.ts`
- `gameFont()` now returns system font (SF Pro / Apple UI stack) on ALL platforms
- Removed monospace fallback for desktop

### Modified: `src/scenes/LevelUpScene.ts`
- Removed all `stroke`/`strokeThickness` from text styles
- Replaced with soft `setShadow()` on titles/headers only
- Description text: no stroke, no shadow (clean body text)
- Branch cards: same treatment

### Modified by agent (bulk pass):
- **UIScene.ts** — all strokes removed, shadow on key HUD elements only
- **StartScene.ts** — strokes removed, shadow on title
- **HeroSelectScene.ts** — strokes removed
- **LobbyScene.ts** — strokes removed, mobile font sizes bumped (8→11, 9→12, 10→13)
- **ForgeScene.ts** — strokes removed
- **ProfileScene.ts** — strokes removed
- **LeaderboardScene.ts** — strokes removed
- **NameInputScene.ts** — strokes removed
- **LoadingScene.ts** — strokes removed
- **GameScene.ts** — added missing `fontFamily: gameFont()` to nameplates, strokes removed
- **BossTestScene.ts** — strokes removed
- **TestScene.ts** — strokes removed
- **SwordsTestScene.ts** — strokes removed
- **NetworkGameAdapter.ts** — strokes removed
- **XPSystem.ts** — strokes removed

### NOT touched
- `EncyclopediaScene.ts` — has parchment-themed gold strokes, intentional style

## Style guide going forward

Use `src/utils/textStyles.ts` for new text:
```ts
import { titleStyle, bodyStyle, applyShadow } from '../utils/textStyles'

const txt = this.add.text(x, y, 'TITLE', titleStyle()).setOrigin(0.5)
applyShadow(txt)

this.add.text(x, y, 'description', bodyStyle('#ddd', 200)).setOrigin(0.5)
```

## Notes
- Next time: prototype style in 1 scene first, confirm look, THEN apply everywhere
- Minimum mobile font: 11px (nothing smaller)
