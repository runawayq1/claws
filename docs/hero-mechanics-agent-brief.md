# Hero Mechanics Sub-Agent Briefing

## Project
**CLAWS** — Phaser 3.90 survivor (TypeScript + Vite, pixelArt: true)
Repo: `/Users/squad/Documents/claws/`

## Your Scope
Skills, balance, mechanics, assets, lore for all heroes. You edit Player.ts, UpgradeSystem.ts, GameScene.ts, enemy files.

---

## Key Files

| File | Purpose | ~Lines |
|------|---------|--------|
| `src/entities/Player.ts` | All hero logic, attacks, stances, upgrades | ~3400 |
| `src/systems/UpgradeSystem.ts` | Branch defs, upgrade pools, selection logic | ~400 |
| `src/scenes/GameScene.ts` | Physics, spawning, kill events, terrain | ~1200 |
| `src/scenes/LevelUpScene.ts` | Upgrade pick UI | ~300 |
| `src/entities/Skeleton.ts` | Weak melee enemy | ~200 |
| `src/entities/Zergling.ts` | Fast melee (Goblin) | ~200 |
| `src/entities/Scorpion.ts` | Ranged flyer (FlyingEye) | ~200 |
| `src/entities/SandGolem.ts` | Tank with slam | ~250 |
| `src/systems/WaveManager.ts` | Wave/zone spawn logic | ~200 |

---

## Hero Types & Base Stats

| Hero | Type | HP | Speed | DMG | Range | CD(ms) | Attack | Color |
|------|------|----|----|-----|-------|--------|--------|-------|
| Ignara | ignara | 80 | 140 | 30 | 180 | 700 | fireball | 0xe84118 |
| Sifra | sifra | 70 | 150 | 12 | 160 | 800 | iceshard | 0x82ccdd |
| Amun | amun | 160 | 100 | 22 | 80 | 1200 | shockwave | 0xfff200 |
| Nazar | nazar | 90 | 130 | 18 | 55 | 400 | melee | 0xc23616 |
| Lyra | huntress | 80 | 140 | 18 | 300 | 500 | spear | 0x2ecc71 |

---

## Stance System (Q toggle)

- **Sifra**: `'ice' | 'lightning'` — ice shards (pierce) vs lightning cone
- **Nazar**: `'sword' | 'venom'` — melee combos vs poison DoT
- **Huntress**: `'melee' | 'spear'` — close strikes vs ranged pierce

Each stance has separate energy pool (100 max), drain on attack, regen on idle.

---

## Upgrade Architecture

### Flow
1. First level-up: pick 1 of 3 branches (shows first upgrade of each)
2. Subsequent: 2 generic + 1 next from chosen branch
3. Each `Upgrade.apply(player)` mutates stats/flags directly

### Generic Pool (G1–G10)
| ID | Name | Effect |
|----|------|--------|
| g1 | Sharp Edge | +20% dmg |
| g2 | Swift Feet | +15% speed |
| g3 | Eagle Eye | +20% range |
| g4 | Quick Hands | CD ×0.8 |
| g5 | Vitality | +25% maxHP |
| g6 | Regeneration | +2 HP/s |
| g7 | Cleave | splash=60+ |
| g8 | Wisdom | +25% XP mult |
| g9 | Multistrike | +1 strike |
| g10 | Iron Skin | +0.25 armor |

### Branch Summary (3 per hero, 5 upgrades each)

**Ignara**: Inferno (splash/dmg), Fortress (armor/regen), Havoc (lava/wildfire)
**Sifra**: Lightning (cone/chain), Frost (aura/freeze), Shatter (split shards), Crystal (armor/pierce) — 4 branches, 3 shown based on stance
**Amun**: Wrath (thorns/dmg aura), Bastion (armor/regen/undying), Quake (AoE/gravity)
**Nazar**: Blade (dash/crit), Venom (poison/pandemic), Shadow (vanish/smoke/deathmark)
**Huntress**: Predator (crit/mark/volley), Stalker (speed/caltrops/leap), Warden (pierce/explosive/spearwall)

---

## Enemy Types

| Enemy | Class | HP | Speed | Special |
|-------|-------|----|----|---------|
| Skeleton | Skeleton | 45 | 80 | Basic melee |
| Goblin | Zergling | 30 | 140 | Fast melee |
| FlyingEye | Scorpion | 20 | 130 | Flying, immune to poison |
| Mushroom | SandGolem | 180 | 45 | Slam attack (2×DPS, knockback, 5s CD) |

