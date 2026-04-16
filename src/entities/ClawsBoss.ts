import Phaser from 'phaser'
import BaseEnemy, { type DamageType } from './BaseEnemy'

type PlayerLike = Phaser.Physics.Arcade.Sprite & { takeDamage(amount: number): void; isDead?: boolean; maxHp: number; hp: number }

export class ClawsBoss extends BaseEnemy {
  // Boss config
  public isBoss = true

  // Phase tracking
  private phase = 1
  private _bossSpawning = true

  // Shadow
  private shadow: Phaser.GameObjects.Ellipse

  // Skill cooldowns (ms remaining)
  private _cleaveCd = 0
  private _slamCd = 0
  private _dashCd = 0
  private _burstCd = 0

  // Rage invulnerability timestamp
  private _rageUntil = 0

  constructor(scene: Phaser.Scene, x: number, y: number, player: PlayerLike) {
    super(scene, x, y, 'boss_demon', player as any)

    // Stats
    this.maxHp = 4000
    this.hp = 4000
    this.speed = 0          // restored after spawn animation
    this.baseSpeed = 80
    this.xpValue = 500
    this.goldValue = 200
    this.kbForce = 0
    this.kbRestoreDuration = 0
    this.attackRange = 0    // disable base melee check — all combat in onUpdate
    this.damagePerSecond = 0
    this.usesSteering = false
    this.isLarge = true
    this.shakeIntensity = 200
    this.shakeAmplitude = 0.015
    this.dmgTextSize = '18px'
    this.dmgTextYOffset = -40

    // Add to scene physics BEFORE body-dependent calls
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Visual setup (body must exist before setBodySize/setOffset)
    this.setScale(3)
    this.setDepth(15)
    this.setBodySize(60, 50)
    this.setOffset(114, 70)
    this.setAlpha(0)

    // Shadow
    this.shadow = scene.add.ellipse(x, y, 80, 24, 0x000000, 0.35).setDepth(14)

    // Register animations (guarded — only create once per scene)
    if (!scene.anims.exists('boss_idle')) {
      scene.anims.create({ key: 'boss_idle', frames: scene.anims.generateFrameNumbers('boss_demon', { start: 0, end: 5 }), frameRate: 8, repeat: -1 })
      scene.anims.create({ key: 'boss_walk', frames: scene.anims.generateFrameNumbers('boss_demon', { start: 6, end: 17 }), frameRate: 10, repeat: -1 })
      scene.anims.create({ key: 'boss_cleave', frames: scene.anims.generateFrameNumbers('boss_demon', { start: 18, end: 32 }), frameRate: 12, repeat: 0 })
      scene.anims.create({ key: 'boss_hit', frames: scene.anims.generateFrameNumbers('boss_demon', { start: 33, end: 37 }), frameRate: 8, repeat: 0 })
      scene.anims.create({ key: 'boss_death', frames: scene.anims.generateFrameNumbers('boss_demon', { start: 38, end: 59 }), frameRate: 10, repeat: 0 })
    }
    if (!scene.anims.exists('boss_spawn')) {
      const spawnFrames: Phaser.Types.Animations.AnimationFrame[] = []
      for (let f = 59; f >= 38; f--) spawnFrames.push({ key: 'boss_demon', frame: f })
      scene.anims.create({ key: 'boss_spawn', frames: spawnFrames, frameRate: 10, repeat: 0 })
    }

    // Spawn sequence: play reversed-death anim while fading in
    console.log('[BOSS] ClawsBoss: playing boss_spawn animation')
    this.play('boss_spawn')
    scene.tweens.add({ targets: this, alpha: 1, duration: 600, ease: 'Linear' })

    this.once('animationcomplete', () => {
      console.log('[BOSS] ClawsBoss: spawn animation complete, active=', this.active)
      if (!this.active) return
      this._bossSpawning = false
      this.speed = 80
      this.baseSpeed = 80
      this.play('boss_idle')
      scene.time.delayedCall(400, () => {
        if (this.active) this.play('boss_walk')
      })
      // Notify UIScene to show the boss bar
      scene.events.emit('boss-spawned', this)
    })
  }

