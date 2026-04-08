import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

/**
 * Ignara — Fireball projectile with AOE explosion.
 * Fires a fireball toward the target that explodes on arrival, dealing area damage.
 * Supports upgrades: Meltdown (+50% dmg below 40% HP), Scorched Earth (burn DOT),
 * Wildfire (kill triggers mini-explosion), Firestorm (2 extra mini-fireballs),
 * Backdraft (strong knockback).
 */
export function attackFireball(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const tx = target.x, ty = target.y
  const dist = Phaser.Math.Distance.Between(p.x, p.y, tx, ty)
  const dmgRatio = Math.min(p.damage / 30, 4)
  const ballSize = 6 + dmgRatio * 2
  const explodeRadius = 40 + p.splashRadius * 0.8
  const ballTint = dmgRatio > 2.5 ? 0xffffaa : dmgRatio > 1.5 ? 0xff8800 : 0xff4400

  // Meltdown: +50% damage when below 40% HP
  let effectiveDmg = p.damage * p.getMasteryDamageMult('fireball')
  if (p.hasMeltdown && p.hp < p.maxHp * 0.4) effectiveDmg = Math.ceil(effectiveDmg * 1.5)

  // Create fireball
  const ball = p.scene.add.circle(p.x, p.y, ballSize, ballTint).setDepth(9)
  // Glow trail
  const glow = p.scene.add.circle(p.x, p.y, ballSize * 1.5, ballTint, 0.3).setDepth(8)
    .setBlendMode(Phaser.BlendModes.ADD)

  // Trail particles while flying
  const trailTimer = p.scene.time.addEvent({
    delay: 30, loop: true,
    callback: () => {
      const tp = p.scene.add.circle(
        ball.x + Phaser.Math.Between(-4, 4),
        ball.y + Phaser.Math.Between(-4, 4),
        Phaser.Math.Between(2, 4), 0xff6600, 0.6
      ).setDepth(8)
      p.scene.tweens.add({
        targets: tp, alpha: 0, scale: 0, duration: 200,
        onComplete: () => tp.destroy(),
      })
    },
  })

  // Fly to target
  p.scene.tweens.add({
    targets: [ball, glow],
    x: tx, y: ty,
    duration: Math.max(150, (dist / 350) * 1000),
    onComplete: () => {
      trailTimer.destroy()
      ball.destroy()
      glow.destroy()

      // EXPLOSION
      // Visual: expanding ring + flash
      const explosion = p.scene.add.circle(tx, ty, 10, 0xff4400, 0.6).setDepth(10)
      p.scene.tweens.add({
        targets: explosion,
        scale: explodeRadius / 10, alpha: 0, duration: 350,
        onComplete: () => explosion.destroy(),
      })
      // Inner flash
      const flash = p.scene.add.circle(tx, ty, 8, 0xffff88, 0.8).setDepth(11)
      p.scene.tweens.add({
        targets: flash,
        scale: explodeRadius / 16, alpha: 0, duration: 200,
        onComplete: () => flash.destroy(),
      })
      // Ember particles
      for (let i = 0; i < 6 + Math.floor(dmgRatio * 2); i++) {
        const ea = Math.random() * Math.PI * 2
        const ed = Phaser.Math.Between(10, Math.floor(explodeRadius * 0.8))
        const ember = p.scene.add.circle(tx, ty, Phaser.Math.Between(2, 4), 0xff8800, 0.7).setDepth(10)
        p.scene.tweens.add({
          targets: ember,
          x: tx + Math.cos(ea) * ed, y: ty + Math.sin(ea) * ed,
          alpha: 0, scale: 0, duration: 300 + Math.random() * 200,
          onComplete: () => ember.destroy(),
        })
      }

      // Camera shake
      p.scene.cameras.main.shake(50, 0.003)

      // Damage all enemies in explosion radius
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= explodeRadius) {
          (e as BaseEnemy).takeDamage(effectiveDmg, 'fire')

          // Base fireball knockback (Backdraft upgrades to 300)
          const kb = Phaser.Math.Angle.Between(tx, ty, e.x, e.y)
          const body = e.body as Phaser.Physics.Arcade.Body
          const kbForce = p.hasBackdraft ? 300 : 120
          if (body) body.setVelocity(Math.cos(kb) * kbForce, Math.sin(kb) * kbForce)

          // Wildfire: kill triggers mini-explosion on nearby enemies
          if (p.hasWildfire) {
            if ((e as BaseEnemy).isDying) {
              for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e2.active || e2 === e) continue
                if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= 50) {
                  (e2 as BaseEnemy).takeDamage(p.damage * 0.4 * p.getMasteryDamageMult('fireball'), 'fire')
                }
              }
              const miniBlast = p.scene.add.circle(e.x, e.y, 8, 0xff6600, 0.5).setDepth(9)
              p.scene.tweens.add({ targets: miniBlast, scale: 5, alpha: 0, duration: 250, onComplete: () => miniBlast.destroy() })
            }
          }

          // Pyromaniac heal handled in GameScene 'enemy-died' hook (not here to avoid double-heal)

          // Scorched Earth burn DOT (reuse existing mechanic if hasScorchedEarth)
          if (p.hasScorchedEarth && !(e as any)._burnTimer) {
            const burnDmg = effectiveDmg * 0.3
            let burnElapsed = 0;
            (e as any)._burnTimer = p.scene.time.addEvent({
              delay: 500, repeat: 5,
              callback: () => {
                burnElapsed += 500
                if (e.active) (e as BaseEnemy).takeDamage(burnDmg * 0.5, 'fire')
                if (burnElapsed >= 3000) (e as any)._burnTimer = null
              },
            })
          }
        }
      }

      // Firestorm: spawn 2 extra smaller fireballs at random nearby enemies
      if (p.hasFirestorm) {
        let extras = 0
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || extras >= 2) continue
          if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) > explodeRadius && Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= p.range * 1.5) {
            extras++
            const miniball = p.scene.add.circle(tx, ty, 4, 0xff8800, 0.7).setDepth(9)
            const ex = e.x, ey = e.y
            p.scene.tweens.add({
              targets: miniball, x: ex, y: ey, duration: 200,
              onComplete: () => {
                miniball.destroy()
                const boom = p.scene.add.circle(ex, ey, 6, 0xff4400, 0.5).setDepth(9)
                p.scene.tweens.add({ targets: boom, scale: 4, alpha: 0, duration: 250, onComplete: () => boom.destroy() })
                for (const e3 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                  if (!e3.active) continue
                  if (Phaser.Math.Distance.Between(ex, ey, e3.x, e3.y) <= 35) (e3 as BaseEnemy).takeDamage(p.damage * 0.5 * p.getMasteryDamageMult('fireball'), 'fire')
                }
              },
            })
          }
        }
      }

      p.isAttacking = false
    },
  })
}

