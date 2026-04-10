> **STATUS: DESIGN ONLY** — Not yet implemented. Last reviewed 2026-04-09.

# Hero Unlock Progression — Design Document

> Version: 1.0 | Date: 2026-04-09
> Status: Design draft — pending implementation post-v0.5

---

## 1. Design Goals

The unlock system serves three purposes:

1. **Pacing** — drip-feed heroes so the new player is never overwhelmed by choice but always has something to look forward to.
2. **Motivation** — each unlock condition teaches something: a run mechanic, a playstyle, a lore connection.
3. **Narrative coherence** — the order of discovery should feel like the heroes are finding each other in the Ruin, not like a game ticking boxes.

> **Current state (v0.4.3):** All seven heroes are accessible from the first launch (`UNLOCKED_HEROES = new Set(['amun', 'sifra'])`  is in code, but the tutorial system and other heroes are not yet gated). This doc defines the target post-implementation state.

---

## 2. Starting State — First Launch

**Amun** is the only hero selectable on a fresh save.

Lore justification: He has been in the Ruin for a thousand years. He is already there when the player arrives. Every other hero must be found, earned, or bought.

From the hero-select screen, locked heroes display:
- Their portrait greyed out with a padlock overlay
- A one-line hint text describing how to unlock them (see per-hero sections below)
- Tapping/clicking a locked hero shows a short unlock description popup — curiosity loop, not frustration

---

## 3. The Tutorial Arc — Amun's First Run

The tutorial is documented in full in `docs/design-tutorial-scenario.md`. Summary relevant to unlock progression:

| Quest | Condition | Reward |
|-------|-----------|--------|
| **Forged in Battle** | Kill 100 enemies in a single run | Unlocks Amun's Bastion branch mid-run |
| **The Long Watch** | Survive 5 minutes in a single run | Unlocks Amun's Quake branch mid-run |
| **The Frost Accord** | Find Sifra on the map (100px proximity, NPC encounter) | **Unlocks Sifra** as a playable hero |

These three quests complete Amun's tutorial and conclude with the player having two heroes: Amun and Sifra. This is the intended state after the first session.

**Design note:** The tutorial is Amun-only. If a player somehow selects another hero before completing the tutorial (save migration, corrupted data), the tutorial state does not apply to other heroes — they play normally with full branch access.

---

## 4. Hero Unlock Table — Overview

| # | Hero | Name (internal) | Unlock Method | Approximate Timing |
|---|------|-----------------|---------------|--------------------|
| 1 | Amun | `amun` | Default — always available | Run 1 |
| 2 | Sifra | `sifra` | Tutorial Quest 3 (find her on map) | Run 1–2 |
| 3 | Ignara | `ignara` | Starter Quest: 3 runs completed | Run 3–5 |
| 4 | Nazar | `nazar` | Challenge: win a run (any hero) | Run 5–10 |
| 5 | Lyra (Huntress) | `huntress` | Gold purchase — Forge: 300 gold | Run 8–15 |
| 6 | Khashin | `khashin` | Challenge: survive 8 min as Sifra | Run 10–20 |
| 7 | Givi (Muller) | `muller` | Secret unlock (see Section 9) | Run 15–30+ |

---

## 5. Hero Unlock Details

### 5.1 — Amun (Guardian)

**Status:** Always unlocked. No condition.

**Lore:** Amun is not found — he is already standing in the Ruin when the player arrives. He has been waiting for a thousand years. He does not need to be earned.

**Hero select hint text (N/A):** Amun's slot shows no padlock.

---

### 5.2 — Sifra (Ice/Lightning Mage)

**Unlock method:** Tutorial Quest 3 — "The Frost Accord"

**Condition:** Move within 100 world-units of Sifra's NPC position during the Amun tutorial run and complete the dialogue sequence.

**Reward:** `meta.unlockedHeroes.push('sifra')`, `meta.tutorialComplete = true`

**Timing:** Completable in the first run if the player follows the minimap marker (activates after Quest 2). Typically early Session 1.

