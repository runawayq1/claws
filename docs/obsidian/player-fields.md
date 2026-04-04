# Player Class Fields

## Base Stats

| Field | Type | Default | Set By |
|---|---|---|---|
| `hp` | number | hero def (ignara 80, sifra 70, amun 160, nazar 90) | g5 Vitality, io5, ab4/5, aw4 |
| `maxHp` | number | same as hp | g5, io5 Phoenix Heart, ab4 Regenerate, ab5 Undying, aw4 Living Fortress |
| `speed` | number | hero def (ignara 140, sifra 150, amun 100, nazar 130) | g2 Swift Feet, ih3 Lava Trail, ns2 Phantom Trail |
| `damage` | number | hero def (ignara 30, sifra 12, amun 22, nazar 18) | many upgrades (see registry) |
| `range` | number | hero def (ignara 180, sifra 160, amun 80, nazar 55) | g3 Eagle Eye, if2, nb1, ss3, sl2, aq4 |
| `attackCooldown` | number | hero def (ignara 700, sifra 800, amun 1200, nazar 400) ms | g4 Quick Hands (×0.8, min 200) |
| `hpRegen` | number | 0.25 HP/s | g6 Regeneration (+2), io2 Pyromaniac (+1), ab4 Regenerate (+2) |
| `splashRadius` | number | 0 | g7 Cleave (≥60), if1 (+20), ih2 (+40), ih4, nv2 (+15), ns3 (+15), ss4 (+20), sc1 (+20), aw3 (+25), aq1 (+15) |
| `xpMult` | number | 1 | g8 Wisdom (+0.25) |
| `strikeCount` | number | 1 | g9 Multistrike (+1), nb2 Twin Blades (+1) |
| `armor` | number | 0 (max 0.7) | g10 Iron Skin (+0.25), io1 (+0.15), io3 (+0.1), io4 (+0.1), ns1 (+0.1), sc4 (+0.05), aw1 (+0.05), ab1 (+0.15), ab3 (+0.1) |
| `heroType` | HeroType | constructor arg | — |

## Mechanic Flags — Ignara

| Field | Type | Default | Set By |
|---|---|---|---|
| `hasPhoenixHeart` | boolean | false | io5 Phoenix Heart |
| `hasScorchedEarth` | boolean | false | if4 Scorched Earth |
| `hasMeltdown` | boolean | false | ih5 Meltdown |
| `hasLavaTrail` | boolean | false | ih3 Lava Trail |
| `hasBackdraft` | boolean | false | ih1 Backdraft |
| `hasWildfire` | boolean | false | ih4 Wildfire |
| `hasFirestorm` | boolean | false | if5 Firestorm |
| `hasPyromaniac` | boolean | false | io2 Pyromaniac |
| `hasMoltenSkin` | boolean | false | io3 Molten Skin |

## Mechanic Flags — Nazar

| Field | Type | Default | Set By |
|---|---|---|---|
| `hasChainDash` | boolean | false | nb3 Blade Surge |
| `hasVanish` | boolean | false | ns1 Vanish |
| `vanishUntil` | number | 0 | ns1 Vanish (runtime timer) |
| `hasSmokeBomb` | boolean | false | ns3 Smoke Bomb |
| `hasPandemic` | boolean | false | nv3 Pandemic |
| `hasHemorrhage` | boolean | false | nb4 Hemorrhage |
| `hasAssassinate` | boolean | false | nb5 Assassinate |
| `hasPhantomTrail` | boolean | false | ns2 Phantom Trail |
| `hasBloodScent` | boolean | false | ns4 Blood Scent |
| `hasDeathMark` | boolean | false | ns5 Death Mark |
| `hasShadowStep` | boolean | false | nb1 Shadow Step |
| `hasToxicSlash` | boolean | false | nv1 Toxic Slash |
| `hasVirulentStrain` | boolean | false | nv2 Virulent Strain |
| `hasWeakness` | boolean | false | nv4 Weakness |
| `hasNecrosis` | boolean | false | nv5 Necrosis |

## Mechanic Flags — Sifra (Ice)

| Field | Type | Default | Set By |
|---|---|---|---|
| `hasFrostNova` | boolean | false | sf3 Frost Nova |
| `hasAbsoluteZero` | boolean | false | sf4 Absolute Zero |
| `hasBlizzardAura` | boolean | false | sf2 Blizzard Aura |
| `hasDeepFreeze` | boolean | false | sf1 Deep Freeze |
| `hasEternalWinter` | boolean | false | sf5 Eternal Winter |
| `hasPermafrost` | boolean | false | ss1 Permafrost |
| `hasIceArmor` | boolean | false | sc2 Ice Armor |
| `iceArmorHP` | number | 0 | sc2 Ice Armor (runtime) |
| `iceArmorMax` | number | 0 | sc2 Ice Armor (30 + maxHp×0.15) |
| `hasCryoShield` | boolean | false | sc4 Cryo Shield |
| `shatterPieces` | number | 0 | ss2 (+2), ss4 (+1), ss5 (+3) |
| `pierceCount` | number | 2 | sc3 Mirror Ice (+2), sc5 Diamond Dust (+2) |

## Mechanic Flags — Sifra (Lightning)

| Field | Type | Default | Set By |
|---|---|---|---|
| `hasSparkInitiate` | boolean | false | sl1 Spark Initiate |
| `hasArcReach` | boolean | false | sl2 Arc Reach |
| `hasOvercharge` | boolean | false | sl3 Overcharge |
| `hasBallLightning` | boolean | false | sl4 Ball Lightning |
| `hasStormLord` | boolean | false | sl5 Storm Lord |

## Mechanic Flags — Amun

| Field | Type | Default | Set By |
|---|---|---|---|
| `hasTitansPulse` | boolean | false | aq1 Titan's Pulse |
| `hasEarthquake` | boolean | false | aq2 Earthquake |
| `hasColossus` | boolean | false | aq3 Colossus |
| `hasCataclysm` | boolean | false | aq5 Cataclysm |
| `hasPassiveAura` | boolean | false | ab2 Aura of Might |
| `hasThorns` | boolean | false | aw1 Thorns |
| `hasIronWill` | boolean | false | ab3 Iron Will |
| `hasLowHpRegen` | boolean | false | ab4 Regenerate |
| `hasUndying` | boolean | false | ab5 Undying |
| `hasLivingFortress` | boolean | false | aw4 Living Fortress |
| `hasWrath` | boolean | false | aw2 Wrath |
| `hasGravityWell` | boolean | false | aq4 Gravity Well |
| `hasDivineJudgment` | boolean | false | aw5 Divine Judgment |
| `defenseAuraActive` | boolean | false | ab1 Fortify |
| `dmgAuraActive` | boolean | false | aw3 Consecration |

## Stance / Energy Fields

| Field | Type | Default | Set By |
|---|---|---|---|
| `stance` | 'ice' \| 'lightning' | 'ice' | Sifra selection scene |
| `iceEnergy` | number | 100 | runtime drain/regen |
| `lightningEnergy` | number | 100 | runtime drain/regen |
| `maxEnergy` | number | 100 | — |
| `nazarStance` | 'sword' \| 'venom' | 'sword' | runtime toggle |
| `swordEnergy` | number | 100 | runtime drain/regen |
| `venomEnergy` | number | 100 | runtime drain/regen |

## Combat / Progression Fields

| Field | Type | Default | Set By |
|---|---|---|---|
| `xp` | number | 0 | XpSystem |
| `level` | number | 1 | XpSystem |
| `kills` | number | 0 | CombatSystem |
