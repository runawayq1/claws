# CLAWS — 10 New Heroes Design Document

> Design reference for future implementation. Each hero has unique stats, a distinct core mechanic, and three skill branches (5 skills each). All stat values are balanced against the existing roster baseline (HP 100, Speed 160, Damage 25, Range 120, CD 800ms).

---

## Hero 1 — Vael
**Role:** Void Summoner
**Element/Theme:** Shadow / Void — dark geometry, floating fragments, negative-space visuals

**Lore:** Once a cartographer who mapped the dead regions between worlds, Vael fell into a rift she herself opened and emerged hollow — her body now a conduit for something nameless. She speaks in pronouncements, never questions. She does not fight enemies; she lets the void consume them.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 65 | 145 | 14 | 100 | 1800ms | void-pulse (spawns void fragment) |

### Core Mechanic
Vael does not attack directly. Each attack spawns a **Void Fragment** — a slowly orbiting shard that autonomously seeks and damages nearby enemies. Vael can have up to **3 Fragments** active simultaneously; the 4th summon replaces the oldest. Fragments deal 14 base damage per hit on a 600ms internal cooldown and persist for 8 seconds. The core loop rewards positioning: keep Fragments between Vael and the horde rather than chasing enemies yourself.

### Attack Pattern
On attack, a hexagonal void shard (black with purple edge glow) spawns at Vael's position, drifts 40px outward in the cast direction, then locks into an orbit pattern (radius ~55px) around the nearest enemy cluster centroid within 120px. While orbiting, it pulses arcs of dark energy at enemies within 45px.

### Branch 1 — Rift (dark purple, #6600cc)
**Theme:** Maximise fragment count, damage output, and chaining between enemies.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Third Eye | Max fragments +1 (cap becomes 4), +10% damage |
| 2 | Void Fangs | Each fragment fires a seeking tendril on kill — 50% damage to 1 nearby enemy within 80px, +5 damage |
| 3 | Event Horizon | Fragment orbit radius +25px; enemies within orbit are slowed 25%, +10% damage |
| 4 | Hungry Dark | Fragment lifespan +4s; fragments heal Vael 2 HP per enemy hit, +3 damage |
| 5 | Singularity | Once per run on activation: all active fragments collapse into one massive implosion — 3× damage AoE in 90px, then respawn. CD resets at 120s. Also +20% damage permanently. |

### Branch 2 — Collapse (deep blue, #003388)
**Theme:** Defensive control — fragments become shields and crowd-control tools.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Null Shell | Each active fragment grants +8 armor (stacks; max +24 armor at 3 fragments), +5% armor base |
| 2 | Displacement | Fragment hit: 40% chance to teleport enemy 80px away from player, +10% damage |
| 3 | Shatter Veil | When Vael takes damage: nearest fragment explodes in 60px AoE for 80% damage, fragment then respawns after 3s, +10% armor |
| 4 | Dead Weight | Fragments slow enemies in orbit radius by 50% (up from 0%), +15 range |
| 5 | Abyssal Anchor | Fragments now root enemies for 1.2s on first hit (once per enemy per fragment lifetime), +10% damage |

### Branch 3 — Entropy (grey-violet, #885599)
**Theme:** Fragment synergy with movement — reward constant repositioning.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Phase Walk | Moving at full speed: fragments orbit 30px wider; standing still: fragments orbit 30px tighter for +25% damage, +10 speed |
| 2 | Trail of Ruin | Movement leaves 2s void patches (15px radius, 25% damage/tick at 500ms) that repel enemies, +5 damage |
| 3 | Scatter | On fragment expiry: explodes in 50px AoE for 60% damage, +10% damage |
| 4 | Fracture | Every 6s of continuous movement: spawn a bonus 4th fragment for 5s regardless of cap, +3 damage |
| 5 | Unraveling | Fragments accelerate their orbit speed by 50%; each enemy hit by a fragment in rapid succession (within 0.4s window) takes +20% cumulative damage per hit, +15% damage |

### Playstyle Summary
Vael rewards patience over aggression — pre-positioning fragments into crowds before they arrive, then retreating through the void patches her movement leaves behind. She is a glass cannon (65 HP) who compensates with distance management. Rift players lean into raw fragment damage for a pseudo-turret build; Collapse turns her into a slow-tank hybrid; Entropy rewards constant kiting with escalating payoffs.

---

## Hero 2 — Dravan
**Role:** Berserker Brawler
**Element/Theme:** Blood / Rage — crimson aura, cracked armor, veins glowing red

**Lore:** Dravan was a pit-fighter who survived three hundred bouts by refusing to die when any sane man would have. The healers who tried to patch him found his blood fought back. Now he walks into every battle hoping something out there is finally strong enough to end it — and growing stronger with every disappointment.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 130 | 155 | 20 | 60 | 500ms | melee-rage (wide arc cleave) |

### Core Mechanic
Dravan has a **Rage Meter** (0–100). Taking damage fills it by 20 per hit received; dealing damage fills it by 5 per hit dealt. At 100 Rage, he enters **Berserker State** for 6 seconds: +40% damage, +30% speed, attacks heal 3 HP per hit, and his melee arc widens to 180 degrees. After the 6s expires, Rage drops to 0 and Dravan takes a 1s slow (speed ×0.5) as the adrenaline crashes. This creates a natural risk-reward cycle: taking hits is dangerous but fuels his power spike.

### Attack Pattern
Standard attack: wide 120-degree arc cleave in front of Dravan, hitting all enemies within 60px. During Berserker State the arc expands to 180 degrees (full frontal hemisphere). Visual: a spray of crimson slash-lines with brief blood-mist particles; during Berserker his skin-glow intensifies and the slash lines turn brighter red.

