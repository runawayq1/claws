# Nightborne (Нічнонароджений) — Void Blade Design Doc

**Version:** 1.0 | **Date:** 2026-04-13

---

## Lore

No one who has seen the Nightborne remembers seeing him arrive. One moment the battlefield is noise and firelight; the next, something is standing in the middle of it that was not there before — purple light tracing the edge of a blade that does not belong to any metal anyone has named. The soldiers of Amunat called him *Nikhtalor*, the Tear in the Dark. The nomads who cross the Kharan Wastes have a simpler word: wrong. They say he feels wrong the way the air feels wrong before lightning — a pressure behind the eyes, a sense that the space you are standing in has just decided it would rather be somewhere else.

What is known: he came through a rift. Not a door, not a portal with ritual circle and burning candles — a rift, the kind that opens when the void presses too hard against the membrane of the world and something punctures through. Whether he tore it himself or fell through it, he has not said. He speaks little. What he does, instead, is move through the battlefield as though the rules that govern it — range, position, the gap between where you are and where a blade can reach — do not apply to him with the same force they apply to everyone else.

His blade is not steel. It is a shard of the void itself, compressed into an edge. It does not cut flesh the way metal does. It cuts the space between flesh and the world — and then the flesh collapses into the gap.

He is not hunting anyone. He is, by his own account, trying to find the rift he came through. It has been moving. He has been following it. The enemies that crowd the wasteland are simply between him and it, and they have made the tactical error of assuming that distance is a form of safety.

---

## Base Stats

| Stat | Value | Notes |
|------|-------|-------|
| HP | 110 | Moderate — survivability comes from displacement, not bulk |
| Speed | 105 | Above average; built for aggressive repositioning |
| Damage | 28 | Strong melee baseline; void energy amplifies per branch |
| Range | 90 | Short arc — must close distance, rewarded for doing so |
| Attack Cooldown | 850ms | Fast cadence; feels aggressive |
| Attack Type | `voidslash` | Melee arc with trailing purple crescent VFX |

---

## Base Attack — Void Slash

Nightborne sweeps his void blade in a **wide melee arc** centered on the nearest enemy. The arc covers roughly 150° in front of him, hitting all enemies within range. A purple crescent energy trail lingers on the slash path for 0.15s before dissipating — not a projectile, just the afterimage of the cut.

- Hitbox: radial arc, 90px base range, 150° sweep angle
- Pierces all enemies within the arc simultaneously
- No knockback by default
- Visual: purple-violet crescent arc VFX that fades with a bloom effect (ADD blend mode)
- Distinct from Nazar: no poison, no stealth trigger, no bleed — this is raw void energy damage
- Distinct from Amun: not a full 360° ring, not slow, not earth-themed — a fast angular sweep

---

## Branch Overview

| Branch | Color | Theme |
|--------|-------|-------|
| **Void Blade** | `0x9933FF` | Raw purple energy — deepen the cut, widen the arc, chain slashes |
| **Phantom** | `0xCC66FF` | Spectral duplicates — mirror strikes, echo damage, shadow split |
| **Rift** | `0x4400BB` | Dimensional manipulation — teleport strikes, void zones, spatial anchors |

---

## Branch 1: Void Blade (`0x9933FF`)

**Theme:** Pure offensive escalation — more damage, wider arc, faster strikes, void energy overload. The Void Blade branch treats the base attack as a canvas to paint in increasing shades of violence.

---

**Skill 1 — Void Edge** (`nb1`): The blade drinks deeper from the void, sharpening beyond any physical limit. Each slash hits harder and the crescent arc extends further.
- L1: +20% damage; arc range 90→105px. Sets flag `hasVoidEdge`.
- L2: +35% damage total; arc range 90→115px. Crescent VFX brightness increased (tint shift toward white-purple).
- L3: +50% damage total; arc range 90→130px. Crescent trail lingers 0.3s instead of 0.15s.

---

