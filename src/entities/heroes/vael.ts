import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

// ─── Bone Thrall type ────────────────────────────────────────────────────────
export interface BoneThrall {
  gfx: Phaser.GameObjects.Graphics
  sprite?: Phaser.GameObjects.Sprite
  hp: number
  maxHp: number
  expireAt: number
  x: number
  y: number
  attackTimer: number
  isRevenant: boolean
  deathBurst?: boolean   // Grave Pact L2+: explode on death
  deathRoot?: boolean    // Grave Pact L3: shrapnel roots
}

// ─── Soul Orb type ───────────────────────────────────────────────────────────
interface SoulOrb {
  gfx: Phaser.GameObjects.Arc
  expireAt: number
  homeSpeed: number
  autoCollect: boolean
  healAmount: number
}

// ─── Blight Pool type ────────────────────────────────────────────────────────
interface BlightPool {
  gfx: Phaser.GameObjects.Graphics
  x: number
  y: number
  radius: number
  expireAt: number
  dmgPerSec: number
  tickTimer: number
  addRotStacks: boolean
}

// ─── Runtime state (stored on Player as _vaelState) ──────────────────────────
export interface VaelState {
  boneThralls: BoneThrall[]
  soulOrbs: SoulOrb[]
  blightPools: BlightPool[]
  revenant: BoneThrall | null
  revenantReformAt: number
  // Charnel Tide active cd
  charnelTideCooldownUntil: number
  // Pandemic active cd
  pandemicCooldownUntil: number
  pandemicZone: { x: number; y: number; radius: number; expireAt: number } | null
  // Sanguine Ascendancy window
  sanguineUntil: number
  sanguineCooldownUntil: number
  sanguineDR: boolean
  // Carrion Crown aura
  carrionAuraGfx: Phaser.GameObjects.Graphics | null
  carrionAuraTick: number
}

/** Get or create the Vael runtime state on the player. */
function getState(p: Player): VaelState {
  const pp = p as any
  if (!pp._vaelState) {
    pp._vaelState = {
      boneThralls: [],
      soulOrbs: [],
      blightPools: [],
      revenant: null,
      revenantReformAt: 0,
      charnelTideCooldownUntil: 0,
      pandemicCooldownUntil: 0,
      pandemicZone: null,
      sanguineUntil: 0,
      sanguineCooldownUntil: 0,
      sanguineDR: false,
      carrionAuraGfx: null,
      carrionAuraTick: 0,
    } as VaelState
  }
  return pp._vaelState as VaelState
}

