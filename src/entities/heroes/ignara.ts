import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'
import { spawnTrailCircle } from '../../utils/trailPool'

function triggerFireboltExplosion(p: Player, cx: number, cy: number, angle: number, explodeRadius: number, effectiveDmg: number, enemies: Phaser.Physics.Arcade.Group) {
  const ANIM_DUR = 420

  const isPyre = p.hasSlugRound
  const isPowderKeg = !isPyre && explodeRadius >= 60 && p.hasPowderKeg
  if (isPyre || isPowderKeg) {
    // Pyre / Powder Keg only: big air_burst explosion
    const bigScale = Math.max(1.2, explodeRadius / 30) * 1.3
    const outer = p.scene.add.sprite(cx, cy, 'vfx_air_burst')
      .setDepth(9).setScale(bigScale).setTint(0xff4400).setAlpha(0.9)
      .setRotation(angle + (Math.random() - 0.5) * 0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
    outer.play('air_burst')
    outer.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { if (outer.active) outer.destroy() })
    p.scene.time.delayedCall(ANIM_DUR, () => { if (outer.active) outer.destroy() })
    // Mid glow layer
    const mid = p.scene.add.sprite(cx, cy, 'vfx_air_burst')
      .setDepth(10).setScale(bigScale * 0.6).setTint(0xff8800).setAlpha(0.85)
      .setRotation(angle + (Math.random() - 0.5) * 0.3)
      .setBlendMode(Phaser.BlendModes.ADD)
    mid.play('air_burst')
    mid.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { if (mid.active) mid.destroy() })
    p.scene.time.delayedCall(ANIM_DUR, () => { if (mid.active) mid.destroy() })
    // Core flash
    const core = p.scene.add.sprite(cx, cy, 'vfx_air_burst')
      .setDepth(11).setScale(bigScale * 0.25).setTint(0xffffcc)
      .setRotation(angle).setBlendMode(Phaser.BlendModes.ADD)
    core.play('air_burst')
    p.scene.tweens.add({ targets: core, alpha: 0, scale: bigScale * 0.08, duration: 250, ease: 'Quad.easeOut', onComplete: () => { if (core.active) core.destroy() } })
    p.scene.time.delayedCall(ANIM_DUR, () => { if (core.active) core.destroy() })
  } else {
    // Wildfire: firebolt explode only
    const hit = p.scene.add.sprite(cx, cy, 'vfx_firebolt')
      .setDepth(12).setRotation(angle).setBlendMode(Phaser.BlendModes.ADD)
    hit.play('firebolt_explode')
    hit.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { if (hit.active) hit.destroy() })
    p.scene.time.delayedCall(ANIM_DUR, () => { if (hit.active) hit.destroy() })
  }

  if (p.isLocalPlayer) p.scene.cameras.main.shake(50, 0.003)
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= explodeRadius) {
      let dmg = effectiveDmg
      if (p.burnStackedDmgBonus && (e as BaseEnemy).burnStacks >= p.burnMaxStacks) dmg *= 1.2
      ;(e as BaseEnemy).takeDamage(dmg, 'fire')
      applyBurnStack(p, e as BaseEnemy)
      ;(e as BaseEnemy).applyKnockback(cx, cy, 120)
    }
  }
}

function spawnKegShrapnel(p: Player, cx: number, cy: number, angle: number, dmg: number, enemies: Phaser.Physics.Arcade.Group) {
  if (!p.powderKegShrapnel) return
  for (let si = 0; si < 2; si++) {
    const sa = angle + (si === 0 ? -0.6 : 0.6)
    const shard = p.scene.add.circle(cx, cy, 4, 0xff6600, 0.9).setDepth(9)
    const sdx = cx + Math.cos(sa) * 90
    const sdy = cy + Math.sin(sa) * 90
    const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()
    p.scene.tweens.add({
      targets: shard, x: sdx, y: sdy, alpha: 0, duration: 300,
      onUpdate: () => {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || hitSet.has(e)) continue
          if (Phaser.Math.Distance.Between(shard.x, shard.y, e.x, e.y) <= 16) {
            (e as BaseEnemy).takeDamage(dmg * 0.4, 'fire')
            hitSet.add(e)
          }
        }
      },
      onComplete: () => shard.destroy(),
    })
  }
}

