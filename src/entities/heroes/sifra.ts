import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

export function attackIceShard(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const baseAngle = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y)
  const useShard = p.scene.textures.exists('vfx_iceshard')
  const hasFrost = p.scene.textures.exists('vfx_frost')

  // Dynamic: shard size from damage + splash, hit radius from splash, multi-shard from strikeCount
  const iceMasteryMult = p.getMasteryDamageMult('ice')
  const dmgRatio = Math.min(p.damage / 12, 4)
  const hitRadius = 24 + p.splashRadius * 0.5
  const shardScale = 1.5 + dmgRatio * 0.4 + p.splashRadius * 0.025
  const shatterCount = 3 + Math.floor(p.splashRadius / 15)
  const shardTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0xccf0ff : 0x88ddff
  const shardCount = p.strikeCount

  // Frost Nova: every 4th shot fires a ring burst
  if (p.hasFrostNova) {
    p.frostNovaCounter++
    if (p.frostNovaCounter >= 4) {
      p.frostNovaCounter = 0
      // Fire 8 shards in a ring
      for (let i = 0; i < 8; i++) {
        const novaAngle = (i / 8) * Math.PI * 2
        const novaShard = useShard
          ? p.scene.add.image(p.x, p.y, 'vfx_iceshard').setScale(shardScale * 0.7).setDepth(9)
              .setBlendMode(Phaser.BlendModes.ADD).setTint(0xaaeeff)
          : p.scene.add.rectangle(p.x, p.y, 10, 3, 0x88ddff).setDepth(9)
        novaShard.rotation = novaAngle - Math.PI / 2
        const novaEndX = p.x + Math.cos(novaAngle) * p.range * 0.7
        const novaEndY = p.y + Math.sin(novaAngle) * p.range * 0.7
        const novaHitSet = new Set<Phaser.Physics.Arcade.Sprite>()
        p.scene.tweens.add({
          targets: novaShard, x: novaEndX, y: novaEndY, duration: 250,
          onUpdate: () => {
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active || novaHitSet.has(e)) continue
              if (Phaser.Math.Distance.Between(novaShard.x, novaShard.y, e.x, e.y) <= hitRadius * 0.8) {
                (e as BaseEnemy).takeDamage(p.damage * 0.5 * iceMasteryMult, 'ice')
                if ((e as BaseEnemy).speed) (e as BaseEnemy).speed *= 0.6
                novaHitSet.add(e)
              }
            }
          },
          onComplete: () => novaShard.destroy(),
        })
      }
      // Ring flash VFX
      const ring = p.scene.add.circle(p.x, p.y, 10, 0x88ddff, 0.4).setDepth(8)
      p.scene.tweens.add({
        targets: ring, scale: p.range * 0.7 / 10, alpha: 0, duration: 400,
        onComplete: () => ring.destroy(),
      })
    }
  }

  // Fire multiple shards in a spread pattern
  for (let s = 0; s < shardCount; s++) {
    const angleOff = (s - (shardCount - 1) / 2) * 0.15
    const angle = baseAngle + angleOff

    const shard = useShard
      ? p.scene.add.image(p.x, p.y, 'vfx_iceshard').setScale(shardScale).setDepth(9)
          .setBlendMode(Phaser.BlendModes.ADD).setTint(shardTint)
      : p.scene.add.rectangle(p.x, p.y, 12, 4, 0x00d2d3).setDepth(9)
    shard.rotation = angle - Math.PI / 2
    const endX = p.x + Math.cos(angle) * p.range
    const endY = p.y + Math.sin(angle) * p.range
    const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()

    // Frost trail
    let trailTimer: Phaser.Time.TimerEvent | null = null
    if (hasFrost) {
      trailTimer = p.scene.time.addEvent({
        delay: 25, loop: true,
        callback: () => {
          const frost = p.scene.add.image(
            shard.x + Phaser.Math.Between(-4, 4),
            shard.y + Phaser.Math.Between(-4, 4),
            'vfx_frost'
          ).setScale(Phaser.Math.FloatBetween(1, 1.5 + dmgRatio * 0.3)).setDepth(8)
            .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7).setTint(shardTint)
          p.scene.tweens.add({
            targets: frost, alpha: 0, scale: 0.3, duration: 300,
            onComplete: () => frost.destroy(),
          })
        },
      })
    }

    p.scene.tweens.add({
      targets: shard, x: endX, y: endY,
      duration: 300,
      onUpdate: () => {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || hitSet.has(e)) continue
          if (Phaser.Math.Distance.Between(shard.x, shard.y, e.x, e.y) <= hitRadius) {
            // Permafrost: bonus dmg to slowed enemies
            const isSlowed = (e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed && (e as BaseEnemy).speed < (e as BaseEnemy).baseSpeed * 0.9
            const permaDmg = ((p.hasPermafrost && isSlowed) ? p.damage * 1.4 : p.damage) * iceMasteryMult;
            (e as BaseEnemy).takeDamage(permaDmg, 'ice')
            // Deep Freeze: stronger slow (0.3x vs 0.7x)
            const slowMult = p.hasDeepFreeze ? 0.3 : 0.7
            if ((e as BaseEnemy).speed) (e as BaseEnemy).speed *= slowMult
            // Absolute Zero: freeze stun if very slow
            if (p.hasAbsoluteZero && (e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
              if ((e as BaseEnemy).speed < (e as BaseEnemy).baseSpeed * 0.35 && !(e as any)._frozenUntil) {
                (e as any)._frozenUntil = p.scene.time.now + 2000;
                (e as BaseEnemy).speed = 0
                e.setTintFill(0x88ccff)
                p.scene.time.delayedCall(2000, () => {
                  if (e.active) {
                    e.clearTint()
                    ;(e as any)._frozenUntil = 0
                    ;(e as BaseEnemy).speed = (e as BaseEnemy).baseSpeed * 0.5
                  }
                })
              }
            }
            hitSet.add(e)
            // Cosmetic ice burst particles
            for (let i = 0; i < shatterCount; i++) {
              const sa = Math.random() * Math.PI * 2
              const sd = Phaser.Math.Between(8, 15 + Math.floor(p.splashRadius * 0.3))
              const sp = p.scene.add.image(e.x, e.y, hasFrost ? 'vfx_frost' : 'vfx_spark')
                .setScale(Phaser.Math.FloatBetween(1, 2 + dmgRatio * 0.3)).setDepth(10).setAlpha(0.8)
                .setBlendMode(Phaser.BlendModes.ADD).setTint(shardTint)
              p.scene.tweens.add({
                targets: sp,
                x: e.x + Math.cos(sa) * sd, y: e.y + Math.sin(sa) * sd,
                alpha: 0, scale: 0.2, duration: 250,
                onComplete: () => sp.destroy(),
              })
            }
            // Shatter mechanic — split into mini-shards that seek nearby mobs
            if (p.shatterPieces > 0) {
              spawnShatterShards(p, e, enemies, hitSet, useShard, hasFrost, shardTint, dmgRatio)
            }
            // Pierce limit reached — destroy shard early
            if (hitSet.size >= p.pierceCount) {
              if (trailTimer) { trailTimer.destroy(); trailTimer = null }
              shard.destroy()
              if (s === shardCount - 1) p.isAttacking = false
              return
            }
          }
        }
      },
      onComplete: () => {
        if (trailTimer) trailTimer.destroy()
        if (shard.scene) shard.destroy()  // guard: may already be destroyed by pierce limit
        if (s === shardCount - 1) p.isAttacking = false
      },
    })
  }
}

