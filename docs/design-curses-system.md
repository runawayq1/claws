> **STATUS: NOT IMPLEMENTED** — Design only, no code exists yet. Last reviewed 2026-04-09.

# Curses System — Design Document

> Version: v1.0 | Date: 2026-04-07
> Status: Design only — not yet implemented

---

## Overview

Curses are an endgame layer unlocked after a player defeats a map for the first time. Each curse is a **rule change** — not purely a penalty and not purely a reward. A curse bends the game in a new direction that demands adaptation. The best curses create fresh tactical problems: you are simultaneously more powerful in one axis and more vulnerable in another.

Stacking up to 3 curses per run produces the highest challenge, the highest reward, and the most interesting interactions. Curses are unlocked slowly through specific in-game achievements. This is intentional — they are not handed to the player. Earning a curse feels like discovering a secret mode.

---

## 1. What Is a Curse?

A curse has two inseparable halves — remove either half and it stops being a curse. It becomes either a cheat or a punishment. Every curse must pass the **Duality Test**: can a skilled player exploit the buff to overcome the debuff? If yes, the curse is working as intended.

### Thematic Framing

Curses are presented as ancient seals placed on the map itself — not on the hero. The flavor text uses the second person ("the dead walk faster") rather than describing a hero ability. They feel environmental, inevitable, and slightly ominous. The player is choosing to break a seal. The consequences are not negotiable.

---

### The Curse List (Base Set — 12 Curses)

---

**C01 — BLOODTHIRST**
> *The dead hunger. So do you.*

- Debuff: All enemies move 30% faster.
- Buff: Each kill restores 3 HP.
- Design note: Early waves feel dangerous as enemies close gap faster. Mid-run, once the player has enough kill throughput, the healing becomes nearly continuous. Rewards builds with high AoE kill speed. Synergizes dangerously well with Glass Cannon.

---

**C02 — GLASS CANNON**
> *Strike like lightning. Shatter like glass.*

- Debuff: Maximum HP is halved (rounded down). Cannot be restored above the new cap by any means.
- Buff: All damage dealt is doubled.
- Design note: The most binary curse — you are a god at killing and a feather in the wind. Requires near-perfect positioning. Forces the player to learn enemy patterns deeply. The HP halving applies after Vitality upgrades, so a player who stacks HP first gets a larger raw HP floor.

---

**C03 — FAMINE**
> *Gold is memory. What feeds you now?*

- Debuff: Gold drops from enemies are reduced by 60%. Chest gold yield is halved.
- Buff: Every 10 enemies killed without taking a hit rewards a free random upgrade card (drawn from the current eligible pool, same weight as normal).
- Design note: A economy-inversion curse. Skilled players who dodge well effectively bypass the gold economy entirely, gaining upgrades through performance rather than collection. Punishes greedy play. Rewards mastery of movement. Works interestingly with the Wisdom generic upgrade since free cards still benefit from XP, not gold.

---

**C04 — ECHO CHAMBER**
> *Every spell you cast, it answers.*

- Debuff: Your attack cooldown is doubled (attacks fire half as often).
- Buff: Every attack fires a spectral echo — an identical copy of the attack originating from a mirrored angle (180° opposite) at 60% damage. The echo hits even enemies you cannot see on screen.
- Design note: Transforms rhythm-based play into a timing puzzle. Effective against dense groups approaching from two sides simultaneously. Particularly strong with Huntress spear (two piercing lines). Weak with Muller's crystal wave if enemies cluster in a single direction. Encourages the player to read the field before committing to an attack.

---

**C05 — THE TITHE**
> *The map takes its cut.*

- Debuff: Whenever you level up, one random upgrade you currently own is temporarily suppressed for 90 seconds (its effect is disabled, not removed). The suppression rotates each time it triggers.
- Buff: XP gain from all sources is increased by 50%. You level up far more often.
- Design note: Suppression is shown via a grey-out indicator on the HUD. The player still "has" the upgrade — it returns. This forces the player to adapt to temporary gaps in their build. Combined with high XP gain, the player levels fast enough that the suppression cycles rapidly, creating a rhythm of loss and recovery. Rewards players who build with redundancy.

