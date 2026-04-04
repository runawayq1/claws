# Enemy Registry

## Zergling

| Property | Value |
|---|---|
| Class | `Zergling extends Phaser.Physics.Arcade.Sprite` |
| Sprite key | `goblin_attack` (goblin/Attack3.png) |
| Frame size | 150×150 px |
| Scale | 1.6 |
| Body size | 32×40, offset (59, 65) |
| Base HP | `ZERGLING_BASE_HP` (40) |
| Base speed | `ZERGLING_BASE_SPEED` (90) + wave×5 |
| Base DPS | `ZERGLING_DAMAGE` (8) + floor(wave/4) |
| XP value | `ZERGLING_XP` (10) + floor(wave/3) |
| HP scaling | ×(1 + floor(wave/5)×0.3) + (wave-1)×5 flat |

**Special abilities:** None — pure melee chaser. Switches to `goblin_run` anim on attack entry.

**Death behavior:** Plays `goblin_death` anim (frames 8–11), applies color tint by damage type (dark/blue/green), camera shake 60ms/0.003. Emits `zergling-died` event on completion then destroys self.

---

## Scorpion

| Property | Value |
|---|---|
| Class | `Scorpion extends Phaser.Physics.Arcade.Sprite` |
| Sprite key | `flyingeye_attack` (flying_eye/Attack3.png) |
| Frame size | 150×150 px |
| Scale | 1.4 |
| Body size | 32×32, offset (59, 59) |
| Base HP | 25 |
| Base speed | 130 + wave×7 |
| Base DPS | 5 + floor(wave/5) |
| XP value | 8 + floor(wave/3) |
| HP scaling | ×(1 + floor(wave/5)×0.2) + (wave-1)×3 flat |

**Special abilities:** On each melee hit applies `player.applyPoison(2 dps, 3000ms)`. Damage numbers render green. Higher knockback (160) than Zergling.

**Death behavior:** No death anim — tween shrink+fade (scale 1.4→0.3, alpha→0, 300ms). Camera shake 40ms/0.002. Emits `zergling-died` event on tween complete.

---

## SandGolem

| Property | Value |
|---|---|
| Class | `SandGolem extends Phaser.Physics.Arcade.Sprite` |
| Sprite key | `mushroom_attack` (mushroom/Attack3.png) |
| Frame size | 150×150 px |
| Scale | 2.0 |
| Body size | 32×40, offset (59, 65) |
| Base HP | 180 |
| Base speed | 45 + wave×2 |
| Base DPS | 12 + floor(wave/4) |
| XP value | 25 + floor(wave/2)×3 |
| HP scaling | ×(1 + floor(wave/5)×0.4) + (wave-1)×12 flat |

**Special abilities:** Ground Slam — every 5s when player is within 80px radius: expanding ring VFX, deals DPS×2 to player, pushes player back at 250 velocity, camera shake 80ms/0.004. Nearly immune to knockback (30 velocity only).

**Death behavior:** Plays `mushroom_death` anim (frames 7–10), spawns 5 debris circle particles (color #8b7355) that fall and fade over 600ms. Camera shake 100ms/0.006. Emits `zergling-died` event on anim complete.