/** Shatter: on-hit ice shard splits into mini-shards that fly to nearby mobs */
export function spawnShatterShards(
  p: Player,
  hitEnemy: Phaser.Physics.Arcade.Sprite,
  enemies: Phaser.Physics.Arcade.Group,
  parentHitSet: Set<Phaser.Physics.Arcade.Sprite>,
  useShard: boolean, hasFrost: boolean,
  tint: number, dmgRatio: number,
) {
  // Find nearby targets (not already hit by parent shard)
  const nearby: Phaser.Physics.Arcade.Sprite[] = []
  const seekRange = 80 + p.splashRadius * 0.5
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active || e === hitEnemy || parentHitSet.has(e)) continue
    if (Phaser.Math.Distance.Between(hitEnemy.x, hitEnemy.y, e.x, e.y) <= seekRange) {
      nearby.push(e)
    }
  }
  // Shuffle and take up to shatterPieces targets
  nearby.sort(() => Math.random() - 0.5)
  const targets = nearby.slice(0, p.shatterPieces)
  const shatterDmg = Math.ceil(p.damage * 0.5 * p.getMasteryDamageMult('ice'))
  const miniScale = 0.8 + dmgRatio * 0.2

  for (const t of targets) {
    const mini = useShard
      ? p.scene.add.image(hitEnemy.x, hitEnemy.y, 'vfx_iceshard')
          .setScale(miniScale).setDepth(9).setAlpha(0.85)
          .setBlendMode(Phaser.BlendModes.ADD).setTint(tint)
      : p.scene.add.rectangle(hitEnemy.x, hitEnemy.y, 8, 3, 0x88ddff).setDepth(9)
    const ang = Phaser.Math.Angle.Between(hitEnemy.x, hitEnemy.y, t.x, t.y)
    mini.rotation = ang - Math.PI / 2

    p.scene.tweens.add({
      targets: mini,
      x: t.x, y: t.y,
      duration: 180,
      onComplete: () => {
        mini.destroy()
        if (t.active) {
          (t as BaseEnemy).takeDamage(shatterDmg, 'ice')
          if ((t as BaseEnemy).speed) (t as BaseEnemy).speed *= 0.8
          parentHitSet.add(t)
          // Small burst on impact
          for (let i = 0; i < 3; i++) {
            const sa = Math.random() * Math.PI * 2
            const sp = p.scene.add.image(t.x, t.y, hasFrost ? 'vfx_frost' : 'vfx_spark')
              .setScale(Phaser.Math.FloatBetween(0.5, 1.2)).setDepth(10).setAlpha(0.7)
              .setBlendMode(Phaser.BlendModes.ADD).setTint(tint)
            p.scene.tweens.add({
              targets: sp,
              x: t.x + Math.cos(sa) * 10, y: t.y + Math.sin(sa) * 10,
              alpha: 0, scale: 0.1, duration: 200,
              onComplete: () => sp.destroy(),
            })
          }
        }
      },
    })
  }
}

