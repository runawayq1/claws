# Player Class Fields

**File:** `src/entities/Player.ts`

---

## Base Stats

| Field | Type | Default (per hero) | Modified by |
|---|---|---|---|
| `hp` | number | ignara 80, sifra 70, amun 160, nazar 90, huntress 80 | g5 Vitality, io5, ab4/5, aw4 |
| `maxHp` | number | same as hp | g5, io5 Phoenix Heart, ab5 Undying, aw4 Living Fortress |
| `speed` | number | ignara 140, sifra 150, amun 100, nazar 130, huntress 140 | g2, ih3, ns2, hs1, hs4, hs5 |
| `damage` | number | ignara 30, sifra 12, amun 22, nazar 18, huntress 18 | many upgrades |
| `range` | number | ignara 180, sifra 160, amun 80, nazar 55, huntress 300 | g3, if2, nb1, ss3, sl2, aq4 |
| `attackCooldown` | number (ms) | ignara 700, sifra 800, amun 1200, nazar 400, huntress 500 | g4 Quick Hands (×0.8, min 200) |
| `hpRegen` | number | 0.25 HP/s | g6 (+2), io2 (+1), ab4 (+2) |
| `splashRadius` | number | 0 | g7 (≥60), if1 (+20), ih2 (+40), nv2 (+15), ns3 (+15), ss4 (+20), sc1 (+20), aw3 (+25), aq1 (+15), hw2 (+15) |
| `xpMult` | number | 1 | g8 (+0.25) |
| `strikeCount` | number | 1 | g9 (+1), nb2 (+1) |
| `armor` | number | 0 (max 0.7) | g10 (+0.25), io1 (+0.15), io3 (+0.1), io4 (+0.1), ns1 (+0.1), sc4 (+0.05), aw1 (+0.05), ab1 (+0.15), ab3 (+0.1) |
| `heroType` | HeroType | constructor arg | — |

---

## Shadow

| Field | Type | Notes |
|---|---|---|
| `_shadow` | `Phaser.GameObjects.Ellipse` (private) | 40×16 dark ellipse at feet, alpha 0.35, depth 9. Breathing tween: scaleX 0.9→1.1, scaleY 0.85→1.05, 800ms yoyo. |

---

## Mechanic Flags — Ignara

| Field | Default | Set by |
|---|---|---|
| `hasPhoenixHeart` | false | io5 Phoenix Heart |
| `hasScorchedEarth` | false | if4 Scorched Earth |
| `hasMeltdown` | false | ih5 Meltdown |
| `hasLavaTrail` | false | ih3 Lava Trail |
| `hasBackdraft` | false | ih1 Backdraft (fireball knockback 120→300) |
| `hasWildfire` | false | ih4 Wildfire |
| `hasFirestorm` | false | if5 Firestorm |
| `hasPyromaniac` | false | io2 Pyromaniac |
| `hasMoltenSkin` | false | io3 Molten Skin |

---

## Mechanic Flags — Nazar

| Field | Default | Set by |
|---|---|---|
| `hasChainDash` | false | nb3 Blade Surge |
| `hasVanish` | false | ns1 Vanish |
| `vanishUntil` | 0 | runtime timer (ms) |
| `hasSmokeBomb` | false | ns3 Smoke Bomb |
| `hasPandemic` | false | nv3 Pandemic |
| `hasHemorrhage` | false | nb4 Hemorrhage |
| `hasAssassinate` | false | nb5 Assassinate |
| `hasPhantomTrail` | false | ns2 Phantom Trail |
| `hasBloodScent` | false | ns4 Blood Scent |
| `hasDeathMark` | false | ns5 Death Mark |
| `hasShadowStep` | false | nb1 Shadow Step |
| `hasToxicSlash` | false | nv1 Toxic Slash |
| `hasVirulentStrain` | false | nv2 Virulent Strain |
| `hasWeakness` | false | nv4 Weakness |
| `hasNecrosis` | false | nv5 Necrosis |

---

## Mechanic Flags — Sifra (Ice)

| Field | Default | Set by |
|---|---|---|
| `hasFrostNova` | false | sf3 Frost Nova |
| `hasAbsoluteZero` | false | sf4 Absolute Zero |
| `hasBlizzardAura` | false | sf2 Blizzard Aura |
| `hasDeepFreeze` | false | sf1 Deep Freeze |
| `hasEternalWinter` | false | sf5 Eternal Winter |
| `hasPermafrost` | false | ss1 Permafrost |
| `hasIceArmor` | false | sc2 Ice Armor |
| `iceArmorHP` | 0 | runtime (sc2) |
| `iceArmorMax` | 0 | sc2 (30 + maxHp×0.15) |
| `hasCryoShield` | false | sc4 Cryo Shield |
| `shatterPieces` | 0 | ss2 (+2), ss4 (+1), ss5 (+3) |
| `pierceCount` | 2 | sc3 (+2), sc5 (+2) |