// ─── Soul Bolt base attack ────────────────────────────────────────────────────
export function attackSoulBolt(
  p: Player,
  target: Phaser.Physics.Arcade.Sprite,
  enemies: Phaser.Physics.Arcade.Group
) {
  const scene = p.scene
  const tx = target.x
  const ty = target.y

  // Visual: pale-purple spike erupts from ground at target position
  const spike = scene.add.graphics()
  spike.setDepth(12)
  spike.x = tx
  spike.y = ty

  const spikeColor = 0x9966cc
  const glowColor = 0xccaaff

  // Draw spike shape at scale 0
  function drawSpike(h: number) {
    spike.clear()
    if (h <= 0) return
    // Glow
    spike.fillStyle(glowColor, 0.25)
    spike.fillEllipse(0, 0, 18, h * 0.6)
    // Spike body
    spike.fillStyle(spikeColor, 0.9)
    spike.fillTriangle(-5, 0, 5, 0, 0, -h)
    // Bone shard detail lines
    spike.lineStyle(1, 0xddeeff, 0.7)
    spike.lineBetween(-3, -h * 0.3, 3, -h * 0.6)
  }

  // Animate eruption
  let height = 0
  scene.tweens.add({
    targets: { h: 0 },
    h: 40,
    duration: 130,
    ease: 'Back.easeOut',
    onUpdate: (tween) => {
      height = tween.getValue() as number
      drawSpike(height)
    },
    onComplete: () => {
      // Deal damage + root on reach
      if (!target.active) { spike.destroy(); return }

      const enemy = target as unknown as BaseEnemy
      const dmg = p.damage * (p.getMasteryDamageMult?.('soulbolt') ?? 1)

      // Wound Memory: rooted enemies take bonus damage
      let totalDmg = dmg
      if ((p as any).hasWoundMemory && (enemy as any).isRooted) {
        const bonus = [(p as any).woundMemoryBonus ?? 0.2][0]
        totalDmg *= (1 + bonus)
      }

      // Festering Wound: apply rot stacks
      if ((p as any).hasFesteringWound) {
        const stacks = (p as any).festeringWoundStacks ?? 1
        enemy.rotStacks = (enemy.rotStacks ?? 0) + stacks
        enemy.rotExpiry = Math.max(enemy.rotExpiry ?? 0, scene.time.now + 12000)
      }

      // Damage bonus for enemies with 3+ rot stacks
      if ((enemy.rotStacks ?? 0) >= 3) {
        const rotBonus = (p as any).festeringWoundDmgBonus ?? 0
        totalDmg *= (1 + rotBonus)
      }

      enemy.takeDamage(totalDmg, 'soul' as any)
      p.awardMasteryXP?.('soulbolt', 1.0)

      // Base Soul Bolt splash: 35px AoE, 35% dmg (no upgrade needed)
      const splashR = 35
      const splashDmg = totalDmg * 0.35
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active || e === target) continue
        if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= splashR) {
          (e as unknown as BaseEnemy).takeDamage(splashDmg, 'soul' as any)
        }
      }

      // Hollow Touch: lifesteal
      if ((p as any).hasHollowTouch) {
        const rate = (p as any).hollowTouchRate ?? 0.08
        const heal = totalDmg * rate
        p.hp = Math.min(p.maxHp, p.hp + heal)
      }

      // Root the enemy
      const rootDur = (p as any).woundMemoryRootDur ?? 400
      enemy.isRooted = true
      enemy.rootTimer = rootDur
      scene.time.delayedCall(rootDur, () => {
        if (enemy.active) enemy.isRooted = false
      })

      // Root VFX — pale chains ring
      const rootFx = scene.add.graphics().setDepth(11)
      rootFx.x = tx; rootFx.y = ty
      rootFx.lineStyle(2, 0xccaaff, 0.8)
      rootFx.strokeCircle(0, 0, 16)
      scene.tweens.add({ targets: rootFx, alpha: 0, scale: 2, duration: rootDur, onComplete: () => rootFx.destroy() })

      // Exsanguination: chain to nearby enemies
      if ((p as any).hasExsanguination) {
        const chainCount = (p as any).exsangChainCount ?? 2
        const chainDmgPct = (p as any).exsangDmgPct ?? 0.60
        const chainRange = 80 + ((p as any).exsangRangeBonus ?? 0)
        const hit = new Set<Phaser.Physics.Arcade.Sprite>()
        hit.add(target)
        let lastX = tx, lastY = ty
        for (let c = 0; c < chainCount; c++) {
          let bestDist = Infinity; let bestEnemy: Phaser.Physics.Arcade.Sprite | null = null
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active || hit.has(e)) continue
            const d = Phaser.Math.Distance.Between(lastX, lastY, e.x, e.y)
            if (d < chainRange && d < bestDist) { bestDist = d; bestEnemy = e }
          }
          if (!bestEnemy) break
          hit.add(bestEnemy)
          const ce = bestEnemy as unknown as BaseEnemy
          const chainDmg = totalDmg * chainDmgPct
          ce.takeDamage(chainDmg, 'soul' as any)
          if ((p as any).hasHollowTouch) {
            const rate = (p as any).hollowTouchRate ?? 0.08
            p.hp = Math.min(p.maxHp, p.hp + chainDmg * rate)
          }
          // Chain arc VFX — 3 layered lines for solid look
          const arcGfx = scene.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
          arcGfx.lineStyle(5, 0x4422aa, 1.0)
          arcGfx.lineBetween(lastX, lastY, bestEnemy.x, bestEnemy.y)
          arcGfx.lineStyle(3, 0x9966cc, 1.0)
          arcGfx.lineBetween(lastX, lastY, bestEnemy.x, bestEnemy.y)
          arcGfx.lineStyle(1, 0xeeccff, 1.0)
          arcGfx.lineBetween(lastX, lastY, bestEnemy.x, bestEnemy.y)
          scene.tweens.add({ targets: arcGfx, alpha: 0, duration: 450, onComplete: () => arcGfx.destroy() })
          lastX = bestEnemy.x; lastY = bestEnemy.y
        }

        // Exsanguination L3: second arc from last target after 0.5s
        if ((p as any).exsangDoubleArc && hit.size > 1) {
          scene.time.delayedCall(500, () => {
            const lastTarget = [...hit][hit.size - 1]
            if (!lastTarget.active) return
            let best2: Phaser.Physics.Arcade.Sprite | null = null; let bd2 = Infinity
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active || hit.has(e)) continue
              const d = Phaser.Math.Distance.Between(lastTarget.x, lastTarget.y, e.x, e.y)
              if (d < chainRange && d < bd2) { bd2 = d; best2 = e }
            }
            if (best2) {
              const ce2 = best2 as unknown as BaseEnemy
              ce2.takeDamage(totalDmg * chainDmgPct, 'soul' as any)
              const a2 = scene.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
              a2.lineStyle(5, 0x4422aa, 1.0)
              a2.lineBetween(lastTarget.x, lastTarget.y, best2.x, best2.y)
              a2.lineStyle(3, 0xccaaff, 1.0)
              a2.lineBetween(lastTarget.x, lastTarget.y, best2.x, best2.y)
              a2.lineStyle(1, 0xffffff, 1.0)
              a2.lineBetween(lastTarget.x, lastTarget.y, best2.x, best2.y)
              scene.tweens.add({ targets: a2, alpha: 0, duration: 450, onComplete: () => a2.destroy() })
            }
          })
        }
      }

      // Fade out spike
      scene.tweens.add({
        targets: { h: 40 },
        h: 0,
        duration: 100,
        onUpdate: (tween) => drawSpike(tween.getValue() as number),
        onComplete: () => spike.destroy(),
      })
    },
  })
}