export function attackLightning(p: Player, enemies: Phaser.Physics.Arcade.Group, delta: number) {
  const baseRange = 100
  const rangeRatio = p.range / 160 // Sifra base range
  const lightRange = baseRange * rangeRatio
  const dmgRatio = Math.min(p.damage / 12, 5)
  const spread = 0.6 + p.splashRadius * 0.005
  const useSheet = p.scene.textures.exists('vfx_lightning_sheet')
  const useTex = useSheet || p.scene.textures.exists('vfx_lightning')

  // Purple shift based on lightning mastery (0=blue, 3=deep purple)
  const mLvl = p.getMasteryLevel('lightning')
  const boltColors  = [0xaaccff, 0xaa99ff, 0xbb77ff, 0xcc55ff]
  const sparkColors = [0xccddff, 0xccbbff, 0xddaaff, 0xee99ff]
  const glowColors  = [0xaaccff, 0xbb99ff, 0xcc88ff, 0xdd77ff]
  const tintColors  = [0x88aaff, 0x9988ff, 0xaa77ff, 0xbb66ff]
  const boltColor = boltColors[mLvl] ?? boltColors[3]
  const sparkColor = sparkColors[mLvl] ?? sparkColors[3]
  const glowColor = glowColors[mLvl] ?? glowColors[3]
  const forkColor = tintColors[mLvl] ?? tintColors[3]

  // Lazy init
  if (!p.lightningGfx) {
    p.lightningGfx = p.scene.add.graphics().setDepth(9)
  }
  if (!p.lightningSprite && useTex) {
    if (useSheet) {
      // Animated bolt sprite
      p.lightningSprite = p.scene.add.sprite(p.x, p.y, 'vfx_lightning_sheet', 0) as any
      p.lightningSprite!.setOrigin(0, 0.5).setDepth(9)
        .setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
      if (p.scene.anims.exists('lightning_bolt_loop')) {
        (p.lightningSprite as any).play('lightning_bolt_loop')
      }
    } else {
      p.lightningSprite = p.scene.add.image(p.x, p.y, 'vfx_lightning')
        .setOrigin(0, 0.5).setDepth(9)
        .setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
    }
  }

  // Find nearest enemy
  let closest: Phaser.Physics.Arcade.Sprite | null = null
  let closestDist = Infinity
  for (const enemy of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!enemy.active) continue
    const dist = Phaser.Math.Distance.Between(p.x, p.y, enemy.x, enemy.y)
    if (dist < lightRange && dist < closestDist) {
      closestDist = dist
      closest = enemy
    }
  }

  p.lightningGfx.clear()

  if (!closest) {
    if (p.lightningSprite) p.lightningSprite.setVisible(false)
    return
  }

  // Aim — smooth rotation tracking
  const targetAngle = Phaser.Math.Angle.Between(p.x, p.y, closest.x, closest.y)
  p.lightningAngle = Phaser.Math.Angle.RotateTo(p.lightningAngle, targetAngle, 0.2)
  p.setFlipX(Math.cos(p.lightningAngle) < 0)

  // Animated lightning bolt sprite
  if (p.lightningSprite) {
    const sprScale = lightRange / 64 // sheet frame is 64px wide
    p.lightningSprite.setPosition(p.x, p.y)
      .setRotation(p.lightningAngle)
      .setScale(sprScale, sprScale * (1 + p.splashRadius * 0.008))
      .setVisible(true)
      .setAlpha(0.7 + Math.random() * 0.3) // flicker
    const tint = dmgRatio > 3 ? 0xffffff : dmgRatio > 1.5 ? sparkColor : forkColor
    p.lightningSprite.setTint(tint)
  }

  // Impact crackle at the tip — where bolt hits
  const tipX = p.x + Math.cos(p.lightningAngle) * Math.min(closestDist, lightRange)
  const tipY = p.y + Math.sin(p.lightningAngle) * Math.min(closestDist, lightRange)
  const g2 = p.lightningGfx
  // Small radiating sparks at impact point
  for (let i = 0; i < 3; i++) {
    const sa = p.lightningAngle + (Math.random() - 0.5) * 2.5
    const sl = Phaser.Math.FloatBetween(4, 12)
    g2.lineStyle(1, sparkColor, 0.4 + Math.random() * 0.4)
    g2.beginPath()
    g2.moveTo(tipX, tipY)
    g2.lineTo(tipX + Math.cos(sa) * sl, tipY + Math.sin(sa) * sl)
    g2.strokePath()
  }
  // Fading glow dot at tip
  g2.fillStyle(glowColor, 0.25 + Math.random() * 0.2)
  g2.fillCircle(tipX, tipY, 4 + Math.random() * 3)

  // Secondary jagged arcs in the cone (Graphics layer — extra bolts for beefier feel)
  const g = p.lightningGfx
  const boltCount = 1 + Math.floor(dmgRatio * 0.4)
  for (let b = 0; b < boltCount; b++) {
    const boltAngle = p.lightningAngle + (Math.random() - 0.5) * spread * 1.5
    const alpha = 0.3 + Math.random() * 0.35
    g.lineStyle(Phaser.Math.Between(1, 2), boltColor, alpha)
    let bx = p.x, by = p.y
    const segments = Phaser.Math.Between(4, 6)
    const segLen = lightRange / segments
    g.beginPath()
    g.moveTo(bx, by)
    for (let s = 0; s < segments; s++) {
      const jitter = (Math.random() - 0.5) * 14
      bx += Math.cos(boltAngle) * segLen + jitter * Math.sin(boltAngle)
      by += Math.sin(boltAngle) * segLen - jitter * Math.cos(boltAngle)
      g.lineTo(bx, by)
    }
    g.strokePath()

    // Branch bolts — small forks off main bolt
    if (Math.random() < 0.4) {
      const forkSeg = Phaser.Math.Between(1, segments - 1)
      const forkX = p.x + Math.cos(boltAngle) * segLen * forkSeg
      const forkY = p.y + Math.sin(boltAngle) * segLen * forkSeg
      const forkAngle = boltAngle + (Math.random() - 0.5) * 1.2
      g.lineStyle(1, forkColor, alpha * 0.6)
      g.beginPath()
      g.moveTo(forkX, forkY)
      let fx = forkX, fy = forkY
      for (let fs = 0; fs < 3; fs++) {
        fx += Math.cos(forkAngle) * segLen * 0.5 + (Math.random() - 0.5) * 8
        fy += Math.sin(forkAngle) * segLen * 0.5 + (Math.random() - 0.5) * 8
        g.lineTo(fx, fy)
      }
      g.strokePath()
    }
  }

  // Electric spark particles — brighter, more frequent
  p.lightningSparkTimer += delta
  if (p.lightningSparkTimer > 45) {
    p.lightningSparkTimer = 0
    // Sparks along the bolt path
    for (let i = 0; i < 2; i++) {
      const sparkAngle = p.lightningAngle + (Math.random() - 0.5) * spread
      const sparkDist = Phaser.Math.FloatBetween(15, lightRange * 0.9)
      const sx = p.x + Math.cos(sparkAngle) * sparkDist
      const sy = p.y + Math.sin(sparkAngle) * sparkDist
      const sparkTex = p.scene.textures.exists('vfx_spark_elec') ? 'vfx_spark_elec' : 'vfx_spark'
      const spark = p.scene.add.image(sx, sy, sparkTex)
        .setScale(Phaser.Math.FloatBetween(1.2, 3)).setDepth(10)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9)
        .setRotation(Math.random() * Math.PI)
      p.scene.tweens.add({
        targets: spark, alpha: 0, scale: 0.2, duration: 150 + Math.random() * 100,
        onComplete: () => spark.destroy(),
      })
    }
  }

  // Damage enemies inside the wide cone
  const coneSpread = p.hasArcReach ? spread * 1.5 : spread
  const dmgThisFrame = p.damage * (delta / 1000) * p.getMasteryDamageMult('lightning')
  const overcharging = p.hasOvercharge && Math.random() < 0.08 // ~8% per frame = frequent bursts
  const chainTargets: Phaser.Physics.Arcade.Sprite[] = []

  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    const dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
    if (dist > lightRange) continue
    const angleToEnemy = Phaser.Math.Angle.Between(p.x, p.y, e.x, e.y)
    const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - p.lightningAngle)
    if (Math.abs(angleDiff) <= coneSpread) {
      const dmg = overcharging ? dmgThisFrame * 3 : dmgThisFrame;
      (e as BaseEnemy).takeDamage(dmg, 'lightning')
      // Slow enemies
      if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
        (e as BaseEnemy).speed = Math.max((e as BaseEnemy).baseSpeed * 0.6, (e as BaseEnemy).speed * 0.98)
      }
      if (p.hasSparkInitiate) chainTargets.push(e)
    }
  }

  // Overcharge VFX: bright flash
  if (overcharging) {
    const flash = p.scene.add.circle(closest.x, closest.y, 12, 0xffffff, 0.7).setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
    p.scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 150, onComplete: () => flash.destroy() })
  }

  // Spark Initiate: chain lightning to 1 nearby enemy outside cone
  if (p.hasSparkInitiate && chainTargets.length > 0) {
    const src = chainTargets[0]
    let chainTarget: Phaser.Physics.Arcade.Sprite | null = null
    let chainDist = Infinity
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active || chainTargets.includes(e)) continue
      const d = Phaser.Math.Distance.Between(src.x, src.y, e.x, e.y)
      if (d < 80 && d < chainDist) { chainDist = d; chainTarget = e }
    }
    if (chainTarget) {
      (chainTarget as BaseEnemy).takeDamage(dmgThisFrame * 0.6, 'lightning')
      // Chain bolt VFX — jagged multi-segment lightning
      const cg = p.scene.add.graphics().setDepth(10)
      const sx = src.x, sy = src.y, tx = chainTarget.x, ty = chainTarget.y
      const segs = 5 + Math.floor(Math.random() * 3)
      const dx = (tx - sx) / segs, dy = (ty - sy) / segs
      // Bright core bolt
      cg.lineStyle(3, 0xffffff, 0.9)
      cg.beginPath(); cg.moveTo(sx, sy)
      for (let s = 1; s < segs; s++) {
        const jx = sx + dx * s + (Math.random() - 0.5) * 24
        const jy = sy + dy * s + (Math.random() - 0.5) * 24
        cg.lineTo(jx, jy)
      }
      cg.lineTo(tx, ty); cg.strokePath()
      // Outer glow bolt (wider, colored)
      cg.lineStyle(6, boltColor, 0.5)
      cg.beginPath(); cg.moveTo(sx, sy)
      for (let s = 1; s < segs; s++) {
        const jx = sx + dx * s + (Math.random() - 0.5) * 28
        const jy = sy + dy * s + (Math.random() - 0.5) * 28
        cg.lineTo(jx, jy)
      }
      cg.lineTo(tx, ty); cg.strokePath()
      cg.setBlendMode(Phaser.BlendModes.ADD)
      // Impact flash on chain target
      const cf = p.scene.add.circle(tx, ty, 8, 0xffffff, 0.8).setDepth(11)
        .setBlendMode(Phaser.BlendModes.ADD)
      p.scene.tweens.add({ targets: cf, scale: 2.5, alpha: 0, duration: 120, onComplete: () => cf.destroy() })
      p.scene.tweens.add({ targets: cg, alpha: 0, duration: 150, onComplete: () => cg.destroy() })
    }
  }

  // Arc Reach: arc zap to enemies just outside normal cone
  if (p.hasArcReach) {
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
      if (dist > lightRange || dist <= 0) continue
      const ae = Phaser.Math.Angle.Between(p.x, p.y, e.x, e.y)
      const ad = Math.abs(Phaser.Math.Angle.Wrap(ae - p.lightningAngle))
      if (ad > coneSpread && ad <= coneSpread + 0.4) {
        (e as BaseEnemy).takeDamage(dmgThisFrame * 0.4, 'lightning')
      }
    }
  }
}

