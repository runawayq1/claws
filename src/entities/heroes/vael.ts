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
interface BoneSpike {
  gfx: Phaser.GameObjects.Graphics
  x: number; y: number
  vx: number; vy: number
  life: number
  dmg: number
  angle: number
}
export interface VaelState {
  boneThralls: BoneThrall[]
  soulOrbs: SoulOrb[]
  blightPools: BlightPool[]
  boneSpikes: BoneSpike[]
  revenant: BoneThrall | null
  revenantReformAt: number
  revenantSpikeTimer: number
  // Charnel Tide active cd
  charnelTideCooldownUntil: number
  charnelRangeBoostUntil: number
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
      boneSpikes: [],
      revenant: null,
      revenantReformAt: 0,
      revenantSpikeTimer: 0,
      charnelTideCooldownUntil: 0,
      charnelRangeBoostUntil: 0,
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

// Perf: preallocated scratch buffer for drain tendril point coords.
// Reused every frame for every enemy in range — avoids allocating ~120+ objects
// per frame under heavy drain combat. Size = segments + 1.
const _drainPts: { x: number; y: number }[] = [
  { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
  { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
]

// ─── Soul Bolt base attack ────────────────────────────────────────────────────
export function attackSoulBolt(
  p: Player,
  target: Phaser.Physics.Arcade.Sprite,
  enemies: Phaser.Physics.Arcade.Group
) {
  const scene = p.scene
  const tx = target.x
  const ty = target.y
  const enemyArr = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]

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

      // Carrion Crown aura mark lookup
      const carrionMark = (enemy as any)._vaelCarrionMark ?? 0
      const inCarrionAura = scene.time.now < carrionMark

      // Wound Memory: rooted enemies take bonus damage (L1/L2)
      let totalDmg = dmg
      const wmWindow = (p as any).woundMemoryRecentHitWindow ?? 0
      if ((p as any).hasWoundMemory) {
        if (wmWindow > 0) {
          // L3: enemy takes bonus dmg if hit by Soul Bolt within last 3s (per-enemy timestamp)
          const last = (enemy as any)._vaelBoltHitAt ?? 0
          if (scene.time.now - last < wmWindow) {
            totalDmg *= (1 + ((p as any).woundMemoryBonus ?? 0.20))
          }
          ;(enemy as any)._vaelBoltHitAt = scene.time.now
        } else if ((enemy as any).isRooted) {
          totalDmg *= (1 + ((p as any).woundMemoryBonus ?? 0.20))
        }
      }

      // Carrion Crown L2: aura-marked enemy takes +10% dmg from Soul Bolt
      if (inCarrionAura && ((p as any).carrionOrbsDmgBonus ?? 0) > 0) {
        totalDmg *= (1 + ((p as any).carrionOrbsDmgBonus ?? 0))
      }

      // Festering Wound: apply rot stacks
      if ((p as any).hasFesteringWound) {
        const stacks = (p as any).festeringWoundStacks ?? 1
        enemy.rotStacks = (enemy.rotStacks ?? 0) + stacks
        enemy.rotExpiry = Math.max(enemy.rotExpiry ?? 0, scene.time.now + 12000)
      }

      // Carrion Crown L1: aura-marked enemy gets +1 bonus rot stack on bolt hit
      if ((p as any).carrionOrbsBonusStack && inCarrionAura) {
        enemy.rotStacks = (enemy.rotStacks ?? 0) + 1
        enemy.rotExpiry = Math.max(enemy.rotExpiry ?? 0, scene.time.now + 12000)
      }

      // Damage bonus for enemies with 3+ rot stacks
      if ((enemy.rotStacks ?? 0) >= 3) {
        const rotBonus = (p as any).festeringWoundDmgBonus ?? 0
        totalDmg *= (1 + rotBonus)
      }

      const hpBefore = enemy.hp
      enemy.takeDamage(totalDmg, 'soul' as any)
      p.awardMasteryXP?.('soulbolt', 1.0)

      // Necrotic Bloom L3: Soul Bolt hitting a Pool detonates it for 30% bonus dmg and 0.3s root
      if ((p as any).necroticBloomOrbsDetonate) {
        const st = getState(p)
        for (const pool of st.blightPools) {
          if (Phaser.Math.Distance.Between(pool.x, pool.y, tx, ty) < pool.radius) {
            const detDmg = p.damage * 0.30
            for (const e of enemyArr) {
              if (!e.active) continue
              if (Phaser.Math.Distance.Between(pool.x, pool.y, e.x, e.y) < pool.radius) {
                const be = e as unknown as BaseEnemy
                be.takeDamage(detDmg, 'rot' as any)
                be.isRooted = true
                be.rootTimer = 300
                scene.time.delayedCall(300, () => { if (be.active) be.isRooted = false })
              }
            }
            // Detonation flash
            const det = scene.add.graphics().setDepth(11)
            det.fillStyle(0xaaff66, 0.7)
            det.fillCircle(pool.x, pool.y, pool.radius)
            scene.tweens.add({ targets: det, alpha: 0, scale: 1.4, duration: 350, onComplete: () => det.destroy() })
            break
          }
        }
      }

      // Base Soul Bolt splash: 35px AoE, 35% dmg (no upgrade needed)
      const splashR = 35
      const splashDmg = totalDmg * 0.35
      for (const e of enemyArr) {
        if (!e.active || e === target) continue
        if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= splashR) {
          (e as unknown as BaseEnemy).takeDamage(splashDmg, 'soul' as any)
        }
      }

      // Hollow Touch: lifesteal (orbs rate), L3 overkill half-rate
      if ((p as any).hasHollowTouch) {
        const rate = (p as any).hollowTouchRate ?? 0.08
        const dealt = Math.min(totalDmg, Math.max(0, hpBefore))
        const overkill = Math.max(0, totalDmg - hpBefore)
        const halfOverkill = (p as any).hollowTouchOverkillHalf
        const heal = dealt * rate + (halfOverkill ? overkill * rate * 0.5 : 0)
        p.hp = Math.min(p.maxHp, p.hp + heal)
      }

      // Wound Memory L2: re-rooting the same enemy within 4s grants 1 free armor stack
      if ((p as any).woundMemoryFreeArmorOnRepeat) {
        const lastRoot = (enemy as any)._vaelLastRootAt ?? 0
        if (scene.time.now - lastRoot < 4000 && p.soulStacks < p.soulSiphonMaxStacks) {
          p.soulStacks++
          // Small pop VFX
          const pop = scene.add.circle(p.x, p.y - 20, 6, 0xaaddff, 0.9).setDepth(12)
          scene.tweens.add({ targets: pop, y: p.y - 40, alpha: 0, duration: 400, onComplete: () => pop.destroy() })
        }
        ;(enemy as any)._vaelLastRootAt = scene.time.now
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
          for (const e of enemyArr) {
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
            for (const e of enemyArr) {
              if (!e.active || hit.has(e)) continue
              const d = Phaser.Math.Distance.Between(lastTarget.x, lastTarget.y, e.x, e.y)
              if (d < chainRange && d < bd2) { bd2 = d; best2 = e }
            }
            if (best2) {
              const ce2 = best2 as unknown as BaseEnemy
              const secondArcDmg = totalDmg * chainDmgPct
              ce2.takeDamage(secondArcDmg, 'soul' as any)
              // Exsanguination L3: second arc heals at full bolt lifesteal rate
              if ((p as any).exsangDrainSecondArcLifesteal && (p as any).hasHollowTouch) {
                const rate = (p as any).hollowTouchRate ?? 0.08
                p.hp = Math.min(p.maxHp, p.hp + secondArcDmg * rate)
              }
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
  // Perf: snapshot the enemy list once per frame; all loops below reuse it
  // to avoid 7+ redundant group traversals per frame.
  const enemyArr: Phaser.Physics.Arcade.Sprite[] = enemies
    ? (enemies.getChildren() as Phaser.Physics.Arcade.Sprite[])
    : []
  const thrallDmgPct = (p as any).risenDmgPct ?? 0.30
  const thrallDmgBonus = (p as any).undyingLaborDmgBonus ?? 0  // Undying Labor L3

  const activeThralls: BoneThrall[] = []
  for (const thrall of st.boneThralls) {
    if (now > thrall.expireAt || thrall.hp <= 0) {
      // Grave Pact L2+: death burst
      if (thrall.deathBurst && !thrall.isRevenant) {
        spawnThrallDeathBurst(p, thrall, enemies)
      }
      // Lich Dominion L3: Revenant death → free Charnel Tide (no CD consumed)
      if (thrall.isRevenant) {
        if ((p as any).hasLichDominion && (p as any).lichRevenantCharnelOnDeath && enemies) {
          const radius = (p as any).charnelTideRadius ?? 300
          const maxRise = (p as any).charnelTideMax ?? 6
          let count = 0
          for (const e of enemyArr) {
            if (!e.active || count >= maxRise) break
            if (Phaser.Math.Distance.Between(thrall.x, thrall.y, e.x, e.y) < radius) {
              spawnBoneThrall(p, e.x + Phaser.Math.Between(-20, 20), e.y + Phaser.Math.Between(-20, 20))
              count++
            }
          }
        }
        // Start reform timer (L1: 20s, L2: 15s, L3: 12s — use charnelOnDeath L3 flag as L3 marker)
        const reformMs = (p as any).lichRevenantCharnelOnDeath
          ? 12000
          : ((p as any).revenantHPBonus > 0 ? 15000 : 20000)
        st.revenantReformAt = now + reformMs
        st.revenant = null
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
      for (const e of enemyArr) {
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
          for (const e of enemyArr) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(thrall.x, thrall.y, e.x, e.y) < 120) {
              const be = e as unknown as BaseEnemy
              if (be.baseSpeed) be.speed = Math.max(20, be.baseSpeed * 0.85)
            }
          }
        }

        // Lich Dominion L1 orbs: Revenant fires bone spike projectiles that root on hit
        if (thrall.isRevenant && (p as any).lichRevenantBoneSpike) {
          st.revenantSpikeTimer -= delta
          if (st.revenantSpikeTimer <= 0) {
            st.revenantSpikeTimer = 1800  // every 1.8s
            fireBoneSpike(p, thrall.x, thrall.y, nearest.x, nearest.y)
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

  // ── Auto-cast abilities on cooldown (Vampire Survivors style) ─────────────
  if (enemies) {
    // Charnel Tide: auto-cast when off CD and at least 2 enemies are in range
    if ((p as any).hasCharnelTide && now >= st.charnelTideCooldownUntil) {
      const radius = (p as any).charnelTideRadius ?? 250
      let nearCount = 0
      for (const e of enemyArr) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < radius) nearCount++
        if (nearCount >= 2) break
      }
      if (nearCount >= 2) activateCharnelTide(p, enemies)
    }
    // Pandemic: auto-cast when off CD and at least 1 enemy is in radius
    if ((p as any).hasVaelPandemic && now >= st.pandemicCooldownUntil) {
      const radius = (p as any).pandemicRadius ?? 200
      let hasNear = false
      for (const e of enemyArr) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < radius) { hasNear = true; break }
      }
      if (hasNear) activatePandemic(p, enemies)
    }
    // Sanguine Ascendancy: auto-cast when off CD (always — it's a self-buff)
    if ((p as any).hasSanguineAscendancy && now >= st.sanguineCooldownUntil) {
      activateSanguineAscendancy(p)
    }
  }

  // ── Bone Spike projectiles (Lich Revenant L1) ─────────────────────────────
  const activeSpikes: BoneSpike[] = []
  for (const spike of st.boneSpikes) {
    spike.life -= delta
    if (spike.life <= 0) {
      spike.gfx.destroy()
      continue
    }
    spike.x += spike.vx * (delta / 1000)
    spike.y += spike.vy * (delta / 1000)
    // Collision with nearest enemy
    let hit: Phaser.Physics.Arcade.Sprite | null = null
    if (enemies) {
      for (const e of enemyArr) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(spike.x, spike.y, e.x, e.y) < 20) { hit = e; break }
      }
    }
    if (hit) {
      const be = hit as unknown as BaseEnemy
      be.takeDamage(spike.dmg, 'bone' as any)
      // Root 0.6s
      be.isRooted = true
      be.rootTimer = 600
      scene.time.delayedCall(600, () => { if (be.active) be.isRooted = false })
      // Impact VFX — bone shard burst
      const burst = scene.add.graphics().setDepth(11)
      burst.fillStyle(0xeedda8, 0.9)
      for (let s = 0; s < 6; s++) {
        const ang = (s / 6) * Math.PI * 2
        burst.fillCircle(spike.x + Math.cos(ang) * 6, spike.y + Math.sin(ang) * 6, 2)
      }
      scene.tweens.add({ targets: burst, alpha: 0, scale: 2, duration: 280, onComplete: () => burst.destroy() })
      spike.gfx.destroy()
      continue
    }
    // Draw spike shard — rotating 3-layer bone sliver
    spike.gfx.clear()
    spike.gfx.x = spike.x; spike.gfx.y = spike.y; spike.gfx.rotation = spike.angle
    // Glow
    spike.gfx.fillStyle(0xffeecc, 0.25)
    spike.gfx.fillEllipse(0, 0, 18, 6)
    // Shard body — pale bone
    spike.gfx.fillStyle(0xeedda8, 0.95)
    spike.gfx.fillTriangle(-10, -2, -10, 2, 12, 0)
    // Inner highlight
    spike.gfx.lineStyle(1, 0xffffff, 0.7)
    spike.gfx.lineBetween(-8, 0, 10, 0)
    activeSpikes.push(spike)
  }
  st.boneSpikes = activeSpikes

  // ── Stance energy regen/drain (Sifra-style) ────────────────────────────────
  if (p.vaelStance === 'drain') {
    // Drain stance: continuous energy drain, auto-switch on empty
    if (p.drainEnergy <= 0) {
      p.toggleVaelStance()
    } else {
      // Grave Pact L1: drain cost −5% per active Thrall
      const graveDiscount = (p as any).gravePactDrainEnergyReduc
        ? Math.min(st.boneThralls.length, 5) * (p as any).gravePactDrainEnergyReduc
        : 0
      // Pandemic L3: free drain during boost window
      const pandemicBoostWindow = st.pandemicZone && scene.time.now < st.pandemicZone.expireAt
      const pandemicFree = pandemicBoostWindow && (p as any).pandemicDrainFreeCost
      const costMult = pandemicFree ? 0 : Math.max(0.3, 1 - graveDiscount)
      p.drainEnergy = Math.max(0, p.drainEnergy - p.energyDrainRate * costMult * (delta / 1000))
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
    // Grave Pact L2: each Thrall in range extends reach +15px; L3: relay adds another 30px
    const reachPerThrall = (p as any).gravePactDrainReachPerThrall ?? 0
    const relayBonus = (p as any).gravePactDrainRelayBonus ?? 0
    const thrallCountForRange = Math.min(st.boneThralls.length, 5)
    const grave2 = reachPerThrall * thrallCountForRange
    // Pandemic range boost window
    const pandemicBoostActive = st.pandemicZone && now < st.pandemicZone.expireAt
    const pandemicRangeBoost = pandemicBoostActive ? 90 : 0
    // Charnel Tide drain range boost (4s after cast)
    const charnelBoost = st.charnelRangeBoostUntil > now
      ? ((p as any).charnelTideDrainRangeBoost ?? 0)
      : 0
    const DRAIN_R = 110 + p.splashRadius * 0.6 + ((p as any).exsangRangeBonus ?? 0) + grave2 + relayBonus + pandemicRangeBoost + charnelBoost
    // Sanguine L2: drain tick rate doubled during window
    const sanguineActive = now < st.sanguineUntil
    const sanguineDoubleTick = sanguineActive && (p as any).sanguineDrainTickRateDouble
    // Pandemic L2: +15% tick rate during boost window
    const pandemicTickBoost = pandemicBoostActive ? ((p as any).pandemicTendrilTickRateBoost ?? 0) : 0
    // Lich Dominion L2: +10% tick rate while Revenant alive
    const revenantTickBoost = (st.revenant && (p as any).lichRevenantTendrilTickRate) ? (p as any).lichRevenantTendrilTickRate : 0
    const tickRateMult = (sanguineDoubleTick ? 2 : 1) * (1 + pandemicTickBoost + revenantTickBoost)
    const TICK_MS = Math.max(50, Math.floor(300 / tickRateMult))
    // Exsanguination L2: +10% tendril tick dmg bonus
    const tickDmgBonus = (p as any).exsangDrainTickDmgBonus ?? 0
    // Grave Pact flat dmg bonus per active Thrall
    const graveFlatDmg = (p as any).gravePactDrainFlatDmg
      ? Math.min(st.boneThralls.length, 5) * 1
      : 0
    const dmgPerTick = (p.damage * 0.18 * (1 + tickDmgBonus) + graveFlatDmg) * (p.getMasteryDamageMult?.('soulbolt') ?? 1)
    // Hollow Touch L1+: drain heal rate (separate from orbs rate)
    // Sanguine L1+: override with sanguineDrainTickPct during window
    const healRate = sanguineActive
      ? ((p as any).sanguineDrainTickPct ?? 0.20)
      : ((p as any).hollowTouchDrainRate ?? 0.04)
    // Sanguine L3: 25 HP total heal cap per tick across all targets
    const healCapPerTick = sanguineActive ? ((p as any).sanguineDrainHealCapPerTick ?? 0) : 0
    let healAccumThisTick = 0

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
      // Rotate glyph to face outward (tangent) — math inlined to avoid per-iteration closure
      const cos = Math.cos(baseA + Math.PI / 2)
      const sin = Math.sin(baseA + Math.PI / 2)

      if (type === 0) {
        // Vertical bar
        const x1 = gx + 0 * cos - (-glyphSize) * sin
        const y1 = gy + 0 * sin + (-glyphSize) * cos
        const x2 = gx + 0 * cos - glyphSize * sin
        const y2 = gy + 0 * sin + glyphSize * cos
        dGfx.beginPath(); dGfx.moveTo(x1, y1); dGfx.lineTo(x2, y2); dGfx.strokePath()
      } else if (type === 1) {
        // Triangle
        const a1 = gx + 0 * cos - (-glyphSize) * sin
        const a2 = gy + 0 * sin + (-glyphSize) * cos
        const b1 = gx + (-glyphSize * 0.7) * cos - (glyphSize * 0.5) * sin
        const b2 = gy + (-glyphSize * 0.7) * sin + (glyphSize * 0.5) * cos
        const c1 = gx + (glyphSize * 0.7) * cos - (glyphSize * 0.5) * sin
        const c2 = gy + (glyphSize * 0.7) * sin + (glyphSize * 0.5) * cos
        dGfx.beginPath(); dGfx.moveTo(a1, a2); dGfx.lineTo(b1, b2); dGfx.lineTo(c1, c2); dGfx.closePath(); dGfx.strokePath()
      } else if (type === 2) {
        // Diamond (filled dot)
        dGfx.fillCircle(gx, gy, glyphSize * 0.5)
      } else if (type === 3) {
        // Cross
        const a1 = gx + 0 * cos - (-glyphSize) * sin
        const a2 = gy + 0 * sin + (-glyphSize) * cos
        const b1 = gx + 0 * cos - glyphSize * sin
        const b2 = gy + 0 * sin + glyphSize * cos
        const c1 = gx + (-glyphSize) * cos
        const c2 = gy + (-glyphSize) * sin
        const d1 = gx + glyphSize * cos
        const d2 = gy + glyphSize * sin
        dGfx.beginPath(); dGfx.moveTo(a1, a2); dGfx.lineTo(b1, b2); dGfx.strokePath()
        dGfx.beginPath(); dGfx.moveTo(c1, c2); dGfx.lineTo(d1, d2); dGfx.strokePath()
      } else if (type === 4) {
        // Circle
        dGfx.strokeCircle(gx, gy, glyphSize * 0.6)
      } else {
        // Zigzag (3-segment)
        const a1 = gx + (-glyphSize) * cos - (-glyphSize * 0.5) * sin
        const a2 = gy + (-glyphSize) * sin + (-glyphSize * 0.5) * cos
        const b1 = gx + 0 * cos - (glyphSize * 0.5) * sin
        const b2 = gy + 0 * sin + (glyphSize * 0.5) * cos
        const c1 = gx + glyphSize * cos - (-glyphSize * 0.5) * sin
        const c2 = gy + glyphSize * sin + (-glyphSize * 0.5) * cos
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
      for (const e of enemyArr) {
        if (!e.active) continue
        const ex = e.x, ey = e.y
        if (Phaser.Math.Distance.Between(pcx, pcy, ex, ey) > DRAIN_R) continue

        // Jagged bolt from enemy TO player body center (sucking direction)
        const segments = 5
        let bx = ex, by = ey
        const dx = pcx - ex, dy = pcy - ey
        const segDx = dx / segments, segDy = dy / segments

        // Main thick green bolt — reuse _drainPts scratch buffer (no per-frame allocs)
        dGfx.lineStyle(3, colorMain, 0.55 + Math.random() * 0.25)
        dGfx.beginPath()
        dGfx.moveTo(bx, by)
        _drainPts[0].x = bx; _drainPts[0].y = by
        let ptsLen = 1
        for (let s = 0; s < segments; s++) {
          const nxt = s === segments - 1 ? 0 : 1
          const jitter = (Math.random() - 0.5) * 14 * (1 - nxt)
          const perpX = -segDy / Phaser.Math.Distance.Between(0, 0, segDx, segDy)
          const perpY = segDx / Phaser.Math.Distance.Between(0, 0, segDx, segDy)
          bx += segDx + perpX * jitter
          by += segDy + perpY * jitter
          dGfx.lineTo(bx, by)
          _drainPts[ptsLen].x = bx; _drainPts[ptsLen].y = by
          ptsLen++
        }
        dGfx.strokePath()

        // Bright inner core (thin white-green)
        dGfx.lineStyle(1, colorEdge, 0.6 + Math.random() * 0.3)
        dGfx.beginPath()
        dGfx.moveTo(_drainPts[0].x, _drainPts[0].y)
        for (let i = 1; i < ptsLen; i++) dGfx.lineTo(_drainPts[i].x, _drainPts[i].y)
        dGfx.strokePath()

        // Glow dots at enemy anchor + along path
        dGfx.fillStyle(colorGlow, 0.4 + Math.random() * 0.3)
        dGfx.fillCircle(ex, ey, 3 + Math.random() * 2)
        const midIdx = Math.floor(ptsLen / 2)
        dGfx.fillCircle(_drainPts[midIdx].x, _drainPts[midIdx].y, 2)

        // Apply damage + lifesteal on tick
        if (doTick) {
          const be = e as unknown as BaseEnemy
          // Necrotic Bloom drain dmg bonus if enemy is inside a Blight Pool
          let finalDmg = dmgPerTick
          if ((p as any).hasNecroticBloom && (p as any).necroticBloomDrainDmgBonus) {
            for (const pool of st.blightPools) {
              if (Phaser.Math.Distance.Between(pool.x, pool.y, ex, ey) < pool.radius) {
                finalDmg *= (1 + ((p as any).necroticBloomDrainDmgBonus ?? 0))
                break
              }
            }
          }
          // Festering Wound L3: tendril tick on 5+ stack enemy → 10% dmg burst
          if ((p as any).festeringDrainBurstOnHigh && (be.rotStacks ?? 0) >= 5) {
            finalDmg += p.damage * 0.10
          }
          const hpBefore = be.hp
          be.takeDamage(finalDmg, 'soul' as any)
          const killed = hpBefore > 0 && be.hp <= 0
          // Heal with optional cap
          let healAmt = finalDmg * healRate
          if (healCapPerTick > 0) {
            const remaining = Math.max(0, healCapPerTick - healAccumThisTick)
            healAmt = Math.min(healAmt, remaining)
            healAccumThisTick += healAmt
          }
          p.hp = Math.min(p.maxHp, p.hp + healAmt)
          // Festering Wound drain rot application
          if ((p as any).hasFesteringWound) {
            const everyN = (p as any).festeringDrainEveryNTicks ?? 2
            ;(be as any)._vaelDrainTickCount = ((be as any)._vaelDrainTickCount ?? 0) + 1
            if ((be as any)._vaelDrainTickCount >= everyN) {
              be.rotStacks = (be.rotStacks ?? 0) + 1
              be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
              ;(be as any)._vaelDrainTickCount = 0
            }
          }
          // Drain-kill path: bone drop + thrall proc handled inline
          if (killed) {
            // Necrotic Bloom L3: drain-kill inside a Pool doubles the bone count (bones grant 2 armor)
            let inPoolForBonus = false
            if ((p as any).necroticBloomDrainBoneArmor) {
              for (const pool of st.blightPools) {
                if (Phaser.Math.Distance.Between(pool.x, pool.y, be.x, be.y) < pool.radius) {
                  inPoolForBonus = true
                  break
                }
              }
            }
            // Soul Siphon drain-kill always drops bone(s)
            if (p.hasSoulSiphon && (p as any).soulSiphonDrainAlwaysDrop) {
              let count = (p as any).soulSiphonDrainKillCount ?? 1
              if (inPoolForBonus) count *= 2  // effectively 2 armor instead of 1 per bone
              for (let i = 0; i < count; i++) {
                if (p.soulStacks < p.soulSiphonMaxStacks) spawnSoulOrb(p, be.x + Phaser.Math.Between(-10, 10), be.y + Phaser.Math.Between(-10, 10))
              }
            }
            // Risen drain-kill proc
            if ((p as any).hasRisen) {
              const drainProc = (p as any).risenDrainProcChance ?? 0.40
              const maxThralls = (p as any).risenMaxThralls ?? 999
              if (Math.random() < drainProc && st.boneThralls.length < maxThralls) {
                spawnBoneThrall(p, be.x, be.y, true)
              }
            }
            // Mark kill as drain-origin so shared onVaelKill handler skips orbs-only logic
            ;(be as any)._vaelKillByDrain = true
          }
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

    // Soul Siphon L3 auto-collect radius
    const autoR = (p as any).soulSiphonAutoCollectRadius ?? 0
    const collectDist = Math.max(22, autoR)
    // Collect on contact (only if under max stacks)
    const dist = Phaser.Math.Distance.Between(orb.gfx.x, orb.gfx.y, p.cx, p.cy)
    if (dist < collectDist && p.soulStacks < p.soulSiphonMaxStacks) {
      p.soulStacks++
      // Soul Siphon L2: +10 HP per bone collected
      const boneHeal = (p as any).soulSiphonBoneHeal ?? 0
      // Hollow Touch L2: +1 HP on armor stack gain; L3: +3 HP on walking over bone
      const htArmorHeal = (p as any).hollowTouchArmorHeal ? 1 : 0
      const htBoneHeal = (p as any).hollowTouchBoneHeal ? 3 : 0
      const totalHeal = boneHeal + htArmorHeal + htBoneHeal
      if (totalHeal > 0) p.hp = Math.min(p.maxHp, p.hp + totalHeal)
      // Collect VFX: small pulse
      const fx = scene.add.circle(orb.gfx.x, orb.gfx.y, 8, 0xaaddff, 0.9).setDepth(11)
        .setBlendMode(Phaser.BlendModes.ADD)
      scene.tweens.add({ targets: fx, scale: 2, alpha: 0, duration: 250, onComplete: () => fx.destroy() })
      orb.gfx.destroy()
      continue
    }

    activeOrbs.push(orb)

    // Sanguine Ascendancy L2: bones auto-arc to Vael during the feeding window
    if ((p as any).sanguineBonesAutoArc && now < st.sanguineUntil) {
      const dxArc = p.cx - orb.gfx.x
      const dyArc = p.cy - orb.gfx.y
      const distArc = Math.hypot(dxArc, dyArc)
      if (distArc > 4) {
        const speed = 260
        const step = speed * (delta / 1000)
        orb.gfx.x += (dxArc / distArc) * step
        orb.gfx.y += (dyArc / distArc) * step
      }
    }

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
        for (const e of enemyArr) {
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
    for (const e of enemyArr) {
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
    for (const e of enemyArr) {
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
    // Always mark enemies currently in aura (for stance hooks to read)
    for (const e of enemyArr) {
      if (!e.active) continue
      const inAura = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < auraRadius
      if (inAura) {
        ;(e as any)._vaelCarrionMark = now + 1500
        if ((p as any).carrionWeaken) (e as any).dmgReduction = 0.10
      }
    }
    if (st.carrionAuraTick <= 0) {
      st.carrionAuraTick = tickInterval
      for (const e of enemyArr) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < auraRadius) {
          const be = e as unknown as BaseEnemy
          be.rotStacks = (be.rotStacks ?? 0) + 1
          be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
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
  const enemyArr = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]

  const killedByDrain = (enemy as any)._vaelKillByDrain === true

  // Risen: chance to spawn bone thrall on orbs-kill (drain-kill handled in drain tick path)
  if ((p as any).hasRisen && !killedByDrain) {
    const chance = (p as any).risenProcChance ?? 0.25
    const maxThralls = (p as any).risenMaxThralls ?? 999
    if (Math.random() < chance && st.boneThralls.length < maxThralls) {
      spawnBoneThrall(p, enemy.x, enemy.y)
    }
  }

  // Soul Siphon: chance to drop a stationary soul on orbs-kill
  // (drain-kill drops handled in drain tick path for always-drop behavior)
  const pandemicBoostActive = st.pandemicZone && now < st.pandemicZone.expireAt
  const forceBoneDrop =
    ((enemy as any)._vaelPandemicBoneMark === true) ||
    (!killedByDrain && pandemicBoostActive && (p as any).pandemicOrbsBoneOnKill)
  if (p.hasSoulSiphon && !killedByDrain && p.soulStacks < p.soulSiphonMaxStacks) {
    if (forceBoneDrop || Math.random() < p.soulSiphonDropChance) {
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
    const stacksToTransfer = enemy.rotStacks ?? 0
    // L2 orbs: bolt kills spread to 2 targets simultaneously (pick 2 closest)
    const multiTarget = (p as any).virulentOrbsMultiTarget && !killedByDrain
    const candidates: { e: Phaser.Physics.Arcade.Sprite; d: number }[] = []
    for (const e of enemyArr) {
      if (!e.active || e === (enemy as any)) continue
      const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y)
      if (d < radius) candidates.push({ e, d })
    }
    candidates.sort((a, b) => a.d - b.d)
    const primaryTargets = multiTarget ? candidates.slice(0, 2) : candidates
    for (const { e } of primaryTargets) {
      const be = e as unknown as BaseEnemy
      be.rotStacks = (be.rotStacks ?? 0) + stacksToTransfer
      be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
      const burst = p.damage * dmgPerStack * stacksToTransfer
      be.takeDamage(burst, 'rot' as any)
      // Visual burst trail
      const trail = scene.add.graphics().setDepth(11)
      trail.lineStyle(2, 0x88cc55, 0.7)
      trail.lineBetween(enemy.x, enemy.y, e.x, e.y)
      scene.tweens.add({ targets: trail, alpha: 0, duration: 280, onComplete: () => trail.destroy() })
      // Stun if receiving 4+ stacks
      if (stacksToTransfer >= stunAt) {
        be.isRooted = true
        be.rootTimer = 500
        scene.time.delayedCall(500, () => { if (be.active) be.isRooted = false })
        // L3 orbs: stunned enemies drop 1 bonus bone
        if ((p as any).virulentStunBonusBone && !killedByDrain && p.soulStacks < p.soulSiphonMaxStacks) {
          spawnSoulOrb(p, e.x, e.y)
        }
      }
    }
    enemy.rotStacks = 0
  }

  // Necrotic Bloom: blight pool on death with enough rot stacks
  if ((p as any).hasNecroticBloom) {
    const threshold = (p as any).necroticBloomThreshold ?? 5
    if ((enemy.rotStacks ?? 0) >= threshold) {
      // Pandemic L3: pools spawned inside the miasma zone get double radius
      const doubleR = !!(pandemicBoostActive && (p as any).pandemicDoubleRadiusBlight)
      spawnBlightPool(p, enemy.x, enemy.y, doubleR)
    }
  }

  // Carrion Crown L3: kill pulse
  if ((p as any).carrionKillPulse) {
    const pulseRadius = 400
    for (const e of enemyArr) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < pulseRadius) {
        const be = e as unknown as BaseEnemy
        be.rotStacks = (be.rotStacks ?? 0) + 3
        be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 12000)
      }
    }
    // Orbs branch: detonate all active Blight Pools for 15% dmg each
    if ((p as any).carrionOrbsKillPulseBlight) {
      for (const pool of st.blightPools) {
        const detDmg = p.damage * 0.15
        for (const e of enemyArr) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(pool.x, pool.y, e.x, e.y) < pool.radius) {
            ;(e as unknown as BaseEnemy).takeDamage(detDmg, 'rot' as any)
          }
        }
        // Detonation VFX
        const det = scene.add.graphics().setDepth(11)
        det.fillStyle(0x88cc55, 0.6)
        det.fillCircle(pool.x, pool.y, pool.radius)
        scene.tweens.add({ targets: det, alpha: 0, scale: 1.3, duration: 400, onComplete: () => det.destroy() })
      }
    }
    // Drain branch: refund 20 drainEnergy
    if ((p as any).carrionDrainKillPulseEnergy) {
      p.drainEnergy = Math.min(p.maxEnergy, p.drainEnergy + 20)
    }
    // Two-layer pulse ring
    const pFx = scene.add.graphics().setDepth(11)
    pFx.lineStyle(3, 0x66bb33, 0.8)
    pFx.strokeCircle(p.x, p.y, 10)
    scene.tweens.add({ targets: pFx, scaleX: pulseRadius / 10, scaleY: pulseRadius / 10, alpha: 0, duration: 600, onComplete: () => pFx.destroy() })
    const pFx2 = scene.add.graphics().setDepth(11)
    pFx2.lineStyle(1.5, 0xaaff66, 1.0)
    pFx2.strokeCircle(p.x, p.y, 10)
    scene.tweens.add({ targets: pFx2, scaleX: pulseRadius / 10, scaleY: pulseRadius / 10, alpha: 0, duration: 450, onComplete: () => pFx2.destroy() })
  }

  // Revenant on-death: trigger charnel tide if has L3 lich dominion
  if ((p as any).hasLichDominion && (p as any).lichRevenantCharnelOnDeath) {
    // Handled in Revenant death code
  }
}

// ─── Bone spike projectile (Lich Revenant L1 orbs) ───────────────────────────
function fireBoneSpike(p: Player, fromX: number, fromY: number, toX: number, toY: number) {
  const scene = p.scene
  const st = getState(p)
  const angle = Math.atan2(toY - fromY, toX - fromX)
  const speed = 420
  const gfx = scene.add.graphics().setDepth(11)
  // Muzzle flash at spawn
  const flash = scene.add.graphics().setDepth(12)
  flash.fillStyle(0xffeecc, 0.8)
  flash.fillCircle(fromX, fromY, 8)
  scene.tweens.add({ targets: flash, alpha: 0, scale: 2.5, duration: 200, onComplete: () => flash.destroy() })
  st.boneSpikes.push({
    gfx, x: fromX, y: fromY,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    life: 900,
    dmg: p.damage * 0.60,
    angle,
  })
}

// ─── Spawn helpers ────────────────────────────────────────────────────────────
function spawnBoneThrall(p: Player, x: number, y: number, fromDrain = false) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now

  const duration = (p as any).risenDuration ?? 4000
  const hpMultBase = 1 + ((p as any).gravePactHPBonus ?? 0)
  // Risen L3 drain bonus: drain-spawned thralls get extra HP
  const drainHPBonus = (fromDrain && (p as any).risenDrainHPBonus) ? (p as any).risenDrainHPBonus : 0
  const hpMult = hpMultBase + drainHPBonus
  const maxHp = 40 * hpMult
  const hasDeathBurst = (p as any).hasGravePact && (p as any).gravePactDeathBurst
  const hasDeathRoot = (p as any).gravePactDeathRoot ?? false

  ensureThrallAnim(scene)
  const gfx = scene.add.graphics().setDepth(9)
  const sprite = scene.textures.exists('thrall_walk')
    ? scene.add.sprite(x, y, 'thrall_walk', 0).setDepth(9).setScale(1.4)
    : undefined
  if (sprite) sprite.play('thrall_walk_anim')
  // Risen L2 drain bonus: drain-spawned thralls skip wind-up and lunge into first attack
  const aggroOnSpawn = fromDrain && (p as any).risenDrainAutoTarget
  const thrall: BoneThrall = {
    gfx, sprite, hp: maxHp, maxHp,
    expireAt: now + duration,
    x, y, attackTimer: aggroOnSpawn ? -200 : 0,
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

  // Lich Dominion L2: bone near Revenant → pulse + heal 2 HP
  if (st.revenant && (p as any).lichRevenantBonePulseHeal) {
    if (Phaser.Math.Distance.Between(st.revenant.x, st.revenant.y, x, y) < 160) {
      p.hp = Math.min(p.maxHp, p.hp + 2)
      const pulse = scene.add.graphics().setDepth(11)
      pulse.lineStyle(2, 0xddbb44, 0.8)
      pulse.strokeCircle(x, y, 6)
      scene.tweens.add({ targets: pulse, scale: 3, alpha: 0, duration: 400, onComplete: () => pulse.destroy() })
    }
  }
}

function spawnBlightPool(p: Player, x: number, y: number, doubleRadius = false) {
  const st = getState(p)
  const scene = p.scene
  const now = scene.time.now

  // Pool cap: remove oldest if at max
  const maxPools = (p as any).necroticBloomMaxPools ?? 4
  if (st.blightPools.length >= maxPools) {
    const oldest = st.blightPools.shift()
    if (oldest) {
      scene.tweens.killTweensOf(oldest.gfx)
      oldest.gfx.destroy()
    }
  }

  const baseRadius = (p as any).necroticBloomRadius ?? 100
  const radius = doubleRadius ? baseRadius * 2 : baseRadius
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
  const enemyArr = enemies ? (enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) : []

  const bFx = scene.add.graphics().setDepth(10)
  bFx.fillStyle(0xddcc88, 0.7)
  bFx.fillCircle(thrall.x, thrall.y, 8)
  scene.tweens.add({ targets: bFx, scale: burstRadius / 8, alpha: 0, duration: 300, onComplete: () => bFx.destroy() })

  if (enemies) {
    for (const e of enemyArr) {
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
  const enemyArr = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]

  if (now < st.charnelTideCooldownUntil) return

  const radius = (p as any).charnelTideRadius ?? 250
  const maxRise = (p as any).charnelTideMax ?? 5
  const duration = (p as any).charnelTideDuration ?? 8000
  const cooldown = (p as any).charnelTideCooldown ?? 20000
  const explodeOnTimeout = (p as any).charnelTideExplode ?? false

  st.charnelTideCooldownUntil = now + cooldown

  // L2+: drain range boost for 4s after cast
  if ((p as any).charnelTideDrainRangeBoost > 0) {
    st.charnelRangeBoostUntil = now + 4000
  }

  // Rise corpses near player
  let count = 0
  for (const e of enemyArr) {
    if (!e.active || count >= maxRise) break
    if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < radius) {
      spawnBoneThrall(p, e.x + Phaser.Math.Between(-20, 20), e.y + Phaser.Math.Between(-20, 20))
      // L1 orbs: each Thrall raised also drops 1 bone
      if ((p as any).charnelTideOrbsBoneDrop && p.soulStacks < p.soulSiphonMaxStacks) {
        spawnSoulOrb(p, e.x + Phaser.Math.Between(-12, 12), e.y + Phaser.Math.Between(-12, 12))
      }
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
      const boneDropCount = (p as any).charnelTideExplodeBoneDrop ?? 0
      const applyRot = (p as any).charnelTideExplodeRot ?? false
      for (const t of st.boneThralls) {
        if (t.isRevenant) continue
        spawnThrallDeathBurst(p, t, enemies)
        // Drop extra bones per explosion
        for (let i = 0; i < boneDropCount; i++) {
          if (p.soulStacks < p.soulSiphonMaxStacks) {
            spawnSoulOrb(p, t.x + Phaser.Math.Between(-16, 16), t.y + Phaser.Math.Between(-16, 16))
          }
        }
        // Apply 1 rot stack to all enemies in burst radius
        if (applyRot) {
          const burstR = 60 + ((p as any).gravePactBurstRadiusBonus ?? 0)
          for (const e of enemyArr) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(t.x, t.y, e.x, e.y) < burstR) {
              const be = e as unknown as BaseEnemy
              be.rotStacks = (be.rotStacks ?? 0) + 1
              be.rotExpiry = Math.max(be.rotExpiry ?? 0, scene.time.now + 12000)
            }
          }
        }
      }
    })
  }
}

// ─── Pandemic activation ──────────────────────────────────────────────────────
export function activatePandemic(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const scene = p.scene
  const st = getState(p)
  const now = scene.time.now
  const enemyArr = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]

