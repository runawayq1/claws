import Phaser from 'phaser'
import type { Player } from '../Player'
import { BaseEnemy } from '../BaseEnemy'

/** Haboob melee: cone AoE sand swipe — applies blind + knockback */
export function attackSandSwipe(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const cx = p.cx, cy = p.cy
  const angle = Phaser.Math.Angle.Between(cx, cy, target.x, target.y)
  const swipeRange = 90
  const coneHalf = Math.PI / 4  // ±45° = 90° cone
  let dmg = Math.ceil(p.damage * 1.3 * p.getMasteryDamageMult('sand'))
  let hitCount = 0

  // Sand burst VFX — cone arc
  const arcGfx = p.scene.add.graphics().setDepth(10)
  arcGfx.fillStyle(0xddaa44, 0.15)
  arcGfx.beginPath()
  arcGfx.moveTo(cx, cy)
  for (let i = 0; i <= 12; i++) {
    const a = angle - coneHalf + (coneHalf * 2 * i / 12)
    arcGfx.lineTo(cx + Math.cos(a) * swipeRange, cy + Math.sin(a) * swipeRange)
  }
  arcGfx.closePath()
  arcGfx.fill()
  arcGfx.lineStyle(3, 0xcc8844, 0.5)
  arcGfx.beginPath()
  arcGfx.arc(cx, cy, swipeRange, angle - coneHalf, angle + coneHalf)
  arcGfx.strokePath()
  p.scene.tweens.add({ targets: arcGfx, alpha: 0, duration: 250, onComplete: () => arcGfx.destroy() })

  // Hit enemies in cone
  for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!e.active) continue
    const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y)
    if (dist > swipeRange) continue
    const toEnemy = Phaser.Math.Angle.Between(cx, cy, e.x, e.y)
    let diff = toEnemy - angle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    if (Math.abs(diff) > coneHalf) continue

    let finalDmg = dmg
    // Choking Sand: +35% dmg to blinded enemies
    if (p.hasChokingSand && (e as any)._isBlinded) finalDmg = Math.ceil(finalDmg * 1.35)
    // Abrasion: +20% dmg to blinded enemies
    if (p.hasAbrasion && (e as any)._isBlinded) finalDmg = Math.ceil(finalDmg * 1.2)
    ;(e as BaseEnemy).takeDamage(finalDmg, 'melee')

    // Apply blind (slow + marker) — use timestamp to prevent stacking issues
    if ((e as BaseEnemy).speed && (e as BaseEnemy).baseSpeed) {
      (e as BaseEnemy).speed = (e as BaseEnemy).baseSpeed * 0.6
      ;(e as any)._isBlinded = true
      ;(e as any)._blindExpires = p.scene.time.now + 2000
      e.setTint(0xddaa44)
      // Only schedule clear if not already scheduled
      if (!(e as any)._blindTimer) {
        const checkBlind = () => {
          if (!e.active) { (e as any)._blindTimer = null; return }
          if (p.scene.time.now >= (e as any)._blindExpires) {
            e.clearTint(); (e as BaseEnemy).speed = (e as BaseEnemy).baseSpeed
            ;(e as any)._isBlinded = false; (e as any)._blindTimer = null
          } else {
            (e as any)._blindTimer = p.scene.time.delayedCall(200, checkBlind)
          }
        }
        ;(e as any)._blindTimer = p.scene.time.delayedCall(200, checkBlind)
      }
    }

    // Knockback
    if (p.hasGustStrike && e.body) {
      const kb = Phaser.Math.Angle.Between(cx, cy, e.x, e.y)
      const eBody = e.body as Phaser.Physics.Arcade.Body
      eBody.velocity.x += Math.cos(kb) * 200
      eBody.velocity.y += Math.sin(kb) * 200
    }

    // Sandstorm Wall: lingering sand cloud on hit
    if (p.hasSandstormWall) {
      const cloudX = e.x, cloudY = e.y
      const cloud = p.scene.add.circle(cloudX, cloudY, 25, 0xddaa44, 0.2).setDepth(7)
      let cloudLife = 0
      const cloudTimer = p.scene.time.addEvent({
        delay: 500, loop: true,
        callback: () => {
          cloudLife += 500
          const enemies2 = (p.scene as any).enemies as Phaser.Physics.Arcade.Group
          if (enemies2) {
            for (const e2 of enemies2.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e2.active) continue
              if (Phaser.Math.Distance.Between(cloudX, cloudY, e2.x, e2.y) < 50) {
                ;(e2 as BaseEnemy).takeDamage(p.damage * 0.15 * p.getMasteryDamageMult('sand'), 'melee')
                ;(e2 as any)._isBlinded = true
                ;(e2 as any)._blindExpires = p.scene.time.now + 1500
                e2.setTint(0xddaa44)
                if (!(e2 as any)._blindTimer) {
                  const chk = () => {
                    if (!e2.active) { (e2 as any)._blindTimer = null; return }
                    if (p.scene.time.now >= (e2 as any)._blindExpires) {
                      e2.clearTint(); (e2 as any)._isBlinded = false; (e2 as any)._blindTimer = null
                      if ((e2 as BaseEnemy).baseSpeed) (e2 as BaseEnemy).speed = (e2 as BaseEnemy).baseSpeed
                    } else { (e2 as any)._blindTimer = p.scene.time.delayedCall(200, chk) }
                  }
                  ;(e2 as any)._blindTimer = p.scene.time.delayedCall(200, chk)
                }
              }
            }
          }
          if (cloudLife >= 3000) { cloudTimer.destroy(); cloud.destroy() }
        },
      })
    }

    // Hit VFX — sand burst
    for (let i = 0; i < 4; i++) {
      const pa = Math.random() * Math.PI * 2
      const pt = p.scene.add.circle(e.x, e.y, 3, 0xddaa44, 0.7).setDepth(10)
      p.scene.tweens.add({
        targets: pt, x: e.x + Math.cos(pa) * 16, y: e.y + Math.sin(pa) * 16,
        alpha: 0, duration: 250, onComplete: () => pt.destroy(),
      })
    }
    hitCount++
  }

  // Dust Devil still triggers on haboob melee hits
  if (p.hasDustDevil && hitCount > 0) {
    p.dustDevilCounter++
    if (p.dustDevilCounter >= 5) {
      p.dustDevilCounter = 0
      spawnDustDevil(p, cx, cy, angle)
    }
  }

  // Auto-complete attack after short delay
  p.scene.time.delayedCall(150, () => { p.isAttacking = false })
}

