# CLAWS — Skill Reference (All Heroes)

> Exact data from `src/systems/UpgradeSystem.ts`. Each hero has 3 branches × 4 skills (3 regular + 1 ultimate). Ultimates unlock when all 3 regular skills are at level ≥ 2.

---

## Generic Upgrades (g1–g10) — shared by all heroes

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| g1 | Sharp Edge | +20% dmg to all attacks | +10% dmg (total +32%) | +10% dmg (total +45%) |
| g2 | Swift Feet | +15% move speed permanently | +10% more speed | +10% more speed |
| g3 | Eagle Eye | +20% attack range permanently | +15% more range | +15% more range |
| g4 | Quick Hands | -20% attack cooldown (min 200ms) | -10% more cooldown | -10% more cooldown |
| g5 | Vitality | +25% max HP, heal for the bonus | +20% more max HP | +20% more max HP |
| g6 | Regeneration | +2 HP/s passive regen | +2 HP/s more regen | +3 HP/s more regen |
| g7 | Cleave | AoE: attacks splash in 6m radius | Splash radius +3m | Splash radius +4m |
| g8 | Wisdom | +25% XP from all sources | +15% more XP | +15% more XP |
| g9 | Multistrike | +1 strike: attack hits one more time | +1 more strike | +1 more strike |
| g10 | Iron Skin | +25% armor (reduces dmg taken) | +15% more armor | +15% more armor |

---

## Ignara — Fire Mage

**Attack:** Fireball (AoE explosion)

### Branch: Inferno (`#FF6600`)
*"Burn everything. Ask questions never."*
**Theme:** Raw fireball power — bigger explosions, longer range, burn DOT, extra fireballs.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| if1 | Wide Burn | Explosion radius +2m | Radius +2m more (total +4m) | Radius +3m more + applies Scorched Earth burn DOT |
| if2 | Inferno Reach | Fireball range +3m | Range +2m more, +10% dmg | Range +2m more, +15% dmg |
| if3 | White Fire | +30% fireball dmg | +15% more dmg | +15% dmg + gains Wildfire on-kill chain explosion |
| if5 ★ | **Firestorm** | 2 mini-fireballs: 50% dmg in 3.5m AoE, +15% dmg | +1 more mini-fireball, +10% dmg | Mini-fireballs also drop Scorched Earth on impact |

### Branch: Fortress (`#FF4444`)
*"Stand in the fire. Let the Swarm come to you."*
**Theme:** Survivability — armor, healing on kill, damage reflection, revive.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| io1 | Heat Shield | +15% armor (dmg reduction) | +10% more armor | +10% armor + Ember Veil aura (reflect 10% dmg) |
| io2 | Pyromaniac | On kill: +2 HP, +1 HP/s regen | On kill: +3 HP instead, +1 HP/s regen | On kill: +4 HP, +2 HP/s more regen |
| io3 | Molten Skin | When hit: AoE 30% dmg in 5m, +10% armor | AoE range +3m, +10% more armor | AoE range +3m + grants Phoenix Heart revive |
| io5 ★ | **Phoenix Heart** | Revive once at 50% HP, +30 max HP | +30 more max HP, heal on revive to 70% | +40 max HP, revive spawns fire burst |

### Branch: Havoc (`#FFAA00`)
*"Chaos is a weapon. Learn to throw it."*
**Theme:** Chaotic destruction — knockback, lava trails, chain explosions, low-HP power spike.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| ih1 | Backdraft | Fireball knockback 12→30m, +10% dmg | +10% more dmg, knockback pulls enemies back in | +10% dmg + adds Meltdown berserker threshold |
| ih2 | Eruption | Explosion radius +4m | Radius +3m more, +5% dmg | Radius +3m more, +10% dmg |
| ih3 | Lava Trail | Moving: drop fire pools, 20% dmg/tick, +10 speed | +10 more speed, longer pool duration | +10 speed + gains Wildfire on-kill chain explosion |
| ih5 ★ | **Meltdown** | Below 40% HP: ×1.5 dmg; +15% base dmg | Threshold rises to 50% HP, +10% dmg | Also below threshold: +20 speed and armor +10% |

---

## Nazar — Shadow Assassin

**Attack:** Melee blade (Way of the Blade / Venom / Shadow)

