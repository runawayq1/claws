# CLAWS — Balance Review: Necromancer & Nightborne
*Reviewer: Balance/Math Agent | Date: 2026-04-13 | Against: DESIGN_DOC.md v2026-04-12*

---

## 1. Full Hero Roster — Base Stats Comparison

| Hero | HP | Speed | Damage | Range | CD (ms) | DPS (base) | Attack Type | Survivability |
|---|---|---|---|---|---|---|---|---|
| Ignara | 80 | 140 | 30 | 180 | 700 | **42.9** | Fireball AoE | Low HP, mobile |
| Sifra | 70 | 150 | 12 | 160 | 800 | 15.0 | Ice/Lightning | Lowest HP, fastest |
| Amun | 160 | 120 | 22 | 65 | 800 | 27.5 | Shockwave 360° | Highest HP, slow |
| Nazar | 90 | 140 | 18 | 55 | 400 | **45.0** | Melee/Poison | Mid HP, fast CD |
| Lyra | 80 | 140 | 18 | 300 | 500 | 36.0 | Spear/Earth | Low HP, long range |
| Khashin | 90 | 140 | 18 | 160 | 900 | 20.0 | Sand/Wind | Mid HP, evasion |
| Givi | 160 | 110 | 38 | 260 | 1100 | **34.5** | Crystal | Highest HP, slow |
| **Necromancer** | **75** | **120** | **22** | **220** | **1000** | **22.0** | Soulbolt/Summon | Lowest HP + army |
| **Nightborne** | **110** | **105** | **28** | **90** | **850** | **32.9** | Void Arc | Mid HP, displacement |

**DPS formula**: `(Damage / CD_in_seconds)` — single-target, no AoE multiplier, no skill bonuses.

**Roster band analysis**:
- Low DPS tier (≤22): Sifra (15.0), Khashin (20.0), Amun (27.5), Necromancer (22.0)
- Mid DPS tier (23–38): Lyra (36.0), Givi (34.5), Nightborne (32.9)
- High DPS tier (38+): Nazar (45.0), Ignara (42.9)

Note: Sifra/Khashin's low raw DPS is compensated by DoT stacking and area denial. Amun's 360° hit multi-target compensates for low single-target DPS. These modifiers must be considered when reading the new heroes below.

---

## 2. Necromancer — Detailed Balance Analysis

### 2a. Base Stats Assessment

**HP 75**: Lowest in the roster. Even Sifra at 70 has 150 speed (mobility as defense). The Necromancer at 120 speed cannot outrun threats. At wave 10, a Goblin deals 6 DPS and a Flying Eye deals 10 DPS — the Necromancer dies to two simultaneous Flying Eyes in ~4 seconds if minions are not absorbing. This is intentional by design ("army is his armor"), but the safety net is entirely dependent on Summon stance being functional immediately.

**Speed 120**: Matches Amun (160 HP, 22 DMG). Amun survives low speed because shockwave ring clears melee radius enemies. Necromancer lacks this self-clearing radius attack. Early waves before minions are established are a weak point.

**Damage 22 / CD 1000ms → DPS 22.0**: Reasonable for a summoner anchor. However the soulbolt is a *projectile* fired at a single target, not AoE. Amun's 22 damage hits *every* enemy in ring radius per cast. Necromancer's raw bolt DPS competes only with Khashin's per-bolt output, and Khashin has AoE through the cone shape. The bolt needs to feel relevant in non-Summon play or the Staff stance is abandoned immediately.

**Range 220**: Strong. Second highest after Lyra (300). This partially compensates for low speed — the Necromancer can engage before enemies close to melee distance. Appropriate.

### 2b. Skill Analysis — Void Branch

**Soul Rift (nc1)**: Fragments at 30% primary (3× = 90% combined). With L3, primary + fragments deal roughly 1.9× the base bolt damage. Net multiplier is healthy — not overpowered.

**WARNING — Withering Curse (nc2)**: At L2–L3, Soul Marked applies −15% enemy damage *and* −20% enemy move speed for 4s. Combined with the Necromancer's ranged playstyle, enemies are permanently debuffed. At the fire rate of 1000ms CD and mark duration of 3–4s, near-100% uptime is achievable on any enemy that takes more than one hit to kill. This is strong crowd control for what is a damage-oriented branch.
- Recommendation: Reduce speed slow to −12% (from −20%) or tie it to L3 only with 2s duration instead of sharing the 4s of Weakened.

**Death Coil (nc3)**: Bounce to nearest enemy within 120–160px. At L3, bounces twice with Soul Mark re-application. This is clean chain-DPS. The 160px chain distance is short enough to not trivialize spread-out enemies. Healthy.

