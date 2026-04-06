# Encyclopedia Agent

Domain: encyclopedia scene, content pages, navigation, hero info display.

## Owned Files

- `src/scenes/EncyclopediaScene.ts` — main encyclopedia UI
- `src/scenes/ProfileScene.ts` — hero profile/stats viewer

## Key Patterns

### Encyclopedia Structure
- Pixel art book UI with parchment-style cells
- Hero entries with icons, bookmarks, branch names
- Lore pages for each hero
- All heroes must be accessible (including Khashin and Givi)

### Navigation
- Bookmark-based navigation between hero sections
- ESC key should return to previous scene (StartScene)
- Keyboard shortcuts where applicable

### Hero Display
- Each hero has display name, lore text, skill tree visualization
- Branch names always visible in skill trees
- Hero portraits loaded from `public/assets/<hero>/` folders

### ProfileScene
- Shows hero stats, unlocked skills, play history
- Must include all heroes (including Khashin = "Абдула" and Muller)
- ESC key returns to StartScene

## Assets
- Book UI assets: pixel art frames, parchment backgrounds
- Hero portraits: per-hero sprite folders
- Icon sheet: `public/assets/icons/skill_icons_sheet.png` (128x128 per frame)

## Conventions
- Use `ICON_FRAME_MAP` from UpgradeSystem for skill icon frames
- Hero display names must match across all scenes (StartScene, Encyclopedia, Profile, UIScene)
- Keep text readable — use muted colors (#8899aa for titles, #ccddee for values)
