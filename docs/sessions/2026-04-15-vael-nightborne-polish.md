# Session 2026-04-15 — Vael Dual-Stance + Nightborne + UI Refine

## TL;DR
Heavy day: Vael converted to dual-stance hero (Orbs/Drain), full skill redesign with dual-stance effects, UI block rework, Nightborne polish, icons sheet expansion. Plan for tomorrow at the bottom.

---

## What was done

### Vael — major rework
- **Dual stance**: `orbs` (Soul Bolt) / `drain` (auto green tendrils)
  - `orbsEnergy` / `drainEnergy` Sifra-style energy bars, 100 max, regen 25/s inactive
  - Orbs drains per shot, auto-switches when empty
  - Drain drains per second, auto-switches on empty
  - `toggleVaelStance()` + Q key + mobile button
- **Soul Siphon rework**: bones DROP on ground (10/20/30% chance), stationary. Player walks over → +1 armor stack. Cap 8/14/25. Each stack = +1% DR in `takeDamage`. Buff icon with stack count.
- **Drain aura VFX**:
  - Persistent 2 rings (outer + inner)
  - Rotating ring of 12 green glyphs between rings (6 types: bar, triangle, dot, cross, circle, zigzag)
  - Jagged green "lightning" bolts from enemies → player body center
  - 3-layer bolts (core stroke + mid + glow dots)
  - Radius now **scales with splashRadius + exsangRangeBonus** (dynamic)
  - Tick 300ms, 18% dmg + 8% lifesteal
- **Bone Thrall sprites**: real undead sprites (walk + attack anims, 56×48, 20 frames each) from Undead Sprite Pack. Stop-and-attack logic, flipX by direction.
- **Vael spritesheet layout fixed**: frame width was 136 (wrong) → 160 (correct, 17 col grid). 8 idle frames, 8 run, 17 attack etc.
- **Attack anim uses row 2 cast** (star burst visible) instead of row 4 silent swing.
- **Hitbox / visuals**: scale 1.6, body 24×40, character raised 10% in frame.
- **Balance buffs**: CD 800→700ms, base Soul Bolt splash 35px/35% (no upgrade needed)

### Vael — skill rewrite (lore agent)
Written and stored in `docs/DESIGN_DOC.md`. 15 skills now follow these rules:
- **Format**: each desc string uses `◉ Orbs:` / `✦ Drain:` glyphs to let UI color-highlight stance lines.
- **Distribution**: ~67% dual-stance, ~20% single-stance, ~13% neutral (pure stats).
- **Balance fixes applied** (from balance review):
  1. ph3 Wound Memory L3: rooted bonus only applies to enemies hit by Soul Bolt within last 3s, +20% (not +40%)
  2. ph5 Sanguine Ascendancy L3: Drain heal capped at 25 HP total per tick
  3. wp3 Necrotic Bloom L3: removed "Pools apply Rot/s" loop, cap 4 active pools
  4. ph4 Exsanguination L2: +10% tendril tick damage
  5. os2 Grave Pact L1: +1 flat drain dmg per thrall

### Nightborne
- HeroSelectScene uses real spritesheets (240×240 frames, 5 anim files)
- Dark blue bg `(8,64,93)` removed from all sheets via PIL tolerance
- Hitbox +30% (33→43 width, 46→60 height)
- Speed 105→150 (matching Sifra)
- Frame offsets adjusted
- Rift branch (vr*) icons remapped from Amun Wrath (55-59) to Sifra Lightning (50-54) — closer visual theme, won't conflict. Still placeholder — needs dedicated void art.

### Icon sheet
- Extended from 1280×1280 → 1280×1536 (10 rows → 12 rows, 120 frames)
- Pasted 12 Nazar icons (nb/nv/ns 1-5) from `~/Downloads/nazar/` at frames 25-39
- Pasted 15 Vael icons (ph/os/wp 1-5) at frames 105-119
- Pasted 15 Ignara icons (if/bh/ih 1-5) — re-pasted after corruption fix
- Copied frames 100-104 (Wildfire `bh*`) to 15-19 (io slots) so they render correctly
- Frame cell dimension FIXED: was buggy at 128×140, corrected to 128×128
- SW bump v1.0.23 → v1.0.29

