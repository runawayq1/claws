# Session 2026-04-14 — Hero Expansion + Balance + Ignara Rework

## Summary
Massive session: Ignara rework, 2 new heroes implemented, full balance pass, icon generation, UI polish.

---

## Ignara — Full Branch Rework

**Old**: Inferno / Rapid Fire / Havoc
**New**: Inferno / Wildfire / Pyre

### Inferno (unchanged mechanics, descriptions expanded)
- Skills: Wide Burn, Inferno Reach, White Fire, **Ashen Veil** (new), Firestorm
- New flavor-rich descriptions (e.g., "Earth remembers\n+3m radius. Ground left burning")
- **Ashen Veil**: on-kill DR stacks (10%/14%/18%, 1-2 stacks) — balanced after agent flagged 75% DR exploit

### Wildfire (ex Rapid Fire — machine gun + burn stacks)
- **Sustained Burn** — hits apply Burn stack (4%/tick, max 5→7), -10% CD per lvl, L3: fully stacked → +20% dmg taken
- **Powder Keg** — every 10/8/6 kills → instant big explosion from hero, L3 shrapnel shards
- **Ember Volley** — kept existing CD stacking
- **Flashpoint** — kept instant shots on kill
- **Infernal Cadence** (ult) — 6/8/10s ×3 attack speed, 18s cooldown
- **Projectile**: `vfx_firebolt` stop-on-contact. No contact = just disappears (no explosion VFX spam)

### Pyre (ex Havoc — tank + aura)
- **Slug Round** — big explosion (60-80px), normal ball projectile, +15% dmg per lvl, L3 pierce
- **Thick Skin** — +5% armor, +0.3 regen per lvl (nerfed from 10%)
- **Immolation** — 70-85px burning aura, 12-20% dmg/s, L3 drops Scorched Earth on aura kills
  - Visual: 4-layer Graphics aura (outer fill, mid ring, inner ring, core) + ember particles pooled
- **Molten Volley** (new) — 3/4/5 slugs in cone, 40% dmg each, burn patches, L3 Scorch debuff (-20% armor)
- **Scorched Bastion** (ult) — +15/10/10 HP, aura radius → 100px, dmg ×1.3, **2% lifesteal** (nerfed from 4%)

### Performance fixes
- Ember trail pooled via `spawnTrailCircle` (was creating 75 circles/sec)
- Rapid Fire contact scan throttled via `exploded` flag
- Lava pool cap: max 6 concurrent
- 2-layer explosion gradient instead of 3, `safeDestroy` fallback for VFX

### UI buff icons added
- Infernal Cadence (active timer + CD sweep)
- Powder Keg (countdown "3" until proc → "READY")
- Ember Volley stacks
- Ashen Veil stacks
- Firestorm orb count
- Phoenix Heart (✦ when available)
- Flashpoint charges

---

## New Heroes Implemented

### Vael (the Pale Doctor) — necromancer
- **File**: `src/entities/heroes/vael.ts` (~793 lines)
- **Stats**: HP 85, spd 130, dmg 22, range 220, CD 800ms, color 0x8866cc
- **Attack**: Soul Bolt — ground spike column + 0.4s root + lifesteal
- **Branches**:
  - **Pale Harvest**: Hollow Touch, Soul Siphon, Wound Memory, Exsanguination (chain), **Sanguine Ascendancy** (ult)
  - **Ossuary**: Risen (bone thrall proc), Grave Pact, Undying Labor, Charnel Tide (mass raise), **Lich Dominion** (permanent Revenant ally)
  - **Wasting Plague**: Festering Wound (Rot stacks), Virulent Spread, Necrotic Bloom, Pandemic (miasma), **Carrion Crown** (passive aura)
- **Spritesheet**: `public/assets/vael/sheet.png` (2720×896, 136×128 frames, 20×7 grid)
- **BaseEnemy**: added `rotStacks` + `rotExpiry` fields

### Nightborne (Void Blade)
- **File**: `src/entities/heroes/nightborne.ts` (~706 lines)
- **Stats**: HP 110, spd 105, dmg 28, range 90, CD 850ms, color 0x9933FF
- **Attack**: Void Slash — 150° melee arc, purple crescent VFX, pierces all in arc
- **Branches**:
  - **Void Blade**: Void Edge, Cleave (wider arc), Void Surge (ring pulse every 4th), Dark Resonance (2-hit detonation), **Void Ascendant** (ult — ×3 speed)
  - **Phantom**: Echo Strike (afterimage slash), Split Shade (decoy), Phantom Veil (damage negate), Mirror Swarm (kill phantoms), **Shade Legion** (4 duplicates)
  - **Rift**: Void Step (blink), Rift Anchor (auto-teleport), Void Zone (kill slow field), Spatial Tear (ranged void burst), **Rift Collapse** (pull + detonate)
- **Spritesheets**: `public/assets/nightborne/{idle,run,attack,hurt,death}.png` (240×240 frames, 9/6/12/5/23 frames)
- **Background**: removed dark blue (8,64,93) from all 5 sheets via PIL with tolerance 12