  if (now < st.pandemicCooldownUntil) return

  const radius = (p as any).pandemicRadius ?? 200
  const stacks = (p as any).pandemicStacks ?? 5
  const cooldown = (p as any).pandemicCooldown ?? 18000
  const doublePulse = (p as any).pandemicDoublePulse ?? false

  st.pandemicCooldownUntil = now + cooldown

  const applyMiasma = () => {
    for (const e of enemyArr) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < radius) {
        const be = e as unknown as BaseEnemy
        be.rotStacks = (be.rotStacks ?? 0) + stacks
        be.rotExpiry = Math.max(be.rotExpiry ?? 0, now + 15000)
        // Pandemic L1 orbs: mark enemy to drop bone on next death
        if ((p as any).pandemicOrbsBoneOnNextDeath) {
          ;(be as any)._vaelPandemicBoneMark = true
        }
      }
    }
  }
  applyMiasma()

  // Pandemic L1+: drain range boost window (tendril range to 200px for 3s, L2+ 6s)
  const boostDur = (p as any).pandemicRangeBoostDuration ?? 3000
  st.pandemicZone = { x: p.x, y: p.y, radius, expireAt: now + boostDur }

  // VFX ring
  const ring = scene.add.graphics().setDepth(11)
  ring.lineStyle(3, 0x88cc55, 0.8)
  ring.strokeCircle(p.x, p.y, 10)
  scene.tweens.add({ targets: ring, scaleX: radius / 10, scaleY: radius / 10, alpha: 0, duration: 800, onComplete: () => ring.destroy() })

  if (doublePulse) {
    scene.time.delayedCall(2000, () => {
      const stacks2 = 3
      for (const e of enemyArr) {
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

// ─── Scene-shutdown cleanup ───────────────────────────────────────────────────
export function cleanupVaelState(p: Player) {
  const pp = p as any
  if (!pp._vaelState) return
  const st = pp._vaelState as VaelState
  const scene = p.scene

  for (const t of st.boneThralls) {
    t.gfx?.destroy()
    t.sprite?.destroy()
  }
  st.boneThralls = []

  for (const orb of st.soulOrbs) {
    orb.gfx?.destroy()
  }
  st.soulOrbs = []

  // Blight pools have repeat:-1 tweens — kill them first (Nazar-style leak fix)
  for (const pool of st.blightPools) {
    if (pool.gfx?.active) {
      scene.tweens.killTweensOf(pool.gfx)
      pool.gfx.destroy()
    }
  }
  st.blightPools = []

  for (const spike of st.boneSpikes) {
    spike.gfx?.destroy()
  }
  st.boneSpikes = []

  st.revenant = null

  if (st.carrionAuraGfx) {
    st.carrionAuraGfx.destroy()
    st.carrionAuraGfx = null
  }

  if (pp._drainGfx) {
    ;(pp._drainGfx as Phaser.GameObjects.Graphics).destroy()
    pp._drainGfx = undefined
  }

  pp._vaelState = undefined
}
