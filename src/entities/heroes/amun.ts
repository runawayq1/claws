import Phaser from 'phaser'
import type { Player } from '../Player'

// Titan's Pulse boulder explosion (local helper)
function boulderExplode(
  p: Player,
  bx: number, by: number,
  radius: number, dmg: number,
  enemies: Phaser.Physics.Arcade.Group,
  hitSet: Set<Phaser.Physics.Arcade.Sprite>
) {
  // AOE damage
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active || hitSet.has(e)) continue
    const d = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
    if (d < radius) {
      (e as any).takeDamage(dmg, 'shockwave')
      hitSet.add(e)
      const kb = Phaser.Math.Angle.Between(bx, by, e.x, e.y);
      (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(kb) * 250, Math.sin(kb) * 250)
    }
  }
  // VFX: explosion ring
  const ring = p.scene.add.circle(bx, by, 8, 0xffcc44, 0.7).setDepth(11)
  p.scene.tweens.add({
    targets: ring, scale: radius / 8, alpha: 0, duration: 350,
    onComplete: () => ring.destroy(),
  })
  // Debris particles
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const dist = 30 + Math.random() * 30
    const debris = p.scene.add.circle(bx, by, 3 + Math.random() * 3, 0x887744, 0.9).setDepth(12)
    p.scene.tweens.add({
      targets: debris,
      x: bx + Math.cos(a) * dist, y: by + Math.sin(a) * dist,
      alpha: 0, scale: 0.3, duration: 300 + Math.random() * 150,
      onComplete: () => debris.destroy(),
    })
  }
  // Screen shake
  p.scene.cameras.main.shake(80, 0.005)
}

