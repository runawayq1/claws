import Phaser from 'phaser'
import BaseEnemy, { type DamageType } from './BaseEnemy'
import { spawnTrailCircle } from '../utils/trailPool'

type PlayerLike = Phaser.Physics.Arcade.Sprite & {
  takeDamage(amount: number): void
  isDead?: boolean
  maxHp: number
  hp: number
}

/**
 * EyeBoss — "The All-Seeing Eye"
 * Giant floating eye, 5× the FlyingEye miniboss scale. Pure ranged combat:
 * shoots mini-eye projectiles, never engages in melee. Three phases with
 * escalating attack patterns.
 */
export class EyeBoss extends BaseEnemy {
  public isBoss = true

  private phase = 1
  private _bossSpawning = true

  // VFX
  private shadow!: Phaser.GameObjects.Ellipse
  private aura1!: Phaser.GameObjects.Arc
  private aura2!: Phaser.GameObjects.Arc
  private auraTweens: Phaser.Tweens.Tween[] = []
  private wobbleTween: Phaser.Tweens.Tween | null = null

  // Cooldowns (ms remaining)
  private _boltCd = 0
  private _tripleCd = 0
  private _ringCd = 0
  private _blinkCd = 0

  private _rageUntil = 0
  private _intangibleUntil = 0

  // Projectile speed constants
  private readonly PROJ_SPEED = 260
  private readonly PROJ_LIFETIME = 3200

