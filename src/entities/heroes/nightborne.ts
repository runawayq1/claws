import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

// ================================================================
// NIGHTBORNE — Void Blade Hero
// Purple palette: 0x9933FF (Void Blade), 0xCC66FF (Phantom), 0x4400BB (Rift)
// ================================================================

// ---- VFX helpers ------------------------------------------------

function spawnCrescent(
  scene: Phaser.Scene,
  x: number,
  y: number,
  angle: number,
  arcDeg: number,
  radius: number,
  color: number,
  lingerMs: number,
) {
  const gfx = scene.add.graphics().setDepth(12).setBlendMode(Phaser.BlendModes.ADD)
  const halfArc = Phaser.Math.DegToRad(arcDeg / 2)
  const startAngle = angle - halfArc
  const endAngle = angle + halfArc

  gfx.lineStyle(4, color, 0.9)
  gfx.beginPath()
  gfx.arc(x, y, radius, startAngle, endAngle, false)
  gfx.strokePath()

  // inner crescent ring
  gfx.lineStyle(2, 0xffffff, 0.5)
  gfx.beginPath()
  gfx.arc(x, y, radius * 0.75, startAngle, endAngle, false)
  gfx.strokePath()

  scene.tweens.add({
    targets: gfx,
    alpha: 0,
    duration: lingerMs,
    ease: 'Quad.easeOut',
    onComplete: () => gfx.destroy(),
  })
}

function spawnBlinkAfterimage(scene: Phaser.Scene, x: number, y: number) {
  const ghost = scene.add.circle(x, y, 10, 0xCC66FF, 0.45).setDepth(8)
  scene.tweens.add({ targets: ghost, alpha: 0, scale: 2.5, duration: 250, onComplete: () => ghost.destroy() })
}

function spawnMicroRift(scene: Phaser.Scene, x: number, y: number) {
  const gfx = scene.add.graphics().setDepth(9)
  gfx.lineStyle(2, 0x4400BB, 0.7)
  gfx.strokeCircle(x, y, 10)
  scene.tweens.add({ targets: gfx, alpha: 0, duration: 500, onComplete: () => gfx.destroy() })
}

function spawnVoidZone(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radiusPx: number,
  durationMs: number,
  slowFraction: number,
  dotPct: number,
  enemies: Phaser.Physics.Arcade.Group,
  playerDamage: number,
) {
  const gfx = scene.add.graphics().setDepth(5)
  gfx.fillStyle(0x4400BB, 0.18)
  gfx.fillCircle(x, y, radiusPx)
  gfx.lineStyle(1, 0x9933FF, 0.5)
  gfx.strokeCircle(x, y, radiusPx)

  const tickInterval = 500
  let elapsed = 0
  const timer = scene.time.addEvent({
    delay: tickInterval,
    loop: true,
    callback: () => {
      elapsed += tickInterval
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radiusPx) {
          ;(e as BaseEnemy).takeDamage(playerDamage * dotPct * (tickInterval / 1000), 'void')
          ;(e as any)._voidSlowed = (scene.time.now + 1000)
          ;(e as any)._voidSlowFrac = slowFraction
        }
      }
      if (elapsed >= durationMs) {
        timer.destroy()
        scene.tweens.add({ targets: gfx, alpha: 0, duration: 300, onComplete: () => gfx.destroy() })
      }
    },
  })
}

// ---- Main attack: Void Slash ------------------------------------