### Integration done
- HERO_DEFS + SPRITE_HEROES + HeroType union
- 60+ flag properties per hero in Player.ts
- `tryAutoAttack` switch cases (`soulbolt`, `voidslash`)
- `updateVaelPassives` / `updateNightbornePassives` hooks in main update loop
- HERO_BRANCHES, ICON_FRAME_MAP, HeroSelectScene, UIScene display names/colors
- MetaProgress default-unlocked for both
- HeroSelectScene uses real spritesheets (no tinted placeholders)

---

## Balance Audit (6 heroes, math agent analysis)

| Hero | Branch | Status | Action |
|------|--------|--------|--------|
| Sifra Frost | Ice Armor shield 64 absorb/s | **OP** | regen timer 3s→5s ✓ |
| Nazar Shadow | 75% invuln uptime | **OP** | added 1.5s internal CD ✓ |
| Nazar Blade | Assassinate ×2 vs boss = delete | **OP** | ×2 solo / ×1.5 at 2 nearby ✓ |
| Amun Bastion | 70% armor + rebirths = unkillable W13 | **OP** | armor cap 60% ✓ |
| Huntress Predator | 547 DPS + 40% mark | **OP** | mark 30/40% → 25% ✓ |
| Khashin Gale | Kite = unkillable | OK | desc corrected (already capped) |
| Ignara Pyre | Sustained regen + lifesteal | Balanced after nerf | lifesteal 4%→2% ✓ |

---

## Other Fixes

- **Boss HP bar**: redesigned with red 3-layer fill + black vine/horn/rope frame + 10 segment dividers. Initialized on spawn (was empty until first hit).
- **Level-up clear radius**: bosses + mini-bosses now excluded (was one-shotting boss on any level-up)
- **Caesar (decorative cat)**: purple portal with rune arcs when too far. Now lazy — does own thing regardless of player position.
- **Amun shields**: ×2 size + deflect arrows (physics check in `updateAmunPassives`)
- **Archer arrows**: blocked by rocks (physics overlap)
- **Archers' shots**: pre-warm VFX animations in GameScene.create to prevent first-frame stutter

---

## Icon Sheet Expansion

- **Old**: 1280×1280, 10×10 grid (100 frames)
- **New**: 1280×1536, 10×12 grid (120 frames)
- Added 12 Nazar icons (frames 25-39) from `~/Downloads/nazar/`
- Added 15 Vael icons (frames 105-119) from `~/Downloads/necro/`
- All sourced from 1024×1024 DALL-E, cropped 26px padding, resized to 128×128
- `ICON_FRAME_MAP` updated with dedicated Vael frame indices (were placeholder reuses)
- SW cache bumped: v1.0.23 → v1.0.26

---

## Docs Updated

- `docs/DESIGN_DOC.md` — full Ignara branch rewrite (Inferno/Wildfire/Pyre), Vael lore + skills expanded, Ashen Veil + Molten Volley added
- `docs/icon-generation-prompts.md` — 30 new prompts (Vael ph/os/wp 15, Nightborne vb/vp/vr 15)
- `docs/nightborne-design.md` — already existed, 198 lines (complete design)
- `docs/necromancer-design.md` — already existed

---

## Files Touched (Major)

- `src/entities/Player.ts` — 150+ new flags, 2 new HeroTypes, 2 new attackTypes
- `src/entities/heroes/{vael.ts,nightborne.ts}` — new files, 1499 lines combined
- `src/entities/heroes/ignara.ts` — branch rework, new VFX, pooling
- `src/entities/heroes/amun.ts` — shield size + arrow block + trail cleanup
- `src/entities/heroes/nazar.ts` — Vanish CD + Assassinate balance
- `src/entities/heroes/huntress.ts` — Marked Target nerf
- `src/entities/BaseEnemy.ts` — burnStacks, rotExpiry, Scorch (scorchUntil)
- `src/entities/Archer.ts` — rock overlap
- `src/entities/Cat.ts` — portal rework, sequence runner
- `src/systems/UpgradeSystem.ts` — new Ignara branches, VAEL_BRANCHES, NIGHTBORNE_BRANCHES
- `src/systems/MetaProgress.ts` — Vael/Nightborne default unlock
- `src/scenes/GameScene.ts` — branch hooks, level-up boss skip, VFX pre-warm
- `src/scenes/HeroSelectScene.ts` — real spritesheets for new heroes
- `src/scenes/UIScene.ts` — boss bar redesign, all new buff icons
- `public/assets/icons/skill_icons_sheet.png` — extended to 12 rows, 27 new icons
- `public/assets/{vael,nightborne}/` — new spritesheets
- `public/sw.js` — cache bump

---

## Outstanding

- **os1 Risen** icon added (was missing initially)
- **Agent spritesheets for Vael/Nightborne hero select** — using real sheets now
- **No Nightborne icons yet in sheet** — still placeholder reuses of Nazar frames
- **Balance implementation for other recs** — some buffs still pending (Stalker Kill Stride, Mirage Desert Wind, etc.)