---

**C06 — HOLLOW GROUND**
> *The earth gives nothing back.*

- Debuff: No HP pickups or chests spawn. Healing items are removed from the map entirely.
- Buff: +40% max HP at run start. The bonus HP pool acts as a consumable buffer — once gone, it's gone, but it's substantial.
- Design note: Pure attrition. The player starts tougher and must make that buffer last the full run. No recovery mechanics. Forces constant risk assessment. Works well with Ignara's Phoenix Heart branch (one revive) and Fortress builds that reduce incoming damage. Specifically punishes reckless players.

---

**C07 — SWARM MIND**
> *They do not think. They converge.*

- Debuff: Enemies no longer spread out or follow individual pathfinding. Every enemy on the map moves directly toward the player at all times. No wandering. No flanking. Pure pursuit. Mini-boss SandGolem is unaffected (already pursues).
- Buff: All enemies deal 25% less damage. They are mindless — deadly in mass but individually weakened.
- Design note: Transforms the enemy field into one unified wave. Players who kite effectively benefit greatly. AoE builds (Ignara, Sifra ice) become extremely strong since enemies pile into tight clusters. Melee heroes (Khashin) face near-constant pressure. The debuff of constant pursuit is partially offset by the mass-clustering enabling devastating AoE chains.

---

**C08 — WITHERING LIGHT**
> *Your strength is borrowed. Pay it back.*

- Debuff: All your damage stats (base damage and all multipliers) start at 50% of their normal value and tick up by 1% per 10 seconds, reaching 100% at the 8-minute mark and continuing to 120% by minute 10. You are weak early, strong late.
- Buff: Enemies also scale inversely — enemy HP starts at 150% and falls to 100% over the same timeline.
- Design note: Completely inverts the power curve. Early waves are brutal — enemies absorb punishment and you tickle them. Surviving to mid-run is the first true challenge. Late-run, when normal players are already dominant, you become even stronger — creating a unique surge of cathartic power at the boss phase. Tests patience and survival instinct far more than raw execution.

---

**C09 — PACT OF IRON**
> *You made a deal. You cannot break it.*

- Debuff: You may only select upgrades from your chosen branch. Generic pool upgrades (Sharp Edge, Swift Feet, etc.) never appear in your card draws for the entire run.
- Buff: All branch upgrades are 50% more potent (all stat values increased by ×1.5, all secondary effects — radii, durations, pierce counts — increased proportionally).
- Design note: A specialization curse. Ignara/Muller (single-branch heroes) effectively get a pure power-run at the cost of flexibility. Dual-branch heroes must commit to one path entirely — no Swift Feet, no Iron Skin, no safety nets. Branch Mastery (design-branch-mastery.md) stacks very well here since the player is forced into single-branch casting anyway. Arguably the most thematically cohesive curse: you are all-in.

---

**C10 — THE FLOOD**
> *There are no waves. There is only the sea.*

- Debuff: The mob cap is tripled. The spawn interval is halved. The map is always at maximum enemy density.
- Buff: Gold drop rate is tripled. Every enemy drops coin. You will be rich — if you survive.
- Design note: Pure chaos. The screen is never quiet. Movement speed and AoE damage become life-critical. Enemies can be nearly impossible to navigate through without speed or knockback upgrades. For experienced players who have developed strong builds, this becomes a gold farm run that rewards mastery with meta-progression currency. For under-prepared players, it is an immediate lesson in overextension.

---

**C11 — DEAD RECKONING**
> *The mini-map is a lie. Trust your instincts.*

- Debuff: The minimap is disabled. Enemy indicators and zone markers are hidden. You navigate by memory and sight alone.
- Buff: Your peripheral vision grows — the game camera zooms out 25%, showing more of the world at once.
- Design note: A perception curse. Removes the navigational safety net that experienced players use to predict enemy clustering and treasure room locations. The wider camera view compensates, but it requires the player to relearn spatial awareness from visual cues rather than data. Works interestingly with Swarm Mind since all enemies converge anyway, making navigation less relevant. Becomes trivially easy if the player already knows the map layout by heart — which is the point. It rewards the player who has truly learned the map.

