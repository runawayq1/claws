# CLAWS — Hero Upgrade & Progression System

## Overview

On each level up, the player sees **3 random upgrade choices**:
- **2 Generic** — from the shared pool (same for all heroes)
- **1 Personal** — unique to the current hero

If a hero has no remaining personal upgrades (all picked), all 3 slots become generic.
Personal upgrades cannot repeat — once picked, they're removed from the pool.

---

## Generic Upgrades (shared pool)

| ID | Name | Effect |
|----|------|--------|
| G1 | Sharp Edge | +20% damage |
| G2 | Swift Feet | +20% movement speed |
| G3 | Eagle Eye | +25% attack range |
| G4 | Quick Hands | +20% attack speed |
| G5 | Vitality | +30% max HP |
| G6 | Regeneration | Slowly restore HP over time |
| G7 | Cleave | Attacks hit in a wider area |
| G8 | Wisdom | +25% XP gain |
| G9 | Multistrike | +1 extra hit per attack |
| G10 | Iron Skin | +30% armor |

---

## Personal Upgrades

### Ignara — Fire Mage (Flamethrower)

Ignara has **3 skill branches**.

#### Branch 1: Inferno — cone size and raw burn power

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| IF1 | Wide Burn | Flame cone widens | +40% cone width |
| IF2 | Inferno Reach | Flame extends further | +35% flame range |
| IF3 | White Fire | Flame core does double damage | Inner half of cone does 2x damage |
| IF4 | Scorched Earth | Enemies keep burning after leaving cone | Burn for 2s after exiting flame |
| IF5 | Firestorm | Flame hits spawn fire pillars | 20% chance to create fire pillar on hit |

#### Branch 2: Fortress — defense and sustain while firing

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| IO1 | Heat Shield | Flame cone reduces incoming damage | +20% armor while firing |
| IO2 | Pyromaniac | Kills in flame restore HP | Restore HP per kill in cone |
| IO3 | Molten Skin | Taking damage releases fire burst | Fire explosion around you when hit |
| IO4 | Ember Veil | Flame creates a shield that absorbs damage | Shield grows as you deal fire damage |
| IO5 | Phoenix Heart | Revive on death in fire explosion | Once per run: revive at 50% HP with fire blast |

#### Branch 3: Havoc — knockback, chaos and area denial

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| IH1 | Backdraft | Flame pushes enemies away | Knockback enemies in cone |
| IH2 | Eruption | Continuous fire triggers explosions | Explosion at cone tip every 3s |
| IH3 | Lava Trail | Moving while firing leaves burning ground | Fire trail behind you for 2s |
| IH4 | Wildfire | Fire spreads between nearby enemies | Burn jumps to close enemies |
| IH5 | Meltdown | Below 30% HP flame doubles in size and damage | 2x range and damage when low HP |

### Nazar — Samurai (Dash Slash)

Nazar has **3 skill branches**. Each level-up personal slot offers an upgrade from a random branch the player hasn't maxed yet. This lets the player mix branches or commit deep into one.

#### Branch 1: Way of the Blade — raw slash power and mobility

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| NB1 | Shadow Step | Dash range increases | +40% dash distance |
| NB2 | Twin Blades | Slash hits twice | 2x damage per dash |
| NB3 | Chain Dash | Dash bounces to second target | Auto-dash to next nearest enemy |
| NB4 | Hemorrhage | Slash causes bleed | Bleeding for 3s after slash |
| NB5 | Assassinate | Massive crit on lone targets | 2x damage if only 1 enemy nearby |

#### Branch 2: Way of Venom — poison pools and debuffs

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| NV1 | Toxic Slash | Dash leaves a poison pool at impact | Poison cloud at dash target |
| NV2 | Virulent Strain | Pools last longer and grow | +50% duration, +30% radius |
| NV3 | Pandemic | Poisoned enemies spread poison on death | Mini-pool spawns on poisoned kill |
| NV4 | Weakness | Poisoned enemies deal less damage | -25% damage from poisoned enemies |
| NV5 | Necrosis | Poison damage ramps up over time | Poison gets stronger the longer enemy stays |