export function attackVoidSlash(
  p: Player,
  target: Phaser.Physics.Arcade.Sprite,
  enemies: Phaser.Physics.Arcade.Group,
) {
  const time = p.scene.time.now

  // Void Step: blink toward target before attacking
  if (p.hasVoidStep) {
    const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y)
    const blinkDist = p.voidStepDist
    if (dist > 30) {
      const ang = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y)
      const actualBlink = Math.min(blinkDist, dist - 20)
      spawnBlinkAfterimage(p.scene, p.x, p.y)

      // Micro-rift at origin (Void Step L3)
      if (p.voidStepLevel >= 3) {
        spawnMicroRift(p.scene, p.x, p.y)
        // light DoT on enemies stepping on origin
        const rfX = p.x, rfY = p.y
        const riftDmg = p.damage * 0.2
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(rfX, rfY, e.x, e.y) <= 20) {
            ;(e as BaseEnemy).takeDamage(riftDmg, 'void')
          }
        }
      }

      p.x += Math.cos(ang) * actualBlink
      p.y += Math.sin(ang) * actualBlink
    }
  }

  // Determine arc parameters
  const arcRange = p.voidArcRange
  const arcDeg = p.voidArcAngle
  const angle = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y)
  const halfArcRad = Phaser.Math.DegToRad(arcDeg / 2)

  // Damage multipliers
  let dmgMult = 1
  if (p.hasVoidAscendant && time < p._ascendantUntil) dmgMult *= 1.8

  // Collect enemies in arc
  const hitEnemies: Phaser.Physics.Arcade.Sprite[] = []
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    const dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
    if (dist > arcRange) continue
    const eAng = Phaser.Math.Angle.Between(p.x, p.y, e.x, e.y)
    const diff = Phaser.Math.Angle.Wrap(eAng - angle)
    if (Math.abs(diff) <= halfArcRad) hitEnemies.push(e)
  }

  // Apply damage
  for (const e of hitEnemies) {
    const dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
    let finalDmg = p.damage * dmgMult

    // Void Step L2: bonus dmg if blink closes within 25px
    if (p.hasVoidStep && p.voidStepLevel >= 2) {
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= 25) finalDmg *= 1.15
    }

    // Cleave L2/L3: outer edge bonus
    if (p.hasCleave && dist > arcRange * 0.7) {
      const edgeBonus = p.voidCleaveEdgeBonus
      finalDmg *= (1 + edgeBonus)
    }

    ;(e as BaseEnemy).takeDamage(finalDmg, 'void')

    // Dark Resonance: track last hit time
    if (p.hasDarkResonance) {
      const prev = (e as any)._voidLastHit || 0
      const resWindow = 1500
      if (time - prev < resWindow && prev > 0) {
        // Resonance detonation
        const resDmg = p.damage * p.darkResonanceDmgPct
        const resRadius = p.darkResonanceRadius
        for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e2.active) continue
          if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= resRadius) {
            ;(e2 as BaseEnemy).takeDamage(resDmg, 'void')
            // L3: brief stagger
            if (p.darkResonanceLevel >= 3) {
              ;(e2 as any)._voidStaggerUntil = time + 400
            }
          }
        }
        // Resonance VFX
        const gfx = p.scene.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
        gfx.fillStyle(0x9933FF, 0.5)
        gfx.fillCircle(e.x, e.y, resRadius)
        p.scene.tweens.add({ targets: gfx, alpha: 0, scale: 1.5, duration: 300, onComplete: () => gfx.destroy() })
        ;(e as any)._voidLastHit = 0
      } else {
        ;(e as any)._voidLastHit = time
      }
    }
  }

  // Void Surge: every Nth attack, expanding ring pulse
  if (p.hasVoidSurge) {
    p._surgeCounter = (p._surgeCounter || 0) + 1
    const surgeEvery = p.voidSurgeEvery
    if (p._surgeCounter >= surgeEvery) {
      p._surgeCounter = 0
      const surgeRadius = p.voidSurgeRadius
      const surgeDmg = p.damage * p.voidSurgeDmgPct
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= surgeRadius) {
          ;(e as BaseEnemy).takeDamage(surgeDmg, 'void')
          // L3: slow zone
          if (p.voidSurgeLevel >= 3) {
            ;(e as any)._voidSlowed = time + 1000
            ;(e as any)._voidSlowFrac = 0.5
          }
        }
      }
      const surgeGfx = p.scene.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
      surgeGfx.lineStyle(3, 0x9933FF, 0.9)
      surgeGfx.strokeCircle(p.x, p.y, 10)
      p.scene.tweens.add({
        targets: surgeGfx,
        scaleX: surgeRadius / 10,
        scaleY: surgeRadius / 10,
        alpha: 0,
        duration: 350,
        onComplete: () => surgeGfx.destroy(),
      })
    }
  }

  // Echo Strike: delayed echo slash
  if (p.hasEchoStrike) {
    const echoX = p.x, echoY = p.y
    const echoDelay1 = 200
    p.scene.time.delayedCall(echoDelay1, () => {
      if (p.isDead) return
      const echoDmg = p.damage * p.echoStrikeDmgPct
      const ghost = p.scene.add.circle(echoX, echoY, 12, 0xCC66FF, 0.3).setDepth(9)
      p.scene.tweens.add({ targets: ghost, alpha: 0, scale: 2, duration: 300, onComplete: () => ghost.destroy() })
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const dist = Phaser.Math.Distance.Between(echoX, echoY, e.x, e.y)
        if (dist <= arcRange) {
          const eAng = Phaser.Math.Angle.Between(echoX, echoY, e.x, e.y)
          const diff = Phaser.Math.Angle.Wrap(eAng - angle)
          if (Math.abs(diff) <= halfArcRad) {
            ;(e as BaseEnemy).takeDamage(echoDmg, 'void')
          }
        }
      }
      // Echo L3: second echo
      if (p.echoStrikeLevel >= 3) {
        p.scene.time.delayedCall(150, () => {
          if (p.isDead) return
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            const dist = Phaser.Math.Distance.Between(echoX, echoY, e.x, e.y)
            if (dist <= arcRange) {
              const eAng = Phaser.Math.Angle.Between(echoX, echoY, e.x, e.y)
              const diff = Phaser.Math.Angle.Wrap(eAng - angle)
              if (Math.abs(diff) <= halfArcRad) {
                ;(e as BaseEnemy).takeDamage(p.damage * 0.25, 'void')
              }
            }
          }
        })
      }
    })
  }

  // Void Ascendant: secondary crescent projectile
  if (p.hasVoidAscendant && time < p._ascendantUntil) {
    const projRange = 200
    const projDmg = p.damage * 0.3
    const pierce = p.voidAscendantLevel >= 2 ? 2 : 1
    let pierced = 0
    const sorted = (enemies.getChildren() as Phaser.Physics.Arcade.Sprite[])
      .filter(e => e.active)
      .sort((a, b) =>
        Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) -
        Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y),
      )
    for (const e of sorted) {
      if (pierced >= pierce) break
      const dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
      if (dist <= projRange) {
        ;(e as BaseEnemy).takeDamage(projDmg, 'void')
        pierced++
      }
    }
  }

  // Crescent VFX
  const vfxColor = (p.hasVoidAscendant && time < p._ascendantUntil) ? 0xffffff : 0x9933FF
  const lingerMs = p.hasVoidEdge && p.voidEdgeLevel >= 3 ? 300 : 150
  spawnCrescent(p.scene, p.x, p.y, angle, arcDeg, arcRange, vfxColor, lingerMs)
}