// ─── Passive update (called every frame from Player.update) ──────────────────
export function updateVaelPassives(p: Player, delta: number) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now

  // ── Bone Thrall AI ──────────────────────────────────────────────────────────
  const enemies = (scene as any).enemies as Phaser.Physics.Arcade.Group | undefined
  const thrallDmgPct = (p as any).risenDmgPct ?? 0.30
  const thrallDmgBonus = (p as any).undyingLaborDmgBonus ?? 0  // Undying Labor L3

  const activeThralls: BoneThrall[] = []
  for (const thrall of st.boneThralls) {
    if (now > thrall.expireAt || thrall.hp <= 0) {
      // Grave Pact L2+: death burst
      if (thrall.deathBurst && !thrall.isRevenant) {
        spawnThrallDeathBurst(p, thrall, enemies)
      }
      thrall.sprite?.destroy()
      thrall.gfx.destroy()
      continue
    }
    activeThralls.push(thrall)

    // Move toward nearest enemy
    if (enemies) {
      let nearest: Phaser.Physics.Arcade.Sprite | null = null
      let nearDist = Infinity
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const d = Phaser.Math.Distance.Between(thrall.x, thrall.y, e.x, e.y)
        if (d < nearDist) { nearDist = d; nearest = e }
      }
      if (nearest) {
        const inRange = nearDist < 28
        thrall.attackTimer = (thrall.attackTimer ?? 0) - delta

        if (inRange) {
          // Stop and attack — play attack anim
          if (thrall.sprite) {
            thrall.sprite.setFlipX(nearest.x < thrall.x)
            if (thrall.sprite.anims.currentAnim?.key !== 'thrall_attack_anim') {
              thrall.sprite.play('thrall_attack_anim')
              thrall.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                if (thrall.sprite?.active) thrall.sprite.play('thrall_walk_anim')
              })
            }
          }
          if (thrall.attackTimer <= 0) {
            thrall.attackTimer = thrall.isRevenant ? 800 : 1000
            const baseDmg = thrall.isRevenant
              ? p.damage * ((p as any).revenantDmgPct ?? 0.80)
              : p.damage * thrallDmgPct * (1 + thrallDmgBonus)
            ;(nearest as unknown as BaseEnemy).takeDamage(baseDmg, 'melee')
          }
        } else {
          // Move toward target
          const speed = thrall.isRevenant ? 90 : 70
          const angle = Phaser.Math.Angle.Between(thrall.x, thrall.y, nearest.x, nearest.y)
          thrall.x += Math.cos(angle) * speed * (delta / 1000)
          thrall.y += Math.sin(angle) * speed * (delta / 1000)
          if (thrall.sprite) thrall.sprite.setFlipX(nearest.x < thrall.x)
        }

        // Revenant aura: slow nearby enemies
        if (thrall.isRevenant && (p as any).revenantSlowAura) {
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(thrall.x, thrall.y, e.x, e.y) < 120) {
              const be = e as unknown as BaseEnemy
              if (be.baseSpeed) be.speed = Math.max(20, be.baseSpeed * 0.85)
            }
          }
        }
      }
    }

    // Draw thrall — sprite for body (if available), gfx for HP pip
    const hpFrac = thrall.hp / thrall.maxHp
    if (thrall.sprite) {
      thrall.sprite.setPosition(thrall.x, thrall.y)
    }
    thrall.gfx.clear()
    thrall.gfx.x = thrall.x
    thrall.gfx.y = thrall.y
    if (!thrall.sprite) {
      // Fallback procedural draw if sprite missing
      const color = thrall.isRevenant ? 0xddbb44 : 0xccbb88
      thrall.gfx.fillStyle(color, 0.9)
      thrall.gfx.fillRect(-5, -14, 10, 14)
      thrall.gfx.fillCircle(0, -18, 5)
    }
    // HP pip always drawn above
    thrall.gfx.fillStyle(0x44ff44, 0.8)
    thrall.gfx.fillRect(-7, -32, Math.round(14 * hpFrac), 2)
  }
  st.boneThralls = activeThralls

  // ── Undying Labor: attack speed bonus from thrall count ────────────────────
  if ((p as any).hasUndyingLabor) {
    const thrallCount = Math.min(st.boneThralls.length, 3)
    const pctPerThrall = (p as any).undyingLaborAtkSpeedPct ?? 0.05
    const bonus = thrallCount * pctPerThrall
    ;(p as any)._undyingLaborBonus = bonus
    // We apply this in attackCooldown reduction dynamically via the existing attack check.
    // We set a runtime field that tryAutoAttack checks:
    ;(p as any)._vaelAttackCDMult = Math.max(0.3, 1 - bonus)
  }

  // ── Revenant reform ────────────────────────────────────────────────────────
  if (!st.revenant && (p as any).hasLichDominion && now > st.revenantReformAt && st.revenantReformAt > 0) {
    spawnRevenant(p)
  }

  // ── Stance energy regen/drain (Sifra-style) ────────────────────────────────
  if (p.vaelStance === 'drain') {
    // Drain stance: continuous energy drain, auto-switch on empty
    if (p.drainEnergy <= 0) {
      p.toggleVaelStance()
    } else {
      p.drainEnergy = Math.max(0, p.drainEnergy - p.energyDrainRate * (delta / 1000))
      // Award mastery XP ~1.0 per second of channeling
      ;(p as any)._drainMasteryAccum = ((p as any)._drainMasteryAccum ?? 0) + delta
      if ((p as any)._drainMasteryAccum >= 1000) {
        p.awardMasteryXP('drain', 1.0)
        ;(p as any)._drainMasteryAccum -= 1000
      }
      p.currentAttackBranch = 'drain'
    }
    // Orbs energy regens while inactive
    p.orbsEnergy = Math.min(p.maxEnergy, p.orbsEnergy + p.energyRegenRate * (delta / 1000))
  } else {
    // Orbs stance: drain energy regens while inactive
    p.drainEnergy = Math.min(p.maxEnergy, p.drainEnergy + p.energyRegenRate * (delta / 1000))
  }

  // ── Soul Drain — Drain stance only ─────────────────────────────────────────
  // Jagged GREEN lightning-like tendrils sucked FROM enemies TO player, healing player.
  if (p.vaelStance === 'drain' && p.drainEnergy > 0) {
    // Radius scales with splashRadius + Exsanguination range bonuses
    const DRAIN_R = 110 + p.splashRadius * 0.6 + ((p as any).exsangRangeBonus ?? 0)
    const TICK_MS = 300
    const dmgPerTick = p.damage * 0.18 * (p.getMasteryDamageMult?.('soulbolt') ?? 1)
    const healRate = (p as any).hollowTouchRate ?? 0.08

    // Use body center (actual character position) instead of sprite frame center
    const pcx = p.cx
    const pcy = p.cy

    if (!(p as any)._drainGfx) {
      ;(p as any)._drainGfx = scene.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
      ;(p as any)._drainTick = 0
      ;(p as any)._drainFadeUntil = 0
    }
    const dGfx = (p as any)._drainGfx as Phaser.GameObjects.Graphics
    dGfx.clear()
    dGfx.setVisible(true)

    // Outer + inner aura rings
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.005)
    const outerR = DRAIN_R
    const innerR = DRAIN_R * 0.75
    dGfx.lineStyle(1.5, 0x44cc66, 0.18 + pulse * 0.10)
    dGfx.strokeCircle(pcx, pcy, outerR)
    dGfx.lineStyle(1, 0x88ff99, 0.14 + pulse * 0.08)
    dGfx.strokeCircle(pcx, pcy, innerR)

    // ── Rotating glyph ring between outer and inner ─────────────────────────
    const glyphR = (outerR + innerR) / 2
    const glyphCount = 12
    const rotation = now * 0.00035  // slow rotation
    const glyphSize = 4
    for (let gi = 0; gi < glyphCount; gi++) {
      const baseA = (gi / glyphCount) * Math.PI * 2 + rotation
      const gx = pcx + Math.cos(baseA) * glyphR
      const gy = pcy + Math.sin(baseA) * glyphR
      const glyphPulse = 0.5 + 0.5 * Math.sin(now * 0.008 + gi * 0.7)
      const alpha = 0.45 + glyphPulse * 0.4

      // Pick glyph type by index (6 variants cycling)
      const type = gi % 6
      dGfx.lineStyle(1.3, 0xaaffaa, alpha)
      dGfx.fillStyle(0x66ff88, alpha * 0.7)
      // Rotate glyph to face outward (tangent)
      const cos = Math.cos(baseA + Math.PI / 2)
      const sin = Math.sin(baseA + Math.PI / 2)
      const local = (lx: number, ly: number): [number, number] => [
        gx + lx * cos - ly * sin,
        gy + lx * sin + ly * cos,
      ]

      if (type === 0) {
        // Vertical bar
        const [x1, y1] = local(0, -glyphSize)
        const [x2, y2] = local(0, glyphSize)
        dGfx.beginPath(); dGfx.moveTo(x1, y1); dGfx.lineTo(x2, y2); dGfx.strokePath()
      } else if (type === 1) {
        // Triangle
        const [a1, a2] = local(0, -glyphSize)
        const [b1, b2] = local(-glyphSize * 0.7, glyphSize * 0.5)
        const [c1, c2] = local(glyphSize * 0.7, glyphSize * 0.5)
        dGfx.beginPath(); dGfx.moveTo(a1, a2); dGfx.lineTo(b1, b2); dGfx.lineTo(c1, c2); dGfx.closePath(); dGfx.strokePath()
      } else if (type === 2) {
        // Diamond (filled dot)
        dGfx.fillCircle(gx, gy, glyphSize * 0.5)
      } else if (type === 3) {
        // Cross
        const [a1, a2] = local(0, -glyphSize)
        const [b1, b2] = local(0, glyphSize)
        const [c1, c2] = local(-glyphSize, 0)
        const [d1, d2] = local(glyphSize, 0)
        dGfx.beginPath(); dGfx.moveTo(a1, a2); dGfx.lineTo(b1, b2); dGfx.strokePath()
        dGfx.beginPath(); dGfx.moveTo(c1, c2); dGfx.lineTo(d1, d2); dGfx.strokePath()
      } else if (type === 4) {
        // Circle
        dGfx.strokeCircle(gx, gy, glyphSize * 0.6)
      } else {
        // Zigzag (3-segment)
        const [a1, a2] = local(-glyphSize, -glyphSize * 0.5)
        const [b1, b2] = local(0, glyphSize * 0.5)
        const [c1, c2] = local(glyphSize, -glyphSize * 0.5)
        dGfx.beginPath(); dGfx.moveTo(a1, a2); dGfx.lineTo(b1, b2); dGfx.lineTo(c1, c2); dGfx.strokePath()
      }
    }

    // Faint connector ring where glyphs sit
    dGfx.lineStyle(0.5, 0x66ff88, 0.08 + pulse * 0.06)
    dGfx.strokeCircle(pcx, pcy, glyphR)

    // Tick damage + draw drain tendrils
    ;(p as any)._drainTick += delta
    const doTick = (p as any)._drainTick >= TICK_MS
    if (doTick) (p as any)._drainTick = 0

    if (enemies) {
      const colorMain = 0x44dd66
      const colorEdge = 0xaaffaa
      const colorGlow = 0x66ff88
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const ex = e.x, ey = e.y
        if (Phaser.Math.Distance.Between(pcx, pcy, ex, ey) > DRAIN_R) continue

        // Jagged bolt from enemy TO player body center (sucking direction)
        const segments = 5
        let bx = ex, by = ey
        const dx = pcx - ex, dy = pcy - ey
        const segDx = dx / segments, segDy = dy / segments

        // Main thick green bolt
        dGfx.lineStyle(3, colorMain, 0.55 + Math.random() * 0.25)
        dGfx.beginPath()
        dGfx.moveTo(bx, by)
        const points: { x: number; y: number }[] = [{ x: bx, y: by }]
        for (let s = 0; s < segments; s++) {
          const nxt = s === segments - 1 ? 0 : 1
          const jitter = (Math.random() - 0.5) * 14 * (1 - nxt)
          const perpX = -segDy / Phaser.Math.Distance.Between(0, 0, segDx, segDy)
          const perpY = segDx / Phaser.Math.Distance.Between(0, 0, segDx, segDy)
          bx += segDx + perpX * jitter
          by += segDy + perpY * jitter
          dGfx.lineTo(bx, by)
          points.push({ x: bx, y: by })
        }
        dGfx.strokePath()

        // Bright inner core (thin white-green)
        dGfx.lineStyle(1, colorEdge, 0.6 + Math.random() * 0.3)
        dGfx.beginPath()
        dGfx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) dGfx.lineTo(points[i].x, points[i].y)
        dGfx.strokePath()

        // Glow dots at enemy anchor + along path
        dGfx.fillStyle(colorGlow, 0.4 + Math.random() * 0.3)
        dGfx.fillCircle(ex, ey, 3 + Math.random() * 2)
        const midIdx = Math.floor(points.length / 2)
        dGfx.fillCircle(points[midIdx].x, points[midIdx].y, 2)

        // Apply damage + lifesteal on tick
        if (doTick) {
          ;(e as unknown as BaseEnemy).takeDamage(dmgPerTick, 'soul' as any)
          p.hp = Math.min(p.maxHp, p.hp + dmgPerTick * healRate)
        }
      }
    }
  }

  // Clear drain gfx when switching to orbs stance
  if (p.vaelStance !== 'drain' && (p as any)._drainGfx) {
    ;((p as any)._drainGfx as Phaser.GameObjects.Graphics).clear()
  }

  // ── Soul Orbs — stationary bones on ground, collect on contact for +1 armor stack ─
  const activeOrbs: SoulOrb[] = []
  for (const orb of st.soulOrbs) {
    if (!orb.gfx.active || now > orb.expireAt) {
      orb.gfx.destroy()
      continue
    }

    // Collect on contact (only if under max stacks)
    const dist = Phaser.Math.Distance.Between(orb.gfx.x, orb.gfx.y, p.cx, p.cy)
    if (dist < 22 && p.soulStacks < p.soulSiphonMaxStacks) {
      p.soulStacks++
      // Collect VFX: small pulse
      const fx = scene.add.circle(orb.gfx.x, orb.gfx.y, 8, 0xaaddff, 0.9).setDepth(11)
        .setBlendMode(Phaser.BlendModes.ADD)
      scene.tweens.add({ targets: fx, scale: 2, alpha: 0, duration: 250, onComplete: () => fx.destroy() })
      orb.gfx.destroy()
      continue
    }

    activeOrbs.push(orb)

    // Gentle pulse — sitting on ground
    const pulse = 0.7 + 0.3 * Math.sin(now / 300 + orb.gfx.x * 0.01)
    orb.gfx.setAlpha(pulse)
  }
  st.soulOrbs = activeOrbs

  // ── Blight Pools ───────────────────────────────────────────────────────────
  const activePools: BlightPool[] = []
  for (const pool of st.blightPools) {
    if (!pool.gfx.active || now > pool.expireAt) {
      pool.gfx.destroy()
      continue
    }
    activePools.push(pool)

    pool.tickTimer -= delta
    if (pool.tickTimer <= 0) {
      pool.tickTimer = 500  // tick every 0.5s
      if (enemies) {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(pool.x, pool.y, e.x, e.y) < pool.radius) {
            ;(e as unknown as BaseEnemy).takeDamage(pool.dmgPerSec * 0.5, 'rot' as any)
            // Necrotic Bloom L3: add 1 rot stack/s (= 0.5/tick)
            if (pool.addRotStacks) {
              const be = e as unknown as BaseEnemy
              be.rotStacks = (be.rotStacks ?? 0) + 1
              be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
            }
          }
        }
      }
    }
  }
  st.blightPools = activePools

  // ── Rot stack decay (Festering Wound L2+) ──────────────────────────────────
  if ((p as any).hasFesteringWound && (p as any).rotSlowDecay && enemies) {
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const be = e as unknown as BaseEnemy
      if ((be.rotStacks ?? 0) <= 0) continue
      if (now > (be.rotExpiry ?? 0)) {
        // Decay 1 stack every 3s — we implement by resetting expiry on next hit
        // Simpler: check every 3s via a per-enemy timer
        be.rotStacks = Math.max(0, (be.rotStacks ?? 0) - 1)
        be.rotExpiry = now + 3000
      }
    }
  }

  // ── Rot slow (Festering Wound L3: 6+ stacks → 15% slow) ───────────────────
  if ((p as any).hasFesteringWound && (p as any).rotSlow && enemies) {
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const be = e as unknown as BaseEnemy
      if ((be.rotStacks ?? 0) >= 6) {
        be.speed = Math.max(20, (be.baseSpeed ?? be.speed) * 0.85)
      }
    }
  }

  // ── Carrion Crown aura ─────────────────────────────────────────────────────
  if ((p as any).hasCarrionCrown && enemies) {
    const auraRadius = (p as any).carrionAuraRadius ?? 150
    const tickInterval = (p as any).carrionAuraInterval ?? 2000
    st.carrionAuraTick -= delta
    if (st.carrionAuraTick <= 0) {
      st.carrionAuraTick = tickInterval
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < auraRadius) {
          const be = e as unknown as BaseEnemy
          be.rotStacks = (be.rotStacks ?? 0) + 1
          be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
          // Carrion Crown L3: enemies deal 10% less dmg
          if ((p as any).carrionWeaken) {
            ;(be as any).dmgReduction = 0.10
          }
        }
      }
    }
    // Draw/update aura gfx
    if (!st.carrionAuraGfx || !st.carrionAuraGfx.active) {
      st.carrionAuraGfx = scene.add.graphics().setDepth(8)
    }
    st.carrionAuraGfx.clear()
    st.carrionAuraGfx.lineStyle(1, 0x66bb33, 0.3 + 0.2 * Math.sin(now / 600))
    st.carrionAuraGfx.strokeCircle(p.x, p.y, auraRadius)
    st.carrionAuraGfx.fillStyle(0x44aa22, 0.05)
    st.carrionAuraGfx.fillCircle(p.x, p.y, auraRadius)
  } else if (st.carrionAuraGfx) {
    st.carrionAuraGfx.destroy()
    st.carrionAuraGfx = null
  }

  // ── Sanguine Ascendancy DR expiry ─────────────────────────────────────────
  if (st.sanguineDR && now > st.sanguineUntil) {
    st.sanguineDR = false
  }
}