**Hemorrhagic Mark (nc4)**: Bleed at 8% dmg/tick every 0.4–0.5s over 3s = ~6 ticks = 48–50% additional damage over the mark window. At L3, Soul Shard drops restore 4 HP on bleed expiry. This is substantial passive healing when combined with Grave Harvest (ne2). Cross-branch stacking of healing effects warrants watching but is not automatic — requires two branch investments which won't coexist in most runs.

**CRITICAL — Death Beam (nc5)**: 140% bolt damage per tick at 0.2s intervals for 1.5–2s = 7–10 ticks = 980–1400% damage total per target in beam path. At unlimited pierce, this hits every enemy in a line simultaneously. With bolt base 22 damage, that's 22 × 1.4 × 7–10 ticks = 215–308 damage per enemy in line. A wave-10 Grunt has ~80 HP scaled; a Heavy Skeleton ~140–180 HP. The Death Beam *deletes* entire lines. This is likely the intended power spike for the ultimate, but at 10s cooldown it will recur every 10 seconds.
- Recommendation: Reduce ticks to 0.3s intervals (5 ticks in 1.5s) at L1, not 0.2s. Or keep tick rate but reduce per-tick % to 90% instead of 140%. L3 double shot during Lich Form (ne5) + Death Beam at this tick rate would be game-breaking — flag this combo.

### 2c. Skill Analysis — Requiem Branch (Summoner)

**Restless Dead (nd1)**: Caps out at 9 permanent minions (no duration expiry at L3). This is a fundamental shift — from temporary army to permanent standing force.

**CRITICAL — Minion Cap vs MOB_CAP_MAX = 200**: 9 permanent minions occupying 4.5% of the mob cap. GameScene presumably does not count player minions against MOB_CAP — this needs explicit verification before implementation. If minions are spawned as enemy-type entities without cap exclusion, 9 minions at late game could push the cap to 191 enemies allowed, which is fine. But if minions *do* count against a shared pool, the Necromancer is a degenerate case — he benefits from the mob cap being lower (fewer enemies = fewer things killing minions).
- Recommendation: Mark minions with a `isPlayerMinion = true` flag, exclude from MOB_CAP_BASE/MOB_CAP_MAX calculation, and cap minion count separately (9 max regardless of mob cap).

**NOTE — Minion DPS calculation**:
- Base minion has no defined DPS in the design doc. Assuming minion damage inherits a percentage of Necromancer's base damage (22). If minions deal 100% of base: 9 minions × 22 dmg × (assumed 1.0s CD per minion) = **198 DPS at full army**, vastly exceeding any direct-damage hero (Nazar at 45 DPS is the current top). Even at 50% base damage inherited, 9 minions = **99 DPS**.
- Recommendation: Minion stats must be explicitly defined. Suggest minion base damage = 8–10, CD = 1200ms, range = 60px melee. At these numbers: 9 × ~8 / 1.2 = 60 DPS, competitive but not dominant.

**Bone Armament (nd2)**: +40% minion HP, +25% dmg at L1 — scaling is reasonable for a tier-1 branch skill. L3 death explosion at 60% Necro damage (13 dmg, 50px AoE) is flavor, not balance concern.

**Wraith Caller (nd3)**: Every 3rd summon at L3 produces a Wraith (phases through, 80% dmg/pass). The "phases through enemies" mechanic on each sweep implies multiple hits per pass, which is undefined. How many enemies does a Wraith pass through per sweep? If the Wraith sweeps through clusters continuously, this becomes extremely high DPS with undefined ceiling.
- Recommendation: Define the Wraith pass as a single sweep per `wraith_attack_cd` (suggest 1.5s), hitting all enemies in its 120px-wide path once per sweep. Cap Wraith damage explicitly.

**NOTE — Dark Command (nd4)**: Minion surge dealing 80–120% of normal hit damage on arrival. At 9 minions, this is a 7.2–10.8× burst every 6–8s. High but acceptable — it's an active ability requiring player input, not automatic.

**Undying Tide (nd5)**: On-kill minion spawning during the window (L3: max 2 bonus per window) is bounded. The 20s CD vs 10s window means 50% uptime. Combined with permanent minions from nd1-L3, this creates brief windows of up to 9+3 = 12 minions. Flag but not critical — the window is defined.

### 2d. Skill Analysis — Covenant Branch

**Soul Siphon (ne1)**: 5–12% lifesteal on bolt hits. At 22 base dmg with 1000ms CD, this is 1.1–2.64 HP/s passively. Modest. L2 extension to minion damage adds more — at the recommended minion DPS of 60, lifesteal at 8% adds 4.8 HP/s from minions. Reasonable sustain.

