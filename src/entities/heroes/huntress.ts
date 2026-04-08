import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

export function attackHuntressMelee(p: Player, enemies: Phaser.Physics.Arcade.Group) {
  const hitRadius = 80
  const dmgRatio = Math.min(p.damage / 18, 4)
  const slashTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0x7bed9f : 0x2ecc71

  // Stab VFX — short line in facing direction
  const stabAngle = p.flipX ? Math.PI : 0
  const stabX = p.cx + Math.cos(stabAngle) * 25
  const stabY = p.cy + Math.sin(stabAngle) * 25
  const stab = p.scene.add.rectangle(stabX, stabY, 20, 3, slashTint).setDepth(10).setRotation(stabAngle)
  p.scene.tweens.add({
    targets: stab, alpha: 0, scaleX: 2, duration: 150,
    onComplete: () => stab.destroy(),
  })

  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    if (Phaser.Math.Distance.Between(p.cx, p.cy, e.x, e.y) <= hitRadius) {
      let dmg = p.damage * p.getMasteryDamageMult('melee')
      // Critical Strike: 20% chance for 2x damage
      const isCrit = p.hasCriticalStrike && Math.random() < 0.2
      if (isCrit) dmg *= 2
      // Marked Target: +30% damage to marked enemies
      if (p.hasMarkedTarget && (e as BaseEnemy).isMarked) dmg *= 1.3
      ;(e as BaseEnemy).takeDamage(dmg, 'melee')
      // Mark enemy on hit
      if (p.hasMarkedTarget) {
        (e as BaseEnemy).isMarked = true
        ;(e as BaseEnemy).markTimer = 5000
      }
      p.spearHitVfx(e.x, e.y, isCrit ? 0xff4444 : slashTint)
      // Crit text
      if (isCrit) {
        const ct = p.scene.add.text(e.x, e.y - 30, 'CRIT!', {
          fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(21)
        p.scene.tweens.add({ targets: ct, y: ct.y - 20, alpha: 0, duration: 500, onComplete: () => ct.destroy() })
      }
    }
  }

  // Earth Slam: melee creates shockwave line in facing direction
  if (p.hasEarthSlam) {
    const slamAngle = p.flipX ? Math.PI : 0
    const slamLen = 150
    const slamW = 20
    const hitEnemies = new Set<Phaser.Physics.Arcade.Sprite>()
    // VFX: expanding ground crack
    for (let i = 0; i < 5; i++) {
      const dist = (i + 1) * (slamLen / 5)
      const sx = p.cx + Math.cos(slamAngle) * dist
      const sy = p.cy + Math.sin(slamAngle) * dist
      p.scene.time.delayedCall(i * 40, () => {
        if (!p.scene) return
        const crack = p.scene.add.rectangle(sx, sy, 16, 6, 0x8b7355, 0.7).setDepth(3).setRotation(slamAngle)
        p.scene.tweens.add({ targets: crack, scaleX: 2, alpha: 0, duration: 400, onComplete: () => crack.destroy() })
        // Damage enemies along the line
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || hitEnemies.has(e)) continue
          if (Phaser.Math.Distance.Between(sx, sy, e.x, e.y) <= slamW) {
            (e as BaseEnemy).takeDamage(p.damage * 0.6 * p.getMasteryDamageMult('melee'), 'shockwave')
            hitEnemies.add(e)
          }
        }
      })
    }
    p.scene.cameras.main.shake(60, 0.003)
  }

  // Short lock — movement at 50% during attack, not full freeze
  p.scene.time.delayedCall(120, () => { p.isAttacking = false })
}

