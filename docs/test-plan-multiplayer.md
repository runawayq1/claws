# CLAWS — Multiplayer QA Test Plan

> Version: v0.4.3 | Mode: Online Co-op (2-4 players) | Server: Colyseus on Render
> Prod: https://claws-chi.vercel.app | Server: wss://claws-server.onrender.com

---

## How to run

**Local test (2 tabs):**
```bash
npm run dev   # client on localhost:5173
cd /path/to/claws-server && npm start   # Colyseus on localhost:2567
```
Open 2 browser tabs → MULTIPLAYER → wait for both to join → START.

**Prod test:** 2 separate browsers/devices → claws-chi.vercel.app → MULTIPLAYER.

**Agent instructions:** For each test, open browser console (F12) and watch for errors. Note any `TypeError`, `Cannot read properties`, or Colyseus disconnect messages. Report exact error text if test fails.

---

## 1. Lobby & Connection

| # | Test | Expected | P |
|---|------|----------|---|
| 1.1 | Open game → click MULTIPLAYER | "Connecting..." spinner → LobbyScene loads, slot 1 shows local player name + hero | P0 |
| 1.2 | Second player joins same lobby | Slot 2 fills in with their name, hero circle appears | P0 |
| 1.3 | Host clicks START with 2 players | Both clients → LoadingScene → GameScene, both heroes visible | P0 |
| 1.4 | One player disconnects mid-lobby | Their slot shows "Reconnecting..." then clears after 30s | P1 |
| 1.5 | Non-host tries to click START | Button not visible / disabled for non-host | P1 |
| 1.6 | Server cold start (Render free tier) | "Connecting..." up to 60s, then connects | P2 |
| 1.7 | Join with same hero as existing player | "Hero taken" toast, hero circle grayed out | P2 |

---

## 2. Basic Movement & Sync

| # | Test | Expected | P |
|---|------|----------|---|
| 2.1 | Move local player (WASD/arrows/joystick) | Sprite moves smoothly, camera follows | P0 |
| 2.2 | Move on mobile (touch joystick) | Movement works, no freeze | P0 |
| 2.3 | Player 2 sees Player 1 moving | Remote sprite moves with smooth interpolation (~80ms lag) | P0 |
| 2.4 | Player movement is server-authoritative | No snap-back, no duplicate movement | P0 |
| 2.5 | Walk animation plays while moving | Run anim when moving, idle when still (local + remote) | P1 |
| 2.6 | Sprite flips direction on left/right movement | Both local and remote sprites flip correctly | P1 |

---

## 3. Leash Zone

| # | Test | Expected | P |
|---|------|----------|---|
| 3.1 | Player tries to walk far from other player | Movement stops at 450px from group center | P1 |
| 3.2 | Walk animation plays while leash-blocked | Walk anim continues even though sprite isn't moving | P1 |
| 3.3 | Both players walk together toward same direction | Both can move freely, no leash trigger | P1 |
| 3.4 | Leash adjusts when group center moves | After partners move closer, leash zone re-centers | P2 |

---

## 4. Enemy Spawning & Behavior

| # | Test | Expected | P |
|---|------|----------|---|
| 4.1 | Enemies appear at ~3 seconds | First wave of orcs spawns around players | P0 |
| 4.2 | Correct enemy scales (orc1 smaller than orc2, sandgolem huge) | Scales match solo mode: orc1=1.58x, orc2=2.0x, sandgolem=3.2x | P0 |
| 4.3 | Enemies walk toward nearest player | Mob movement targets closest alive player | P1 |
| 4.4 | Enemy attack animation at close range | Attack anim plays when enemy within ~45px of any player | P1 |
| 4.5 | Enemy HP bars visible when damaged | Red/yellow/green bar appears above enemy | P1 |
| 4.6 | Mini-boss spawns every 30s | Larger sandgolem or flying eye boss appears | P2 |
| 4.7 | Enemy count scales with wave (Wave 1 < Wave 5) | More enemies visible as game time increases | P2 |

---

## 5. Hero Attacks & Combat

| # | Test | Expected | P |
|---|------|----------|---|
| 5.1 | Auto-attack triggers on nearest enemy | Hero plays attack animation when enemy in range | P0 |
| 5.2 | Ignara fireball hits multiple enemies (AoE) | Explosion damages all enemies in ~80px radius | P0 |
| 5.3 | Amun shockwave hits multiple enemies (AoE ring) | Ring damages all enemies in ~100px radius | P0 |
| 5.4 | Khashin sand hits enemies in cone | ~110° cone in facing direction | P1 |
| 5.5 | Huntress spear pierces through line of enemies | Line-shaped attack hits multiple in sequence | P1 |
| 5.6 | Nazar poison dart hits single target | Single enemy targeted, no AoE | P1 |
| 5.7 | Enemies die when HP reaches 0 | Death animation plays, then sprite disappears | P0 |
| 5.8 | No crash on enemy death | Console: no TypeError, no "Cannot read properties" | P0 |
| 5.9 | XP orbs spawn at enemy death position | Glowing orbs appear, float toward player | P1 |
| 5.10 | Gold drops occasionally on enemy death | Gold coin spawns ~35% of kills | P2 |

