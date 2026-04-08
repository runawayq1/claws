# Branch Mastery System — Design Document

> Version: v1.1 | Date: 2026-04-07
> Status: Implemented — mastery XP, levels, damage mult, cost reduction, UI diamonds, popups all in code

---

## 1. Overview

Branch Mastery is a within-run progression layer that rewards players for actively using a branch's abilities. The more you cast, the stronger that branch becomes — and the more affordable it gets to keep casting. This creates a natural specialization loop: choosing a branch early and committing to it pays off with compounding power, while hedging between two branches produces mediocre results in both.

This system complements the existing upgrade card system (branch selection at level 1, skill unlocks + skill levels thereafter). It does **not** replace it. Branch Mastery is a parallel track that runs passively during combat.

---

## 2. Core Principle

Every hero with two energy bars (Sifra ice/lightning, Nazar sword/venom, Huntress melee/spear, Amun quake/ground, Khashin wind/sand) has two **Branch Mastery tracks** — one per bar. These tracks fill as you cast that branch's attacks. Filling a track crosses a **Mastery Level** threshold, granting a permanent in-run bonus to that branch: stronger effects and reduced energy cost.

Branches without energy bars (Ignara, Muller base attacks) receive a simplified version described in Section 8.

---

## 3. How Branch XP Is Earned

### Primary Source: Per Cast

Each successful cast (attack fired, ability triggered) awards **1 Mastery XP** to the corresponding branch.

- "Successful cast" means the attack actually executed — energy was consumed and the attack animation played.
- Blocked casts (energy was 0, stance auto-toggled) do **not** award XP. You earn mastery by actually committing to a branch.
- Continuous attacks (Sifra lightning cone) award XP **once per burst interval**, not per frame.

### Secondary Source: Per Hit

Each enemy hit by a branch attack awards **+0.5 Mastery XP** (bonus on top of the cast XP). This rewards branches that hit multiple enemies — AoE abilities, piercing spears, chain lightning.

Multi-hit attacks (e.g., Khashin's wind slash with pierce upgrades) award the hit bonus once per enemy struck, capped at **+3 XP per cast** from hits. This prevents absurd AoE builds from mastering too quickly while still rewarding them more than point-and-click attacks.

### Tertiary Source: Per Kill (small bonus)

Each kill with a branch ability awards **+0.25 Mastery XP**. This is intentionally small — kills are rarer than casts and we don't want mastery to depend on late-game snowball (when enemies already die fast, mastery shouldn't accelerate).

### Summary per Event

| Event | Branch Mastery XP |
|---|---|
| Cast (energy consumed, attack fires) | +1.0 |
| Enemy hit by that cast | +0.5 (capped +3.0 per cast) |
| Enemy killed by that cast | +0.25 |

A typical "cast + hit + not kill" event yields **1.5 XP**. A cast that kills one enemy yields **1.75 XP**. An AoE cast hitting 5 enemies and killing 2 yields **1 + 2.5 (hit cap) + 0.5 (kill cap 2×0.25) = 4.0 XP** — notably richer, which feels right for committing to AoE playstyle.

---

## 4. Mastery Levels and XP Thresholds

Three mastery levels per branch. The caps are calibrated for a ~10-minute run where the player actively uses one branch throughout.

| Level | Name | XP Required (cumulative) | Expected Time to Reach |
|---|---|---|---|
| 0 | Untrained | — | Start of run |
| 1 | Practiced | 50 XP | ~2–3 min (heavy use) |
| 2 | Adept | 150 XP | ~5–6 min |
| 3 | Master | 300 XP | ~8–9 min |

Rationale: at ~1.5 avg XP per cast, and typical 0.5–1 cast/sec usage rate, level 1 is reachable in ~70–100 casts (roughly 2 min of active use). Level 3 requires ~200 casts total — achievable only with consistent commitment. A player who splits evenly between two branches cannot max either before the run ends.

XP does **not** carry over between runs. Mastery is a within-run mechanic.

---

## 5. What "Strengthens Base Effect" Means Per Branch

Each level grants a **flat multiplier bonus** applied to the base effect of that branch's attacks. The multiplier stacks additively per level.

### Damage-type branches (offensive primary)

| Hero | Branch | Effect strengthened | Per level bonus |
|---|---|---|---|
| Sifra | Ice (iceshard) | Shard damage, splash radius | +10% dmg, +8px radius per level |
| Sifra | Lightning | Cone DPS, cone angle | +10% dmg, +5% angle per level |
| Nazar | Sword (melee) | Melee damage, strike speed | +10% dmg, -5% attack CD per level |
| Nazar | Venom | Poison DPS, puddle radius | +10% dmg, +10px puddle radius per level |
| Huntress | Spear | Spear damage, pierce count | +10% dmg, +1 pierce at level 2 only |
| Huntress | Melee | Melee damage, combo speed | +10% dmg, -8% attack CD per level |
| Amun | Quake (shockwave) | Shockwave damage, radius | +10% dmg, +15px radius per level |
| Amun | Ground (melee) | Melee damage, range | +10% dmg, +8px range per level |
| Khashin | Wind (slash) | Wind slash damage, pierce | +10% dmg, +1 pierce at level 3 only |
| Khashin | Sand (haboob) | Melee damage, blind duration | +10% dmg, +0.3s blind per level |

