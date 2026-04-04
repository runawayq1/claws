# Upgrade Registry

**File:** `src/systems/UpgradeSystem.ts`

Each entry: `id`, `label`, `desc` (exact), `apply` effect on Player.

---

## Generic Pool (all heroes)

| ID | Name | Effect |
|---|---|---|
| g1 | Sharp Edge | +20% attack damage |
| g2 | Swift Feet | +15% move speed |
| g3 | Eagle Eye | +20% attack range |
| g4 | Quick Hands | Attack CD ×0.8 (min 200ms) |
| g5 | Vitality | +25% max HP, heal bonus amount |
| g6 | Regeneration | +2 HP/s regen |
| g7 | Cleave | Splash radius set to ≥60px |
| g8 | Wisdom | +25% XP gain |
| g9 | Multistrike | +1 strike per attack |
| g10 | Iron Skin | +25% armor (cap 70%) |

---

## Ignara — Inferno (orange `0xff6600`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| if1 | Wide Burn | Explosion radius +20px | splashRadius +20 |
| if2 | Inferno Reach | Fireball range +30px | range +30 |
| if3 | White Fire | +30% fireball dmg | damage ×1.3 |
| if4 | Scorched Earth | Hit: burn DOT 15% dmg ×6 ticks/3s, +15% dmg | `hasScorchedEarth`; damage ×1.15 |
| if5 | Firestorm | 2 mini-fireballs: 50% dmg in 35px AoE, +15% dmg | `hasFirestorm`; damage ×1.15 |

## Ignara — Fortress (red `0xff4444`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| io1 | Heat Shield | +15% armor | armor +0.15 |
| io2 | Pyromaniac | On kill: +5 HP, +1 HP/s regen | `hasPyromaniac`; hpRegen +1 |
| io3 | Molten Skin | When hit: AoE 30% dmg in 50px, +10% armor | `hasMoltenSkin`; armor +0.1 |
| io4 | Ember Veil | +10% armor | armor +0.1 |
| io5 | Phoenix Heart | Revive once at 50% HP, +30 max HP | `hasPhoenixHeart`; maxHp/hp +30 |

## Ignara — Havoc (amber `0xffaa00`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| ih1 | Backdraft | Fireball knockback 120→300px, +10% dmg | `hasBackdraft`; damage ×1.1 |
| ih2 | Eruption | Explosion radius +40px | splashRadius +40 |
| ih3 | Lava Trail | Moving: drop 12px fire pools, 20% dmg/tick, +10 speed | `hasLavaTrail`; speed +10 |
| ih4 | Wildfire | On kill: chain explosion 50px, 40% dmg, +5 dmg | `hasWildfire`; damage +5 |
| ih5 | Meltdown | Below 40% HP: ×1.5 dmg; base +15% dmg | `hasMeltdown`; damage ×1.15 |

---

## Nazar — Way of the Blade (silver `0xccccdd`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| nb1 | Shadow Step | Blink 30px toward enemy before melee, +10 range | `hasShadowStep`; range +10 |
| nb2 | Twin Blades | +1 strike per melee attack | strikeCount +1 |
| nb3 | Blade Surge | Lunge 1.5× range, hit 70% dmg line, +5 dmg | `hasChainDash`; damage +5 |
| nb4 | Hemorrhage | Melee: bleed 15% dmg ×6 ticks over 3s, +10% dmg | `hasHemorrhage`; damage ×1.1 |
| nb5 | Assassinate | 2× dmg when only 1 enemy in melee range, +15% dmg | `hasAssassinate`; damage ×1.15 |

## Nazar — Way of Venom (green `0x44cc44`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| nv1 | Toxic Slash | On hit: DOT puddle 30% dmg/tick, 3s, +3 dmg | `hasToxicSlash`; damage +3 |
| nv2 | Virulent Strain | Puddles: 80% radius, 5s duration, +15 splash | `hasVirulentStrain`; splashRadius +15 |
| nv3 | Pandemic | On kill: spreads mini-cloud 50% radius, 50% dmg, +3 dmg | `hasPandemic`; damage +3 |
| nv4 | Weakness | Poisoned enemies take +30% dmg, +10% dmg | `hasWeakness`; damage ×1.1 |
| nv5 | Necrosis | Poison dmg ramps +20% per tick, +15% dmg | `hasNecrosis`; damage ×1.15 |