// ---- On-kill handler -------------------------------------------

export function onKillNightborne(
  p: Player,
  ex: number,
  ey: number,
  enemies: Phaser.Physics.Arcade.Group,
) {
  // Void Zone: spawn on kill
  if (p.hasVoidZone) {
    const radius = p.voidZoneRadius
    const dur = p.voidZoneDuration
    const slow = 0.35
    const dot = p.voidZoneDotPct
    spawnVoidZone(p.scene, ex, ey, radius, dur, slow, dot, enemies, p.damage)
  }

  // Mirror Swarm: spawn phantom ally on kill
  if (p.hasMirrorSwarm) {
    const slashesLeft = p.mirrorSwarmSlashes
    spawnPhantomAlly(p, ex, ey, slashesLeft, enemies, false)
  }
}

// ---- Phantom ally (Mirror Swarm) --------------------------------

function spawnPhantomAlly(
  p: Player,
  x: number,
  y: number,
  slashesLeft: number,
  enemies: Phaser.Physics.Arcade.Group,
  isChain: boolean,
) {
  if (slashesLeft <= 0) return
  const gfx = p.scene.add.graphics().setDepth(10)
  gfx.fillStyle(0xCC66FF, 0.35)
  gfx.fillCircle(0, 0, 10)
  gfx.setPosition(x, y)

  let remaining = slashesLeft
  const doSlash = () => {
    if (!gfx.active || remaining <= 0) { gfx.destroy(); return }
    let nearest: Phaser.Physics.Arcade.Sprite | null = null
    let nearDist = Infinity
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y)
      if (d < 120 && d < nearDist) { nearDist = d; nearest = e }
    }
    if (nearest) {
      ;(nearest as BaseEnemy).takeDamage(p.damage, 'void')

      // L3 chain: if this ally kills, spawn smaller phantom (1 level deep only)
      if ((nearest as BaseEnemy).hp <= 0 && p.mirrorSwarmSlashes >= 3 && !isChain) {
        spawnPhantomAlly(p, nearest.x, nearest.y, 1, enemies, true)
      }

      remaining--
      if (remaining > 0) {
        p.scene.time.delayedCall(350, doSlash)
      } else {
        gfx.destroy()
      }
    } else {
      // no target nearby — check again later
      p.scene.time.delayedCall(300, doSlash)
    }
  }
  p.scene.time.delayedCall(100, doSlash)
}