### Branch: Way of the Blade (`#CCCCDD`)
*"One cut. One kill. Repeat until the Rift is silent."*
**Theme:** Assassin — blink strikes, multi-hit, lunge, bonus dmg vs isolated enemies.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| nb1 | Shadow Step | Blink 3m toward enemy before melee, +10 range | +15 range, blink distance +1.5m | +15 range, blink ignores collision for 0.3s |
| nb2 | Twin Blades | +1 strike per melee attack | +1 more strike | +1 more strike + Hemorrhage bleed on each hit |
| nb3 | Blade Surge | Lunge 1.5× range, hit 70% dmg line, +5 dmg | +8 dmg, lunge hits twice | +8 dmg + Assassinate: 2× dmg vs lone enemy |
| nb5 ★ | **Assassinate** | 2× dmg when only 1 enemy in melee range, +15% dmg | +10% more dmg, execute targets below 10% HP | +15% dmg, execute range doubled |

### Branch: Way of Venom (`#44CC44`)
*"The desert already wants them dead. Help it along."*
**Theme:** Poison mastery — DOT puddles, spreading plague, damage amplification.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| nv1 | Toxic Slash | On hit: DOT puddle 30% dmg/tick 3s, +3 dmg | +4 dmg, puddle lasts 5s | +5 dmg, puddles stack (max 3) |
| nv2 | Virulent Strain | Puddles +80% radius, 5s duration, +15 splash | Puddles also slow enemies 25% | Puddles slow 40% + Weakness: poisoned take +30% dmg |
| nv3 | Pandemic | On kill: spread mini-cloud 50% radius, 50% dmg, +3 dmg | +4 dmg, cloud lingers 1s longer | +5 dmg + Necrosis: poison ramps +20%/tick |
| nv5 ★ | **Necrosis** | Poison dmg ramps +20%/tick, +15% dmg | +10% more dmg, ramp resets slower | +15% dmg, ramp reaches up to 3× on last tick |

### Branch: Way of Shadow (`#9955DD`)
*"Be the thing they don't see coming. Be it twice."*
**Theme:** Stealth and execution — invulnerability, phantom trail, smoke, death mark.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| ns1 | Vanish | After melee: 400ms invuln, +10% armor | +10% more armor, invuln lasts 600ms | +10% armor, invuln also slows nearby enemies 40% |
| ns2 | Phantom Trail | Moving: shadow trail 15% dmg/tick in 1.5m, +10 speed | +10 speed, trail width doubles | +10 speed, trail also slows enemies 30% |
| ns3 | Smoke Bomb | On melee: slow enemies 60% in 5m, +15 splash | +20 splash, slow lasts 0.5s longer | +20 splash + Blood Scent: execute below 20% HP |
| ns5 ★ | **Death Mark** | 1st hit marks; 2nd hit deals +40% dmg, +15% dmg | +10% dmg, mark lasts 2s longer | +15% dmg, marked enemy reveals nearby hidden targets |

---

## Sifra — Ice/Lightning Mage

**Attack:** Ice shard (pierce) or Lightning cone (stance toggle Q)

> Sifra chooses from 3 branches: Lightning (always available) + 2 of the 2 Ice branches (Frost, Shatter). All 3 are presented at branch selection.

### Branch: Lightning (`#9966FF`)
*"The Bramauthroba gave her this. She intends to return it."*
**Theme:** Chain lightning, wide cone, random strikes, ball lightning.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| sl1 | Spark Initiate | Cone: chain to 1 nearby foe within 8m at 60% dmg, +15% dmg | +10% dmg, chain hits 2 targets | +15% dmg, chain at 80% dmg instead |
| sl2 | Arc Reach | Cone +50% wider, side-arc 40% dmg, +15 range | +15 range, arc dmg increases to 60% | +15 range, arc fires on both sides |
| sl3 | Overcharge | ~8% chance/frame: cone deals 3× dmg burst, +15% dmg | +10% dmg, proc chance doubles | +15% dmg + Ball Lightning orbit (zap 30% dmg/s) |
| sl5 ★ | **Storm Lord** | Every 2s: random enemy struck for 2× dmg, +20% dmg | +15% dmg, strikes 2 enemies at once | +15% dmg, strike interval reduced to 1.5s |

