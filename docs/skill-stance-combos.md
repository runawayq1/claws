# Skill + Stance Combo Reference — CLAWS

> Game design reference. Covers per-hero stances, branch synergies, generic upgrade pairings, and power-spike levels.

---

## Quick Reference: Stance Systems

| Hero | Stances | Toggle | Notes |
|------|---------|--------|-------|
| Ignara | None (no stance) | — | Single attack pattern, no toggle |
| Sifra | Ice / Lightning | Q | Ice: shard projectiles. Lightning: continuous cone beam |
| Nazar | Sword / Venom | Q | Sword: fast melee. Venom: ranged poison lob |
| Amun | Quake / Melee | Q | Melee stance **unlocked only** by Quake branch (aq1) |
| Huntress | Melee / Spear | Q | Melee: close-range stab. Spear: long-range throw |
| Khashin | Sirocco / Haboob | Q | Sirocco: wind slash ranged. Haboob: sand swipe melee cone |
| Muller | Spike / Eruption | Q | Spike: directional crystal wave. Eruption: AoE ring burst |

Stances drain energy from the active stance's pool. The **inactive** stance's pool recharges while you use the other. If energy runs dry, the game force-toggles to the other stance.

---

## IGNARA

**Base stats:** 80 HP · 140 speed · 30 dmg · 180 range · 700ms CD

Ignara has no stance toggle. All upgrades enhance the Fireball + AoE explosion pattern.

### Stances
None — Ignara is single-mode. The "stance" equivalent is whether you're investing in damage, tankiness, or chaos/mobility.

### Branch Synergies

| Branch | Key Skills | How They Stack |
|--------|-----------|----------------|
| **Inferno** | Wide Burn, Inferno Reach, White Fire, Scorched Earth, Firestorm | Pure AoE escalation. Each skill extends or multiplies the explosion. Pick this for crowd-clearing. |
| **Fortress** | Heat Shield, Pyromaniac, Molten Skin, Ember Veil, Phoenix Heart | Sustain/tank. Pyromaniac (kill→+5 HP) pairs with large explosions to farm heals on kill. |
| **Havoc** | Backdraft, Eruption, Lava Trail, Wildfire, Meltdown | Mobility + snowball. Lava Trail punishes movement and sets up area denial. Wildfire creates kill-chain reactions. Meltdown creates a dangerous-but-powerful glass-cannon moment. |

### Combo Recipes

**Max AoE Cleave:** Inferno branch → g7 Cleave + g9 Multistrike + g3 Eagle Eye
- Explosion radius becomes massive (base 40 + splashRadius×0.8). Multiple fireballs per volley blanket an area.

**Kill-Chain Snowball:** Havoc: Wildfire + Scorched Earth + g4 Quick Hands
- Wildfire triggers mini-explosions on kills. Scorched Earth leaves burn DOT. Fast CD means you cover ground with fire before DOTs expire, creating cascading death triggers.

**Low-HP Berserker:** Havoc: Meltdown + g5 Vitality + g6 Regeneration + Fortress: Pyromaniac
- Deliberately play at low HP to sustain the Meltdown ×1.5 bonus. Pyromaniac heals per kill, Regen provides passive income. High risk, maximum damage output.

**Glass Cannon Range:** Inferno branch (all 5) + g3 Eagle Eye + g1 Sharp Edge
- Range and splash both feed into the explosion size formula. At max Inferno + Eagle Eye, fireballs hit from extreme distance and explode with near-screen-filling radius.

### Generic Upgrade Pairings

| Generic | Why It Works |
|---------|-------------|
| g1 Sharp Edge (+20% dmg) | Direct multiplier on explosion damage AND Scorched Earth DOT AND Wildfire chains |
| g3 Eagle Eye (+20% range) | Ignara's range affects fireball travel distance AND the explosion AoE formula |
| g7 Cleave (splash +60px) | Directly adds to explosion radius — critical for Inferno or Havoc AoE builds |
| g9 Multistrike (+1 strike) | Each extra strike fires a full fireball with explosion; Firestorm adds 2 more on top |
| g4 Quick Hands (-20% CD) | More fireballs = more Wildfire chains and more Scorched Earth stacks |

### Power Spikes

| Level | Event |
|-------|-------|
| 1 | Branch choice sets direction (Inferno = AoE, Fortress = tank, Havoc = chaos) |
| 2–3 | Scorched Earth or Lava Trail online — field control begins |
| 4–5 | Firestorm or Wildfire online — kill rate accelerates sharply |
| 6+ | Meltdown + g5 Vitality synergy fully active; Pyromaniac sustains the low-HP window |

