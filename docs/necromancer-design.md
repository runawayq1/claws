# Necromancer (Некромант) — Master of the Veil

**Version:** 1.0 | **Date:** 2026-04-13

---

## Lore

No one remembers what he was called before. The records were burned — not by enemies, but by the man himself. He is referred to in what surviving accounts exist as "the Veil-Walker," or simply "the one who came back," which is less a compliment than a warning. He died once, at the bottom of a mass grave after a battle whose name no longer matters. He lay there for three days under the weight of other bodies and learned, in that silence, that death is not an ending — it is a transition of function. The body stops, but the force animating it does not. It scatters. It pools in low places. It can be redirected.

He crawled out of that grave on the fourth morning and has not slept comfortably since.

What he does is not magic in the way scholars mean the word. It is closer to engineering — the exploitation of a resource that exists everywhere and is treated, by the living, as waste. The dead leave something behind. He collects it, shapes it, spends it. The red light in his staff is not conjured from nothing; it is harvested from every creature that has ever stopped breathing near him, compressed into a slow burn. His minions are not raised so much as *recalled* — the echo of a body, told to do one more thing before it disperses entirely.

He does not hate the living. He simply finds them inefficient.

---

## Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 75 | Fragile — the Necromancer's army is his armor |
| Speed | 120 | Deliberate gait; not a runner |
| Damage | 22 | Moderate; scales sharply through soul stacks and minions |
| Range | 220 | Long reach; the staff casts across the field |
| Attack Cooldown | 1000ms | Methodical; not a spammer |
| Attack Type | `soulbolt` / `summon` | Red orb projectile / spirit/skeleton summon |

---

## Stance System — Staff / Summon Toggle (Q Key)

| Stance | Name | Visual | Effect |
|--------|------|--------|--------|
| Default | **Staff** | Red orb projectile flies toward nearest enemy | Fires a `soulbolt` — a slow-moving crimson orb that pierces 1 enemy by default, dealing damage and applying **Soul Marked** (3s: +10% damage taken from all sources) |
| Toggled | **Summon** | Long casting animation raises a spirit or skeleton at cursor position | Uses the Special animation — summons a persistent minion (skeleton or wraith) that attacks nearby enemies. Minions last 12s base, up to 3 active at once by default |

The two stances define two radically different playstyles. Staff stance is a direct-damage spellcasting hero; Summon stance turns the Necromancer into an army commander who hangs back while undead fighters absorb and deal damage. Branches are available in either stance — the Void branch enhances Staff attacks, the Requiem branch enhances summons, and the Covenant branch benefits both.

---

## Branch Overview

| Branch | Name | Color | Theme |
|--------|------|-------|-------|
| 1 | **Void** | `0xcc2244` | Dark magic offense — soul bolts, death beams, curse amplification |
| 2 | **Requiem** | `0x6633aa` | Army building — stronger/more summons, minion upgrades, undead tide |
| 3 | **Covenant** | `0x44aa88` | Life drain and soul harvest — sustain, on-kill healing, blood rituals |

---

## Branch 1: Void (`0xcc2244`)

**Theme:** Raw necrotic offense. Soul bolts hit harder, curse more, and eventually become channeled death beams. Enemies marked by the Necromancer take cascading damage. Single-target DPS build.

---

**Skill 1 — Soul Rift** (`nc1`): The soul bolt fractures on impact, spraying three secondary fragments in a forward fan. Each fragment deals 30% of primary damage.
- L1: Impact spawns 3 fragments (30% dmg each), 40° fan spread; sets `hasSoulRift`
- L2: Fragments pierce 1 additional enemy; +10% primary bolt dmg
- L3: Fragments also apply Soul Marked (2s); +10% primary bolt dmg

**Skill 2 — Withering Curse** (`nc2`): Soul Marked enemies are also Weakened — they deal 15% less damage for the duration of the mark.
- L1: Soul Marked also applies Weakened (−15% enemy dmg output, 3s); sets `hasWitheringCurse`
- L2: Weakened duration extends to 4s; +8% bolt dmg
- L3: Weakened also reduces enemy move speed by 20%; sets `curseSlowActive`

**Skill 3 — Death Coil** (`nc3`): The soul bolt now bounces to the nearest unmarked enemy after hitting its first target, transferring the Soul Mark.
- L1: Bolt bounces once to nearest enemy within 120px; sets `hasDeathCoil`
- L2: Bounce range increases to 160px; bounce deals 80% of original damage (was 60%)
- L3: Bolt bounces up to 2 times; each bounce re-applies Soul Mark fresh