// ─── On-kill hook (called from GameScene kill handler) ───────────────────────
export function onVaelKill(
  p: Player,
  enemy: BaseEnemy,
  enemies: Phaser.Physics.Arcade.Group
) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now

  // Risen: chance to spawn bone thrall on Soul Bolt kill
  if ((p as any).hasRisen) {
    const chance = (p as any).risenProcChance ?? 0.25
    const maxThralls = (p as any).risenMaxThralls ?? 999
    if (Math.random() < chance && st.boneThralls.length < maxThralls) {
      spawnBoneThrall(p, enemy.x, enemy.y)
    }
  }

  // Soul Siphon: chance to drop a stationary soul on kill
  if (p.hasSoulSiphon && p.soulStacks < p.soulSiphonMaxStacks) {
    if (Math.random() < p.soulSiphonDropChance) {
      spawnSoulOrb(p, enemy.x, enemy.y)
    }
  }

  // Sanguine Ascendancy: heal on kill during window
  if (now < st.sanguineUntil) {
    const pct = (p as any).sanguineHealPct ?? 0.12
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * pct)
    // Instant orb arc
    if ((p as any).sanguineInstantOrbs) {
      const orbFx = scene.add.circle(enemy.x, enemy.y, 6, 0xaaddff, 0.9).setDepth(12)
      scene.tweens.add({ targets: orbFx, x: p.x, y: p.y, alpha: 0, duration: 150, onComplete: () => orbFx.destroy() })
    }
  }

  // Virulent Spread: transfer rot stacks to nearby enemies on kill
  if ((p as any).hasVirulentSpread && (enemy.rotStacks ?? 0) > 0) {
    const radius = (p as any).virulentSpreadRadius ?? 80
    const dmgPerStack = (p as any).virulentDmgPerStack ?? 0.10
    const stunAt = (p as any).virulentStunAt ?? 999
    let stacksToTransfer = enemy.rotStacks ?? 0
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y) < radius) {
        const be = e as unknown as BaseEnemy
        be.rotStacks = (be.rotStacks ?? 0) + stacksToTransfer
        be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
        // Burst damage
        const burst = p.damage * dmgPerStack * stacksToTransfer
        be.takeDamage(burst, 'rot' as any)
        // Stun if receiving 4+ stacks
        if (stacksToTransfer >= stunAt) {
          be.isRooted = true
          be.rootTimer = 500
          scene.time.delayedCall(500, () => { if (be.active) be.isRooted = false })
        }
      }
    }
    enemy.rotStacks = 0
  }

  // Necrotic Bloom: blight pool on death with enough rot stacks
  if ((p as any).hasNecroticBloom) {
    const threshold = (p as any).necroticBloomThreshold ?? 5
    if ((enemy.rotStacks ?? 0) >= threshold) {
      spawnBlightPool(p, enemy.x, enemy.y)
    }
  }

  // Carrion Crown L3: kill pulse
  if ((p as any).carrionKillPulse) {
    const pulseRadius = 400
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < pulseRadius) {
        const be = e as unknown as BaseEnemy
        be.rotStacks = (be.rotStacks ?? 0) + 3
        be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
      }
    }
    const pFx = scene.add.graphics().setDepth(11)
    pFx.lineStyle(2, 0x66bb33, 0.7)
    pFx.strokeCircle(p.x, p.y, 10)
    scene.tweens.add({ targets: pFx, scaleX: pulseRadius / 10, scaleY: pulseRadius / 10, alpha: 0, duration: 600, onComplete: () => pFx.destroy() })
  }

  // Revenant on-death: trigger charnel tide if has L3 lich dominion
  if ((p as any).hasLichDominion && (p as any).lichRevenantCharnelOnDeath) {
    // Handled in Revenant death code
  }
}