export function attackWindSlash(p: Player, target: Phaser.Physics.Arcade.Sprite, enemies: Phaser.Physics.Arcade.Group) {
  const cx = p.cx, cy = p.cy
  const angle = Phaser.Math.Angle.Between(cx, cy, target.x, target.y)
  const range = p.range
  const speed = 400
  const arcColor = 0xaaddff
  const pierceMax = p.windSlashPierce
  const hitSet = new Set<Phaser.Physics.Arcade.Sprite>()

  // Wind arc visual — crescent shape traveling forward
  const arc = p.scene.add.graphics().setDepth(10)
  const startX = cx, startY = cy
  let traveled = 0

  const arcTimer = p.scene.time.addEvent({
    delay: 16, loop: true,
    callback: () => {
      const dx = Math.cos(angle) * speed * 0.016
      const dy = Math.sin(angle) * speed * 0.016
      traveled += Math.sqrt(dx * dx + dy * dy)
      const ax = startX + Math.cos(angle) * traveled
      const ay = startY + Math.sin(angle) * traveled

      // Draw crescent arc
      arc.clear()
      arc.lineStyle(3, arcColor, Math.max(0, 1 - traveled / range))
      arc.beginPath()
      const spread = 35 * (Math.PI / 180)
      for (let i = -5; i <= 5; i++) {
        const a = angle + (i / 5) * spread
        const r = 20 + Math.abs(i) * 2
        const px = ax + Math.cos(a) * r
        const py = ay + Math.sin(a) * r
        if (i === -5) arc.moveTo(px, py)
        else arc.lineTo(px, py)
      }
      arc.strokePath()

      // Check hits
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active || hitSet.has(e)) continue
        if (Phaser.Math.Distance.Between(ax, ay, e.x, e.y) < 35) {
          let dmg = Math.ceil(p.damage * p.getMasteryDamageMult('wind'))
          // Choking Sand: +35% dmg to blinded enemies
          if (p.hasChokingSand && (e as any)._isBlinded) dmg = Math.ceil(dmg * 1.35)
          // Abrasion: +20% dmg to blinded enemies (armor shred)
          if (p.hasAbrasion && (e as any)._isBlinded) dmg = Math.ceil(dmg * 1.2)
          ;(e as BaseEnemy).takeDamage(dmg, 'melee')
          // Gust Strike: knockback
          if (p.hasGustStrike && e.body) {
            const kb = Phaser.Math.Angle.Between(cx, cy, e.x, e.y)
            const eBody = e.body as Phaser.Physics.Arcade.Body
            eBody.velocity.x += Math.cos(kb) * 150
            eBody.velocity.y += Math.sin(kb) * 150
          }
          hitSet.add(e)
          // Hit VFX
          for (let i = 0; i < 3; i++) {
            const pa = Math.random() * Math.PI * 2
            const pt = p.scene.add.circle(e.x, e.y, 2, arcColor, 0.7).setDepth(10)
            p.scene.tweens.add({
              targets: pt, x: e.x + Math.cos(pa) * 12, y: e.y + Math.sin(pa) * 12,
              alpha: 0, duration: 200, onComplete: () => pt.destroy(),
            })
          }
          if (hitSet.size >= pierceMax) break
        }
      }

      if (traveled >= range || hitSet.size >= pierceMax) {
        arcTimer.destroy()
        arc.destroy()
        p.isAttacking = false
      }
    },
  })

  // Dust Devil mechanic
  if (p.hasDustDevil) {
    p.dustDevilCounter++
    if (p.dustDevilCounter >= 5) {
      p.dustDevilCounter = 0
      spawnDustDevil(p, cx, cy, angle)
    }
  }
}