---

**C12 — BURDEN OF KINGS**
> *With power comes weight.*

- Debuff: For every upgrade card you have taken (cumulative), your movement speed is reduced by 1%. At 20 upgrades, you move 20% slower than baseline. Speed cannot fall below 50% of base.
- Buff: For every upgrade card you have taken, all damage dealt increases by 1.5%. At 20 upgrades, you deal 30% more damage.
- Design note: A compression curse. The player is constantly trading mobility for lethality. Early run, when you have few upgrades, the curse is nearly invisible. By run end, you are a slow-moving fortress of destruction. Works synergistically with ranged heroes (Ignara, Sifra, Huntress) who don't need to close distance. Brutally hard for melee-focused Khashin who relies on mobility to weave through enemies.

---

## 2. Unlock Paths

Curses unlock through **specific run-level achievements** completed after a map's first clear. Progress is tracked in meta-progression (persists across all runs). Many curses require multiple qualifying runs to unlock — you may need to meet a condition twice, or across two different heroes, or while another curse is already active.

The unlock philosophy: **you should feel like you earned each curse.** A player who clears the map once and then immediately accesses all 12 curses has missed the point. Unlocking curses is the endgame arc.

---

### Individual Unlock Conditions

| Curse | Unlock Condition | Type |
|---|---|---|
| C01 Bloodthirst | Clear the map with 0 healing items collected (chests with HP vials exist but are never opened) | Single run |
| C02 Glass Cannon | Deal 10,000 total damage in a single run | Cumulative across 2 runs |
| C03 Famine | Clear the map spending fewer than 150 gold total on upgrades | Single run |
| C04 Echo Chamber | Land 500 projectile hits in a single run | Single run |
| C05 The Tithe | Reach level 20 in a single run | Single run |
| C06 Hollow Ground | Clear the map with 100+ HP remaining at the final boss kill | Single run |
| C07 Swarm Mind | Kill 400 enemies in a single run | Single run |
| C08 Withering Light | Survive to wave 15 (minute 7) without taking damage for any 2-minute stretch | Single run |
| C09 Pact of Iron | Take only branch upgrades in a run (no generics) AND clear the map | Single run |
| C10 The Flood | Clear the map 3 times on the same map with any combination of curses | 3 runs |
| C11 Dead Reckoning | Clear the map 5 times total (any configuration) | 5 runs |
| C12 Burden of Kings | Take 20+ upgrade cards in a single run AND clear the map | Single run |

### Combination-Unlock Curses (Prestige Tier)

Three curses are hidden — they don't appear in the selection UI until their prerequisite curses have been used together in a completed run.

| Hidden Curse | Unlocked By | Condition |
|---|---|---|
| C-X "Entropy" | Running C01 + C10 simultaneously and clearing the map | Clear The Flood and Bloodthirst together |
| C-X "Empty Vessel" | Running C02 + C06 simultaneously and clearing the map | Clear Glass Cannon and Hollow Ground together |
| C-X "Sovereign" | Running C09 + C12 simultaneously and clearing the map | Clear Pact of Iron and Burden of Kings together |

These combination-unlocked curses are documented below in Section 3 as Synergy Effects — they exist only when the qualifying pair is active, making them structural synergies rather than standalone curses.

### Unlock Progress Persistence

All curse unlock progress is stored in `MetaProgress`. The tracker records:
- Which curses are fully unlocked (boolean per curse ID)
- For multi-run unlock conditions: how many qualifying runs have been completed
- Whether the player has used each curse at least once (for the Compendium flavor entry)

Unlock progress is **never reset**, even if the player changes heroes or maps. The Curses screen shows a padlock on locked curses with a brief hint: *"Clear without healing items"* rather than spelling out the exact condition. The discovery should feel organic.

---

## 3. Curse Combinations — Synergy Effects