### Branch: Frost (`#55AAFF`)
*"The cold preserves. The cold also kills."*
**Theme:** Crowd control — slow, shields, blizzard aura, frost field.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| sf1 | Deep Freeze | Shards slow enemies +30%, +10% dmg | +10% dmg, frozen enemies shatter for +20% bonus dmg | +10% dmg, shatter AoE in 3m radius |
| sc2 | Ice Armor | Absorb shield (30+15% maxHP), regens after 3s | Shield strength +10% maxHP, regen timer -1s | +15% maxHP shield + Blizzard Aura activates when shield is up |
| sf2 | Blizzard Aura | Aura: slow nearby enemies 40% in 6m | Slow increases to 55%, radius +2m | Slow 55% + Frost Nova every 4th shot (8 shards ring) |
| sf5 ★ | **Eternal Winter** | Frost field: 20% dmg/s + 60% slow in 6m, +15% dmg | Field radius +3m, dmg rate +10%/s | +20% dmg, field also freezes enemies for 0.5s/tick |

### Branch: Shatter (`#88DDFF`)
*"Frozen things break beautifully."*
**Theme:** Split projectiles — bonus dmg vs slowed/frozen, shards multiply on hit, pierce.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| ss1 | Permafrost | +40% dmg vs slowed enemies, +10% dmg | +10% more dmg, bonus vs slowed increases to 60% | +10% dmg, bonus vs frozen is 100% (double dmg) |
| ss2 | Shatter | On hit: +2 mini-shards seek nearby foes | +2 more shards per hit | +2 more shards + shards pierce 2 additional targets |
| ss3 | Ice Spear | +8 dmg, +2m range | +8 dmg, +2m range, shards pierce +1 target | +10 dmg, +2m range + Mirror Ice: shards pierce +2 more |
| ss5 ★ | **Avalanche** | +3 shatter shards per hit, +20% dmg | +3 more shards, +10% dmg | +4 shards, +15% dmg, shards home more aggressively |

---

## Amun — Golem Guardian

**Attack:** Shockwave (ground slam ring)

### Branch: Wrath (`#FF6633`)
*"A thousand years of patience, ended."*
**Theme:** Damage auras, thorns reflection, consecration, auto-execute.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| aw1 | Thorns | When hit: reflect 50% dmg to enemies in 6m, +5% armor | Reflect radius +2m, +5% armor | +5% armor + Wrath AoE burst on hit |
| aw2 | Wrath | When hit: AoE burst 60% dmg in 7m, +10% dmg | +10% dmg, AoE radius +2m | +10% dmg + Living Fortress: aura scales with HP% |
| aw3 | Consecration | Aura: pulse 40% dmg in 7m every 1.5s, +25 splash, +3 dmg | +4 dmg, pulse rate increases to 1.2s | +5 dmg, splash +20 + gains +30 max HP |
| aw5 ★ | **Divine Judgment** | Auto-execute enemies below 15% HP in range, +15% dmg | +10% dmg, execute range doubled | +15% dmg, execute threshold rises to 20% HP |

### Branch: Bastion (`#4488FF`)
*"The golem was built to endure. You'll see why."*
**Theme:** Near-immortal defense — armor stacking, hit cap, regen, revive.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| ab1 | Fortify | +15% armor, activates defense aura visual | +10% more armor | +10% armor, Iron Will: cap incoming hit at 10% maxHP |
| ab2 | Aura of Might | Aura: 3 DPS to all enemies in 6m, +3 dmg | +3 dmg, aura radius +2m, 4 DPS | +4 dmg, aura DPS doubles + low HP regen ×3 below 40% |
| ab3 | Iron Will | Any single hit capped at 10% max HP, +10% armor | +10% more armor, regen +2 HP/s | +10% armor, +2 HP/s + Undying revive at full HP |
| ab5 ★ | **Undying** | Revive once at full HP + 10m shockwave, +30 max HP | +30 max HP, revive shockwave is 15m | +40 max HP, revive triggers a 2s invuln window |

