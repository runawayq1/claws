> **STATUS: NOT IMPLEMENTED** — Design only, no code exists yet. Last reviewed 2026-04-09.

# Tutorial Scenario — Design Document

> Version: v0.2 | Date: 2026-04-08
> Status: Design draft — not yet implemented
> Owner: Hero Mechanics + UI Designer agents for implementation

---

## 1. Overview

The tutorial is the player's first and only experience with Amun before the full roster unlocks. All other heroes are locked. The tutorial takes place on the standard map under normal game rules — no separate "tutorial level." Instead, a lightweight quest tracker overlaid on the HUD guides the player through three objectives that organically teach the three pillars of CLAWS: branch selection, energy/stance management, and exploration.

**Quest 3 rework (v0.2):** The original design had Quest 3 be "defeat the Sandstone Sentinel mini-boss." This version replaces that with a **find-Sifra encounter** — the player physically locates Sifra somewhere on the map, triggering a brief dialogue cutscene that unlocks her as a playable hero. The Sandstone Sentinel remains in the design as an optional mid-run event (see Section 5) but is no longer the Quest 3 objective. The tutorial's final lesson becomes: the world is alive, there are allies to find, and other heroes exist.

**Design principle:** Do not pause the game for tutorial text. Do not interrupt flow. Every lesson is learned by doing. The quest tracker is a side panel — not a popup blocker. The Sifra encounter is the one intentional exception: it pauses the game for a scripted dialogue moment that earns its interruption by delivering meaningful narrative weight.

**Duration target:** A first-time player should complete all three quests within a single 6–8 minute run.

---

## 2. Starting Conditions

When the player selects Amun for the first time (i.e., `MetaData.heroRuns['amun'] === 0` and `tutorialComplete` flag is false):

- Amun starts with **only the Wrath branch available** at the level-1 branch selection screen
- Bastion and Quake branches are **locked** — they appear on the branch selection card as greyed-out silhouettes with a padlock icon and a short unlock hint label
- The quest tracker panel becomes visible in the top-right corner of the HUD (rendered by UIScene, not GameScene)
- All three quests are visible from the start, listed sequentially

Wrath is chosen automatically if the player dismisses LevelUpScene without picking (fallback guard — do not force-close the screen).

---

## 3. Quest Overview

### Quest overview table

| # | Quest | Objective | Reward | Teaches |
|---|-------|-----------|--------|---------|
| 1 | **Forged in Battle** | Kill 100 enemies | Unlock Bastion branch | Branches exist; offensive vs. defensive roles |
| 2 | **The Long Watch** | Survive 5 minutes | Unlock Quake branch | Stance-switching and energy management |
| 3 | **The Frost Accord** | Find Sifra on the map | Unlock Sifra on hero select | The world has allies; other heroes exist |

Quests are **sequential** in terms of rewards but **tracked in parallel** — all three are visible from run start. This gives the player a clear picture of the full tutorial arc without forcing a drip-feed of information.

Quest 3 is gated: the waypoint marker for Sifra does not appear on the minimap until Quest 2 is complete. Sifra herself is present on the map from run start, but without a marker she is effectively hidden — a player who stumbles into her range early triggers the encounter immediately (see edge cases, Section 8).

---

## 4. Quest Details

### Quest 1 — "Forged in Battle"

**Objective:** Kill 100 enemies in the current run.

**Tracking:** Kill counter uses the same `killCount` already tracked in GameScene. No new counter needed. The quest checks `killCount >= 100`.

**Reward on completion:**
- Bastion branch becomes available at the **next level-up** that would normally show a branch selection (i.e., the first time after quest 1 completes that `tracker.isBranchSelection` would be true — this only happens once, at level 1, so the unlock is held and presented differently).

> **Branch unlock timing problem:** Branch selection happens at level 1, before the player can reach 100 kills. Bastion and Quake must therefore surface not as a re-selection of the starting branch but as **one-time "Branch Discovered" cards** that appear mid-run when quests complete. These function like an extra level-up card event triggered by quest completion, not by XP.

**When Quest 1 completes:**