---

## Mechanic Flags — Sifra (Lightning)

| Field | Default | Set by |
|---|---|---|
| `hasSparkInitiate` | false | sl1 Spark Initiate |
| `hasArcReach` | false | sl2 Arc Reach |
| `hasOvercharge` | false | sl3 Overcharge |
| `hasBallLightning` | false | sl4 Ball Lightning |
| `hasStormLord` | false | sl5 Storm Lord |

---

## Mechanic Flags — Amun

| Field | Default | Set by |
|---|---|---|
| `hasTitansPulse` | false | aq1 Titan's Pulse |
| `hasEarthquake` | false | aq2 Earthquake |
| `hasColossus` | false | aq3 Colossus |
| `hasCataclysm` | false | aq5 Cataclysm |
| `hasPassiveAura` | false | ab2 Aura of Might |
| `hasThorns` | false | aw1 Thorns |
| `hasIronWill` | false | ab3 Iron Will |
| `hasLowHpRegen` | false | ab4 Regenerate |
| `hasUndying` | false | ab5 Undying |
| `hasLivingFortress` | false | aw4 Living Fortress |
| `hasWrath` | false | aw2 Wrath |
| `hasGravityWell` | false | aq4 Gravity Well |
| `hasDivineJudgment` | false | aw5 Divine Judgment |
| `defenseAuraActive` | false | ab1 Fortify |
| `dmgAuraActive` | false | aw3 Consecration |

---

## Mechanic Flags — Huntress (Lyra)

| Field | Default | Set by |
|---|---|---|
| `hasMarkedTarget` | false | hp2 Marked Target |
| `hasCriticalStrike` | false | hp1 Critical Strike |
| `hasHeadhunter` | false | hp4 Headhunter |
| `hasVolley` | false | hp5 Volley |
| `hasBattleFrenzy` | false | hp3 Battle Frenzy |
| `hasKillStride` | false | hs1 Kill Stride |
| `hasCaltrops` | false | hs2 Caltrops |
| `hasNetThrow` | false | hs3 Net Throw |
| `hasLeap` | false | hs5 Leap |
| `hasCamouflage` | false | hs4 Camouflage |
| `hasSpearMastery` | false | hw1 Spear Mastery |
| `hasExplosiveTips` | false | hw2 Explosive Tips |
| `hasSpearWall` | false | hw4 Spear Wall |
| `hasSplinterShot` | false | hw3 Splinter Shot |
| `hasEarthSlam` | false | hw5 Earth Slam |
| `volleyCounter` | 0 | runtime: tracks throws for Volley |
| `netCounter` | 0 | runtime: tracks throws for Net Throw |
| `killStrideUntil` | 0 | runtime timer (ms) |
| `battleFrenzyUntil` | 0 | runtime timer (ms) |
| `camouflageUntil` | 0 | runtime timer (ms) |
| `spearPierceCount` | 999 | hw1 (+2 per pick); Explosive Tips lowers this |
| `huntressMeleeCombo` | false (private) | runtime melee combo flag |

---

## Stance / Energy Fields

| Field | Type | Default | Notes |
|---|---|---|---|
| `stance` | `'ice' \| 'lightning'` | `'ice'` | Sifra; Q key toggle |
| `iceEnergy` | number | 100 | Sifra runtime drain/regen |
| `lightningEnergy` | number | 100 | Sifra runtime |
| `maxEnergy` | number | 100 | — |
| `nazarStance` | `'sword' \| 'venom'` | `'sword'` | Nazar; Q key toggle |
| `swordEnergy` | number | 100 | Nazar runtime |
| `venomEnergy` | number | 100 | Nazar runtime |
| `huntressStance` | `'melee' \| 'spear'` | `'spear'` | Huntress; Q key toggle |
| `meleeEnergy` | number | 100 | Huntress runtime |
| `spearEnergy` | number | 100 | Huntress runtime |

---

## Combat / Progression Fields

| Field | Type | Default | Notes |
|---|---|---|---|
| `xp` | number | 0 | XpSystem |
| `level` | number | 1 | XpSystem |
| `kills` | number | 0 | incremented in GameScene |
| `shieldHp` | number | 0 | pickup shield |
| `shieldMaxHp` | number | 0 | pickup shield |
| `speedBuffUntil` | number | 0 | speed pickup timer |

---

## Physics

- `body.pushable = false` — enemies cannot push the player.
- Collides with rocks (static group). Does not collide with trees.