// ─── Spawn helpers ────────────────────────────────────────────────────────────
function spawnBoneThrall(p: Player, x: number, y: number) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now

  const duration = (p as any).risenDuration ?? 4000
  const hpMult = 1 + ((p as any).gravePactHPBonus ?? 0)
  const maxHp = 40 * hpMult
  const hasDeathBurst = (p as any).hasGravePact && (p as any).gravePactDeathBurst
  const hasDeathRoot = (p as any).gravePactDeathRoot ?? false

  ensureThrallAnim(scene)
  const gfx = scene.add.graphics().setDepth(9)
  const sprite = scene.textures.exists('thrall_walk')
    ? scene.add.sprite(x, y, 'thrall_walk', 0).setDepth(9).setScale(1.4)
    : undefined
  if (sprite) sprite.play('thrall_walk_anim')
  const thrall: BoneThrall = {
    gfx, sprite, hp: maxHp, maxHp,
    expireAt: now + duration,
    x, y, attackTimer: 0,
    isRevenant: false,
    deathBurst: hasDeathBurst,
    deathRoot: hasDeathRoot,
  }
  st.boneThralls.push(thrall)

  // Spawn VFX
  const spawnFx = scene.add.graphics().setDepth(10)
  spawnFx.fillStyle(0xccbb88, 0.8)
  spawnFx.fillCircle(x, y, 10)
  scene.tweens.add({ targets: spawnFx, scaleX: 0, scaleY: 2, alpha: 0, duration: 300, onComplete: () => spawnFx.destroy() })
}

