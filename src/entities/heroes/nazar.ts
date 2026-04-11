import Phaser from 'phaser'
import { gameFont } from '../../utils/device'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'
import type { GameSceneContext } from '../../types/scene-context'

export function attackMelee(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  // Shadow Step: blink 30px toward nearest enemy before slashing
  if (p.hasShadowStep) {
    let closest: Phaser.Physics.Arcade.Sprite | null = null
    let closestDist = Infinity
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
      if (d < closestDist && d <= p.range + 40) { closestDist = d; closest = e }
    }
    if (closest && closestDist > 20) {
      const ang = Phaser.Math.Angle.Between(p.x, p.y, closest.x, closest.y)
      const blinkDist = Math.min(30, closestDist - 15)
      // Ghost afterimage at old position
      const ghost = p.scene.add.circle(p.x, p.y, 8, 0x9955dd, 0.4).setDepth(5)
      p.scene.tweens.add({ targets: ghost, alpha: 0, scale: 2, duration: 250, onComplete: () => ghost.destroy() })
      p.x += Math.cos(ang) * blinkDist
      p.y += Math.sin(ang) * blinkDist
    }
  }
  const hitRadius = p.range
  const dmgRatio = Math.min(p.damage / 18, 4)
  const slashTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0xffcccc : 0xcc4444

  // Slash VFX
  if (p.scene.textures.exists('vfx_slash')) {
    const slashAngle = p.flipX ? Math.PI : 0
    for (let i = 0; i < p.strikeCount; i++) {
      const angleOff = (i - (p.strikeCount - 1) / 2) * 0.4
      const slash = p.scene.add.image(p.x, p.y, 'vfx_slash')
        .setScale(2 + hitRadius * 0.02).setRotation(slashAngle + angleOff).setDepth(10)
        .setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
      p.scene.tweens.add({
        targets: slash, alpha: 0, scale: 3 + hitRadius * 0.03,
        duration: 200, delay: i * 30,
        onComplete: () => slash.destroy(),
      })
    }
  }

  // Count enemies in range for Assassinate
  const enemiesInRange = (enemies.getChildren() as Phaser.Physics.Arcade.Sprite[])
    .filter(e => e.active && Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= hitRadius).length
  const isAssassinating = p.hasAssassinate && enemiesInRange === 1
  const meleeDmg = (isAssassinating ? p.damage * 2 : p.damage) * p.getMasteryDamageMult('sword')

  // Damage all enemies in range
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= hitRadius) {
      // Weakness: poisoned enemies take +30% damage
      const weakMult = (p.hasWeakness && (e as any)._poisoned) ? 1.3 : 1
      for (let i = 0; i < p.strikeCount; i++) (e as BaseEnemy).takeDamage(meleeDmg * weakMult, 'melee')
      // Hit spark
      if (p.scene.textures.exists('vfx_hitspark')) {
        const spark = p.scene.add.image(e.x, e.y, 'vfx_hitspark')
          .setScale(1.2).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
        p.scene.tweens.add({
          targets: spark, alpha: 0, scale: 2, duration: 150,
          onComplete: () => spark.destroy(),
        })
      }

      // Assassinate VFX — red X on lone target
      if (isAssassinating) {
        const xMark = p.scene.add.text(e.x, e.y - 20, '✕', {
          fontFamily: gameFont(), fontSize: '18px', color: '#ff2222',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(12)
        p.scene.tweens.add({ targets: xMark, y: xMark.y - 20, alpha: 0, scale: 1.5, duration: 400, onComplete: () => xMark.destroy() })
      }

      // Hemorrhage — bleed DOT after melee hit
      if (p.hasHemorrhage && !(e as any)._bleedTimer) {
        (e as any)._bleedTimer = p.scene.time.addEvent({
          delay: 500, repeat: 5, callback: () => {
            if (e.active) (e as BaseEnemy).takeDamage(p.damage * 0.15 * p.getMasteryDamageMult('sword'), 'melee')
            if (!(e as any)._bleedTimer?.repeatCount) (e as any)._bleedTimer = null
          }
        })
      }

      // Blood Scent — execute enemies below 20% HP
      if (p.hasBloodScent && (e as BaseEnemy).hp > 0 && (e as BaseEnemy).hp < (e as BaseEnemy).maxHp * 0.2) {
        (e as BaseEnemy).takeDamage((e as BaseEnemy).hp + 1, 'melee')
        // VFX: blood splatter
        for (let b = 0; b < 4; b++) {
          const ba = Math.random() * Math.PI * 2
          const bd = Phaser.Math.Between(5, 18)
          const drop = p.scene.add.circle(e.x + Math.cos(ba) * bd, e.y + Math.sin(ba) * bd, Phaser.Math.Between(2, 4), 0xcc0000, 0.7).setDepth(6)
          p.scene.tweens.add({ targets: drop, alpha: 0, duration: 800, delay: 200, onComplete: () => drop.destroy() })
        }
      }

      // Death Mark — first hit marks, second hit deals +40%
      if (p.hasDeathMark) {
        if ((e as any)._deathMarked) {
          (e as BaseEnemy).takeDamage(p.damage * 0.4 * p.getMasteryDamageMult('sword'), 'melee');
          (e as any)._deathMarked = false
        } else {
          (e as any)._deathMarked = true
          e.setTint(0xff44ff)
          p.scene.time.delayedCall(3000, () => { if (e.active) { e.clearTint(); (e as any)._deathMarked = false } })
        }
      }
    }
  }

  // Smoke Bomb — AoE slow around player on melee
  if (p.hasSmokeBomb) {
    const smokeR = 50 + p.splashRadius * 0.3
    const smoke = p.scene.add.circle(p.x, p.y, 8, 0x553388, 0.4).setDepth(4)
    p.scene.tweens.add({ targets: smoke, scale: smokeR / 8, alpha: 0, duration: 500, onComplete: () => smoke.destroy() })
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= smokeR) {
        if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
          const origSpeed = (e as BaseEnemy).baseSpeed || (e as BaseEnemy).speed
          ;(e as BaseEnemy).speed = origSpeed * 0.4
          p.scene.time.delayedCall(2000, () => {
            if ((e as Phaser.Physics.Arcade.Sprite).active) (e as BaseEnemy).speed = origSpeed
          })
        }
      }
    }
  }

  // Blade Surge (hasChainDash) — forward lunge hits a line of enemies
  if (p.hasChainDash) {
    const lungeAngle = p.flipX ? Math.PI : 0
    const lungeRange = p.range * 1.5
    for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active) continue
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
      if (d > p.range && d <= lungeRange) {
        const aToE = Phaser.Math.Angle.Between(p.x, p.y, e.x, e.y)
        if (Math.abs(Phaser.Math.Angle.Wrap(aToE - lungeAngle)) < 0.6) {
          (e as BaseEnemy).takeDamage(p.damage * 0.7 * p.getMasteryDamageMult('sword'), 'melee')
        }
      }
    }
    if (p.scene.textures.exists('vfx_slash')) {
      const s = p.scene.add.image(p.x + Math.cos(lungeAngle) * 30, p.y, 'vfx_slash')
        .setScale(2.5).setRotation(lungeAngle).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setTint(0xcc4444)
      p.scene.tweens.add({ targets: s, alpha: 0, scale: 3.5, duration: 200, onComplete: () => s.destroy() })
    }
  }

  p.scene.time.delayedCall(150, () => {
    p.isAttacking = false
    // Vanish — brief invulnerability after melee
    if (p.hasVanish) {
      p.vanishUntil = p.scene.time.now + 400
      p.setAlpha(0.5)
      p.scene.time.delayedCall(400, () => { if (p.active) p.setAlpha(1) })
    }
  })
}