/**
 * Ignara per-frame update: Lava Trail — drop fire pools while moving.
 * Every 300ms of movement, places a lava pool at the player's position that
 * damages nearby enemies for 6 ticks over ~2 seconds before fading away.
 */
export function updateLavaTrail(p: Player, delta: number) {
  // Lava Trail — drop fire pools while moving
  if (p.hasLavaTrail) {
    p.lavaTrailTimer += delta
    if (p.lavaTrailTimer >= 300) {
      p.lavaTrailTimer = 0
      const lx = p.x, ly = p.y
      const lava = p.scene.add.circle(lx, ly, 8, 0xff4400, 0.5).setDepth(3)
      // Damage enemies that walk over it
      let lavaTicks = 0
      const lavaTimer = p.scene.time.addEvent({
        delay: 300, repeat: 6,
        callback: () => {
          lavaTicks++
          const scene = p.scene as any
          if (scene.enemies) {
            for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active) continue
              if (Phaser.Math.Distance.Between(lx, ly, e.x, e.y) <= 12) {
                (e as BaseEnemy).takeDamage(p.damage * 0.2 * p.getMasteryDamageMult('fireball'), 'fire')
              }
            }
          }
          if (lavaTicks >= 6) { lava.destroy(); lavaTimer.destroy() }
        },
      })
      p.scene.tweens.add({ targets: lava, alpha: 0, scale: 0.3, duration: 2100, delay: 0 })
    }
  }
}
