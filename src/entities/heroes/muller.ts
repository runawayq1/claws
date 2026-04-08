import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

const CRYSTAL_KEYS = ['crystal_green_0', 'crystal_green_1', 'crystal_pink_0', 'crystal_pink_1', 'crystal_blue_0', 'crystal_blue_1']

/** Spawn a crystal spike sprite erupting from ground at (x,y). outwardAngle = direction tip points (default: up) */
export function spawnCrystalSpike(p: Player, x: number, y: number, scale = 0.5, tintColor?: number, outwardAngle?: number): Phaser.GameObjects.Sprite | null {
  const keys = CRYSTAL_KEYS
  const key = keys[Math.floor(Math.random() * keys.length)]
  if (!p.scene.textures.exists(key)) return null
  // Sprite natural tip direction is ~-45° (up-right). Rotate tip to desired direction.
  const spriteBaseAngle = -Math.PI / 4
  const targetAngle = outwardAngle ?? -Math.PI / 2 // default: upward
  const tilt = (Math.random() - 0.5) * 0.4
  const s = p.scene.add.sprite(x, y, key, 0).setDepth(10)
    .setScale(scale + Math.random() * 0.15)
    .setRotation(targetAngle - spriteBaseAngle + tilt)
    .setOrigin(0.5, 0.8)
  if (tintColor) s.setTint(tintColor)
  if (p.scene.anims.exists(key)) s.play(key)
  return s
}

/** Spawn a tiny crystal shard flying in a direction (for shrapnel/hit VFX) */
export function spawnCrystalShard(p: Player, x: number, y: number, angle: number, dist: number, duration = 250): void {
  const keys = CRYSTAL_KEYS
  const key = keys[Math.floor(Math.random() * keys.length)]
  if (!p.scene.textures.exists(key)) return
  const shard = p.scene.add.sprite(x, y, key, 0).setDepth(10)
    .setScale(0.2 + Math.random() * 0.1)
    .setRotation(angle)
    .setOrigin(0.5, 0.5)
  if (p.scene.anims.exists(key)) shard.play(key)
  p.scene.tweens.add({
    targets: shard,
    x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
    alpha: 0, scale: 0, duration,
    onComplete: () => shard.destroy(),
  })
}