When 2 or more curses are active simultaneously and a run is completed, certain pairs activate a **Synergy Effect** — a bonus that is only present while both curses are co-active. Synergy Effects are always positive, acting as a reward for finding the combination. They do not add new debuffs.

Synergies are visible in the curse selection screen (a faint connection line between two curse icons if both are unlocked) but the exact effect is hidden until both are selected in the same run.

---

**BERSERKER** *(Bloodthirst + Glass Cannon)*
> *The weaker you are, the hungrier you become.*
- Lifesteal per kill scales with missing HP. At full HP: 3 HP per kill (baseline). At 50% HP: 6 HP per kill. At 25% HP: 9 HP per kill. The bonus caps at ×3 lifesteal (9 HP/kill regardless of how low HP drops).
- Flavor: The glass cannon's vulnerability becomes the berserker's fuel. Designed to reward players who can survive near-death states rather than panic-retreat.

---

**PLAGUE MILL** *(Famine + Swarm Mind)*
> *No gold falls, but the bodies never stop.*
- Every 50th enemy killed drops a guaranteed upgrade card (random, standard draw). The counter resets on each drop. Since enemies converge in dense packs, the kill pace accelerates dramatically — the player earns roughly one card per 90 seconds at peak efficiency.
- Flavor: Economy curse meets density curse. You replace the gold economy with a kill-economy entirely. Wisdom upgrades become crucial for maximizing free card quality.

---

**MIRROR FLOOD** *(Echo Chamber + The Flood)*
> *Twice the silence. Twice the noise.*
- Echo attacks deal 100% damage (up from 60%) and apply all on-hit effects (DOTs, knockback, secondary procs). With triple mob cap and doubled echoes at full damage, the map becomes pure attrition chaos.
- Flavor: Borderline game-breaking. Intended as the highest-difficulty combination for players who want to test their absolute ceiling. The slow attack rhythm (cooldown doubled) becomes the only limiting factor between the player and total map domination.

---

**IRON CRUCIBLE** *(Pact of Iron + Withering Light)*
> *The seal holds. The light waits.*
- Branch upgrades taken during the first 5 minutes of the run are stored as "potential energy." When the Withering Light power curve crosses 100% (minute 8), all branch upgrades are applied again at 50% effectiveness — a second pass of all upgrade effects without paying cards. This is a one-time bonus, not repeating.
- Flavor: Rewards the player for surviving the brutal early phase of Withering Light on a pure-branch build. The mid-run upgrade echo represents the branch "awakening" as the curse's suppression lifts.

---

**THE WEIGHT OF GODS** *(Burden of Kings + Hollow Ground)*
> *No mercy. Only mass.*
- At the 10-minute mark when the CLAWS boss spawns, the Burden of Kings upgrade-to-damage bonus is permanently frozen at its current value and can no longer decay. Additionally, each upgrade taken from this point forward (boss fight phase) only incurs 0.5% speed penalty (down from 1%). The endgame becomes a slow avalanche of raw damage.
- Flavor: Hollow Ground's no-healing rule has forced the player to survive to the boss at reduced HP. Burden of Kings rewards the upgrades they ground for. The combination culminates in a boss fight that tests whether raw damage can compensate for a depleted health buffer.

---

**HUNGRY DARK** *(Dead Reckoning + Bloodthirst)* — Hidden synergy, unlocked automatically when both are active
> *Navigate by instinct. Feed by instinct.*
- Kill streaks (5+ kills within 3 seconds) emit a brief pulse of light — a ring expanding from the player that briefly illuminates enemy positions in a radius even through the minimap-disabled fog. This is the only visual feedback for enemy positioning beyond the camera view.
- Flavor: Thematic reward for playing aggressively despite being blind. The kill streak creates its own radar.

---

### Combination-Unlock Curses (Prestige Trio)

These only activate — and only appear — when both prerequisite curses are active in the same run.

---