function ensureThrallAnim(scene: Phaser.Scene) {
  if (scene.textures.exists('thrall_walk') && !scene.anims.exists('thrall_walk_anim')) {
    scene.anims.create({
      key: 'thrall_walk_anim',
      frames: scene.anims.generateFrameNumbers('thrall_walk', { start: 0, end: 19 }),
      frameRate: 14, repeat: -1,
    })
  }
  if (scene.textures.exists('thrall_attack') && !scene.anims.exists('thrall_attack_anim')) {
    scene.anims.create({
      key: 'thrall_attack_anim',
      frames: scene.anims.generateFrameNumbers('thrall_attack', { start: 0, end: 19 }),
      frameRate: 20, repeat: 0,
    })
  }
}

function spawnRevenant(p: Player) {
  const scene = p.scene
  const st = getState(p)

  ensureThrallAnim(scene)
  const hpMult = 1 + ((p as any).revenantHPBonus ?? 0)
  const revenantMaxHp = p.maxHp * 1.5 * hpMult
  const gfx = scene.add.graphics().setDepth(9)
  const sprite = scene.textures.exists('thrall_walk')
    ? scene.add.sprite(p.x + 30, p.y, 'thrall_walk', 0).setDepth(9).setScale(2.0).setTint(0xddbb44)
    : undefined
  if (sprite) sprite.play('thrall_walk_anim')

  st.revenant = {
    gfx, sprite, hp: revenantMaxHp, maxHp: revenantMaxHp,
    expireAt: Infinity, x: p.x + 30, y: p.y, attackTimer: 0,
    isRevenant: true,
  }
  st.boneThralls.push(st.revenant)

  const spawnFx = scene.add.graphics().setDepth(10)
  spawnFx.lineStyle(2, 0xddbb44, 0.9)
  spawnFx.strokeCircle(p.x, p.y, 15)
  scene.tweens.add({ targets: spawnFx, scale: 3, alpha: 0, duration: 500, onComplete: () => spawnFx.destroy() })
}