### Branch: Quake (`#FFCC44`)
*"The Amunat wastes remember every earthquake. Make more."*
**Theme:** Crowd control — boulder launch, stun, knockback, gravity pull, echo shockwave.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| aq1 | Titan's Pulse | Unlock stance toggle (Q): melee/quake. Boulder 30m, +5 dmg | +5 dmg, shockwave boulder splits into 2 | +5 dmg, boulder AoE splash +20 |
| aq2 | Earthquake | Shockwave hit: stun enemies 0.8s, +10% dmg | +10% dmg, stun duration 1.2s | +10% dmg + Gravity Well: pull enemies every 2s |
| aq3 | Colossus | Shockwave knockback 50m (vs 20m), +5 dmg | +5 dmg, knockback pulls enemies in after rebound | +5 dmg + Gravity Well: pull every 2s in 12m range |
| aq5 ★ | **Cataclysm** | 2nd shockwave 60% dmg at 350ms delay, +15% dmg | +10% dmg, 3rd shockwave 40% dmg at 700ms | +15% dmg, all shockwaves 15% wider AoE |

---

## Huntress (Lyra) — Spear Thrower

**Attack:** Spear (pierce, ranged)

### Branch: Predator (`#FF4444`)
*"First you mark them. Then you hunt them."*
**Theme:** Critical damage, target marking, kill streaks, multi-spear volley.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| hp1 | Critical Strike | 20% chance to deal 2× dmg, +10% dmg | +10% dmg, crit chance rises to 30% | +10% dmg + Headhunter: auto-execute below 15% HP |
| hp2 | Marked Target | Hit marks enemy 5s; marked take +30% dmg, +3 dmg | +3 dmg, mark lasts 8s, +40% dmg vs marked | +4 dmg, marks spread to adjacent enemies on kill |
| hp3 | Battle Frenzy | On kill: -10% attack CD for 5s, +3 dmg | +3 dmg, frenzy duration 8s | +4 dmg + Headhunter: auto-execute enemies below 15% HP |
| hp5 ★ | **Volley** | Every 5th spear: fires 3 at once (extra 60% dmg), +10% dmg | +10% dmg, volley fires 4 spears instead of 3 | +10% dmg, volley threshold drops to every 4th spear |

### Branch: Stalker (`#44CC44`)
*"The desert teaches patience. Lyra has plenty."*
**Theme:** Mobility, traps, roots, evasion — kiting build.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| hs1 | Kill Stride | On kill: +20% speed for 3s, +10 speed | +10 speed, stride duration 5s | +10 speed + Camouflage: invisible 2s after kill |
| hs2 | Caltrops | Moving: drop 2m spike zone every 800ms, 15% dmg/tick, +3 dmg | +3 dmg, zones last 1s longer | +4 dmg + Net Throw: every 8th spear roots enemies 1.5s |
| hs3 | Net Throw | Every 8th spear roots enemies 1.5s, +3 dmg | +3 dmg, root duration 2.5s | +4 dmg + Camouflage: invisible 2s after kill |
| hs5 ★ | **Leap** | Auto-leap 12m away when 4+ enemies within 5m, 4s CD, +15 speed | +15 speed, leap CD 2.5s | +15 speed, leap knocks away nearby enemies on landing |

### Branch: Warden (`#4488FF`)
*"One spear. One line through the horde."*
**Theme:** Spear mastery — heavy knockback, AoE on pierce, splinter shards, ground slam.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| hw1 | Heavy Spear | Spears +40% dmg and knock enemies back, +5 dmg | +5 dmg, knockback distance doubles | +5 dmg + Explosive Tips: spears explode on pierce |
| hw2 | Explosive Tips | On first spear pierce: AoE 35% dmg in 4m, +15 splash | +15 splash, AoE dmg increases to 50% | +15 splash + Splinter Shot: miss spawns 3 shards 30% dmg |
| hw3 | Splinter Shot | Spear miss: spawns 3 shards 30% dmg in 8m, +4 dmg | +4 dmg, shards home toward nearest enemy | +5 dmg + Spear Wall: 3 orbiting spears 20% dmg/s each |
| hw5 ★ | **Earth Slam** | Melee: shockwave line 15m, 60% dmg, +20% dmg | +15% dmg, shockwave width doubles | +15% dmg, shockwave ricochets off walls once |

---

## Khashin — Wind/Sand Assassin

**Attack:** Wind slash (crescent arc, pierce) / Sand swipe (360° melee, stance toggle Q)

