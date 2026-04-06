# CLAWS — Skill Reference (All Heroes)

> Exact data from `src/systems/UpgradeSystem.ts`. Visual Concept column = icon/art direction for artist.

---

## Generic Upgrades (shared by all heroes)

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | g1 | Sharp Edge | +20% dmg to all attacks | Glowing blade edge |
| 2 | g2 | Swift Feet | +15% move speed permanently | Winged boots |
| 3 | g3 | Eagle Eye | +20% attack range permanently | Golden eye |
| 4 | g4 | Quick Hands | -20% attack cooldown (min 200ms) | Spinning hands |
| 5 | g5 | Vitality | +25% max HP, heal for the bonus | Red heart pulse |
| 6 | g6 | Regeneration | +2 HP/s passive regen | Green cross glow |
| 7 | g7 | Cleave | AoE: attacks splash in 60px radius | Circular slash wave |
| 8 | g8 | Wisdom | +25% XP from all sources | Blue star book |
| 9 | g9 | Multistrike | +1 strike: attack hits one more time | Double sword slash |
| 10 | g10 | Iron Skin | +25% armor (reduces dmg taken) | Metal shield plate |

---

## Ignara — Fire Mage

**Color:** `#e84118` | **Element:** Fire | **Attack:** Fireball (AoE explosion)

### Branch: Inferno (`#FF6600`)
**Theme:** Raw fireball power — bigger explosions, longer range, burn DOT, extra fireballs.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | if1 | Wide Burn | Explosion radius +20px | Expanding fire ring |
| 2 | if2 | Inferno Reach | Fireball range +30px | Long flame trail |
| 3 | if3 | White Fire | +30% fireball dmg | White-hot fireball |
| 4 | if4 | Scorched Earth | Hit: burn DOT 15% dmg x6 ticks/3s, +15% dmg | Burning ground cracks |
| 5 | if5 | Firestorm | 2 mini-fireballs: 50% dmg in 35px AoE, +15% dmg | Triple fireball shower |

### Branch: Fortress (`#FF4444`)
**Theme:** Survivability — armor, healing on kill, damage reflection, revive.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | io1 | Heat Shield | +15% armor (dmg reduction) | Orange shield bubble |
| 2 | io2 | Pyromaniac | On kill: +5 HP, +1 HP/s regen | Skull in flames |
| 3 | io3 | Molten Skin | When hit: AoE 30% dmg in 50px, +10% armor | Lava skin burst |
| 4 | io4 | Ember Veil | +10% armor (dmg reduction) | Ember cloak |
| 5 | io5 | Phoenix Heart | Revive once at 50% HP, +30 max HP | Phoenix rising |

### Branch: Havoc (`#FFAA00`)
**Theme:** Chaotic destruction — knockback, lava trails, chain explosions, low-HP power spike.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | ih1 | Backdraft | Fireball knockback 120->300px, +10% dmg | Explosion shockwave |
| 2 | ih2 | Eruption | Explosion radius +40px | Volcanic eruption |
| 3 | ih3 | Lava Trail | Moving: drop 12px fire pools, 20% dmg/tick, +10 speed | Lava footprints |
| 4 | ih4 | Wildfire | On kill: chain explosion 50px, 40% dmg, +5 dmg | Spreading fire chain |
| 5 | ih5 | Meltdown | Below 40% HP: x1.5 dmg; also base +15% dmg | Cracked glowing core |

---

## Sifra — Ice/Lightning Mage

**Color:** `#82ccdd` | **Element:** Ice + Lightning | **Attack:** Ice shard (pierce) OR Lightning cone (stance toggle Q)

> **Stance gating:** Ice stance shows Frost/Shatter/Crystal branches. Lightning stance shows Lightning branch + 2 random ice branches.

### Branch: Lightning (`#9966FF`) — *Lightning stance only*
**Theme:** Chain lightning, wide cone, random strikes, orbiting ball lightning.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | sl1 | Spark Initiate | Cone: chain to 1 nearby foe within 80px at 60% dmg, +15% dmg | Forking lightning bolt |
| 2 | sl2 | Arc Reach | Cone +50% wider, side-arc 40% dmg, +15 range | Wide arc discharge |
| 3 | sl3 | Overcharge | ~8% chance per frame: cone deals 3x dmg burst, +15% dmg | Overloaded surge |
| 4 | sl4 | Ball Lightning | Orbit 45px: zap enemies in 40px for 30% dmg/s, +3 dmg | Orbiting electric sphere |
| 5 | sl5 | Storm Lord | Every 2s: random enemy struck for 2x dmg, +20% dmg | Lightning from sky |