export function spawnDustDevil(p: Player, x: number, y: number, angle: number) {
  const radius = p.hasCycloneSurge ? 52 : 35
  const duration = p.hasCycloneSurge ? 3000 : 2000
  const speed = 100
  const dmg = Math.ceil(p.damage * 0.3)
  const tornado = p.scene.add.graphics().setDepth(9)
  let elapsed = 0
  const enemies = (p.scene as any).enemies as Phaser.Physics.Arcade.Group

  const timer = p.scene.time.addEvent({
    delay: 16, loop: true,
    callback: () => {
      elapsed += 16
      const tx = x + Math.cos(angle) * speed * (elapsed / 1000)
      const ty = y + Math.sin(angle) * speed * (elapsed / 1000)
      tornado.clear()
      tornado.lineStyle(2, 0xaaddff, Math.max(0, 1 - elapsed / duration))
      for (let i = 0; i < 3; i++) {
        const a = (elapsed / 100) + (i * Math.PI * 2 / 3)
        const r = radius * (0.3 + i * 0.25)
        tornado.strokeCircle(tx + Math.cos(a) * r * 0.3, ty + Math.sin(a) * r * 0.3, r * 0.4)
      }
      // Damage nearby enemies
      if (enemies) {
        for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) < radius) {
            ;(e as BaseEnemy).takeDamage?.(dmg * 0.016 * 4, 'melee')
          }
        }
      }
      if (elapsed >= duration) {
        timer.destroy()
        tornado.destroy()
      }
    },
  })
}