---

## 6. Remote Player Attack Visibility

| # | Test | Expected | P |
|---|------|----------|---|
| 6.1 | Player 1 attacks → Player 2 sees attack anim | Remote hero plays attack animation on Player 2's screen | P1 |
| 6.2 | Flash VFX at hit position | Small white flash appears at enemy hit location | P1 |
| 6.3 | Remote sprite flips toward target | Remote hero faces enemy direction before attacking | P1 |
| 6.4 | Remote returns to idle after attack | Attack anim completes → idle_anim resumes | P2 |

---

## 7. XP & Leveling

| # | Test | Expected | P |
|---|------|----------|---|
| 7.1 | Both players gain XP from same kill | XP bar fills for both players when any enemy dies | P0 |
| 7.2 | XP scaled correctly for 2 players | Each player gets ~90% of solo XP per kill | P1 |
| 7.3 | Level-up screen appears without pausing game | Upgrade cards appear as overlay, enemies keep moving | P0 |
| 7.4 | 3 upgrade cards shown with icons | Cards show icon, name, description, level dots | P0 |
| 7.5 | Picking upgrade applies stat change | After pick: damage/HP/speed reflects upgrade (check pause menu) | P0 |
| 7.6 | 10s auto-pick timer if no choice made | Cards disappear after 10s, random upgrade applied | P1 |
| 7.7 | Both players can level up simultaneously | Each player sees their own cards, no conflict | P1 |
| 7.8 | Hero ability unlocked after picking branch upgrade | E.g. Sifra ice shard upgrade → ice shard fires | P1 |
| 7.9 | Level shown in pause menu / UIScene | Level counter increments correctly | P2 |

---

## 8. Player HP & Damage

| # | Test | Expected | P |
|---|------|----------|---|
| 8.1 | HP bar decreases when enemy hits | Top HP bar drains as enemies attack | P0 |
| 8.2 | HP synced from server | Both players see each other's HP bar state | P1 |
| 8.3 | Stone Skin upgrade reduces incoming damage | With cr1 upgrade: damage visibly reduced vs without | P2 |
| 8.4 | HP regen upgrade heals over time | mu_regen: HP slowly fills between enemy hits | P2 |
| 8.5 | Player downed when HP = 0 | Sprite becomes transparent, "DOWNED" shown | P1 |
| 8.6 | Revive works when partner approaches downed player | Stand near downed → 2s → revived at 50% HP | P1 |
| 8.7 | Game over when all players downed | End screen appears | P0 |

---

## 9. Stance System

| # | Test | Expected | P |
|---|------|----------|---|
| 9.1 | Stance toggle input sent to server | Press stance key → server receives, stance changes in state | P1 |
| 9.2 | Alt stance increases damage | E.g. Sifra lightning stance deals more damage vs ice | P2 |
| 9.3 | Alt stance changes attack range | E.g. Amun quake stance has longer range | P2 |
| 9.4 | Stance visible on remote player | Remote player sprite reflects stance change (future) | P3 |

---

## 10. Wave Progression & HUD

| # | Test | Expected | P |
|---|------|----------|---|
| 10.1 | TIER counter in HUD shows correct wave | "TIER 1" at start, "TIER 2" after 30s, etc. | P1 |
| 10.2 | Wave HUD synced from server (not local) | Both players show same TIER number | P1 |
| 10.3 | Enemy types change with wave | Wave 5+: flyingeye boss appears | P2 |
| 10.4 | Game runs for 10 minutes without crash | No freeze, no disconnect, frame rate stable | P0 |

---

## 11. Reconnect

| # | Test | Expected | P |
|---|------|----------|---|
| 11.1 | Refresh browser mid-game | Within 30s: reconnects, player resumes at last server position | P1 |
| 11.2 | Close tab and reopen within 30s | Same as 11.1 | P1 |
| 11.3 | Disconnect > 30s | Slot freed, other players continue without issue | P2 |

---

## 12. Solo Regression (must not break)

| # | Test | Expected | P |
|---|------|----------|---|
| 12.1 | Solo game starts normally | StartScene → hero select → GameScene, no errors | P0 |
| 12.2 | Solo level-up pauses game | Slow-motion + card picker, game paused | P0 |
| 12.3 | Solo upgrades apply correctly | Damage/HP/abilities work as before | P0 |
| 12.4 | Solo enemy death no crash | Enemies die, no TypeError in console | P0 |
| 12.5 | All 7 heroes work in solo | Each hero spawns, attacks, levels up | P1 |

---

## Known Issues (as of v0.4.3)

- Remote player VFX (projectiles, ice shards, firebolts) not synced — cosmetic only on shooter's screen
- Floating damage numbers not shown on remote enemies
- Hit-stop effect disabled in online mode
- DoT effects (poison, burn, bleed) cosmetic-only, not tracked server-side
- Schema optimization (bandwidth) deferred to Sprint 4