1. **Quest tracker row:** The "Forged in Battle" row flashes gold (`#FFD700`) for 1.5 seconds, then transitions to a completed-checkmark state (white checkmark icon, row text fades to 60% opacity to indicate done-and-out-of-the-way).
2. **Toast notification:** UIScene shows a non-blocking toast at center-bottom: `"Quest Complete: Forged in Battle"` in Bastion blue (`#4488FF`). 3s duration, slides up from bottom and fades out. Font size 18, semi-bold.
3. **Fanfare stinger:** A distinct short audio cue plays — suggest a pitched-up version of the level-up chime to avoid new audio assets.
4. **"Branch Discovered" card event:** If the player is not currently in LevelUpScene, queue a **Branch Discovered** card that launches on the next safe moment (no enemies within 80px, or delayed up to 5s max). The card shows:
   - Full-width single card layout — same visual language as LevelUpScene cards
   - Branch name: **Bastion** in `#4488FF`
   - Branch tagline: *"The golem was built to endure. You'll see why."*
   - First skill preview: Fortify — *"+15% armor. Activates defense aura."*
   - Dismiss instruction: *"[Any key / Tap to continue]"* — no skill selection here, just acknowledgment
   - Background tint: dark blue-grey, matching the Bastion color family
5. From this point, Bastion skills can appear as options in normal level-up draws.

**Quest 1 tracker flavor text:**
> *"The Ruin is vast. Amun has guarded it for a thousand years. So can you — for the next few minutes."*

---

### Quest 2 — "The Long Watch"

**Objective:** Survive 5 minutes in the current run.

**Tracking:** Uses existing `runTime` in GameScene. Checked every second. Completes at `runTime >= 300_000 ms`.

**Reward on completion:**

1. Same quest tracker flash-and-checkmark as Quest 1, but in Quake yellow (`#FFCC44`).
2. Toast: `"Quest Complete: The Long Watch"` in `#FFCC44`.
3. **"Branch Discovered" card** for Quake branch:
   - Branch name: **Quake** in `#FFCC44`
   - Branch tagline: *"The Amunat wastes remember every earthquake. Make more."*
   - First skill preview: Titan's Pulse — *"Unlocks stance toggle (Q): switch between melee and quake mode."*
   - Inline hint (only tutorial text about stances, ever): *"Quake introduces a second stance. Press Q (or [controller icon] on gamepad) to swap."*
   - This hint **only appears here** — it is not surfaced in any other UI element.
4. **Minimap: Sifra waypoint activates.** After Quest 2 completes, a pulsing cyan diamond marker appears on the minimap at Sifra's world position. If Sifra is off-screen, a directional arrow also appears at the minimap edge pointing toward her. See Section 6 for full minimap spec.

**Quest 2 tracker flavor text:**
> *"Five minutes. The Ruin has seen civilizations fall in five minutes. Show it something different."*

---

### Quest 3 — "The Frost Accord"

**Objective:** Find Sifra on the map and trigger the encounter dialogue.

**Tracking:** Quest 3 shows in the tracker as locked until Quest 2 completes. While locked, it displays:
> *"[Complete 'The Long Watch' to reveal the waypoint]"*

After Quest 2 completes:
> *"A presence lingers in the Ruin. Follow the waypoint."*

Quest completes the moment the encounter dialogue sequence finishes (not when the player walks into range — completion is confirmed at dialogue end to prevent partial-trigger edge cases).

**Trigger:** Player moves within **100px world distance** of Sifra's position. The encounter fires immediately regardless of combat state — see encounter design in Section 5.

**Reward on completion:**
- Sifra is unlocked in MetaProgress: `meta.unlockedHeroes.push('sifra')`
- Tutorial is marked complete: `meta.tutorialComplete = true`
- A **"New Hero Unlocked"** overlay appears (blocking, 4s minimum, dismissable after 2s): Sifra's portrait (her idle sprite scaled up), name in `#55AAFF` (Frost blue), and flavor line:
  > *"The Bramauthroba gave her lightning. The cold was already hers."*
- After overlay dismisses: run continues normally. The player is not ejected. They can keep playing until death or timer end.

**Quest 3 tracker flavor text (pre-complete):**
> *"Something crystalline moves between the ruins. It is not hostile. Not yet decided."*

---

## 5. Sifra NPC — Map Encounter Design

### 5.1 Spawn Position