### Branch: Frost (`#55AAFF`) — *Ice stance only*
**Theme:** Crowd control — slow, freeze stun, frost field.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | sf1 | Deep Freeze | Shards slow enemies +30%, +10% dmg | Frozen enemy outline |
| 2 | sf2 | Blizzard Aura | Aura: slow nearby enemies 40% in 60px | Snowflake aura ring |
| 3 | sf3 | Frost Nova | Every 4th shot: 8 shards ring 50% dmg, +3 dmg | Shard explosion ring |
| 4 | sf4 | Absolute Zero | Freeze stun 2s when enemy slowed below 35%, +15% dmg | Ice crystal prison |
| 5 | sf5 | Eternal Winter | Frost field: 20% dmg/s + 60% slow in 55px, +15% dmg | Blizzard storm zone |

### Branch: Shatter (`#88DDFF`) — *Ice stance only*
**Theme:** Split projectiles — shards multiply on hit, seek targets.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | ss1 | Permafrost | +40% dmg vs slowed enemies, +10% dmg | Frozen blade edge |
| 2 | ss2 | Shatter | On hit: +2 mini-shards seek nearby foes | Shattering ice burst |
| 3 | ss3 | Ice Spear | +8 dmg, +20px range | Long ice lance |
| 4 | ss4 | Frostbite | +1 shatter shard, shards seek +20px further | Ice shard swarm |
| 5 | ss5 | Avalanche | +3 shatter shards per hit, +20% dmg | Avalanche cascade |

### Branch: Crystal (`#AAEEFF`) — *Ice stance only*
**Theme:** Defense and pierce — ice armor shield, shard pierce, counter-attack.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | sc1 | Wide Shard | Shard AoE radius +20px | Wide ice cone |
| 2 | sc2 | Ice Armor | Absorb shield (30+15% maxHP), regens after 3s | Crystal armor layer |
| 3 | sc3 | Mirror Ice | Shards pierce +2 extra targets | Reflective ice prism |
| 4 | sc4 | Cryo Shield | When hit: fire 3 shards at 25% dmg in 80px, +5% armor | Ice counter burst |
| 5 | sc5 | Diamond Dust | +2 shard pierce, +25% dmg | Diamond shards rain |

---

## Amun — Guardian

**Color:** `#fff200` | **Element:** Earth/Divine | **Attack:** Shockwave (ground slam ring)

### Branch: Wrath (`#FF6633`)
**Theme:** Damage auras, thorns reflection, auto-execute.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | aw1 | Thorns | When hit: reflect 50% dmg to enemies in 60px, +5% armor | Thorn spike burst |
| 2 | aw2 | Wrath | When hit: AoE burst 60% dmg in 70px, +10% dmg | Golden rage explosion |
| 3 | aw3 | Consecration | Aura: pulse 40% dmg in 70px every 1.5s, +25 splash, +3 dmg | Holy ground pulse |
| 4 | aw4 | Living Fortress | Aura dmg scales 0.5-2x with HP %, +30 max HP | Stone golem form |
| 5 | aw5 | Divine Judgment | Auto-execute enemies below 15% HP in 80+range px, +15% dmg | Golden hammer strike |

### Branch: Bastion (`#4488FF`)
**Theme:** Near-immortal defense — armor stacking, hit cap, revive.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | ab1 | Fortify | +15% armor, activates defense aura visual | Blue shield wall |
| 2 | ab2 | Aura of Might | Aura: 3 DPS to all enemies in 60px, +3 dmg | Radiant pulse ring |
| 3 | ab3 | Iron Will | Any single hit capped at 10% max HP, +10% armor | Iron fortress icon |
| 4 | ab4 | Regenerate | Below 40% HP: regen x3, +2 HP/s | Green healing glow |
| 5 | ab5 | Undying | Revive once at full HP + 100px shockwave, +30 max HP | Ankh resurrection |