### Branch 1 — Bloodthirst (crimson, #cc0011)
**Theme:** Maximise damage output during Berserker windows; increase Rage generation.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Open Wounds | Melee hits inflict bleed: 20% damage per tick × 4 ticks over 2s, +5 damage |
| 2 | Blood Hunger | Rage from damage taken increased to 30 per hit (was 20); kills grant +10 Rage, +10% damage |
| 3 | Gore Spray | On kill: blood burst 40px AoE, 60% damage; nearby enemies take 25% more damage for 3s, +5 damage |
| 4 | Rampage | Berserker duration +3s (total 9s); kills during Berserker reset the crash slow, +15% damage |
| 5 | Bloodlust | During Berserker: every kill heals 8 HP (up from 3 per hit) and grants +5% damage stacking for the duration (max +50%), +15% damage base |

### Branch 2 — Iron Fury (rust-red, #993322)
**Theme:** Sustain and defense — punish enemies for hitting Dravan, survive longer.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Thick Hide | +20% armor, +30 max HP |
| 2 | Pain Engine | When hit below 50% HP: gain 15 Rage instantly and recover 5 HP, +10% armor |
| 3 | Counterstrike | When hit: immediately deal 40% damage in 55px AoE retaliating burst (once per 800ms), +5 damage |
| 4 | Spite | Berserker State also reduces damage taken by 25%, +15% armor |
| 5 | Undying Rage | On lethal damage: enter Berserker at full Rage (if not already), survive at 1 HP for 5s. Occurs once per run. Also +30 max HP. |

### Branch 3 — Warlord (dark amber, #bb5500)
**Theme:** Crowd control — use Berserker to dominate positioning, AoE dominance.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Skull Crush | Melee hits: 30% chance to stun enemy 0.7s, +5 damage |
| 2 | Ground Pound | Every 8s: slam the ground for a 90px AoE (100% damage), 0.5s stun on all hit, +10 splash radius |
| 3 | Intimidation | During Berserker: enemies within 80px are slowed 30% by fear, +10 speed |
| 4 | Warlord's Cry | On entering Berserker: push all enemies 200px away in 100px radius, +10% damage |
| 5 | Eternal Berserker | Berserker State no longer crashes — instead Rage drains at 10/s after 6s until empty, then normal cooldown resumes. +15% damage. |

### Playstyle Summary
Dravan plays like a pendulum — build Rage by absorbing hits and dealing damage, explode in a Berserker window, crash and recover, repeat. Bloodthirst players chain Rage as fast as possible for maximum uptime; Iron Fury turns him into a punishing tank; Warlord uses the Berserker windows for crowd control domination on dense waves.

---

## Hero 3 — Solen
**Role:** Trap Builder / Engineer
**Element/Theme:** Runic Machinery — amber runes, brass cogs, mechanical sigils

**Lore:** Solen was the last living engineer of the Runic Academies before they burned. She survived by building things that kept her company in the ruins — things with teeth. She carries a satchel of partially-assembled mechanisms and an absolute refusal to be anywhere near the enemies her contraptions are destroying.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 75 | 160 | 16 | 130 | 900ms | rune-bolt (places a rune trap) |

### Core Mechanic
Solen's attack places a **Rune Trap** at the targeted location (cursor/nearest enemy direction, up to 130px range). Traps are static objects on the ground that trigger when an enemy walks within 30px, dealing damage and applying an effect. Solen can have up to **4 active traps**; placing a 5th destroys the oldest. Traps last 15 seconds or until triggered. The game loop rewards pre-seeding chokepoints before waves arrive — Solen rewards map awareness over reaction speed.

### Attack Pattern
Solen throws a brass-colored rune disc that lands at the target point and embeds in the ground with a glowing amber sigil. Triggered traps flash orange and explode with rune-particle effects. Visually distinct from projectiles — traps are stationary glowing ground markers.

### Branch 1 — Demolition (amber-orange, #ff8800)
**Theme:** High-damage traps — burst kills, chain reactions.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Overcharge | Trap trigger AoE radius +30px (60px total), +15% damage |
| 2 | Chain Reaction | Trap kill: triggers nearest trap within 100px (chain reaction), +10% damage |
| 3 | Cluster Rune | Place 2 traps at once (uses 1 attack, counts as 2 placed), +5 damage |
| 4 | Concussive Blast | Trap explosion: stun enemies 1s, knockback 150px, +10% damage |
| 5 | Runestorm | Every 12s: all active traps trigger simultaneously (regardless of proximity), +20% damage |

### Branch 2 — Arcane Grid (deep amber, #cc6600)
**Theme:** Trap longevity and passive income — more traps active, more sustained damage.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Extended Fuse | Trap lifespan +10s (25s total), +2 max traps (6 total) |
| 2 | Proximity Pulse | Traps pulse 10% damage every 2s to enemies within 45px even before triggering, +5 damage |
| 3 | Reinforced Casing | Traps have 30 HP — enemies must deal 30 damage to destroy them instead of triggering (still triggers for player-nearby enemies), +10% damage |
| 4 | Grid Network | Enemies slowed 35% while between two active traps within 120px of each other, +10% damage |
| 5 | Arcane Overload | At max trap count (6), Solen gains +25% damage and -15% attack CD; losing a trap removes the bonus for 3s, +10% damage base |