// ---- Shade Legion duplicates -----------------------------------

interface ShadeDuplicate {
  gfx: Phaser.GameObjects.Graphics
  x: number
  y: number
  lastAttack: number
}

export function activateShadeLegion(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const count = 4
  const dur = p.shadeLegionDuration
  const dmgMult = p.shadeLegionDmgPct
  const attackInterval = 600

  p._shadeLegionUntil = p.scene.time.now + dur
  p._invulnUntil = p.scene.time.now + dur  // fractured = invulnerable

  // Spawn 4 duplicates around player
  const shades: ShadeDuplicate[] = []
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2
    const sx = p.x + Math.cos(ang) * 60
    const sy = p.y + Math.sin(ang) * 60
    const gfx = p.scene.add.graphics().setDepth(10)
    gfx.fillStyle(0xCC66FF, 0.4)
    gfx.fillCircle(0, 0, 10)
    gfx.lineStyle(1, 0x9933FF, 0.7)
    gfx.strokeCircle(0, 0, 12)
    gfx.setPosition(sx, sy)
    shades.push({ gfx, x: sx, y: sy, lastAttack: 0 })
  }

  const tick = p.scene.time.addEvent({
    delay: attackInterval,
    loop: true,
    callback: () => {
      const now = p.scene.time.now
      if (now > p._shadeLegionUntil) {
        tick.destroy()
        for (const s of shades) s.gfx.destroy()

        // L3: implosion burst
        if (p.shadeLegionLevel >= 3) {
          const burstDmg = p.damage * 1.5
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= 160) {
              ;(e as BaseEnemy).takeDamage(burstDmg, 'void')
            }
          }
          const impGfx = p.scene.add.graphics().setDepth(14).setBlendMode(Phaser.BlendModes.ADD)
          impGfx.fillStyle(0x9933FF, 0.7)
          impGfx.fillCircle(0, 0, 10)
          impGfx.setPosition(p.x, p.y)
          p.scene.tweens.add({
            targets: impGfx,
            scaleX: 16,
            scaleY: 16,
            alpha: 0,
            duration: 500,
            onComplete: () => impGfx.destroy(),
          })
        }
        return
      }
      for (const shade of shades) {
        let nearest: Phaser.Physics.Arcade.Sprite | null = null
        let nearDist = Infinity
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          const d = Phaser.Math.Distance.Between(shade.x, shade.y, e.x, e.y)
          if (d < nearDist) { nearDist = d; nearest = e }
        }
        if (nearest) {
          ;(nearest as BaseEnemy).takeDamage(p.damage * dmgMult, 'void')
          const spark = p.scene.add.circle(nearest.x, nearest.y, 4, 0xCC66FF, 0.8).setDepth(11)
          p.scene.tweens.add({ targets: spark, alpha: 0, scale: 2, duration: 150, onComplete: () => spark.destroy() })
        }
      }
    },
  })
}

// ---- Rift Collapse ultimate ------------------------------------