/** Molten Volley — burst of small slugs in a cone toward target */
function fireMoltenVolley(p: Player, angle: number, enemies: Phaser.Physics.Arcade.Group) {
  if (!p.hasMoltenVolley) return
  const count = p.moltenVolleyCount
  const spread = 0.5  // total cone width in radians
  const slugDmg = p.damage * 0.4 * p.getMasteryDamageMult('fireball')
  const slugRange = 100

  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread
    const sa = angle + offset
    const sx = p.x, sy = p.y
    const ex = sx + Math.cos(sa) * slugRange
    const ey = sy + Math.sin(sa) * slugRange

    const slug = p.scene.add.circle(sx, sy, 3, 0xff8800, 0.9).setDepth(9)
    const glow = p.scene.add.circle(sx, sy, 6, 0xff4400, 0.3).setDepth(8)
      .setBlendMode(Phaser.BlendModes.ADD)
    const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()

    p.scene.tweens.add({
      targets: [slug, glow], x: ex, y: ey, duration: 180,
      onUpdate: () => {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || hitSet.has(e)) continue
          if (Phaser.Math.Distance.Between(slug.x, slug.y, e.x, e.y) > 16) continue
          hitSet.add(e)
          const be = e as BaseEnemy
          be.takeDamage(slugDmg, 'fire')
          applyBurnStack(p, be)
          // Scorch: -20% armor for 4s
          if (p.moltenVolleyScorch && hitSet.size >= 3) {
            ;(be as any)._scorchUntil = p.scene.time.now + 4000
          }
        }
      },
      onComplete: () => {
        slug.destroy(); glow.destroy()
        // Burn patch at endpoint
        const patch = p.scene.add.circle(ex, ey, 6, 0xff4400, 0.4).setDepth(3)
        const patchDur = p.moltenVolleyCount >= 4 ? 2000 : 1000
        let patchTicks = 0
        const patchTimer = p.scene.time.addEvent({
          delay: 500, repeat: Math.floor(patchDur / 500),
          callback: () => {
            patchTicks++
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active) continue
              if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) <= 12) {
                (e as BaseEnemy).takeDamage(slugDmg * 0.3, 'fire')
              }
            }
            if (patchTicks >= Math.floor(patchDur / 500)) { patch.destroy(); patchTimer.destroy() }
          },
        })
        p.scene.tweens.add({ targets: patch, alpha: 0, duration: patchDur })
      },
    })
  }
}

/**
 * Ignara — Fireball projectile with AOE explosion.
 * Fires a fireball toward the target that explodes on arrival, dealing area damage.
 * Supports upgrades: Meltdown (+50% dmg below 40% HP), Scorched Earth (burn DOT),
 * Wildfire (kill triggers mini-explosion), Firestorm (2 extra mini-fireballs),
 * Backdraft (strong knockback).
 */