### Branch 3 — Saboteur (teal-green, #009977)
**Theme:** Utility and control — slow, poison, and area denial traps.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Toxic Canister | Traps release a 60px poison cloud (15% damage/s, 4s) on trigger, +3 damage |
| 2 | Freeze Rune | Trap hit: freeze enemy 1.5s (rooted, 0 speed), +10% damage |
| 3 | Alarm Net | Traps within 80px of each other share trigger radius — triggering one triggers both (daisy-chain), +3 damage |
| 4 | Mimic Trap | Every 5th trap placed is a Mimic — appears identical but deals 3× damage, +15% damage |
| 5 | Minefield | Placing a trap no longer consumes attack CD (traps still limited to cap); attack CD instead recharges at 2× rate. Trap damage +25%. |

### Playstyle Summary
Solen rewards planning — run ahead, seed chokepoints, fall back and let the traps work. She is a mid-range kiter who excels at wave control and struggles against fast flanking enemies (Scorpions). Demolition creates satisfying chain-kill moments; Arcane Grid plays like a tower defense layer on top of the survivor loop; Saboteur creates zone-denial playthroughs where no enemy gets through cleanly.

---

## Hero 4 — Vorn
**Role:** Chain Tether Fighter
**Element/Theme:** Iron / Chains — heavy metal, rust and blood, kinetic energy

**Lore:** Vorn was a slave who learned that the only weapon he would always have was the chain attached to his wrists. He learned to love it. Years later the chains are gone but he carries new ones, of his own making. Every length of iron between him and an enemy is a leash he controls.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 110 | 120 | 24 | 200 | 800ms | chain-hook (launches chain) |

### Core Mechanic
Vorn's attack launches a **Chain Hook** that latches onto the first enemy hit, creating a **Tether** (2s duration). While tethered, the enemy is dragged 100px toward Vorn at 80px/s and takes 15% damage per second (continuous). Vorn can have up to **2 active Tethers** simultaneously. Tethered enemies cannot flee beyond the tether length (200px). The core gameplay feel is pulling enemies into melee danger zones — draw in isolated targets, yank Golems off their paths, anchor fast Scorpions.

### Attack Pattern
A visible chain segment extends from Vorn toward the target direction, the hook latches on contact (appears as a pale-iron chain with red-tint links stretching between the two bodies). On tether expiry or enemy death, the chain snaps back with a recoil visual. Missed hooks travel full range and return with no effect.

---

### Branch 1 — Ironmaster (steel grey, #8899aa)
**Theme:** Damage maximisation — tethers become execution tools.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Barbed Hook | Tether hit: enemy bleeds 20% damage/tick × 5 ticks (2.5s), +5 damage |
| 2 | Double Pull | Max tethers +1 (3 total); chain hook fires 2 hooks at slight angle spread, +10% damage |
| 3 | Yank | Instantly drag tethered enemy 180px toward Vorn on hook land (was gradual), +5 damage |
| 4 | Bone Breaker | Tethered enemy: -30% armor during tether; Vorn deals +25% damage to tethered targets, +10% damage |
| 5 | Whiplash | On tether expiry: chain snaps dealing 2× base damage to the target and 80% damage AoE 50px around landing point, +15% damage |

### Branch 2 — Warden (dark iron, #445566)
**Theme:** Crowd control and map domination — tether the whole wave.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Long Reach | Chain range +60px (260px total), +10% range |
| 2 | Anchor | Tethered enemies are fully rooted (cannot move, tether still drags them periodically in 0.5s pulses), +10% damage |
| 3 | Entangle | Tether hits: also chains to 1 nearby enemy within 60px of the primary target (secondary takes 50% damage), +5 damage |
| 4 | Iron Curtain | Active tethers slow all enemies within 80px of the chain midpoint by 40%, +15 splash radius |
| 5 | Mass Arrest | Every 15s: launch chains to all enemies within 200px simultaneously (1 tether each, max 6 at once), 5s duration. Cooldown between uses. +10% damage. |

### Branch 3 — Momentum (rust-orange, #cc5522)
**Theme:** Use tethers for mobility — slingshot toward enemies, chain Vorn's movement.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Swing | After releasing a tether, Vorn gains +25% speed for 2s, +10 speed base |
| 2 | Grapple | Vorn can pull himself toward the tethered enemy instead of dragging them (toggle per tether, default drags enemy), +10% speed |
| 3 | Kinetic Charge | After Vorn travels 150+ px via Grapple: next melee hit deals 2× damage and stuns 0.8s, +10% damage |
| 4 | Centrifuge | While 2+ tethers active: Vorn's melee range +40px, and he gains 15% damage reduction, +5 damage |
| 5 | Chain Dance | Every 3rd tether land: Vorn spins all tethered enemies in a 100px radius circle briefly, dealing 1.5× damage to all enemies in the swept area (AoE sweep). +15% damage. |

### Playstyle Summary
Vorn controls the battlefield through literal physical control of enemies — not fire or ice, but iron. He is a bruiser (110 HP, low speed) who compensates with reach and crowd control. Ironmaster turns him into a high-single-target damage specialist; Warden locks entire waves in place; Momentum is a chaotic melee-dive playstyle that uses his chains like a grappling hook to close ground instantly.

---

## Hero 5 — Aelith
**Role:** Arcane Boomerang Duelist
**Element/Theme:** Arcane Wind — spinning geometric shapes, wind-cut trails, pale blue-white

**Lore:** Aelith was trained as a duellist who never stood still, in a tradition that holds that the still fighter is the dead fighter. Her weapons are enchanted rings that return to her on a whispered word. She has no fixed fighting style because she refuses to be predicted.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 85 | 170 | 22 | 220 | 700ms | boomerang (returning projectile) |