**ENTROPY** *(C01 Bloodthirst + C10 The Flood, after unlock)*
> *Everything ends. Everything feeds.*
- Every enemy that dies spawns a smaller, weaker corpse-mob that lives for 8 seconds before dissolving. Corpse-mobs drop 2 gold each but deal 50% of the original mob's damage. They do not count toward kill total for Bloodthirst healing — only original enemies do.
- This can chain: corpse-mobs do not spawn their own corpse-mobs (no infinite loop). But the map never fully empties between waves. Clearing a dense cluster spawns a brief second wave of fragile remnants.

---

**EMPTY VESSEL** *(C02 Glass Cannon + C06 Hollow Ground, after unlock)*
> *Nothing holds you. Nothing catches you.*
- The player's HP is fixed at exactly 1 (regardless of max HP). All incoming damage is blocked — the player is functionally invincible. But the player deals damage equal to their current HP multiplied by the Glass Cannon damage double. Since HP is 1, and the curse applies ×2: all attacks deal 2 raw damage regardless of all stats and upgrades.
- Victory condition: survive 10 minutes. No damage output scaling exists. The player must outlast the CLAWS boss via evasion alone.
- Flavor: The ultimate expression of both curses pushed to their logical extreme. Zero resources, zero power, pure survival. Completing it with any hero is a legitimate prestige achievement.

---

**SOVEREIGN** *(C09 Pact of Iron + C12 Burden of Kings, after unlock)*
> *Every choice made in iron. Every weight a throne.*
- Burden of Kings no longer reduces speed for this run. All 20 upgrades (or however many are taken) contribute only to the damage bonus, with no speed penalty. However, the Pact of Iron buff (×1.5 branch upgrade potency) stacks multiplicatively rather than additively with Burden of Kings' damage ramp — by run end, the player's branch damage is approximately ×1.5 × (1.0 + 0.015 × upgrades_taken). At 20 upgrades, that is ×1.5 × 1.3 = ×1.95 branch damage.
- Flavor: The Sovereign is a pure-branch, heavily built, mobile killing machine — the reward for mastering both specialization curses simultaneously.

---

## 4. Stacking Rules

### Maximum Curses Per Run: 3

No run may begin with more than 3 curses active. This is enforced at the curse selection screen — once 3 are selected, all others are locked out. The player may choose 0, 1, 2, or 3 curses freely.

### Conflicts — Incompatible Curse Pairs

Some combinations are mechanically nonsensical or degenerate and are locked from co-selection. The game shows a red indicator if a conflicting pair is selected.

| Curse A | Curse B | Reason |
|---|---|---|
| C02 Glass Cannon | C06 Hollow Ground | The Empty Vessel prestige mode handles this combination — running both without unlock creates perverse incentives |
| C08 Withering Light | C01 Bloodthirst | The early-game power depression of Withering Light combined with Bloodthirst's kill-dependent healing creates an irresolvable death spiral in wave 1–3 for most builds. Reserved for Berserker synergy only |
| C05 The Tithe | C03 Famine | Both manipulate the upgrade economy simultaneously in opposing directions and create severe card draw instability |
| C07 Swarm Mind | C04 Echo Chamber | Echo Chamber's mirrored angle attacks become trivially overpowered against a perfectly converging swarm — reserved for Mirror Flood synergy context |

**Note:** Prestige combination curses (Entropy, Empty Vessel, Sovereign) override their conflict rules by definition — selecting the prerequisite pair is the condition for unlocking them.

### Difficulty Scaling With Curse Count

Curses do not directly multiply difficulty in a uniform way — each curse has its own internal balance. However, **reward multipliers** scale with curse count to compensate for the increased challenge and encourage stacking.

| Active Curses | Gold Drop Multiplier | Meta-XP Bonus | Run Clear Bonus |
|---|---|---|---|
| 0 (no curses) | ×1.0 | ×1.0 | Standard |
| 1 curse | ×1.3 | ×1.4 | "Cursed" clear badge |
| 2 curses | ×1.7 | ×2.0 | "Twice-Cursed" clear badge |
| 3 curses | ×2.5 | ×3.0 | "Thrice-Cursed" clear badge + title |