Sifra spawns at a **fixed world position** chosen at `GameScene.create()` time, not procedurally. Suggested coordinate: **(1100, -800)** from world origin — placing her in Zone 2 (moderate enemy density), roughly 1380px from center. This is:
- Far enough that the player must actively travel to find her (not stumbled upon in the first 60 seconds)
- Close enough that a direct path takes ~90 seconds of movement
- In a direction (northeast quadrant) that is not the player's default "run in a circle" drift direction, making the waypoint meaningful guidance

The position should be validated against zone boundaries during implementation. If Zone 2 does not cover that coordinate for a given map seed, snap to the nearest Zone 2 centroid.

**Rationale for a fixed position (not random):** Tutorial consistency. The waypoint arrow must point somewhere deterministic. Random placement would require the minimap system to receive a dynamic target each run, adding implementation complexity for no player-facing benefit in a one-time tutorial.

### 5.2 Sifra on the Map

**Sprite:** Use the existing `sifra_idle` spritesheet, same animation that plays in the hero selection screen. Scale: 1.0× (standard character size — she is not larger than the player). She is a static NPC, not a combat entity.

**Glow / beacon effect:**
- A soft ice-blue pulsing circle behind her sprite: radius 28px, color `0x55AAFF`, alpha oscillating between 0.15 and 0.45 on a 1.5s sine cycle. Implemented as a Graphics object drawn under the sprite each frame in GameScene's update loop, or as a Tween on a circle shape.
- A vertical "beacon" light shaft: a tall thin rectangle (4px wide, 120px tall) centered above Sifra, `0x88DDFF`, alpha 0.25, same oscillation as the glow. This makes her visible from a moderate distance even when the camera is zoomed out.
- Both effects render at world depth slightly above terrain but below enemies (depth 5, if using a layered depth system).

**Idle behavior:** Sifra stands in place. No movement, no pathfinding. She does not react to enemies approaching — she is in a different "layer" of the world narratively. Her idle animation loops continuously.

**Safe zone:** A 150px radius around Sifra is a **soft repulsion zone** for standard enemies — they pathfind around her rather than through her, using the existing avoidance steering if available, or a simple push-away force each frame if not. This keeps the encounter area relatively clear without requiring a "kill zone" or invulnerability field that would need new systems. Enemies are not hard-blocked; a large wave can still encroach if the player arrives in the middle of a dense spawn. This is intentional — the player must survive to have the conversation.

Sifra herself is **not damageable** and has no collision with enemies or projectiles. She is a DisplayObject only, not a physics body.

### 5.3 Minimap Indicator

**Marker shape:** A diamond (rotated square), 6×6px, color `0x88DDFF` (Sifra's Shatter branch color — lighter ice blue, distinct from the player's `0x00ff66` green dot and enemy `0xcccccc` grey dots).

**Pulse animation:** The diamond pulses between 0.6 and 1.0 alpha on a 1.2s cycle, rendered each frame in `drawMinimap()`. Use a `Math.sin(time / 600)` expression mapped to the 0.6–1.0 range. The pulse makes it visually distinct from static markers.

**When Sifra is within the minimap view radius** (`CONFIG.MINIMAP_WORLD_RADIUS`): draw the diamond at her projected minimap coordinate using the existing `toMmX` / `toMmY` helper pattern already in UIScene.

**When Sifra is outside the minimap view radius:** Draw a directional arrow at the minimap edge, pointing from center toward Sifra's world direction. Arrow: a 5px equilateral triangle, same `0x88DDFF` color, same pulse. This compass-arrow approach is consistent with how zone rings already suggest "there is more world out there."

**Label (optional, toggle via design decision):** A tiny `"SIFRA"` label in 8px font, `0x88DDFF`, rendered 8px above the diamond. Only draw when Sifra is within the minimap view. Skip on mobile (too small at 375px viewport). This is optional — the marker alone may be sufficient once the player knows to look for it.

**Activation gate:** The Sifra marker is drawn in `drawMinimap()` only when `tutorialState.quest2Complete === true`. Before that, `drawMinimap()` returns early for this marker and the player has no indication.

**Implementation location:** Add a `sifraMarker` draw call inside `drawMinimap()` in `UIScene.ts`, after the enemy dots block and before the player center dot (so the player dot always renders on top). UIScene will need a reference to Sifra's world position, passed from GameScene (same pattern as the existing `gameScene.player` reference).

### 5.4 Off-Screen Directional Arrow (World Space)

