# Session 2026-04-13 — Balance, Fixes, New Cheats

## Summary
Major balance pass, bug fixes for crashes/freezes, new desktop cheat panel, Bastion bonus picker rebuilt as standalone scene, Ignara Wildfire icons wired up.

---

## Balance

### XP curve rework — [src/entities/Player.ts:1452-1465](src/entities/Player.ts#L1452-L1465), [src/config/GameConfig.ts:27-28](src/config/GameConfig.ts#L27-L28)
- `XP_BASE: 120 → 60`, `XP_PER_LEVEL: 55 → 35`
- Levels 1-5 cheap and linear (60 / 95 / 130 / 165 / 200)
- Levels 6+ quadratic: `baseAt5 + 35*over + 35*over²` — final levels land around 6-7 min of a 10-min run
- Fixes complaint: too many flickering early level-ups, upgrades running out by minute 3-4

### Upgrade picker: 5 cards → 3 cards — [src/systems/UpgradeSystem.ts:1576-1599](src/systems/UpgradeSystem.ts#L1576-L1599)
- `getChoices` now returns **3 upgrade cards** instead of 5
- Composition: 1-2 branch specialization + 1-2 generic (depends on pool)
- Branch pool samples up to 2 (was 3)

### Ultimate unlock logic — [src/systems/UpgradeSystem.ts:1553-1568](src/systems/UpgradeSystem.ts#L1553-L1568)
- Ultimate now unlocks when all regulars are at **level ≥ 1** (was ≥ 2)
- Ultimate's max level capped at `min(regulars' levels)` — i.e. can only be picked/leveled up to the weakest regular
- All regulars at lvl 1 → ult can be taken at lvl 1
- All regulars at lvl 2 → ult can be leveled to 2

### Ignara-specific rebalance
- `Eagle Eye (g3)` excluded from Ignara generic pool — [src/systems/UpgradeSystem.ts:1535-1541](src/systems/UpgradeSystem.ts#L1535-L1541)
- Base range `200 → 230` (+15% permanent) — [src/entities/Player.ts:76](src/entities/Player.ts#L76)
- **Fortress branch nerf** — armor values halved, regen halved:
  - Heat Shield: 15/10/10% → 7/5/5%
  - Pyromaniac: +1/1/2 HP/s → +0.5/0.5/1 HP/s
  - Molten Skin: +10/10% armor → +5/5% armor

### Deep Freeze description fix — [src/systems/UpgradeSystem.ts:308](src/systems/UpgradeSystem.ts#L308)
- Lvl 1 desc: `Shards slow enemies +30%` → `+30% enemy slow, +10% dmg` (explicit)

---

## Bug Fixes

### Knockback not working (all heroes) — [src/entities/BaseEnemy.ts:151-158](src/entities/BaseEnemy.ts#L151-L158)
**Root cause:** `update()` overwrote velocity via `moveTo` every frame, so knockback lasted ~1 frame.
**Fix:**
- Added `applyKnockback(fromX, fromY, force, durationMs)` method on BaseEnemy that sets velocity + `_kbRestoreAt` timer
- `update()` now skips the `moveTo` block entirely while `_kbRestoreAt > 0`
- Converted Ignara fireball, Huntress heavy spear, Khashin gust strike, Amun revive shockwave to use `applyKnockback()`

### Forge: hero purchase not saving — [src/scenes/ForgeScene.ts:351-365](src/scenes/ForgeScene.ts#L351-L365)
**Root cause:** `MetaProgress.unlockHero()` saved a fresh copy with the hero, then `MetaProgress.save(this.meta)` overwrote it with the stale cached object without the hero.
**Fix:** Push hero into `this.meta.unlockedHeroes` directly before single `save()`. Added `purchasing` guard + `zone.disableInteractive()` to prevent double-purchase. Raised Lyra price 300 → 1000.

### Try Again crash — [src/scenes/UIScene.ts:1705](src/scenes/UIScene.ts#L1705)
**Root cause:** `BastionPickScene` (when active at death) wasn't in the stop list. Its infinite pulse tween kept firing on destroyed objects after restart → crash.
**Fix:** Added `sm.stop('BastionPickScene')` to Try Again handler. Added `shutdown()` to BastionPickScene that calls `tweens.killAll()`.

### FPS drop in late game — [src/entities/Player.ts:1120-1123](src/entities/Player.ts#L1120-L1123)
**Root cause:** Nazar split-shade ability spawned infinite `repeat: -1` tweens on per-hit circles. `shade.destroy()` ran but tweens stayed alive in the manager, accumulating hundreds over a run.
**Fix:** Store tween reference, call `stop()` + `remove()` before destroying the shade circle.

### Ignara Wildfire buffs: wrong icons — [src/scenes/UIScene.ts:2572-2607](src/scenes/UIScene.ts#L2572-L2607)
**Root cause:** Flashpoint, Infernal Cadence, Powder Keg, Ember Volley were still pointing at old placeholder frame indices from Havoc/Fortress branches. E.g. Infernal Cadence shared frame 14 with Firestorm Orbs → confusing duplicate icons.
**Fix:** Re-pointed to the new bh1-bh5 slots (100-104). Added short text labels (`5s`, `RDY`, `GO`) for clarity.

### Bastion bonus picker freeze — [src/scenes/BastionPickScene.ts](src/scenes/BastionPickScene.ts) (new file)
**Root cause:** Reusing `LevelUpScene` with `bonusSpecialization: true` ran into Phaser scene re-launch state issues — launches silently failed if the scene was previously stopped in the same session.
**Fix:** Built dedicated `BastionPickScene` — standalone 2-card picker (Fortify + Iron Will; Aura of Might excluded per request). Registered in `main.ts`. Launched via `gs.scene.launch('BastionPickScene', data)` from UIScene quest handler.

### Bastion picker timing — [src/scenes/UIScene.ts:2814-2834](src/scenes/UIScene.ts#L2814-L2834)
Retries every 500ms if `LevelUpScene` is active (normal level-up in progress); launches Bastion picker as soon as the slot is free.

### Cheat Spawn Boss broken — [src/scenes/GameScene.ts:1621-1660](src/scenes/GameScene.ts#L1621-L1660)
- Made `spawnClawsBoss` public with `cheat = false` param
- In cheat mode: skips the 3s game-over delay after boss death, resets `_bossActive` flag so you can respawn the boss repeatedly
- Added texture guard + `_bossActive` flag to prevent double-spawn from cheat + 10-min timer collision
- Clamps spawn position to camera viewport (was `player.x - 400`, could land off-map)

---

## New Features

### Desktop cheat panel — [src/scenes/UIScene.ts:432-522](src/scenes/UIScene.ts#L432-L522)
Toggle with **`** (backtick/tilde) on desktop only. Buttons:
- `Speed ×2` — toggles `time.timeScale = 2` / `physics.world.timeScale = 0.5` on GameScene (time-scrubbing, not just player speed). State stored on `GameScene._cheatSpeedUp` so level-up slow-mo restores the cheat scale after, not default 1.
- `Full HP`
- `+10 Levels` — recursive delayedCall chain that waits for LevelUpScene to close before triggering the next
- `God Mode` — toggle, UIScene update() keeps `p.hp = p.maxHp` while on
- `Kill All`
- `Spawn Boss` — calls `spawnClawsBoss(true)`
- `Level Up` (single)
- `+1000 Gold` (10 orbs × 100)