**Skill 4 — Hemorrhagic Mark** (`nc4`): Soul Marked enemies bleed — taking ticking necrotic damage for the mark's duration.
- L1: Soul Marked applies bleed (8% dmg/tick, 0.5s intervals, 3s); sets `hasHemorrhagicMark`
- L2: Bleed tick rate increases to 0.4s intervals; +8% bolt dmg
- L3: On bleed expiry, the enemy releases a Soul Shard — a passive pickup that restores 4 HP to the Necromancer

**Ultimate — Death Beam** (`nc5`): Every 10s, the next soul bolt transforms into a continuous death beam that channels for 1.5s, piercing all enemies in a line and applying Soul Mark to every target it touches.
- L1: Death Beam: 1.5s channel, unlimited pierce, 140% bolt dmg per tick (0.2s intervals), 10s CD; sets `hasDeathBeam`
- L2: Beam duration → 2s; also drains 2 HP from each enemy hit per tick (lifesteal)
- L3: Beam leaves a necrotic ground trail (80px wide, 3s, 12% dmg/s); sets `deathBeamTrail`

---

## Branch 2: Requiem (`0x6633aa`)

**Theme:** Army of darkness. More minions, stronger minions, specialized undead types. The Necromancer barely attacks himself — his undead horde does the work. Minion summoner build.

---

**Skill 1 — Restless Dead** (`nd1`): Increases the maximum number of active minions and extends their duration.
- L1: Max minions 3→5; minion duration 12s→18s; sets `hasRestlessDead`
- L2: Max minions → 7; minion duration → 24s
- L3: Max minions → 9; minions no longer expire from duration — only from taking lethal damage

**Skill 2 — Bone Armament** (`nd2`): Summons now raise **Skeletal Warriors** instead of base skeletons — higher HP, higher damage, and they carry crude weapons. Visual: bulkier skeleton with a sword arm.
- L1: Skeletal Warriors replace basic skeletons; +40% minion HP, +25% minion dmg; sets `hasBoneArmament`
- L2: Warriors also have a shield that blocks the first hit they receive
- L3: On Warrior death: explodes for 60% of Necromancer's damage in 50px radius; sets `boneExplosionOnDeath`

**Skill 3 — Wraith Caller** (`nd3`): Every 4th summon produces a **Wraith** instead of a Warrior — a fast-moving spirit that phases through enemies, dealing necrotic damage to all it passes through on each sweep.
- L1: Every 4th summon = Wraith (phases through enemies, 70% dmg per pass, 8s lifetime); sets `hasWraithCaller`
- L2: Wraith lifespan → 12s; deals 80% dmg per pass; wraith is immune to the first hit
- L3: Wraith pass applies Soul Marked to all enemies it touches; interval between summon triggers: every 3rd instead of 4th

**Skill 4 — Dark Command** (`nd4`): Active skill — on cooldown, the Necromancer commands all active minions to converge on the nearest enemy in a coordinated surge, dealing a burst of damage on arrival.
- L1: All minions dash toward nearest enemy (300px/s), deal 80% of their normal hit dmg on arrival; 8s CD; sets `hasDarkCommand`
- L2: Surge dmg → 120% on arrival; CD reduced to 7s
- L3: Each minion that reaches the enemy leaves a necrotic patch (40px, 2s, 15% dmg/s); CD → 6s

**Ultimate — Undying Tide** (`nd5`): Minions that die are instantly replaced by a new minion at the Necromancer's location, for 8s. The Necromancer also temporarily gains +3 max minion slots during the window.
- L1: 8s window: dead minions auto-respawn at player position; +3 max minion slots during window; 20s CD; sets `hasUndyingTide`
- L2: Window → 10s; respawned minions spawn at 100% HP (was 60%)
- L3: During window, every enemy kill also spawns a bonus minion (max 2 bonus per window); sets `undyingTideOnKill`

---

## Branch 3: Covenant (`0x44aa88`)

**Theme:** Soul harvest and blood ritual. The Necromancer feeds on death itself — every enemy killed fuels his survival and power. Life drain, HP regeneration, and escalating on-kill effects. Sustain build.

---

**Skill 1 — Soul Siphon** (`ne1`): Soul bolts now drain 5% of the damage dealt back to the Necromancer as HP.
- L1: Soul bolt hits restore 5% of damage dealt as HP; sets `hasSoulSiphon`
- L2: Lifesteal increases to 8%; also applies to minion damage
- L3: Lifesteal → 12%; on overkill (enemy had >25% HP remaining when killed), restore bonus 6 HP flat

**Skill 2 — Grave Harvest** (`ne2`): On enemy kill, a soul orb drops at the corpse's position. Touching it restores HP and briefly boosts damage.
- L1: On kill: soul orb drops (lasts 4s), collect to restore 8 HP and gain +12% dmg for 3s; sets `hasGraveHarvest`
- L2: Soul orb restores 12 HP; +12% dmg buff stacks up to 3 times
- L3: Soul orbs are attracted to the Necromancer (drift toward player at 60px/s); buff duration → 5s