**Lore:** She was already in the Ruin, alone, watching from a distance. She did not ask to be found. Amun noticed her anyway. That is the beginning of the uneasy alliance the Key requires.

**Hero select hint text (while locked):** *"Find her in the Ruin."*

---

### 5.3 — Ignara (Fire Mage)

**Unlock method:** Starter Quest — "First Word of Fire"

**Condition:** Complete 3 runs total (any hero, any outcome — death counts, winning counts).

**Reward:** Ignara is unlocked in `meta.unlockedHeroes`. A short "New Hero Unlocked" overlay appears on return to StartScene after the 3rd run ends.

**Why 3 runs, not 1:** Ignara is a glass-cannon mage — she rewards players who understand fireball positioning and explosion radius. One run of Amun isn't enough context. After 3 runs (win or lose), the player has seen branch selection, level-ups, and the basic survival loop. They are ready for a ranged damage dealer with lower HP.

**Timing:** A player completing 3 short runs — even dying at 2–3 minutes each — unlocks Ignara quickly. No skill gate. This is pure "engagement gate."

**Hero select hint text (while locked):** *"She reveals herself after you've seen what the Ruin does to survivors."* (Below the hint: small grey text — *"Complete 3 runs to unlock."*)

**Unlock overlay flavor text:**
> *"The First Flame has burned inside her for seven years. She came to the Ruin for revenge. You came for something else. Maybe that's why she'll follow."*

---

### 5.4 — Nazar (Shadow Assassin / Samurai)

**Unlock method:** Challenge — "Proof of Completion"

**Condition:** Win one run (survive 10 minutes and defeat the CLAWS boss) as any hero.

**Reward:** Nazar is unlocked in `meta.unlockedHeroes`. Overlay appears at run end summary screen before returning to StartScene.

**Why a win gate:** Nazar is a high-skill floor hero — low HP, melee-committed, positional play. A player who cannot complete a single run with Amun, Sifra, or Ignara will struggle badly with Nazar. The win requirement is not punishing (it can be achieved with any hero, on any branch), but it ensures the player understands the game's full loop before encountering its hardest-to-survive character.

**Timing:** Some players win on Run 3. Most win by Run 7–10. Nazar is the game's "okay you're past the learning cliff" reward.

**Hero select hint text (while locked):** *"A hired blade. He only respects those who've finished a job."* (*"Win a run to unlock."*)

**Unlock overlay flavor text:**
> *"He was watching from the sand. He always watches first. You finished the job — whatever it was. That was enough for him to step out of the shadow."*

---

### 5.5 — Lyra / Huntress (Spear Thrower)

**Unlock method:** Gold purchase at the Forge

**Cost:** 300 gold

**Where:** A dedicated "Recruit" section in ForgeScene, separate from the meta-upgrade grid. Each purchasable hero has a portrait tile with a gold cost label. Purchasing writes to `meta.unlockedHeroes`.

**Why gold purchase:** Lyra is mechanically interesting but not punishing — high range, mobile, stance-optional. She's a solid mid-difficulty hero. Gating her behind gold gives the gold economy a meaningful milestone spend beyond the meta-upgrade tiers. At ~180 gold/run average, 300 gold is roughly 2–3 runs of diligent play — not a grind, a decision.

**Design note:** The Forge "Recruit" section should appear after `tutorialComplete = true`. Before that, the Forge only shows meta-upgrades — the player doesn't need hero-purchase complexity during their first session.

**Timing:** Available around Run 5–10 depending on gold accumulation pace.

**Hero select hint text (while locked):** *"The Great Hunt's best. She charges a finder's fee."* (*"Purchase at the Forge for 300 gold."*)

**Forge tile flavor text:**
> *"First hunter to return from the Great Hunt three times. She stopped coming back because the Ruin has better prey. 300 gold covers the gear she left behind."*

---

### 5.6 — Khashin (Wind/Sand Elemental)