export function activateRiftCollapse(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const pullRadius = p.riftCollapseRadius
  const dmg = p.damage * p.riftCollapseDmgPct
  const windUp = 800

  // Find largest cluster center
  const live = (enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]).filter(e => e.active)
  if (live.length === 0) return
  let bestX = live[0].x, bestY = live[0].y, bestCount = 0
  for (const e of live) {
    let cnt = 0
    for (const e2 of live) {
      if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= pullRadius * 0.5) cnt++
    }
    if (cnt > bestCount) { bestCount = cnt; bestX = e.x; bestY = e.y }
  }

  // Wind-up circle
  const windGfx = p.scene.add.graphics().setDepth(13)
  windGfx.lineStyle(3, 0x4400BB, 0.9)
  windGfx.strokeCircle(bestX, bestY, 20)
  p.scene.tweens.add({
    targets: windGfx,
    scaleX: pullRadius / 20,
    scaleY: pullRadius / 20,
    alpha: 0.6,
    duration: windUp,
    ease: 'Quad.easeIn',
    onComplete: () => {
      windGfx.destroy()

      // Pull & damage
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const dist = Phaser.Math.Distance.Between(bestX, bestY, e.x, e.y)
        if (dist <= pullRadius) {
          const ang = Phaser.Math.Angle.Between(e.x, e.y, bestX, bestY)
          const pull = Math.min(80, dist * 0.6)
          e.x += Math.cos(ang) * pull
          e.y += Math.sin(ang) * pull
          ;(e as BaseEnemy).takeDamage(dmg, 'void')
        }
      }

      // Implosion VFX
      const impGfx = p.scene.add.graphics().setDepth(14).setBlendMode(Phaser.BlendModes.ADD)
      impGfx.fillStyle(0x4400BB, 0.9)
      impGfx.fillCircle(0, 0, 10)
      impGfx.setPosition(bestX, bestY)
      p.scene.tweens.add({
        targets: impGfx,
        scaleX: pullRadius / 10,
        scaleY: pullRadius / 10,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          impGfx.destroy()
          // L3: void zone at collapse
          if (p.hasVoidZone || p.riftCollapseLevel >= 3) {
            spawnVoidZone(p.scene, bestX, bestY, 100, 5000, 0.35, 0.2,
              enemies as Phaser.Physics.Arcade.Group, p.damage)
          }
        },
      })
    },
  })
}

// ---- Update passives -------------------------------------------