In addition to the minimap edge arrow, display a **world-space directional indicator** when Sifra is off the visible camera viewport. This is a small chevron or arrowhead rendered in UIScene's fixed camera space (not world space), positioned at the screen edge, pointing toward Sifra's direction from the player.

- Size: 12px equilateral triangle
- Color: `0x88DDFF`, alpha 0.8
- Position: 20px inside the screen edge, on the edge closest to Sifra's direction
- Animate: same 1.2s pulse as minimap diamond
- Only visible when: Quest 2 complete AND Sifra not in camera viewport AND tutorial not complete
- Render in UIScene (fixed camera), not GameScene (world camera)

This gives the player two simultaneous signals: minimap (strategic view) and screen-edge arrow (immediate direction). Between the two, no directional text or "go north" labels are needed.

---

## 6. The Encounter — Scripted Dialogue Sequence

### 6.1 Trigger

When the player's world position is within **100px** of Sifra's world position:

1. `GameScene` pauses physics and enemy updates (equivalent to how LevelUpScene freezes the game — set `this.physics.world.pause()` and stop the wave manager timer).
2. The encounter sequence begins in UIScene (a new method: `UIScene.startSifraEncounter()`).
3. Camera tweens to frame both Amun and Sifra in the same shot: a smooth 0.5s zoom to ~0.85× (slight zoom-out from default) centered midway between the two characters' world positions. Camera tween uses Phaser's `camera.pan()` and `camera.zoomTo()`.

### 6.2 Dialogue UI

The dialogue display is built in UIScene using Graphics + Text, not a separate Scene. It renders at the bottom of the screen in a letterbox-style panel:

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  [Portrait: Amun]   "Dialogue text here, one line at a time."   │
│                     — AMUN                                       │
└──────────────────────────────────────────────────────────────────┘
```

- Panel: full screen width, 110px tall, anchored to bottom. Background: `0x000011` at 85% alpha (darker than HUD bars, signals "this is a different mode").
- Portrait: 72×72px sprite, left-aligned with 12px margin. Uses the hero's idle spritesheet frame 0 (static — no animation during dialogue to reduce visual noise).
- Text area: right of portrait, 16px left margin from portrait edge, 16px right screen margin.
- Speaker name: 10px, `#AABBCC`, above the dialogue line.
- Dialogue text: 15px, `#FFFFFF`, wraps within text area width.
- Advance prompt: bottom-right of panel, 10px, `#666688`: `"[Space / Tap to continue]"` — blinks at 1Hz after a 0.8s delay (gives the typewriter effect time to finish before showing the prompt).

**Typewriter effect:** Each character appears at 40ms intervals. Player can tap/press to skip to the full line immediately. Pressing again advances to the next line.

### 6.3 Dialogue Script