**Skill 2 — Cleave** (`nb2`): The void arc widens into a full crescent sweep, cutting enemies at the periphery as easily as those at the center. The slash angle broadens with each mastery.
- L1: Arc angle 150°→190°. Sets flag `hasCleave`.
- L2: Arc angle 150°→220°. +10% damage to enemies hit at the outer edge of the arc.
- L3: Arc angle 150°→270° (behind-half coverage). Outer-edge damage bonus +20%.

---

**Skill 3 — Void Surge** (`nb3`): Every 4th consecutive slash triggers a void surge — the crescent explodes outward as an expanding ring pulse that deals bonus damage in a larger radius.
- L1: Every 4th attack fires an expanding void ring (140px, 60% damage). Sets flag `hasVoidSurge`, tracks `_surgeCounter`.
- L2: Surge ring grows to 180px; damage 60%→80%. Counter resets to every 3rd attack.
- L3: Surge ring grows to 220px; damage 80%→100%. Surge leaves a brief slow zone (50% move speed, 1s, 80px) at point of detonation.

---

**Skill 4 — Dark Resonance** (`nb4`): Void energy accumulates in struck enemies. Hitting the same enemy twice within 1.5s causes resonance — the stored void tears outward from them, damaging nearby foes.
- L1: Resonance detonation on 2nd hit within 1.5s: 40px AoE, 50% damage. Sets flag `hasDarkResonance`, tracks `_resonanceTimers` on enemies.
- L2: Resonance AoE 40→60px; damage 50%→70%.
- L3: Resonance AoE 60→80px; damage 70%→100%. Resonance detonation also applies a 0.4s stagger (enemy stops moving briefly).

---

**Skill 5 — Void Ascendant** (`nb5`) — ULTIMATE: Nightborne tears a shard of raw void through his own blade, entering an empowered state for 6 seconds. During Void Ascendant: attack cooldown halved, damage +80%, every slash fires a secondary void crescent projectile (travels 200px forward, 30% damage). 45s cooldown.
- L1: 6s duration, 45s CD. Halved attack CD, +80% damage, secondary crescent projectile on each slash.
- L2: Duration 6→8s, CD 45→38s. Secondary crescents pierce 2 enemies instead of stopping on first hit.
- L3: Duration 8→10s, CD 38→30s. On activation: instantly slash all enemies within 180px for 120% damage (burst opening hit).

---

## Branch 2: Phantom (`0xCC66FF`)