Docs: [docs/cheat-panel.md](docs/cheat-panel.md)

### Ori test profile — [src/systems/MetaProgress.ts:271-280](src/systems/MetaProgress.ts#L271-L280)
Enter "Ori" as player name → `MetaProgress.load()` force-unlocks all heroes, all Amun branches, marks tutorialComplete, and seeds 10000 gold. For testing without grinding.

### New Bastion Picker Scene — [src/scenes/BastionPickScene.ts](src/scenes/BastionPickScene.ts)
Standalone quest-reward picker. Shows 2 Bastion skills (Fortify + Iron Will). Simple card layout with hover, select animation, flash on pick, auto-resume GameScene.

---

## Visual / UX

### Terrain darker — [src/scenes/GameScene.ts:278-282, 960-962](src/scenes/GameScene.ts#L278-L282)
- Fill: `0x4a7c3f` → `0x305426` (~25% darker)
- Zone 3 tint: `0xccddcc` → `0x8f9f8f`
- Zone 4 tint: `0xbbccbb` → `0x7e8f7e`
- Zones 0-2 now also tinted `0xb1c1b1` (was cleared)
- Better enemy-vs-terrain contrast

### Upgrade card size — [src/scenes/LevelUpScene.ts:32-34](src/scenes/LevelUpScene.ts#L32-L34)
- `CARD_W: 170 → 190`, `CARD_H: 255 → 280`, `GAP: 12 → 14`
- `wordWrap: CARD_W - 16 → CARD_W - 24` (more text padding)
- More breathing room, content not touching edges

### Generic skills now level up — [src/systems/UpgradeSystem.ts](src/systems/UpgradeSystem.ts)
- `pick()` increments generic skill level like branch skills (was one-shot)
- `getChoices` keeps generics in pool until maxed (was filtered after first pick)
- `LevelUpScene.createCard` shows level dots and LVL UP badge for generic cards too
- Added `MAX_TOTAL_SKILLS = 8` cap — new generics only appear while player has <8 distinct skills; already-picked generics can always be leveled up

---

## Icon Work

### Ignara icons imported
- Dropped 15 icons from `~/Downloads/ignara/` (1024×1024 each with 26px border)
- Cropped border, resized to 128×128
- Expanded `skill_icons_sheet.png` from 1280×1280 → 1280×1408 (added row 10 for bh slots)
- Wildfire branch (bh1-bh5) now has its own icons at frames 100-104, no longer borrowing from Havoc/Fortress
- ICON_FRAME_MAP updated accordingly
- SW cache: `v1.0.21 → v1.0.22`

### Remaining icon gaps
Characters still missing dedicated icon sets (using placeholders / generic pixel art):
- Khashin (Gale, Dune, Mirage branches)
- Muller (Shardfall, Geode Shell, Deep Seam)
- Huntress (Predator, Stalker, Warden) — not even in ICON_FRAME_MAP
- Nightborne

Done: Generics, all Ignara branches, Nazar, Sifra, Amun, Vael.

---

## Deployment
- Build: `npm run build` → `dist/assets/index-CgtevTsj.js` (544 kB gzip)
- Deployed to Vercel once early in session (`claws-chi.vercel.app`) — subsequent changes not yet deployed

---

## Known / Pending
- Spritesheet has low-quality placeholders for Khashin/Muller/Huntress/Nightborne branches
- `sifra_run` texture warning in console for non-Sifra heroes (lazy loading — non-blocking)
- Player shadow tween (Player.ts:665) still `repeat: -1` — not a leak per run but should be cleaned up on Player destroy long-term