**Skill 3 — Blood Ritual** (`ne3`): Every 15s, the Necromancer sacrifices 12% of current HP to empower his next 3 attacks — they deal 2× damage and each hit restores HP equal to 100% of damage dealt.
- L1: Every 15s: auto-triggers Blood Ritual (−12% current HP); next 3 attacks: ×2 dmg + full lifesteal; sets `hasBloodRitual`
- L2: Ritual cooldown → 12s; empowered attacks → 4 hits
- L3: Ritual cooldown → 10s; if HP sacrificed would drop Necromancer below 20% HP, the ritual does not trigger (safety floor); empowered attacks → 5 hits; sets `bloodRitualSafety`

**Skill 4 — Death Pact** (`ne4`): Minions are linked to the Necromancer — when a minion takes damage, 30% of it is redirected away from the minion and simply ignored (representing the necromantic bond absorbing the blow).
- L1: Active minions absorb 30% of incoming damage that would kill them (i.e., they survive lethal hits at 1 HP once per minion per 8s); sets `hasDeathPact`
- L2: Survival CD per minion reduced to 5s; when a minion triggers survival, Necromancer heals 5 HP
- L3: Survival also triggers a small necrotic burst (40px, 60% dmg) at the minion's location; sets `deathPactBurst`

**Ultimate — Lich Ascendant** (`ne5`): For 10s, the Necromancer enters Lich Form — spectral visual overlay, becomes immune to damage for 1.5s at start of form, and all soul siphon/grave harvest/blood ritual effects triple in potency. On form end, releases a death nova (150px, 80% dmg).
- L1: 10s Lich Form: 1.5s immunity on entry, ×3 sustain effects, death nova on exit (150px, 80% dmg); 30s CD; sets `hasLichAscendant`
- L2: Form duration → 12s; death nova radius → 200px; minions are also buffed (+50% dmg during form)
- L3: During Lich Form, soul bolts fire twice per attack cycle (double shot at no CD cost); on death nova hit, apply Soul Marked to all enemies struck; sets `lichDoubleShot`

---

## Playstyle Description (Encyclopedia)

The Necromancer does not survive through speed or armor — he survives through numbers and attrition. Every enemy that dies near him is a resource: a soul to harvest, a body to recall, a drop of power to reclaim. Playing him well means accepting that he is fragile alone and genuinely dangerous at the center of a functioning undead formation.

The Void branch rewards players who want the fantasy of a dark sorcerer — standing at range, cursing enemies so they bleed and weaken, chaining soul bolts between packs, and eventually unleashing the Death Beam to scythe through dense formations. It is direct, high-output, and satisfying to land.

The Requiem branch is the summoner fantasy in full: nine minions on the field by late game, a mix of armored Skeletal Warriors tanking the front line and phasing Wraiths sweeping through enemy clusters, with the Necromancer himself barely needing to fire. Dark Command lets you orchestrate a sudden focused assault; Undying Tide makes the army self-sustaining for a critical window.

The Covenant branch rewards commitment — Blood Ritual feels genuinely risky the first time (spending HP to gain power), but Grave Harvest and Soul Siphon mean a Necromancer who stands in the right place, surrounded by dying enemies, is essentially immortal. Lich Ascendant is the capstone: a 10-second window of amplified sustain, double shots, and a field-clearing nova on exit.

All three branches share a fundamental truth: the Necromancer gets stronger as the horde gets denser. Where other heroes want space to maneuver, the Necromancer wants to be surrounded — because surrounded means fed.

---

## Design Notes — What Makes the Necromancer Unique

1. **Persistent minion army** — no other hero commands persistent autonomous fighters; closest thing is Khashin's Dust Devil but it is a projectile, not an agent
2. **Soul Marked debuff** — a new debuff type that amplifies all incoming damage from any source (synergizes with both staff attacks and minion strikes)
3. **Two-mode identity** — Staff stance is a high-DPS caster; Summon stance is a pure commander who barely attacks directly; same hero, opposite fantasy
4. **Sacrifice mechanic** — Blood Ritual's HP-cost-for-power creates a unique risk/reward loop not found in other heroes
5. **On-death triggers** — bone explosions, soul orb drops, undead respawns, and death nova all activate from enemy/minion deaths, making the Necromancer's power scale *with* the kill rate rather than despite it
6. **Lich Form** — timed transformation with guaranteed survivability entry and a field-clearing exit; rewarding to time correctly, devastating when stacked with sustain upgrades
