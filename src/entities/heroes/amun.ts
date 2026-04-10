import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

/** Apply a stun to an enemy: freeze speed + show spinning star VFX */
function applyStun(p: Player, e: BaseEnemy, duration: number) {
  const origSpeed = e.baseSpeed || e.speed
  e.speed = 0
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
        starGfx.fillCircle(e.x + Math.cos(sa) * sr, e.y - 20 + Math.sin(sa) * sr * 0.5, 2)
      }
    },
  })
  p.scene.time.delayedCall(duration, () => {
    if (e.active) e.speed = origSpeed
    starGfx.destroy()
    stunEvt.destroy()
  })
}

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
      (e as BaseEnemy).takeDamage(dmg, 'shockwave')
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
      const boulderDmg = p.damage * 1.5 * p.getMasteryDamageMult('quake')
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
          const children = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
          for (const e of children) {
            if (!e.active || hitSet.has(e)) continue
            // AABB pre-filter — skip if clearly beyond ring's outer radius
            if (Math.abs(e.x - cx) > radius || Math.abs(e.y - cy) > radius) continue
            const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
            if (dist <= radius && dist >= radius - band) {
              (e as BaseEnemy).takeDamage(p.damage * p.getMasteryDamageMult('quake'), 'shockwave')
              hitSet.add(e)
              const kbAngle = Phaser.Math.Angle.Between(cx, cy, e.x, e.y);
              (e.body as Phaser.Physics.Arcade.Body).setVelocity(
                Math.cos(kbAngle) * kbForce, Math.sin(kbAngle) * kbForce
              )

              // Earthquake: stun enemies for 0.8s
              if (p.hasEarthquake && (e as BaseEnemy).speed !== undefined) {
                applyStun(p, e as BaseEnemy, 800)
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
          if (ringsFinished >= ringCount) p.isAttacking = false
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
          const children2 = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
          for (const e of children2) {
            if (!e.active || hitSet2.has(e)) continue
            // AABB pre-filter — skip if clearly beyond ring's outer radius
            if (Math.abs(e.x - cx) > radius || Math.abs(e.y - cy) > radius) continue
            const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
            if (dist <= radius && dist >= radius - band) {
              (e as BaseEnemy).takeDamage(p.damage * 0.6 * p.getMasteryDamageMult('quake'), 'shockwave')
              hitSet2.add(e)
              const kb = Phaser.Math.Angle.Between(cx, cy, e.x, e.y);
              (e.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(kb) * kbForce * 0.6, Math.sin(kb) * kbForce * 0.6)
              if ((e as BaseEnemy).speed !== undefined) {
                applyStun(p, e as BaseEnemy, p.hasEarthquake ? 800 : 500)
              }
            }
          }
        },
        onComplete: () => ring2.destroy(),
      })
    })
  }
}