### Branch: Quake (`#FFCC44`)
**Theme:** Crowd control — boulder, stun, knockback, gravity pull.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | aq1 | Titan's Pulse | Shockwave: launch boulder 300px, 1.5x dmg AoE, +5 dmg | Rolling boulder |
| 2 | aq2 | Earthquake | Shockwave hit: stun enemies 0.8s, +10% dmg | Ground crack waves |
| 3 | aq3 | Colossus | Shockwave knockback 500px (vs 200px), +5 dmg | Giant fist slam |
| 4 | aq4 | Gravity Well | Every 2s: pull enemies in 120+range px toward you, +15 range | Black hole vortex |
| 5 | aq5 | Cataclysm | 2nd shockwave 60% dmg at 350ms delay, +15% dmg | Double quake ripple |

---

## Nazar — Samurai

**Color:** `#c23616` | **Element:** Blade/Venom/Shadow | **Attack:** Melee sword / Venom stance (toggle Q)

### Branch: Way of the Blade (`#CCCCDD`)
**Theme:** Assassin — blink strikes, bleed DOT, bonus damage vs isolated enemies.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | nb1 | Shadow Step | Blink 30px toward enemy before melee, +10 range | Dark teleport flash |
| 2 | nb2 | Twin Blades | +1 strike per melee attack | Dual katana cross |
| 3 | nb3 | Blade Surge | Lunge 1.5x range, hit 70% dmg line, +5 dmg | Sword dash line |
| 4 | nb4 | Hemorrhage | Melee: bleed 15% dmg x6 ticks over 3s, +10% dmg | Blood drip slash |
| 5 | nb5 | Assassinate | 2x dmg when only 1 enemy in melee range, +15% dmg | Single target crosshair |

### Branch: Way of Venom (`#44CC44`)
**Theme:** Poison mastery — DOT puddles, spreading plague, damage amplification.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | nv1 | Toxic Slash | On hit: DOT puddle 30% dmg/tick, 3s, +3 dmg | Green poison drip |
| 2 | nv2 | Virulent Strain | Puddles: 80% radius, 5s duration, +15 splash | Bubbling toxic pool |
| 3 | nv3 | Pandemic | On kill: spreads mini-cloud 50% radius, 50% dmg, +3 dmg | Spreading green mist |
| 4 | nv4 | Weakness | Poisoned enemies take +30% dmg, +10% dmg | Cracked skull poison |
| 5 | nv5 | Necrosis | Poison dmg ramps +20% per tick, +15% dmg | Rotting flesh decay |

### Branch: Way of Shadow (`#9955DD`)
**Theme:** Stealth and execution — invulnerability, phantom trail, smoke, death mark.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | ns1 | Vanish | After melee: 400ms invuln, +10% armor | Fading shadow figure |
| 2 | ns2 | Phantom Trail | Moving: shadow trail 15% dmg/tick in 15px, +10 speed | Dark afterimage trail |
| 3 | ns3 | Smoke Bomb | On melee: slow enemies 60% in 50px, +15 splash | Purple smoke cloud |
| 4 | ns4 | Blood Scent | Execute melee targets below 20% HP, +10% dmg | Red eye tracking |
| 5 | ns5 | Death Mark | 1st hit marks; 2nd hit deals +40% dmg, +15% dmg | Skull crosshair mark |

---

## Lyra (Huntress) — Spear Thrower

**Color:** `#2ecc71` | **Element:** Nature/Martial | **Attack:** Spear (pierce, ranged) / Melee combo (stance toggle Q)

### Branch: Predator (`#FF4444`)
**Theme:** Critical damage, target marking, kill streaks, multi-spear volley.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | hp1 | Critical Strike | 20% chance to deal 2x dmg, +10% dmg | Red crit star burst |
| 2 | hp2 | Marked Target | Hit marks enemy 5s; marked take +30% dmg, +3 dmg | Red target crosshair |
| 3 | hp3 | Battle Frenzy | On kill: -10% attack CD for 5s, +3 dmg | Rage speed lines |
| 4 | hp4 | Headhunter | Auto-execute enemies below 15% HP in 100px, +15% dmg | Skull with spear |
| 5 | hp5 | Volley | Every 5th spear: fires 3 at once (extra 60% dmg), +10% dmg | Triple spear fan |

