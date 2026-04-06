# Hero Extraction Refactor — Session State

## What was done

### 1. Hero module files created (all 7 heroes)
Each file in `src/entities/heroes/` contains extracted attack methods and update logic from Player.ts:

| File | Size | Functions |
|---|---|---|
| `ignara.ts` | 7.8KB | `attackFireball`, `updateLavaTrail` |
| `sifra.ts` | 23.9KB | `attackIceShard`, `spawnShatterShards`, `attackLightning`, `updateSifraEnergy`, `updateSifraPassives` |
| `amun.ts` | 18.7KB | `attackShockwave` (+ local `boulderExplode`), `updateAmunPassives` |
| `nazar.ts` | 26.9KB | `attackMelee`, `attackDash`, `attackPoison`, `spawnPoisonCloud`, `updateNazarEnergy`, `updatePhantomTrail` |
| `huntress.ts` | 17KB | `attackHuntressMelee`, `attackSpear`, `updateHuntressEnergy`, `updateHuntressPassives` |
| `khashin.ts` | 12.2KB | `attackWindSlash`, `spawnDustDevil`, `updateKhashinPassives` |
| `muller.ts` | 19KB | `spawnCrystalSpike`, `spawnCrystalShard`, `attackCrystalWave`, `crystalRingBurst`, `attackCrystalEruption`, `updateMullerPassives` |

**Pattern used:** every function takes `p: Player` as first arg instead of `this`. All `this.xxx` replaced with `p.xxx`. Some agents used `const pp = p as any` for private member access, others access private members directly (causing TS errors — see "What remains").

### 2. Player.ts refactored (4582 ��� 1701 lines, -63%)
- Added imports: `import * as ignara/sifra/amun/nazar/huntress/khashin/muller from './heroes/...'`
- All attack method bodies replaced with one-line forwarding calls (e.g., `nazar.attackMelee(this, enemies)`)
- All hero-specific update blocks in `update()` replaced with forwarding calls:
  - Energy regen: `sifra.updateSifraEnergy(this, delta)`, `nazar.updateNazarEnergy(this, delta)`, `huntress.updateHuntressEnergy(this, delta)`
  - Passives: `huntress.updateHuntressPassives(this, delta)`, `amun.updateAmunPassives(this, delta)`, `sifra.updateSifraPassives(this, delta)`, `khashin.updateKhashinPassives(this, delta, moving)`, `muller.updateMullerPassives(this, delta)`
  - Movement-based: `ignara.updateLavaTrail(this, delta)`, `nazar.updatePhantomTrail(this, delta, moving)`
- Shared code preserved: shadow, HP regen, shield timer, speed buff, poison tick, buff aura, movement (WASD/joystick/touch), animation state

### 3. Dead code removed
- `attackFlamethrower` (~98 lines) + its fields (`flameSprite`, `flameActive`, `flameAngle`) — never called
- Duplicate `vfx_spark_elec` texture generation block in GameScene.ts (unreachable second block)
- Dead `getRandomUpgrades` export in UpgradeSystem.ts

### 4. Encyclopedia fix
- Givi playstyle description updated — removed outdated "Switch to Eruption with Q" mention, now says "With Tectonic Fury, every 5th slam..."

## What remains (INCOMPLETE)

### A. Private → public member visibility (BLOCKING)
TypeScript compilation fails because hero module files access private Player members. Need to change `private` to `public` for these properties in Player.ts:

Run this to get the full list:
```bash
npx tsc --noEmit 2>&1 | grep "Property '" | sed "s/.*Property '//" | sed "s/' is.*//" | sort -u
```

Known private fields that hero modules need:
- `isAttacking`, `heroDef`, `hasSprite`, `currentAnim`
- `lavaTrailTimer`, `phantomTrailTimer`, `frostNovaCounter`
- `blizzardAuraGfx`, `ballLightningGfx`, `lightningGfx`, `lightningSprite`, `lightningAngle`, `lightningSparkTimer`
- `energyRegenRate`, `energyDrainRate`, `energyDrainPerShot`
- `dustDevilCounter`, `stormLordTimer`
- `leapCooldown`, `caltropTimer`, `spearWallGfx`, `spearWallAngle`
- `defenseAuraGfx`, `passiveAuraGfx`, `dmgAuraGfx`, `dmgAuraLastPulse`, `dmgAuraCooldown`
- `gravityWellTimer`
- `motherLodeTimer`, `tectonicCounter`

**Fix:** In Player.ts, change `private` keyword to `public` (or just remove `private`) for all listed properties. Some agents used `const pp = p as any` workaround — those files (amun.ts, huntress.ts) won't have TS errors for those fields but the `as any` is ugly and should be cleaned up once fields are public.

### B. Verify no behavioral regressions
After fixing TS errors, need to:
1. Run `npx tsc --noEmit` — should have zero errors
2. Run `npx vite build` — should build cleanly
3. Playtest each hero to confirm attacks and passives work

### C. Khashin energy regen
Khashin energy regen is inside `updateKhashinPassives()` already (not a separate function like other heroes). This is fine — just means the pattern is slightly different.

### D. tryAutoAttack dispatch
The `tryAutoAttack` method still has hero-specific logic inline (energy checks, stance switching, animation selection, Tectonic Fury proc). This was NOT extracted — it's the central dispatcher and is complex. Consider extracting in a future pass.

### E. Constructor hero-specific logic
Q key bindings for Sifra/Nazar/Huntress/Khashin are still in the Player constructor. Not extracted.

### F. Die method hero-specific logic
Phoenix Heart (Ignara), Undying (Amun), crystal ring burst (Muller) death VFX still inline in Player.die(). Not extracted.

## Architecture audit items NOT yet addressed
From the architecture agent (background task completed):
- **No base enemy class** — takeDamage/die/applyPoison duplicated across 6 entity files
- **Event listeners never cleaned up** in GameScene (memory leak on restart)
- **Per-frame enemy scans without throttle** — still present in hero modules (just moved, not optimized)
- **187 `as any` casts** — still present, just moved to hero files
- **No object pooling** for enemies
- **Speed drift bug** — Kill Stride / Speed Pickup restore speed via division
- **Lightning branch uses Ice icon keys** in UpgradeSystem.ts (wrong icons shown)

## File structure after refactor
```
src/entities/
  Player.ts          (1701 lines — base class, shared logic, dispatchers)
  heroes/
    ignara.ts        (7.8KB — fireball, lava trail)
    sifra.ts         (23.9KB — ice shard, lightning, shatter, passives)
    amun.ts          (18.7KB — shockwave, all auras/passives)
    nazar.ts         (26.9KB — melee, dash, poison, phantom trail)
    huntress.ts      (17KB — melee, spear, all passives)
    khashin.ts       (12.2KB — wind slash, dust devil, all passives)
    muller.ts        (19KB — crystal wave/eruption/spike/shard/ring, passives)
```
