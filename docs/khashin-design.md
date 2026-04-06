# Khashin (Хашин) — Wind Elemental Design Doc

**Version:** 1.0 | **Date:** 2026-04-05

---

## Lore

Khashin has no origin that the desert remembers. The nomads who cross the Kharan Wastes speak of a figure glimpsed at dusk — walking against the wind when there is no wind, leaving no footprints in the sand. Some say he was a court sorcerer who bound the spirit of a dying sandstorm into his own body to survive a betrayal. Others say he *is* the storm, and the man-shape is simply the eye of it.

He does not seek conquest. He moves. Across salt flats, across bone-bleached ruins, across the shallow graves of armies. The wind that follows him is not weather — it is appetite. It tears at flesh and stone with equal indifference, scattering both into the same amber haze. Those who have faced him and lived describe an unnerving stillness at his center, a calm so total it feels like the moment before a scream.

What he hunts, or flees, no one can say. He never stops long enough to explain.

---

## Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 90 | Below average — mobility is the defense |
| Speed | 130 | Highest base speed in the roster |
| Damage | 18 | Moderate; scales through debuff synergies |
| Range | 160 | Long — wind attacks reach across the field |
| Attack Cooldown | 900ms | Moderate cadence |
| Attack Type | `windslash` | Ranged arc of compressed air |

---

## Base Attack — Wind Slash

Khashin fires a **wide crescent arc of compressed air** toward the nearest enemy. The arc is fan-shaped (roughly 70-degree spread), passes through up to 2 targets by default, and travels at high speed. It does not explode on impact — it slices through. Visual: a semi-transparent white-gold scythe curve that dissipates after ~200px.