// AMUN — Shockwave ring
export function attackShockwave(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const pp = p
  const cx = p.x, cy = p.y
  const useRing = p.scene.textures.exists('vfx_shockring')
  const useSpark = p.scene.textures.exists('vfx_hitspark')

  // Dynamic: ring size from range, particles from splash, multi-ring from strikeCount
  const rangeRatio = p.range / 80
  const maxScale = (useRing ? 4 : 8) * rangeRatio
  const dmgRatio = Math.min(p.damage / 10, 4)
  const dustCount = 6 + Math.floor(p.splashRadius / 10)
  const ringCount = p.strikeCount
  const ringTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0xffffaa : 0xfff200
  const kbForce = (p.hasColossus ? 500 : 200) + p.splashRadius * 2

  // Center flash — bigger with damage
  if (useSpark) {
    const flash = p.scene.add.image(cx, cy, 'vfx_hitspark')
      .setScale(2 + dmgRatio).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setTint(ringTint)
    p.scene.tweens.add({
      targets: flash, alpha: 0, scale: 4 + dmgRatio, duration: 300,
      onComplete: () => flash.destroy(),
    })
  }

  // Ground dust particles — count scales with splash
  for (let i = 0; i < dustCount; i++) {
    const a = (i / dustCount) * Math.PI * 2
    const dustDist = Phaser.Math.Between(30, 50) * rangeRatio
    const dust = p.scene.add.circle(cx, cy, Phaser.Math.Between(2, 4), 0xccaa55, 0.6).setDepth(8)
    p.scene.tweens.add({
      targets: dust,
      x: cx + Math.cos(a) * dustDist,
      y: cy + Math.sin(a) * dustDist,
      alpha: 0, scale: 0.3, duration: 400,
      onComplete: () => dust.destroy(),
    })
  }

  // Ground crack lines when range is boosted (Titan's Pulse visual)
  if (rangeRatio > 1.2) {
    const crackG = p.scene.add.graphics().setDepth(7)
    const crackCount = Math.floor(rangeRatio * 4)
    crackG.lineStyle(2, 0xccaa44, 0.5)
    for (let i = 0; i < crackCount; i++) {
      const a = (i / crackCount) * Math.PI * 2 + Math.random() * 0.3
      const len = (40 + Math.random() * 30) * rangeRatio
      crackG.beginPath()
      crackG.moveTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10)
      // Jagged line with mid-point offset
      const mx = cx + Math.cos(a) * len * 0.5 + (Math.random() - 0.5) * 8
      const my = cy + Math.sin(a) * len * 0.5 + (Math.random() - 0.5) * 8
      crackG.lineTo(mx, my)
      crackG.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len)
      crackG.strokePath()
    }
    p.scene.tweens.add({
      targets: crackG, alpha: 0, duration: 600,
      onComplete: () => crackG.destroy(),
    })
  }

  // Titan's Pulse: launch a boulder projectile toward nearest enemy
  if (p.hasTitansPulse) {
    let nearest: Phaser.Physics.Arcade.Sprite | null = null
    let nearDist = Infinity
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const d = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
      if (d < nearDist) { nearDist = d; nearest = e }
    }
    if (nearest) {
      const angle = Phaser.Math.Angle.Between(cx, cy, nearest.x, nearest.y)
      const boulderRadius = 18
      const boulderSpeed = 320
      const boulderRange = 300
      const boulderDmg = p.damage * 1.5
      const splashR = 60 + p.splashRadius * 0.5

      // Create boulder graphics
      const boulder = p.scene.add.graphics().setDepth(11)
      boulder.fillStyle(0x887744, 1)
      boulder.fillCircle(0, 0, boulderRadius)
      boulder.fillStyle(0xaa9966, 0.7)
      boulder.fillCircle(-4, -5, boulderRadius * 0.6)
      boulder.lineStyle(2, 0x665533, 0.8)
      boulder.strokeCircle(0, 0, boulderRadius)
      boulder.setPosition(cx, cy)

      const startX = cx, startY = cy
      const vx = Math.cos(angle) * boulderSpeed
      const vy = Math.sin(angle) * boulderSpeed
      const boulderHitSet = new Set<Phaser.Physics.Arcade.Sprite>()

      const boulderUpdate = p.scene.time.addEvent({
        delay: 16, loop: true,
        callback: () => {
          boulder.x += vx * 0.016
          boulder.y += vy * 0.016
          boulder.rotation += 0.15

          // Check if out of range
          const traveled = Phaser.Math.Distance.Between(startX, startY, boulder.x, boulder.y)
          if (traveled > boulderRange) {
            // Explode at end
            boulderExplode(p, boulder.x, boulder.y, splashR, boulderDmg, enemies, boulderHitSet)
            boulder.destroy()
            boulderUpdate.destroy()
            return
          }

          // Check hit with enemies
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || boulderHitSet.has(e)) continue
            const d = Phaser.Math.Distance.Between(boulder.x, boulder.y, e.x, e.y)
            if (d < boulderRadius + 20) {
              // Explode on contact
              boulderExplode(p, boulder.x, boulder.y, splashR, boulderDmg, enemies, boulderHitSet)
              boulder.destroy()
              boulderUpdate.destroy()
              return
            }
          }
        },
      })
    }
  }

  // Multi-ring: spawn staggered rings
  const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()
  let ringsFinished = 0

  for (let r = 0; r < ringCount; r++) {
    p.scene.time.delayedCall(r * 120, () => {
      const ring = useRing
        ? p.scene.add.image(cx, cy, 'vfx_shockring')
            .setScale(0.5).setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setTint(ringTint)
        : p.scene.add.circle(cx, cy, 10, ringTint, 0.6).setDepth(9)

      p.scene.tweens.add({
        targets: ring,
        scale: maxScale,
        alpha: 0,
        duration: 400,
        onUpdate: () => {
          const radius = useRing ? ring.scale * 24 : ring.scale * 10
          const band = 25 + p.splashRadius * 0.3
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || hitSet.has(e)) continue
            const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
            if (dist <= radius && dist >= radius - band) {
              (e as any).takeDamage(p.damage, 'shockwave')
              hitSet.add(e)
              const kbAngle = Phaser.Math.Angle.Between(cx, cy, e.x, e.y);
              (e.body as Phaser.Physics.Arcade.Body).setVelocity(
                Math.cos(kbAngle) * kbForce, Math.sin(kbAngle) * kbForce
              )

              // Earthquake: stun enemies for 0.8s
              if (p.hasEarthquake && (e as any).speed !== undefined) {
                const origSpeed = (e as any).baseSpeed || (e as any).speed
                ;(e as any).speed = 0
                // VFX: stun indicator — spinning star above enemy
                const starGfx = p.scene.add.graphics().setDepth(12)
                const stunEvt = p.scene.time.addEvent({
                  delay: 16, loop: true,
                  callback: () => {
                    if (!e.active) { starGfx.destroy(); stunEvt.destroy(); return }
                    starGfx.clear()
                    const st = p.scene.time.now
                    const sr = 6
                    for (let s = 0; s < 3; s++) {
                      const sa = (st / 200) + s * Math.PI * 2 / 3
                      starGfx.fillStyle(0xffff66, 0.8)
                      starGfx.fillCircle(
                        e.x + Math.cos(sa) * sr,
                        e.y - 20 + Math.sin(sa) * sr * 0.5,
                        2
                      )
                    }
                  },
                })
                p.scene.time.delayedCall(800, () => {
                  if (e.active) (e as any).speed = origSpeed
                  starGfx.destroy()
                  stunEvt.destroy()
                })
              }

              if (useSpark) {
                const hs = p.scene.add.image(e.x, e.y, 'vfx_hitspark')
                  .setScale(1 + dmgRatio * 0.5).setDepth(10)
                  .setBlendMode(Phaser.BlendModes.ADD).setTint(ringTint)
                p.scene.tweens.add({
                  targets: hs, alpha: 0, scale: 2 + dmgRatio, duration: 200,
                  onComplete: () => hs.destroy(),
                })
              }
            }
          }
        },
        onComplete: () => {
          ring.destroy()
          ringsFinished++
          if (ringsFinished >= ringCount) pp.isAttacking = false
        },
      })
    })
  }

  // Cataclysm: second delayed shockwave burst
  if (p.hasCataclysm) {
    p.scene.time.delayedCall(350, () => {
      const hitSet2 = new Set<Phaser.Physics.Arcade.Sprite>()
      const ring2 = useRing
        ? p.scene.add.image(cx, cy, 'vfx_shockring')
            .setScale(0.5).setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff8800)
        : p.scene.add.circle(cx, cy, 10, 0xff8800, 0.6).setDepth(9)
      p.scene.tweens.add({
        targets: ring2, scale: maxScale * 1.2, alpha: 0, duration: 450,
        onUpdate: () => {
          const radius = useRing ? ring2.scale * 24 : ring2.scale * 10
          const band = 25 + p.splashRadius * 0.3
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || hitSet2.has(e)) continue
            const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
            if (dist <= radius && dist >= radius - band) {
              (e as any).takeDamage(p.damage * 0.6, 'shockwave')
              hitSet2.add(e)
              const kb = Phaser.Math.Angle.Between(cx, cy, e.x, e.y);
              (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(kb) * kbForce * 0.6, Math.sin(kb) * kbForce * 0.6)
            }
          }
        },
        onComplete: () => ring2.destroy(),
      })
    })
  }
}