export function attackDash(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const ox = p.x, oy = p.y
  const dashAngle = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y)

  // Dynamic: trail count scales with strikeCount, tint shifts with damage
  const trailCount = 3 + p.strikeCount
  const hitRadius = 48 + p.splashRadius * 0.5
  const dmgRatio = Math.min(p.damage / 35, 3)
  const slashTint = dmgRatio > 2 ? 0xffffff : dmgRatio > 1.5 ? 0xdd99ff : 0xbb88ff
  const slashScale = 2.5 + (p.range - 48) * 0.02

  // Afterimage trail during dash
  for (let i = 1; i <= trailCount; i++) {
    const t = i / (trailCount + 1)
    const tx = ox + (target.x - ox) * t
    const ty = oy + (target.y - oy) * t
    p.scene.time.delayedCall(i * 15, () => {
      const ghost = p.scene.add.sprite(tx, ty, p.texture.key, p.frame.name)
        .setScale(p.scaleX, p.scaleY)
        .setAlpha(0.4)
        .setTint(slashTint)
        .setFlipX(p.flipX)
        .setDepth(8)
      p.scene.tweens.add({
        targets: ghost, alpha: 0, scale: p.scaleX * 0.6,
        duration: 250, onComplete: () => ghost.destroy(),
      })
    })
  }

  // Dash to target
  p.scene.tweens.add({
    targets: p, x: target.x, y: target.y,
    duration: 80,
    onComplete: () => {
      // Slash all enemies in hit radius
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= hitRadius) {
          for (let i = 0; i < p.strikeCount; i++) (e as BaseEnemy).takeDamage(p.damage, 'melee')
          // Hit spark — size scales with damage
          if (p.scene.textures.exists('vfx_hitspark')) {
            const spark = p.scene.add.image(e.x, e.y, 'vfx_hitspark')
              .setScale(1.5 + dmgRatio * 0.5).setDepth(10)
              .setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
            p.scene.tweens.add({
              targets: spark, alpha: 0, scale: 2.5 + dmgRatio, duration: 200,
              onComplete: () => spark.destroy(),
            })
          }
        }
      }

      // Smoke Bomb — slow all enemies in radius
      if (p.hasSmokeBomb) {
        const smokeRadius = 60 + p.splashRadius * 0.5
        // Visual: expanding purple smoke
        const smoke = p.scene.add.circle(p.x, p.y, 10, 0x553388, 0.5).setDepth(4)
        p.scene.tweens.add({
          targets: smoke, scale: smokeRadius / 10, alpha: 0, duration: 600,
          onComplete: () => smoke.destroy(),
        })
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= smokeRadius) {
            if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
              const origSpeed = (e as BaseEnemy).baseSpeed || (e as BaseEnemy).speed
              ;(e as BaseEnemy).speed = origSpeed * 0.4
              p.scene.time.delayedCall(2000, () => {
                if ((e as Phaser.Physics.Arcade.Sprite).active) (e as BaseEnemy).speed = origSpeed
              })
            }
          }
        }
      }

      // Slash arc — multiple arcs for strikeCount > 1
      if (p.scene.textures.exists('vfx_slash')) {
        for (let s = 0; s < p.strikeCount; s++) {
          const angleOff = (s - (p.strikeCount - 1) / 2) * 0.3
          const slash = p.scene.add.image(p.x, p.y, 'vfx_slash')
            .setScale(slashScale).setRotation(dashAngle + angleOff).setDepth(10)
            .setBlendMode(Phaser.BlendModes.ADD).setTint(slashTint)
          p.scene.tweens.add({
            targets: slash, alpha: 0, scale: slashScale + 1.5,
            duration: 250, delay: s * 40,
            onComplete: () => slash.destroy(),
          })
        }
      }

      // Chain Dash — bounce to a second target
      if (p.hasChainDash) {
        let chainTarget: Phaser.Physics.Arcade.Sprite | null = null
        let chainDist = Infinity
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || e === target) continue
          const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
          if (d < p.range * 1.2 && d < chainDist) { chainDist = d; chainTarget = e }
        }
        if (chainTarget) {
          const ct = chainTarget
          p.scene.tweens.add({
            targets: p, x: ct.x, y: ct.y, duration: 60,
            onComplete: () => {
              for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e.active) continue
                if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= hitRadius) {
                  (e as BaseEnemy).takeDamage(p.damage * 0.7, 'melee')
                }
              }
              // Slash VFX at chain target
              if (p.scene.textures.exists('vfx_slash')) {
                const chainAngle = Phaser.Math.Angle.Between(target.x, target.y, ct.x, ct.y)
                const s = p.scene.add.image(p.x, p.y, 'vfx_slash')
                  .setScale(slashScale * 0.8).setRotation(chainAngle).setDepth(10)
                  .setBlendMode(Phaser.BlendModes.ADD).setTint(0xcc88ff)
                p.scene.tweens.add({ targets: s, alpha: 0, scale: slashScale + 1, duration: 200, onComplete: () => s.destroy() })
              }
              // Return from chain target
              p.scene.tweens.add({
                targets: p, x: ox, y: oy, duration: 80,
                onComplete: () => {
                  p.isAttacking = false
                  if (p.hasVanish) {
                    p.vanishUntil = p.scene.time.now + 600
                    p.setAlpha(0.5)
                    p.scene.time.delayedCall(600, () => { if (p.active) p.setAlpha(1) })
                  }
                },
              })
            },
          })
          return  // Skip the normal return tween
        }
      }

      // Return
      p.scene.tweens.add({
        targets: p, x: ox, y: oy, duration: 80,
        onComplete: () => {
          p.isAttacking = false
          if (p.hasVanish) {
            p.vanishUntil = p.scene.time.now + 600
            p.setAlpha(0.5)
            p.scene.time.delayedCall(600, () => { if (p.active) p.setAlpha(1) })
          }
        },
      })
    },
  })
}