Four lines total, alternating speakers. Amun speaks first (he is the player character — his "voice" is the player's perspective).

---

**Line 1 — AMUN:**
> *"You are not of the Ruin. I know every stone in this place."*

*(Amun's portrait left-aligned. His idle animation — the golem stance. Text typewriters in.)*

---

**Line 2 — SIFRA:**
> *"Good. That means you noticed me. Most golems don't look up."*

*(Portrait swaps to Sifra's idle sprite. Frost-blue panel tint: add a subtle `0x001133` tint to the panel background — a 0.15 alpha blue overlay on top of the dark base. This visually signals the speaker change without a hard flash.)*

---

**Line 3 — AMUN:**
> *"The Bramwomb's tide grows faster. The Ruin cannot hold it alone."*

*(Amun's portrait returns. Panel tint reverts to default dark.)*

---

**Line 4 — SIFRA:**
> *"Then it's lucky you found me. I was starting to freeze."*

*(Sifra's portrait again, frost tint. A light particle burst — 8 small ice-crystal sprites radiating outward from Sifra's world position — fires on the last word of this line. This is her personality: dry humor, casual acknowledgment of a dire situation. The frost particles use a simple particle emitter with `lifespan: 600`, `speed: 40–80`, `alpha: 0 → 1 → 0`, `tint: 0x88DDFF`.)*

---

After Line 4: 0.5s pause, then the sequence moves to the **unlock moment** (Section 6.4).

**Dialogue design notes:**
- Amun speaks formally, in complete sentences, no contractions. He is ancient and precise.
- Sifra is casual, dry, quicker. She does not explain herself. She was already there.
- Neither hero references game mechanics (no mention of skills, branches, levels). The exchange is entirely in-world.
- Four lines is the maximum. VS-style: say little, mean a lot.

### 6.4 Unlock Moment

After the dialogue panel closes:

1. **Particle burst:** A large ice-crystal explosion from Sifra's world position — 24 particles, radius 120px, color `0x88DDFF` and `0xFFFFFF` mixed, `lifespan: 900ms`. This is the "unlock VFX." It should feel like a brief magical event, not a death.
2. **Screen flash:** A 0.15s white flash on the UIScene camera (`cameras.main.flash(150, 200, 230, 255)` — slight blue-white, not pure white). Subtle.
3. **Sifra sprite:** Her world sprite fades out over 0.6s (`alpha: 1 → 0`). She is gone from the map — she has "joined" the player's world in a meta sense. No explanation given; the VFX implies it.
4. **Camera:** Unzooms back to default over 0.5s tween, re-centers on Amun.
5. **Physics:** `physics.world.resume()`, wave manager timers resume.
6. **"New Hero Unlocked" overlay:** Full-screen overlay (not blocking gameplay — game is already running again underneath):
   - Dark background: `0x000011`, 90% alpha
   - Sifra's idle sprite, centered, scaled 2.5×, with the frost glow effect (28px glow behind it)
   - Title text: `"NEW HERO UNLOCKED"` in 13px caps, `#AABBCC`, centered above sprite
   - Hero name: `"SIFRA"` in 28px, `#88DDFF`, bold, centered below sprite
   - Flavor line: *"The Bramauthroba gave her lightning. The cold was already hers."* in 13px, `#AABBCC`, italic, below name
   - Dismiss text: 10px `#666688`: `"[Space / Tap to continue]"` appears after 2s
   - Auto-dismisses after 5s if not dismissed manually
7. **MetaProgress write:** `meta.unlockedHeroes.push('sifra')` and `meta.tutorialComplete = true` are written and persisted immediately when the overlay appears — before the player dismisses it — to prevent data loss if the player quits during the overlay.

### 6.5 Post-Encounter

After the overlay dismisses:

- The quest tracker row for Quest 3 flashes gold and transitions to checkmark state
- Toast: `"Quest Complete: The Frost Accord"` in `#88DDFF`
- Tutorial complete state: the quest tracker panel remains visible for the rest of this run (it's already there, no need to hide it mid-run), but the panel header quietly changes from `"Tutorial"` to `"Complete"` label
- The run continues. The player can keep playing, exploring, leveling. There is no forced end.
- On the next session start, the tutorial tracker does not appear. Sifra is selectable in hero select. The run is normal.

---

## 7. The Sandstone Sentinel (Optional Mid-Run Event)

The Sandstone Sentinel from the v0.1 design is **retained as an optional mid-run event**, not a quest objective. It spawns at the 6-minute mark regardless of tutorial state, giving experienced players (or players who complete the tutorial quickly) a challenging fight with a meaningful reward. Its XP and gold drops remain unchanged.

**Thematic fit:** Amun is a golem-guardian of the Key of Balance, animated stone. The Sandstone Sentinel is a corrupted variant — a Guardian turned by the Bramwomb's chaos energy. Fighting it teaches: bosses exist, they follow patterns, Quake branch's knockback and CC are powerful tools here.

**Visual:** A hulking stone humanoid (reuse/extend the "Crystal Golem" concept from the roadmap). Covered in cracked orange sandstone with glowing amber fissures. Top-down perspective, consistent with all enemies.

**Stats (suggested baseline — balance separately):**

| Stat | Value |
|------|-------|
| HP | 2000 |
| Speed | 55 (slow lurch) |
| Damage per hit | 25 |
| Size | ~3× normal enemy radius |
| XP reward | 500 |
| Gold drop | 60 |

**Attack patterns — 2 phases:**

**Phase 1 (100%–50% HP):**
- Slow melee lunge: closes 120px in 0.4s, deals damage in a 40px arc
- Ground slam (every 5s): AoE 80px radius around self, 20 dmg, 0.5s warning indicator on ground before impact

**Phase 2 (below 50% HP):**
- Enrages: speed +30%, attack cooldown -25%
- Fissure burst (every 8s): cracks radiate outward in 4 directions, 60px range each, 15 dmg — dodgeable by moving perpendicular

**Death:** Shatters into stone fragments (particle burst), drops a visible lore fragment orb the player walks over. The orb plays a short ambient sound and disappears into the XP counter.

**Spawn rule:** Only one Sentinel per run. Arrival is announced by a screen-edge rumble (camera shake, 0.5s) 5 seconds before it enters the playfield.

---

## 8. UI/UX Flow

### Quest tracker panel

- **Position:** Top-right corner of the HUD, below the minimap. The minimap sits at `mapY = margin + 76` (per UIScene). The quest panel sits at `mapY + MINIMAP_SIZE + 8px` — directly beneath the minimap, flush-right.
- **Size:** Fixed 200px wide, auto-height (3 quest rows + header label).
- **Style:** Minimal. Semi-transparent dark background (`0x0a0a1a`, 75% alpha — matches minimap background). No decorative borders.
- **Header:** `"TUTORIAL"` in 9px caps, `#444466`, centered in panel. Changes to `"COMPLETE"` with a `#FFCC44` checkmark when `tutorialComplete`.
- **Quest rows:** Quest name in 12px white (`#FFFFFF`). Objective in 10px grey (`#888899`). State shown by:
  - Locked: 40% opacity, grey lock icon (5×7px pixel-art padlock rendered in Graphics)
  - Active: 100% opacity, no icon
  - Complete: 70% opacity, gold checkmark icon, quest name in `#FFD700`
- **On mobile (viewport width ≤ 430px):** Panel collapses to a compact badge — quest icon (a small scroll icon, 16×16px) plus `"2/3"` counter in 10px white. Expands on tap to full panel, auto-collapses after 4s of no interaction.

### Quest completion moment

1. Quest tracker row flashes gold for 1.5s (Tween alpha 1→0.3→1→0.3→1 over 1.5s on a gold color overlay).
2. Toast notification slides up from center-bottom: `"Quest Complete: [Name]"` in the branch color. 3s auto-dismiss.
3. If reward is branch unlock: "Branch Discovered" card fires.
4. If reward is hero unlock: Sifra encounter sequence fires (not an overlay — the full dialogue sequence).
5. Sound: distinct short fanfare stinger.

### Branch Discovered card

Same visual language as LevelUpScene branch-selection cards. Displayed as a centered modal with darkened background. Single card (not 3-card layout). Player acknowledges with any key/tap. Game is paused during the card display — simpler than the "safe moment" delay approach, consistent with how LevelUpScene already works.

> **Decision (v0.2):** Branch Discovered cards always pause the game immediately on trigger (overriding the v0.1 "safe moment delay" approach). Simpler to implement, consistent with the LevelUpScene precedent. The brief pause is acceptable — players already expect the game to pause for upgrade cards.

### Branch locking in LevelUpScene

At branch selection (level 1), the three branch cards are shown. Locked branches:
- Render with 40% opacity
- Overlay a padlock icon (center of card)
- Replace branch theme text with the unlock condition in italics: *"Unlock: Kill 100 enemies"* / *"Unlock: Survive 5 minutes"*
- Are **not clickable** (pointer event disabled, cursor shows not-allowed)
- Do NOT disappear — showing them locked is the lesson. The player learns branches exist and that they can be unlocked.

Only Wrath is selectable at level 1. This is enforced by filtering `getBranchChoices()` to exclude locked branches from the clickable pool while still rendering them.

---

## 9. MetaProgress Integration

Two new fields are required on `MetaData`:

```typescript
// MetaProgress.ts — add to MetaData interface
tutorialComplete: boolean           // false until Quest 3 completes
unlockedHeroes: string[]            // heroes explicitly unlocked via gameplay
// Initially: ['amun'] — the starting hero. Others added by tutorial/achievements.
```

**Tutorial state during a run** is tracked transiently (not persisted between restarts mid-run). The `GameScene` or a new `TutorialSystem` holds:

```typescript
interface TutorialState {
  quest1Complete: boolean          // kill 100 enemies
  quest2Complete: boolean          // survive 5 minutes
  quest3Complete: boolean          // find and talk to Sifra
  sentinelSpawned: boolean         // prevent double-spawn of the optional Sentinel
  sifraEncounterTriggered: boolean // prevent double-trigger if player re-enters range
  unlockedBranches: ('bastion' | 'quake')[]
}
```

**Persistence rules:**
- If the player completes Quest 1 and dies before Quest 3: Quest 1's branch unlock (Bastion) is persisted to MetaData.
- On subsequent tutorial runs (tutorial not yet complete), already-unlocked branches are available from run start — the player does not re-do completed quests.
- Sifra's world position is stored in `TutorialState` for the current run (deterministic, not persisted — always the same coordinate).
- Once `tutorialComplete = true`, the tutorial quest tracker does not appear on future Amun runs. All three branches are always available.

**Persistence format recommendation (Architect to confirm):**
```typescript
unlockedBranches: Record<HeroType, string[]>
// e.g. { amun: ['bastion', 'quake'] }
```
This scales to future heroes that may also have branch-gating mechanics.

**Hero select gating:**
- StartScene reads `meta.unlockedHeroes` to decide which hero slots are selectable.
- Heroes not in `unlockedHeroes` show a padlock overlay and unlock hint.
- Amun is always in `unlockedHeroes` (present in `defaultData()`).
- For new saves, `unlockedHeroes` defaults to `['amun']`.
- Sifra's hero select slot hint (while locked): *"Find her in the Ruin."*

---

## 10. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Player dies before Quest 1 completes | Run ends normally. No branches unlocked. Quest starts fresh on next run. |
| Player dies after Quest 1 but before Quest 3 | Bastion unlock is persisted. Next tutorial run starts with Wrath + Bastion available. Quest 1 shows as already complete in tracker. |
| Player dies after Quest 2 but before Quest 3 | Bastion + Quake persisted. Sifra marker appears on minimap immediately at next run start (Quest 2 already done). Only Quest 3 remains. |
| Player dies after reaching Sifra but dialogue did not complete | Sifra encounter is transient. It re-triggers next run when the player reaches her again. MetaProgress is only written at dialogue end — no partial state. |
| Player wanders into Sifra's 100px radius before Quest 2 is complete | Encounter fires immediately — this is a valid skip. The Sifra encounter is not hard-gated by Quest 2; Quest 2 only controls when the minimap marker appears. If the player is skilled or lucky enough to find Sifra before surviving 5 minutes, they are rewarded. Quest 2 remains in the tracker but can no longer complete (Sifra is gone). It is silently marked skipped in TutorialState. No broken state — tutorialComplete still becomes true. |
| Player is in heavy combat when reaching Sifra | Encounter fires regardless. The game pause is immediate. This is intentional — finding an ally in the middle of chaos is dramatically appropriate. The camera pull and dialogue give the player a breather moment. |
| Player passes near Sifra (enters 100px range) but immediately dies in the same frame | Physics pause from the encounter fires first in the update order. The encounter plays. If the player's HP was 0 before the encounter, the death is deferred until the encounter sequence ends. This avoids a race condition where the encounter and end-screen fight for control. Implement by checking `player.hp > 0` at encounter trigger — if already 0, skip encounter (the player is already dead and the end screen should show). |
| `tutorialComplete` is true but `unlockedHeroes` missing Sifra (corrupted save) | On load, if `tutorialComplete` is true, add both 'sifra' and 'ignara' to `unlockedHeroes` as a migration guard. (Ignara was the v0.1 reward — preserve backward compat.) |
| Player returns to StartScene mid-tutorial (navigates away) | Quest state is lost (transient). Next run re-evaluates from persisted branch unlocks. Sifra is still at the same world coordinate. |
| Mobile player doesn't see the quest tracker | Quest tracker collapses to badge (see Section 8). Must be visible at all times — test on 375px viewport. |
| Sandstone Sentinel spawns while player is in Sifra encounter dialogue | Sentinel spawn is deferred until physics resume. `sentinelSpawned` is set to true immediately to prevent double-queuing, but the actual `scene.add` of the enemy entity is called in the first update tick after `physics.world.resume()`. |
| Sifra unlocked by future achievement before tutorial completion | If `unlockedHeroes` already contains 'sifra' when Quest 3 fires, skip the MetaProgress mutation but still play the full encounter sequence and overlay. The quest must still be completable and `tutorialComplete` must still be set. |
| Does the tutorial run count toward MetaProgress.heroRuns['amun']? | Yes — the player is genuinely playing Amun. No special-casing needed. |

---

## 11. Implementation Notes

### Files requiring changes

| File | Change |
|------|--------|
| `src/scenes/UIScene.ts` | Add `drawSifraMarker()` in `drawMinimap()`. Add `startSifraEncounter()` dialogue sequence method. Add quest tracker panel render. Add screen-edge directional arrow. |
| `src/scenes/GameScene.ts` | Spawn Sifra NPC sprite + glow at fixed coordinate. Add proximity check for Sifra encounter trigger in `update()`. Expose `sifraPosition` for UIScene reference. Add `TutorialSystem` integration. |
| `src/scenes/LevelUpScene.ts` | Filter locked branches from clickable pool. Render locked branch cards with padlock overlay and unlock condition text. |
| `src/systems/` | Create `TutorialSystem.ts` — tracks quest state, handles branch unlock persistence, queues "Branch Discovered" card events. |
| `src/systems/MetaProgress.ts` | Add `tutorialComplete: boolean` and `unlockedHeroes: string[]` to `MetaData`. Add `unlockedBranches: Record<string, string[]>`. Add migration guard in `loadMeta()`. |
| `src/scenes/StartScene.ts` | Read `meta.unlockedHeroes` for hero slot gating. Show padlock overlay on locked heroes. |

### Rough implementation sequence (for Hero Mechanics / Architect agents)

1. `MetaProgress` schema additions + migration guard (no UI, low risk, do first)
2. `TutorialSystem` — quest state tracking only (no UI yet), quest 1 + 2 completion detection
3. Branch locking in `LevelUpScene` — high visibility, unblocks playtesting
4. Quest tracker panel in `UIScene` — static render, no animations yet
5. "Branch Discovered" card event — reuse LevelUpScene card component
6. Sifra NPC spawn in `GameScene` + glow effect
7. Minimap Sifra marker in `UIScene.drawMinimap()`
8. Screen-edge directional arrow
9. Encounter trigger + dialogue sequence (`UIScene.startSifraEncounter()`)
10. Unlock VFX + "New Hero Unlocked" overlay
11. StartScene hero select gating
12. Full QA pass on tutorial flow (Tester agent)

---

## 12. Open Questions

1. **Branch Discovered card: pause or safe-moment delay?** v0.2 defaults to always-pause (overrides v0.1's safe-moment approach). Revisit if playtesters find the mid-combat pauses jarring.

2. **Do we want a pre-run tutorial popup?** A single "here's what you're doing" modal before the first Amun run. Intentionally kept out of this design (VS never does this). Recommend skipping.

3. **Sandstone Sentinel art:** Requires a new enemy sprite or recolor of an existing enemy. If no suitable base exists, use a large glowing circle with stone-texture particle burst as a temporary stand-in.

4. **Branch persistence format:** Recommending `unlockedBranches: Record<HeroType, string[]>` in MetaData. Confirm shape with Architect agent before implementation.

5. **Sifra's hero select slot text while locked:** Currently `"Find her in the Ruin."` — this only makes sense after the player has seen the quest tracker. For a completely fresh player on first boot, they will see this before any tutorial context. Consider: show nothing (just padlock, no hint text) until after the first Amun run where the tutorial has explained what the quests are. Or: always show `"Unlocked via tutorial."` as a more neutral hint.

6. **Encounter trigger at 100px — is that too small on mobile?** At 1080p with standard zoom, 100px world units is about 80 screen pixels. On mobile (375px viewport) with camera zoom, this could feel too tight. Consider 140px for mobile, detected via `this.scale.width < 500`. Needs playtesting on device.

7. **Localization of all quest text and dialogue:** All strings in this doc should go into a constants file or object rather than inline — makes future translation straightforward.

8. **What if the Sifra encounter is interrupted by the game's 10-minute timer ending?** Timer end currently calls `showEndScreen()` in UIScene. If the encounter is in progress when the timer fires, suppress the end-screen trigger until `sifraEncounterTriggered = false` (encounter complete). Timer expiry is a lower priority event than an active scripted sequence. The run effectively gets a few extra seconds to finish the cutscene.

9. **Sifra's safe zone implementation:** If the existing pathfinding/steering system does not support soft-repulsion zones, a simpler fallback is acceptable — just check each enemy's distance to Sifra each frame and apply a nudge force if within 150px. This is an O(n) check on the enemy group, acceptable for the enemy counts typical of the tutorial's first 6 minutes.