**Unlock method:** Challenge — "Born of Wind, Found in Storm"

**Condition:** Survive 8 minutes in a single run as Sifra.

**Why Sifra-specific:** Khashin and Sifra share the elemental-affinity layer of the world's lore — her lightning and his wind are both forces the Bramwomb amplified. The challenge nudges the player to actually explore Sifra before unlocking Khashin, creating a natural bridge between the two heroes. Surviving 8 minutes as Sifra requires understanding her dual-stance system — good preparation for Khashin's own dual-stance.

**Timing:** Sifra at 8 minutes is achievable by a player who has played her 3–5 times and begun to understand the ice/lightning toggle. Approximately Run 10–20 for most players.

**Reward:** Khashin unlocked. Overlay at run-end.

**Hero select hint text (while locked):** *"A child of the storm. Sifra has heard him in the wind."* (*"Survive 8 minutes as Sifra to unlock."*)

**Unlock overlay flavor text:**
> *"He has been alive for ninety years. He helps because he is lonely and curious — in that order. He heard Sifra calling through the storm and decided to introduce himself. He did not ask if that was welcome."*

---

### 5.7 — Givi / Crystal Muller (Crystal Gnome)

**Unlock method:** Secret unlock — "The Deep Contract" (see Section 9)

**Primary condition (secret):** Win a run as Amun AND win a run as Khashin. Then, on any subsequent run, reach wave 7 (approximately 6.5–7 minutes) — at that point, a "crystal tremor" event fires: a brief screen-shake and a glowing crystal shard appears on the minimap in a specific quadrant. Walking to it triggers a brief encounter text (no full dialogue sequence — just 2 lines of text) that unlocks Muller.

**Alternative condition (discoverable):** If the player has not triggered the secret after completing both prerequisite wins, Muller also becomes available as a gold purchase in the Forge at **600 gold** — a significantly higher cost that signals "this is the last hero." The Forge tile appears automatically once `meta.wins >= 3`.

**Why secret:** Givi (Muller) is the most mechanically distinct hero — crystal waves, stance via upgrade (not Q-toggle), ground control. She fits a player who has learned the game thoroughly. A secret unlock rewards curiosity and extended play. It also fits her character: she did not come to the Ruin for the quest — she came for a contract. She does not announce herself.

**Timing:** The secret fires naturally for players who play 15–30 runs and try multiple heroes. The gold fallback ensures no player is permanently locked out.

**Hero select hint text (while locked, secret not yet triggered):** *"Someone is working in the deep crystal. You can hear it."* (No direct unlock hint — it is intentionally vague. After 3 total wins, small additional text appears: *"Or find her at the Forge."*)

**Unlock encounter text (crystal shard event):**

> **[The shard pulses. A voice from beneath the stone.]**
>
> *"Contract's a contract. I'll clear the Ruin. Don't get in the way of my work."*
> — GIVI

---

## 6. Amun's Branch Unlocks (In-Run Tutorial Gating)

These are documented fully in `docs/design-tutorial-scenario.md`. Summary:

| Branch | Unlocked by | Timing |
|--------|-------------|--------|
| **Wrath** | Available from Run 1, automatically selected if no other branch exists | First run, level 1 |
| **Bastion** | Tutorial Quest 1: Kill 100 enemies (fires "Branch Discovered" card mid-run) | ~3–5 minutes into tutorial run |
| **Quake** | Tutorial Quest 2: Survive 5 minutes (fires "Branch Discovered" card mid-run) | ~5 minutes into tutorial run |

After `tutorialComplete = true`, all three Amun branches are always available at level 1 branch selection for future runs. No re-gating.

---

## 7. Per-Hero Branch Unlock Design

Other heroes do not have gated branches — all three branches are available at level 1 selection from the first run with that hero. The in-run branch mastery system (documented in `docs/design-branch-mastery.md`) creates natural specialization pressure without hard locks.

The exception is **Amun during the tutorial** (above).