These multipliers apply to the post-run rewards screen. The Famine curse (C03) overrides the gold multiplier in-run — but the post-run gold summary (from survived enemies, chest finds) still receives the stacking bonus.

---

## 5. UI/UX

### Curse Selection Screen

Accessed from the map selection menu after a map's first clear. A new button appears below the "Play" button: **"Add Curse"** — styled with a slightly cracked seal icon, subdued color (not celebratory). The framing should feel like a solemn choice, not a power fantasy button.

**Layout:**
- A 4×3 grid of curse cards (12 base curses). Locked curses show a padlock icon and a single-line hint. Unlocked curses show their name, the buff icon, and the debuff icon side by side.
- Prestige (combination-unlock) curses appear as ghosted slots with "???" label until unlocked.
- Selecting a curse highlights the card and shows a full description panel on the right side: curse name in large serif font, the flavor quote in italics, then the Debuff section (red text) and Buff section (green text) clearly separated.
- The panel also shows: "Active Synergies" — if another selected curse pairs with this one, the synergy name appears here before the run starts.
- Conflict indicator: if a conflicting pair is selected, both cards pulse red and a warning icon appears. The "Play" button is grayed until the conflict is resolved.
- The selected curse count shows prominently at the bottom: ○○○ (empty dots), filling as curses are added.

### In-Run Visual Indicators

Active curses are always visible but never intrusive. The HUD gains a small **curse tray** in the bottom-left corner — a compact horizontal strip below the HP bar.

- Each active curse shows as a small icon (curse-specific sprite, approximately 24×24px) with a subtle amber glow border.
- On hover/pause, a tooltip appears with the curse's name and one-line summary (buff and debuff, condensed).
- When a curse's debuff activates a visible effect (e.g., Withering Light power curve reaching 100%, Tithe suppressing an upgrade), the relevant curse icon briefly flashes and scales up (a 0.3s bounce) to draw attention.
- No persistent text overlays. The icons carry the information. Players who learn the icons know their curses at a glance.

**Synergy notification:** When a synergy effect activates (both prerequisites selected), a brief text pop appears center-screen at run start: the synergy name in large font, then fades after 2 seconds. "BERSERKER ACTIVE" in blood-red, then gone. The run has begun.

### Map Selection Screen Integration

On the map selection screen, each map card shows its clear history at the bottom:
- First clear: a gold star.
- Cursed clear badges: small seal icons (one per curse count tier) next to the star. Three seals maximum, turning from amber to deep crimson as the count increases.
- A small number below the seal cluster: how many unique curses have been unlocked for this map.

This communicates endgame depth at a glance without cluttering the map card.

---

## 6. Balance Considerations

### Keeping 3-Curse Runs Challenging But Fair

The design assumes that a player who has unlocked 3 curses is experienced — they have cleared this map multiple times under varied conditions. The challenge should respect that experience while still demanding adaptation.

**Three principles:**

1. **No curse combination should create a hard wall.** Every 3-curse combination (excluding prestige modes) should be theoretically clearable with any hero. If playtesting reveals an impossible triple (e.g., Glass Cannon + Hollow Ground + Swarm Mind crushing Khashin specifically), resolve it by adjusting curse magnitudes, not by blocking the combination.

2. **The buff must always be exploitable.** If a player cannot meaningfully leverage a curse's buff given their hero and build, the curse becomes a pure penalty — which breaks the design philosophy. The tuning target is: a skilled player exploiting the buff should feel like the curse is nearly fair.

3. **Death from curses should always feel earned.** When a player dies on a curse run, the cause should be traceable to the curse combination they chose — not to a random spike the game generated independently of their choices. Avoid situations where curse + bad RNG upgrade pool + tough wave timing converges into an unavoidable death.

### Reward Scaling

The gold and meta-XP multipliers (Section 4) are calibrated against the assumption that a 3-curse run takes roughly 1.5–2× as long as a no-curse run to complete in terms of cognitive load and decision pressure — even if wall-clock time is identical. Effort is subjective; the ×2.5 gold and ×3.0 meta-XP reflect the game's acknowledgment that the player accepted a genuinely harder contract.