### Core Mechanic
Aelith throws a **Boomerang** — a projectile that travels outward to max range then returns to her position, dealing damage on both the outward and return pass. Each attack fires one boomerang; the return pass deals 70% of base damage. If Aelith **moves into the return path** (intercepts the boomerang before it reaches her), she **catches it early** and reduces the attack CD by 300ms — rewarding active repositioning. She can have 2 boomerangs in flight simultaneously.

### Attack Pattern
Pale-blue spinning disc projectile. Outward arc: slight curved path toward nearest enemy cluster. Return arc: travels back toward Aelith's current position (not origin). Visual: wind-trail ribbons, small arcane sparkle on hits. Return-catch: brief white flash on Aelith, audible chime.

### Branch 1 — Sharpedge (ice-white, #aaddff)
**Theme:** Raw damage and pierce — maximize hits per throw.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Razor Arc | Boomerang pierces through all enemies (no pierce limit on outward pass), +10% damage |
| 2 | Double Ring | Throw 2 boomerangs per attack (side-by-side, 20px spread), +10% damage |
| 3 | Lacerate | Each boomerang hit inflicts bleed: 15% damage × 4 ticks (2s), +5 damage |
| 4 | Keen Edge | Return pass damage increased to 100% (was 70%); catching boomerang early also deals 50% damage in 40px AoE around Aelith, +10% damage |
| 5 | Hurricanes | Boomerangs orbit nearby enemy clusters 1 full loop before returning; each orbit hit deals 80% damage. Total potential hits per throw: up to 5. +15% damage. |

### Branch 2 — Windrunner (sky-blue, #5599ff)
**Theme:** Mobility and catch-rewarding — speed-oriented high-APM.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Fleet Feet | Catching a boomerang early grants +20% speed for 3s (stackable), +15 speed base |
| 2 | Wind Dash | Every 5s: Aelith dashes 120px in movement direction (auto), briefly phasing through enemies, +10 speed |
| 3 | Aerial Ballet | While moving at full speed: boomerangs deal +20% damage; while standing still: -10% damage penalty, +10 speed |
| 4 | Tailwind | Successful early-catch resets Wind Dash CD by 2s; also increases throw range by 30px for next throw, +5 damage |
| 5 | Untouchable | During Wind Dash: invulnerable to damage; Wind Dash CD reduced to 3.5s. +15% damage. |

### Branch 3 — Chaos Arc (violet, #9966dd)
**Theme:** Unpredictable ricochet patterns — AoE via bouncing.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Ricochet | Boomerang bounces to 2 additional enemies within 80px on outward pass (each bounce 70% damage), +5 damage |
| 2 | Cyclone | On catching or boomerang returning: release a 60px wind gust AoE for 50% damage and 30% slow, 2s, +10% damage |
| 3 | Arc Madness | Boomerang throw angle randomised ±20°; compensated by +3 max bounces (chaos is rewarded, not punished), +10% damage |
| 4 | Shockwave Ring | Every 4th throw: boomerang expands to 3× size, 120px AoE on return hit, +5 damage |
| 5 | Vortex | Active boomerangs pull nearby enemies 50px toward their flight path, creating an enemy-funneling effect. +20% damage. |

### Playstyle Summary
Aelith is a high-skill ranged fighter who rewards constant movement and spatial awareness — catching your own boomerangs is the engine that powers her. She is fast but squishy (85 HP), best played by weaving through return trajectories. Sharpedge is straightforward high-DPS; Windrunner is a parkour-style dash-kiter; Chaos Arc creates chaotic wide-AoE carnage that rewards positioning near dense packs.

---

## Hero 6 — Morrath
**Role:** Plague Doctor / Aura Stacker
**Element/Theme:** Disease / Miasma — sickly green-yellow, rotting flesh particles, fume clouds

**Lore:** Morrath was a physician who concluded that most plagues were more efficient than most swords. He has since dedicated himself to testing this hypothesis at scale. He wears his old plague-doctor beak mask not for protection — the disease no longer interests him as threat, only as tool.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 90 | 130 | 8 | 0 | 1000ms | aura-pulse (expanding miasma ring) |

### Core Mechanic
Morrath has no directional attack. His attack triggers a **Miasma Pulse** — an expanding ring of toxic gas (radius 80px by default) that emanates from his body and damages all enemies it passes through. Additionally, Morrath passively emits a **Contagion Aura** — a constant 30px toxic zone around him that deals 5 base damage per second to all enemies within it. The two mechanics interact: enemies hit by both deal more damage (see Branch 1). The loop is purely about staying mobile and dense — every second enemies are near him, they're dying.

### Attack Pattern
Expanding ring visual: yellow-green translucent circle expands from Morrath's position at 200px/s, fading at edge radius. Continuous aura: pulsing green haze on the ground around him (30px radius, visible but subtle). Both use green damage numbers.

### Branch 1 — Pestilence (yellow-green, #99cc00)
**Theme:** Escalating disease — stacking DOT, pandemic spread.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Virulent | Miasma pulse applies Plague DOT: 8 damage/s for 3s; +5% pulse damage |
| 2 | Contagion | Plague spreads to 2 enemies within 50px of a Plagued enemy (once per spread per enemy), +10% damage |
| 3 | Epidemic | Plague duration +2s (5s total); Plagued enemies take +20% damage from all sources, +10% damage |
| 4 | Pestilence Cloud | On enemy death while Plagued: releases 40px poison cloud (10 damage/s, 3s) at death position, +5 damage |
| 5 | Black Death | Plague now stacks up to 3 times on a single enemy — each stack adds 8 damage/s; third stack causes the enemy to explode on death for 100% damage AoE 60px. +15% damage. |