**Theme:** Spectral duplication — Nightborne splits his void-self into echoes that mirror his strikes. The Phantom branch is not about stealth (that is Nazar's domain) but about multiplication: one slash becomes two, one hero becomes several, damage output scales by replication rather than raw power.

---

**Skill 1 — Echo Strike** (`np1`): A spectral afterimage of Nightborne appears at his position 0.2s after each attack, delivering a ghostly echo slash at the same target area for reduced damage.
- L1: Echo slash fires 0.2s after each attack for 35% damage. Visual: semi-transparent purple duplicate at player position. Sets flag `hasEchoStrike`.
- L2: Echo damage 35%→50%. Echo inherits any Void Edge damage bonus if active.
- L3: Echo fires a second echo 0.15s after the first (chain: original → echo 1 → echo 2). Third hit at 25% damage.

---

**Skill 2 — Split Shade** (`np2`): On taking damage, Nightborne briefly splits into two phantom silhouettes, one of which is false. The false shadow draws enemy attention for 1.5s.
- L1: On hit received: spawn 1 decoy shade 80px in a random direction. Enemies within 100px retarget to shade for 1.5s. Sets flag `hasSplitShade`, 6s internal cooldown.
- L2: Shade duration 1.5→2.5s; cooldown 6→4s. Shade also delivers one 20% damage echo slash before expiring.
- L3: Shade duration 2.5→3s; cooldown 4→3s. Two shades spawn instead of one (different directions), both with echo slashes.

---

**Skill 3 — Phantom Veil** (`np3`): Between attacks, spectral film clings to Nightborne — the first enemy attack that would hit him during the cooldown window passes through harmlessly.
- L1: If enemy attack hits during attack cooldown window (not while player is attacking), 30% chance to negate damage entirely. Sets flag `hasPhantomVeil`.
- L2: Negation chance 30%→55%.
- L3: Negation chance 55%→80%. When a hit is negated, Nightborne's next attack fires immediately (resets attack cooldown to 0).

---

**Skill 4 — Mirror Swarm** (`np4`): On kill, the slain enemy's void echo briefly persists as a phantom ally that attacks once before dissolving. Phantom allies deal damage equal to Nightborne's base damage.
- L1: On kill: spawn a phantom ally at the kill location that performs one slash attack (100% base damage, 80px range) against nearest enemy within 120px, then dissolves. Sets flag `hasMirrorSwarm`.
- L2: Phantom ally performs 2 slash attacks before dissolving.
- L3: Phantom ally performs 3 slash attacks. Additionally, if a phantom ally kills an enemy, a second smaller phantom (50% damage, 1 slash) spawns from that kill too (chain at most 1 level deep).

---

**Skill 5 — Shade Legion** (`np5`) — ULTIMATE: Nightborne fractures into four phantom duplicates simultaneously for 5 seconds. All four fight independently, each performing full-damage slash attacks against the nearest enemy. Nightborne himself becomes invulnerable during the fracture. 50s cooldown.
- L1: 5s fracture, 50s CD. 4 duplicates, each at 70% damage, auto-attacking nearest enemy every 600ms.
- L2: 5→7s duration, 50→42s CD. Duplicates scale to 85% damage.
- L3: 7→8s duration, 42→35s CD. On fracture expiry: duplicates collapse back into Nightborne in a void implosion — 160px AoE, 150% damage burst.

---

## Branch 3: Rift (`0x4400BB`)

**Theme:** Dimensional manipulation — Nightborne tears holes in space, teleports to enemies, drops void zones that warp the battlefield. This is the most tactically complex branch, rewarding players who use positioning as a weapon.

---

**Skill 1 — Void Step** (`nr1`): Nightborne's slash is preceded by a short-range blink directly toward the target. He tears through the intervening space rather than crossing it.
- L1: Before each attack: blink 50px toward the nearest enemy (if farther than 30px). Ghost afterimage at origin (semi-transparent purple circle, fades in 250ms). Sets flag `hasVoidStep`.
- L2: Blink distance 50→75px. If blink closes to within 25px of the enemy, deal +15% bonus damage on that attack.
- L3: Blink distance 75→100px. Blink leaves a micro-rift at origin point (20px, 0.5s) — enemies walking over it take 20% damage.

---

**Skill 2 — Rift Anchor** (`nr2`): Nightborne drops a dimensional anchor at his current position. Once placed, he can tear back to it at will (auto-triggers when HP drops below 25%).
- L1: Every 12s, a rift anchor is dropped at current position (purple pulsing circle, visible to player, 60px). When HP falls below 25%, auto-teleport back to anchor. Anchor lasts 8s before decaying. Sets flag `hasRiftAnchor`.
- L2: Anchor cooldown 12→9s, lasts 10s. HP threshold 25%→35% (triggers sooner). Enemies within 40px of the anchor at time of return take 80% damage.
- L3: Anchor cooldown 9→6s. Return damage 80%→130% in 50px. Anchor placement also briefly immobilizes enemies within 40px for 0.6s (rift distortion).

---

**Skill 3 — Void Zone** (`nr3`): After each kill, a void zone tears open at the kill location — a patch of dimensional distortion that slows enemies, distorts their pathing, and deals light DoT.
- L1: On kill: spawn void zone (40px radius, 3s duration) at kill position. Enemies inside: 35% move speed reduction, 8% damage per second. Sets flag `hasVoidZone`.
- L2: Zone radius 40→60px, duration 3→4s. DoT 8%→14% per second.
- L3: Zone radius 60→80px, duration 4→6s. DoT 14%→20% per second. Void zones slow enemy attack rate by 25% as well (dimensional drag).

---

**Skill 4 — Spatial Tear** (`nr4`): Every 8 seconds, Nightborne tears a spatial rift at the nearest enemy's position rather than moving to them — a burst of void energy erupts at range, damaging all enemies in the area without Nightborne needing to close distance.
- L1: Every 8s: void burst at nearest enemy location, 80px AoE, 120% damage. Sets flag `hasSpatialTear`.
- L2: Cooldown 8→6s. AoE 80→110px.
- L3: Cooldown 6→5s. AoE 110→140px. Spatial Tear applies a void zone (same as Void Zone skill if active, or a basic slow zone if not) at the burst location.

---

**Skill 5 — Rift Collapse** (`nr5`) — ULTIMATE: Nightborne opens a catastrophic rift directly beneath the largest cluster of enemies on screen. After a 0.8s wind-up (visible pulsing circle), the rift implodes — pulling all enemies within 200px toward the center and dealing massive damage. 40s cooldown.
- L1: 0.8s wind-up, 200px pull radius, 180% damage to all pulled enemies. Enemies survive the pull (not instakill). Sets flag `hasRiftCollapse`. 40s CD.
- L2: Pull radius 200→240px, damage 180%→220%. CD 40→34s.
- L3: Pull radius 240→280px, damage 220%→280%. CD 34→28s. After implosion: void zone (100px, 5s, same stats as Void Zone L3) persists at collapse point.

---

## Playstyle Description (Encyclopedia)

Nightborne does not fight at a distance. He collapses distance. Playing him is an exercise in aggression at a specific scale — close enough to hit, fast enough to not still be there when the counter-swing arrives. The Void Blade branch is the most straightforward path: stack damage, widen the arc, and let Void Surge's detonating rings chew through clusters while Dark Resonance punishes anyone who lets two consecutive slashes land on them. It rewards staying in the middle of dense groups and is the highest ceiling for raw damage output.

The Phantom branch is less about killing faster and more about surviving — and then killing faster. Echo Strike multiplies every attack you land into one-and-a-half attacks; Mirror Swarm turns your kill streak into an army of afterimages that continue working while you reposition; Shade Legion turns the next eight seconds of a hard fight into a coordinated ambush from five simultaneous Nightbornes. It has a learning curve because the duplicates and echoes require some mental accounting, but players who internalize it find they are essentially impossible to overwhelm.

The Rift branch rewards map awareness. Void Step front-loads every attack with a blink that makes range irrelevant; Rift Anchor gives a panic-button escape that also punishes whatever is standing at the landing point; Void Zone turns kill clusters into hazard fields that compound the damage they took to create. Rift Collapse is the most spectacular ability in Nightborne's kit — a gravitational void implosion that drags the entire local horde to a single point before detonating — but it takes a 35-point commitment to unlock at full power, and that commitment shapes everything about how the run plays.

The through-line across all three branches is pressure. Nightborne is not a hero who finds a safe corner and pokes from it. He is a hero who decides where the center of the fight is and then goes there, trusting the void to make the geometry work.

---

## Design Notes — What Makes Nightborne Unique

1. **Void crescent VFX** — distinct visual identity from every existing hero; the 150° arc sweep with lingering purple trail is unmistakable
2. **Dark Resonance** — first "stacking void echo" mechanic in the game; reward for hitting the same target twice fast
3. **Phantom duplication** — distinct from Nazar's stealth; Nightborne's phantoms are visible, aggressive, and additive (more attacks) not subtractive (avoiding damage through hiding)
4. **Rift Anchor** — first auto-repositioning tool in the game (Khashin's Phantom Step is reactive-random; Rift Anchor is player-placed and deterministic)
5. **Void Zone** — first kill-triggered persistent slow/DoT field; differs from Khashin's tornados (those are from attacks, not kills) and Crystal Muller's mines (those are damage only, not slow fields)
6. **Rift Collapse** — first pull-type AoE in the game; gravity/implosion fantasy is not represented by any existing hero
7. **No stealth, no poison, no bleed** — deliberately separated from Nazar's kit despite both being dark-themed