## Nazar — Way of Shadow (purple `0x9955dd`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| ns1 | Vanish | After melee: 400ms invuln, +10% armor | `hasVanish`; armor +0.1 |
| ns2 | Phantom Trail | Moving: shadow trail 15% dmg/tick in 15px, +10 speed | `hasPhantomTrail`; speed +10 |
| ns3 | Smoke Bomb | On melee: slow enemies 60% in 50px, +15 splash | `hasSmokeBomb`; splashRadius +15 |
| ns4 | Blood Scent | Execute melee targets below 20% HP, +10% dmg | `hasBloodScent`; damage ×1.1 |
| ns5 | Death Mark | 1st hit marks; 2nd hit deals +40% dmg, +15% dmg | `hasDeathMark`; damage ×1.15 |

---

## Sifra — Frost / Ice path (blue `0x55aaff`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| sf1 | Deep Freeze | Shards slow enemies +30%, +10% dmg | `hasDeepFreeze`; damage ×1.1 |
| sf2 | Blizzard Aura | Aura: slow nearby enemies 40% in 60px | `hasBlizzardAura` |
| sf3 | Frost Nova | Every 4th shot: 8 shards ring 50% dmg, +3 dmg | `hasFrostNova`; damage +3 |
| sf4 | Absolute Zero | Freeze stun 2s when enemy slowed below 35%, +15% dmg | `hasAbsoluteZero`; damage ×1.15 |
| sf5 | Eternal Winter | Frost field: 20% dmg/s + 60% slow in 55px, +15% dmg | `hasEternalWinter`; damage ×1.15 |

## Sifra — Shatter (light blue `0x88ddff`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| ss1 | Permafrost | +40% dmg vs slowed enemies, +10% dmg | `hasPermafrost`; damage ×1.1 |
| ss2 | Shatter | On hit: +2 mini-shards seek nearby foes | shatterPieces +2 |
| ss3 | Ice Spear | +8 dmg, +20px range | damage +8; range +20 |
| ss4 | Frostbite | +1 shatter shard, shards seek +20px further | shatterPieces +1; splashRadius +20 |
| ss5 | Avalanche | +3 shatter shards per hit, +20% dmg | shatterPieces +3; damage ×1.2 |

## Sifra — Crystal (pale blue `0xaaeeff`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| sc1 | Wide Shard | Shard AoE radius +20px | splashRadius +20 |
| sc2 | Ice Armor | Absorb shield (30+15% maxHP), regens after 3s | `hasIceArmor`; iceArmorMax/HP set |
| sc3 | Mirror Ice | Shards pierce +2 extra targets | pierceCount +2 |
| sc4 | Cryo Shield | When hit: fire 3 shards at 25% dmg in 80px, +5% armor | `hasCryoShield`; armor +0.05 |
| sc5 | Diamond Dust | +2 shard pierce, +25% dmg | pierceCount +2; damage ×1.25 |

## Sifra — Lightning (violet `0x9966ff`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| sl1 | Spark Initiate | Cone: chain to 1 nearby foe within 80px at 60% dmg, +15% dmg | `hasSparkInitiate`; damage ×1.15 |
| sl2 | Arc Reach | Cone +50% wider, side-arc 40% dmg, +15 range | `hasArcReach`; range +15 |
| sl3 | Overcharge | ~8% chance per frame: cone deals 3× dmg burst, +15% dmg | `hasOvercharge`; damage ×1.15 |
| sl4 | Ball Lightning | Orbit 45px: zap enemies in 40px for 30% dmg/s, +3 dmg | `hasBallLightning`; damage +3 |
| sl5 | Storm Lord | Every 2s: random enemy struck for 2× dmg, +20% dmg | `hasStormLord`; damage ×1.2 |

---

## Amun — Wrath (orange-red `0xff6633`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| aw1 | Thorns | When hit: reflect 50% dmg to enemies in 60px, +5% armor | `hasThorns`; armor +0.05 |
| aw2 | Wrath | When hit: AoE burst 60% dmg in 70px, +10% dmg | `hasWrath`; damage ×1.1 |
| aw3 | Consecration | Aura: pulse 40% dmg in 70px every 1.5s, +25 splash, +3 dmg | `dmgAuraActive`; splashRadius +25; damage +3 |
| aw4 | Living Fortress | Aura dmg scales 0.5–2× with HP %, +30 max HP | `hasLivingFortress`; maxHp/hp +30 |
| aw5 | Divine Judgment | Auto-execute enemies below 15% HP in 80+range px, +15% dmg | `hasDivineJudgment`; damage ×1.15 |