> Gale branch = Sirocco stance. Dune branch = Haboob stance. Mirage branch = either stance.

### Branch: Gale (`#88DDFF`)
*"Cut them apart before they know you were there."*
**Theme:** Raw wind power — pierce, knockback, tornados, anchored storm.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| kw1 | Razor Wind | Wind slash +25% dmg, pierces +1 target | +15% dmg, slash width +20% | +15% dmg, slash fires two waves per attack |
| kw2 | Gust Strike | Wind slash knocks back enemies 15m | Knockback pushes 25m, hit targets take +15% dmg | +15% dmg + Cyclone Surge: Dust Devils +50% bigger |
| kw3 | Dust Devil | Every 5th attack spawns a drifting tornado | Tornadoes last 1s longer, +10% dmg | +10% dmg + Cyclone Surge: bigger + Eye of the Storm anchored tornado |
| kw5 ★ | **Eye of the Storm** | Anchored tornado every 8s; +20% dmg | +15% dmg, tornado lasts 2s longer | +15% dmg, spawn 2 anchored tornadoes at once |

### Branch: Dune (`#E8A040`)
*"The Pishane is a weapon. Use it."*
**Theme:** Sand and blindness — debuff stacking, absorb shield, scarab swarm, sand clouds.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| kd1 | Choking Sand | Blinded enemies take +35% dmg | +15% more dmg vs blinded, blind lasts 0.5s longer | +10% dmg + Abrasion: blinded enemies -20% armor |
| kd2 | Sand Armor | Absorb shield 25% max HP, regens 4s after break | Shield +10% max HP, regen timer -1s | +10% max HP shield + Scarab Tide on break |
| kd3 | Abrasion | Blinded enemies -20% armor; +3 dmg | +4 dmg, armor reduction deepens to -35% | +5 dmg + Scarab Tide: on kill 4 seeking blind scarabs |
| kd5 ★ | **Sandstorm Wall** | Haboob arcs spawn lingering sand clouds | Clouds linger 2s longer, +10% dmg | +15% dmg, clouds apply Blind to all who enter |

### Branch: Mirage (`#CCAAFF`)
*"Be somewhere else. Always somewhere else."*
**Theme:** Mobility and evasion — speed, auto-dash, phantom decoy, wind burst.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| km1 | Tailwind | +20 speed, -10% attack CD | +15 speed, -10% more attack CD | +15 speed, -10% CD + Drift: leave slow trails while moving |
| km2 | Phantom Step | Auto-dash 10m away every 6s | Dash CD reduced to 4s, +15 speed | +10 speed + Mirage: dash leaves a decoy for 2s |
| km3 | Mirage | Phantom Step leaves a decoy for 2s | Decoy lasts 3s, attacks enemies for 30% dmg | Decoy lasts 4s + Desert Wind burst every 10s |
| km5 ★ | **Desert Wind** | Every 10s: 18m wind burst + 3s DR | Burst radius +5m, DR extends to 5s | +15% dmg, burst knocks back all enemies 20m |

---

## Muller (Givi) — Crystal Gnome

**Attack:** Crystal wave (directional spike cone) / Eruption stance (360° crystal ring, stance toggle Q)

### Branch: Shardfall (`#44AAFF`)
*"Hit the ground hard enough. Everything shatters."*
**Theme:** Bigger, wider, more destructive crystal waves — raw offense.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| cm1 | Coarse Cut | Crystal wave cone +15° wider | Cone +15° wider (total +30°), +5% dmg | +5% dmg, cone waves pierce through walls |
| cm2 | Deep Vein | Spikes +30% dmg at max range | +15% dmg at all ranges | +15% dmg + Crystal Shrapnel: spikes spray 3 shards on death |
| cm3 | Shardstorm | Double wave per slam | +10% dmg, waves stagger by 0.15s | +10% dmg + Crystal Shrapnel: spikes spray shards on death |
| cm5 ★ | **Tectonic Fury** | Every 5th slam: crystal eruption ring | Eruption ring radius +3m, +15% dmg | +15% dmg, eruption chains to 2 nearby enemies |