export function attackFireball(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  // Overkill prevention: mark target as having an in-flight fireball
  const tgt = target as any
  tgt._fireballIncoming = (tgt._fireballIncoming ?? 0) + 1
  const tx = target.x, ty = target.y
  let explodeRadius = 40 + p.splashRadius * 0.8
  const isHavoc = p.chosenBranch === 'Pyre' || p.chosenBranch === 'Havoc'
  if (p.hasSlugRound) explodeRadius = Math.max(explodeRadius, p.slugPierce > 0 ? 80 : 60)
  // Powder Keg: next shot is instant big explosion from hero
  let isPowderKegShot = false
  if (p.powderKegReady) {
    p.powderKegReady = false
    isPowderKegShot = true
    // Override to large explode radius
    explodeRadius = p.powderKegShrapnel ? 90 : (p.powderKegThreshold <= 8 ? 75 : 60)
  }

  let effectiveDmg = p.damage * p.getMasteryDamageMult('fireball')
  if (p.hasMeltdown && p.hp < p.maxHp * 0.4) effectiveDmg = Math.ceil(effectiveDmg * 1.5)

  const fireAngle = Phaser.Math.Angle.Between(p.x, p.y, tx, ty)

  // Molten Volley: fire slug cone alongside main attack
  fireMoltenVolley(p, fireAngle, enemies)

  // ── INFERNO / HAVOC / FORTRESS / default: projectile fireball ──
  const dist = Phaser.Math.Distance.Between(p.x, p.y, tx, ty)
  const dmgRatio = Math.min(p.damage / 30, 4)
  const ballSize = 6 + dmgRatio * 2
  const ballTint = dmgRatio > 2.5 ? 0xffffaa : dmgRatio > 1.5 ? 0xff8800 : 0xff4400
  const flyDuration = Math.max(120, (dist / 500) * 1000)
  const isFortress = p.chosenBranch === 'Wildfire' || p.chosenBranch === 'Rapid Fire'

  // Powder Keg flag — passed into onComplete to trigger big explosion at impact
  const kegExplodeRadius = isPowderKegShot ? explodeRadius : 0

  const useFirebolt = isFortress

  let proj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc
  let glowCircle: Phaser.GameObjects.Arc | null = null
  if (useFirebolt) {
    proj = p.scene.add.sprite(p.x, p.y, 'vfx_firebolt')
      .setDepth(9).setRotation(fireAngle).setBlendMode(Phaser.BlendModes.ADD)
    ;(proj as Phaser.GameObjects.Sprite).play('firebolt_fly')
  } else {
    proj = p.scene.add.circle(p.x, p.y, ballSize, ballTint).setDepth(9)
    glowCircle = p.scene.add.circle(p.x, p.y, ballSize * 1.5, ballTint, 0.3).setDepth(8)
      .setBlendMode(Phaser.BlendModes.ADD)
  }

  const trailTargets = glowCircle ? [proj, glowCircle] : [proj]
  let exploded = false

  const trailTimer = p.scene.time.addEvent({
    delay: 80, loop: true,
    callback: () => {
      const tp = spawnTrailCircle(p.scene,
        proj.x + Phaser.Math.Between(-4, 4),
        proj.y + Phaser.Math.Between(-4, 4),
        Phaser.Math.Between(2, 4), 0xff6600, 0.6)
      p.scene.tweens.add({ targets: tp, alpha: 0, scale: 0, duration: 200,
        onComplete: () => { tp.setActive(false).setVisible(false) } })

      // Wildfire: explode on first enemy contact — only scan when needed
      if (!isFortress || exploded) return
      const children = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
      for (let ci = 0; ci < children.length; ci++) {
        const e = children[ci]
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(proj.x, proj.y, e.x, e.y) > 32) continue
        exploded = true
        trailTimer.destroy()
        tgt._fireballIncoming = Math.max(0, (tgt._fireballIncoming ?? 1) - 1)
        const r = kegExplodeRadius || explodeRadius
        triggerFireboltExplosion(p, proj.x, proj.y, fireAngle, r, effectiveDmg, enemies)
        if (isPowderKegShot) spawnKegShrapnel(p, proj.x, proj.y, fireAngle, effectiveDmg, enemies)
        p.scene.tweens.killTweensOf(trailTargets)
        proj.destroy(); if (glowCircle) glowCircle.destroy()
        p.isAttacking = false
        break
      }
    },
  })

  p.scene.tweens.add({
    targets: trailTargets, x: tx, y: ty, duration: flyDuration,
    onComplete: () => {
      trailTimer.destroy(); proj.destroy(); if (glowCircle) glowCircle.destroy()
      tgt._fireballIncoming = Math.max(0, (tgt._fireballIncoming ?? 1) - 1)

      // Wildfire without Powder Keg: firebolt_explode on contact, otherwise disappear
      if (isFortress && !isPowderKegShot) {
        p.isAttacking = false
        return
      }
      // Powder Keg on arrival (no contact mid-flight): explode at target
      if (isPowderKegShot && !exploded) {
        const r = kegExplodeRadius || explodeRadius
        triggerFireboltExplosion(p, tx, ty, fireAngle, r, effectiveDmg, enemies)
        spawnKegShrapnel(p, tx, ty, fireAngle, effectiveDmg, enemies)
        p.isAttacking = false
        return
      }
      // Pyre: camera shake on slug impact
      if (isHavoc && p.hasSlugRound && p.isLocalPlayer) {
        p.scene.cameras.main.shake(60, 0.004)
      }

      // EXPLOSION — 2-layer gradient (outer shape + core flash)
      const splashScale = Math.max(0.8, explodeRadius / 24)
      const isInferno = p.chosenBranch === 'Inferno'
      const baseAngle = Phaser.Math.Angle.Between(p.x, p.y, tx, ty)
      const vfxKey = isInferno ? 'vfx_air_explosion' : 'vfx_air_burst'
      const animKey = isInferno ? 'air_explosion' : 'air_burst'
      const baseScale = isInferno ? Math.max(1, explodeRadius / 16) : splashScale
      const animDurMs = isInferno ? 550 : 450  // safety destroy after this

      const safeDestroy = (spr: Phaser.GameObjects.Sprite, ms: number) => {
        p.scene.time.delayedCall(ms, () => { if (spr.active) spr.destroy() })
      }

      const outer = p.scene.add.sprite(tx, ty, vfxKey)
        .setDepth(9).setScale(baseScale * 1.4).setTint(0xff4400).setAlpha(0.85)
        .setBlendMode(Phaser.BlendModes.ADD)
      if (!isInferno) outer.setRotation(baseAngle + (Math.random() - 0.5) * 0.6)
      outer.play(animKey)
      outer.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { if (outer.active) outer.destroy() })
      safeDestroy(outer, animDurMs)

      // Bright core — tween-out instead of waiting for anim complete
      const core = p.scene.add.sprite(tx, ty, vfxKey)
        .setDepth(10).setScale(baseScale * 0.5).setTint(0xffffcc).setAlpha(1.0)
        .setBlendMode(Phaser.BlendModes.ADD)
      if (!isInferno) core.setRotation(baseAngle + (Math.random() - 0.5) * 0.3)
      core.play(animKey)
      p.scene.tweens.add({
        targets: core, alpha: 0, scale: baseScale * 0.15,
        duration: animDurMs * 0.6, ease: 'Quad.easeOut',
        onComplete: () => { if (core.active) core.destroy() },
      })
      safeDestroy(core, animDurMs)

      // Ember particles — pooled
      const emberCount = Math.min(6, 3 + Math.floor(dmgRatio))
      for (let i = 0; i < emberCount; i++) {
        const ea = Math.random() * Math.PI * 2
        const ed = Phaser.Math.Between(10, Math.floor(explodeRadius * 0.7))
        const tp = spawnTrailCircle(p.scene, tx, ty, Phaser.Math.Between(2, 4), 0xff8800, 0.75)
        p.scene.tweens.add({
          targets: tp,
          x: tx + Math.cos(ea) * ed, y: ty + Math.sin(ea) * ed,
          alpha: 0, scaleX: 0.1, scaleY: 0.1,
          duration: 280 + Math.random() * 160, ease: 'Quad.easeOut',
          onComplete: () => { tp.setActive(false).setVisible(false) },
        })
      }

      // Camera shake
      if (p.isLocalPlayer) p.scene.cameras.main.shake(50, 0.003)

      // Damage all enemies in explosion radius — collect Wildfire secondaries for deferred processing
      const wildfireDeferred: { x: number; y: number }[] = []
      const wfDmg = p.damage * 0.4 * p.getMasteryDamageMult('fireball')
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= explodeRadius) {
          let hitDmg = effectiveDmg
          if (p.burnStackedDmgBonus && (e as BaseEnemy).burnStacks >= p.burnMaxStacks) hitDmg *= 1.2
          ;(e as BaseEnemy).takeDamage(hitDmg, 'fire')
          applyBurnStack(p, e as BaseEnemy)

          // Base fireball knockback (Backdraft upgrades to 300)
          const kbForce = p.hasBackdraft ? 300 : 120
          ;(e as BaseEnemy).applyKnockback(tx, ty, kbForce)

          // Wildfire: defer secondary explosion to after primary loop
          if (p.hasWildfire && (e as BaseEnemy).isDying) {
            wildfireDeferred.push({ x: e.x, y: e.y })
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

      // Wildfire: process deferred secondary explosions (avoids O(n²) inside primary loop)
      for (const wf of wildfireDeferred) {
        for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e2.active) continue
          if (Phaser.Math.Distance.Between(wf.x, wf.y, e2.x, e2.y) <= 50) {
            (e2 as BaseEnemy).takeDamage(wfDmg, 'fire')
          }
        }
        const miniBlast = p.scene.add.sprite(wf.x, wf.y, 'vfx_thunder_splash').setDepth(9).setScale(0.6).setTint(0xff5500).setBlendMode(Phaser.BlendModes.ADD)
        miniBlast.play('thunder_splash')
        miniBlast.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => miniBlast.destroy())
      }

      p.isAttacking = false
    },
  })
}