// -----------------------------------------------------------------------
// Crystal Muller — Crystal Wave attack (directional cone)
// -----------------------------------------------------------------------
export function attackCrystalWave(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const cx = (p as any).cx, cy = (p as any).cy
  const angle = Phaser.Math.Angle.Between(cx, cy, target.x, target.y)
  const range = (p as any).range
  const coneHalf = ((p as any).crystalWaveConeAngle / 2) * (Math.PI / 180)
  const spikeCount = 8 + ((p as any).hasShardstorm ? 8 : 0)
  const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()
  let resonanceArmorTriggered = false
  let isSuper = false
  if ((p as any).hasTectonicFury) {
    (p as any).tectonicCounter = ((p as any).tectonicCounter || 0) + 1
    isSuper = (p as any).tectonicCounter % 5 === 0
  }
  const actualRange = isSuper ? range * 2 : range
  const actualCone = isSuper ? coneHalf * 2 : coneHalf

  // Crystal spikes erupt sequentially in a line from player toward target, pointing in attack direction
  for (let i = 0; i < spikeCount; i++) {
    const delay = i * 40 // sequential eruption
    const dist = (actualRange / spikeCount) * (i + 1)
    // Slight lateral offset for natural look, wider on super waves
    const lateralOffset = (Math.random() - 0.5) * (12 + actualCone * 5)
    const perpAngle = angle + Math.PI / 2
    const spreadAngle = angle // keep for shrapnel direction

    p.scene.time.delayedCall(delay, () => {
      const sx = cx + Math.cos(angle) * dist + Math.cos(perpAngle) * lateralOffset
      const sy = cy + Math.sin(angle) * dist + Math.sin(perpAngle) * lateralOffset

      // Crystal spike — erupts toward target direction, scale up
      const spikeScale = 0.5
      const spike = spawnCrystalSpike(p, sx, sy, spikeScale, undefined, angle)
        || (() => { const g = p.scene.add.graphics().setDepth(10); g.fillStyle(0x44aaff, 0.8); g.fillTriangle(sx - 4, sy, sx + 4, sy, sx, sy - 15); return g })()
      if ((spike as any).setScale) {
        ;(spike as any).setScale(0.01)
        p.scene.tweens.add({
          targets: spike, scaleX: spikeScale, scaleY: spikeScale,
          duration: 120, ease: 'Back.easeOut',
        })
      }

      // Damage enemies near spike
      const dmgMult = (p as any).hasDeepVein ? (1 + 0.3 * (dist / actualRange)) : 1
      const dmg = Math.ceil((p as any).damage * dmgMult * p.getMasteryDamageMult('crystal'))
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active || hitSet.has(e)) continue
        if (Phaser.Math.Distance.Between(sx, sy, e.x, e.y) < 30) {
          ;(e as BaseEnemy).takeDamage?.(dmg, 'melee')
          hitSet.add(e)
          // Hit VFX — crystal shard burst
          spawnCrystalShard(p, e.x, e.y, Math.random() * Math.PI * 2, 15, 200)
        }
      }

      // Crystal shrapnel on spike death — crystal shard sprites
      if ((p as any).hasCrystalShrapnel) {
        p.scene.time.delayedCall(300, () => {
          for (let j = 0; j < 3; j++) {
            const sa = spreadAngle + (j - 1) * 0.4
            spawnCrystalShard(p, sx, sy, sa, 40, 250)
            // Mini damage check
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active) continue
              const ex = sx + Math.cos(sa) * 30
              const ey = sy + Math.sin(sa) * 30
              if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) < 20) {
                ;(e as BaseEnemy).takeDamage?.(Math.ceil((p as any).damage * 0.3 * p.getMasteryDamageMult('crystal')), 'melee')
              }
            }
          }
        })
      }

      // Spike fades
      p.scene.tweens.add({
        targets: spike, alpha: 0, duration: 400, delay: 300,
        onComplete: () => spike.destroy(),
      })

      // Fault Line: leave crystal ground hazard
      if ((p as any).hasFaultLine) {
        const fault = spawnCrystalSpike(p, sx, sy, 0.3, 0x88ccff)
        if (fault) fault.setDepth(7).setAlpha(0.5)
        let faultTime = 0
        const faultTimer = p.scene.time.addEvent({
          delay: 500, loop: true,
          callback: () => {
            faultTime += 500
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active) continue
              if (Phaser.Math.Distance.Between(sx, sy, e.x, e.y) < 15) {
                ;(e as BaseEnemy).takeDamage?.(Math.ceil((p as any).damage * 0.15 * p.getMasteryDamageMult('crystal')), 'melee')
              }
              // Resonance Field: slow enemies near Fault Line
              if ((p as any).hasResonanceField && Phaser.Math.Distance.Between(sx, sy, e.x, e.y) < 60) {
                if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
                  (e as BaseEnemy).speed = Math.min((e as BaseEnemy).speed, (e as BaseEnemy).baseSpeed * 0.8)
                }
              }
            }
            if (faultTime >= 4000) {
              faultTimer.destroy()
              if (fault) p.scene.tweens.add({ targets: fault, alpha: 0, duration: 300, onComplete: () => fault.destroy() })
            }
          },
        })
      }

      // Resonance Armor: 0.5s invuln after wave impact (triggers once when any spike hits)
      if ((p as any).hasResonanceArmor && hitSet.size > 0 && !resonanceArmorTriggered) {
        resonanceArmorTriggered = true
        ;(p as any).vanishUntil = p.scene.time.now + 500
      }

      if (i === spikeCount - 1) {
        // Deep Vein: giant crystal pillar at end of chain
        if ((p as any).hasDeepVein) {
          const pillar = spawnCrystalSpike(p, sx, sy, 1.5, undefined, angle)
          if (pillar) {
            pillar.setDepth(12).setScale(0.01)
            p.scene.tweens.add({
              targets: pillar, scaleX: 1.5, scaleY: 1.5,
              duration: 200, ease: 'Back.easeOut',
            })
            p.scene.tweens.add({
              targets: pillar, alpha: 0, scaleY: 1.8,
              duration: 500, delay: 400,
              onComplete: () => pillar.destroy(),
            })
          }
        }
        ;(p as any).isAttacking = false
      }
    })
  }

  // Planted Shard: crystal mine at impact point
  if ((p as any).hasPlantedShard) {
    const mx = cx + Math.cos(angle) * range * 0.6
    const my = cy + Math.sin(angle) * range * 0.6
    p.scene.time.delayedCall(3000, () => {
      const mine = spawnCrystalSpike(p, mx, my, 0.35, 0x8888ff)
      if (!mine) return
      mine.setDepth(8).setAlpha(0.7)
      // Pulsing glow
      p.scene.tweens.add({ targets: mine, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 })
      const mineCheck = p.scene.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(mx, my, e.x, e.y) < 25) {
              // Detonate — crystal burst
              for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e2.active) continue
                if (Phaser.Math.Distance.Between(mx, my, e2.x, e2.y) < 60) {
                  ;(e2 as BaseEnemy).takeDamage?.(Math.ceil((p as any).damage * 0.8 * p.getMasteryDamageMult('crystal')), 'melee')
                }
              }
              mineCheck.destroy()
              // Explosion: burst of crystal shards
              for (let k = 0; k < 6; k++) {
                spawnCrystalShard(p, mx, my, (k / 6) * Math.PI * 2, 30, 300)
              }
              mine.destroy()
              return
            }
          }
        },
      })
      // Mine expires after 15s
      p.scene.time.delayedCall(15000, () => { mineCheck.destroy(); if (mine.scene) mine.destroy() })
    })
  }
}

