# Crystal Muller (Крістал Мулер) — Gnome Crystal Slammer

**Version:** 1.0 | **Date:** 2026-04-05

---

## Lore

Crystal Muller was born three levels below the surface, in a mining settlement so deep that sunlight was a rumor. She spent her first forty years cracking open rock faces with a hammer twice her height, and it was during a routine deep-bore operation that she broke through into a vein of living crystal — formations that pulsed with warmth, that grew toward her lantern, that shattered enemies in her mine-gang like thrown glass when she slammed her maul down near them. She did not study this phenomenon. She simply noticed it worked.

She is not a scholar of the arcane, and she will correct you firmly if you call her one. What she understands is geology: pressure, faultlines, the way a wave travels through dense matter. When she strikes the earth, she is not casting a spell — she is releasing a tension that was already there, redirecting it, giving the crystal a direction to run. The crystals follow the angle of her blow. She has broken this down the same way she breaks down a rock face: find the grain, hit with the grain, let the material do the rest.

She came above ground because the deep mines are collapsing — something is destabilizing the lower strata, and whatever it is, it is not geological. Crystal Muller does not use words like "evil" or "corruption." She says: something is in the wrong layer, and it needs to be removed.

---

## Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 160 | Gnomes are dense and built close to the ground |
| Speed | 80 | Stocky gait, not a sprinter |
| Damage | 38 | Hard hitter |
| Range | 260 | Crystal wave travels outward in a directional cone |
| Attack Cooldown | 1400ms | Ground-slam has a wind-up; methodical not frantic |
| Attack Type | `crystalwave` | Directional crystal spike eruption |

---

## Attack Mechanic — Crystal Wave

**Ground Slam → Directional Crystal Spike Wave**

Crystal Muller raises her maul, slams the ground toward the nearest enemy, and a jagged line of crystal spikes erupts from the earth in a forward cone (roughly 40° arc). The wave travels outward to `range` distance, piercing through all enemies in its path. The spikes erupt sequentially — closest first, furthest last — giving the attack a rippling, geological feel.

- Targets the nearest enemy's position at time of slam
- Cone angle: 40° (widening slightly at distance)
- Pierces: yes, all enemies in path
- Visual: jagged crystal spike eruptions traveling outward in a line
- On contact: small slow effect (crystals cling briefly)
- Distinct from Amun: no 360° ring, no push — purely directional, spikes persist for 0.3s as brief hazard

---

## Stance System

Two-stance toggle (Q key):

| Stance | Name | Effect |
|--------|------|--------|
| Default | **Spike** | Directional line/cone — long range, narrow, piercing. Best against corridors |
| Toggled | **Eruption** | Close-range AoE burst — crystals explode in a 120px ring around self. Shorter range but hits everything nearby. Best when surrounded |

---

## Branch 1 — Shardfall (Offensive)

**Color:** `0x44aaff` (sharp blue-white)
**Theme:** Bigger, sharper, more destructive crystal waves.

| ID | Name | Description | Key Effect |
|----|------|-------------|-----------|
| cm1 | Coarse Cut | Crystal wave erupts in a wider cone | Cone angle 40°→55° |
| cm2 | Deep Vein | Spikes hit harder at max distance | Damage scales +30% at max range |
| cm3 | Shardstorm | A second offset volley fires 0.2s after the first | Double-wave per slam |
| cm4 | Crystal Shrapnel | Shattering spikes spray 3 micro-shards in a fan dealing 30% dmg | Spike-death shrapnel burst |
| cm5 | Tectonic Fury | Every 5th ground slam triggers an oversized wave — double width, double length | Every-5th superwave |

---

## Branch 2 — Geode Shell (Defensive)

**Color:** `0x99ddcc` (pale green-teal)
**Theme:** Crystal armor, barriers, and resilience.

| ID | Name | Description | Key Effect |
|----|------|-------------|-----------|
| cr1 | Stone Skin | Killing with crystal wave deposits fragments, stacking DR | +2% DR per kill, max 5 stacks, 4s decay |
| cr2 | Geode Shell | Below 50% HP, a crystal shell absorbs the next hit entirely | One-hit absorb, 20s recharge |
| cr3 | Crystal Wall | Every 8s a crystal barrier erupts perpendicular to your slam, blocking enemy movement | Temporary terrain obstacle |
| cr4 | Resonance Armor | Wave impact bounces resonance back, granting 0.5s invulnerability | Wave-triggered i-frames |
| cr5 | Living Geode | Permanent crystal lattice: +25 max HP, enemies that melee you take 15 reflected damage | HP up + melee reflect |

---

## Branch 3 — Deep Seam (Field Control)

**Color:** `0xcc99ff` (violet-purple)
**Theme:** Crystal mines, pillars, and resonance. Turning the battlefield into a minefield.

| ID | Name | Description | Key Effect |
|----|------|-------------|-----------|
| cf1 | Planted Shard | Each slam leaves a dormant crystal mine at impact that detonates on enemy contact | Mines per slam, 3s arming delay |
| cf2 | Crystal Pillar | Every 12s a crystal pillar erupts near you, damaging and slowing enemies in radius for 5s | Auto-summoned pillar hazard |
| cf3 | Fault Line | Crystal wave carves a glowing fault line; enemies crossing it take damage for 4s | Persistent ground hazard per slam |
| cf4 | Resonance Field | Pillars and mines pulse with resonance — enemies nearby move 20% slower, deal 10% less damage | Debuff aura on placed structures |
| cf5 | The Mother Lode | Once per life: catastrophic eruption of massive crystal pillars across entire screen | Full-screen eruption, 90s CD |

---

## Playstyle Description (Encyclopedia)

Crystal Muller does not cast spells — she reads the ground. Playing her means committing to a direction: every slam sends a jagged volley of crystal spikes tearing toward your nearest enemy, piercing everything in its path, and the battlefield slowly fills with the debris of her violence — mines underfoot, pillars jutting up at odd angles, fault lines glowing where waves have carved the earth. She rewards players who let enemies funnel toward them rather than running, who position deliberately so the spike cone catches three enemies instead of one, and who understand that her best defense is the same as her offense: hit the ground hard enough and everything near it suffers. She is slow, she is tough, and she is, above all, geological.

---

## Design Notes

- **Crystal Muller vs Amun:** Amun = 360° shockwave ring, pure tank. Crystal Muller = directional cone wave, gnome fantasy, field control with mines/pillars
- **Sprite concept:** Small gnome with oversized crystal-encrusted maul. Slam animation should emphasize the wind-up and ground impact
- **Crystal wave visual:** Sequential spike eruptions traveling outward (not instant like Amun's ring), blue-white crystal spikes bursting from ground
- **Eruption stance:** Ring of shorter crystal spikes around self (120px), for surrounded scenarios
