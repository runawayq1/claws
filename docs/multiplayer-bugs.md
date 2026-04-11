# Multiplayer Bug Fixes — Agent Brief

> Repo: /Users/squad/Documents/claws
> Stack: Phaser 3 + Vite + TypeScript (client) · Colyseus 0.16.22 (server in `server/`)
> After all changes run `npm run build` (client) and `npx tsc -p server/tsconfig.json --noEmit` (server) — both must pass with 0 errors.

---

## BUG 1 — HP Regen never fires (BROKEN)

**Files:** `server/src/rooms/GameRoom.ts`, `server/src/rooms/GameRoom.ts::applyUpgrade`

**Problem:** Server regen tick reads `p.upgrades['mu_regen']` but no such upgrade ID exists in the game.
The actual regen upgrade ID is `'g6'` (generic pool, "Regeneration"). `p.upgrades['mu_regen']` is always 0.

**Fix in `GameRoom.ts`:**

1. In `gameTick()`, change the regen key:
```typescript
// BEFORE:
const stacks = p.upgrades['mu_regen'] ?? p.upgrades.get?.('mu_regen') ?? 0
// AFTER:
const stacks = p.upgrades['g6'] ?? 0
```

2. In `applyUpgrade()`, add a handler for `g6`:
```typescript
else if (upgradeId === 'g6') { /* regen handled per tick via upgrades['g6'] stacks */ }
```
And remove/keep the `mu_regen` branch as a no-op if it exists.

---

## BUG 2 — Armor reduction always 0% (BROKEN)

**Files:** `server/src/rooms/GameRoom.ts::checkPlayerEnemyCollisions`

**Problem:** Armor lookup uses `p.upgrades['mu_armor'] ?? p.upgrades['cr1']` — neither ID exists.
- The generic armor upgrade ID is `'g10'` ("Iron Skin") — adds numeric stacks.
- `'cr1'` is Muller's Stone Skin hero skill — sets a boolean flag, not a number.

**Fix:**
```typescript
// BEFORE:
const armorStacks = p.upgrades['mu_armor'] ?? p.upgrades['cr1'] ?? 0
// AFTER:
const armorStacks = p.upgrades['g10'] ?? 0
```

---

## BUG 3 — `upgrades` field not in Colyseus schema (MISSING sync)

**File:** `server/src/schema/GameState.ts`

**Problem:** `PlayerState.upgrades` is a plain `Record<string, number> = {}` with no `@type` decorator.
It is not serialized → not synced to clients → lost on reconnect.
The server uses it internally (regen, armor) which works within a session, but it should be a proper schema field.

**Fix in `GameState.ts`:**
```typescript
// Add import at top if not present:
import { Schema, type, MapSchema } from '@colyseus/schema'

// In PlayerState class, replace:
upgrades: Record<string, number> = {}

// With:
@type({ map: 'number' }) upgrades = new MapSchema<number>()
```

Then in `GameRoom.ts`, everywhere `p.upgrades['key']` is read or written, switch to `MapSchema` API:
- Read: `p.upgrades.get('g6') ?? 0`  (or `(p.upgrades as any)['g6'] ?? 0` if the map supports index access)
- Write (in `applyUpgrade`): `p.upgrades.set('g6', (p.upgrades.get('g6') ?? 0) + 1)`

Check all existing `p.upgrades[...]` references in `GameRoom.ts` and update them to `.get()`/`.set()`.

---

## BUG 4 — Local player uses linear lerp, remote uses exponential (inconsistent)

**File:** `src/systems/NetworkGameAdapter.ts::update()`

**Problem:** Local player interpolation uses `Math.min(1, delta / 80)` (linear, frame-rate dependent).
Remote players and enemies use `1 - Math.exp(-delta / 80)` (exponential, frame-rate independent).
Local movement feels jittery at low FPS.

**Fix — find the local player interpolation block and change:**
```typescript
// BEFORE (local player toward server pos):
const t = Math.min(1, delta / 80)
this.localPlayer.x += dx * t
this.localPlayer.y += dy * t

// AFTER:
const t = 1 - Math.exp(-delta / 80)
this.localPlayer.x += dx * t
this.localPlayer.y += dy * t
```