## Amun — Bastion (blue `0x4488ff`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| ab1 | Fortify | +15% armor, activates defense aura visual | armor +0.15; `defenseAuraActive` |
| ab2 | Aura of Might | Aura: 3 DPS to all enemies in 60px, +3 dmg | `hasPassiveAura`; damage +3 |
| ab3 | Iron Will | Any single hit capped at 10% max HP, +10% armor | `hasIronWill`; armor +0.1 |
| ab4 | Regenerate | Below 40% HP: regen ×3, +2 HP/s | `hasLowHpRegen`; hpRegen +2 |
| ab5 | Undying | Revive once at full HP + 100px shockwave, +30 max HP | `hasUndying`; maxHp/hp +30 |

## Amun — Quake (yellow `0xffcc44`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| aq1 | Titan's Pulse | Shockwave: launch boulder 300px, 1.5× dmg AoE, +5 dmg | `hasTitansPulse`; damage +5; splashRadius +15 |
| aq2 | Earthquake | Shockwave hit: stun enemies 0.8s, +10% dmg | `hasEarthquake`; damage ×1.1 |
| aq3 | Colossus | Shockwave knockback 500px (vs 200px), +5 dmg | `hasColossus`; damage +5 |
| aq4 | Gravity Well | Every 2s: pull enemies in 120+range px toward you, +15 range | `hasGravityWell`; range +15 |
| aq5 | Cataclysm | 2nd shockwave 60% dmg at 350ms delay, +15% dmg | `hasCataclysm`; damage ×1.15 |

---

## Huntress (Lyra) — Predator (red `0xff4444`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| hp1 | Critical Strike | 20% chance to deal 2× dmg, +10% dmg | `hasCriticalStrike`; damage ×1.1 |
| hp2 | Marked Target | Hit marks enemy 5s; marked take +30% dmg, +3 dmg | `hasMarkedTarget`; damage +3 |
| hp3 | Battle Frenzy | On kill: -10% attack CD for 5s, +3 dmg | `hasBattleFrenzy`; damage +3 |
| hp4 | Headhunter | Auto-execute enemies below 15% HP in 100px, +15% dmg | `hasHeadhunter`; damage ×1.15 |
| hp5 | Volley | Every 5th spear: fires 3 at once (extra 60% dmg), +10% dmg | `hasVolley`; damage ×1.1 |

## Huntress (Lyra) — Stalker (green `0x44cc44`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| hs1 | Kill Stride | On kill: +20% speed for 3s, +10 speed | `hasKillStride`; speed +10 |
| hs2 | Caltrops | Moving: drop 18px spike zone every 800ms, 15% dmg/tick, +3 dmg | `hasCaltrops`; damage +3 |
| hs3 | Net Throw | Every 8th spear roots enemies 1.5s, +3 dmg | `hasNetThrow`; damage +3 |
| hs4 | Camouflage | On kill: invisible 2s (enemies ignore you), +10 speed | `hasCamouflage`; speed +10 |
| hs5 | Leap | Auto-leap 120px away when 4+ enemies within 50px, 4s CD, +15 speed | `hasLeap`; speed +15 |

## Huntress (Lyra) — Warden (blue `0x4488ff`)

| ID | Name | Description | Key Effect |
|---|---|---|---|
| hw1 | Spear Mastery | Spears pierce +2 extra targets | `hasSpearMastery`; spearPierceCount +2 |
| hw2 | Explosive Tips | On first spear pierce: AoE 35% dmg in 40px, +15 splash | `hasExplosiveTips`; splashRadius +15 |
| hw3 | Splinter Shot | Spear miss: spawns 3 shards 30% dmg in 80px, +4 dmg | `hasSplinterShot`; damage +4 |
| hw4 | Spear Wall | 3 orbiting spears, 20% dmg/s each in 18px, +3 dmg | `hasSpearWall`; damage +3 |
| hw5 | Earth Slam | Melee: shockwave line 150px, 60% dmg, +20% dmg | `hasEarthSlam`; damage ×1.2 |

---

## Selection Logic (`UpgradeTracker`)

- `isFirstLevel` / `isBranchSelection` — true on first level-up.
- **First level-up:** `getBranchChoices()` returns 3 branch cards (one per branch). Sifra: lightning stance → Lightning + 2 random ice; ice stance → 3 ice branches.
- **Subsequent level-ups:** `getChoices()` returns 2 generic + 1 branch skill (next in sequence from `chosenBranch`). Falls back to 3 generics if branch maxed.
- `branchProgress: Record<branchName, count>` tracks how many skills picked per branch.