### Branch 2 — Miasma (deep green, #336600)
**Theme:** Maximize aura and pulse range — be the toxic zone.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Thick Fog | Contagion Aura radius +30px (60px total); aura damage +3/s |
| 2 | Caustic | Contagion Aura slows enemies 30%; Miasma pulse also slows 30% for 2s, +10% damage |
| 3 | Suffocation | Enemies in aura for 3+ consecutive seconds are silenced (Golem slam ability suppressed), +10% damage |
| 4 | Toxic Bloom | Aura pulses every 3s spontaneously (independent of attack CD), dealing 50% pulse damage, +10% damage |
| 5 | Death Miasma | Morrath becomes immune to his own effects; Contagion Aura expands to 110px; aura damage increases to 15/s. +20% damage. |

### Branch 3 — Apothecary (pale ochre, #cc9900)
**Theme:** Survivability through disease — drain enemy life, bolster Morrath's healing.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Life Drain | Contagion Aura: heals Morrath 1 HP per enemy per second within range (max 10 HP/s), +2 HP/s regen base |
| 2 | Noxious Armor | +20% armor; when hit, release 40px miasma burst for 40% damage, +5% armor |
| 3 | Elixir | On kill: 25% chance to drop a healing vial (heals 20% max HP when walked over, lasts 8s), +5 damage |
| 4 | Toxin Lattice | Each enemy currently within Contagion Aura reduces Morrath's damage taken by 3% (max 30%), +10% damage |
| 5 | Parasitic | All damage Morrath deals heals him for 15% of that damage. +20% damage. |

### Playstyle Summary
Morrath is a close-range sustainer who wants to be surrounded — unlike every other hero, his power increases as the horde closes in. He is squishy when isolated but nearly unkillable inside a dense pack with the right build. Pestilence is the "let the plague do the work" passive-kill build; Miasma makes him a walking death zone; Apothecary turns enemy density into a healing engine, enabling deep-wave survival.

---

## Hero 7 — Thessaly
**Role:** Gravity Mage
**Element/Theme:** Gravitational Force — white-violet energy, compressed matter, lens-flare distortion

**Lore:** Thessaly studied the intervals between things — the nothing between stars, the emptiness inside matter. She learned to control it. She does not throw spells at enemies; she rearranges the space they occupy until the arrangement becomes fatal.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 72 | 150 | 18 | 200 | 900ms | gravity-well (placed singularity) |

### Core Mechanic
Thessaly places **Singularities** — point-gravity zones at targeted locations that **pull all enemies within 100px toward their center** at 60px/s continuously. A Singularity lasts 5 seconds and deals 18 damage/s to all enemies within 30px of its center. Thessaly can have **2 active Singularities** simultaneously. The mechanic inverts the survivor loop: instead of running from enemies, she shapes where enemies go. Placing two Singularities creates crossing gravity fields that grind enemies against each other.

### Attack Pattern
Placing animation: Thessaly extends a hand, a violet-white lens distortion expands at the target point, then collapses inward forming a visible "dark star" marker. Enemies visibly slide toward it. Damage at center is represented by distortion particle effects on the enemy sprite. 

### Branch 1 — Collapse (violet-white, #cc88ff)
**Theme:** Singularity damage and density — pull enemies in and destroy them.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Dense Core | Singularity pull radius +30px (130px), center damage +8/s (26/s total), +5 damage |
| 2 | Compression | Enemies at Singularity center (within 20px) take +40% damage from all sources (compressed), +10% damage |
| 3 | Tidal Force | When 2 Singularities are active simultaneously, enemies between them take 50% damage/s from the competing gravity, +5 damage |
| 4 | Event Horizon | Enemies cannot escape Singularity pull (speed reduced to 0% while in range), +10% damage |
| 5 | Implosion | On Singularity expiry: explodes for 3× base damage in 80px AoE (pulled enemies take full burst), +15% damage |

### Branch 2 — Warp (deep violet, #770099)
**Theme:** Repositioning — use gravity for mobility tricks and enemy displacement.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Antigravity | Alternate attack mode: place a Repulsion Zone (pushes enemies 80px away, 4s), +10 range |
| 2 | Gravity Sling | Enemies ejected from an expired Singularity travel 200px in random direction, dealing 50% damage to enemies they collide with, +10% damage |
| 3 | Phase Shift | Thessaly can pass through enemies for 2s after placing a Singularity (CD 6s); use for escape repositioning, +10 speed |
| 4 | Orbital Decay | Singularities last +3s (8s total); during last 2s they shrink pull radius but triple center damage, +10% damage |
| 5 | Gravitational Lens | Thessaly's other projectile attacks (any generic upgrades) bend toward Singularity centers within 100px, increasing effective aim, +20% damage |

### Branch 3 — Accretion (navy blue, #334499)
**Theme:** Stacking — accumulate matter and mass for growing power.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Mass Accretion | Each enemy killed inside a Singularity permanently increases next Singularity's pull radius by 2px (max +40px, persists entire run), +5 damage |
| 2 | Dark Matter | Each enemy killed inside a Singularity boosts Thessaly's damage by 1% for 20s (stacks up to 30%), +10% damage |
| 3 | Singularity Cascade | Max Singularities +1 (3 total); CD reduced by 200ms, +10% damage |
| 4 | Gravity Armor | For each active Singularity: Thessaly gains +10% damage reduction (max +30%), +5% armor base |
| 5 | Star Birth | After 8+ kills in Singularities: next placed is a Super Singularity — double radius, double damage, 3× pull force, 6s duration. Recharges every 20 kills. +15% damage. |