---

## BUG 5 — Online level-up missing `activeStance` arg (BUG)

**File:** `src/scenes/GameScene.ts` — `player-levelup` handler, online branch

**Problem:** `this.upgradeTracker.getChoices(this.selectedHero as any)` is called without the second
argument (active stance). Solo mode passes the stance. Without it, the upgrade pool may show incorrect
options for stance-based heroes (Sifra ice/lightning, Amun melee/quake, Huntress ranged/melee).

**Fix:**
```typescript
// BEFORE:
const choices = this.upgradeTracker.getChoices(this.selectedHero as any)

// AFTER:
const choices = this.upgradeTracker.getChoices(
  this.selectedHero as any,
  this.localPlayer.stance ?? undefined
)
```

Check what property holds the player's current stance — likely `this.localPlayer.stance` or
`this.localPlayer.khashinStance` etc. Use the same value that the solo level-up handler uses.
Search `getChoices` call in the existing solo path to match the exact argument.

---

## BUG 6 — Simultaneous level-ups drop second UI (MISSING)

**File:** `src/scenes/GameScene.ts`

**Problem:** If two `player-levelup` events fire in quick succession (both players level up from the same
kill), the second `scene.launch('LevelUpScene', ...)` is ignored by Phaser because the scene is already
active. The second level-up is silently lost.

**Fix — queue pending level-ups:**
```typescript
// Add to GameScene class:
private _pendingLevelUps: Array<{ player: Player; choices: any[] }> = []
private _levelUpActive = false

// In the player-levelup handler, online branch:
this._pendingLevelUps.push({ player: lvlPlayer, choices })
this._tryShowNextLevelUp()

// New method:
private _tryShowNextLevelUp() {
  if (this._levelUpActive || this._pendingLevelUps.length === 0) return
  const next = this._pendingLevelUps.shift()!
  this._levelUpActive = true
  this.scene.launch('LevelUpScene', {
    player: next.player,
    tracker: this.upgradeTracker,
    callerSceneKey: this.scene.key,
    onlineMode: true,
  })
}
```

Then in the `LevelUpScene` shutdown callback (when online mode closes), emit an event back:
```typescript
// In LevelUpScene, after stopping scene in online mode:
callerScene.events.emit('levelup-closed')
```

```typescript
// In GameScene online setup block:
this.events.on('levelup-closed', () => {
  this._levelUpActive = false
  this._tryShowNextLevelUp()
})
```

---

## BUG 7 — AoE/cone/line attack patterns bypass spatial grid (perf)

**File:** `server/src/rooms/GameRoom.ts::checkPlayerAttacks`

**Problem:** The `aoe`, `cone`, and `line` branches iterate `this.state.enemies.forEach(...)` — full O(n)
scan. Only the initial "find nearest" step uses the spatial grid. At 200+ enemies this wastes CPU.

**Fix:** Pre-query the grid for the relevant area before iterating. For `aoe`:
```typescript
// BEFORE:
this.state.enemies.forEach((e, key) => { ... })

// AFTER (aoe example):
const radius = heroDef.splashRadius ?? 80
const candidateKeys = this.spatialGrid.query(primaryTarget.x, primaryTarget.y, radius)
for (const key of candidateKeys) {
  const e = this.state.enemies.get(key)
  if (!e) continue
  // ... existing distance check
}
```

Apply the same pattern for `cone` (query with `effectiveRange * 1.2`) and `line` (query along the line direction). The grid query returns a superset, the existing distance/angle/perp checks still filter correctly.

---

## Verification checklist

After all fixes:
```bash
# Client build
npm run build 2>&1 | tail -5   # must end with "✓ built in Xs"

# Server type check
npx tsc -p /Users/squad/Documents/claws/server/tsconfig.json --noEmit
# must output nothing (0 errors)
```

Manual test (2 browser tabs, local server):
1. Both players gain XP from kills → both level up → upgrade cards appear without pausing
2. Second level-up queues correctly if two happen at once
3. HP regen upgrade (`g6` "Regeneration") visibly heals player over time
4. Solo mode unaffected — level-up still pauses game, upgrades still apply