/** Shared crystal ring burst VFX — crystals evenly spaced by angle, all fly outward from epicenter simultaneously.
 *  Used by eruption attack and death. radius scales crystals proportionally. */
export function crystalRingBurst(p: Player, cx: number, cy: number, radius = 80) {
  // Epicenter — bright flash + dark crater
  const flash = p.scene.add.circle(cx, cy, 6, 0xaaddff, 1).setDepth(12)
  p.scene.tweens.add({
    targets: flash, scale: 4, alpha: 0, duration: 250,
    onComplete: () => flash.destroy(),
  })
  const crater = p.scene.add.graphics().setDepth(11)
  crater.fillStyle(0x0a0a22, 0.9)
  crater.fillCircle(cx, cy, 14)
  crater.fillStyle(0x151535, 0.6)
  crater.fillCircle(cx, cy, 22)
  p.scene.tweens.add({
    targets: crater, alpha: 0, duration: 800, delay: 300,
    onComplete: () => crater.destroy(),
  })

  // Crystals evenly spaced ~20° apart, 3 per direction (near/mid/far)
  // All launch simultaneously from center, further ones travel longer
  const angleStep = Math.PI / 9 // 20°
  const totalCrystals = 18 // full circle: 18 × 20° = 360°
  // 3 concentric rings, crystal size scales with radius (compact)
  const layers = [
    { dist: radius * 0.35, scale: 0.25 + radius * 0.0005, duration: 120 },
    { dist: radius * 0.65, scale: 0.30 + radius * 0.00075, duration: 170 },
    { dist: radius,        scale: 0.35 + radius * 0.001, duration: 220 },
  ]

  for (let i = 0; i < totalCrystals; i++) {
    const a = i * angleStep
    for (const layer of layers) {
      const endX = cx + Math.cos(a) * layer.dist
      const endY = cy + Math.sin(a) * layer.dist

      // Spike tip points outward, spawn at center
      const spike = spawnCrystalSpike(p, cx, cy, layer.scale, undefined, a)
      if (spike) {
        spike.setScale(0.01)
        // Fly outward + scale up — all at once, further = slightly longer travel
        p.scene.tweens.add({
          targets: spike,
          x: endX, y: endY,
          scaleX: layer.scale, scaleY: layer.scale,
          duration: layer.duration, ease: 'Quad.easeOut',
        })
        // Fade out after arriving
        p.scene.tweens.add({
          targets: spike, alpha: 0, duration: 350, delay: 500,
          onComplete: () => spike.destroy(),
        })
      }
    }
  }

  return layers
}