### Playstyle Summary
Thessaly is a control-oriented artillery mage whose strength grows with tight pack density. She plays from mid-range, placing Singularities in the path of incoming waves rather than tracking enemies. Collapse focuses on raw density-damage payoffs; Warp is a chaotic crowd-scatter build that uses gravity offensively and defensively; Accretion is a scaling build that becomes more powerful the longer the run goes.

---

## Hero 8 — Craw
**Role:** Shapeshifter / Dual Form
**Element/Theme:** Primal Beast — amber-green, bestial muscle, bone-protrusion, rune-scarred skin

**Lore:** Craw does not remember the ritual that broke him in half — only that there are two of him now, sharing a body in shifts. The human half plans. The beast half executes. They have learned to cooperate, mostly.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 100 | 140 | 20 | 70 | 600ms | claw-swipe (Human Form) |

### Core Mechanic
Craw has **two forms** with a **manual toggle** (keybind, no CD): **Human Form** and **Beast Form**. Each form has different stats and a different attack:
- **Human Form** — Stats as above. Attack: claw swipe (melee, 70px, 600ms). Gains +1 **Feral Stack** per enemy killed (max 10).
- **Beast Form** — Transforms at cost of 5 Feral Stacks (cannot transform without 5 stacks). Stats: HP shared, Speed +40, Damage +12, Range +20. Attack: pounce-lunge (dashes 80px toward nearest enemy, 60px AoE slam, 500ms CD). Beast Form lasts until Feral Stacks are all consumed (drains 1 stack per attack in Beast Form) — at 0 stacks, auto-reverts to Human Form.

Branches develop one or both forms.

### Attack Pattern
**Human Form:** Standard side-view slash, short arc. **Beast Form:** Craw crouches and launches, leaving a dust-cloud at origin and slamming at target with a screen-shake micro-pulse. Visual: skin tears, bone-thorns emerge during transformation (particle burst). Return to human is a brief kneel animation.

### Branch 1 — Primal (dark green, #224400)
**Theme:** Beast Form dominance — maximize Beast uptime and power.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Quick Shift | Transform requires only 3 Feral Stacks (was 5); Beast Form drains 1 stack per 1.5s instead of per attack, +10% damage |
| 2 | Bloodlust | Beast Form pounce: on kill, restore 1 Feral Stack, +5 damage |
| 3 | Apex | Beast Form: +20% damage, +20 speed (stacks with form bonus), +10% damage |
| 4 | Endless Hunt | Beast Form generates 1 Feral Stack per 3s passively (so partial self-sustain in beast mode), +5 damage |
| 5 | True Beast | In Beast Form: Craw cannot be reduced below 1 HP for 3s (once per Beast Form activation). Beast pounce AoE +30px. +15% damage. |

### Branch 2 — Predator (bone-white, #ddccaa)
**Theme:** Human Form combo engine — stack Feral fast, reward the rhythm.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Stack Hunter | Killing with Human Form swipe grants +2 Feral Stacks (was +1), +5 damage |
| 2 | Mark and Strike | On transform to Beast: first attack deals 2× damage, +10% damage |
| 3 | Savagery | Human Form claw swipe attack speed +25% (CD ×0.75), range +10px, +5 damage |
| 4 | Mauler | Human Form hits apply Rend: 20% damage/tick × 3 ticks (1.5s); Rend stacks up to 3×, +10% damage |
| 5 | Alpha Instinct | At max Feral Stacks (10): Human Form damage +40% until transformed. Incentivises delaying transform for burst window. +15% damage. |

### Branch 3 — Hybrid (amber, #cc8800)
**Theme:** Blend both forms — synergies between transitions.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Echoes | On returning to Human Form: trigger a free Beast pounce at current position (no stack cost), +5 damage |
| 2 | Surge | Each form switch: +20% speed for 3s, +10 speed base |
| 3 | Shared Rage | Armor in Human Form = number of Feral Stacks × 2% (max +20% armor); +5% armor base |
| 4 | Metamorphic | On transform to Beast: heal 8% max HP; on revert to Human: heal 5% max HP, +10% damage |
| 5 | Singularity of Form | While at exactly 5 Feral Stacks: both forms active simultaneously for 5s (all stats blended: +6 damage, +20 speed, +10px range, full pounce + swipe alternating). CD 20s after ending. +10% damage base. |

### Playstyle Summary
Craw is a rhythm-based melee fighter whose power comes from cycling between forms at the right moment. The Feral Stack meter creates a visible build-and-spend loop that rewards attention to the stack count rather than just mashing attacks. Primal leans all-in on beast form; Predator optimises the human-form stacking engine; Hybrid rewards fluid form-cycling with cumulative buffs on every transition.

---

## Hero 9 — Serael
**Role:** Curse Weaver / Debuffer
**Element/Theme:** Dark Magic / Runes — deep red-black, hex symbols, bone-carved sigils, forbidden script

**Lore:** Serael collects curses the way other scholars collect books. She found that every affliction, properly understood, is merely a force with a direction. She has spent her life learning to point them elsewhere. The enemies she kills do not always know they have been killed — they simply find that everything has gone wrong at once.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 70 | 145 | 12 | 160 | 700ms | hex-bolt (marks enemy with a curse) |

### Core Mechanic
Serael's attacks place a **Curse Mark** on a target enemy (up to 3 marks on different enemies simultaneously). Marked enemies glow with a dark red sigil. Curse Marks deal 8 damage/s DOT passively. The key mechanic: **Curse Detonation** — when a Curse-Marked enemy dies, its mark explodes in a 70px AoE dealing 150% of accumulated DOT damage to nearby enemies, and the curse **transfers** (jumps to 1 nearest unmarked enemy within 80px). This chain-propagation loop means the longer a curse runs before the enemy dies, the bigger the detonation.