#### Branch 3: Way of Shadow — evasion, stealth and fear

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| NS1 | Vanish | Brief invulnerability after dash | Invincible for a moment after slash |
| NS2 | Phantom Trail | Dash leaves a damage afterimage | Damaging trail on dash path |
| NS3 | Smoke Bomb | Every 4th dash drops a smoke cloud | Enemies in smoke miss 50% attacks |
| NS4 | Blood Scent | Bonus damage to low HP enemies | +50% damage to wounded enemies |
| NS5 | Death Mark | Dashed enemies take more damage from all sources | +30% damage from all sources for 4s |

### Sifra — Ice Mage (Ice Shard)

Sifra has **3 skill branches**.

#### Branch 1: Frost — slow, freeze and crowd control

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| SF1 | Deep Freeze | Shard slows much more | Stronger and longer slow effect |
| SF2 | Blizzard Aura | Passive slow aura around Sifra | Nearby enemies are slowed constantly |
| SF3 | Frost Nova | Every 5th shard fires in all directions | Ring of 8 shards around you |
| SF4 | Absolute Zero | Heavily slowed enemies freeze solid | Max-slowed enemies get stunned for 2s |
| SF5 | Eternal Winter | Frozen enemies never unfreeze until hit | Freeze lasts until damaged, then shatters |

#### Branch 2: Shatter — damage to frozen/slowed targets

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| SS1 | Permafrost | Slowed enemies take bonus damage | +25% damage to slowed targets |
| SS2 | Shatter | Frozen enemies explode on death | Frozen kills explode in area |
| SS3 | Ice Spear | Every 3rd shard deals 3x damage | Empowered shard, pierces everything |
| SS4 | Frostbite | Slowed enemies lose HP over time | Slow also deals damage over time |
| SS5 | Avalanche | Shattering enemies chains to nearby frozen | Explosions chain to nearby frozen enemies |

#### Branch 3: Crystal — defense and piercing

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| SC1 | Glacial Pierce | Shard pierces +2 more enemies | Shards pass through 2 extra enemies |
| SC2 | Ice Armor | Nearby frozen enemies reduce damage taken | Less damage taken per frozen enemy nearby |
| SC3 | Mirror Ice | Shards bounce off walls once | Shards ricochet off edges at full damage |
| SC4 | Cryo Shield | Taking damage creates ice shards | Getting hit fires 3 shards at attacker |
| SC5 | Diamond Dust | Shards split into 3 on max range | Shards fragment at end of range |

### Amun — Guardian (Shockwave + Aura)

Amun has **3 skill branches**.

#### Branch 1: Quake — shockwave power and crowd control

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| AQ1 | Titan's Pulse | Shockwave radius increases | +30% shockwave radius |
| AQ2 | Earthquake | Shockwave stuns enemies briefly | Short stun on shockwave hit |
| AQ3 | Colossus | Shockwave knockback doubles | 2x knockback force |
| AQ4 | Rally Cry | Shockwave temporarily boosts speed | Speed boost for 3s after shockwave |
| AQ5 | Cataclysm | Shockwave fires twice in quick succession | Double shockwave burst |

#### Branch 2: Bastion — armor, HP and passive tanking

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| AB1 | Fortify | Aura also gives damage reduction | +15% armor from aura |
| AB2 | Thorns | Enemies take damage on contact | Reflect 20% of damage taken |
| AB3 | Iron Will | Damage taken is capped per hit | No single hit can deal more than 15% of your HP |
| AB4 | Regenerate | HP regen scales with missing HP | Recover faster the lower your HP |
| AB5 | Undying | Survive lethal hit once per run | Once per run: revive at 30% HP with shockwave |

#### Branch 3: Sovereign — aura scaling and passive damage

| ID | Name | Description | Effect |
|----|------|-------------|--------|
| AS1 | Living Fortress | Max HP bonus increases aura damage | Aura damage scales with your max HP |
| AS2 | Consecration | Aura radius grows over time | Aura slowly expands during the run |
| AS3 | Wrath | Aura damage spikes when hit | Aura damage x3 for 2s after taking a hit |
| AS4 | Gravity Well | Aura pulls enemies inward slowly | Enemies in aura are dragged toward you |
| AS5 | Divine Judgment | Enemies in aura too long get executed | Burst damage to wounded enemies in aura |