export function updateSifraEnergy(p: Player, delta: number) {
  const regenAmt = p.energyRegenRate * (delta / 1000)
  if (p.stance === 'ice') {
    p.lightningEnergy = Math.min(p.maxEnergy, p.lightningEnergy + regenAmt)
  } else {
    p.iceEnergy = Math.min(p.maxEnergy, p.iceEnergy + regenAmt)
  }
}

export function updateSifraPassives(p: Player, delta: number) {
  const scene = p.scene as any
  const enemies = scene.enemies as Phaser.Physics.Arcade.Group | undefined

  // Sifra Blizzard Aura — slow nearby enemies passively
  if (p.hasBlizzardAura) {
    const baseRadius = 60 + p.splashRadius * 0.3
    const t = p.scene.time.now / 1000

    // Breathe: expands from baseRadius to 2× baseRadius and back (3s cycle)
    const breathe = (Math.sin(t * 2.1) + 1) / 2  // 0..1
    const auraRadius = baseRadius + baseRadius * breathe

    // Procedural frost aura — rotating ice particles + pulsing ring
    if (!p.blizzardAuraGfx) {
      p.blizzardAuraGfx = p.scene.add.graphics().setDepth(3).setBlendMode(Phaser.BlendModes.ADD)
    }
    const g = p.blizzardAuraGfx
    g.clear()

    // Outer pulsing ring — alpha fades as it expands
    const ringAlpha = 0.25 - breathe * 0.12
    g.lineStyle(2, 0x88ddff, ringAlpha)
    g.strokeCircle(p.x, p.y, auraRadius)
    g.lineStyle(1, 0xaaeeff, ringAlpha * 0.6)
    g.strokeCircle(p.x, p.y, auraRadius - 4)

    // Rotating ice particles (12 particles in 2 rings)
    for (let i = 0; i < 12; i++) {
      const ring = i < 6 ? 0 : 1
      const idx = i < 6 ? i : i - 6
      const count = 6
      const speed = ring === 0 ? 1.2 : -0.8
      const r = auraRadius * (ring === 0 ? 0.7 : 0.45)
      const angle = (idx / count) * Math.PI * 2 + t * speed
      const px = p.x + Math.cos(angle) * r
      const py = p.y + Math.sin(angle) * r
      const sz = ring === 0 ? 3.5 : 2.5
      const alpha = 0.4 + Math.sin(t * 4 + i) * 0.2

      // Diamond ice crystal shape
      g.fillStyle(0xccf0ff, alpha)
      g.fillTriangle(px, py - sz, px - sz * 0.6, py, px + sz * 0.6, py)
      g.fillTriangle(px, py + sz, px - sz * 0.6, py, px + sz * 0.6, py)

      // Bright core dot
      g.fillStyle(0xffffff, alpha * 0.7)
      g.fillCircle(px, py, 1)
    }

    // Inner frost glow — brighter when contracted
    g.fillStyle(0x66bbff, 0.06 - breathe * 0.03)
    g.fillCircle(p.x, p.y, auraRadius * 0.6)

    // Slow enemies in effective range (uses max expanded radius)
    if (enemies) {
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= auraRadius) {
          if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
            const blizSlow = p.hasDeepFreeze ? 0.3 : 0.6
            ;(e as BaseEnemy).speed = Math.min((e as BaseEnemy).speed, (e as BaseEnemy).baseSpeed * blizSlow)
          }
        }
      }
    }
  } else {
    if (p.blizzardAuraGfx) p.blizzardAuraGfx.clear()
  }

  // Sifra Eternal Winter — permanent damaging frost field
  if (p.hasEternalWinter && p.stance === 'ice') {
    const frostR = 55 + p.splashRadius * 0.3
    if (enemies) {
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= frostR) {
          (e as BaseEnemy).takeDamage(p.damage * 0.2 * (delta / 1000), 'ice')
          if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) (e as BaseEnemy).speed = (e as BaseEnemy).baseSpeed * 0.4
        }
      }
    }
    // VFX: frost particles on ground
    if (Math.random() < delta / 200) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * frostR
      const flake = p.scene.add.circle(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 2, 0xaaddff, 0.5).setDepth(3)
      p.scene.tweens.add({ targets: flake, alpha: 0, y: flake.y - 8, duration: 600, onComplete: () => flake.destroy() })
    }
  }

  // Sifra Ball Lightning — orbiting electric ball
  if (p.hasBallLightning) {
    if (!p.ballLightningGfx) p.ballLightningGfx = p.scene.add.graphics().setDepth(9)
    p.ballLightningGfx.clear()
    const orbitR = 45
    const orbitAngle = (p.scene.time.now / 600) % (Math.PI * 2)
    const bx = p.x + Math.cos(orbitAngle) * orbitR
    const by = p.y + Math.sin(orbitAngle) * orbitR
    // Ball glow
    p.ballLightningGfx.fillStyle(0x9966ff, 0.6)
    p.ballLightningGfx.fillCircle(bx, by, 8)
    p.ballLightningGfx.fillStyle(0xccbbff, 0.8)
    p.ballLightningGfx.fillCircle(bx, by, 4)
    p.ballLightningGfx.lineStyle(1, 0xbb99ff, 0.4)
    p.ballLightningGfx.strokeCircle(bx, by, 12)
    // Zap nearby enemies
    if (enemies) {
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(bx, by, e.x, e.y) <= 40) {
          (e as BaseEnemy).takeDamage(p.damage * 0.3 * (delta / 1000), 'lightning')
          // Mini bolt
          if (Math.random() < 0.1) {
            const mg = p.scene.add.graphics().setDepth(10)
            mg.lineStyle(1, 0xccddff, 0.6)
            mg.beginPath(); mg.moveTo(bx, by); mg.lineTo(e.x, e.y); mg.strokePath()
            p.scene.tweens.add({ targets: mg, alpha: 0, duration: 80, onComplete: () => mg.destroy() })
          }
        }
      }
    }
  } else if (p.ballLightningGfx) {
    p.ballLightningGfx.clear()
  }

  // Sifra Storm Lord — random lightning strikes every 2s
  if (p.hasStormLord && p.stance === 'lightning') {
    p.stormLordTimer += delta
    if (p.stormLordTimer >= 2000) {
      p.stormLordTimer = 0
      if (enemies) {
        const alive = (enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]).filter((e: any) => e.active)
        if (alive.length > 0) {
          const target = alive[Math.floor(Math.random() * alive.length)]
          ;(target as BaseEnemy).takeDamage(p.damage * 2, 'lightning')
          // Lightning strike VFX
          const strikeG = p.scene.add.graphics().setDepth(11)
          strikeG.lineStyle(3, 0xeeddff, 0.9)
          let sx = target.x + (Math.random() - 0.5) * 10
          let sy = target.y - 200
          strikeG.beginPath(); strikeG.moveTo(sx, sy)
          for (let s = 0; s < 5; s++) {
            sx += (Math.random() - 0.5) * 20
            sy += 40
            strikeG.lineTo(sx, sy)
          }
          strikeG.lineTo(target.x, target.y); strikeG.strokePath()
          // Impact flash
          const imp = p.scene.add.circle(target.x, target.y, 10, 0xffffff, 0.8).setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
          p.scene.tweens.add({ targets: imp, scale: 3, alpha: 0, duration: 200, onComplete: () => imp.destroy() })
          p.scene.tweens.add({ targets: strikeG, alpha: 0, duration: 250, onComplete: () => strikeG.destroy() })
        }
      }
    }
  }

  // Sifra Ice Armor — absorb shield + aura ring
  if (p.hasIceArmor) {
    p.iceArmorRegenDelay -= delta
    if (p.iceArmorRegenDelay <= 0 && p.iceArmorHP < p.iceArmorMax) {
      p.iceArmorHP = Math.min(p.iceArmorMax, p.iceArmorHP + p.iceArmorMax * 0.1 * (delta / 1000))
    }
    // Ice aura ring when shield is active
    if (!(p as any)._iceArmorAura) {
      (p as any)._iceArmorAura = p.scene.add.graphics().setDepth(3).setBlendMode(Phaser.BlendModes.ADD)
    }
    const ag = (p as any)._iceArmorAura as Phaser.GameObjects.Graphics
    ag.clear()
    if (p.iceArmorHP > 0) {
      const ratio = p.iceArmorHP / p.iceArmorMax
      const t = p.scene.time.now / 1000
      const pulse = 0.5 + Math.sin(t * 3) * 0.2
      const r = 30 + ratio * 10
      ag.lineStyle(2, 0x88ddff, pulse * ratio)
      ag.strokeCircle(p.x, p.y, r)
      ag.lineStyle(1, 0xaaeeff, pulse * ratio * 0.4)
      ag.strokeCircle(p.x, p.y, r + 3)
    }
  }
}