export function attackSpear(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const angle = Phaser.Math.Angle.Between(p.cx, p.cy, target.x, target.y)
  const cam = p.scene.cameras.main
  const maxDist = Math.sqrt(cam.width * cam.width + cam.height * cam.height)
  const spearSpeed = 350
  const flyTime = (maxDist / spearSpeed) * 1000
  const hitRadius = 22 + p.splashRadius * 0.4
  const dmgRatio = Math.min(p.damage / 18, 4)
  const spearLen = 28 + dmgRatio * 4
  const spearW = 3
  const spearTint = dmgRatio > 2.5 ? 0xffffff : dmgRatio > 1.5 ? 0x7bed9f : 0x2ecc71

  // Volley counter: every 5th throw fires 3 spears
  p.volleyCounter++
  const isVolley = p.hasVolley && p.volleyCounter % 5 === 0

  // Net counter: every 8th throw roots enemies
  p.netCounter++
  const isNetThrow = p.hasNetThrow && p.netCounter % 8 === 0

  const launchSpear = (sa: number, isExtra = false) => {
    const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()
    let spearDead = false
    const eX = p.cx + Math.cos(sa) * maxDist
    const eY = p.cy + Math.sin(sa) * maxDist

    const spear = p.scene.add.rectangle(p.cx, p.cy, spearLen, spearW, spearTint).setDepth(9)
    spear.rotation = sa
    const tip = p.scene.add.triangle(p.cx, p.cy, 0, -3, 8, 0, 0, 3, 0xeeeeee).setDepth(10)
    tip.rotation = sa

    const trailTimer = p.scene.time.addEvent({
      delay: 30, loop: true,
      callback: () => {
        if (!spear.scene || spearDead) return
        const tp = p.scene.add.rectangle(
          spear.x + Phaser.Math.Between(-2, 2),
          spear.y + Phaser.Math.Between(-2, 2),
          8, 1.5, isNetThrow ? 0x44cc44 : spearTint, 0.4
        ).setDepth(8).setRotation(sa)
        p.scene.tweens.add({
          targets: tp, alpha: 0, scale: 0, duration: 200,
          onComplete: () => tp.destroy(),
        })
      },
    })

    const killSpear = () => {
      spearDead = true
      trailTimer.destroy()
      if (spear.scene) spear.destroy()
      if (tip.scene) tip.destroy()
    }

    p.scene.tweens.add({
      targets: [spear, tip], x: eX, y: eY, duration: flyTime,
      onUpdate: () => {
        if (spearDead) return
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active || hitSet.has(e)) continue
          if (Phaser.Math.Distance.Between(spear.x, spear.y, e.x, e.y) <= hitRadius) {
            let dmg = (isExtra ? p.damage * 0.6 : p.damage) * p.getMasteryDamageMult('spear')
            // Critical Strike
            const isCrit = p.hasCriticalStrike && Math.random() < 0.2
            if (isCrit) dmg *= 2
            // Marked Target bonus
            if (p.hasMarkedTarget && (e as BaseEnemy).isMarked) dmg *= 1.3
            ;(e as BaseEnemy).takeDamage(dmg, 'melee')
            hitSet.add(e)
            // Heavy Spear: knockback on spear hit
            if (p.hasHeavySpear) {
              const kb = 180
              const angle = Math.atan2(e.y - spear.y, e.x - spear.x)
              const body = e.body as Phaser.Physics.Arcade.Body
              if (body) body.setVelocity(Math.cos(angle) * kb, Math.sin(angle) * kb)
            }
            // Mark enemy
            if (p.hasMarkedTarget) {
              (e as BaseEnemy).isMarked = true
              ;(e as BaseEnemy).markTimer = 5000
            }
            // Net Throw: root enemies
            if (isNetThrow) {
              (e as BaseEnemy).isRooted = true
              ;(e as BaseEnemy).rootTimer = 1500
              // Net VFX
              const net = p.scene.add.circle(e.x, e.y, 14, 0x44cc44, 0.3).setDepth(9)
              p.scene.tweens.add({ targets: net, alpha: 0, scale: 2, duration: 1500, onComplete: () => net.destroy() })
            }
            p.spearHitVfx(e.x, e.y, isCrit ? 0xff4444 : spearTint)
            if (isCrit) {
              const ct = p.scene.add.text(e.x, e.y - 30, 'CRIT!', {
                fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
                stroke: '#000', strokeThickness: 2,
              }).setOrigin(0.5).setDepth(21)
              p.scene.tweens.add({ targets: ct, y: ct.y - 20, alpha: 0, duration: 500, onComplete: () => ct.destroy() })
            }
            // Explosive Tips: AOE on first hit only
            if (p.hasExplosiveTips && hitSet.size === 1) {
              const blastR = 40 + p.splashRadius * 0.4
              const blast = p.scene.add.circle(e.x, e.y, 8, 0xff6600, 0.5).setDepth(10)
              p.scene.tweens.add({ targets: blast, scale: blastR / 8, alpha: 0, duration: 250, onComplete: () => blast.destroy() })
              for (const e2 of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e2.active || hitSet.has(e2)) continue
                if (Phaser.Math.Distance.Between(e.x, e.y, e2.x, e2.y) <= blastR) {
                  (e2 as BaseEnemy).takeDamage(p.damage * 0.35 * p.getMasteryDamageMult('spear'), 'shockwave')
                  hitSet.add(e2)
                }
              }
            }
          }
        }
      },
      onComplete: () => {
        // Splinter Shot: if spear reached end, spawn splinter shards
        if (p.hasSplinterShot && !spearDead && hitSet.size === 0) {
          const sx = spear.x, sy = spear.y
          for (let i = 0; i < 3; i++) {
            const shardAngle = sa + (i - 1) * 0.5
            const shard = p.scene.add.rectangle(sx, sy, 10, 2, 0x7bed9f, 0.8).setDepth(8).setRotation(shardAngle)
            const sdx = sx + Math.cos(shardAngle) * 80
            const sdy = sy + Math.sin(shardAngle) * 80
            p.scene.tweens.add({
              targets: shard, x: sdx, y: sdy, alpha: 0, duration: 300,
              onUpdate: () => {
                for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                  if (!e.active) continue
                  if (Phaser.Math.Distance.Between(shard.x, shard.y, e.x, e.y) <= 18) {
                    (e as BaseEnemy).takeDamage(p.damage * 0.3 * p.getMasteryDamageMult('spear'), 'melee')
                  }
                }
              },
              onComplete: () => shard.destroy(),
            })
          }
        }
        killSpear()
      },
    })
  }

  // Main spear
  launchSpear(angle)

  // Extra spears from Multistrike
  for (let s = 1; s < p.strikeCount; s++) {
    const angleOff = (s - (p.strikeCount - 1) / 2) * 0.12
    launchSpear(angle + angleOff)
  }

  // Volley: fire 2 extra spears at slight angles
  if (isVolley) {
    launchSpear(angle - 0.25, true)
    launchSpear(angle + 0.25, true)
    // VFX: volley flash
    const flash = p.scene.add.circle(p.cx, p.cy, 15, 0xff4444, 0.4).setDepth(10)
    p.scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 200, onComplete: () => flash.destroy() })
  }

  // Hold isAttacking for ranged anim duration
  p.scene.time.delayedCall(580, () => { p.isAttacking = false })
}