export function updateAmunPassives(p: Player, delta: number) {
  // Amun defense aura visual (Bastion)
  if (p.heroType === 'amun' && p.defenseAuraActive) {
    if (!p.defenseAuraGfx) {
      p.defenseAuraGfx = p.scene.add.graphics().setDepth(4)
    }
    p.defenseAuraGfx.clear()
    const auraRadius = (45 + p.armor * 40) * 1.8  // grows with armor, +20%
    const pulse = 0.55 + Math.sin(p.scene.time.now / 600) * 0.15
    const auraCx = p.cx
    const auraCy = (p.y + p.cy) / 2  // halfway between feet and center
    const t = p.scene.time.now
    // Outer glow ring
    p.defenseAuraGfx.lineStyle(4, 0x4488ff, Math.min(1, pulse + 0.25))
    p.defenseAuraGfx.strokeCircle(auraCx, auraCy, auraRadius)
    // Inner fill
    p.defenseAuraGfx.fillStyle(0x2266cc, pulse * 0.45)
    p.defenseAuraGfx.fillCircle(auraCx, auraCy, auraRadius)
    // Bright inner ring
    p.defenseAuraGfx.lineStyle(2, 0x88bbff, Math.min(1, pulse + 0.3))
    p.defenseAuraGfx.strokeCircle(auraCx, auraCy, auraRadius * 0.6)

    // Pulsing wave rings expanding from center outward (2 staggered)
    for (let w = 0; w < 2; w++) {
      const waveCycle = ((t + w * 900) % 1800) / 1800  // 0→1 over 1.8s, staggered
      const waveR = waveCycle * auraRadius
      const waveAlpha = (1 - waveCycle) * 0.55
      if (waveAlpha > 0.01) {
        p.defenseAuraGfx.lineStyle(2, 0x66aaff, waveAlpha)
        p.defenseAuraGfx.strokeCircle(auraCx, auraCy, waveR)
      }
    }

    // Rotating rune arcs (3 segments spinning slowly)
    const runeRot = (t / 2500) % (Math.PI * 2)
    p.defenseAuraGfx.lineStyle(2, 0x99ccff, Math.min(1, pulse + 0.2))
    for (let i = 0; i < 3; i++) {
      const a = runeRot + i * (Math.PI * 2 / 3)
      p.defenseAuraGfx.beginPath()
      p.defenseAuraGfx.arc(auraCx, auraCy, auraRadius * 0.4, a, a + 0.5)
      p.defenseAuraGfx.strokePath()
    }
  }

  // Amun passive aura — orbiting shield projectiles (requires Aura of Might skill)
  if (p.heroType === 'amun' && p.hasPassiveAura) {
    const hpScale = p.hasLivingFortress ? (0.5 + (p.hp / p.maxHp) * 1.5) : 1
    const shieldHitRadius = 22
    const orbitRadius = (45 + p.armor * 40) * 1.8  // matches defense aura radius
    const shieldCount = p.passiveAuraLevel >= 3 ? 3 : p.passiveAuraLevel >= 2 ? 2 : 1
    // Negative = orbit counter-clockwise (opposite to Thorns swords at +0.0035)
    const rotSpeed = -0.0045
    const t = p.scene.time.now

    // Ensure correct number of shield sprites (always blue)
    const hasShieldTex = p.scene.textures.exists('shield_blue')

    if (hasShieldTex) {
      // Create/remove sprites to match shieldCount
      while (p.orbitShields.length < shieldCount) {
        const s = p.scene.add.image(0, 0, 'shield_blue').setDepth(10).setScale(1.8)
        p.orbitShields.push(s)
      }
      while (p.orbitShields.length > shieldCount) {
        const s = p.orbitShields.pop()
        if (s) s.destroy()
      }

      // Position sprites in orbit — center matches defense aura center
      const orbitCx = p.cx
      const orbitCy = (p.y + p.cy) / 2
      const bob = Math.sin(t / 400) * 2
      for (let i = 0; i < shieldCount; i++) {
        const angle = (t * rotSpeed) + i * (Math.PI * 2 / shieldCount)
        const sx = orbitCx + Math.cos(angle) * orbitRadius
        const sy = orbitCy + Math.sin(angle) * orbitRadius + bob
        const shield = p.orbitShields[i]
        shield.setPosition(sx, sy)
        // Slight alpha pulse
        shield.setAlpha(0.85 + Math.sin(t / 300 + i) * 0.15)
      }
    }

    // Glow trail particles (procedural, behind sprites)
    if (!p.passiveAuraGfx) {
      p.passiveAuraGfx = p.scene.add.graphics().setDepth(9)
    }
    p.passiveAuraGfx.clear()
    for (let i = 0; i < shieldCount; i++) {
      const angle = (t * rotSpeed) + i * (Math.PI * 2 / shieldCount)
      const glow = 0.85 + Math.sin(t / 300 + i) * 0.15
      // Trail dots
      const trailCx = p.cx
      const trailCy = (p.y + p.cy) / 2
      for (let d = 1; d <= 3; d++) {
        const ta = angle - d * 0.2
        const tx = trailCx + Math.cos(ta) * orbitRadius
        const ty = trailCy + Math.sin(ta) * orbitRadius
        p.passiveAuraGfx.fillStyle(0x88bbff, glow / d)
        p.passiveAuraGfx.fillCircle(tx, ty, 4 - d * 0.6)
      }
    }

    // Swept-arc damage detection (same logic as Thorns swords, smaller dmg).
    // Tick-snapshot missed enemies because shields move tangentially between
    // ticks — instead check if an enemy falls within the angular arc swept
    // since the last tick, at any radial distance in the shield's extent.
    const SHIELD_TICK_MS = 50
    const shieldHalfLen = shieldHitRadius
    p.shieldTickTimer += delta
    if (p.shieldTickTimer >= SHIELD_TICK_MS) {
      const dtMs = p.shieldTickTimer
      p.shieldTickTimer = 0
      const dmgCx = p.cx
      const dmgCy = (p.y + p.cy) / 2
      const scene = p.scene as any
      if (scene.enemies) {
        const sectorAngle = (Math.PI * 2) / shieldCount
        // rotSpeed is negative (counter-clockwise); normalize sweep magnitude
        // and shift lastBase in the correct direction for phi calculation.
        let sweep = Math.abs(rotSpeed) * dtMs
        if (sweep > sectorAngle) sweep = sectorAngle
        // Dmg per pass calibrated to ~0.3x of sword lvl1 damage (shields are
        // a passive aura, not the main offensive skill).
        const dmgPerPass = p.damage * 0.15 * hpScale
        const rMin = orbitRadius - shieldHalfLen
        const rMax = orbitRadius + shieldHalfLen
        // Shields rotate counter-clockwise (rotSpeed is negative). Each shield
        // sits at angle `curBase + i*sectorAngle` and during this tick swept
        // forward in its travel direction, covering the arc
        // [curBase + i*sec, curBase + i*sec + sweep] (mod 2π). An enemy at
        // angle θ was swept past if (θ - curBase) mod sectorAngle is in [0, sweep].
        const curBase = t * rotSpeed
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          const dx = e.x - dmgCx
          const dy = e.y - dmgCy
          const distSq = dx * dx + dy * dy
          if (distSq < rMin * rMin || distSq > rMax * rMax) continue
          const theta = Math.atan2(dy, dx)
          const phi = ((theta - curBase) % sectorAngle + sectorAngle) % sectorAngle
          if (phi <= sweep) {
            (e as BaseEnemy).takeDamage(dmgPerPass, 'shockwave')
          }
        }
      }
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

  // Amun Thorns: orbiting swords (4 / 6 / 8 — lvl3 spins faster)
  if (p.hasThorns) {
    const swordCount = p.thornsLevel >= 3 ? 8 : p.thornsLevel >= 2 ? 6 : 4
    const rotSpeed = 0.0035
    const orbitRadius = 160
    // Radial blade extent for swept-arc damage detection.
    // Sword.png ~73px diagonal at scale 0.1; radial half-length 36px covers blade.
    const swordHalfLen = 36
    const t = p.scene.time.now
    const baseRot = Math.PI / 4  // sword.png points up-right at 45° → +π/4 rotates tip to horizontal

    const hasSwordTex = p.scene.textures.exists('sword')
    const isMax = p.thornsLevel >= 3
    if (hasSwordTex) {
      while (p.orbitSwords.length < swordCount) {
        const s = p.scene.add.image(0, 0, 'sword').setDepth(10).setScale(0.1)
        p.orbitSwords.push(s)
      }
      while (p.orbitSwords.length > swordCount) {
        const s = p.orbitSwords.pop()
        if (s) s.destroy()
      }

      const orbitCx = p.cx
      const orbitCy = (p.y + p.cy) / 2
      for (let i = 0; i < swordCount; i++) {
        const angle = (t * rotSpeed) + i * (Math.PI * 2 / swordCount)
        const sx = orbitCx + Math.cos(angle) * orbitRadius
        const sy = orbitCy + Math.sin(angle) * orbitRadius
        const sword = p.orbitSwords[i]
        sword.setPosition(sx, sy)
        sword.setRotation(angle + baseRot)  // blade points outward
        if (isMax) sword.setTint(0xff8844)
        else sword.clearTint()
      }
    }

    // Lvl 3 VFX: fiery trail behind each sword + pulsing glow
    if (isMax) {
      if (!p.thornsTrailGfx) p.thornsTrailGfx = p.scene.add.graphics().setDepth(9)
      const trailG = p.thornsTrailGfx
      trailG.clear()
      const trailCx = p.cx
      const trailCy = (p.y + p.cy) / 2
      const pulse = 0.6 + Math.sin(t / 120) * 0.2
      for (let i = 0; i < swordCount; i++) {
        const angle = (t * rotSpeed) + i * (Math.PI * 2 / swordCount)
        // 5 fading trail dots behind the sword along the orbit arc
        for (let d = 1; d <= 5; d++) {
          const ta = angle - d * 0.10
          const tx = trailCx + Math.cos(ta) * orbitRadius
          const ty = trailCy + Math.sin(ta) * orbitRadius
          const a = (1 - d / 5) * 0.55 * pulse
          trailG.fillStyle(d <= 2 ? 0xffcc44 : 0xff5522, a)
          trailG.fillCircle(tx, ty, 4 - d * 0.5)
        }
        // Outer glow under the sword head
        const sx = trailCx + Math.cos(angle) * orbitRadius
        const sy = trailCy + Math.sin(angle) * orbitRadius
        trailG.fillStyle(0xff8844, 0.25 * pulse)
        trailG.fillCircle(sx, sy, 8)
      }
    } else if (p.thornsTrailGfx) {
      p.thornsTrailGfx.destroy()
      p.thornsTrailGfx = null
    }

    // Damage: swept-arc detection. Tick-snapshot OBB at 200ms missed enemies
    // because swords move up to ~112-224px tangentially between ticks while the
    // hitbox was only ~20px wide. Now we check if an enemy falls inside the
    // angular arc a sword has swept since the last tick, for any radial distance
    // within the blade's radial extent.
    const SWORD_TICK_MS = 50
    p.thornsTickTimer += delta
    if (p.thornsTickTimer >= SWORD_TICK_MS) {
      const dtMs = p.thornsTickTimer
      p.thornsTickTimer = 0
      const dmgCx = p.cx
      const dmgCy = (p.y + p.cy) / 2
      const scene = p.scene as any
      if (scene.enemies) {
        const sectorAngle = (Math.PI * 2) / swordCount
        // Angular sweep since last tick (shared across all swords — same rotSpeed).
        // Cap at sectorAngle: once sweep reaches one sector, every radial enemy is
        // hit once per tick (adjacent sword covers the remainder).
        let sweep = rotSpeed * dtMs
        if (sweep > sectorAngle) sweep = sectorAngle
        const curBase = t * rotSpeed
        const lastBase = curBase - sweep
        const rMin = orbitRadius - swordHalfLen
        const rMax = orbitRadius + swordHalfLen
        // Damage per sword pass. Calibrated so lvl1 ~0.9 dmg/sec dwelling,
        // scaling to ~4.5x at lvl3 thanks to more swords + faster rotation.
        const dmgPerPass = p.damage * (0.4 + p.thornsDmgBonus)
        for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          const dx = e.x - dmgCx
          const dy = e.y - dmgCy
          const distSq = dx * dx + dy * dy
          if (distSq < rMin * rMin || distSq > rMax * rMax) continue
          const theta = Math.atan2(dy, dx)
          // phi = how far the enemy sits "behind" the nearest sword in rotation direction
          const phi = ((theta - lastBase) % sectorAngle + sectorAngle) % sectorAngle
          if (phi <= sweep) {
            (e as BaseEnemy).takeDamage(dmgPerPass, 'melee')
          }
        }
      }
    }
  }

  // Amun Gravity Well: pull enemies toward player every 2s
  if (p.hasGravityWell) {
    p.gravityWellTimer += delta
    if (p.gravityWellTimer >= 2000) {
      p.gravityWellTimer = 0
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
        if ((e as BaseEnemy).hp > 0 && (e as BaseEnemy).maxHp && (e as BaseEnemy).hp < (e as BaseEnemy).maxHp * 0.15) {
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= execRadius) {
            (e as BaseEnemy).takeDamage((e as BaseEnemy).hp + 1, 'shockwave')
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
  if (p.heroType === 'amun' && p.dmgAuraActive) {
    const dmgR = 70 + p.splashRadius * 0.8
    // Persistent orange ring visual
    if (!p.dmgAuraGfx) {
      p.dmgAuraGfx = p.scene.add.graphics().setDepth(3)
    }
    p.dmgAuraGfx.clear()
    const dt = p.scene.time.now
    const dPulse = 0.55 + Math.sin(dt / 400) * 0.15
    const dBreathe = dmgR + Math.sin(dt / 600) * 4
    p.dmgAuraGfx.lineStyle(4, 0xff8800, Math.min(1, dPulse + 0.3))
    p.dmgAuraGfx.strokeCircle(p.cx, p.cy, dBreathe)
    p.dmgAuraGfx.fillStyle(0xff6600, dPulse * 0.5)
    p.dmgAuraGfx.fillCircle(p.cx, p.cy, dBreathe)
    // Flame-like segments rotating
    const dRot = (dt / 900) % (Math.PI * 2)
    p.dmgAuraGfx.lineStyle(3, 0xffaa33, Math.min(1, dPulse + 0.35))
    for (let i = 0; i < 6; i++) {
      const a = dRot + i * Math.PI / 3
      p.dmgAuraGfx.beginPath()
      p.dmgAuraGfx.arc(p.cx, p.cy, dBreathe - 5, a, a + 0.3)
      p.dmgAuraGfx.strokePath()
    }

    p.dmgAuraLastPulse += delta
    if (p.dmgAuraLastPulse >= p.dmgAuraCooldown) {
      p.dmgAuraLastPulse = 0
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
            (e as BaseEnemy).takeDamage(pulseDmg, 'shockwave')
          }
        }
      }
    }
  }
}

