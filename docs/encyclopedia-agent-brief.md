# Encyclopedia Sub-Agent Briefing

## Project Overview
**CLAWS** — Phaser 3.90 survivor game (TypeScript + Vite). pixelArt: true.
Repo: `/Users/squad/Documents/claws/`

## Your Scope
You own **EncyclopediaScene.ts** and encyclopedia-related changes in other files.

---

## Key Files

### Primary (you edit these)
- `/Users/squad/Documents/claws/src/scenes/EncyclopediaScene.ts` — ~710 lines, the main encyclopedia scene
- `/Users/squad/Documents/claws/src/scenes/StartScene.ts` — encyclopedia button lives here (book icon, bottom-right)

### Reference (read-only context)
- `/Users/squad/Documents/claws/src/systems/UpgradeSystem.ts` — exports:
  - `HERO_BRANCHES: Record<string, BranchDef[]>` — all hero skill branches
  - `GENERIC_POOL: Upgrade[]` — shared upgrades
  - `Upgrade { id, label, desc, branch?, hero?, icon? }`
  - `BranchDef { name, color: number, upgrades: Upgrade[] }`
- `/Users/squad/Documents/claws/src/scenes/LevelUpScene.ts` — calls `unlockUpgrade()` and `unlockBranch()` when player picks skills
- `/Users/squad/Documents/claws/src/entities/Player.ts` — hero types: `'ignara' | 'sifra' | 'amun' | 'nazar' | 'huntress'`

---

## Assets (all in `public/assets/book/`)

| File | Type | Details |
|------|------|---------|
| `book_anim.png` | spritesheet | 4x3 grid, 542x542/frame, book open/close animation (frame 0=open, 11=closed). **Trimmed & centered** |
| `Icons.png` | spritesheet | 32x32, skill icons. Key `book_icons` |
| `sells_full.png` | spritesheet | 24x24, slot/cell graphics. Key `book_sells` |
| `bookmarks.png` | spritesheet | 32x28, bookmark tab sprites. Key `book_bookmarks` |
| `pages_apper.png` | image | page texture overlay. Key `book_page` |
| `info_tileset.png` | image | UI frame elements (corners, borders). Key `book_tileset` |
| `Open_book.png` | image | open book static |
| `Close_book.png` | image | same as book_anim spritesheet |
| `Close_book_boolmarks.png` | image | book with bookmark tabs |
| `book_content.png` | image | content area texture |

---

## Architecture of EncyclopediaScene

### localStorage Persistence
- Key: `claws_encyclopedia`
- `EncyclopediaData { heroes: string[], upgrades: string[], branches: string[] }`
- Exported helpers: `loadEncyclopedia()`, `saveEncyclopedia()`, `unlockHero()`, `unlockUpgrade()`, `unlockBranch()`, `isHeroUnlocked()`, etc.
- Heroes unlocked in StartScene on hero select
- Upgrades/branches unlocked in LevelUpScene on skill pick

### Scene Structure
```
create()
  -> dark bg rectangle
  -> bookContent container (holds everything)
     -> shadow, bookBg (spine), leftPageBg, rightPageBg
     -> page texture overlays (book_page)
     -> "HEROES" title + underline
     -> close button (X) -> StartScene
     -> 5 bookmark tabs (book_bookmarks) on left edge
     -> leftContainer (hero list)
     -> rightContainer (content pages)
```

### Left Page — Hero List
`buildLeftPage(px, py, pw, ph)`
- 5 heroes always visible and clickable
- Color circle + name + role
- Checkmark if played
- "Discovered: X/Y" footer

### Right Page — 3 Tabs
`buildRightPage()` dispatches to:
1. **Lore** (`buildLorePage`) — hero name, role, lore text, playstyle, branch overview with names
2. **Branches** (`buildSkillsPage`) — 3 big bookmark-style tabs in horizontal row, selected branch shows skill list below
3. **Generics** (`buildGenericsPage`) — shared upgrades list

### Branch Skills Tab Details
- `selectedBranchIdx` tracks active tab
- Tabs: rounded rect bookmark shape, icon from `book_icons`, branch name
- Skills below: icon (16x16) + label + description (or "???" if locked)
- `iconBaseMap` maps hero -> starting icon frame index

### Rebuild Pattern
`_rebuild()` recalculates layout and calls `buildLeftPage` + `buildRightPage`
- Both containers do `removeAll(true)` before rebuilding
- Bookmark tab positions updated based on selectedHeroType

---

## Heroes

| type | name | role | color |
|------|------|------|-------|
| ignara | Ignara | Fire Mage | 0xe84118 |
| sifra | Sifra | Ice Mage | 0x82ccdd |
| amun | Amun | Guardian | 0xfff200 |
| nazar | Nazar | Samurai | 0xc23616 |
| huntress | Lyra | Spear Thrower | 0x2ecc71 |

Each has `lore` and `playstyle` text in `HERO_INFO` array.

---

## StartScene Book Icon
- Bottom-right, pentagonal shield frame (procedural graphics)
- `book_anim` frame 11 (closed book), display size 90px (64px compact)
- Desktop: hover plays `book_open` anim (stays open), pointerout plays `book_close`; click goes straight to EncyclopediaScene
- Mobile: tap plays `book_open` then transitions on animationcomplete

---

## Rules for This Agent

1. **Always `npx tsc --noEmit` after changes** — zero errors required
2. **Never add offset hacks** for sprite positioning — trim the asset instead
3. **Use model:"sonnet"** — this agent always runs as sonnet
4. **Don't deploy** — main conversation handles deployment
5. **Keep the book UI pixel-art style** — monospace font, parchment colors (0xc8a97a, 0xd4b483, 0x2a1810)
6. **Phaser patterns**: use `this.add.graphics()` for shapes, containers for grouping, zones for hit areas
7. **Report back concisely** — what changed, which files, line counts