**Future consideration:** If a future hero has a clearly "power-tier" third branch (e.g., an ultimate stance), a similar tutorial-gate approach could apply. For the current 7 heroes, post-Amun branch gating is not recommended — it would add friction without the narrative payoff the Amun tutorial delivers.

---

## 8. Gold Costs and Economy Fit

Current economy data: ~180 gold/run average at base difficulty, with meta-upgrade total cost ~216,000 gold over ~100 hours.

Hero purchases are a one-time spend that lives outside the meta-upgrade curve:

| Hero | Gold Cost | Runs to Afford (approx) |
|------|-----------|------------------------|
| Lyra (Huntress) | 300 gold | ~2 runs (if saving) |
| Givi (Muller) fallback | 600 gold | ~4 runs (if saving) |

**Design intent:** These costs are low relative to the 100h meta-upgrade curve. Heroes are not a grind-gate. Gold is the path of least resistance for players who don't want to complete the specific challenges, but challenges are the faster/more interesting path for engaged players.

**Forge UI additions required:**
- A "Roster" or "Recruit" sub-tab in ForgeScene (separate from the 5×5 meta-upgrade grid)
- Appears once `meta.tutorialComplete === true`
- Shows all purchasable heroes with portrait, flavor text, cost, and a "Recruit" button
- Already-unlocked heroes show a "Recruited" state (grey, no button) — the player can see who's available without confusion

---

## 9. Secret Hero — Full Specification

### "The Deep Contract" — Givi (Muller)

**Prerequisites (must both be true before the secret can fire):**
1. `meta.heroWins['amun'] >= 1` — won a run as Amun
2. `meta.heroWins['khashin'] >= 1` — won a run as Khashin

**Trigger:** On any run after both prerequisites are met, at the 6-minute mark (wave 7 threshold), the "Crystal Tremor" event fires:

1. **Screen event:** 0.8-second camera shake (low intensity, magnitude 3). A brief amber-glow flash on the ground under the player.
2. **Crystal shard NPC:** A glowing crystal object spawns at a fixed offset from world center (suggested: southeast quadrant, ~1200 world units). It pulses amber/blue at 1.5s interval — same beacon effect as Sifra's NPC in the tutorial.
3. **Minimap marker:** A diamond in `#44AAFF` (Muller's blue) appears with a pulse. No label — the player must investigate.
4. **No text prompt** is shown. The event is ambient. Curious players investigate; others may not notice it for several runs.

**Encounter trigger:** Player moves within 120px of the crystal shard.

**Encounter sequence:**
- Game pauses (same as Sifra encounter)
- Two-line dialogue box at screen bottom (no portrait — just text, slightly amber-tinted panel to signal this is different from Sifra's encounter)
- Lines displayed with typewriter effect, player taps to advance

**Encounter text:**

> *Contract's a contract. I'll clear the Ruin. Don't get in the way of my work.*
> — GIVI

*(Single line. She does not elaborate. The crystal shard shatters into a brief particle burst.)*

5. **Unlock:** `meta.unlockedHeroes.push('muller')`. "New Hero Unlocked" overlay fires (same format as Sifra's, using Givi's sprite, blue-crystal tint).
6. **Overlay flavor text:** *"Crystals grow on her skin now. She stopped minding. The mines sent her up to fix the tremors. She intends to invoice someone for this eventually."*

**Fallback path:** If `meta.totalWins >= 3` and Muller is still locked, her tile appears in the Forge Recruit tab at 600 gold. No announcement — the tile simply appears on the next visit to ForgeScene. Players who notice it have the option; players who don't continue exploring.

**Design note on the two-condition prerequisite:** Amun represents ground/earth power; Khashin represents wind. Muller is also a ground-force character. Having played both is a soft way of saying "you understand the physical combat archetypes." It also ensures the player has substantial game time before encountering Muller's complexity.

---

## 10. Unlock Progression Flow — Player Journey

```
Session 1
├── Run 1 (Amun, tutorial)
│   ├── Q1 complete (100 kills) → Bastion branch unlocked mid-run
│   ├── Q2 complete (5 min)    → Quake branch unlocked mid-run
│   └── Q3 complete (find Sifra) → SIFRA UNLOCKED
│
Session 2+
├── Run 2–3: Explore Amun fully, try Sifra
├── Run 3 completed (any hero) → IGNARA UNLOCKED
│
├── Runs 4–7: Try Ignara. Accumulate gold.
├── First win (any hero)       → NAZAR UNLOCKED
│
├── Runs 8–12: Spend ~300 gold in Forge Recruit tab → LYRA UNLOCKED
│   OR: Win with Nazar, explore other heroes
│
├── Runs 10–20: Survive 8 min as Sifra → KHASHIN UNLOCKED
│
├── Runs 15–30: Win as Amun + win as Khashin → Crystal Tremor fires → GIVI UNLOCKED (secret)
│   OR: Accumulate 600 gold → GIVI UNLOCKED (fallback purchase)
│
└── All 7 heroes unlocked → Full roster available
```

---

## 11. MetaProgress Schema Requirements

The following fields must be added to `MetaData` in `MetaProgress.ts` to support this system (some may already exist from the tutorial design doc):

```typescript
interface MetaData {
  // ... existing fields ...
  tutorialComplete: boolean           // false on new save; true after Quest 3
  unlockedHeroes: string[]            // default: ['amun']. Others added by conditions.
  heroWins: Partial<Record<string, number>>  // wins per hero — extend existing heroRuns shape
  totalWins: number                   // total boss kills across all heroes
  crystalTremorFired: boolean         // prevent double-fire of Muller secret event
}
```

**Migration guard:** On load, if `unlockedHeroes` is missing or undefined, default to `['amun']`. If `tutorialComplete` is true but `unlockedHeroes` does not include `'sifra'`, add it (backward compat).

---

## 12. Hero Select UI Spec (Additions)

**Locked hero slots** (beyond greyed portrait):
- A 5×7px pixel-art padlock icon centered on the portrait circle (drawn in Graphics — no new asset needed)
- One-line hint text below the hero name in 10px `#666688` color
- Tapping a locked hero: show a 3-second non-blocking toast at center-screen with the full unlock description. This is the only way to see the description — no separate info panel needed.

**Unlock celebration:** When the player returns to StartScene and a hero was just unlocked during the previous run, a brief glow pulse (1.2s tween on the newly unlocked hero's portrait circle, color matching the hero's `color` value from `HeroDef`) plays automatically before the player can interact. Subtle — not a blocking overlay on the StartScene itself. The "New Hero Unlocked" overlay already played at run end.

**Forge Recruit tab:** See Section 8. Positioned as a tab alongside the existing upgrade grid, not a separate scene.

---

## 13. Open Questions

1. **Should winning runs as any hero count for Nazar's gate, or only as "main" heroes (Amun/Sifra)?** Recommend: any hero — this avoids the chicken-and-egg problem where Nazar is locked until Ignara is tried, but Ignara requires 3 runs first.

2. **Crystal Tremor timing (6 minutes vs. earlier):** Could fire at 5 minutes to align with the wave-pressure escalation. 6 minutes was chosen as a point where the player is committed to a run and not likely to quit — revisit in playtesting.

3. **Muller's fallback gold cost (600):** May be tuned lower (e.g., 450) if playtesting shows the secret condition takes too long. The gold path should never feel like a grind for a hero.

4. **Should Lyra have a challenge alternative to the gold purchase?** A possible alternative: "Kill 20 enemies in 3 seconds as Huntress" — except this is her own challenge, which creates a bootstrap problem (she'd need to be unlocked first). Gold is the cleanest path for Lyra unless a cross-hero challenge is designed (e.g., "kill 20 enemies in 3 seconds as any hero" — doable with Amun's Quake branch).

5. **Tutorial replay:** If a player deletes their save or starts fresh, the tutorial fires again (Amun run 1, `heroRuns['amun'] === 0`). This is correct behavior — but the "3 runs to unlock Ignara" counter resets. Confirm this is acceptable.

6. **Khashin challenge (8 min as Sifra) difficulty calibration:** 8 minutes is approximately the wave-7 to wave-8 transition — moderate difficulty. Could be tuned to 7 minutes if the condition proves too steep for mid-level players.

---

## 14. Specialization (Branch) Unlocks

> **Status: DESIGN ONLY** — Intended for post-v0.5 implementation alongside the hero unlock system.

### Design Goals

Branch gating extends the hero unlock philosophy into per-hero progression. The first time a player picks up a hero, they should not face a blank menu of three equally available branches — some branches represent power, identity, or danger that must be earned. The gatekeeping is light (30 min – a few hours per branch) and always thematically coherent: you unlock the ice branch by doing ice things, the shadow branch by surviving as shadow.

**Rules applied across all heroes:**
- Every hero has at least 1 branch free from the first run.
- No hero has all 3 branches free (except Amun, which is handled by the tutorial — see Section 6).
- Gated branch challenges are **in-run milestones** tracked in `meta.branchProgress[hero][branch]` — they accumulate across runs, not within a single run, unless noted.
- On first unlock of a gated branch, a "Branch Discovered" card fires mid-run or a toast appears at run-start on the next session (whichever is cleaner to implement — recommend mid-run toast matching tutorial style).
- Amun's Bastion/Quake gating (Section 6) is the single exception to cross-run accumulation: those unlock within Run 1 and are then permanently free.

---

### 14.1 — Amun (Guardian)

**Branches:** Wrath · Bastion · Quake

| Branch | Start State | Unlock Condition |
|--------|-------------|-----------------|
| **Wrath** | Free — tutorial default | Always available. Amun begins the game in Wrath. |
| **Bastion** | Gated — Tutorial Q1 | Kill 100 enemies in a single run (fires mid-run in tutorial only — permanently free after) |
| **Quake** | Gated — Tutorial Q2 | Survive 5 minutes in a single run (fires mid-run in tutorial only — permanently free after) |

**Design rationale:** This is fully documented in Section 6 and `docs/design-tutorial-scenario.md`. Wrath is the narrative and mechanical starting point — Amun's ancient anger. Bastion and Quake represent earned mastery: the defense of what endures and the awakening of seismic power. Both gates happen within Run 1, never again. All three branches are permanently free after the tutorial.

---

### 14.2 — Sifra (Ice/Lightning Mage)

**Branches:** Lightning · Frost · Shatter

| Branch | Start State | Unlock Condition |
|--------|-------------|-----------------|
| **Lightning** | Free | Available from first Sifra run. The Bramauthroba gave her this — it is not a gift she earned. |
| **Frost** | Free | Available from first Sifra run. The cold is her nature, not a technique. |
| **Shatter** | Gated | **Accumulate across runs:** Freeze or significantly slow 75 enemies while playing as Sifra (either branch counts — any slow/freeze proc increments). |

**Unlock toast (Shatter):**
> *"The ice holds long enough now. Long enough to watch it break."*

**Design rationale:** Sifra arrives with two faces already intact — the storm and the cold. Lightning is the foreign power the Bramauthroba forced into her; Frost is what she was born with. Shatter is different: it requires understanding both in order to weaponize their consequence (frozen things breaking). The 75-slow threshold is achievable in roughly 3–5 Sifra runs at light investment — not a wall, a nudge toward her elemental kit.

---

### 14.3 — Ignara (Fire Mage)

**Branches:** Inferno · Fortress · Havoc

| Branch | Start State | Unlock Condition |
|--------|-------------|-----------------|
| **Inferno** | Free | Available from first Ignara run. Burning things is all she has ever done. |
| **Fortress** | Gated | **Survive a hit that would kill you** (any death-blow that is blocked by armor reduction to 1 HP, or any near-death moment below 10% HP) — 5 times total as Ignara, across runs. |
| **Havoc** | Gated | **Kill 150 enemies with Ignara's fireball explosions** (splash kills count), accumulated across runs. |

**Unlock toast (Fortress):**
> *"The fire doesn't only leave. Some of it stays — on her skin, keeping her standing."*

**Unlock toast (Havoc):**
> *"She stops aiming. The explosions are the point now."*

**Design rationale:** Inferno is the obvious path — Ignara is a glass cannon, she fires fireballs, and Inferno makes them bigger. Fortress is the unexpected lesson: she is not supposed to survive, and Havoc is the chaotic consequence of too many explosions. The Fortress gate tracks near-death moments because standing in the fire is the branch's identity — the player must live dangerously to unlock it. Havoc gates on kill count because chaos at scale is the only honest prerequisite for a branch called Havoc.

---

### 14.4 — Nazar (Shadow Assassin)

**Branches:** Way of the Blade · Way of Venom · Way of Shadow

| Branch | Start State | Unlock Condition |
|--------|-------------|-----------------|
| **Way of the Blade** | Free | Available from first Nazar run. The blade is how he was hired. |
| **Way of Venom** | Gated | **Kill 40 enemies that are already slowed or debuffed** (any source of slow counts — Sifra's aura, Khashin's sand, trap zones, Nazar's own kit at higher levels), accumulated across runs. |
| **Way of Shadow** | Gated | **Win a run as Nazar** (survive to the boss and defeat it). |

**Unlock toast (Venom):**
> *"The desert taught him patience. The poison was already there — in the sand, in the prey."*

**Unlock toast (Shadow):**
> *"He finished the job. He always finishes the job. Now he works differently."*

**Design rationale:** Nazar's unlock requirement (win a run) already establishes him as a skill-gate hero. Way of the Blade starts free because Nazar is defined by his melee. Way of Venom requires awareness of enemy state — a mechanic-literacy check. Way of Shadow is the deepest and most powerful branch (invisibility, phantom trails, Death Mark); it requires a full run win as Nazar because the player must understand the character completely before the shadows open up to them. This is Nazar's second win condition after his hero unlock, creating a layered progression.

---

### 14.5 — Lyra / Huntress (Spear Thrower)

**Branches:** Predator · Stalker · Warden

| Branch | Start State | Unlock Condition |
|--------|-------------|-----------------|
| **Predator** | Free | Available from first Lyra run. She has always been hunting. |
| **Stalker** | Free | Available from first Lyra run. Movement is as natural to her as breathing. |
| **Warden** | Gated | **Pierce through 3 or more enemies with a single spear throw** — do this 20 times across runs (each qualifying throw increments the counter). |

**Unlock toast (Warden):**
> *"One spear. Three dead. She starts doing the math differently after that."*

**Design rationale:** Lyra enters the game as a mobile ranged hunter — Predator (hunt them down) and Stalker (don't let them catch you) are both central to that identity and equally approachable. Warden is the heavy-weapon melee-adjacant specialist branch, gating behind a precise skill expression: lining up a three-enemy pierce. This requires position sense and understanding of spear trajectory. The 20-pierce threshold means a player who has never lined up shots will notice the counter growing naturally — it is a reward for playing well, not a grind for playing long.

---

### 14.6 — Khashin (Wind/Sand/Mirage)

**Branches:** Gale · Dune · Mirage

| Branch | Start State | Unlock Condition |
|--------|-------------|-----------------|
| **Gale** | Free | Available from first Khashin run. Wind came before anything else. |
| **Dune** | Gated | **Blind 30 enemies** as Khashin (Haboob arc's blind proc), accumulated across runs. |
| **Mirage** | Gated | **Survive 3 runs as Khashin** (death is acceptable — completing 3 runs whether won or lost, but the run must reach at least 4 minutes). |

**Unlock toast (Dune):**
> *"The sand does what the wind tells it. He just started listening to the sand."*

**Unlock toast (Mirage):**
> *"By the third time, the Ruin recognizes him. He stops being sure which one is real."*

**Design rationale:** Gale is Khashin's primary identity — wind slash, dust devils, open-air mobility. Dune unlocks through using Khashin's existing Haboob mechanic (sand blinds), so the player is already engaging with the correct inputs. Mirage is the most exotic branch (phantom steps, decoys, desert wind burst) and feels like something the Ruin reveals after familiarity — three runs is enough time to feel the character without being a meaningful gate for any patient player.

---

### 14.7 — Givi / Muller (Crystal Gnome)

**Branches:** Shardfall · Geode Shell · Deep Seam

| Branch | Start State | Unlock Condition |
|--------|-------------|-----------------|
| **Shardfall** | Free | Available from first Muller run. Crystal waves are her work. This is what she was hired to do. |
| **Geode Shell** | Gated | **Take 500 total damage in a single run as Muller** (she must be hit hard before she learns to harden). |
| **Deep Seam** | Gated | **Kill 20 enemies with crystal structures** (Planted Shards, Crystal Pillars, Fault Lines, or Tectonic Fury eruptions), accumulated across runs. |

**Unlock toast (Geode Shell):**
> *"The crystal grew where she bled. She checked the invoice. Acceptable."*

**Unlock toast (Deep Seam):**
> *"The ground opens like a vein. She stops walking around it and starts walking through."*

**Design rationale:** Muller is the game's last unlocked hero and its most mechanically distinct. Shardfall is free because crystal waves are her baseline — you cannot play Muller without them. Geode Shell unlocks through absorbing punishment in a single run (500 damage is substantial but achievable at any difficulty — it teaches the player that Muller is denser than she looks). Deep Seam requires learning her structure-based kit, which naturally accumulates for any player who explores Shardfall's mine-and-pillar options. The single-run damage requirement for Geode Shell is intentionally different from the cross-run accumulation pattern — Muller is the exception that proves the rule.

---

### 14.8 — MetaProgress Schema Additions for Branch Unlocks

```typescript
interface MetaData {
  // ... existing fields from Section 11 ...
  branchProgress: Partial<Record<string, Partial<Record<string, number>>>>
  // shape: branchProgress['sifra']['Shatter'] = 62  (slows applied)
  //        branchProgress['nazar']['Way of Venom'] = 38  (debuffed kills)
  //        branchProgress['ignara']['Fortress'] = 3  (near-death moments)
  //        etc.
  unlockedBranches: Partial<Record<string, string[]>>
  // shape: unlockedBranches['sifra'] = ['Lightning', 'Frost', 'Shatter']
  // Default per hero on first run: see per-hero tables above.
}
```

**Migration guard:** On first run with a hero, initialize `unlockedBranches[hero]` to that hero's default free branches (see tables). Missing keys treated as free-branch default — no lockout regression.

**Branch selection UI:** Locked branches in the level-1 branch picker show a faded card with a padlock and a one-line unlock hint (e.g., *"Freeze 75 enemies to unlock"*). The player can see the branch name and theme but not the skill list. On unlock, the branch card glows briefly before becoming selectable.

---

### 14.9 — Branch Unlock Timing Reference

| Hero | Free Branches | Gated Branch(es) | Approx. Unlock Time |
|------|--------------|-----------------|---------------------|
| Amun | Wrath | Bastion, Quake | Run 1 (tutorial gates) |
| Sifra | Lightning, Frost | Shatter | 3–5 Sifra runs |
| Ignara | Inferno | Fortress, Havoc | 2–6 Ignara runs (varies by playstyle) |
| Nazar | Way of the Blade | Way of Venom, Way of Shadow | 3–8 Nazar runs |
| Lyra | Predator, Stalker | Warden | 3–7 Lyra runs (pierce skill check) |
| Khashin | Gale | Dune, Mirage | 2–5 Khashin runs |
| Givi (Muller) | Shardfall | Geode Shell, Deep Seam | 1–4 Muller runs |