export function attackPoison(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const tx = target.x, ty = target.y
  // Dynamic: vial size scales with damage
  const dmgRatio = Math.min(p.damage / 6, 4)
  const vialSize = 3 + dmgRatio
  const vialColor = dmgRatio > 2.5 ? 0xddff44 : dmgRatio > 1.5 ? 0x88ee33 : 0xa3cb38
  const vial = p.scene.add.circle(p.x, p.y, vialSize, vialColor).setDepth(9)
  const dist = Phaser.Math.Distance.Between(p.x, p.y, tx, ty)

  p.scene.tweens.add({
    targets: vial, x: tx, y: ty,
    duration: (dist / 250) * 1000,
    onComplete: () => {
      vial.destroy()
      spawnPoisonCloud(p, tx, ty, enemies)
      p.isAttacking = false
    },
  })
}

export function spawnPoisonCloud(p: Player, cx: number, cy: number, enemies: Phaser.Physics.Arcade.Group) {
  const cloudGfx = p.scene.add.graphics().setDepth(9)
  // Dynamic: pool radius scales with splashRadius, duration with damage
  const dmgRatio = Math.min(p.damage / 6, 4)
  const poolRadius = 48 + p.splashRadius * 0.8
  const totalDuration = 4000 + Math.floor(dmgRatio * 500)
  const startTime = p.scene.time.now

  // Puff count scales with stats
  const numPuffs = 6 + Math.floor(dmgRatio * 2) + Math.floor(p.splashRadius / 20)
  const puffs: { angle: number; dist: number; size: number; phase: number; speed: number }[] = []
  for (let i = 0; i < numPuffs; i++) {
    puffs.push({
      angle: (i / numPuffs) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2),
      dist: 0,
      size: Phaser.Math.FloatBetween(10, 16),
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      speed: Phaser.Math.FloatBetween(0.8, 1.2),
    })
  }

  // Small wisp fragments that appear during dissipation
  const wisps: { angle: number; dist: number; size: number; phase: number }[] = []
  for (let i = 0; i < 6; i++) {
    wisps.push({
      angle: (i / 6) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3),
      dist: poolRadius * 0.6,
      size: Phaser.Math.FloatBetween(4, 7),
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
    })
  }

  // Damage timer — tick every 500ms
  let tickCount = 0
  p.scene.time.addEvent({
    delay: 500,
    repeat: 7,
    callback: () => {
      tickCount++
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= poolRadius) {
          const hpBefore = (e as BaseEnemy).hp || 0
          // Necrosis: poison DPS ramps +20% per tick
          const necroMult = p.hasNecrosis ? (1 + tickCount * 0.2) : 1;
          // Weakness: +30% damage to already-poisoned enemies
          const weakMult = (p.hasWeakness && (e as any)._poisoned) ? 1.3 : 1;
          (e as BaseEnemy).takeDamage(p.damage * necroMult * weakMult * p.getMasteryDamageMult('venom'), 'poison')
          // Tag as poisoned for Weakness
          ;(e as any)._poisoned = true
          e.setTint(0x88ff88)
          // Clear poison tag after 3s
          if (!(e as any)._poisonClearTimer) {
            (e as any)._poisonClearTimer = p.scene.time.delayedCall(3000, () => {
              if (e.active) { (e as any)._poisoned = false; e.clearTint() }
              ;(e as any)._poisonClearTimer = null
            })
          }
          // Pandemic: spread mini-cloud on kill
          if (p.hasPandemic && hpBefore > 0 && ((e as BaseEnemy).hp <= 0 || !e.active)) {
            const miniRadius = poolRadius * 0.5
            const miniGfx = p.scene.add.circle(e.x, e.y, miniRadius * 0.3, 0x44cc44, 0.3).setDepth(3)
            p.scene.tweens.add({ targets: miniGfx, scale: 2, alpha: 0, duration: 1500, onComplete: () => miniGfx.destroy() })
            // Mini cloud damage
            let miniTicks = 0
            p.scene.time.addEvent({
              delay: 500, repeat: 3,
              callback: () => {
                miniTicks++
                for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                  if (!e2.active) continue
                  if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= miniRadius) {
                    (e2 as BaseEnemy).takeDamage(p.damage * 0.5 * p.getMasteryDamageMult('venom'), 'poison')
                  }
                }
              },
            })
          }
        }
      }
    },
  })

  // Toxic Slash: lingering poison puddle at hit location
  if (p.hasToxicSlash) {
    const puddleR = p.hasVirulentStrain ? poolRadius * 0.8 : poolRadius * 0.5
    const puddleDur = p.hasVirulentStrain ? 5000 : 3000
    const puddleGfx = p.scene.add.graphics().setDepth(2)
    const puddleStart = p.scene.time.now
    // Pre-generate blob shapes once
    const blobs = Array.from({length: 3}, () => ({
      ox: (Math.random() - 0.5) * puddleR * 0.5,
      oy: (Math.random() - 0.5) * puddleR * 0.3,
      rx: puddleR * (0.6 + Math.random() * 0.5),
      ry: puddleR * (0.35 + Math.random() * 0.3),
      phase: Math.random() * Math.PI * 2,
    }))
    // Puddle damage tick
    p.scene.time.addEvent({
      delay: 400, repeat: Math.floor(puddleDur / 400),
      callback: () => {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= puddleR) {
            ;(e as BaseEnemy).takeDamage((p.hasVirulentStrain ? p.damage * 0.5 : p.damage * 0.3) * p.getMasteryDamageMult('venom'), 'poison')
            ;(e as any)._poisoned = true
          }
        }
      },
    })
    // Puddle visual animation (50ms = 20fps, sufficient for ground VFX)
    const puddleVfx = p.scene.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        const el = p.scene.time.now - puddleStart
        if (el >= puddleDur) { puddleGfx.destroy(); puddleVfx.destroy(); return }
        const fade = 1 - el / puddleDur
        puddleGfx.clear()
        // Outer soft glow
        puddleGfx.fillStyle(0x2d6b1a, fade * 0.10)
        puddleGfx.fillEllipse(cx, cy, puddleR * 2.2, puddleR * 1.35)
        // Blob layers
        for (const b of blobs) {
          const drift = Math.sin(el / 900 + b.phase) * puddleR * 0.06
          // Outer blob edge
          puddleGfx.fillStyle(0x2d6b1a, fade * 0.18)
          puddleGfx.fillEllipse(cx + b.ox + drift, cy + b.oy, b.rx * 1.15, b.ry * 1.15)
          // Main blob body
          puddleGfx.fillStyle(0x3a8020, fade * 0.30)
          puddleGfx.fillEllipse(cx + b.ox + drift, cy + b.oy, b.rx, b.ry)
          // Inner bright highlight
          puddleGfx.fillStyle(0x5aaa2a, fade * 0.15)
          puddleGfx.fillEllipse(cx + b.ox + drift * 0.5, cy + b.oy, b.rx * 0.55, b.ry * 0.55)
        }
        // Dark core
        puddleGfx.fillStyle(0x1a4a0a, fade * 0.35)
        puddleGfx.fillEllipse(cx, cy, puddleR * 0.7, puddleR * 0.45)
        // Virulent Strain: yellow-green glow overlay
        if (p.hasVirulentStrain) {
          puddleGfx.fillStyle(0x88aa22, fade * 0.12)
          puddleGfx.fillEllipse(cx, cy, puddleR * 2.0, puddleR * 1.2)
        }
        // Bubbles
        const bubbleChance = p.hasVirulentStrain ? 0.25 : 0.15
        if (Math.random() < bubbleChance) {
          const ba = Math.random() * Math.PI * 2
          const bd = Math.random() * puddleR * 0.7
          const bubble = p.scene.add.circle(cx + Math.cos(ba) * bd, cy + Math.sin(ba) * bd * 0.6, 2, 0x66ee66, 0.5).setDepth(3)
          p.scene.tweens.add({ targets: bubble, y: bubble.y - 10, alpha: 0, duration: 400, onComplete: () => bubble.destroy() })
        }
      },
    })
  }

  // Animation loop (33ms = 30fps for cloud VFX)
  const updateEvent = p.scene.time.addEvent({
    delay: 33,
    loop: true,
    callback: () => {
      const elapsed = p.scene.time.now - startTime
      const progress = Math.min(elapsed / totalDuration, 1)

      cloudGfx.clear()

      if (progress >= 1) {
        cloudGfx.destroy()
        updateEvent.destroy()
        return
      }

      const t = elapsed / 1000

      // Phase 1 (0-0.15): small cloud appears, puffs grow from center
      // Phase 2 (0.15-0.5): puffs expand outward into a ring, center darkens
      // Phase 3 (0.5-0.75): ring fully formed, bubbling animation
      // Phase 4 (0.75-1.0): ring breaks apart, wisps scatter, fade out

      let ringProgress: number // how far puffs are from center (0=center, 1=ring)
      let overallAlpha: number
      let centerHole: number // 0 = no hole, 1 = full hole

      if (progress < 0.15) {
        // Growing from center
        ringProgress = 0
        overallAlpha = progress / 0.15
        centerHole = 0
      } else if (progress < 0.5) {
        // Expanding into ring
        const p2 = (progress - 0.15) / 0.35
        ringProgress = p2
        overallAlpha = 1
        centerHole = p2 * 0.8
      } else if (progress < 0.75) {
        // Full ring, bubbling
        ringProgress = 1
        overallAlpha = 1
        centerHole = 0.8 + ((progress - 0.5) / 0.25) * 0.2
      } else {
        // Dissipating
        const p2 = (progress - 0.75) / 0.25
        ringProgress = 1 + p2 * 0.5
        overallAlpha = 1 - p2
        centerHole = 1
      }

      // Draw center fill (dark green, fading as hole opens)
      if (centerHole < 0.9) {
        const centerAlpha = overallAlpha * (1 - centerHole) * 0.25
        cloudGfx.fillStyle(0x2d5a1e, centerAlpha)
        const cSize = poolRadius * (0.3 + ringProgress * 0.4) * (1 - centerHole * 0.6)
        cloudGfx.fillCircle(cx, cy, cSize)
      }

      // Draw puffs
      for (const puff of puffs) {
        const pDist = ringProgress * poolRadius * puff.speed
        const wobble = Math.sin(t * 4 + puff.phase) * 4
        const px = cx + Math.cos(puff.angle) * (pDist + wobble)
        const py = cy + Math.sin(puff.angle) * (pDist + wobble)

        // Puff size: grows during expansion, shrinks during dissipation
        let pSize = puff.size
        if (progress < 0.15) {
          pSize *= progress / 0.15
        } else if (progress > 0.75) {
          pSize *= (1 - (progress - 0.75) / 0.25)
        }
        // Breathing effect
        pSize += Math.sin(t * 6 + puff.phase) * 2

        if (pSize <= 0) continue

        // Color shifts with damage ratio (more toxic = brighter/yellower)
        const glowColor = dmgRatio > 2.5 ? 0x88aa22 : 0x4a8b2c
        const mainColor = dmgRatio > 2.5 ? 0xaaee33 : dmgRatio > 1.5 ? 0x88dd33 : 0x6fbf3b
        const hlColor = dmgRatio > 2.5 ? 0xddff66 : dmgRatio > 1.5 ? 0xaaff44 : 0x8fef5b

        // Outer glow
        cloudGfx.fillStyle(glowColor, overallAlpha * 0.15)
        cloudGfx.fillCircle(px, py, pSize * 1.5)

        // Main puff
        cloudGfx.fillStyle(mainColor, overallAlpha * 0.5)
        cloudGfx.fillCircle(px, py, pSize)

        // Bright highlight
        const hlOff = Math.sin(t * 3 + puff.phase) * 2
        cloudGfx.fillStyle(hlColor, overallAlpha * 0.35)
        cloudGfx.fillCircle(px - pSize * 0.25 + hlOff, py - pSize * 0.3, pSize * 0.5)

        // Dark inner shadow (gives depth)
        cloudGfx.fillStyle(0x2d5a1e, overallAlpha * 0.3)
        cloudGfx.fillCircle(px + pSize * 0.15, py + pSize * 0.2, pSize * 0.45)
      }

      // Draw wisps (small fragments during dissipation phase)
      if (progress > 0.6) {
        const wispAlpha = overallAlpha * Math.min((progress - 0.6) / 0.15, 1)
        for (const wisp of wisps) {
          const wDist = wisp.dist + (progress - 0.6) * poolRadius * 1.5
          const wAngle = wisp.angle + t * 0.5
          const wx = cx + Math.cos(wAngle) * wDist
          const wy = cy + Math.sin(wAngle) * wDist
          const wSize = wisp.size * (1 - (progress - 0.6) / 0.4)
          if (wSize <= 0) continue

          cloudGfx.fillStyle(0x6fbf3b, wispAlpha * 0.4)
          cloudGfx.fillCircle(wx, wy, wSize)
          cloudGfx.fillStyle(0x8fef5b, wispAlpha * 0.2)
          cloudGfx.fillCircle(wx, wy, wSize * 0.5)
        }
      }

      // Subtle toxic particle sparks
      if (progress < 0.85 && Math.random() < 0.4) {
        const sparkAngle = Math.random() * Math.PI * 2
        const sparkDist = Phaser.Math.FloatBetween(5, poolRadius * ringProgress)
        const sx = cx + Math.cos(sparkAngle) * sparkDist
        const sy = cy + Math.sin(sparkAngle) * sparkDist
        const spark = p.scene.add.circle(sx, sy, Phaser.Math.Between(1, 3), 0xaaff44, 0.7).setDepth(9)
        p.scene.tweens.add({
          targets: spark,
          alpha: 0, y: sy - Phaser.Math.Between(10, 25), scale: 0.2,
          duration: Phaser.Math.Between(200, 500),
          onComplete: () => spark.destroy(),
        })
      }
    },
  })
}