function spawnSoulOrb(p: Player, x: number, y: number) {
  const st = getState(p)
  const scene = p.scene
  const now = scene.time.now

  // Stationary bone/soul on ground — long lifetime, collected on player contact
  const orb = scene.add.circle(x, y, 6, 0xccbb88, 0.95).setDepth(10)
    .setStrokeStyle(1, 0xaaddff, 0.8)
  st.soulOrbs.push({ gfx: orb, expireAt: now + 30000, homeSpeed: 0, autoCollect: false, healAmount: 0 })
}

function spawnBlightPool(p: Player, x: number, y: number) {
  const st = getState(p)
  const scene = p.scene
  const now = scene.time.now

  const radius = (p as any).necroticBloomRadius ?? 100
  const duration = (p as any).necroticBloomDuration ?? 5000
  const dmgPerSec = p.damage * ((p as any).necroticBloomDmgPct ?? 0.12)
  const addRotStacks = (p as any).necroticBloomAddRot ?? false

  const gfx = scene.add.graphics().setDepth(7)
  gfx.fillStyle(0x448833, 0.3)
  gfx.fillCircle(x, y, radius)
  gfx.lineStyle(1, 0x66cc44, 0.5)
  gfx.strokeCircle(x, y, radius)

  scene.tweens.add({ targets: gfx, alpha: { from: 0.5, to: 0.3 }, duration: 800, yoyo: true, repeat: -1 })

  st.blightPools.push({ gfx, x, y, radius, expireAt: now + duration, dmgPerSec, tickTimer: 0, addRotStacks })
}