interface FirestormOrb {
  ball: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc
  glow: Phaser.GameObjects.Arc
  angleOffset: number
  strikeTimer: number
  striking: boolean
}

/** Create or re-create orbiting fireballs when firestormOrbCount changes. */
export function initFirestormOrbit(p: Player) {
  const existing: FirestormOrb[] | undefined = (p as any)._firestormOrbs
  if (existing && existing.length === p.firestormOrbCount) return
  if (existing) for (const o of existing) { o.ball.destroy(); o.glow.destroy() }

  const count = p.firestormOrbCount
  const orbs: FirestormOrb[] = []
  const scene = p.scene

  for (let i = 0; i < count; i++) {
    const angleOffset = (Math.PI * 2 / count) * i

    // Core fireball — uses firebolt sprite if available, else circle fallback
    let ball: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc
    if (scene.textures.exists('vfx_firebolt')) {
      const spr = scene.add.sprite(p.x, p.y, 'vfx_firebolt')
        .setDepth(9).setScale(0.7).setBlendMode(Phaser.BlendModes.ADD)
      if (scene.anims.exists('firebolt_fly')) spr.play('firebolt_fly')
      ball = spr
    } else {
      ball = scene.add.circle(p.x, p.y, 5, 0xff6600).setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
    }

    // Outer glow halo (larger, soft)
    const glow = scene.add.circle(p.x, p.y, 18, 0xff4400, 0.28)
      .setDepth(7).setBlendMode(Phaser.BlendModes.ADD)

    // Inner bright core
    const core = scene.add.circle(p.x, p.y, 5, 0xffdd44, 0.9)
      .setDepth(10).setBlendMode(Phaser.BlendModes.ADD)

    ;(ball as any)._orbGlow = glow
    ;(ball as any)._orbCore = core

    orbs.push({ ball, glow, angleOffset, strikeTimer: (1800 / count) * i, striking: false })
  }
  ;(p as any)._firestormOrbs = orbs
  ;(p as any)._firestormBaseAngle = 0
}