### Branch: Stalker (`#44CC44`)
**Theme:** Mobility, traps, evasion — kiting build.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | hs1 | Kill Stride | On kill: +20% speed for 3s, +10 speed | Green speed boost |
| 2 | hs2 | Caltrops | Moving: drop 18px spike zone every 800ms, 15% dmg/tick, +3 dmg | Metal spike trap |
| 3 | hs3 | Net Throw | Every 8th spear roots enemies 1.5s, +3 dmg | Thrown net tangle |
| 4 | hs4 | Camouflage | On kill: invisible 2s (enemies ignore you), +10 speed | Leaf cloak fade |
| 5 | hs5 | Leap | Auto-leap 120px away when 4+ enemies within 50px, 4s CD, +15 speed | Acrobatic jump |

### Branch: Warden (`#4488FF`)
**Theme:** Spear mastery — pierce, AoE on pierce, orbiting spears, ground slam.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | hw1 | Spear Mastery | Spears pierce +2 extra targets | Multi-pierce spear |
| 2 | hw2 | Explosive Tips | On first spear pierce: AoE 35% dmg in 40px, +15 splash | Exploding spear tip |
| 3 | hw3 | Splinter Shot | Spear miss: spawns 3 shards 30% dmg in 80px, +4 dmg | Shattering spear head |
| 4 | hw4 | Spear Wall | 3 orbiting spears, 20% dmg/s each in 18px, +3 dmg | Rotating spear shield |
| 5 | hw5 | Earth Slam | Melee: shockwave line 150px, 60% dmg, +20% dmg | Ground crack fissure |

---

## Khashin — Sand Assassin

**Color:** `#88ddff` | **Element:** Wind/Sand | **Attack:** Wind slash (crescent arc, pierce) / Sand swipe (360° melee, stance toggle Q)

> **Stance gating:** Sirocco stance (default) = cutting wind arcs, long range. Haboob stance = sand melee swipe, applies Blind (40% slow + 25% reduced accuracy, 2s). Gale branch = Sirocco stance. Dune branch = Haboob stance. Mirage branch = either stance.

### Branch: Gale (`#88DDFF`) — *Sirocco stance*
**Theme:** Raw wind power — push enemies back, spawn persistent tornados, amplify arc damage.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | kw1 | Razor Wind | Wind slash +25% dmg, pierces +1 target | Sharp crescent blade |
| 2 | kw2 | Gust Strike | Wind slash knocks back enemies 150px | Shockwave push ring |
| 3 | kw3 | Dust Devil | Every 5th attack spawns a drifting tornado | Small swirling vortex |
| 4 | kw4 | Cyclone Surge | Dust Devils +50% bigger, +1s longer; +15% dmg | Enlarged spiral storm |
| 5 | kw5 | Eye of the Storm | Anchored tornado every 8s; +20% dmg | Central eye in cyclone |

### Branch: Dune (`#E8A040`) — *Haboob stance*
**Theme:** Sand and blindness — debuff stacking, sand armor, scarab swarm, lingering sand clouds.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | kd1 | Choking Sand | Blinded enemies take +35% dmg | Dust-choked skull |
| 2 | kd2 | Sand Armor | Absorb shield 25% max HP, regens 4s after break | Sandy barrier layer |
| 3 | kd3 | Abrasion | Blinded enemies -20% armor; +3 dmg | Sandpaper erosion |
| 4 | kd4 | Scarab Tide | On kill: 4 seeking scarabs apply Blind | Scarab beetle swarm |
| 5 | kd5 | Sandstorm Wall | Haboob arcs spawn lingering sand clouds | Sand cloud wall |

### Branch: Mirage (`#CCAAFF`) — *Either stance*
**Theme:** Mobility/evasion — dash, phantom decoy, slow trails, wind burst.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | km1 | Tailwind | +20 speed, -10% attack CD | Wind streak behind runner |
| 2 | km2 | Phantom Step | Auto-dash 100px away every 6s | Blurred teleport afterimage |
| 3 | km3 | Mirage | Phantom Step leaves a decoy for 2s | Ghostly duplicate |
| 4 | km4 | Drift | Moving leaves slow trails (40% slow) | Fading wind footprints |
| 5 | km5 | Desert Wind | Every 10s: 180px wind burst + 3s DR | Expanding sand shockwave |

---

## Givi — Crystal Gnome

**Color:** `#44aaff` | **Element:** Crystal/Earth | **Attack:** Crystal wave (directional spike cone) / Eruption (360° crystal ring, stance toggle Q)