function spawnThrallDeathBurst(p: Player, thrall: BoneThrall, enemies?: Phaser.Physics.Arcade.Group) {
  const scene = p.scene
  const burstRadius = 40 + ((p as any).gravePactBurstRadiusBonus ?? 0)
  const burstDmg = p.damage * ((p as any).gravePactBurstDmgPct ?? 0.60)
  const applyRoot = thrall.deathRoot ?? false

  const bFx = scene.add.graphics().setDepth(10)
  bFx.fillStyle(0xddcc88, 0.7)
  bFx.fillCircle(thrall.x, thrall.y, 8)
  scene.tweens.add({ targets: bFx, scale: burstRadius / 8, alpha: 0, duration: 300, onComplete: () => bFx.destroy() })

  if (enemies) {
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(thrall.x, thrall.y, e.x, e.y) < burstRadius) {
        const be = e as unknown as BaseEnemy
        be.takeDamage(burstDmg, 'bone' as any)
        if (applyRoot) {
          be.isRooted = true
          be.rootTimer = 400
          scene.time.delayedCall(400, () => { if (be.active) be.isRooted = false })
        }
      }
    }
  }
}

// ─── Charnel Tide activation ───────────────────────────────────────────────────
export function activateCharnelTide(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now

  if (now < st.charnelTideCooldownUntil) return

  const radius = (p as any).charnelTideRadius ?? 250
  const maxRise = (p as any).charnelTideMax ?? 5
  const duration = (p as any).charnelTideDuration ?? 8000
  const cooldown = (p as any).charnelTideCooldown ?? 20000
  const explodeOnTimeout = (p as any).charnelTideExplode ?? false

  st.charnelTideCooldownUntil = now + cooldown

  // Rise corpses near player
  let count = 0
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active || count >= maxRise) break
    if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < radius) {
      spawnBoneThrall(p, e.x + Phaser.Math.Between(-20, 20), e.y + Phaser.Math.Between(-20, 20))
      count++
    }
  }

  // Visual ring
  const wave = scene.add.graphics().setDepth(10)
  wave.lineStyle(2, 0xccbb88, 0.8)
  wave.strokeCircle(p.x, p.y, 10)
  scene.tweens.add({ targets: wave, scaleX: radius / 10, scaleY: radius / 10, alpha: 0, duration: 600, onComplete: () => wave.destroy() })

  // Explode thralls on timeout (Charnel Tide L3)
  if (explodeOnTimeout) {
    scene.time.delayedCall(duration, () => {
      for (const t of st.boneThralls) {
        if (!t.isRevenant) spawnThrallDeathBurst(p, t, enemies)
      }
    })
  }
}

// ─── Pandemic activation ──────────────────────────────────────────────────────
export function activatePandemic(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now

  if (now < st.pandemicCooldownUntil) return

  const radius = (p as any).pandemicRadius ?? 200
  const stacks = (p as any).pandemicStacks ?? 5
  const cooldown = (p as any).pandemicCooldown ?? 18000
  const doublePulse = (p as any).pandemicDoublePulse ?? false
  const doubleRadiusBlight = (p as any).pandemicDoubleRadiusBlight ?? false

  st.pandemicCooldownUntil = now + cooldown

  const applyMiasma = () => {
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < radius) {
        const be = e as unknown as BaseEnemy
        be.rotStacks = (be.rotStacks ?? 0) + stacks
        be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 15000)
      }
    }
  }
  applyMiasma()

  if (doubleRadiusBlight) {
    st.pandemicZone = { x: p.x, y: p.y, radius, expireAt: now + 6000 }
  }

  // VFX ring
  const ring = scene.add.graphics().setDepth(11)
  ring.lineStyle(3, 0x88cc55, 0.8)
  ring.strokeCircle(p.x, p.y, 10)
  scene.tweens.add({ targets: ring, scaleX: radius / 10, scaleY: radius / 10, alpha: 0, duration: 800, onComplete: () => ring.destroy() })

  if (doublePulse) {
    scene.time.delayedCall(2000, () => {
      const stacks2 = 3
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < radius) {
          const be = e as unknown as BaseEnemy
          be.rotStacks = (be.rotStacks ?? 0) + stacks2
          be.rotExpiry = Math.max(be.rotExpiry ?? 0, scene.time.now + 15000)
        }
      }
      const ring2 = scene.add.graphics().setDepth(11)
      ring2.lineStyle(2, 0x88cc55, 0.5)
      ring2.strokeCircle(p.x, p.y, 10)
      scene.tweens.add({ targets: ring2, scaleX: radius / 10, scaleY: radius / 10, alpha: 0, duration: 600, onComplete: () => ring2.destroy() })
    })
  }
}

// ─── Sanguine Ascendancy activation ──────────────────────────────────────────
export function activateSanguineAscendancy(p: Player) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now

  if (now < st.sanguineCooldownUntil) return

  const duration = (p as any).sanguineWindowDuration ?? 6000
  st.sanguineUntil = now + duration
  st.sanguineCooldownUntil = now + 25000

  // L3: below 30% HP → 40% DR
  if ((p as any).sanguineLowHpDR && p.hp < p.maxHp * 0.3) {
    st.sanguineDR = true
  }

  // VFX
  const burst = scene.add.graphics().setDepth(12)
  burst.fillStyle(0xaaddff, 0.5)
  burst.fillCircle(p.x, p.y, 12)
  scene.tweens.add({ targets: burst, scale: 5, alpha: 0, duration: 600, onComplete: () => burst.destroy() })
}