export function updateKhashinPassives(p: Player, delta: number, moving: boolean) {
  const regenAmt = p.energyRegenRate * (delta / 1000)
  if (p.khashinStance === 'sirocco') {
    p.sandEnergy = Math.min(p.maxEnergy, p.sandEnergy + regenAmt)
  } else {
    p.windEnergy = Math.min(p.maxEnergy, p.windEnergy + regenAmt)
  }

  const scene = p.scene as any
  const enemies = scene.enemies as Phaser.Physics.Arcade.Group | undefined

  // Sand Armor regen
  if (p.hasSandArmor && (p as any)._sandArmorMax) {
    if ((p as any)._sandArmorRegenDelay > 0) {
      (p as any)._sandArmorRegenDelay -= delta
    } else if ((p as any)._sandArmorHP < (p as any)._sandArmorMax) {
      (p as any)._sandArmorHP = Math.min((p as any)._sandArmorMax,
        (p as any)._sandArmorHP + (p as any)._sandArmorMax * 0.1 * (delta / 1000))
    }
  }

  // Eye of the Storm: anchored tornado every 8s
  if (p.hasEyeOfTheStorm && enemies) {
    p.eyeOfStormTimer += delta
    if (p.eyeOfStormTimer >= 8000) {
      p.eyeOfStormTimer = 0
      const tx = p.cx, ty = p.cy
      const stormGfx = p.scene.add.graphics().setDepth(9)
      let elapsed = 0
      const timer = p.scene.time.addEvent({
        delay: 16, loop: true,
        callback: () => {
          elapsed += 16
          stormGfx.clear()
          stormGfx.lineStyle(2, 0x88ddff, Math.max(0, 1 - elapsed / 4000))
          for (let i = 0; i < 4; i++) {
            const a = (elapsed / 80) + (i * Math.PI / 2)
            const r = 30 + i * 12
            stormGfx.strokeCircle(tx + Math.cos(a) * 10, ty + Math.sin(a) * 10, r)
          }
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) < 80) {
              ;(e as BaseEnemy).takeDamage?.(p.damage * 0.5 * 0.016 * 4, 'melee')
            }
          }
          if (elapsed >= 4000) { timer.destroy(); stormGfx.destroy() }
        },
      })
    }
  }

  // Phantom Step: auto-dash away every 6s
  if (p.hasPhantomStep) {
    p.phantomStepTimer += delta
    if (p.phantomStepTimer >= 6000 && enemies) {
      p.phantomStepTimer = 0
      let nearest: Phaser.Physics.Arcade.Sprite | null = null
      let nearDist = Infinity
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)
        if (d < nearDist && d < 120) { nearDist = d; nearest = e }
      }
      if (nearest) {
        const awayAngle = Phaser.Math.Angle.Between(nearest.x, nearest.y, p.x, p.y)
        const oldX = p.x, oldY = p.y
        p.setPosition(
          p.x + Math.cos(awayAngle) * 100,
          p.y + Math.sin(awayAngle) * 100
        )
        // Mirage: leave decoy
        if (p.hasMirage) {
          const decoy = p.scene.add.circle(oldX, oldY, 14, 0x88ddff, 0.4).setDepth(8)
          p.scene.tweens.add({ targets: decoy, alpha: 0, scale: 0.5, duration: 2000, onComplete: () => decoy.destroy() })
          // Enemies near decoy retarget
          for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
            if (!e.active) continue
            if (Phaser.Math.Distance.Between(oldX, oldY, e.x, e.y) < 120) {
              p.scene.physics.moveTo(e, oldX, oldY, (e as BaseEnemy).speed || 80)
            }
          }
        }
        // Dash VFX
        const dashLine = p.scene.add.graphics().setDepth(10)
        dashLine.lineStyle(2, 0xaaddff, 0.5)
        dashLine.lineBetween(oldX, oldY, p.x, p.y)
        p.scene.tweens.add({ targets: dashLine, alpha: 0, duration: 300, onComplete: () => dashLine.destroy() })
      }
    }
  }

  // Drift: leave slow trails while moving
  if (p.hasDrift && moving) {
    p.driftTimer += delta
    if (p.driftTimer >= 150) {
      p.driftTimer = 0
      const dx = p.cx, dy = p.cy
      const trail = p.scene.add.circle(dx, dy, 10, 0x88ddff, 0.15).setDepth(3)
      let trailLife = 0
      const trailTimer = p.scene.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          trailLife += 100
          if (enemies) {
            for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active || !(e as BaseEnemy).speed || !(e as BaseEnemy).baseSpeed) continue
              if (Phaser.Math.Distance.Between(dx, dy, e.x, e.y) < 20) {
                (e as BaseEnemy).speed = (e as BaseEnemy).baseSpeed * 0.6
                p.scene.time.delayedCall(1500, () => {
                  if ((e as BaseEnemy).active && !(e as BaseEnemy).isDying) {
                    (e as BaseEnemy).speed = (e as BaseEnemy).baseSpeed
                  }
                })
              }
            }
          }
          if (trailLife >= 600) { trailTimer.destroy(); trail.destroy() }
        },
      })
    }
  }

  // Desert Wind: omni-burst every 10s
  if (p.hasDesertWind && enemies) {
    p.desertWindTimer += delta
    if (p.desertWindTimer >= 10000) {
      p.desertWindTimer = 0
      const burst = p.scene.add.circle(p.cx, p.cy, 20, 0xaaddff, 0.3).setDepth(10)
      p.scene.tweens.add({
        targets: burst, scaleX: 9, scaleY: 9, alpha: 0, duration: 500,
        onComplete: () => burst.destroy(),
      })
      for (const e of enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if (Phaser.Math.Distance.Between(p.cx, p.cy, e.x, e.y) < 180) {
          const kb = Phaser.Math.Angle.Between(p.cx, p.cy, e.x, e.y)
          if (e.body) {
            const eBody = e.body as Phaser.Physics.Arcade.Body
            eBody.velocity.x = Math.cos(kb) * 300
            eBody.velocity.y = Math.sin(kb) * 300
          }
        }
      }
      // 3s damage reduction — stored as temp armor boost
      const oldArmor = p.armor
      p.armor = Math.min(0.7, p.armor + 0.5)
      p.scene.time.delayedCall(3000, () => { p.armor = oldArmor })
    }
  }

  // Scarab Tide: on kill, spawn 4 seeking blind scarabs
  if (p.hasScarabTide && enemies) {
    if (!(p as any)._scarabs) (p as any)._scarabs = [] as Phaser.GameObjects.Arc[]

    // Listen for enemy deaths via scene event (register once)
    if (!(p as any)._scarabDeathListener) {
      const onEnemyDied = (ex: number, ey: number) => {
        if (!p.hasScarabTide) return
        // Prune dead scarabs (always read from the property, not the stale local ref)
        const alive = ((p as any)._scarabs as any[] || []).filter(s => s.active)
        ;(p as any)._scarabs = alive
        if (alive.length >= 8) return  // cap at 8

        const scene = p.scene as any
        const scarabEnemies = scene.enemies as Phaser.Physics.Arcade.Group | undefined
        for (let i = 0; i < 4 && alive.length < 8; i++) {
          const angle = (i / 4) * Math.PI * 2
          const scarab = p.scene.add.circle(
            ex + Math.cos(angle) * 8, ey + Math.sin(angle) * 8,
            4, 0xcc8800, 1
          ).setDepth(10)
          alive.push(scarab)

          // Seek nearest enemy
          const scarabSpeed = 250
          let targetEnemy: Phaser.Physics.Arcade.Sprite | null = null
          if (scarabEnemies) {
            let nearDist = Infinity
            for (const candidate of scarabEnemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!candidate.active) continue
              const d = Phaser.Math.Distance.Between(scarab.x, scarab.y, candidate.x, candidate.y)
              if (d < 200 && d < nearDist) { nearDist = d; targetEnemy = candidate }
            }
          }

          if (!targetEnemy) { scarab.destroy(); continue }

          let tgt: Phaser.Physics.Arcade.Sprite = targetEnemy
          const seekTimer = p.scene.time.addEvent({
            delay: 16, loop: true,
            callback: () => {
              if (!scarab.active) { seekTimer.destroy(); return }
              if (!tgt.active) {
                // Retarget
                let newTarget: Phaser.Physics.Arcade.Sprite | null = null
                let nearDist2 = Infinity
                if (scarabEnemies) {
                  for (const candidate of scarabEnemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
                    if (!candidate.active) continue
                    const d = Phaser.Math.Distance.Between(scarab.x, scarab.y, candidate.x, candidate.y)
                    if (d < 200 && d < nearDist2) { nearDist2 = d; newTarget = candidate }
                  }
                }
                if (!newTarget) { scarab.destroy(); seekTimer.destroy(); return }
                tgt = newTarget  // retarget to new enemy
              }
              const moveTarget = tgt?.active ? tgt : null
              if (!moveTarget) { scarab.destroy(); seekTimer.destroy(); return }

              const dx = moveTarget.x - scarab.x
              const dy = moveTarget.y - scarab.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 8) {
                // Hit — apply blind
                const now = p.scene.time.now
                ;(moveTarget as any)._isBlinded = true
                ;(moveTarget as any)._blindExpires = now + 1500
                moveTarget.setTint(0xddaa44)
                if (!(moveTarget as any)._blindTimer) {
                  const checkBlind = () => {
                    if (!moveTarget.active) { (moveTarget as any)._blindTimer = null; return }
                    if (p.scene.time.now >= (moveTarget as any)._blindExpires) {
                      moveTarget.clearTint();
                      (moveTarget as any)._isBlinded = false;
                      (moveTarget as any)._blindTimer = null
                    } else {
                      (moveTarget as any)._blindTimer = p.scene.time.delayedCall(200, checkBlind)
                    }
                  }
                  ;(moveTarget as any)._blindTimer = p.scene.time.delayedCall(200, checkBlind)
                }
                scarab.destroy()
                seekTimer.destroy()
              } else {
                scarab.x += (dx / dist) * scarabSpeed * 0.016
                scarab.y += (dy / dist) * scarabSpeed * 0.016
              }
            },
          })

          // Destroy after 5s if not hit
          p.scene.time.delayedCall(5000, () => { if (scarab.active) scarab.destroy() })
        }
      }
      ;(p as any)._scarabDeathListener = onEnemyDied
      p.scene.events.on('enemy-died', onEnemyDied)
    }
  }
}
