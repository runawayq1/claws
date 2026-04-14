# Spritesheet Analysis — New Assets

## Archer Mob (`~/Downloads/Final 2/`)
**Frame size**: 64x64  
**Source files**: individual PNGs per animation  
**Target**: `public/assets/archer/` (need combined spritesheet or load individually)

| Animation | File | Dimensions | Frames | Notes |
|---|---|---|---|---|
| Idle | Idle and running.png | 512x128 | 2 (row 0) | Row 0 = idle, Row 1 = run |
| Run | Idle and running.png | 512x128 | 8 (row 1) | 8-frame run cycle |
| Normal Attack | Normal Attack.png | 512x256 | 11 + 8 loop | Bow draw + release, loop variant |
| High Attack | High Attack.png | 512x384 | 13 + 8 loop | Upward bow shot |
| Low Attack | Low attack.png | 512x512 | 6 duck + 14 atk + 8 loop | Crouching shot |
| Dash | Dash.png | 512x256 | 7 + 3 loop | Quick movement dash |
| Jump | Jumping.png | 512x128 | 10 | Jump arc |
| Death | death.png | 512x192 | 10 | Fall-down death |

**For mob use** (minimum needed): Idle (2f), Run (8f), Normal Attack (11f), Death (10f)
**Character**: Green-cloaked archer goblin/orc — ranged enemy, shoots arrows

---

## Necromancer Hero (`~/Downloads/Necromancer_creativekind-Sheet.png`)
**Frame size**: 160x128  
**Sheet size**: 2720x896 (17 columns x 7 rows)  
**Target**: `public/assets/necromancer/` (slice into individual anim PNGs)

| Row | Animation | Frames | Description |
|---|---|---|---|
| 0 | Idle | 8 | Standing with glowing red orb/staff |
| 1 | Run | 8 | Moving with staff |
| 2 | Attack1 | ~14 | Staff cast — red star burst / explosion VFX |
| 3 | Attack2 | ~9 | Different cast — holding red energy projectile |
| 4 | Special | ~18 | Long summoning animation with effects |
| 5 | Hit | ~4 | Take damage reaction |
| 6 | Death | ~8 | Dissolving / fading away particles |

**Character**: Dark-robed necromancer with red glowing staff orb. Two distinct attack anims support dual-stance design.

---

## Nightborne Hero (`~/Downloads/NightBorne/`)
**Frame size**: 80x80  
**Sheet size**: 1840x400 (23 columns x 5 rows)  
**GIF reference size**: 240x240 (3x scale of sprite frame)  
**Target**: `public/assets/nightborne/` (slice into individual anim PNGs)

| Row | Animation | Frames | Description |
|---|---|---|---|
| 0 | Idle | 9 | Standing, subtle purple glow |
| 1 | Run | 6 | Fast dash movement |
| 2 | Attack | ~12 | Sword slash with purple crescent arc VFX |
| 3 | Hurt | ~4 | Hit reaction + extra frames |
| 4 | Death | ~12+ | Dissolving into purple energy explosion/particles |

**Character**: Dark assassin/warrior with purple energy blade. Purple crescent slash effect on attack. Death has dramatic purple explosion VFX.

---

## Integration Notes

### Priority: Archer Mob
- Simplest — just a new enemy entity extending BaseEnemy
- Use Idle+Run+Attack+Death only (4 spritesheets)
- Ranged AI: stop at distance, fire arrow projectile, move to keep range
- New enemy type for WaveManager rotation

### Heroes: Necromancer & Nightborne
- Need individual animation PNGs sliced from spritesheets
- Follow existing hero folder structure: `public/assets/<name>/Idle.png`, `Run.png`, etc.
- Each needs: hero .ts file, UpgradeSystem entries, ICON_FRAME_MAP entries, HERO_DEFS entry
- MetaProgress unlock conditions TBD