---

## SIFRA

**Base stats:** 70 HP · 150 speed · 12 dmg · 160 range · 800ms CD

Sifra has the most mechanically distinct stance system. The two attacks are entirely different weapons.

### Stances

**Ice stance** — Fires 1–N ice shards in a spread (strikeCount). Each shard pierces up to `pierceCount` enemies, applies slow, and can shatter into sub-shards. Deals burst damage per hit.

**Lightning stance** — Continuous beam hits all enemies in a cone every frame (damage × delta/1000). Lower per-hit numbers but constant uptime. Slows enemies passively. Energy drains while active; Ice energy recharges while Lightning is on.

> Ice and Lightning scale differently: Ice benefits from +dmg and +strikeCount; Lightning benefits from +dmg and +range (longer beam = wider kill zone).

### Branch Synergies

| Branch | Stance | Effect |
|--------|--------|--------|
| **Frost** | Ice | Deep Freeze stronger slow → enables Absolute Zero freeze stun. Blizzard Aura slows crowd passively. Eternal Winter adds damage-field floor. |
| **Shatter** | Ice | Permafrost (+40% dmg to slowed targets) feeds into every shard hit. Shatter/Frostbite/Avalanche chain: shards multiply on hit and seek nearby targets. |
| **Crystal** | Ice | Wide Shard + Mirror Ice = massive pierce + splash. Ice Armor + Cryo Shield = reactive tankiness. Diamond Dust = pierce highway. |
| **Lightning** | Lightning | Spark Initiate adds chain bounce from the cone. Overcharge adds 3× damage bursts at ~8%/frame chance. Ball Lightning adds persistent orbiting damage. Storm Lord adds periodic free strikes. |

### Combo Recipes

**Ice Freeze Lock:** Frost: Deep Freeze + Absolute Zero + g9 Multistrike + Shatter: Permafrost
- Deep Freeze slows to 0.3× speed. Absolute Zero triggers freeze stun at <35% base speed. Multiple shards per attack trigger Permafrost bonus (+40% dmg) on every frozen target. Crowd becomes completely still.

**Ice Shatter Chain:** Shatter: Shatter + Frostbite + Avalanche + g7 Cleave
- At max Shatter, each primary shard spawns 6 sub-shards (2+1+3) seeking nearby targets. Cleave increases the hit radius so primary shards catch clustered enemies and trigger more shatters. Permafrost on top makes each sub-shard hit hard.

**Lightning Overload:** Lightning: Overcharge + Ball Lightning + Storm Lord + g3 Eagle Eye
- Overcharge adds random 3× bursts. Ball Lightning orbits and zaps continuously. Storm Lord fires every 2s. Eagle Eye extends the cone's reach, covering more of the screen. Arc Reach widens the cone's lateral coverage.

**Ice Armor Bruiser (Ice stance with Crystal branch):** Crystal: Ice Armor + Cryo Shield + Diamond Dust + g10 Iron Skin
- Ice Armor (30+15% maxHP) absorbs hits. Cryo Shield fires 3 counter-shards when hit. Diamond Dust adds pierce. Result: a tanky ice-shooter who retaliates with counter-fire.

**Frost Nova Spam:** Frost: Frost Nova + g9 Multistrike + g4 Quick Hands
- Frost Nova fires a full 8-shard ring every 4th shot. With Quick Hands reducing CD and Multistrike adding shots, Nova triggers more frequently. The ring hits at 0.5× damage per shard × 8 shards = 4× effective hits per Nova.

### Generic Upgrade Pairings

| Generic | Ice | Lightning |
|---------|-----|-----------|
| g1 Sharp Edge | Multiplies all shard dmg AND Permafrost bonus AND shatter sub-shard dmg | Multiplies per-frame DPS directly |
| g3 Eagle Eye | Longer range = more shards in flight = more hits per volley | Extends cone range, critical — more enemies in kill zone |
| g4 Quick Hands | More ice shots = more Nova procs | Continuous — doesn't directly help Lightning DPS |
| g7 Cleave | Increases shard hit radius, more targets per shard | Cone spread is independent of splashRadius |
| g9 Multistrike | +1 extra shard volley — huge for Frost Nova proc rate and total hits | Minimal benefit in Lightning mode |

### Power Spikes