### UI refinement (main bottom block)
- **Layout** (top→bottom): Mastery diamonds → Energy bars → HP bar (was HP → Energy)
- **Pip row**: replaced stars with 4px **diamonds** (rotated squares)
- **HP bar**: 24→22px, full rounded (pill), inner highlight strip, softer border
- **Energy bars**: 12→5px (much thinner), rounded, active stance 0.8 opacity + glow, inactive dim 0.55
- Block raised **+24px** on desktop (bottom margin 12→36), mobile unchanged
- `_drawStar` helper removed

### Boss HP bar
- Full redesign: red 3-layer gradient fill + black frame with vines/horns/ropes + 10 segment dividers
- HP bar now initializes on spawn (was empty until first hit)

### Misc fixes
- Vanish (Nazar Shadow) — 1.5s internal CD to prevent 75% uptime abuse
- TestScene: Vael + Nightborne added, preloads for both, hitbox rectangles visible
- StartScene: dev T key to open TestScene
- HeroSelectScene: hover scale regression fixed (was scale hop on first hover)
- `enemy-died` clear radius now skips bosses/mini-bosses (was instakilling boss on level up)
- Amun shields ×2 size + deflect arrows; Archer arrows blocked by rocks
- Decorative cat "Caesar" rework: purple portal with rune arcs, rotating glyph ring, sequence runner for varied idle animations

---

## Known issues / dead mechanics (from tester audit)

### Vael
- `ph5 L3 sanguineDR` — flag set but `Player.takeDamage` doesn't read it (dead)
- `wp4 L3 pandemicZone` — state set but never read (dead)
- `wp5 carrionWeaken` — sets `dmgReduction` on enemies but `BaseEnemy.takeDamage` doesn't consume it (dead)
- `os5 L3 lichRevenantCharnelOnDeath` — stub comment, no handler (dead)
- `ph2 soulSiphonFast/AutoCollect` — obsolete since orb rework, flags unused
- Soul Siphon dual-stance effects NOT YET IMPLEMENTED (only orbs stance drops bones; drain stance drop trigger missing)

### Nightborne
- All 15 skills working mechanically
- `vr4 L3` soft-depends on `vr3 Void Zone` (design dependency, not a bug)
- No dedicated icons — all reuse Nazar/Sifra placeholder frames

### Balance
- Vael Wound Memory L3 + Undying Labor L3 combo was ~230 DPS (5× Ignara) — design doc fixed but code needs apply function updates
- Necrotic Bloom L3 self-sustaining pool loop — design doc fixed, code needs update

---

## State of code vs design doc

The design doc (`docs/DESIGN_DOC.md`) now has the REVISED Vael skills with dual-stance desc format and balance fixes.

**UpgradeSystem.ts still has the OLD Vael skills** — they need to be replaced with the new design.

Old code: 15 skills, single-stance effects, has balance issues.
New doc: 15 skills with `◉ Orbs:` / `✦ Drain:` format, balance fixes applied.

**Phase 1 of tomorrow** = transcribe design doc → UpgradeSystem.ts.

---

## Plan for tomorrow (2026-04-16)

### Priority 1 — Finish Vael
1. **Transcribe new skills** from design doc → `UpgradeSystem.ts` VAEL_BRANCHES
2. **Implement new flags** in Player.ts for each skill (add missing, remove dead)
3. **Wire mechanics** in `vael.ts`:
   - Dual-stance Soul Siphon (drain-kill bone drops)
   - Drain tendril burn stacks, wp1 drain ticks
   - Grave Pact drain bonus damage per thrall
   - Exsanguination L2 drain dmg buff
   - Sanguine Ascendancy heal cap
   - Necrotic Bloom pool cap
4. **Update LevelUpScene** to parse `◉` / `✦` glyphs and color-highlight desc lines (blue/green)
5. **Fix dead mechanics**: sanguineDR, pandemicZone, carrionWeaken, lichRevenantCharnelOnDeath