**Grave Harvest (ne2)**: 8–12 HP on kill. At wave 10, killing 2+ enemies per second yields 16–24 HP/s — effectively full heal on kill rate. L3 soul orb attraction removes the positional cost. This is extremely strong in the late game where kill rates are high.
- Recommendation: Reduce base orb HP to 6 (L1) / 8 (L2), or add a 1s cooldown between orb pickups to prevent stacking.

**Blood Ritual (ne3)**: Sacrifice 12% HP for 2× damage × 3–5 hits. At 75 HP base, 12% = 9 HP sacrificed. With full lifesteal from ne1 + ne2, this cost is recovered in under 1 second at high kill rates. The sacrifice mechanic loses its risk identity if recovery is immediate.
- Recommendation: Ritual sacrifice should use *maximum* HP %, not current HP, to keep the cost meaningful even at full sustain. Change to: "sacrifice 12% of *max* HP."

**Death Pact (ne4)**: Minions survive one lethal hit per 5–8s. The design text says "30% of incoming damage redirected away and ignored." This is unclear — does the Necromancer take 30% of the minion's incoming damage? Or do minions take 70% of damage? The wording needs to be resolved before implementation. Assuming the intended reading is "minions survive lethal hits once per CD," the effect is a minion durability passive — acceptable.

**Lich Ascendant (ne5)**: 10–12s form, ×3 sustain effects, double shots at L3, 30s CD. The ×3 sustain amplification combined with Grave Harvest (24–36 HP per kill × 3 = 72–108 HP/kill during form) and Soul Siphon (12% lifesteal × 3 = 36% lifesteal) creates an essentially unkillable window.
- This is an *ultimate*, 30s CD, 10–12s duration — high power windows are acceptable in VS-style games. The double shot at L3 (600ms effective CD on bolt) stacked with Death Beam (nc5) creates the danger case. Flag these two ultimates as mutually exclusive or nerf the combo: if Death Beam channels, double shot should not apply.

---

## 3. Nightborne — Detailed Balance Analysis

### 3a. Base Stats Assessment

**HP 110**: Mid-range. Higher than glass cannons (Sifra 70, Ignara 80, Lyra 80), lower than tanks (Amun 160, Givi 160). Sits just above Nazar (90) and Khashin (90). Appropriate for a melee hero with displacement tools — not punishing for the player, not trivially forgiving.

**Speed 105**: This is a problem. The design doc says "above average; built for aggressive repositioning" — but 105 is *below* every existing hero. Current roster minimum is Givi at 110, and Givi compensates with Crystal Wall area denial. Nightborne's melee identity requires closing distance, but 105 speed means enemies (Goblins at 140+w×8) are often faster by mid-game.

**CRITICAL — Speed mismatch**: A hero described as "built for aggressive repositioning" at 105 base speed will feel sluggish and wrong. Void Step (nr1) provides a 50–100px blink per attack, which partially compensates, but only when attacking. Repositioning *between* fights, fleeing from dangerous areas, and reaching targeted enemies will feel slow. The Void Step blink should cover this gap, but that requires taking the Rift branch — meaning Void Blade and Phantom players are stuck at 105.
- Recommendation: Increase base speed to 125. This remains below Nazar (140) and Khashin (140), appropriate for a melee hero who blinks rather than kites.

**Damage 28**: Strong melee baseline. Compare Nazar at 18 (but 400ms CD = 45 DPS) and Amun at 22 (360° ring). Nightborne at 28 with 850ms CD = 32.9 DPS. Appropriate.

**Range 90**: The 150° arc at 90px is slightly wider than Nazar's melee (55px range). Fits the arc geometry — the player physically swings a wider area at shorter range. Acceptable as designed.

**CD 850ms**: Faster than Amun (800ms base 360° ring). Justifiable — arc is 150°, not 360°, so fewer targets per swing. Healthy.

### 3b. Void Blade Branch

**Void Edge (nb1)**: +20%/35%/50% damage + arc extension 90→130px. Clean linear scaling, nothing exceptional. At L3 total 50% damage bonus: 28 × 1.5 = 42 dmg. DPS with L3: 42/0.85 = 49.4 — pushing into high tier. Acceptable as a dedicated damage branch maxed.