| Level | Event |
|-------|-------|
| 1 | Branch choice: Lightning or Ice path. If Ice, which sub-branch (Frost/Shatter/Crystal). |
| 2–3 | Deep Freeze or Permafrost online — damage ceiling rises sharply |
| 3–4 | Shatter + Blizzard Aura online — crowd control becomes reliable |
| 5 | Absolute Zero (Frost) or Avalanche (Shatter) or Diamond Dust (Crystal) — full combo active |
| 5–6 | Lightning: Overcharge + Ball Lightning together — sustained DPS spikes constantly |

---

## NAZAR

**Base stats:** 90 HP · 140 speed · 18 dmg · 55 range · 400ms CD

Nazar is the fastest-attacking hero. Sword stance uses a melee AoE slash; Venom stance throws a ranged poison cloud. The stances use different upgrade sets.

### Stances

**Sword stance** — Fast melee slash hits all enemies in 55px radius. Applies Vanish invuln after swing (with ns1). Blade Surge extends hitbox to 1.5× range in a forward lunge.

**Venom stance** — Throws a poison vial to target location. Creates a lingering cloud that ticks damage every 500ms for 4–4.5s. Costs 8 energy per throw (slower drain than sword's 6). Gives +100px search range.

> Stances share the same branch upgrades. The key question is which stance benefits from each skill.

### Branch Synergies

| Branch | Best Stance | Effect |
|--------|-------------|--------|
| **Way of the Blade** | Sword | Shadow Step closes gap before melee. Twin Blades + Blade Surge extend effective melee coverage. Hemorrhage adds DOT post-hit. Assassinate doubles damage on isolated targets. |
| **Way of Venom** | Venom | Virulent Strain + Pandemic scale the poison field radius and spread. Weakness/Necrosis multiply the DPS inside the cloud. |
| **Way of Shadow** | Both | Vanish works in Sword. Smoke Bomb AoE slow triggers in both stances (Dash applies it on landing). Death Mark applies the first-hit debuff and benefits from Weakness (+30% on second hit). |

### Combo Recipes

**Pure Poison Field:** Venom: Toxic Slash + Virulent Strain + Pandemic + Necrosis + g7 Cleave
- Virulent Strain makes puddles 80% bigger with 5s duration. Pandemic spreads mini-clouds on kill. Necrosis ramps tick damage +20% per tick (tick 5 = ×2 damage). Cleave adds to pool radius. At full stack, enemies that enter a zone take escalating damage for 5s, and kills spread the infection.

**Blade + Weakness Burst:** Blade branch + Venom: Weakness + Shadow: Death Mark
- Use Venom stance to apply Weakness (poisoned = +30% dmg taken). Switch to Sword. Death Mark on first hit sets up second hit for +40% extra. All Sword damage against a Weakened+Marked target = ×1.3 × ×1.4 = ×1.82 effective multiplier.

**Assassin Solo Burst:** Way of the Blade: Assassinate + Shadow Step + Shadow: Vanish + Death Mark
- Shadow Step blinks to the target. Assassinate triggers (2× dmg) if target is isolated. Death Mark adds +40% on second hit. Vanish grants invuln window after each attack. Ideal for boss/elite focus.

**Full Shadow Zone Control:** Shadow: Smoke Bomb + Phantom Trail + g4 Quick Hands + g2 Swift Feet
- Phantom Trail drops damaging shadow zones while moving (15% dmg/tick). Smoke Bomb slow triggers on every melee hit. With high speed and fast CD, Nazar becomes a moving debuff field.

### Generic Upgrade Pairings

| Generic | Why |
|---------|-----|
| g4 Quick Hands (-20% CD) | Nazar's base CD is already 400ms. At 320ms, sword combo rate increases dramatically. More hits = more Weakness procs, more Death Mark setups. |
| g1 Sharp Edge | Multiplies base melee dmg AND poison cloud tick dmg AND Hemorrhage bleed |
| g2 Swift Feet | Enables Phantom Trail uptime and Smoke Bomb zone coverage |
| g9 Multistrike | +1 extra melee hit per swing — all active effects (Hemorrhage, Death Mark, Weakness) trigger on each hit |
| g7 Cleave | Increases Smoke Bomb AoE radius and poison cloud pickup range |

### Power Spikes

| Level | Event |
|-------|-------|
| 1 | Branch sets tone: Blade = bursty melee, Venom = DoT field, Shadow = zone control |
| 2–3 | Hemorrhage or Toxic Slash online — sustained damage adds up rapidly |
| 3–4 | Weakness + Blade or Smoke Bomb + fast CD — the cross-stance combo becomes live |
| 5 | Assassinate, Death Mark, or Necrosis — ceiling hit. Full combo can delete elites in 2–3 hits |

---

## AMUN

**Base stats:** 160 HP · 120 speed · 22 dmg · 80 range · 1200ms CD

Amun is the tankiest hero. Starts with only Shockwave (AoE ring). Melee stance is unlocked late by the Quake branch.

### Stances

**Quake stance (default)** — Fires expanding AoE shockwave rings. Hits every enemy in a ring band, applies knockback. More rings = more coverage. Slow CD (1200ms) but big AoE.

**Melee stance (Quake branch only)** — Close-range ground slam at 65px. Hits harder per swing (×1.3 base). Faster effective CD (600ms cap). Requires Titan's Pulse (aq1) to unlock.

> Without the Quake branch, Amun has no stance — just Shockwave + passive upgrades.

### Branch Synergies

| Branch | Key Interaction |
|--------|-----------------|
| **Wrath** | Consecration (aura pulse every 1.5s) + Living Fortress = aura damage scales with HP%. At full HP, aura deals ×2. Divine Judgment auto-executes below 15% — combines with knockback to cluster then finish. |
| **Bastion** | Iron Will (cap hit at 10% maxHP) + Undying (revive at full HP) = extremely durable. Regenerate ×3 regen below 40% HP. Stack with g6 Regen for passive self-sustain. |
| **Quake** | Titan's Pulse (boulder projectile on every shockwave) + Earthquake (stun on ring hit) + Colossus (huge knockback) + Gravity Well (pull enemies in) + Cataclysm (second ring burst) = complete zone domination. |

### Combo Recipes

**Gravity Funnel:** Quake: Gravity Well + Earthquake + Colossus + Cataclysm
- Gravity Well pulls enemies toward Amun every 2s. They cluster. Shockwave ring hits them all. Earthquake stuns on ring contact (0.8s). Colossus knocks them flying (50m). Cataclysm fires a second ring 350ms later catching the scattered group. This is the full Quake loop.

**Living Fortress Aura Tank:** Wrath: Consecration + Living Fortress + Bastion: Iron Will + Regenerate + g5 Vitality + g6 Regeneration
- Consecration pulses 40% dmg AoE around Amun constantly. Living Fortress multiplies aura damage by HP% (0.5–2×). With Iron Will capping incoming damage, Regen/Regenerate keep HP near full, keeping the aura multiplier near 2×. Amun becomes a slow-moving death zone.

**Melee Bruiser (Quake branch unlocked):** Quake: Titan's Pulse + Earthquake + Colossus → switch to Melee stance + g1 Sharp Edge + g9 Multistrike
- In Melee stance, 600ms CD with 1.3× multiplier hits faster than Shockwave. Earthquake stun applies in Melee too. Colossus gives 350px knockback on melee hit. Use Melee to clean up clusters, switch to Quake for grouped mobs and Titan's Pulse for distant targets.

**Execute Zone:** Wrath: Divine Judgment + Gravity Well + g3 Eagle Eye
- Gravity Well pulls enemies in. Eagle Eye extends Divine Judgment's execute radius (80+range). Everything that survives the shockwave and gets pulled close gets executed at 15% HP threshold automatically.

### Generic Upgrade Pairings

| Generic | Why |
|---------|-----|
| g5 Vitality (+25% maxHP) | Amun starts with 160 HP — the bonus is large. Also amplifies Living Fortress aura damage (more HP = higher multiplier). |
| g7 Cleave | Adds to shockwave band width AND Consecration aura radius AND passive aura radius |
| g1 Sharp Edge | Multiplies shockwave damage, melee hit damage, Titan's Pulse boulder, AND the Consecration pulse |
| g3 Eagle Eye | Extends Shockwave ring max size, Gravity Well pull radius, and Divine Judgment execute range |
| g10 Iron Skin | Synergizes with Bastion branch's already high armor; keeps Amun alive to sustain Living Fortress uptime |

### Power Spikes

| Level | Event |
|-------|-------|
| 1 | Wrath or Bastion = passive; Quake = active. Quake branch is the only way to get melee stance. |
| 2 | Earthquake or Consecration online — ring hits now either stun or AoE damage passively |
| 3–4 | Gravity Well + Cataclysm = kill funnel complete |
| 5 | Divine Judgment or Undying online — either enemies auto-die or Amun doesn't |
| 6 | Melee stance + full Quake = dual-weapon flexibility with Titan's Pulse on every shockwave |

---

## HUNTRESS

**Base stats:** 80 HP · 140 speed · 18 dmg · 300 range · 500ms CD

Huntress is the only purely ranged-primary hero with a close-range alternate. Her spear pierces all targets in its path by default.

### Stances

**Spear stance (default)** — Throws a piercing spear from extreme range (300px). 12 energy drain per throw + extra 900ms cooldown penalty. Volley procs every 5th throw (3 spears at once).

**Melee stance** — Close-range stab at 80px range. Faster CD, lower energy drain. Earth Slam extends it with a 150px shockwave line in facing direction.

> Spear and Melee energy pools are separate. Use melee to farm energy for spear volleys when enemies close in.

### Branch Synergies

| Branch | Best Stance | Effect |
|--------|-------------|--------|
| **Predator** | Spear | Critical Strike + Marked Target = 20% crit on marked enemies + 30% dmg bonus. Volley fires 3 spears on every 5th throw. Headhunter auto-executes targets below 15% HP at range. |
| **Stalker** | Both | Caltrops (moving zone drops) work passively. Net Throw every 8th spear roots targets. Camouflage + Kill Stride = speed and invisibility on kill. Leap auto-repositions when cornered. |
| **Warden** | Both | Heavy Spear (+40% dmg + knockback) + Explosive Tips (first pierce AoE) = massive first-hit impact. Splinter Shot punishes misses (good for tracking fast enemies). Spear Wall orbits and damages nearby. Earth Slam turns melee into a short-range shockwave line. |

### Combo Recipes

**Crit Mark Volley:** Predator: Critical Strike + Marked Target + Volley + g9 Multistrike
- Marked enemies take +30% dmg. Crit chance applies per spear (20% per throw). With Multistrike adding extra spears per shot + Volley every 5th throw firing 3, a volley frame = 4–5 spears against a marked target with crit probability each. One volley can delete a large enemy.

**Explosive Chain:** Warden: Heavy Spear + Explosive Tips + Splinter Shot + g7 Cleave
- First spear pierces → Explosive Tips detonates on first contact (AoE 35% dmg). Heavy Spear gives +40% base damage + knockback. Splinter Shot fires 3 mini-shards if it misses. Cleave widens Explosive Tips radius.

**Trap + Execute Setup:** Stalker: Net Throw + Caltrops + Predator: Headhunter + Battle Frenzy
- Net Throw roots every 8th spear's target (1.5s). Caltrops slow walking enemies (50% speed) while standing on zones. Headhunter auto-executes the rooted/slowed targets below 15%. Battle Frenzy speeds up the kill cycle.

**Orbit Bruiser:** Warden: Spear Wall + Earth Slam + g4 Quick Hands + g1 Sharp Edge
- Spear Wall orbits 3 spears doing continuous melee damage. Earth Slam in Melee stance fires a 150px shockwave. Quick Hands tightens the CD loop. Sharp Edge multiplies all damage. Against clustered enemies, Spear Wall + Earth Slam can clear without throwing a single spear.

### Generic Upgrade Pairings

| Generic | Why |
|---------|-----|
| g1 Sharp Edge | Multiplies spear dmg AND crit dmg AND Explosive Tips AoE AND Splinter Shot fragments |
| g3 Eagle Eye | +20% range = even longer spear throw; Headhunter execute radius scales with range |
| g9 Multistrike | +1 extra spear per throw — effectively doubles Volley proc frequency and Critical Strike rolls |
| g4 Quick Hands | Reduces spear throw CD and melee CD equally; more throws = more Net Throw procs |
| g2 Swift Feet | Caltrops coverage increases with movement speed; Leap escapes are more effective |

### Power Spikes

| Level | Event |
|-------|-------|
| 1 | Predator = kill speed, Stalker = mobility/control, Warden = damage/sustain |
| 2–3 | Critical Strike + Marked Target live — damage ceiling doubles on marked targets |
| 3–4 | Volley or Heavy Spear + Explosive Tips online — single-volley clear of group enemies |
| 5 | Headhunter + Net Throw = autonomous kill loop; Spear Wall adds passive orbital DPS |

---

## KHASHIN

**Base stats:** 90 HP · 140 speed · 18 dmg · 160 range · 900ms CD

Khashin is a wind/sand martial artist. His two stances are thematically and mechanically opposite: ranged wind slashes vs. close-range blinding sand swipes.

### Stances

**Sirocco stance (default)** — Fires a wind arc crescent that travels forward, piercing up to `windSlashPierce` (base 2) enemies. The arc travels at 400px/s and can hit multiple enemies along its path.

**Haboob stance** — 90° cone melee at 90px range. Applies Blind (60% slow + marker) to hit enemies. Combo upgrades like Choking Sand and Abrasion multiply damage against blinded targets.

> Key asymmetry: Sirocco scales with range and pierce. Haboob creates the Blind debuff that Dune branch amplifies. Cross-stance play is the most powerful option.

### Branch Synergies

| Branch | Best Stance | Effect |
|--------|-------------|--------|
| **Gale** | Sirocco | Razor Wind (+25% dmg, +1 pierce) + Dust Devil (tornado every 5th attack) + Cyclone Surge (bigger tornadoes) + Eye of the Storm (anchored tornado every 8s). Pure wind damage escalation. |
| **Dune** | Haboob | Choking Sand (+35% dmg to blinded) + Abrasion (blinded enemies -20% armor) + Scarab Tide (on kill: 4 seeking scarabs apply Blind) + Sandstorm Wall (haboob arcs leave sand clouds). Blind as a damage multiplier. |
| **Mirage** | Both | Tailwind (+20 speed, -10% CD) + Phantom Step (auto-dash every 6s) + Drift (slow trail while moving) + Desert Wind (burst every 10s + DR). Positioning and evasion tools. |

### Combo Recipes

**Blind Burst Loop:** Dune: Choking Sand + Abrasion + Haboob stance + Gale: Razor Wind → switch back to Sirocco
- In Haboob: hit enemies with sand swipe to apply Blind (slow + marker). Switch to Sirocco. Now every wind slash into blinded targets hits for ×1.35 (Choking Sand) × ×1.2 (Abrasion armor shred = less DR) = ~×1.6 effective multiplier on already-piercing wind slashes.

**Tornado Field:** Gale: Dust Devil + Cyclone Surge + Eye of the Storm + Dune: Sandstorm Wall
- Dust Devil spawns tornado every 5th attack. Cyclone Surge upgrades duration to 3s and radius to 52px. Eye of the Storm adds an anchored tornado every 8s (4s duration). Sandstorm Wall drops lingering blind clouds on every Haboob hit. The field fills with moving/static tornado and cloud hazards. Enemies are perpetually slow and taking DOT.

**Speed Phantom:** Mirage: Tailwind + Phantom Step + Mirage + Drift + g2 Swift Feet
- Tailwind gives speed + -10% CD. Drift makes movement itself a slow zone. Phantom Step auto-dashes, dropping a decoy that re-targets nearby enemies. Khashin becomes a hit-and-run phantasm — fast, dodging, and leaving slow trails everywhere.

**Piercing Cyclone:** Gale: Razor Wind + g3 Eagle Eye + g9 Multistrike + g4 Quick Hands
- Razor Wind increases pierce to 3 per slash. Eagle Eye extends range. Multistrike fires extra wind slashes per attack. Quick Hands tightens the CD. Each slash volley covers long range and hits 3 enemies per shard. High spawn-dense areas become easy.

### Generic Upgrade Pairings

| Generic | Why |
|---------|-----|
| g1 Sharp Edge | Multiplies wind slash dmg AND haboob cone dmg AND Dust Devil tornado DPS |
| g3 Eagle Eye | More range on wind slash = more enemies hit along its path; Gust Strike knockback pushes them further |
| g4 Quick Hands | Accelerates Dust Devil proc rate (every 5th attack). Faster Haboob hits = faster Blind application cycle |
| g2 Swift Feet | Powers Drift trail coverage; better Phantom Step escapes; more ground covered per second |
| g9 Multistrike | +1 wind slash per Sirocco attack — more piercing projectiles per CD |

### Power Spikes

| Level | Event |
|-------|-------|
| 1 | Branch choice: Gale = damage, Dune = debuff multiplier, Mirage = evasion |
| 2–3 | Razor Wind or Choking Sand online — either pierce or blind multiplier activates |
| 3–4 | Dust Devil or Sandstorm Wall — field coverage begins; area becomes dangerous passively |
| 5 | Eye of the Storm (Gale) or Sandstorm Wall (Dune) + Phantom Step (Mirage) — full kit live |

---

## MULLER (Crystal)

**Base stats:** 160 HP · 110 speed · 38 dmg · 260 range · 1100ms CD

Muller is the heaviest-hitting hero. High base damage, slow movement, large HP pool. Crystal Wave creates erupting spikes in a directional cone; Eruption fires them in a full ring around self.

### Stances

**Spike stance (default)** — Crystal Wave erupts spikes sequentially from player toward target across the range cone. 8 (or 16 with Shardstorm) spikes damage enemies they contact. Tectonic Fury (every 5th attack) fires a super-wave at 2× range and 2× cone width, plus triggers an Eruption burst.

**Eruption stance** — AoE ring burst around player (radius ~range × 0.3). Crystals fly outward in all directions simultaneously. Damage is 0.8× base per hit. Used for close-range crowds, also Tectonic Fury auto-triggers it.

> Muller has no energy system — stance toggles freely. The key decision is when to switch stances, not resource management.

### Branch Synergies

| Branch | Key Interaction |
|--------|-----------------|
| **Shardfall** | Coarse Cut (wider cone) + Shardstorm (double wave) + Crystal Shrapnel (spray on death) + Deep Vein (+30% dmg at max range) + Tectonic Fury (5th hit superwave). Pure damage escalation on the Crystal Wave. |
| **Geode Shell** | Stone Skin (+5% armor/speed/size per hit, 5 stacks) + Geode Shell (absorb below 50% HP) + Resonance Armor (0.5s invuln on wave impact). Tightest defensive kit in the game. Crystal Wall adds a physical barrier every 8s. |
| **Deep Seam** | Planted Shard (mines on every slam) + Fault Line (4s ground hazard per wave) + Resonance Field (structures slow enemies 20%) + Crystal Pillar (auto-pillar every 12s) + Mother Lode (12s full-screen eruption). Battlefield-control/DoT approach. |

### Combo Recipes

**Full Shardfall Nuke:** Shardfall: all 5 (Coarse Cut + Deep Vein + Shardstorm + Crystal Shrapnel + Tectonic Fury) + g7 Cleave
- At max Shardfall: 16 spikes per wave (Shardstorm doubles). Coarse Cut widens the cone to 55°. Deep Vein gives +30% bonus at max range. Crystal Shrapnel sprays 3 shards per spike on death. Tectonic Fury every 5th = 32+ spikes with 2× range + full Eruption ring. With Cleave widening hit radius, each spike catches more targets. This is the highest single-trigger damage in the game.

**Hazard Field:** Deep Seam: Fault Line + Resonance Field + Planted Shard + Crystal Pillar
- Fault Line leaves 4s damaging crystal ground on every wave path. Planted Shard drops a mine mid-range. Crystal Pillar auto-spawns every 12s. Resonance Field makes all structures (Fault Line, Wall, Pillar) slow enemies 20%. Muller's path becomes a minefield Resonance Field slows enemies into the Fault Lines, which continue to damage. Low effort, high area denial.

**Stone Skin Titan:** Geode Shell: Stone Skin + Geode Shell + Resonance Armor + g10 Iron Skin + g5 Vitality
- Stone Skin builds 5 stacks (max +25% armor, +25 speed, +25% hitbox). Geode Shell absorbs a big hit below 50% HP. Resonance Armor grants 0.5s invuln after every wave — at Muller's 1100ms CD, that's ~45% uptime invulnerability. With g10 and g5, Muller can absorb almost anything.

**Mother Lode Burst:** Deep Seam: Mother Lode + Tectonic Fury + g1 Sharp Edge + g7 Cleave
- Mother Lode fires an expanding crystal ring every 12s dealing 3× base damage to anything it passes through. Tectonic Fury fires 2× range superwaves every 5th attack (roughly every 5.5s). With Sharp Edge and Cleave amplifying base damage, these two periodic nukes overlap frequently and can eliminate entire screens of enemies simultaneously.

### Generic Upgrade Pairings

| Generic | Why |
|---------|-----|
| g1 Sharp Edge | Multiplies Crystal Wave spike dmg AND Eruption AoE AND Tectonic Fury AND Mother Lode |
| g7 Cleave | Increases spike hit radius (currently 30px per spike). More splash = more multiple-enemy contacts per wave |
| g5 Vitality | Muller starts at 160 HP — 25% bonus is significant. Stone Skin scaling and Geode Shell threshold benefit from larger HP pool |
| g3 Eagle Eye | Increases Crystal Wave range, which Deep Vein directly amplifies (further = more bonus damage). More range = longer Fault Line runs |
| g9 Multistrike | Adds extra spikes per wave (strikeCount affects wave density); also accelerates Tectonic Fury proc rate |

### Power Spikes

| Level | Event |
|-------|-------|
| 1 | Branch choice: Shardfall = damage, Geode Shell = tank, Deep Seam = hazard/DoT |
| 2–3 | Shardstorm or Fault Line online — wave density doubles or hazard coverage begins |
| 3–4 | Crystal Shrapnel or Resonance Field — secondary damage layer active |
| 5 | Tectonic Fury or Mother Lode — the screen-clearing abilities are online |
| 6 | Full kit with generics; Stone Skin at 5 stacks = maximum defensive efficiency |

---

## Generic Upgrades: Cross-Hero Rankings

### Best generics by situation

| Upgrade | Best Heroes | Reasoning |
|---------|-------------|-----------|
| **g1 Sharp Edge (+20% dmg)** | All (especially Ignara, Muller, Nazar) | Multiplicative — scales all skills, DoTs, AoE procs |
| **g4 Quick Hands (-20% CD)** | Nazar, Huntress, Khashin | Nazar's 400ms base → 320ms is huge. Huntress Battle Frenzy stacks better with faster CD. Khashin Dust Devil procs faster. |
| **g7 Cleave (+60 splash)** | Ignara, Sifra-Ice, Amun, Muller | Directly feeds into AoE radius formulas. Less impact on Nazar/Khashin who have directional cone attacks. |
| **g9 Multistrike (+1 strike)** | Sifra-Ice, Nazar (Sword), Huntress, Muller | Adds full extra attack per swing. For Sifra Ice, extra shard volley. For Nazar Sword, extra melee hit (all effects trigger again). |
| **g3 Eagle Eye (+20% range)** | Huntress, Ignara, Sifra-Lightning, Amun | Huntress range is already huge; Eagle Eye extends execute range. Amun's Gravity Well and Divine Judgment scale with range. Sifra Lightning beam gets longer kill zone. |
| **g2 Swift Feet (+15% speed)** | Khashin, Nazar | Khashin Drift coverage. Nazar's Phantom Trail coverage. Less impactful on slow heroes (Amun, Muller). |
| **g5 Vitality (+25% HP)** | Amun, Muller | Both have large HP bases. Amun Living Fortress aura scales with HP%. Muller Geode Shell threshold benefits. |
| **g6 Regeneration (+2 HP/s)** | Amun, Ignara (Meltdown build) | Amun's Bastion regen stacks. Ignara staying in Meltdown window (below 40% HP) benefits from controlled regen. |
| **g10 Iron Skin (+25% armor)** | Amun (Bastion), Muller (Geode), Khashin (Dune/Sand Armor) | Heroes who already have armor upgrades reach the 0.7 DR cap faster. |
| **g8 Wisdom (+25% XP)** | Any — take early for faster level-ups, skip later | Earlier levels = earlier branch completion. Value decreases after branch is maxed. |

---

## Cross-Hero Stance Strategy Notes

1. **Stance switching is an energy management game** — both pools recharge while the other stance is used. Against low-density waves, actively switch between stances to keep both pools topped. Against dense hordes, commit to one stance and let the other recharge.

2. **Amun is the only hero who starts with one attack type** — the Quake branch is mandatory to unlock the second (melee). Every other hero has their toggle available from the start.

3. **Sifra Ice vs Lightning is a full build decision at character level** — once you pick a branch path, you're locked in. Ice path (3 ice branches) vs Lightning path (lightning + 2 ice branches) must be decided at the first level-up. Choose based on playstyle preference, not availability.

4. **Nazar's cross-stance combo is the most deliberate** — you need to apply Poison (Venom) to trigger Weakness, then switch to Sword to deal ×1.3 damage. This requires active switching, not just picking one stance.

5. **Khashin Dune branch is nearly useless without stance switching** — Choking Sand and Abrasion only matter if you first apply Blind via Haboob. Pure Sirocco players should pick Gale or Mirage instead.

6. **Muller's stance decision is tactical, not strategic** — Crystal Wave for range, Eruption for point-blank. No energy cost means free switching. Tectonic Fury auto-procs the Eruption ring on every 5th attack regardless of active stance.