### Priority 2 — Polish other heroes
6. **Nightborne** — test void arc visuals, verify Dark Resonance triggers, tune Shade Legion invuln
7. **Huntress (Lyra)** — tune Predator Marked Target after nerf, check Stalker kill stride, rebalance Warden knockback
8. **Khashin start** — review Gale knockback cap, Mirage Phantom Step CD, Dune Sand Armor numbers
9. **Ignara Pyre** — verify Ashen Veil + Thick Skin still balanced after nerfs

### Priority 3 — Testing
10. **Boss fight test** — full CLAWS boss encounter. Check:
    - Boss HP bar new visual
    - Phase transitions
    - Level-up no longer kills boss
    - Dying mid-boss
    - Victory screen
11. **Profile all heroes** — 10-min solo runs per hero, balance + fun check

### Priority 4 — New content
12. **Second map** — start design. Ideas:
    - Frozen north / ice cavern (Sifra-themed)
    - Underground catacombs (Vael-themed, bone tiles + crypts)
    - Volcanic / lava zone (Ignara-themed)
    - Desert with ruins (Amun/Khashin-themed, already partially done)
13. **ChunkManager zone tables** — add second map's zones
14. **Assets inventory** — list needed terrain tiles, props, decorations
15. **Integration plan** — map select on StartScene, or unlock condition

---

## Files touched this session

### Core gameplay
- `src/entities/Player.ts` — Vael stance fields, toggleVaelStance, energy drain, body offsets
- `src/entities/heroes/vael.ts` — Soul Siphon rework, drain aura with glyphs, thrall sprites, radius scaling
- `src/entities/heroes/nightborne.ts` — no changes (was already implemented)
- `src/entities/BaseEnemy.ts` — rotStacks field already in place
- `src/entities/Archer.ts` — rock collision (from earlier session)
- `src/systems/UpgradeSystem.ts` — Vael soul siphon rework (partial), Nightborne vr* frame remap
- `src/systems/MetaProgress.ts` — Vael default-unlock

### Scenes
- `src/scenes/UIScene.ts` — HP/energy block redesign, stance button wiring, buff icons (soul stacks, Vanish CD, Firestorm orbs, Powder Keg, etc.)
- `src/scenes/HeroSelectScene.ts` — real spritesheets, frameStart prop, Vael positioning
- `src/scenes/GameScene.ts` — vael asset preload, thrall sheets preload, VFX pre-warm
- `src/scenes/TestScene.ts` — Vael + Nightborne added with hitboxes
- `src/scenes/StartScene.ts` — DEV T key

### Assets
- `public/assets/vael/sheet.png` — Necromancer sheet (2720×896)
- `public/assets/nightborne/{idle,run,attack,hurt,death}.png` — 240×240 per-anim sheets, bg removed
- `public/assets/thrall/{walk,attack}.png` — Undead Sprite Pack sheets
- `public/assets/icons/skill_icons_sheet.png` — extended 1280×1536, 27 new icons (Nazar + Vael + Ignara re-paste)
- `public/sw.js` — cache v1.0.29

### Docs
- `docs/DESIGN_DOC.md` — Vael dual-stance rewrite, Ignara branch rework, Vael lore
- `docs/icon-generation-prompts.md` — Vael 15 + Nightborne 15 prompts added
- `docs/sessions/2026-04-14-hero-expansion.md` — prior session log
- `docs/sessions/2026-04-15-vael-nightborne-polish.md` — this file

---

## Open questions for tomorrow

1. Should LevelUpScene render `◉`/`✦` glyphs inline or convert to per-line colored backgrounds?
2. Do we implement Vael dead-mechanic fixes (sanguineDR, pandemicZone etc.) before or after transcribing new skills?
3. Second map — frozen or catacombs first? Depends on asset availability.
4. Boss fight: should dying mid-fight allow respawn from checkpoint, or full game over?
5. Worktree or main branch for Vael transcription? (New skills = ~400 lines in UpgradeSystem)