**Cleave (nb2)**: Arc from 150° to 270° at L3. This is a dramatic change — 270° effectively covers almost 3/4 of the surrounding circle. At 90–130px range, this becomes a near-ring attack. With the outer-edge +20% damage bonus, enemies at the flanks take more than enemies at the center. The differentiation is interesting design.
- WARNING: 270° arc at L3 combined with Amun's Wrath branch structure creates an implicit overlap — Nightborne becomes a near-ring melee hero, eroding the distinction from Amun (360° shockwave). Consider whether 270° is intentionally positioned as "almost but not quite Amun."
- Recommendation: Accept 270° — the distinguishing factor remains that Nightborne is melee range, does not knock back, has no ring AoE VFX, and the Amun ring fires from player center outward while Nightborne's is a physical blade arc. Distinct enough.

**Void Surge (nb3)**: Every 3rd attack at L3: expanding ring 220px, 100% damage. With 850ms CD, surges fire every 2.55s. The ring at 220px covers a very large AoE (2× Ignara's base splash radius). At 100% damage (28 × 1.5 with nb1 = 42), this hits everything within 220px for 42 damage every 2.55s = 16.5 DPS AoE bonus. At wave 10, this alone is clearing Grunt HP (80 scaled) in ~5 hits in the AoE zone.
- WARNING: The slow zone residual (50% speed, 1s, 80px at L3) on surge detonations stacks with Void Zone (nr3) DoT if both branches are taken. These two are in different branches so cannot normally coexist — note this interaction for multi-branch scenarios if ever enabled.

**Dark Resonance (nb4)**: 2nd hit within 1.5s on same enemy: 40–80px AoE, 50–100% damage burst. At 850ms CD, the second hit on the same target is 850ms after the first — well within the 1500ms window. **This means Dark Resonance triggers on virtually every second attack against the same target in a fight.** Effective DPS increase against bosses: approximately +50–100% of one hit every 2 attacks = +25–50% overall DPS boost against high-HP single targets.
- This is the boss-killer mechanic. At L3 (100% resonance + stagger), Nightborne gains a stagger vs bosses every ~1.7s. Claws Boss (4000 HP) — see section 5. Note that the 0.4s stagger frequency against the boss needs a cooldown. If the boss has no stagger immunity window, the Nightborne can perma-stagger it.
- Recommendation: Add a per-enemy resonance cooldown: after a resonance detonation, that enemy (or boss) is immune to resonance detonation for 2s.

**Void Ascendant (nb5)**: 6–10s, halved CD (425ms), +80% dmg, secondary crescent projectile at 30% dmg, L3 burst for 120% on activation.
- Active DPS during form: (28 × 1.8 / 0.425) = 118.6 DPS from main attacks alone. Secondary projectile adds 30% × same interval = extra ~35.6 DPS. Total ~154 DPS for 6–10s. Against Claws Boss (4000 HP) at 10 minutes, this deals 924–1540 damage per use — a meaningful chunk of boss HP (~23–38%).
- At 30s CD, this can fire once per use in most 10-minute runs in the boss fight window. Acceptable power spike. Not game-breaking.

### 3c. Phantom Branch

**Echo Strike (np1)**: 0.2s delayed echo for 35%→50% + chain echo at 25%. Main attack + echo1 + echo2 = 100% + 50% + 25% = 175% per attack cycle. Effective DPS multiplier: 1.75×. At 32.9 base DPS: 57.6 DPS with L3 Echo Strike alone. This is the highest non-ultimate DPS of any tier-1 branch skill in the roster.
- WARNING: This is a passive multiplicative 1.75× DPS with no condition — it fires automatically every attack. Compare Ignara's White Fire L3 at +60% dmg (1.6× on bolt), which also has the same level of investment but Ignara's base DPS starts at 42.9 before the bonus. Echo Strike feels overtuned as a 3-skill passive multiplier without condition.
- Recommendation: Reduce L3 chain echo to 20% (not 25%) and increase delay from 0.15s to 0.25s. Or make the second echo conditional: only fires if the first echo hit an enemy. This introduces a miss condition that prevents trivial full-value in sparse encounters.

**Split Shade (np2)**: Decoy on hit received — straightforward defensive utility. Cooldown 3–6s. The shade dealing 20% echo damage at L2–L3 is a nice bonus, minimal power impact. Balanced.

**Phantom Veil (np3)**: 30–80% damage negation during attack cooldown window. At 850ms CD, there is always an active cooldown window. This means Phantom Veil is *always active* — the "during attack cooldown window" qualifier sounds like a restriction but there is no window where Nightborne is not in a cooldown period.
- CRITICAL: The 80% damage negation at L3 on a passive with guaranteed uptime effectively gives Nightborne an 80% damage reduction to all incoming enemy attacks. This outperforms Amun's best Bastion build (Iron Will caps damage at 10% max HP per hit, not a percentage reduction). No existing hero approaches 80% sustained passive mitigation.
- Recommendation: Rework the trigger to "if enemy attack hits during the first 400ms after an attack (not the full cooldown window)" — this creates a genuine active/vulnerable split. Or change to: "30/45/60% negation chance" (not 55/80%) to make it a probabilistic dodge rather than near-certainty.

**Mirror Swarm (np4)**: On kill, phantom performs 1–3 slash attacks (100% base damage). At L3 with chain phantom (50% damage, 1 slash on phantom kill), this becomes a small kill-chain reaction. The phantom attacks once in 80px range, then is gone. Power level: each kill adds 1–3 bonus attacks = +100–300% of one attack per kill. In dense waves with many kills per second, this is substantial bonus DPS but it scales with kill count, not arbitrarily.
- NOTE: Define whether phantom slashes can trigger Dark Resonance, Void Surge, or other on-attack effects. If yes, cross-branch synergies need capping. Recommend: phantom slashes do NOT trigger on-attack proc effects — they deal flat damage only.

**Shade Legion (np5)**: 4 duplicates at 70–85% damage, attacking every 600ms for 5–8s. DPS from legion: 4 × (28 × 0.85 / 0.6) = 158 DPS for 7s. Plus Nightborne is invulnerable during the 7s. Total burst window damage from duplicates: 158 × 7 = 1108 damage dealt.
- At 42s CD, this fires roughly once per minute. Power budget is high but bounded by the long cooldown. The collapse implosion at L3 (160px AoE, 150% damage = 42 dmg) is a cherry on top, not a balance issue. Acceptable.
- WARNING: With Echo Strike L3 active, each of the 4 duplicates also fires an echo — 4 duplicates × 1.75× echo multiplier = effective 7 attackers for 7s. This cross-branch combo should be explicitly tested. Recommend the echo mechanic be flagged as "player-only" — it should not apply to Shade Legion duplicates or Mirror Swarm phantoms.

### 3d. Rift Branch

**Void Step (nr1)**: 50–100px blink per attack toward nearest enemy. This is a passive movement tool built into the attack loop. The micro-rifts at origin (L3: 20px, 0.5s, 20% dmg) are flavor. The blink distance addresses the speed concern partially — but only while attacking. See speed recommendation in 3a.

**Rift Anchor (nr2)**: Auto-teleport below 25–35% HP. Effectively an automatic death prevention tool. At 9–6s CD, combined with Nightborne's 110 HP and mid-game sustain, this is a survivability crutch that fires frequently. The 130% damage return (L3) at 50px when anchoring makes fleeing offensive.
- NOTE: Defined as "first new auto-repositioning tool in the game." Mechanically interesting. The "auto-trigger below 35% HP" is not oppressive — it fires once per 6s and requires HP to be low. Balanced.

**Void Zone (nr3)**: Kill-triggered zone 40–80px radius, 3–6s duration, 8–20% DoT, 25% slow to attack rate. At high kill rates (wave 10, ~3–5 kills/second in cluster), the map becomes saturated with void zones. Zone overlap is not addressed — if multiple zones stack, the DoT and slow stack multiplicatively.
- WARNING: Define zone behavior on overlap: either zones do not stack (only the most recent matters) or they share a refresh behavior. Additive stacking at 3–5 zones simultaneously = 60–100% DPS/s from ground alone, effectively an instant-kill field. Recommend: zones do not stack DoT — a new zone at the same location refreshes duration only.

**Spatial Tear (nr4)**: Every 5–8s: 80–140px AoE burst at nearest enemy, 120% damage. Provides ranged capability to a melee hero on a timer. With 28 × 1.2 = 33.6 burst damage at a 5s CD = 6.7 effective ranged DPS. This is minor supplemental damage but enables engaging from distance. Conceptually interesting for a "pure melee" hero — it breaks the melee-only identity.
- NOTE: The design notes Nightborne as "pure melee with no ranged option" but Spatial Tear gives a ranged nuke every 5s at L3. This is a mechanical contradiction. Either frame Spatial Tear as "void energy eruption, not physical range" (acceptable flavor framing) or reduce it to an AoE centered on Nightborne rather than at enemy location, preserving melee identity.

**CRITICAL — Rift Collapse (nr5)**: 200–280px pull radius, 180–280% damage, 28–34s CD.
- Maximum damage: 28 × 2.8 = 78.4 per enemy. Against a pulled cluster of 30 enemies at wave 15: 78.4 × 30 = 2352 damage dealt in one cast. That is more total damage than all other ultimates combined in a single cast.
- Even moderate case: 20 enemies, 180% at L1 = 28 × 1.8 = 50.4 × 20 = 1008 damage per cast at a 40s CD.
- For reference, Ignara's Infernal Cadence (Wildfire ultimate) deals roughly 5 enhanced shots at ×3 speed during 6–10s. Against a cluster: 30 × 1.3 (×3 burn stacks) × 6 shots ≈ 234 total damage burst.
- Rift Collapse at L3 outperforms Infernal Cadence by approximately 4–10× in cluster damage. This is not a "powerful ultimate" — it is a run-ending button.
- Recommendation: Either reduce pull % damage to 120–140% (still a strong CC ultimate) and position it as a setup tool for follow-up attacks rather than a one-shot finisher. Or keep 280% but with a much longer CD: 55–60s (comparable to Shade Legion at 35–50s). The pull + AoE combination is the new mechanic — the damage number should not also be maximum.

---

## 4. Summoner Balance — Necromancer Minion Economy

### Minion DPS vs Direct Damage Heroes at Maximum Army

| Scenario | Hero | DPS |
|---|---|---|
| Best existing single-target | Nazar (no skills) | 45.0 |
| Best existing with skills | Nazar (max Blade) | ~90–100 |
| 9 minions (undefined stats) | Necromancer (Requiem L3) | **undefined** |
| 9 minions (recommended stats: dmg 9, CD 1200ms) | Necromancer | ~67.5 |
| 9 armored warriors (+25% dmg from nd2) | Necromancer | ~84.4 |

Recommended minion stats (to be defined in implementation):
- **Skeleton**: HP=30, Damage=9, AttackCD=1200ms, Range=55px (melee)
- **Skeletal Warrior** (nd2 upgrade): HP=42 (+40%), Damage=11 (+25%), CD=1200ms
- **Wraith** (nd3): HP=20, Damage=15 (70–80% of Necro base), passes through enemies in 1 sweep per 1500ms, range=100px
- Minions do **not** inherit Forge meta-upgrades (damage, HP bonuses) — they scale only through branch upgrades

At these numbers, 9 warriors dealing 84.4 DPS puts the Necromancer in the same tier as a skilled Nazar run. **This is appropriate and intended.**

### Minion Count vs Mob Cap Safety

With MOB_CAP_MAX = 200 and permanent minions capped at 9:
- At wave 17 (mob cap = min(200, 20 + 17×12) = 224 → 200), 9 player minions must not count against this cap.
- Recommend: implement `PlayerMinion` class extending `Phaser.Physics.Arcade.Sprite` (not `BaseEnemy`), entirely separate from the WaveManager spawn pool. Minion limit is managed independently by the Necromancer's state.

---

## 5. Boss Fight — Claws (4000 HP, Percent-Based Damage)

*Boss spawns at 10:00, stops all wave spawns. No enemy/mob data beyond HP=4000 in DESIGN_DOC. Assumes boss deals % of player max HP per hit, contact range ~50px.*

### Necromancer vs Claws Boss

**Meat shield effectiveness**: 9 minions in a boss fight create a persistent "aggro spread" layer only if minions have threat/aggro. As basic melee entities, minions will pathfind toward the boss and intercept contact range, effectively padding the space between Necromancer and boss hitbox.
- With boss contact kill range of 50px and 9 melee minions around the boss, the Necromancer can maintain 150–200px distance while minions engage.
- However, if the boss has an AoE or sweep attack (not specified in DESIGN_DOC), minions die instantly, removing protection.
- Verdict: Necromancer boss survivability is **heavily context-dependent on boss attack patterns.** If boss is melee-only, minions provide strong passive defense. Flag this for WaveManager boss spec.

**Sustained damage vs Claws Boss**:
- Staff stance: 22 DPS × 600s boss window (theoretical) would be 13,200 dmg, but boss spawns at 10:00. In practice, the boss fight is 60–90s. Pure bolt damage: 22 × 85s ≈ 1870 — less than half the boss HP.
- With Void branch (Death Beam + Soul Rift + Hemorrhage): feasible but requires specific skill investment.
- VERDICT: Necromancer is **viable vs boss** if build is offense-oriented (Void branch), **marginal** if pure Requiem. Requiem's Dark Command surge can dump 9 minions at 120% damage simultaneously for a burst that needs explicit boss DPS math: 9 × 11 × 1.2 / 0.6s window = 198 damage burst every 6s = 33 DPS from command alone. This stacks on top of bolt DPS. **Total Requiem Necromancer boss DPS: ~55.** Achievable.

### Nightborne vs Claws Boss

**Pure melee at 50px contact range**: This is exactly the boss's kill range. Nightborne must occupy the same zone as an instakill threshold. 
- Void Step (nr1) at L3 blinks 100px toward enemy per attack, positioning Nightborne inside the kill zone on every attack.
- Rift Anchor (nr2) auto-teleports when HP < 35%, providing a panic escape — but the player returns to the anchor location, which may also be dangerous.
- At 110 HP, if the boss deals 30–40% max HP per hit (standard for VS bosses), each hit = 33–44 damage. Nightborne dies in 3 hits with no mitigation.
- Phantom Veil (np3) at L3 (80% negation during cooldown) makes this manageable — but requires Phantom branch investment.
- CRITICAL: Without Phantom branch investment, Nightborne's boss survivability is the worst in the roster, worse than Sifra (70 HP but 150 speed to dodge). The design should acknowledge this explicitly and ensure at least one branch provides meaningful boss survivability (Rift Anchor does, but only if the player takes the Rift branch).

**Dark Resonance vs Boss**: As noted in section 3b, the 850ms attack CD means resonance triggers every 1.7s against the boss. With 0.4s stagger, the boss is staggered 24% of the time. **Without a resonance CD on the boss, this is permanent partial-stagger, which may break boss encounter design.**

---

## 6. Severity Flags Summary

| ID | Hero | Skill | Severity | Issue |
|---|---|---|---|---|
| N-01 | Necromancer | Death Beam (nc5) | CRITICAL | 140% dmg/tick at 0.2s = 10 ticks, unlimited pierce — too much sustained line damage |
| N-02 | Necromancer | Minion DPS | CRITICAL | No defined minion stats — army DPS is undefined/uncapped |
| N-03 | Necromancer | Mob Cap interaction | CRITICAL | Minions must not count against MOB_CAP_MAX; needs implementation spec |
| N-04 | Necromancer | Grave Harvest (ne2) | WARNING | 16–24 HP/s healing at wave 10 kill rates, trivializes sustain |
| N-05 | Necromancer | Blood Ritual cost | WARNING | 12% *current* HP sacrifice recoverable in <1s at high kill rate — loses risk identity |
| N-06 | Necromancer | Withering Curse slow | WARNING | −20% enemy move speed on Mark = near-permanent kiting at 3–4s duration |
| N-07 | Necromancer | ne5+nc5 combo | WARNING | Double shot during Lich Form + Death Beam = extreme overlapping ultimates |
| N-08 | Necromancer | Wraith DPS ceiling | WARNING | "Phases through enemies" per sweep is undefined — needs per-pass hit limit |
| NB-01 | Nightborne | Base Speed 105 | CRITICAL | Below all existing heroes; contradicts "built for repositioning" design intent |
| NB-02 | Nightborne | Rift Collapse (nr5) | CRITICAL | 280% damage × 30 enemies = 2352 damage per cast; approximately 4–10× other ultimates |
| NB-03 | Nightborne | Phantom Veil (np3) | CRITICAL | 80% passive mitigation with near-100% uptime; outperforms every tank hero |
| NB-04 | Nightborne | Dark Resonance boss stagger | WARNING | 0.4s stagger every 1.7s on boss without immunity window = near-perma stagger |
| NB-05 | Nightborne | Echo Strike (np1) | WARNING | Passive 1.75× DPS multiplier with no condition; overtuned for tier-1 passive |
| NB-06 | Nightborne | Void Zone stacking (nr3) | WARNING | Multiple overlapping zones could additively stack DoT — needs overlap rule |
| NB-07 | Nightborne | Spatial Tear breaks melee identity | NOTE | Ranged nuke every 5s contradicts "pure melee" design spec |
| NB-08 | Nightborne | Echo/Phantom combo | NOTE | Shade Legion duplicates + Echo Strike multiplier = 7 effective attackers; flag for testing |

---

## 7. Specific Number Recommendations

### Necromancer

| Stat / Skill | Current | Recommended | Reasoning |
|---|---|---|---|
| Base HP | 75 | **80** | Matches Ignara (also ranged, similar role). 75 is punishing in early waves before army establishes |
| Base Speed | 120 | **120** | Keep — slow movement is part of the design identity |
| Minion base damage | undefined | **9** | 9 minions × 9 dmg / 1.2s = 67.5 DPS max, competitive without dominating |
| Minion base HP | undefined | **30** | Survives 3–4 Grunt hits (80 HP × 4 DPS = ~8 hits at wave 10 — fine) |
| Minion base CD | undefined | **1200ms** | Feels active; not a turret |
| Death Beam tick interval (nc5-L1) | 0.2s | **0.3s** | Reduces to 5 ticks (L1), 6–7 ticks (L2) — still devastating, less extreme |
| Death Beam dmg/tick (nc5) | 140% | **110%** | 5 ticks × 110% = 550% total per beam — still 2.5× a single bolt hit |
| Withering Curse slow (nc2-L3) | −20% | **−12%** | Or limit to 2s (not the full 4s of Weakened) |
| Grave Harvest HP (ne2-L1) | 8 HP | **5 HP** | Reduces early-access sustain; L3 still 8 HP with attraction |
| Grave Harvest HP (ne2-L2) | 12 HP | **8 HP** | |
| Blood Ritual sacrifice | 12% current HP | **12% max HP** | Preserves risk across sustain builds |

### Nightborne

| Stat / Skill | Current | Recommended | Reasoning |
|---|---|---|---|
| Base Speed | 105 | **125** | Below all heroes; "repositioning" identity requires competitive mobility |
| Rift Collapse dmg (nr5-L1) | 180% | **120%** | Pull is the primary value; damage should not also be maximum |
| Rift Collapse dmg (nr5-L2) | 220% | **150%** | |
| Rift Collapse dmg (nr5-L3) | 280% | **180%** | Still highest per-hit ultimate in roster, but pull limits total |
| Rift Collapse CD (nr5-L3) | 28s | **40s** | Even at 180% damage, 28s on a 280px pull AoE is very short |
| Phantom Veil negation (np3-L2) | 55% | **40%** | |
| Phantom Veil negation (np3-L3) | 80% | **55%** | Active-window dodge, not sustained 80% DR |
| Echo Strike chain (np1-L3) | 25% dmg | **20% dmg** | And: only fires if echo-1 hit an enemy |
| Dark Resonance boss CD | — | **Add 2s per-enemy resonance immunity** | Prevent perma-stagger on boss |
| Void Zone stacking | undefined | **Refresh-only (no DoT stack)** | Prevent multiplicative field DoT |

---

## 8. Ready-to-Implement Verdict

### Necromancer
**Verdict: CONDITIONAL — Ready with mandatory pre-implementation work**

Blockers before coding:
1. Define explicit minion stat block (HP, damage, CD, range) — do not inherit from Necromancer stats
2. Implement `PlayerMinion` as non-enemy entity class, exclude from MOB_CAP
3. Apply Death Beam tick rate and damage nerf (N-01)
4. Change Blood Ritual to use max HP (N-05)
5. Reduce Grave Harvest heal values (N-04)

Non-blocking but recommended before release:
- Resolve Withering Curse slow value (N-06)
- Define Wraith sweep mechanic precisely (N-08)
- Add Lich Form / Death Beam combo restriction (N-07)

The core design — staff DPS vs army commander duality, soul economy, on-death triggers — is original and well-conceived. The mechanical framework is sound. These are tuning issues, not architectural flaws. **Estimated implementation readiness: 2–3 sessions with changes applied.**

---

### Nightborne
**Verdict: NOT READY — Requires revision of 3 critical items before implementation**

Blockers:
1. Fix base speed to 125 (NB-01) — impacts every feel metric of the hero
2. Nerf Rift Collapse damage (NB-02) — as written it trivializes mid-to-late game
3. Rework Phantom Veil to not grant near-100% uptime 80% DR (NB-03) — breaks hero balance

Once those three are resolved, the design is extremely strong and mechanically distinctive. The Void Blade branch is a clean damage escalation; the Phantom branch's duplication fantasy is unique and well-bounded; the Rift branch's pull/zone/teleport toolkit is the most tactically interesting branch set in the current roster. Dark Resonance as a boss-killer mechanic is inspired.

**Estimated implementation readiness after revisions: 1–2 sessions.**

---

## 9. Comparative Design Health

Both new heroes introduce mechanics genuinely novel to the CLAWS roster:
- **Necromancer**: persistent minion army, Soul Marked debuff, HP-cost mechanics, on-death triggers — all absent from existing heroes
- **Nightborne**: pull AoE, blink-attack loop, spectral duplication, kill-triggered void zones, auto-repositioning anchor — all absent from existing heroes

Neither hero is a reskin of an existing design. The differentiation from thematically adjacent heroes (Necromancer ≠ Khashin's Dust Devil; Nightborne ≠ Nazar's stealth/poison) is clearly articulated and holds up mechanically. Both designs have a strong identity and should feel distinct in play.

The number issues are fixable in an afternoon of tuning. The architecture is worth building.