/** Per-frame: rotate orbs, spawn trailing embers, periodically strike nearest enemy. */
export function updateFirestormOrbit(p: Player, delta: number) {
  const orbs: FirestormOrb[] | undefined = (p as any)._firestormOrbs
  if (!orbs) return

  const ORBIT_R   = 58
  const ROT_SPEED = 0.0020   // rad/ms
  const STRIKE_CD = 1800
  const now = p.scene.time.now
  const scene = p.scene
  const enemies = (scene as any).enemies as Phaser.Physics.Arcade.Group | undefined

  ;(p as any)._firestormBaseAngle = ((p as any)._firestormBaseAngle ?? 0) + delta * ROT_SPEED
  const baseAngle: number = (p as any)._firestormBaseAngle

  // Ember trail throttle — drop particle every ~40ms
  ;(p as any)._emberTrailTimer = ((p as any)._emberTrailTimer ?? 0) + delta
  const dropEmber = (p as any)._emberTrailTimer >= 40
  if (dropEmber) (p as any)._emberTrailTimer = 0

  for (const orb of orbs) {
    if (!orb.striking) {
      const a = baseAngle + orb.angleOffset
      const ox = p.x + Math.cos(a) * ORBIT_R
      const oy = p.y + Math.sin(a) * ORBIT_R

      // Pulsing scale
      const pulse = 1 + 0.22 * Math.sin(now * 0.009 + orb.angleOffset)

      // Position main ball
      const ball = orb.ball as any
      ball.setPosition(ox, oy)
      if (ball.setScale) ball.setScale(0.7 * pulse)
      // Rotate sprite to face direction of travel (tangent)
      if (ball.setRotation) ball.setRotation(a + Math.PI / 2)

      // Glow halo — larger pulse, slightly offset inward
      const gx = p.x + Math.cos(a) * (ORBIT_R - 4)
      const gy = p.y + Math.sin(a) * (ORBIT_R - 4)
      ;(orb.glow as Phaser.GameObjects.Arc).setPosition(gx, gy)
        .setScale(2.2 + 0.6 * Math.sin(now * 0.007 + orb.angleOffset))
        .setAlpha(0.22 + 0.12 * Math.sin(now * 0.011 + orb.angleOffset))

      // Bright core
      const core = ball._orbCore as Phaser.GameObjects.Arc | undefined
      if (core) {
        core.setPosition(ox, oy)
          .setScale(0.7 + 0.35 * Math.sin(now * 0.013 + orb.angleOffset))
          .setAlpha(0.8 + 0.2 * Math.sin(now * 0.009 + orb.angleOffset))
      }

      // Ember trail — reuse pool circle, no allocation
      if (dropEmber) {
        const ex = ox + (Math.random() - 0.5) * 6
        const ey = oy + (Math.random() - 0.5) * 6
        const tp = spawnTrailCircle(scene, ex, ey, Phaser.Math.Between(1, 3), 0xff6600, 0.8)
        scene.tweens.add({
          targets: tp,
          x: ex + (Math.random() - 0.5) * 14,
          y: ey - Phaser.Math.Between(4, 10),
          scaleX: 0.1, scaleY: 0.1, alpha: 0,
          duration: Phaser.Math.Between(180, 320), ease: 'Quad.easeOut',
          onComplete: () => { tp.setActive(false).setVisible(false) },
        })
      }
    }

    orb.strikeTimer += delta
    if (orb.striking || orb.strikeTimer < STRIKE_CD || !enemies) continue
    orb.strikeTimer = 0

    let nearest: Phaser.Physics.Arcade.Sprite | null = null
    let nearestDist = Infinity
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
      if (d < p.range * 1.2 && d < nearestDist) { nearestDist = d; nearest = e }
    }
    if (!nearest) continue

    orb.striking = true
    const ex = nearest.x, ey = nearest.y
    const ball2 = orb.ball as any
    const core2 = ball2._orbCore as Phaser.GameObjects.Arc | undefined

    const strikeTargets: any[] = [orb.ball, orb.glow]
    if (core2) strikeTargets.push(core2)

    scene.tweens.add({
      targets: strikeTargets, x: ex, y: ey,
      duration: 130, ease: 'Quad.easeIn',
      onComplete: () => {
        if ((nearest as Phaser.Physics.Arcade.Sprite).active)
          (nearest as unknown as BaseEnemy).takeDamage(p.damage * 0.5 * p.getMasteryDamageMult('fireball'), 'fire')

        // 3-layer impact
        const boom = scene.add.sprite(ex, ey, 'vfx_firebolt')
          .setDepth(10).setScale(1.0).setBlendMode(Phaser.BlendModes.ADD)
        if (scene.anims.exists('firebolt_explode')) {
          boom.play('firebolt_explode')
          boom.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => boom.destroy())
        } else boom.destroy()

        const impactGlow = scene.add.circle(ex, ey, 8, 0xff6600, 0.7)
          .setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
        scene.tweens.add({ targets: impactGlow, displayWidth: 60, displayHeight: 60, alpha: 0, duration: 250, ease: 'Quad.easeOut', onComplete: () => impactGlow.destroy() })

        const impactFlash = scene.add.circle(ex, ey, 4, 0xffffff, 0.9)
          .setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
        scene.tweens.add({ targets: impactFlash, displayWidth: 24, displayHeight: 24, alpha: 0, duration: 140, ease: 'Quad.easeOut', onComplete: () => impactFlash.destroy() })

        scene.time.delayedCall(120, () => { orb.striking = false })
      },
    })
  }
}