### General rule for all branches

- **Level 1**: +10% base damage for that branch's primary attack.
- **Level 2**: +10% more damage (now +20% total) plus one secondary effect (radius, pierce, speed).
- **Level 3**: +10% more damage (now +30% total) plus one additional secondary effect or stronger secondary.

These bonuses are **in addition to** any upgrades the player has taken. They apply as a mastery multiplier separate from the `p.damage` stat, so they don't cause cascading interactions with generic upgrades like Sharp Edge. Implementation detail: track as `branchMasteryMult[branch] = 1.0 + 0.1 * masteryLevel[branch]`.

---

## 6. Energy Cost Reduction Curve

The energy cost reduction makes the committed branch feel increasingly fluid. It must not reach zero — a branch becoming completely free would eliminate the tension of the dual-bar system.

| Mastery Level | Energy Cost Reduction |
|---|---|
| 0 | 0% (baseline) |
| 1 | 10% reduction |
| 2 | 18% reduction |
| 3 | 24% reduction |

Formula: `reduction = 1 - (0.76 ^ level)` rounded to nearest percent. Diminishing returns — each level gives less than the previous. At level 3, a typical 10-cost ability costs ~7.6 energy instead of 10.

The reduction applies to `energyDrainPerShot` and `energyDrainRate` for that branch. Since energy regen (`energyRegenRate = 25/s`) is fixed, the practical effect is more casts per charge cycle, not infinite casts.

### Why not go lower?

At 30%+ reduction the energy bar becomes cosmetic. Keeping it under 25% means the player still has to manage both bars even at full mastery — they just have more uptime on their preferred branch. The tension remains.

---

## 7. UI Considerations

### Placement