> **Stance system:** Spike stance (default) = directional cone of crystal spikes, long range, piercing. Eruption stance = close-range AoE crystal ring burst around self.

### Branch: Shardfall (`#44AAFF`)
**Theme:** Bigger, sharper, more destructive crystal waves — raw offense.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | cm1 | Coarse Cut | Crystal wave cone +15° wider | Wider spike fan |
| 2 | cm2 | Deep Vein | Spikes +30% dmg at max range | Glowing deep crystal |
| 3 | cm3 | Shardstorm | Double wave per slam | Twin spike eruption |
| 4 | cm4 | Crystal Shrapnel | Spikes spray 3 shards on death | Shattering crystal burst |
| 5 | cm5 | Tectonic Fury | Every 5th slam: crystal eruption ring | Massive ground fissure |

### Branch: Geode Shell (`#99DDCC`)
**Theme:** Crystal armor, barriers, resilience — tanky survivability.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | cr1 | Stone Skin | +2% DR per kill, max 5 stacks | Mineral-crusted skin |
| 2 | cr2 | Geode Shell | Below 50% HP: absorb next hit, 20s CD | Crystal cocoon shield |
| 3 | cr3 | Crystal Wall | Barrier every 8s blocking enemies | Crystal spike barricade |
| 4 | cr4 | Resonance Armor | Wave impact grants 0.5s invuln | Vibrating crystal aura |
| 5 | cr5 | Living Geode | +25 HP, melee reflect 15 dmg | Crystal-encrusted body |

### Branch: Deep Seam (`#CC99FF`)
**Theme:** Crystal mines, pillars, resonance — turning the battlefield into a crystal minefield.

| # | ID | Name | Description | Visual Concept |
|---|-----|------|-------------|----------------|
| 1 | cf1 | Planted Shard | Slams leave crystal mines | Glowing dormant crystal |
| 2 | cf2 | Crystal Pillar | Auto pillar every 12s | Erupting crystal column |
| 3 | cf3 | Fault Line | Wave carves 4s ground hazard | Glowing crystal fissure |
| 4 | cf4 | Resonance Field | Structures slow enemies 20% | Pulsing energy aura |
| 5 | cf5 | The Mother Lode | Massive crystal eruption every 12s | Full-screen crystal cataclysm |

---

## Quick Reference

| Hero | Branch | Color | IDs | Stance |
|------|--------|-------|-----|--------|
| Ignara | Inferno | `#FF6600` | if1-if5 | — |
| Ignara | Fortress | `#FF4444` | io1-io5 | — |
| Ignara | Havoc | `#FFAA00` | ih1-ih5 | — |
| Sifra | Lightning | `#9966FF` | sl1-sl5 | Lightning only |
| Sifra | Frost | `#55AAFF` | sf1-sf5 | Ice only |
| Sifra | Shatter | `#88DDFF` | ss1-ss5 | Ice only |
| Sifra | Crystal | `#AAEEFF` | sc1-sc5 | Ice only |
| Amun | Wrath | `#FF6633` | aw1-aw5 | — |
| Amun | Bastion | `#4488FF` | ab1-ab5 | — |
| Amun | Quake | `#FFCC44` | aq1-aq5 | — |
| Nazar | Way of the Blade | `#CCCCDD` | nb1-nb5 | — |
| Nazar | Way of Venom | `#44CC44` | nv1-nv5 | — |
| Nazar | Way of Shadow | `#9955DD` | ns1-ns5 | — |
| Lyra | Predator | `#FF4444` | hp1-hp5 | — |
| Lyra | Stalker | `#44CC44` | hs1-hs5 | — |
| Lyra | Warden | `#4488FF` | hw1-hw5 | — |
| Khashin | Gale | `#88DDFF` | kw1-kw5 | Sirocco only |
| Khashin | Dune | `#E8A040` | kd1-kd5 | Haboob only |
| Khashin | Mirage | `#CCAAFF` | km1-km5 | Either |
| Givi | Shardfall | `#44AAFF` | cm1-cm5 | — |
| Givi | Geode Shell | `#99DDCC` | cr1-cr5 | — |
| Givi | Deep Seam | `#CC99FF` | cf1-cf5 | — |

**Total:** 10 generic + 105 personal = 115 upgrades