---

## Build Path Synergies

### Ignara
- **Inferno Master** (full Inferno): Wide Burn + Inferno Reach + White Fire + Firestorm → screen-melting cone of death
- **Immortal Flame** (Inferno + Fortress): Scorched Earth + Heat Shield + Pyromaniac + Ember Veil → unkillable while firing
- **Chaos Mage** (Inferno + Havoc): Wide Burn + Backdraft + Lava Trail + Wildfire → fire everywhere, nothing gets close
- **Berserker** (Fortress + Havoc): Meltdown + Phoenix Heart + Eruption + Molten Skin → stronger as HP drops
- **Fire Wall** (full Havoc): Backdraft + Eruption + Lava Trail + Wildfire + Meltdown → pure area denial

### Nazar
- **Blade Master** (full Blade): Chain Dash + Twin Blades + Assassinate + Generic Speed → permanent dashing one-shot machine
- **Venomous Ronin** (Blade + Venom): Toxic Slash + Pandemic + Twin Blades + Generic Damage → dash through packs, leave poison everywhere
- **Shadow Assassin** (Blade + Shadow): Vanish + Death Mark + Chain Dash + Generic Damage → invincible burst assassin
- **Plague Ninja** (Venom + Shadow): Toxic Slash + Necrosis + Smoke Bomb + Blood Scent → debuff everything, execute weakened
- **Full Shadow**: Vanish + Phantom Trail + Smoke Bomb + Death Mark + Generic Armor → untouchable ghost

### Sifra
- **Ice Queen** (full Frost): Deep Freeze + Blizzard Aura + Absolute Zero + Eternal Winter → nothing moves, ever
- **Shatter Cannon** (Frost + Shatter): Deep Freeze + Shatter + Avalanche + Permafrost → freeze then explode chains
- **Gatling Ice** (Shatter + Crystal): Glacial Pierce + Ice Spear + Diamond Dust + Frostbite → screen full of shards
- **Fortress Mage** (Frost + Crystal): Blizzard Aura + Ice Armor + Cryo Shield + Mirror Ice → safe behind frozen walls
- **Glass Nuke** (full Shatter): Permafrost + Shatter + Ice Spear + Avalanche + Frostbite → massive damage, no defense

### Amun
- **Warlord** (full Quake): Titan's Pulse + Earthquake + Colossus + Cataclysm → shockwave crowd control machine
- **Immortal King** (Quake + Bastion): Earthquake + Fortify + Undying + Iron Will → can't die, can't be ignored
- **Aura Tank** (Bastion + Sovereign): Fortify + Thorns + Living Fortress + Gravity Well → walk into crowds, everything dies
- **Juggernaut** (Quake + Sovereign): Titan's Pulse + Rally Cry + Wrath + Divine Judgment → aggressive shockwave + aura burst
- **Sun God** (full Sovereign): Living Fortress + Consecration + Wrath + Gravity Well + Divine Judgment → passive delete aura


---

## Balance Notes

- Personal upgrades should be roughly **1.5x** the value of a generic upgrade to feel meaningful
- Early picks in each branch should be straightforward power boosts
- Later picks (NB5, NV5, NS5) are build-defining capstones
- Cap stacking: armor max 70%, slow max 90%, burn/bleed don't stack (refresh timer)
- Undying (Amun AB5) and Phoenix Heart (Ignara IO5) are intentionally once-per-run
- Nazar's Vanish (NS1) invulnerability is very short — prevents cheese but feels clutch
- Nazar's 3-branch system: personal slot offers from random un-maxed branch, so player can mix or specialize
- Poison pools from Venom branch only spawn if the player has picked NV1 (Toxic Slash)

## Implementation Notes

- Add `personalUpgrades: Record<HeroType, UpgradeDef[]>` to UpgradeSystem
- `getUpgradeChoices()`: pick 2 random from generic pool + 1 random from personal pool
- Track picked personal upgrades in Player: `pickedPersonal: Set<string>`
- New Player properties needed per hero for personal effects (e.g. `burnDps`, `dashBounce`, `frozenExplodeDmg`, etc.)
- LevelUpScene: personal upgrade card gets a **gold border** to distinguish from generic