### Attack Pattern
Serael throws a slow-moving dark-red rune projectile that tracks toward the nearest unmarked enemy (or refreshes an existing mark). On mark application, the sigil burns onto the target with a flash of dark light. DOT shows as dark-red damage numbers. Detonation is a burst of crimson rune-fragments exploding outward.

### Branch 1 — Affliction (blood red, #880000)
**Theme:** Escalate curse damage — more marks, more DOT, bigger detonations.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Hexcharm | Max curse marks +1 (4 total); new marks refresh to full on re-application, +5 damage |
| 2 | Dark Resonance | Each additional curse on the same target (refresh) adds +3 damage/s DOT stack (up to +15/s), +10% damage |
| 3 | Malevolence | Detonation radius +30px (100px), detonation damage increased to 200% accumulated DOT, +10% damage |
| 4 | Amplification | Cursed enemies take +25% damage from all sources (not just Serael's), +5 damage |
| 5 | Apocalyptic Curse | On detonation: cascade jumps to 3 enemies (was 1) within 100px; each jump target is immediately fully cursed. +20% damage. |

### Branch 2 — Entropy Seal (dark violet, #440044)
**Theme:** Slow and weaken — curses as hard CC and debuff platform.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Weakness Rune | Cursed enemies move 30% slower (slow applied while mark is active), +10% damage |
| 2 | Silence Seal | On detonation: enemies in AoE are silenced 1.5s (no special abilities — Golem slam suppressed), +10% damage |
| 3 | Vulnerability | Cursed enemies have -20% armor; after detonation, debuff persists 3s on nearby enemies, +5 damage |
| 4 | Inevitability | Curse marks cannot be removed; cursed enemies cannot regenerate HP (blocks Golem-tier HP regen), +10% damage |
| 5 | Doom | Cursed enemy below 10% HP: instantly detonates (no need to wait for kill); detonation damage tripled at max accumulated DOT. +15% damage. |

### Branch 3 — Bloodline (dark maroon, #663300)
**Theme:** Life drain and sustain — curses feed Serael.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Siphon | Each tick of Curse DOT heals Serael 0.5 HP (with 4 marks active: 2 HP/s heal), +2 HP/s regen base |
| 2 | Carrion Feast | On detonation: Serael heals 10% max HP, +5 damage |
| 3 | Parasitic Hex | Serael gains +2% damage for each active curse mark (max +8%), resets if marks expire naturally (not by kill), +10% damage |
| 4 | Mark of the Undying | Cursed enemies that die revive as 30% HP ghosts for 3s under Serael's partial control (they walk toward other enemies and deal 30% damage on contact before dissolving), +5 damage |
| 5 | Blood Covenant | At 4 active marks: Serael becomes immune to damage for 3s (the curse network shields her). CD 30s. +15% damage. |

### Playstyle Summary
Serael rewards a methodical playstyle — apply marks to priority targets, let the DOT accumulate for bigger detonations, manage propagation chains. She is the weakest direct-damage hero but becomes devastating against dense waves where detonation chains cascade. Affliction is pure DPS escalation; Entropy Seal turns her into a CC-focused controller who softens every wave; Bloodline is a drain-sustain build that makes her effectively unkillable given the right number of cursed targets.

---

## Hero 10 — Vethis
**Role:** Time Distorter
**Element/Theme:** Temporal Anomaly — chrome-silver, light-blur afterimages, sand-glass particles

**Lore:** Vethis experienced his own death at age twenty-three. He watched it happen from slightly ahead of the moment it occurred, which was enough time to step aside. Since then he has lived in a state of partial chronological displacement — always a half-second ahead of the present. He finds it useful.

### Base Stats
| HP | Speed | Damage | Range | Cooldown | Attack Type |
|----|-------|--------|-------|----------|-------------|
| 78 | 165 | 20 | 170 | 750ms | time-burst (temporal bolt) |

### Core Mechanic
Vethis has a **Temporal Charge** meter (0–5 charges, gained 1 per attack, max charge rate 1 per 750ms). At any time he can spend charges:
- **1 Charge: Time Slow** — slows all enemies on screen by 40% for 2s (personal cooldown 4s).
- **3 Charges: Rewind** — Vethis teleports back to his position from 3 seconds ago (escape mechanic; retains current HP). CD 10s.
- **5 Charges: Temporal Cascade** — all active temporal effects (slows) are extended by 4s and Vethis deals +50% damage for 4s.

This creates a resource management layer on top of standard attacks — do you spend 1 charge constantly for slows, save for Rewind escapes, or hoard for the Cascade burst?

### Attack Pattern
Temporal bolt: silver-chrome projectile that leaves a brief after-image trail. On hit, the enemy briefly displays a chrome-desaturated color flicker (time distortion visual). During Time Slow, all enemies on screen have a visible "slow-motion" particle shimmer. During Temporal Cascade, Vethis emits a silver-light aura.

### Branch 1 — Chronos (silver-white, #ccccff)
**Theme:** Maximize Temporal Cascade — fast charge build, burst damage windows.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Rapid Timeline | Gain 1 Temporal Charge every 550ms (was per attack), +10% damage |
| 2 | Accelerate | Temporal Cascade duration +2s (6s total); also gains +20% speed during Cascade, +10% damage |
| 3 | Paradox | During Temporal Cascade: attacks fire 2 bolts per shot (second bolt at 60% damage), +5 damage |
| 4 | Overwrite | After Temporal Cascade ends: Vethis briefly enters a 2s invulnerability window as the timeline stabilizes, +10% damage |
| 5 | Eternal Moment | Temporal Cascade recharge: on reaching 5 charges, 30% chance to not spend them (loop Cascade back-to-back). +20% damage. |

### Branch 2 — Warden of Time (deep slate, #445566)
**Theme:** Defensive use — Rewind mastery, temporal escape and reset.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Echo Step | Rewind leaves a temporal echo at departure point — any enemy touching it takes 80% damage, +5 damage |
| 2 | Extended Memory | Rewind looks back 5s instead of 3s (more precise escape options), +10% armor |
| 3 | Safe Haven | Rewind also heals Vethis for 15% max HP on activation, +5 damage |
| 4 | Cheaper Escape | Rewind costs 2 Charges (was 3); Time Slow costs 0 Charges (always available, CD 5s), +10% damage |
| 5 | Grandfather Paradox | Rewind triggers a 90px time-shatter AoE (150% damage) at the rewound-to position on arrival. +15% damage. |

### Branch 3 — Entropy (amber-rust, #cc8833)
**Theme:** Time as a weapon — age and decay, enemies move slower and die faster.
| # | Skill Name | Effect |
|---|-----------|--------|
| 1 | Temporal Decay | Temporal bolt hits apply Age: enemy takes 15% more damage for 4s; stacks up to 3×, +5 damage |
| 2 | Crystallize | Time Slow effect: any enemy at 0 HP during slow is instantly killed (frozen out of time), +10% damage |
| 3 | Entropy Field | Passive aura (50px radius): enemies within it age 20% faster, losing 10% attack speed and dealing 10% less damage, +5 damage |
| 4 | Temporal Scar | Enemies hit by Time Slow retain a 15% speed penalty for 5s after the slow ends (residual time damage), +10% damage |
| 5 | Heat Death | Once per run: trigger a 6s global Time Stop (all enemies completely frozen); Vethis deals double damage during this window. Activates automatically at 30% HP. +15% damage. |

### Playstyle Summary
Vethis is a thoughtful high-mobility caster who rewards knowing when to spend Temporal Charges and when to hoard them. He plays from mid-range, maintaining charge generation through consistent attacks. Chronos is a glass-cannon burst cycle build; Warden of Time turns Rewind into a survivability cornerstone with healing and damage payoffs; Entropy makes time itself the damage vector, stacking debuffs that make dense late waves increasingly manageable.

---

## Summary Table

| # | Name | Role | HP | Speed | Dmg | Range | CD | Key Mechanic |
|---|------|------|----|-------|-----|-------|----|--------------|
| 1 | Vael | Void Summoner | 65 | 145 | 14 | 100 | 1800ms | Orbiting void fragments, max 3 active |
| 2 | Dravan | Berserker | 130 | 155 | 20 | 60 | 500ms | Rage Meter → Berserker State burst |
| 3 | Solen | Trap Builder | 75 | 160 | 16 | 130 | 900ms | Place up to 4 ground traps |
| 4 | Vorn | Chain Tether | 110 | 120 | 24 | 200 | 800ms | Hook & Tether, drag enemies |
| 5 | Aelith | Boomerang | 85 | 170 | 22 | 220 | 700ms | Returning projectile, catch for CD reset |
| 6 | Morrath | Plague Aura | 90 | 130 | 8 | 0 | 1000ms | Expanding miasma ring + passive aura |
| 7 | Thessaly | Gravity Mage | 72 | 150 | 18 | 200 | 900ms | Placed Singularities pull enemies |
| 8 | Craw | Shapeshifter | 100 | 140 | 20 | 70 | 600ms | Human/Beast dual form with Feral Stacks |
| 9 | Serael | Curse Weaver | 70 | 145 | 12 | 160 | 700ms | Curse marks that chain on kill |
| 10 | Vethis | Time Distorter | 78 | 165 | 20 | 170 | 750ms | Temporal Charge meter (slow/rewind/burst) |

---

## Design Notes for Implementation

### New Attack Types Required
The following new `attackType` values need to be added to `HeroDef` and implemented in `Player.ts`:
- `void-pulse` — spawns a Fragment game object (custom class)
- `melee-rage` — wide-arc melee with Rage Meter HUD element
- `rune-trap` — places a Trap game object at target position
- `chain-hook` — launches Tether projectile, attaches on hit
- `boomerang` — projectile that returns on miss/range-end
- `aura-pulse` — expanding ring from player center (no direction)
- `gravity-well` — places Singularity at target position
- `claw-swipe` — standard melee (Craw human form)
- `pounce` — dash + AoE (Craw beast form, replaces `claw-swipe` on transform)
- `hex-bolt` — slow-tracking projectile with mark on hit
- `time-burst` — standard projectile + Temporal Charge HUD

### New HUD Elements Required
- Vael: Fragment counter (0/3 dots)
- Dravan: Rage bar (0–100) below HP bar
- Craw: Feral Stack counter + form indicator
- Vethis: Temporal Charge dots (0–5)
- Craw / Sifra stance: Form toggle button or keyboard indicator

### Shared Pattern with Sifra Stance
Craw's dual-form system mirrors Sifra's stance pattern (`nazarStance` style). Recommend implementing as `crawForm: 'human' | 'beast'` on Player with a `toggleCrawForm()` method guarded by Feral Stack count.

### Difficulty Positioning
| Difficulty | Heroes |
|------------|--------|
| Beginner-friendly | Dravan, Morrath, Vorn |
| Intermediate | Aelith, Craw, Solen, Vael |
| High-skill ceiling | Thessaly, Serael, Vethis |