Completing a 3-curse run with a prestige synergy active (Entropy, Empty Vessel, or Sovereign) adds an additional ×1.5 meta-XP bonus on top, for a total of ×4.5 — the highest meta-XP rate in the game. This is the endgame loop's peak reward moment.

### Interaction With Branch Mastery System

Curses and Branch Mastery (design-branch-mastery.md) interact meaningfully in several cases:

- **Pact of Iron (C09)** forces single-branch play, which is exactly what Branch Mastery rewards. A Pact of Iron run with a branch-committing hero (Sifra Ice, Nazar Venom) will reliably hit Branch Mastery Level 3 by minute 8. The ×1.5 branch upgrade potency stacks with the +30% mastery damage bonus as separate multipliers.

- **Echo Chamber (C04)** halves cast frequency, which directly halves Branch Mastery XP accumulation (fewer casts = fewer XP triggers). Players running Echo Chamber should not expect to reach Level 3 mastery by run end. This is intentional — the echo attacks compensate in kill power.

- **The Tithe (C05)** occasionally suppresses upgrades, but never suppresses Branch Mastery levels — mastery is not an upgrade. It persists through suppression cycles. This distinction matters for how the player mentally separates their power sources during a Tithe run.

- **Withering Light (C08)** suppresses early-run power in a way that delays reaching mastery-boosted power. Since mastery levels compound with the Withering Light damage ramp, the late-run power spike (minute 8+) becomes significantly larger than intended without Withering Light. Monitor for overshoot in playtesting.

- **Burden of Kings (C12)** and Branch Mastery are orthogonal — mastery is branch-scoped and does not interact with the upgrade-count tracker. However, players running Burden of Kings tend to take many upgrades, which delays level-up card draws (more upgrades chosen = fewer remaining card events). This can accidentally cap Branch Mastery at Level 2 if the player depletes eligible branch upgrades early. A minor design note: ensure the eligible pool check (which unlocks new branch tiers) correctly handles saturated branch pools during Burden of Kings runs.

### Difficulty Escape Valves

Some curses include internal escape valves that prevent absolute worst-case scenarios:

- **Glass Cannon (C02)**: HP halving has a floor — minimum 10 HP regardless of base HP. Players with 15 HP max won't be reduced to 7.
- **Burden of Kings (C12)**: Speed reduction has a floor at 50% of base speed. The player is always able to move meaningfully.
- **Withering Light (C08)**: Damage ramp continues to 120% at minute 10, so very late kills (boss phase) are boosted, not penalized.
- **The Tithe (C05)**: The suppressed upgrade is random but re-evaluates after 90 seconds. The same upgrade cannot be suppressed twice in a row.

---

## Open Questions

1. **Should Curse unlock progress be global or per-map?** Current design: per-map (completing a condition on the Crossroads map doesn't unlock the curse on the Undead map). This makes each map's curse collection feel distinct but may slow endgame unlocks dramatically. Alternative: global unlock progress shared across maps. Recommend playtesting both.

2. **Curse rerolling:** Should the player be able to pay gold (meta-currency) to swap a curse after selecting it but before the run starts? Risk of reducing commitment. Probably not — the "you chose this" feeling is load-bearing.

3. **How are curses explained to first-time players?** The first time the player clears a map, a brief unlock notification appears: *"You have proven yourself. The seals are weakening."* Then the Curse button appears. No tutorial, no hand-holding. The behavior of each curse is learned through play.

4. **Prestige completion state:** Should completing all 12 curses (each at least once) trigger a cosmetic reward? Suggested: a permanent visual aura on the hero's map-selection portrait — a broken seal sigil. Low priority but good for long-term retention.

5. **Enemy type interactions:** Curses like Swarm Mind affect pathfinding — does this apply to the SandGolem mini-boss, FlyingEye, and CLAWS boss? Suggested rule: mini-bosses and CLAWS boss are unaffected by all pathfinding curses. They behave as designed to preserve their encounter integrity.