export function updateNazarEnergy(p: Player, delta: number) {
  // Nazar stance energy regen — inactive stance recharges
  if (p.heroType === 'nazar') {
    const regenAmt = p.energyRegenRate * (delta / 1000)
    if (p.nazarStance === 'sword') {
      p.venomEnergy = Math.min(p.maxEnergy, p.venomEnergy + regenAmt)
    } else {
      p.swordEnergy = Math.min(p.maxEnergy, p.swordEnergy + regenAmt)
    }
  }
}

export function updatePhantomTrail(p: Player, delta: number, moving: boolean) {
  if (p.hasPhantomTrail && moving) {
    p.phantomTrailTimer += delta
    if (p.phantomTrailTimer >= 500) {
      p.phantomTrailTimer = 0
      // Enforce max 6 trails
      const activeTrails = p._phantomTrails.filter(t => t.active)
      p._phantomTrails = activeTrails
      if (activeTrails.length >= 6) return

      const tx = p.x, ty = p.y
      const trail = p.scene.add.circle(tx, ty, 12, 0x220033, 0.5).setDepth(3)
      activeTrails.push(trail)
      // Track last hit time per enemy (500ms cooldown between hits on same enemy)
      const trailHitTimes = new Map<Phaser.Physics.Arcade.Sprite, number>()

      let ticks = 0
      const trailTimer = p.scene.time.addEvent({
        delay: 250, repeat: 7, callback: () => {
          ticks++
          const now = p.scene.time.now
          const scene = p.scene as GameSceneContext
          if (scene.enemies) {
            for (const e of scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active) continue
              const lastHit = trailHitTimes.get(e as Phaser.Physics.Arcade.Sprite) ?? 0
              if (now - lastHit < 500) continue
              if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) <= 12) {
                ;(e as BaseEnemy).takeDamage(p.damage * 0.3 * p.getMasteryDamageMult('sword'), 'melee')
                trailHitTimes.set(e as Phaser.Physics.Arcade.Sprite, now)
              }
            }
          }
          if (ticks >= 8) { if (trail.active) trail.destroy(); trailTimer.destroy() }
        }
      })
      p.scene.tweens.add({ targets: trail, alpha: 0, scale: 0.3, duration: 2000, onComplete: () => { if (trail.active) trail.destroy() } })
    }
  }
}