export function updateHuntressEnergy(p: Player, delta: number) {
  const regenAmt = p.energyRegenRate * (delta / 1000)
  if (p.huntressStance === 'melee') {
    p.spearEnergy = Math.min(p.maxEnergy, p.spearEnergy + regenAmt)
  } else {
    p.meleeEnergy = Math.min(p.maxEnergy, p.meleeEnergy + regenAmt)
  }
}

export function updateHuntressPassives(p: Player, delta: number) {
  const now = p.scene.time.now

  // Battle Frenzy: temporary attack speed boost
  if (p.hasBattleFrenzy && p.battleFrenzyUntil > now) {
    // Frenzy is active — cooldown reduction applied in attack via lastAttackTime offset
  }

  // Kill Stride: +20% speed while active
  if (p.hasKillStride && p.killStrideUntil > now) {
    // Speed buff already applied on kill, decays naturally
  } else if (p.hasKillStride && p.killStrideUntil > 0 && p.killStrideUntil <= now) {
    p.killStrideUntil = 0
    p.speed = Math.ceil(p.speed / 1.2)
  }

  // Camouflage: alpha while invisible, enemies can't target
  if (p.hasCamouflage && p.camouflageUntil > now) {
    p.setAlpha(0.3)
  } else if (p.hasCamouflage && p.camouflageUntil > 0 && p.camouflageUntil <= now) {
    p.camouflageUntil = 0
    p.setAlpha(1)
  }

  // Caltrops: drop spike zone behind while moving
  if (p.hasCaltrops) {
    p.caltropTimer += delta
    if (p.caltropTimer >= 800) {
      const pBody2 = p.body as Phaser.Physics.Arcade.Body
      const isMoving = Math.abs(pBody2.velocity.x) > 10 || Math.abs(pBody2.velocity.y) > 10
      if (isMoving) {
        p.caltropTimer = 0
        const cx = p.x, cy = p.y
        // VFX: small spike cluster
        const calt = p.scene.add.circle(cx, cy, 10, 0x44cc44, 0.3).setDepth(3)
        // Spike marks
        for (let i = 0; i < 3; i++) {
          const sp = p.scene.add.rectangle(
            cx + Phaser.Math.Between(-8, 8), cy + Phaser.Math.Between(-8, 8),
            3, 3, 0x228822, 0.6
          ).setDepth(3).setRotation(Math.random() * Math.PI)
          p.scene.tweens.add({ targets: sp, alpha: 0, duration: 3000, delay: 500, onComplete: () => sp.destroy() })
        }
        // Damage + slow enemies over time
        let ticks = 0
        const caltTimer = p.scene.time.addEvent({
          delay: 300, repeat: 10,
          callback: () => {
            ticks++
            const scn = p.scene as any
            if (scn.enemies) {
              for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                if (!e.active) continue
                if (Phaser.Math.Distance.Between(cx, cy, e.x, e.y) <= 18) {
                  (e as BaseEnemy).takeDamage(p.damage * 0.15, 'melee')
                  if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
                    (e as BaseEnemy).speed = (e as BaseEnemy).baseSpeed * 0.5
                  }
                }
              }
            }
            if (ticks >= 10) { calt.destroy(); caltTimer.destroy() }
          },
        })
        p.scene.tweens.add({ targets: calt, alpha: 0, duration: 3500 })
      }
    }
  }

  // Leap: auto-leap away when 4+ enemies within 50px
  if (p.hasLeap) {
    p.leapCooldown -= delta
    if (p.leapCooldown <= 0) {
      const scn = p.scene as any
      if (scn.enemies) {
        let nearCount = 0
        let avgAngle = 0
        for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
          if (d <= 50) {
            nearCount++
            avgAngle += Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y)
          }
        }
        if (nearCount >= 4) {
          p.leapCooldown = 4000 // 4s cooldown
          avgAngle /= nearCount
          const leapDist = 120
          // Ghost at old position
          const ghost = p.scene.add.circle(p.x, p.y, 10, 0x44cc44, 0.4).setDepth(5)
          p.scene.tweens.add({ targets: ghost, alpha: 0, scale: 3, duration: 300, onComplete: () => ghost.destroy() })
          p.x += Math.cos(avgAngle) * leapDist
          p.y += Math.sin(avgAngle) * leapDist
          // Landing dust
          const dust = p.scene.add.circle(p.x, p.y, 8, 0x888888, 0.3).setDepth(3)
          p.scene.tweens.add({ targets: dust, scale: 3, alpha: 0, duration: 300, onComplete: () => dust.destroy() })
        }
      }
    }
  }

  // Headhunter: execute enemies below 15% HP in range
  if (p.hasHeadhunter) {
    const execR = 100 + p.range * 0.3
    const scn = p.scene as any
    if (scn.enemies) {
      for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if ((e as BaseEnemy).hp > 0 && (e as BaseEnemy).maxHp && (e as BaseEnemy).hp < (e as BaseEnemy).maxHp * 0.15) {
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= execR) {
            (e as BaseEnemy).takeDamage((e as BaseEnemy).hp + 1, 'melee')
            // VFX: red slash mark
            const xMark = p.scene.add.text(e.x, e.y - 10, '✕', {
              fontFamily: 'monospace', fontSize: '18px', color: '#ff2222',
              stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5).setDepth(21)
            p.scene.tweens.add({ targets: xMark, y: xMark.y - 20, alpha: 0, scale: 2, duration: 400, onComplete: () => xMark.destroy() })
          }
        }
      }
    }
  }

  // Spear Wall: orbiting spears that damage nearby enemies
  if (p.hasSpearWall) {
    p.spearWallAngle += 2.5 * (delta / 1000) // ~2.5 rad/s rotation
    if (!p.spearWallGfx) p.spearWallGfx = p.scene.add.graphics().setDepth(9)
    const spearWallGfx = p.spearWallGfx!
    spearWallGfx.clear()
    const orbitR = 55
    const spearCount = 3
    const scn = p.scene as any
    for (let i = 0; i < spearCount; i++) {
      const a = p.spearWallAngle + (i * Math.PI * 2 / spearCount)
      const sx = p.x + Math.cos(a) * orbitR
      const sy = p.y + Math.sin(a) * orbitR
      // Draw spear
      spearWallGfx.lineStyle(3, 0x2ecc71, 0.7)
      spearWallGfx.beginPath()
      spearWallGfx.moveTo(sx - Math.cos(a) * 8, sy - Math.sin(a) * 8)
      spearWallGfx.lineTo(sx + Math.cos(a) * 8, sy + Math.sin(a) * 8)
      spearWallGfx.strokePath()
      // Tip
      spearWallGfx.fillStyle(0xeeeeee, 0.8)
      spearWallGfx.fillCircle(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10, 2)
      // Damage enemies
      if (scn.enemies) {
        for (const e of scn.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(sx, sy, e.x, e.y) <= 18) {
            (e as BaseEnemy).takeDamage(p.damage * 0.2 * (delta / 1000), 'melee')
          }
        }
      }
    }
  } else if (p.spearWallGfx) {
    p.spearWallGfx.clear()
  }

  // Mark timer decay on enemies
  const scn2 = p.scene as any
  if (p.hasMarkedTarget && scn2.enemies) {
    for (const e of scn2.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!e.active || !(e as BaseEnemy).isMarked) continue
      ;(e as BaseEnemy).markTimer -= delta
      if ((e as BaseEnemy).markTimer <= 0) {
        (e as BaseEnemy).isMarked = false
      }
    }
  }
}