  // -------------------------------------------------------------------------
  // Override takeDamage — add phase check and emit HP event
  // -------------------------------------------------------------------------
  takeDamage(amount: number, type?: DamageType) {
    // Immune during Phase 3 rage entry
    if (this._rageUntil > 0 && this.scene.time.now < this._rageUntil) return
    super.takeDamage(amount, type)
    this.scene.events.emit('boss-hp', this.hp, this.maxHp)
    this._checkPhase()
  }

  // -------------------------------------------------------------------------
  // Phase transitions
  // -------------------------------------------------------------------------
  private _checkPhase() {
    const pct = this.hp / this.maxHp
    if (this.phase === 1 && pct <= 0.6) this._enterPhase2()
    else if (this.phase === 2 && pct <= 0.3) this._enterPhase3()
  }

  private _enterPhase2() {
    this.phase = 2
    this.speed = 120
    this.baseSpeed = 120
    this._dashCd = 3000
    this.scene.cameras.main.flash(500, 120, 0, 0)
    this.scene.cameras.main.shake(400, 0.015)
    this.scene.events.emit('boss-phase', 2)
    this.scene.events.emit('boss-spawn-minions', 5)
  }

  private _enterPhase3() {
    this.phase = 3
    this.speed = 160
    this.baseSpeed = 160
    this._rageUntil = this.scene.time.now + 1500
    this.scene.cameras.main.flash(800, 200, 0, 0)
    this.scene.cameras.main.shake(600, 0.025)
    this.scene.events.emit('boss-phase', 3)
    this.setTintFill(0xff2222)
    this.scene.time.delayedCall(1500, () => {
      if (this.active) {
        this.clearTint()
        this._rageUntil = 0
      }
    })
  }

  // -------------------------------------------------------------------------
  // Per-frame update hook (called by BaseEnemy.update)
  // -------------------------------------------------------------------------
  protected onUpdate(_time: number, delta: number): void {
    if (this._bossSpawning) return

    // Keep shadow at feet
    this.shadow.setPosition(this.x, (this.body as Phaser.Physics.Arcade.Body).bottom)

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)

    // Contact = instant kill
    if (dist < 50) {
      (this.player as PlayerLike).takeDamage(99999)
      return
    }

    // Decrement cooldowns
    this._cleaveCd = Math.max(0, this._cleaveCd - delta)
    this._slamCd = Math.max(0, this._slamCd - delta)
    if (this.phase >= 2) this._dashCd = Math.max(0, this._dashCd - delta)
    if (this.phase >= 3) this._burstCd = Math.max(0, this._burstCd - delta)

    // Cleave (melee swing) — range 130px
    const cleaveCd = this.phase === 3 ? 1500 : this.phase === 2 ? 2000 : 2500
    if (dist < 130 && this._cleaveCd === 0) {
      this._cleaveCd = cleaveCd
      this._doCleave()
    }

    // Ground Slam — range 110px
    const slamCd = this.phase === 3 ? 3000 : this.phase === 2 ? 4000 : 5000
    if (dist < 110 && this._slamCd === 0) {
      this._slamCd = slamCd
      this._doSlam()
    }

    // Void Dash — phase 2+
    if (this.phase >= 2 && this._dashCd === 0) {
      this._dashCd = 8000
      this._doVoidDash()
    }