/**
 * Ignara per-frame update: Lava Trail — drop fire pools while moving.
 * Every 300ms of movement, places a lava pool at the player's position that
 * damages nearby enemies for 6 ticks over ~2 seconds before fading away.
 */
const MAX_LAVA_POOLS = 6

export function updateLavaTrail(p: Player, delta: number) {
  // Lava Trail — drop fire pools while moving
  if (p.hasLavaTrail) {
    p.lavaTrailTimer += delta
    if (p.lavaTrailTimer >= 300) {
      p.lavaTrailTimer = 0

      // Cap concurrent pools to avoid unbounded timer accumulation
      const pools = (p as any)._lavaPools as Phaser.GameObjects.Arc[] | undefined
      if (pools && pools.length >= MAX_LAVA_POOLS) return

      const lx = p.x, ly = p.y
      const lava = p.scene.add.circle(lx, ly, 8, 0xff4400, 0.5).setDepth(3)
      if (!(p as any)._lavaPools) (p as any)._lavaPools = []
      ;(p as any)._lavaPools.push(lava)
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
          if (lavaTicks >= 6) {
            lava.destroy(); lavaTimer.destroy()
            const arr = (p as any)._lavaPools as Phaser.GameObjects.Arc[]
            if (arr) { const idx = arr.indexOf(lava); if (idx >= 0) arr.splice(idx, 1) }
          }
        },
      })
      p.scene.tweens.add({ targets: lava, alpha: 0, scale: 0.3, duration: 2100, delay: 0 })
    }
  }
}