// AMUN — Melee ground slam (melee stance)
export function attackMelee(
  p: Player,
  target: Phaser.Physics.Arcade.Sprite,
  enemies: Phaser.Physics.Arcade.Group
) {
  const cx = p.x, cy = p.y
  const meleeRange = Math.max(65, p.range)
  const dmg = p.damage * 1.1 * p.getMasteryDamageMult('ground') // melee hits slightly harder per swing
  const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()

  // Hit all enemies in melee cone
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active || hitSet.has(e)) continue
    const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
    if (dist < meleeRange) {
      for (let s = 0; s < p.strikeCount; s++) (e as BaseEnemy).takeDamage(dmg, 'melee')
      hitSet.add(e)
      const kb = Phaser.Math.Angle.Between(cx, cy, e.x, e.y)
      const kbForce = p.hasColossus ? 350 : 150
      ;(e.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(kb) * kbForce, Math.sin(kb) * kbForce
      )

      // Earthquake stun applies in melee too
      if (p.hasEarthquake) {
        applyStun(p, e as BaseEnemy, 800)
      }
    }
  }

  // VFX: ground impact arc
  const dir = Phaser.Math.Angle.Between(cx, cy, target.x, target.y)
  const impactX = cx + Math.cos(dir) * 30
  const impactY = cy + Math.sin(dir) * 30
  const impact = p.scene.add.circle(impactX, impactY, 12, 0xffcc44, 0.6).setDepth(9)
  p.scene.tweens.add({
    targets: impact, scale: 4, alpha: 0, duration: 300,
    onComplete: () => impact.destroy(),
  })

  // Dust particles
  for (let i = 0; i < 4; i++) {
    const a = dir + (Math.random() - 0.5) * 1.2
    const d = 20 + Math.random() * 25
    const dust = p.scene.add.circle(cx, cy, 2 + Math.random() * 2, 0xaa8844, 0.7).setDepth(8)
    p.scene.tweens.add({
      targets: dust,
      x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d,
      alpha: 0, duration: 250 + Math.random() * 100,
      onComplete: () => dust.destroy(),
    })
  }

  p.scene.cameras.main.shake(50, 0.003)
  p.scene.time.delayedCall(120, () => { (p as any).isAttacking = false })
}

// AMUN — Stance energy regen (inactive stance recharges)
export function updateAmunEnergy(p: Player, delta: number) {
  if (!p.hasQuakeStance) return
  const regenAmt = p.energyRegenRate * (delta / 1000)
  if (p.amunStance === 'quake') {
    p.groundEnergy = Math.min(p.maxEnergy, p.groundEnergy + regenAmt)
  } else {
    p.quakeEnergy = Math.min(p.maxEnergy, p.quakeEnergy + regenAmt)
  }
}