    // Void Burst — phase 3
    if (this.phase >= 3 && this._burstCd === 0) {
      this._burstCd = 6000
      this._doVoidBurst()
    }
  }

  // -------------------------------------------------------------------------
  // Abilities
  // -------------------------------------------------------------------------
  private _doCleave() {
    const dmgPct = this.phase === 3 ? 0.45 : this.phase === 2 ? 0.40 : 0.35
    const dmg = Math.ceil((this.player as PlayerLike).maxHp * dmgPct)
    this.play('boss_cleave')
    this.once('animationcomplete', () => { if (this.active) this.play('boss_walk') })
    ;(this.player as PlayerLike).takeDamage(dmg)
    this.scene.cameras.main.shake(200, 0.010)
  }

  private _doSlam() {
    const radius = 90
    const dmgPct = this.phase === 3 ? 0.35 : this.phase === 2 ? 0.30 : 0.25
    const dmg = Math.ceil((this.player as PlayerLike).maxHp * dmgPct)
    // VFX: expanding ring
    const ring = this.scene.add.circle(this.x, this.y, 10, 0x880000, 0.6).setDepth(3)
    this.scene.tweens.add({ targets: ring, scale: radius / 10, alpha: 0, duration: 500, onComplete: () => ring.destroy() })
    this.scene.cameras.main.shake(200, 0.010)
    // Damage + knockback if in range
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)
    if (dist <= radius) {
      ;(this.player as PlayerLike).takeDamage(dmg)
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
      const body = this.player.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(angle) * 350, Math.sin(angle) * 350)
    }
  }

  private _doVoidDash() {
    // Teleport to ~200px past the player (boss ends up on the far side)
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
    const tx = this.player.x + Math.cos(angle) * 200
    const ty = this.player.y + Math.sin(angle) * 200
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 200,
      onComplete: () => {
        if (!this.active) return
        this.setPosition(tx, ty)
        ;(this.body as Phaser.Physics.Arcade.Body).reset(tx, ty)
        this.scene.tweens.add({ targets: this, alpha: 1, duration: 200 })
        // Purple impact VFX
        const flash = this.scene.add.circle(tx, ty, 50, 0x440088, 0.6).setDepth(16)
        this.scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 400, onComplete: () => flash.destroy() })
        // Damage if close after teleport
        const dist = Phaser.Math.Distance.Between(tx, ty, this.player.x, this.player.y)
        if (dist < 150) {
          ;(this.player as PlayerLike).takeDamage(Math.ceil((this.player as PlayerLike).maxHp * 0.20))
          this.scene.cameras.main.shake(150, 0.008)
        }
      }
    })
  }

  private _doVoidBurst() {
    // Capture cast position — damage checks use this, not boss's moved position
    const castX = this.x, castY = this.y
    // 3 staggered expanding rings
    for (let i = 0; i < 3; i++) {
      const delay = i * 180
      this.scene.time.delayedCall(delay, () => {
        if (!this.active) return
        const ring = this.scene.add.circle(castX, castY, 12, 0x440088, 0.65 - i * 0.15).setDepth(15 - i)
        this.scene.tweens.add({ targets: ring, scale: 17, alpha: 0, duration: 700, onComplete: () => ring.destroy() })
      })
    }
    this.scene.cameras.main.shake(300, 0.012)
    // Damage check at 400ms — from cast position, not current boss position
    this.scene.time.delayedCall(400, () => {
      if (!this.active) return
      const dist = Phaser.Math.Distance.Between(castX, castY, this.player.x, this.player.y)
      if (dist < 200) {
        ;(this.player as PlayerLike).takeDamage(Math.ceil((this.player as PlayerLike).maxHp * 0.40))
      }
    })
  }

  // -------------------------------------------------------------------------
  // Death VFX — destroy shadow, play animation, emit particles
  // -------------------------------------------------------------------------
  protected onDeathVfx(onComplete: () => void): void {
    this.shadow.destroy()
    this.play('boss_death')
    this.scene.cameras.main.shake(800, 0.03)
    this.scene.events.emit('boss-defeated')

    // Particle burst — gold/red/green/purple debris
    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        if (!this.scene) return
        const circle = this.scene.add.circle(
          this.x + Phaser.Math.Between(-70, 70),
          this.y + Phaser.Math.Between(-50, 50),
          Phaser.Math.Between(5, 12),
          ([0xffdd00, 0xff4444, 0x44ffaa, 0xbb44ff] as number[])[Phaser.Math.Between(0, 3)]
        ).setDepth(20)
        this.scene.tweens.add({
          targets: circle,
          y: circle.y - Phaser.Math.Between(50, 120),
          alpha: 0,
          duration: 900,
          onComplete: () => circle.destroy(),
        })
      })
    }

    this.once('animationcomplete', onComplete)
  }
}