/** Immolation aura — multi-layer VFX + tick damage every 500ms */
export function updateImmolation(p: Player, delta: number) {
  const scene = p.scene
  const now = scene.time.now

  // === Init persistent aura layers ===
  if (!(p as any)._immolationGfx) {
    ;(p as any)._immolationGfx = scene.add.graphics().setDepth(3)
    ;(p as any)._immolationTickTimer = 0
    ;(p as any)._immolationEmberTimer = 0
  }

  // === Draw aura rings every frame (procedural, no sprites) ===
  const g = (p as any)._immolationGfx as Phaser.GameObjects.Graphics
  g.clear()
  const r = p.immolationRadius
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.004)
  const pulse2 = 0.5 + 0.5 * Math.sin(now * 0.006 + 1.5)

  // Outer soft fill
  g.fillStyle(0xff2200, 0.10 + pulse * 0.06)
  g.fillCircle(p.x, p.y, r)

  // Mid ring
  g.lineStyle(2.5, 0xff4400, 0.35 + pulse * 0.15)
  g.strokeCircle(p.x, p.y, r * 0.85)

  // Inner bright ring
  g.lineStyle(2, 0xff8800, 0.4 + pulse2 * 0.2)
  g.strokeCircle(p.x, p.y, r * 0.6)

  // Core hot zone
  g.fillStyle(0xff6600, 0.08 + pulse2 * 0.05)
  g.fillCircle(p.x, p.y, r * 0.35)

  // === Ember particles along perimeter ===
  ;(p as any)._immolationEmberTimer += delta
  if ((p as any)._immolationEmberTimer >= 80) {
    ;(p as any)._immolationEmberTimer = 0
    const angle = Math.random() * Math.PI * 2
    const dist = r * (0.7 + Math.random() * 0.3)
    const ex = p.x + Math.cos(angle) * dist
    const ey = p.y + Math.sin(angle) * dist
    const colors = [0xff4400, 0xff6600, 0xff8800, 0xffaa00]
    const c = colors[Math.floor(Math.random() * colors.length)]
    const ember = spawnTrailCircle(scene, ex, ey, Phaser.Math.Between(1, 3), c, 0.7)
    scene.tweens.add({
      targets: ember,
      x: ex + (Math.random() - 0.5) * 10,
      y: ey - Phaser.Math.Between(6, 16),
      alpha: 0, scaleX: 0.1, scaleY: 0.1,
      duration: Phaser.Math.Between(250, 450), ease: 'Quad.easeOut',
      onComplete: () => { ember.setActive(false).setVisible(false) },
    })
  }

  // === Damage tick every 500ms ===
  ;(p as any)._immolationTickTimer += delta
  if ((p as any)._immolationTickTimer < 500) return
  ;(p as any)._immolationTickTimer = 0

  const scn = scene as any
  if (!scn.enemies) return
  const dmg = p.damage * p.immolationDmgPct * p.getMasteryDamageMult('fireball') * 0.5
  for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) > r) continue
    ;(e as BaseEnemy).takeDamage(dmg, 'fire')
    if (p.scorchedBastionLifesteal > 0) {
      p.hp = Math.min(p.maxHp, p.hp + dmg * p.scorchedBastionLifesteal)
    }
  }
}