The branch mastery progress should live **adjacent to the energy bars** in the HUD. The existing dual energy bars are already visually paired per hero (e.g., the two bars on Sifra's HUD). A mastery track fits naturally below each bar or as a subtle progress fill on the bar frame.

### Visual Language

Three-dot or three-segment approach:
- Three small diamonds (◇◇◇) below each energy bar.
- A diamond fills (◆) when that mastery level is reached.
- Color matches the branch color (already defined as `branchColor` in `BranchDef`).
- A short flash/pop animation when a level is gained (scale up + alpha fade on the filled diamond).

This keeps the UI minimal (VS-style) — three dots add negligible visual noise but clearly communicate progress state. No numbers, no text labels, no progress bars inside progress bars.

### Level-Up Notification

When mastery levels up: emit a brief **branch-flavored text popup** above the player ("Frost — Adept!" or just a glyph burst matching the branch color). Duration ~1.5s, same depth/layer as kill text. Not a card, not a modal — just ambient feedback.

### Branch Selection Screen

During the first level-up branch selection, all mastery tracks show at 0 (empty diamonds), so the system is visible immediately and the player understands what they're investing in.

---

## 8. Heroes Without Dual Energy Bars

Ignara and Muller have a single base attack with no stance system. For them, branch mastery takes a simpler form:

- **Ignara**: The player picks one branch (Inferno / Fortress / Havoc) at level 1. That branch's mastery track fills based on kills with Ignara's fireball (the primary attack regardless of branch). The mastery bonus strengthens the chosen branch's defining effect:
  - Inferno: +10% fireball dmg per level
  - Fortress: +5% armor reduction per level (more damage taken by enemies in AoE)
  - Havoc: +8% damage per level + slightly faster explosion VFX spread

- **Muller**: Similarly, one branch chosen, mastery fills from crystal wave hits. Bonus strengthens the branch's core effect:
  - Shardfall: +10% wave dmg per level
  - Prism: +8% dmg and +5px cone angle per level
  - Eruption: +10% eruption dmg per level, reduced Tectonic Fury counter (5→4 at level 3)

For these single-bar heroes, the mastery diamond trio appears below the single energy bar or, if there is no visible energy bar (Ignara), in a small dedicated row near the branch name indicator in the HUD.

---

## 9. Balance Considerations

### Preventing One Branch from Becoming Dominant

The spec asks how to prevent one branch completely crushing the other. Several guards are built in:

1. **Diminishing returns on cost reduction** — as shown in Section 6, the curve flattens. You never fully escape the dual-bar tension.

2. **+30% damage cap at level 3** — the mastery damage bonus tops out at +30% of the branch's base attack. With Sharp Edge and other generic upgrades, this is meaningful but not the primary damage multiplier. A player who maximizes mastery is rewarded but the game doesn't break.

3. **XP gap is intentional** — if a player uses both branches, neither reaches level 3 by run end. This is a **feature**, not a problem. It nudges players toward a playstyle identity: "I am an Ice Sifra" or "I am a Lightning Sifra." Both are valid. Mixing is also valid but produces a run-end mastery of ~1 per branch instead of ~3 on one.

4. **Skill levels (existing system) still dominate power** — the existing branch upgrade cards give +20–30% damage per skill. Mastery adds a secondary +30% over the course of a run. The upgrade card system remains the primary power lever. Mastery is the flavor on top.

5. **No mastery cross-contamination** — XP earned with Branch A does not spill into Branch B. You cannot "pre-fill" by briefly spamming a branch you don't want.

### Anti-Cheese: Stance Flip Farming

A player could try to rapidly toggle stances (wind → sand → wind → ...) to farm casts cheaply. Guards:
- Casts only award XP if energy was actually consumed (the attack fired successfully).
- The `toggleStance` auto-fires when energy hits 0, not when the player manually toggles. Manual toggle doesn't drain energy or fire the attack.
- If we add a mastery-specific guard: a cast that had 0 enemies in range still awards XP (to not punish downtime) but a cast where the hero was at max range and no physics check ran should not.

This is acceptable complexity — implement the simplest version first (XP on energy consumed) and observe if players abuse it.

---

## 10. Interaction with Existing Systems

### Upgrade Cards (skill-levels-design.md)

Branch mastery and skill level upgrades are additive but separate multipliers. A fireball upgraded to White Fire level 3 (+85% dmg from cards) plus Inferno mastery level 3 (+30% mastery mult) multiplies as:
`finalDmg = baseDmg × (1 + upgrade_bonus) × (1 + mastery_mult)` — two stacked multipliers, never merged into one stat.

### Generic Pool

Generic upgrades (Sharp Edge, Eagle Eye, etc.) affect `p.damage` and `p.range` globally. Branch mastery bonuses are branch-scoped and don't modify `p.damage` directly — they apply at attack-fire time as a separate multiplier. This avoids cascading interactions and makes tuning cleaner.

### Forge / Meta-Upgrades

No mastery-related meta upgrades in this design. Adding "starts run with branch mastery level 1" as a forge upgrade would be a natural expansion — but that's a future consideration after the base system is validated.

### Skill Challenges (skill-challenges-design.md)

Branch mastery levels could serve as challenge unlock conditions:
- "Reach Mastery level 3 on the Venom branch in a single run" as a Nazar trial.
- "Reach Mastery level 2 on both branches simultaneously" as a difficult challenge.
These are suggestions, not part of the core design.

### Encyclopedia

The Encyclopedia hero pages can show "Branch Mastery" as a mechanic note on each hero's overview — brief, one-line mention. Lore-wise, mastery could be framed as the hero "attuning" their fighting style during a run: *"Sifra's Ice branch deepens with each volley — the cold becomes instinct."*

---

## 11. Implementation Notes (for Hero Mechanics agent)

> This section is informational, not prescriptive. The Hero Mechanics agent owns implementation decisions.

Suggested data shape in Player.ts:

```typescript
branchMasteryXP: Partial<Record<string, number>> = {}   // e.g. { 'ice': 47, 'lightning': 12 }
branchMasteryLevel: Partial<Record<string, number>> = {} // e.g. { 'ice': 1, 'lightning': 0 }
```

Branch keys should match the branch names already defined in `BranchDef.name` (lowercase), or the energy-bar identifiers already in use (`'ice'`, `'lightning'`, `'sword'`, `'venom'`, etc.).

XP should be awarded inside the attack methods (`attackIceShard`, `attackWindSlash`, etc.) after the attack confirms firing. Hit bonuses should be awarded in the hit-resolution callback for each projectile/attack.

The mastery mult is read at attack-fire time:
```typescript
const masteryMult = 1 + 0.1 * (this.branchMasteryLevel['ice'] ?? 0)
// apply to projectile damage only, not p.damage globally
```

Energy cost reduction:
```typescript
const reduction = Math.pow(0.76, this.branchMasteryLevel['ice'] ?? 0)
this.iceEnergy = Math.max(0, this.iceEnergy - this.energyDrainPerShot * reduction)
```

UI: emit `'branch-mastery-levelup'` event with `{ branch, level }` payload when a threshold is crossed. UIScene handles the display.

---

## 12. Open Questions

1. **Should mastery persist if the player takes a generic upgrade instead of a branch skill?** Likely yes — mastery is about using the branch in combat, not about which upgrades you chose. Confirmed: mastery XP accumulates from attacks, not from upgrade selections.

2. **Does the Amun Quake stance's unlocked-by-upgrade nature (aq1 "Titan's Pulse") mean quake mastery starts filling before the stance exists?** No — mastery XP for the quake branch should only start accumulating after the Quake branch is unlocked (after aq1 is taken). Before that, Amun has only one attack mode and no branch split.

3. **Should there be any visual signal on enemy hits to show mastery bonuses are applying?** Suggest no — hit numbers already exist; adding mastery labels to each hit would clutter. The level-up notification is sufficient feedback.

4. **Localization of mastery level names** — "Practiced / Adept / Master" are English placeholders. If the game uses Ukrainian for internal docs, level names can be adapted in the string table when implementing.