// Crystal Muller — Eruption stance (AoE around self)
export function attackCrystalEruption(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const cx = (p as any).cx, cy = (p as any).cy
  const dmg = Math.ceil((p as any).damage * 0.8 * p.getMasteryDamageMult('crystal'))
  const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()

  const layers = crystalRingBurst(p, cx, cy, (p as any).range * 0.3)

  // All crystals fly simultaneously — damage all enemies in full radius
  const maxDist = layers[layers.length - 1].dist + 20
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active || hitSet.has(e)) continue
    if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= maxDist) {
      ;(e as BaseEnemy).takeDamage?.(dmg, 'melee')
      hitSet.add(e)
    }
  }

  p.scene.time.delayedCall(layers[layers.length - 1].duration + 500, () => {
    ;(p as any).isAttacking = false
  })
}

export function updateMullerPassives(p: Player, delta: number) {
  // Givi has no energy system — attacks freely in either stance

  const scene = p.scene as any
  const enemies = scene.enemies as Phaser.Physics.Arcade.Group | undefined

  // Stone Skin: decay stacks over time (smooth animation)
  if ((p as any).hasStoneSkin && (p as any).stoneSkinStacks > 0) {
    (p as any).stoneSkinTimer += delta
    if ((p as any).stoneSkinTimer >= 4000) {
      (p as any).stoneSkinStacks = Math.max(0, (p as any).stoneSkinStacks - 1)
      ;(p as any).stoneSkinTimer = 0
      ;(p as any).applyStoneSkinVisuals(true) // animate = true for smooth transition
    }
  }

  // Geode Shell cooldown
  if ((p as any).hasGeodeShell && (p as any).geodeShellCooldown > 0) {
    ;(p as any).geodeShellCooldown = Math.max(0, (p as any).geodeShellCooldown - delta)
  }

  // Crystal Wall: barrier every 8s — row of crystal spike sprites
  if ((p as any).hasCrystalWall && enemies) {
    (p as any).crystalWallTimer += delta
    if ((p as any).crystalWallTimer >= 8000) {
      ;(p as any).crystalWallTimer = 0
      const wx = (p as any).cx, wy = (p as any).cy
      const wallSprites: Phaser.GameObjects.Sprite[] = []
      for (let i = 0; i < 5; i++) {
        const sx = wx - 24 + i * 12
        const sp = spawnCrystalSpike(p, sx, wy + 30, 0.35)
        if (sp) { sp.setDepth(8); wallSprites.push(sp) }
      }
      // Block enemies
      let wallLife = 0
      const wallTimer = p.scene.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          wallLife += 100
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || !e.body) continue
            if (Math.abs(e.x - wx) < 35 && Math.abs(e.y - (wy + 34)) < 12) {
              (e.body as Phaser.Physics.Arcade.Body).velocity.y = e.y < wy + 34 ? -60 : 60
            }
            // Resonance Field: slow enemies near structures
            if ((p as any).hasResonanceField && Phaser.Math.Distance.Between(wx, wy, e.x, e.y) < 60) {
              if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
                (e as BaseEnemy).speed = Math.min((e as BaseEnemy).speed, (e as BaseEnemy).baseSpeed * 0.8)
              }
            }
          }
          if (wallLife >= 3000) {
            wallTimer.destroy()
            for (const sp of wallSprites) {
              p.scene.tweens.add({ targets: sp, alpha: 0, duration: 500, onComplete: () => sp.destroy() })
            }
          }
        },
      })
    }
  }

  // Crystal Pillar: periodic pillar every 12s — tall crystal spike sprite
  if ((p as any).hasCrystalPillar && enemies) {
    (p as any).crystalPillarTimer += delta
    if ((p as any).crystalPillarTimer >= 12000) {
      ;(p as any).crystalPillarTimer = 0
      const px = (p as any).cx + Phaser.Math.Between(-40, 40)
      const py = (p as any).cy + Phaser.Math.Between(-40, 40)
      const pillar = spawnCrystalSpike(p, px, py, 0.7)
      if (!pillar) return
      pillar.setDepth(9)
      // Erupt from ground animation
      pillar.setScale(0.01)
      p.scene.tweens.add({ targets: pillar, scaleX: 0.7, scaleY: 0.7, duration: 200, ease: 'Back.easeOut' })
      let pillarLife = 0
      const pillarTimer = p.scene.time.addEvent({
        delay: 200, loop: true,
        callback: () => {
          pillarLife += 200
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(px, py, e.x, e.y) < 50) {
              ;(e as BaseEnemy).takeDamage?.((p as any).damage * 0.1 * p.getMasteryDamageMult('crystal'), 'melee')
              if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
                (e as BaseEnemy).speed = Math.min((e as BaseEnemy).speed, (e as BaseEnemy).baseSpeed * 0.8)
              }
            }
            // Resonance Field: slow enemies near Crystal Pillar
            if ((p as any).hasResonanceField && Phaser.Math.Distance.Between(px, py, e.x, e.y) < 60) {
              if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
                (e as BaseEnemy).speed = Math.min((e as BaseEnemy).speed, (e as BaseEnemy).baseSpeed * 0.8)
              }
            }
          }
          if (pillarLife >= 5000) {
            pillarTimer.destroy()
            // Shatter into shards on expiry
            for (let k = 0; k < 4; k++) spawnCrystalShard(p, px, py, (k / 4) * Math.PI * 2, 25, 300)
            p.scene.tweens.add({ targets: pillar, alpha: 0, scaleY: 0, duration: 300, onComplete: () => pillar.destroy() })
          }
        },
      })
    }
  }

  // Mother Lode: periodic full-screen crystal eruption every 12s
  if ((p as any).hasMotherLode && enemies) {
    (p as any).motherLodeTimer += delta
  }
  if ((p as any).hasMotherLode && enemies && (p as any).motherLodeTimer >= 12000) {
    ;(p as any).motherLodeTimer = 0
    const cx = (p as any).cx, cy = (p as any).cy
    // Visual: expanding ring of crystal spikes + damage wave
    let waveRadius = 0
    const waveRing = p.scene.add.graphics().setDepth(11)
    const expandTimer = p.scene.time.addEvent({
      delay: 30, loop: true,
      callback: () => {
        waveRadius += 40
        // Spawn crystal spikes at the wave front
        const spikesPerWave = 6
        for (let i = 0; i < spikesPerWave; i++) {
          const a = (i / spikesPerWave) * Math.PI * 2 + Math.random() * 0.5
          const sx = cx + Math.cos(a) * waveRadius
          const sy = cy + Math.sin(a) * waveRadius
          const sp = spawnCrystalSpike(p, sx, sy, 0.4 + Math.random() * 0.3)
          if (sp) {
            sp.setDepth(12)
            p.scene.tweens.add({ targets: sp, alpha: 0, duration: 600, delay: 200, onComplete: () => sp.destroy() })
          }
        }
        // Thin expanding ring
        waveRing.clear()
        waveRing.lineStyle(2, 0x88ccff, 0.4)
        waveRing.strokeCircle(cx, cy, waveRadius)
        // Damage all enemies the ring passes through
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          const d = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
          if (d >= waveRadius - 40 && d <= waveRadius + 20) {
            ;(e as BaseEnemy).takeDamage?.((p as any).damage * 3 * p.getMasteryDamageMult('crystal'), 'ice')
          }
        }
        if (waveRadius >= 600) {
          expandTimer.destroy()
          p.scene.tweens.add({ targets: waveRing, alpha: 0, duration: 500, onComplete: () => waveRing.destroy() })
        }
      },
    })
  }
}