/** Burn stacks — tick every 500ms, damage all burning enemies */
export function updateBurnTicks(p: Player, delta: number) {
  p.burnTickTimer += delta
  if (p.burnTickTimer < 500) return
  p.burnTickTimer = 0

  const scene = p.scene as any
  if (!scene.enemies) return
  const now = scene.time.now
  const baseTick = p.damage * 0.04 * p.getMasteryDamageMult('fireball')
  const cadenceActive = p.hasInfernalCadence && now < p.infernalCadenceEndTime

  for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    const be = e as BaseEnemy
    if (be.burnStacks <= 0) continue
    if (now > be.burnExpiry) { be.burnStacks = 0; be.clearTint(); continue }
    let tickDmg = baseTick * be.burnStacks
    if (cadenceActive) tickDmg *= 2
    be.takeDamage(tickDmg, 'fire')
    // Tint intensity by stacks
    const t = Math.min(1, be.burnStacks / p.burnMaxStacks)
    const r = 0xff, g = Math.floor(0x44 + (0xff - 0x44) * t), b = 0x00
    be.setTint(Phaser.Display.Color.GetColor(r, g, b))
  }
}

/** Apply burn stacks on hit (called from attackFireball damage loop) */
export function applyBurnStack(p: Player, e: BaseEnemy) {
  if (!p.hasSustainedBurn) return
  const now = (p.scene as any).time.now
  const cadenceActive = p.hasInfernalCadence && now < p.infernalCadenceEndTime
  const addStacks = cadenceActive ? 2 : 1
  e.burnStacks = Math.min(p.burnMaxStacks, e.burnStacks + addStacks)
  e.burnExpiry = now + 3000  // 3s refresh window
}