export function updateAmunPassives(p: Player, delta: number) {
  const pp = p

  // Amun defense aura visual (Bastion)
  if (p.heroType === 'amun' && pp.defenseAuraActive) {
    if (!pp.defenseAuraGfx) {
      pp.defenseAuraGfx = p.scene.add.graphics().setDepth(4)
    }
    pp.defenseAuraGfx.clear()
    const auraRadius = 45 + pp.armor * 40  // grows with armor
    const pulse = 0.15 + Math.sin(p.scene.time.now / 600) * 0.05
    // Outer glow ring
    pp.defenseAuraGfx.lineStyle(3, 0x4488ff, pulse + 0.1)
    pp.defenseAuraGfx.strokeCircle(p.x, p.y, auraRadius)
    // Inner fill
    pp.defenseAuraGfx.fillStyle(0x2266cc, pulse * 0.5)
    pp.defenseAuraGfx.fillCircle(p.x, p.y, auraRadius)
    // Bright inner ring
    pp.defenseAuraGfx.lineStyle(1, 0x88bbff, pulse + 0.15)
    pp.defenseAuraGfx.strokeCircle(p.x, p.y, auraRadius * 0.6)
  }

  // Amun passive aura (3 dmg/s in 60px — requires Aura of Might skill)
  if (p.heroType === 'amun' && pp.hasPassiveAura) {
    const hpScale = pp.hasLivingFortress ? (0.5 + (p.hp / p.maxHp) * 1.5) : 1
    const auraDps = 3 * hpScale
    const auraR = 60
    const scene = p.scene as any
    if (scene.enemies) {
      for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= auraR) {
          (e as any).takeDamage(auraDps * (delta / 1000), 'shockwave')
        }
      }
    }

    // Persistent passive aura visual — golden ring centered on player
    if (!pp.passiveAuraGfx) {
      pp.passiveAuraGfx = p.scene.add.graphics().setDepth(3)
    }
    pp.passiveAuraGfx.clear()
    const t = p.scene.time.now
    const pulse = 0.10 + Math.sin(t / 500) * 0.04
    const breathe = auraR + Math.sin(t / 800) * 3
    // Outer ring
    pp.passiveAuraGfx.lineStyle(2, 0xfff200, pulse + 0.12)
    pp.passiveAuraGfx.strokeCircle(pp.cx, pp.cy, breathe)
    // Inner fill
    pp.passiveAuraGfx.fillStyle(0xffcc00, pulse * 0.3)
    pp.passiveAuraGfx.fillCircle(pp.cx, pp.cy, breathe)
    // Rotating accent segments (4 small arcs)
    const rot = (t / 1200) % (Math.PI * 2)
    pp.passiveAuraGfx.lineStyle(1.5, 0xffe066, pulse + 0.08)
    for (let i = 0; i < 4; i++) {
      const a = rot + i * Math.PI / 2
      pp.passiveAuraGfx.beginPath()
      pp.passiveAuraGfx.arc(pp.cx, pp.cy, breathe - 4, a, a + 0.4)
      pp.passiveAuraGfx.strokePath()
    }
  }

  // Amun Low HP Regen: ×3 regen when below 40% HP
  if (p.hasLowHpRegen && p.hp < p.maxHp * 0.4 && p.hp > 0) {
    p.hp = Math.min(p.maxHp, p.hp + p.hpRegen * 2 * (delta / 1000))
    // VFX: periodic green healing sparkle
    if (Math.random() < delta / 300) {
      const angle = Math.random() * Math.PI * 2
      const dist = Phaser.Math.Between(5, 15)
      const spark = p.scene.add.circle(
        p.x + Math.cos(angle) * dist,
        p.y + Math.sin(angle) * dist,
        2, 0x44ff66, 0.7
      ).setDepth(10)
      p.scene.tweens.add({
        targets: spark, y: spark.y - 18, alpha: 0, scale: 0.3,
        duration: 500, onComplete: () => spark.destroy(),
      })
    }
  }

  // Amun Gravity Well: pull enemies toward player every 2s
  if (pp.hasGravityWell) {
    pp.gravityWellTimer += delta
    if (pp.gravityWellTimer >= 2000) {
      pp.gravityWellTimer = 0
      const pullRadius = 120 + p.range
      const scene2 = p.scene as any
      if (scene2.enemies) {
        for (const e of scene2.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          const dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
          if (dist <= pullRadius && dist > 20) {
            const angle = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y);
            (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150)
          }
        }
      }
      // VFX: inward pulse
      const pullRing = p.scene.add.circle(p.x, p.y, pullRadius, 0x9966ff, 0.2).setDepth(4)
      p.scene.tweens.add({ targets: pullRing, scale: 0.1, alpha: 0, duration: 400, onComplete: () => pullRing.destroy() })
    }
  }

  // Amun Divine Judgment: execute enemies below 15% HP in range
  if (p.hasDivineJudgment) {
    const execRadius = 80 + p.range
    const scene3 = p.scene as any
    if (scene3.enemies) {
      for (const e of scene3.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if ((e as any).hp > 0 && (e as any).maxHp && (e as any).hp < (e as any).maxHp * 0.15) {
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= execRadius) {
            (e as any).takeDamage((e as any).hp + 1, 'shockwave')
            // VFX: golden beam
            const beam = p.scene.add.rectangle(
              (p.x + e.x) / 2, (p.y + e.y) / 2,
              Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y), 3,
              0xfff200, 0.7
            ).setDepth(10).setRotation(Phaser.Math.Angle.Between(p.x, p.y, e.x, e.y))
            p.scene.tweens.add({ targets: beam, alpha: 0, scaleY: 3, duration: 200, onComplete: () => beam.destroy() })
          }
        }
      }
    }
  }

  // Amun pulsing damage aura (Sovereign — Consecration)
  if (p.heroType === 'amun' && pp.dmgAuraActive) {
    const dmgR = 70 + p.splashRadius * 0.8
    // Persistent orange ring visual
    if (!pp.dmgAuraGfx) {
      pp.dmgAuraGfx = p.scene.add.graphics().setDepth(3)
    }
    pp.dmgAuraGfx.clear()
    const dt = p.scene.time.now
    const dPulse = 0.12 + Math.sin(dt / 400) * 0.06
    const dBreathe = dmgR + Math.sin(dt / 600) * 4
    pp.dmgAuraGfx.lineStyle(2, 0xff8800, dPulse + 0.1)
    pp.dmgAuraGfx.strokeCircle(pp.cx, pp.cy, dBreathe)
    pp.dmgAuraGfx.fillStyle(0xff6600, dPulse * 0.2)
    pp.dmgAuraGfx.fillCircle(pp.cx, pp.cy, dBreathe)
    // Flame-like segments rotating
    const dRot = (dt / 900) % (Math.PI * 2)
    pp.dmgAuraGfx.lineStyle(2, 0xffaa33, dPulse + 0.15)
    for (let i = 0; i < 6; i++) {
      const a = dRot + i * Math.PI / 3
      pp.dmgAuraGfx.beginPath()
      pp.dmgAuraGfx.arc(pp.cx, pp.cy, dBreathe - 5, a, a + 0.3)
      pp.dmgAuraGfx.strokePath()
    }

    pp.dmgAuraLastPulse += delta
    if (pp.dmgAuraLastPulse >= pp.dmgAuraCooldown) {
      pp.dmgAuraLastPulse = 0
      const pulseRadius = 70 + p.splashRadius * 0.8
      const pulseDmg = p.damage * 0.4

      // Visual: expanding ring
      const ring = p.scene.add.graphics().setDepth(4)
      let currentR = 10
      const expandSpeed = pulseRadius / 400  // pixels per ms
      const pulseEvent = p.scene.time.addEvent({
        delay: 16, loop: true,
        callback: () => {
          currentR += expandSpeed * 16
          ring.clear()
          const alpha = 1 - (currentR / pulseRadius)
          if (alpha <= 0 || currentR >= pulseRadius) {
            ring.destroy()
            pulseEvent.destroy()
            return
          }
          ring.lineStyle(3, 0xffaa33, alpha * 0.7)
          ring.strokeCircle(p.x, p.y, currentR)
          ring.fillStyle(0xff8800, alpha * 0.15)
          ring.fillCircle(p.x, p.y, currentR)
        },
      })

      // Damage enemies in range
      const scene = p.scene as any
      if (scene.enemies) {
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= pulseRadius) {
            (e as any).takeDamage(pulseDmg, 'shockwave')
          }
        }
      }
    }
  }
}