export function updateNightbornePassives(p: Player, delta: number, enemies: Phaser.Physics.Arcade.Group) {
  const now = p.scene.time.now

  // Rift Anchor: place anchor every cooldown
  if (p.hasRiftAnchor) {
    p._anchorTimer = (p._anchorTimer || 0) - delta
    if (p._anchorTimer <= 0) {
      p._anchorTimer = p.riftAnchorCooldown
      p._anchorX = p.x
      p._anchorY = p.y
      p._anchorExpiry = now + p.riftAnchorDuration

      // VFX: pulsing anchor circle
      const ag = p.scene.add.graphics().setDepth(6)
      ag.lineStyle(2, 0x4400BB, 0.8)
      ag.strokeCircle(p._anchorX, p._anchorY, 12)
      p.scene.tweens.add({
        targets: ag,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: p.riftAnchorDuration,
        onComplete: () => ag.destroy(),
      })

      // L3: immobilize nearby enemies when anchor placed
      if (p.riftAnchorLevel >= 3) {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(p._anchorX, p._anchorY, e.x, e.y) <= 40) {
            ;(e as any)._voidStaggerUntil = now + 600
          }
        }
      }
    }

    // Auto-teleport when HP < threshold
    const hpPct = p.hp / p.maxHp
    if (hpPct < p.riftAnchorHpThreshold && p._anchorX !== undefined && now < (p._anchorExpiry || 0)) {
      const dx = p._anchorX - p.x
      const dy = p._anchorY - p.y
      if (Math.abs(dx) + Math.abs(dy) > 30) {
        // Damage enemies near anchor on return (L2+)
        if (p.riftAnchorLevel >= 2) {
          const retDmg = p.damage * (p.riftAnchorLevel >= 3 ? 1.3 : 0.8)
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(p._anchorX, p._anchorY, e.x, e.y) <= 50) {
              ;(e as BaseEnemy).takeDamage(retDmg, 'void')
            }
          }
        }
        spawnBlinkAfterimage(p.scene, p.x, p.y)
        p.x = p._anchorX
        p.y = p._anchorY
        p._anchorExpiry = 0  // consumed
      }
    }
    if (now > (p._anchorExpiry || 0)) p._anchorX = undefined as any
  }

  // Spatial Tear: periodic remote burst
  if (p.hasSpatialTear) {
    p._spatialTearTimer = (p._spatialTearTimer || 0) - delta
    if (p._spatialTearTimer <= 0) {
      p._spatialTearTimer = p.spatialTearCooldown

      let nearest: Phaser.Physics.Arcade.Sprite | null = null
      let nearDist = Infinity
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
        if (d < nearDist) { nearDist = d; nearest = e }
      }
      if (nearest) {
        const tx = nearest.x, ty = nearest.y
        const radius = p.spatialTearRadius
        const dmg = p.damage * 1.2

        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= radius) {
            ;(e as BaseEnemy).takeDamage(dmg, 'void')
          }
        }
        // VFX
        const tGfx = p.scene.add.graphics().setDepth(12).setBlendMode(Phaser.BlendModes.ADD)
        tGfx.fillStyle(0x4400BB, 0.7)
        tGfx.fillCircle(0, 0, 10)
        tGfx.setPosition(tx, ty)
        p.scene.tweens.add({
          targets: tGfx,
          scaleX: radius / 10,
          scaleY: radius / 10,
          alpha: 0,
          duration: 350,
          onComplete: () => {
            tGfx.destroy()
            // L3: void zone at tear
            if (p.spatialTearLevel >= 3 && p.hasVoidZone) {
              spawnVoidZone(p.scene, tx, ty, p.voidZoneRadius, p.voidZoneDuration, 0.35, p.voidZoneDotPct, enemies, p.damage)
            }
          },
        })
      }
    }
  }

  // Rift Collapse ultimate cooldown
  if (p.hasRiftCollapse) {
    p._riftCollapseCDTimer = (p._riftCollapseCDTimer || 0) - delta
    if (p._riftCollapseCDTimer <= 0) {
      p._riftCollapseCDTimer = p.riftCollapseCooldown
      activateRiftCollapse(p, enemies)
    }
  }

  // Shade Legion cooldown
  if (p.hasShadeLegion) {
    p._shadeLegionCDTimer = (p._shadeLegionCDTimer || 0) - delta
    if (p._shadeLegionCDTimer <= 0) {
      p._shadeLegionCDTimer = p.shadeLegionCooldown
      activateShadeLegion(p, enemies)
    }
  }

  // Void Ascendant cooldown
  if (p.hasVoidAscendant) {
    p._ascendantCDTimer = (p._ascendantCDTimer || 0) - delta
    if (p._ascendantCDTimer <= 0) {
      p._ascendantCDTimer = p.voidAscendantCooldown
      p._ascendantUntil = now + p.voidAscendantDuration

      // L3: burst opening hit
      if (p.voidAscendantLevel >= 3) {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= 180) {
            ;(e as BaseEnemy).takeDamage(p.damage * 1.2, 'void')
          }
        }
      }
      // Flash VFX
      const aGfx = p.scene.add.graphics().setDepth(15).setBlendMode(Phaser.BlendModes.ADD)
      aGfx.fillStyle(0xffffff, 0.8)
      aGfx.fillCircle(p.x, p.y, 30)
      p.scene.tweens.add({ targets: aGfx, alpha: 0, scale: 3, duration: 400, onComplete: () => aGfx.destroy() })
    }
  }

  // Apply void slow to enemies
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    const slowed = (e as any)._voidSlowed || 0
    if (now < slowed) {
      const slowFrac = (e as any)._voidSlowFrac || 0.35
      const body = e.body as Phaser.Physics.Arcade.Body
      if (body && body.velocity) {
        const vMag = body.velocity.length()
        if (vMag > 0) {
          body.velocity.scale(slowFrac)
        }
      }
    }

    // Stagger
    const staggerUntil = (e as any)._voidStaggerUntil || 0
    if (now < staggerUntil) {
      const body = e.body as Phaser.Physics.Arcade.Body
      if (body) body.setVelocity(0, 0)
    }
  }
}