  constructor(scene: Phaser.Scene, x: number, y: number, player: PlayerLike) {
    super(scene, x, y, 'flyingeye_attack', player as any)

    // Stats
    this.maxHp = 4500
    this.hp = 4500
    this.speed = 0                  // restored after spawn
    this.baseSpeed = 40
    this.xpValue = 500
    this.goldValue = 200
    this.kbForce = 0
    this.kbRestoreDuration = 0
    this.attackRange = 0            // no base melee
    this.damagePerSecond = 0
    this.usesSteering = false       // floats over rocks
    this.isLarge = true
    this.shakeIntensity = 200
    this.shakeAmplitude = 0.015
    this.dmgTextSize = '18px'
    this.dmgTextYOffset = -60

    // Add to scene physics BEFORE body-dependent calls
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Visual setup — body must exist for setBodySize
    this.setScale(5)
    this.setDepth(15)
    this.baseTint = 0xcc3333
    this.setTint(this.baseTint)
    this.setBodySize(60, 60)
    this.setOffset(45, 45)
    this.setAlpha(0)

    // Shadow under the eye
    this.shadow = scene.add.ellipse(x, y + 120, 200, 40, 0x000000, 0.35).setDepth(14)

    // Pulsing red aura — 2 layered circles
    this.aura1 = scene.add.circle(x, y, 220, 0xff3333, 0.22).setDepth(4)
      .setBlendMode(Phaser.BlendModes.ADD)
    this.aura2 = scene.add.circle(x, y, 140, 0xff6666, 0.30).setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD)
    this.auraTweens.push(scene.tweens.add({
      targets: this.aura1,
      scale: { from: 0.9, to: 1.25 },
      alpha: { from: 0.25, to: 0.08 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    }))
    this.auraTweens.push(scene.tweens.add({
      targets: this.aura2,
      scale: { from: 1, to: 1.4 },
      alpha: { from: 0.35, to: 0.12 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    }))

    // Spawn sequence — fade in + scale up from tiny
    this.setScale(0.5)
    this.play('flyingeye_run')
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 5,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (!this.active) return
        this._bossSpawning = false
        this.speed = this.baseSpeed

        // Idle y-wobble
        this.wobbleTween = scene.tweens.add({
          targets: this,
          y: y + 12,
          duration: 1800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })

        scene.events.emit('boss-spawned', this)
      },
    })
  }

  // -------------------------------------------------------------------------
  // takeDamage — intangible during rage / spawn, emit HP, phase check
  // -------------------------------------------------------------------------
  takeDamage(amount: number, type?: DamageType) {
    if (this._bossSpawning) return
    if (this._rageUntil > 0 && this.scene.time.now < this._rageUntil) return
    if (this._intangibleUntil > 0 && this.scene.time.now < this._intangibleUntil) return
    super.takeDamage(amount, type)
    this.scene.events.emit('boss-hp', this.hp, this.maxHp)
    this._checkPhase()
  }

  private _checkPhase() {
    const pct = this.hp / this.maxHp
    if (this.phase === 1 && pct <= 0.6) this._enterPhase2()
    else if (this.phase === 2 && pct <= 0.3) this._enterPhase3()
  }

  private _enterPhase2() {
    this.phase = 2
    this._intangibleUntil = this.scene.time.now + 1000
    this.scene.cameras.main.flash(500, 120, 0, 0)
    this.scene.cameras.main.shake(400, 0.015)
    this.scene.events.emit('boss-phase', 2)
    this.scene.events.emit('boss-spawn-minions', 4)
    // Kick off ring burst cooldown slightly ahead so it doesn't fire immediately
    this._ringCd = 3000
  }

  private _enterPhase3() {
    this.phase = 3
    this._rageUntil = this.scene.time.now + 1500
    this.scene.cameras.main.flash(800, 200, 0, 0)
    this.scene.cameras.main.shake(600, 0.025)
    this.scene.events.emit('boss-phase', 3)
    this.setTintFill(0xff2222)
    this._blinkCd = 4000
    this.scene.time.delayedCall(1500, () => {
      if (this.active) {
        this.clearTint()
        this.setTint(this.baseTint)
        this._rageUntil = 0
      }
    })
  }

  // -------------------------------------------------------------------------
  // Per-frame update (called from BaseEnemy.update)
  // -------------------------------------------------------------------------
  protected onUpdate(_time: number, delta: number): void {
    if (this._bossSpawning) return

    // Sync shadow + auras to current position
    this.shadow.setPosition(this.x, this.y + 120)
    this.aura1.setPosition(this.x, this.y)
    this.aura2.setPosition(this.x, this.y)

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)

    // Contact DPS — 15% maxHP/s within 80px (not insta-kill)
    if (dist < 80 && !this.player.isDead) {
      const contactDps = (this.player as PlayerLike).maxHp * 0.15
      ;(this.player as PlayerLike).takeDamage(contactDps * (delta / 1000))
    }

    // Distance keeping — override base moveTo
    if (dist < 220) {
      // Drift away
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y)
      this.scene.physics.moveTo(this, this.x + Math.cos(angle) * 200, this.y + Math.sin(angle) * 200, this.speed)
    } else if (dist > 600) {
      // Close the gap faster
      this.scene.physics.moveTo(this, this.player.x, this.player.y, this.speed * 1.3)
    }
    // Otherwise BaseEnemy already moved toward player

    // Decrement cooldowns
    this._boltCd = Math.max(0, this._boltCd - delta)
    this._tripleCd = Math.max(0, this._tripleCd - delta)
    if (this.phase >= 2) this._ringCd = Math.max(0, this._ringCd - delta)
    if (this.phase >= 3) this._blinkCd = Math.max(0, this._blinkCd - delta)

    // Per-phase attack timings
    const boltCd = this.phase === 3 ? 700 : this.phase === 2 ? 1000 : 1500
    if (this._boltCd === 0) {
      this._boltCd = boltCd
      this._doEyeBolt()
    }

    const tripleCd = this.phase === 3 ? 4000 : this.phase === 2 ? 5000 : 6000
    if (this._tripleCd === 0) {
      this._tripleCd = tripleCd
      this._doTripleLock()
    }

    if (this.phase >= 2 && this._ringCd === 0) {
      this._ringCd = this.phase === 3 ? 5000 : 8000
      this._doRingBurst()
    }

    if (this.phase >= 3 && this._blinkCd === 0) {
      this._blinkCd = 10000
      this._doBlinkGaze()
    }
  }

  // -------------------------------------------------------------------------
  // Abilities
  // -------------------------------------------------------------------------

  private _doEyeBolt() {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
    const dmgPct = this.phase === 3 ? 0.15 : this.phase === 2 ? 0.14 : 0.12
    const dmg = Math.ceil((this.player as PlayerLike).maxHp * dmgPct)
    const homing = this.phase === 3
    this._fireEyeProjectile(angle, dmg, homing)
  }

  private _doTripleLock() {
    const count = this.phase === 3 ? 7 : this.phase === 2 ? 5 : 3
    const spread = Phaser.Math.DegToRad(30 + count * 4)    // wider with more shots
    const base = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
    const dmg = Math.ceil((this.player as PlayerLike).maxHp * 0.08)

    // Telegraph — brief white flash before firing
    this.setTintFill(0xffffff)
    this.scene.time.delayedCall(250, () => {
      if (!this.active || this.isDying) return
      if (this._rageUntil === 0) { this.clearTint(); this.setTint(this.baseTint) }
      for (let i = 0; i < count; i++) {
        const offset = ((i / (count - 1)) - 0.5) * spread
        this._fireEyeProjectile(base + offset, dmg, false)
      }
    })
  }

  private _doRingBurst() {
    const count = this.phase === 3 ? 12 : 8
    const dmg = Math.ceil((this.player as PlayerLike).maxHp * 0.10)

    // Charge-up pulse
    const pulse = this.scene.add.circle(this.x, this.y, 60, 0xff3333, 0.6)
      .setDepth(14).setBlendMode(Phaser.BlendModes.ADD)
    this.scene.tweens.add({
      targets: pulse,
      scale: 3.5,
      alpha: 0,
      duration: 400,
      onComplete: () => pulse.destroy(),
    })
    this.scene.cameras.main.shake(150, 0.008)

    this.scene.time.delayedCall(400, () => {
      if (!this.active || this.isDying) return
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        this._fireEyeProjectile(angle, dmg, false)
      }
    })
  }

  private _doBlinkGaze() {
    // Fade out, teleport, fade in, then fire a sweeping beam
    const playerX = this.player.x
    const playerY = this.player.y
    const teleAngle = Math.random() * Math.PI * 2
    const tx = playerX + Math.cos(teleAngle) * 320
    const ty = playerY + Math.sin(teleAngle) * 320

    if (this.wobbleTween) { this.wobbleTween.stop(); this.wobbleTween = null }
    this._intangibleUntil = this.scene.time.now + 1200

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        if (!this.active || this.isDying) return
        this.setPosition(tx, ty)
        ;(this.body as Phaser.Physics.Arcade.Body).reset(tx, ty)
        // Eye blink squash
        this.setScale(5, 0.2)
        this.scene.tweens.add({
          targets: this,
          scaleY: 5,
          alpha: 1,
          duration: 250,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (!this.active || this.isDying) return
            this._fireSweepBeam()
            // Restart wobble
            this.wobbleTween = this.scene.tweens.add({
              targets: this,
              y: this.y + 12,
              duration: 1800,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })
          },
        })
      },
    })
  }

  private _fireSweepBeam() {
    // A thick red laser line from boss to player's direction, sweeping 40° over 1.5s
    const BEAM_LEN = 900
    const BEAM_DUR = 1500
    const SWEEP_RAD = Phaser.Math.DegToRad(40)
    const tickDmg = ((this.player as PlayerLike).maxHp * 0.30) / (BEAM_DUR / 100)

    const startAngle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y) - SWEEP_RAD / 2
    let curAngle = startAngle
    let elapsed = 0

    const beamGfx = this.scene.add.graphics().setDepth(16)
    const beamState = { angle: curAngle }

    const tween = this.scene.tweens.add({
      targets: beamState,
      angle: startAngle + SWEEP_RAD,
      duration: BEAM_DUR,
      ease: 'Sine.easeInOut',
    })

    const updateBeam = (_time: number, delta: number) => {
      if (!this.active || this.isDying) {
        beamGfx.destroy()
        tween.stop()
        this.scene.events.off('update', updateBeam)
        return
      }
      elapsed += delta
      curAngle = beamState.angle

      // Draw beam: thick red line + bright core
      const ex = this.x + Math.cos(curAngle) * BEAM_LEN
      const ey = this.y + Math.sin(curAngle) * BEAM_LEN
      beamGfx.clear()
      beamGfx.lineStyle(26, 0xff2222, 0.5)
      beamGfx.beginPath(); beamGfx.moveTo(this.x, this.y); beamGfx.lineTo(ex, ey); beamGfx.strokePath()
      beamGfx.lineStyle(10, 0xff6666, 0.85)
      beamGfx.beginPath(); beamGfx.moveTo(this.x, this.y); beamGfx.lineTo(ex, ey); beamGfx.strokePath()
      beamGfx.lineStyle(3, 0xffffff, 1)
      beamGfx.beginPath(); beamGfx.moveTo(this.x, this.y); beamGfx.lineTo(ex, ey); beamGfx.strokePath()

      // Hit check: distance from player to the beam line (point-to-line)
      const scene = this.scene as any
      const players = (scene.players || [this.player]) as PlayerLike[]
      for (const p of players) {
        if (p.isDead) continue
        // vector from boss to player
        const px = p.x - this.x
        const py = p.y - this.y
        const dirX = Math.cos(curAngle)
        const dirY = Math.sin(curAngle)
        const proj = px * dirX + py * dirY
        if (proj < 0 || proj > BEAM_LEN) continue
        const perpX = px - dirX * proj
        const perpY = py - dirY * proj
        const perpDist = Math.sqrt(perpX * perpX + perpY * perpY)
        if (perpDist < 26) {
          p.takeDamage(tickDmg * (delta / 100))
        }
      }

      if (elapsed >= BEAM_DUR) {
        this.scene.events.off('update', updateBeam)
        this.scene.tweens.add({
          targets: beamGfx,
          alpha: 0,
          duration: 200,
          onComplete: () => beamGfx.destroy(),
        })
      }
    }
    this.scene.events.on('update', updateBeam)
  }

  // -------------------------------------------------------------------------
  // Projectile creation — reuses Archer pattern (manual update listener)
  // -------------------------------------------------------------------------
  private _fireEyeProjectile(angle: number, damage: number, homing: boolean) {
    const scene = this.scene as any
    const vx = Math.cos(angle) * this.PROJ_SPEED
    const vy = Math.sin(angle) * this.PROJ_SPEED

    // Mini eye — reuse flying eye sprite at small scale with red tint
    const proj = scene.add.sprite(this.x, this.y, 'flyingeye_attack')
      .setScale(0.4)
      .setTint(0xff4444)
      .setDepth(7)
    if (scene.anims.exists('flyingeye_run')) proj.play('flyingeye_run')
    scene.physics.add.existing(proj)
    const body = proj.body as Phaser.Physics.Arcade.Body
    body.setVelocity(vx, vy)

    // Inner red glow pulse
    const glow = scene.add.circle(this.x, this.y, 18, 0xff2222, 0.55)
      .setDepth(6).setBlendMode(Phaser.BlendModes.ADD)
    scene.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.55, to: 0.25 },
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const spawnTime = scene.time.now
    const hitDistance = 26
    let lastTrailTime = 0
    const HOMING_DURATION = 800

    const updateListener = (_t: number, _dt: number) => {
      if (!proj.active) return
      const life = scene.time.now - spawnTime

      // Timeout
      if (life > this.PROJ_LIFETIME) {
        proj.destroy()
        return
      }

      // Homing steering for first 800ms of flight
      if (homing && life < HOMING_DURATION && !this.player.isDead) {
        const desiredAngle = Phaser.Math.Angle.Between(proj.x, proj.y, this.player.x, this.player.y)
        const curAngle = Math.atan2(body.velocity.y, body.velocity.x)
        // Steer a fraction of the way per frame
        const diff = Phaser.Math.Angle.Wrap(desiredAngle - curAngle)
        const steer = Phaser.Math.Clamp(diff, -0.08, 0.08)
        const newAngle = curAngle + steer
        body.setVelocity(
          Math.cos(newAngle) * this.PROJ_SPEED,
          Math.sin(newAngle) * this.PROJ_SPEED
        )
      }

      // Sync glow to projectile
      glow.setPosition(proj.x, proj.y)

      // Trail — every 30ms spawn a fading red circle via pool
      if (scene.time.now - lastTrailTime > 30) {
        lastTrailTime = scene.time.now
        const trail = spawnTrailCircle(scene, proj.x, proj.y, 8, 0xff3333, 0.55)
        scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.3,
          duration: 300,
          onComplete: () => { trail.setActive(false); trail.setVisible(false) },
        })
      }

      // Hit check against all alive players
      const players: PlayerLike[] = (scene as any).players || [this.player]
      for (const p of players) {
        if (p.isDead) continue
        const d = Phaser.Math.Distance.Between(proj.x, proj.y, p.x, p.y)
        if (d <= hitDistance) {
          p.takeDamage(damage)
          // Impact flash
          const flash = scene.add.circle(proj.x, proj.y, 14, 0xff6666, 0.95)
            .setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
          scene.tweens.add({
            targets: flash, scale: 2.5, alpha: 0, duration: 240,
            onComplete: () => flash.destroy(),
          })
          proj.destroy()
          return
        }
      }
    }

    scene.events.on('update', updateListener)
    proj.on('destroy', () => {
      scene.events.off('update', updateListener)
      if (glow.active) glow.destroy()
    })
  }

  // -------------------------------------------------------------------------
  // Death VFX — destroy shadow/aura, scale-up-fade, particle burst
  // -------------------------------------------------------------------------
  protected onDeathVfx(onComplete: () => void): void {
    if (this.wobbleTween) { this.wobbleTween.stop(); this.wobbleTween = null }
    for (const t of this.auraTweens) t.stop()
    this.shadow.destroy()
    this.aura1.destroy()
    this.aura2.destroy()
    this.scene.cameras.main.shake(800, 0.03)
    this.scene.cameras.main.flash(500, 255, 100, 100)
    this.scene.events.emit('boss-defeated')

    // Scale up + fade out
    this.setTintFill(0xffffff)
    this.scene.tweens.add({
      targets: this,
      scale: 6.5,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete,
    })

    // Red eye particle burst
    for (let i = 0; i < 25; i++) {
      this.scene.time.delayedCall(i * 40, () => {
        if (!this.scene) return
        const c = this.scene.add.circle(
          this.x + Phaser.Math.Between(-120, 120),
          this.y + Phaser.Math.Between(-90, 90),
          Phaser.Math.Between(8, 18),
          ([0xff2222, 0xff6666, 0xffaa44, 0xffffff] as number[])[Phaser.Math.Between(0, 3)]
        ).setDepth(20).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.tweens.add({
          targets: c,
          y: c.y - Phaser.Math.Between(60, 140),
          alpha: 0,
          scale: 0.3,
          duration: 900,
          onComplete: () => c.destroy(),
        })
      })
    }
  }
}