This is distinct from existing attacks:
- Not a point projectile (Lyra's spear)
- Not a radial burst centered on self (Amun's shockwave)
- Not a cone from self (Sifra's lightning)
- Not an AoE ball (Ignara's fireball)
The wind arc is a *traveling fan shape* — wide angle, long reach, thin hitbox depth.

---

## Stance System — Sirocco / Haboob Toggle (Q Key)

| Stance | Name | Visual | Effect |
|--------|------|--------|--------|
| Default | **Sirocco** (cutting wind) | Blue-white crescent arcs | Standard wind slash — fast, piercing, long range |
| Toggled | **Haboob** (sandstorm wall) | Orange-brown dust arcs | Slower, shorter range, but applies **Blinded** debuff on hit (Blinded enemies have 40% reduced move speed and 25% reduced attack accuracy for 2s) |

Haboob stance sacrifices range and speed for crowd control. The two stances gate branch availability identically to Sifra: the Gale and Dune branches are stance-dependent; the Mirage branch is available in either stance.

---

## Branch Overview

| Branch | Name | Color | Stance | Theme |
|--------|------|-------|--------|-------|
| 1 | **Gale** | `#88DDFF` | Sirocco | Offensive — tornado anchors, arc burst, windwall |
| 2 | **Dune** | `#E8A040` | Haboob | Debuff/control — blind escalation, sand armor, dust devils |
| 3 | **Mirage** | `#CCAAFF` | Either | Mobility/evasion — dash, phantom decoy, drift |

---

## Branch 1: Gale (`#88DDFF`)

**Theme:** Raw wind power — push enemies back, spawn persistent tornados, amplify arc damage, wall of wind.

| # | ID | Name | Description | Key Effect |
|---|-----|------|-------------|-----------|
| 1 | kw1 | Razor Wind | Wind slash gains +25% dmg and cuts through 1 additional target | Pierce cap: 2→3; damage ×1.25 |
| 2 | kw2 | Gust Strike | Wind slash knocks back hit enemies 150px | Knockback 150px on every slash hit |
| 3 | kw3 | Dust Devil | Every 5th attack spawns a small tornado that drifts 200px forward, dealing 30% dmg/tick for 2s | Persistent projectile: 2s lifetime, 35px radius, 30% dmg/tick |
| 4 | kw4 | Cyclone Surge | Dust Devils grow 50% larger and last 1s longer; +15% dmg | Dust Devil radius: 35→52px, duration: 2→3s; damage ×1.15 |
| 5 | kw5 | Eye of the Storm | Summons an anchored tornado at your position every 8s that pulses 50% dmg in 80px for 4s; +20% dmg | Stationary tornado: 4s, 80px, 50% dmg/tick, 8s CD; damage ×1.2 |

---

## Branch 2: Dune (`#E8A040`)

**Theme:** Sand and blindness — debuff stacking, sand armor, scarab swarm, lingering sand clouds.

| # | ID | Name | Description | Key Effect |
|---|-----|------|-------------|-----------|
| 1 | kd1 | Choking Sand | Blinded enemies take +35% dmg from all sources | Damage amplification on Blinded enemies |
| 2 | kd2 | Sand Armor | Gain an absorb shield equal to 25% max HP; regenerates 4s after breaking | Absorb shield: 25% maxHP, 4s regen |
| 3 | kd3 | Abrasion | Blinded enemies also have 20% armor reduction; +3 dmg | Blind debuff stacks with armor shred -20% |
| 4 | kd4 | Scarab Tide | On kill: release 4 scarabs that seek nearby enemies and apply Blind for 1.5s | On-kill: 4 seeking projectiles, Blind on contact |
| 5 | kd5 | Sandstorm Wall | Haboob arcs spawn a 3s lingering sand cloud (50px) on impact; cloud blinds and deals 15% dmg/s | On-hit lingering zone: 50px, 3s, Blind + 15% dmg/s |

---

## Branch 3: Mirage (`#CCAAFF`)

**Theme:** Evasion, deception, and speed — dash, phantom decoy, wind trails, burst escape.

| # | ID | Name | Description | Key Effect |
|---|-----|------|-------------|-----------|
| 1 | km1 | Tailwind | +20 move speed permanently; wind slash cooldown -10% | +20 speed; attack CD ×0.90 |
| 2 | km2 | Phantom Step | Every 6s: automatically dash 100px away from the nearest enemy | Auto-dash trigger: 6s CD, 100px burst |
| 3 | km3 | Mirage | On Phantom Step: leave a decoy illusion at origin for 2s that draws enemy aggro | Decoy: 2s, enemies retarget within 120px |
| 4 | km4 | Drift | While moving: leave wind trails that slow enemies by 40% (20px wide, 600ms duration) | Movement-generated slow zones |
| 5 | km5 | Desert Wind | Every 10s: omni-directional wind burst in 180px, launching enemies 300px + 3s of 50% DR | AoE knockback + damage reduction, 10s CD |

---

## Playstyle Description (Encyclopedia)

Khashin rewards players who treat survival as a geometry problem. His exceptional base speed and auto-dash tools mean he is rarely where the horde expects him to be — but low HP punishes anyone who stands still. In Sirocco stance the Gale branch turns him into a tornado factory, carpeting corridors with drifting vortexes that chew through dense packs while Khashin stays in constant motion. Haboob stance into the Dune branch flips the script entirely: a Blinded, armor-shredded enemy barely moves and dies to amplified damage before it can close the gap. The Mirage branch is the connective tissue — layering speed, phantom decoys, and persistent slow trails to make Khashin effectively impossible to corner.

---

## Design Notes — What Makes Khashin Unique

1. **Traveling fan arc** — no other hero has a fan-shaped traveling hitbox
2. **Persistent drifting tornados** — first "mobile lingering zone" (Caltrops/puddles are stationary)
3. **Blind debuff** — new debuff type (Sifra=freeze, Amun=stun, Nazar=root, Khashin=blind)
4. **Decoy mechanic** — first aggro-redirect tool in the game
5. **Two named stances** — Sirocco (blue-white, sharp) vs Haboob (amber-orange, heavy)