All enemies have: `isMarked`, `markTimer`, `isRooted`, `rootTimer`
Wave scaling: HP × (1 + floor(wave/5) × factor) + (wave-1) × flat

---

## Kill-Triggered Mechanics (GameScene enemy-died handler)

- XP orb spawn at death pos
- player.kills++
- Huntress: BattleFrenzy (5s attack speed), KillStride (+20% speed 3s), Camouflage (2s invis)
- Heart drop every 100 kills

---

## Key Player Fields

### Combat
`hp, maxHp, speed, damage, range, attackCooldown, hpRegen, splashRadius, strikeCount, armor (cap 0.7), xpMult`

### Huntress-specific
- Predator: `hasCriticalStrike, hasMarkedTarget, hasBattleFrenzy, hasHeadhunter, hasVolley, volleyCounter, battleFrenzyUntil`
- Stalker: `hasKillStride, hasCaltrops, hasNetThrow, hasLeap, hasCamouflage, killStrideUntil, camouflageUntil, leapCooldown, caltropTimer`
- Warden: `hasSpearMastery, hasExplosiveTips, hasSplinterShot, hasSpearWall, hasEarthSlam, spearPierceCount(999), spearWallGfx, spearWallAngle`

### Sifra-specific
`shatterPieces, pierceCount, hasDeepFreeze, hasBlizzardAura, hasFrostNova, hasAbsoluteZero, hasEternalWinter, hasPermafrost, hasIceArmor, iceArmorHP/Max, hasCryoShield, hasSparkInitiate, hasArcReach, hasOvercharge, hasBallLightning, hasStormLord`

### Nazar-specific
`hasShadowStep, hasChainDash, hasHemorrhage, hasAssassinate, hasToxicSlash, hasVirulentStrain, hasPandemic, hasWeakness, hasNecrosis, hasVanish, vanishUntil, hasPhantomTrail, phantomTrailTimer, hasSmokeBomb, hasBloodScent, hasDeathMark`

### Amun-specific
`hasThorns, hasWrath, hasDivineJudgment, defenseAuraActive, hasPassiveAura, hasIronWill, hasLowHpRegen, hasUndying, hasTitansPulse, hasEarthquake, hasColossus, hasGravityWell, gravityWellTimer, hasCataclysm, dmgAuraActive/LastPulse/Cooldown`

### Ignara-specific
`hasScorchedEarth, hasFirestorm, hasPyromaniac, hasMoltenSkin, hasPhoenixHeart, hasBackdraft, hasLavaTrail, lavaTrailTimer, hasWildfire, hasMeltdown`

---

## Assets

### Hero Sprites (public/assets/)
| Hero | Folder | FrameSize | Anims |
|------|--------|-----------|-------|
| Ignara | fire_wizard/ | 150×150 | Idle, Move, Attack, Take Hit, Death |
| Sifra | wizard/ | 231×190 | Idle, Run, Attack1, Hit, Death |
| Amun | king/ | 160×111 | Idle, Run, Attack1, Take Hit, Death |
| Nazar | martial_hero/ | 200×200 | Idle, Run, Attack1, Take Hit, Death |
| Huntress | huntress/ | 150×150 | Idle, Run, Attack1-3, Take hit, Death |

### Enemies
| Enemy | Folder | FrameSize |
|-------|--------|-----------|
| Skeleton | skeleton/ | 150×150 |
| Goblin | goblin/ | 150×150 |
| FlyingEye | flying_eye/ | 150×150 |
| Mushroom | mushroom/ | 150×150 |

### Other
- Skill icons: `icons/skill_icons_sheet.png` (32×32, 70 frames)
- VFX: `vfx/flamethrower_sheet.png` (64×24, 8 frames)
- Rocks: `rocks/` (6 variants)
- Props: `props/` (40+ decorations)

---

## Zone System (GameScene)

5 radial zones from world center (1500, 1500):
| Zone | Radius | Spawns |
|------|--------|--------|
| 0 Crossroads | 0-600 | Skeleton only |
| 1 Meadow | 600-1200 | Skeleton + Scorpion |
| 2 Ruins | 1200-1800 | Balanced |
| 3 Dark Forest | 1800-2400 | Scorpion + Golem |
| 4 Wastes | 2400+ | Golem dominant |

---

## Rules

1. **`npx tsc --noEmit` must pass** — zero errors after every change
2. **No offset hacks** — trim assets, don't add magic numbers
3. **Don't deploy** — main conversation handles that
4. **Balance changes**: report old → new values clearly
5. **New mechanics**: add Player field + upgrade apply + update() tick logic
6. **Test command**: `cd /Users/squad/Documents/claws && npx tsc --noEmit`