### Branch: Geode Shell (`#99DDCC`)
*"Dense. Close to the ground. Hard to kill."*
**Theme:** Crystal armor, barriers, resilience — tanky survivability.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| cr1 | Stone Skin | On hit: +5% armor, +5 speed, +5% size. Max 5 stacks | Max stacks increase to 7 | Max stacks 7 + Resonance Armor: 0.5s invuln on wave impact |
| cr2 | Geode Shell | Below 50% HP: absorb next hit, 20s CD | CD reduced to 14s | CD 14s + Resonance Armor: wave impact grants 0.5s invuln |
| cr3 | Crystal Wall | Barrier every 8s blocking enemies | Barrier every 6s, wall lasts longer | Barrier every 5s + Living Geode: +25 HP, melee reflect 15 dmg |
| cr5 ★ | **Living Geode** | +25 HP, melee reflect 15 dmg | +25 HP, reflect increases to 25 dmg | +30 HP, reflect 25 dmg + wall reflects projectiles |

### Branch: Deep Seam (`#CC99FF`)
*"Every inch of ground becomes a hazard. Welcome to the mine."*
**Theme:** Crystal mines, pillars, fault lines — turning the battlefield into a minefield.

| ID | Name | Level 1 | Level 2 | Level 3 |
|----|------|---------|---------|---------|
| cf1 | Planted Shard | Slams leave crystal mines | Mines deal +30% more dmg | +20% mine dmg + Fault Line: slams carve 4s ground hazard |
| cf2 | Crystal Pillar | Auto pillar every 12s | Pillar CD reduced to 8s | Pillar CD 8s + Resonance Field: structures slow enemies 20% |
| cf3 | Fault Line | Wave carves 4s ground hazard | Hazard lasts 6s, +10% dmg | +10% dmg + Resonance Field: structures slow enemies 20% |
| cf5 ★ | **The Mother Lode** | Massive crystal eruption every 12s | +15% dmg, eruption interval 10s | +15% dmg, eruption spawns 3 Planted Shards |

---

## Quick Reference

| Hero | Branch | Color | IDs | Notes |
|------|--------|-------|-----|-------|
| Ignara | Inferno | `#FF6600` | if1, if2, if3, if5 | |
| Ignara | Fortress | `#FF4444` | io1, io2, io3, io5 | |
| Ignara | Havoc | `#FFAA00` | ih1, ih2, ih3, ih5 | |
| Nazar | Way of the Blade | `#CCCCDD` | nb1, nb2, nb3, nb5 | |
| Nazar | Way of Venom | `#44CC44` | nv1, nv2, nv3, nv5 | |
| Nazar | Way of Shadow | `#9955DD` | ns1, ns2, ns3, ns5 | |
| Sifra | Lightning | `#9966FF` | sl1, sl2, sl3, sl5 | Always available |
| Sifra | Frost | `#55AAFF` | sf1, sc2, sf2, sf5 | Ice branch |
| Sifra | Shatter | `#88DDFF` | ss1, ss2, ss3, ss5 | Ice branch |
| Amun | Wrath | `#FF6633` | aw1, aw2, aw3, aw5 | |
| Amun | Bastion | `#4488FF` | ab1, ab2, ab3, ab5 | |
| Amun | Quake | `#FFCC44` | aq1, aq2, aq3, aq5 | |
| Huntress | Predator | `#FF4444` | hp1, hp2, hp3, hp5 | |
| Huntress | Stalker | `#44CC44` | hs1, hs2, hs3, hs5 | |
| Huntress | Warden | `#4488FF` | hw1, hw2, hw3, hw5 | |
| Khashin | Gale | `#88DDFF` | kw1, kw2, kw3, kw5 | Sirocco stance |
| Khashin | Dune | `#E8A040` | kd1, kd2, kd3, kd5 | Haboob stance |
| Khashin | Mirage | `#CCAAFF` | km1, km2, km3, km5 | Either stance |
| Muller | Shardfall | `#44AAFF` | cm1, cm2, cm3, cm5 | |
| Muller | Geode Shell | `#99DDCC` | cr1, cr2, cr3, cr5 | |
| Muller | Deep Seam | `#CC99FF` | cf1, cf2, cf3, cf5 | |

**Total:** 10 generic (g1–g10) + 7 heroes × 3 branches × 4 skills = 10 + 84 = **94 skills**

> ★ = Ultimate (isUltimate: true) — unlocks when all 3 regular skills in branch are ≥ level 2.
