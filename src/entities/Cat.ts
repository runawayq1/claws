/**
 * Caesar — decorative grey cat companion.
 * Cat logic: does whatever it wants. Follows only when it decides to.
 * Portals if truly abandoned.
 */

import Phaser from 'phaser'
import type { Player } from './Player'

type CatState = 'sit' | 'idle' | 'walk' | 'scratch' | 'special' | 'portal'

const PORTAL_DIST  = 650   // roughly 1 screen — hard limit, teleport
const WALK_SPEED   = 50
const GREY_TINT    = 0xb0b8c0

export class Cat extends Phaser.GameObjects.Sprite {
  private _player: Player
  private _state: CatState = 'sit'
  private _stateTimer = 0
  private _targetX = 0
  private _targetY = 0
  private _portaling = false

  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super(scene, x, y, 'cat', 0)
    this._player = player
    scene.add.existing(this)
    this.setDepth(4).setScale(2).setTint(GREY_TINT)
    this._pickIdleState()
  }

  static registerAnims(scene: Phaser.Scene) {
    if (scene.anims.exists('cat_sit')) return
    const f = (start: number, end: number) =>
      scene.anims.generateFrameNumbers('cat', { start, end })

    scene.anims.create({ key: 'cat_sit',     frames: f(0, 3),   frameRate: 6,  repeat: -1 })
    scene.anims.create({ key: 'cat_idle',    frames: f(8, 11),  frameRate: 8,  repeat: -1 })
    scene.anims.create({ key: 'cat_alert',   frames: f(24, 27), frameRate: 8,  repeat: -1 })
    scene.anims.create({ key: 'cat_walk',    frames: f(32, 39), frameRate: 10, repeat: -1 })
    scene.anims.create({ key: 'cat_run',     frames: f(40, 47), frameRate: 14, repeat: -1 })
    scene.anims.create({ key: 'cat_scratch', frames: f(48, 51), frameRate: 10, repeat: 0  })
    scene.anims.create({ key: 'cat_pounce',  frames: f(56, 62), frameRate: 12, repeat: 0  })
    scene.anims.create({ key: 'cat_special', frames: f(72, 77), frameRate: 10, repeat: 0  })
  }

  // ── Sequence runner ───────────────────────────────────────────────────────
  // A step is either:
  //   { anim, ms }   — looping anim, advance after ms
  //   { anim }       — one-shot (repeat:0), advance on ANIMATION_COMPLETE
  //   { walk }       — special: pick a nearby wander target and walk there

  private _seq: Array<{ anim?: string; ms?: number; walk?: true }> = []
  private _seqIdx = 0

  private _pickIdleState() {
    this._seq = this._buildSequence()
    this._seqIdx = 0
    this._runSeqStep()
  }

  private _buildSequence(): Array<{ anim?: string; ms?: number; walk?: true }> {
    // Building blocks
    const sit   = (ms = Phaser.Math.Between(3500, 7000)) => ({ anim: 'cat_sit',     ms })
    const idle  = (ms = Phaser.Math.Between(1200, 2500)) => ({ anim: 'cat_idle',    ms })
    const alert = (ms = Phaser.Math.Between(600,  1200)) => ({ anim: 'cat_alert',   ms })
    const scratch = () => ({ anim: 'cat_scratch' })   // one-shot
    const special = () => ({ anim: 'cat_special' })   // one-shot
    const pounce  = () => ({ anim: 'cat_pounce'  })   // one-shot
    const walk    = ()  => ({ walk: true as const })

    // Weighted pool of sequences
    const pools = [
      // Mostly resting
      () => [idle(), sit()],
      () => [idle(), sit()],
      () => [sit()],
      () => [sit(), idle(), sit()],

      // Grooming / scratching burst
      () => [idle(), scratch(), idle(), sit()],
      () => [scratch(), idle(), scratch(), sit()],
      () => [alert(), scratch(), sit()],

      // Wandering
      () => [walk(), idle(), sit()],
      () => [walk(), scratch(), sit()],
      () => [walk(), idle(), walk(), sit()],

      // Playful
      () => [alert(), pounce(), idle(), sit()],
      () => [idle(), special(), idle(), sit()],
      () => [walk(), special(), scratch(), sit()],

      // Extended activity
      () => [idle(), scratch(), walk(), idle(), scratch(), sit()],
      () => [walk(), idle(), pounce(), idle(), sit()],
    ]

    const pick = pools[Math.floor(Math.random() * pools.length)]
    return pick()
  }

  private _runSeqStep() {
    if (this._seqIdx >= this._seq.length) {
      // End of sequence — start a new one
      this._pickIdleState()
      return
    }

    const step = this._seq[this._seqIdx]
    this._seqIdx++

    if (step.walk) {
      this._state = 'walk'
      const angle = Math.random() * Math.PI * 2
      const r = Phaser.Math.Between(25, 70)
      this._targetX = this.x + Math.cos(angle) * r
      this._targetY = this.y + Math.sin(angle) * r
      this._stateTimer = 4000  // fallback; walk ends on arrival
      this.play('cat_walk')
      this.setFlipX(this._targetX < this.x)
      // Arrival is handled in update() → calls _runSeqStep
      return
    }

    const key = step.anim!
    this._state = (key === 'cat_scratch' || key === 'cat_special' || key === 'cat_pounce')
      ? 'scratch'   // reuse 'scratch' slot for all one-shots
      : key === 'cat_sit' ? 'sit' : 'idle'

    this.play(key)

    if (step.ms !== undefined) {
      // Timed loop anim
      this._stateTimer = step.ms
    } else {
      // One-shot — advance on complete
      this._stateTimer = Infinity
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + key, () => {
        this._runSeqStep()
      })
    }
  }

  /** Called by walk arrival in update() to advance the sequence */
  private _onWalkDone() {
    this._state = 'idle'
    this._stateTimer = 0
    this._runSeqStep()
  }

  private _doPortal() {
    if (this._portaling) return
    this._portaling = true
    this._state = 'portal'

    const scene = this.scene

    // Open portal at current position
    this._openPortal(this.x, this.y, () => {
      // Cat shrinks into it
      scene.tweens.add({
        targets: this, alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: 220, ease: 'Quad.easeIn',
        onComplete: () => {
          const offX = this._player.flipX ? -60 : 60
          const tx = this._player.x + offX
          const ty = this._player.y + 28

          // Open portal at destination first, then pop cat in
          this._openPortal(tx, ty, () => {
            this.x = tx
            this.y = ty
            this.setScale(0.1).setAlpha(0)

            scene.tweens.add({
              targets: this, scaleX: 2, scaleY: 2, alpha: 1,
              duration: 280, ease: 'Back.easeOut',
              onComplete: () => {
                this._portaling = false
                this.play('cat_special')
                this._state = 'scratch'
                this._stateTimer = Infinity
                this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'cat_special', () => {
                  this._pickIdleState()
                })
              },
            })
          })
        },
      })
    })
  }

  /** Draws a swirling portal vortex at (x,y), calls onPeak when fully open */
  private _openPortal(x: number, y: number, onPeak: () => void) {
    const scene = this.scene
    const g = scene.add.graphics().setDepth(5)
    const objs: Phaser.GameObjects.GameObject[] = [g]

    // --- Ground shadow ellipse (stretches open) ---
    const shadow = scene.add.ellipse(x, y + 18, 10, 4, 0x220033, 0.55).setDepth(4)
    objs.push(shadow)
    scene.tweens.add({ targets: shadow, scaleX: 6, scaleY: 3, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => shadow.destroy() })

    // --- Multi-layer rings that expand outward ---
    const ringData = [
      { r: 2,  color: 0xffffff, alpha: 0.9, targetR: 40, dur: 320 },
      { r: 2,  color: 0xcc88ff, alpha: 0.8, targetR: 32, dur: 380 },
      { r: 2,  color: 0x8833cc, alpha: 0.7, targetR: 22, dur: 450 },
      { r: 2,  color: 0x330066, alpha: 0.5, targetR: 12, dur: 550 },
    ]
    ringData.forEach(({ r, color, alpha, targetR, dur }) => {
      const ring = scene.add.circle(x, y, r, color, alpha).setDepth(5)
      objs.push(ring)
      scene.tweens.add({
        targets: ring, displayWidth: targetR * 2, displayHeight: targetR * 2,
        alpha: 0, duration: dur, ease: 'Sine.easeOut',
        onComplete: () => ring.destroy(),
      })
    })

    // --- Rotating rune arcs drawn on graphics ---
    let rotation = 0
    let frame = 0
    const maxFrames = 18
    const arcTimer = scene.time.addEvent({
      delay: 16, repeat: maxFrames - 1,
      callback: () => {
        frame++
        rotation += 0.22
        const prog = frame / maxFrames  // 0→1
        const outerR = 34 * Math.sin(prog * Math.PI)  // grows then shrinks

        g.clear()

        // Outer pulsing ring stroke
        g.lineStyle(2.5, 0xcc88ff, 0.7 * Math.sin(prog * Math.PI))
        g.strokeCircle(x, y, outerR)

        // 3 rotating arcs (120° apart)
        for (let i = 0; i < 3; i++) {
          const base = rotation + (i * Math.PI * 2) / 3
          g.lineStyle(2, 0xeeccff, 0.8 * Math.sin(prog * Math.PI))
          g.beginPath()
          g.arc(x, y, outerR * 0.65, base, base + 1.1, false)
          g.strokePath()
        }

        // Inner swirl dots
        for (let i = 0; i < 6; i++) {
          const a = rotation * 1.6 + (i * Math.PI * 2) / 6
          const dr = outerR * 0.35
          g.fillStyle(0xffffff, 0.6 * Math.sin(prog * Math.PI))
          g.fillCircle(x + Math.cos(a) * dr, y + Math.sin(a) * dr, 2)
        }

        if (frame === Math.floor(maxFrames * 0.45)) {
          onPeak()
        }
        if (frame >= maxFrames) {
          g.clear()
          g.destroy()
          arcTimer.destroy()
        }
      },
    })

    // --- Sparks burst outward ---
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3
      const dist = Phaser.Math.Between(20, 48)
      const spark = scene.add.circle(x, y, Phaser.Math.Between(1, 3), 0xeeccff, 0.95).setDepth(6)
      objs.push(spark)
      scene.tweens.add({
        targets: spark, delay: Phaser.Math.Between(0, 80),
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        scaleX: 0.1, scaleY: 0.1, alpha: 0,
        duration: Phaser.Math.Between(300, 550), ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      })
    }

    // --- Central flash circle ---
    const flash = scene.add.circle(x, y, 4, 0xffffff, 0.95).setDepth(6)
    scene.tweens.add({
      targets: flash, displayWidth: 22, displayHeight: 22,
      alpha: 0, duration: 200, ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    })
  }

  update(delta: number) {
    if (this._portaling) return

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this._player.x, this._player.y)

    // Hard limit — portal no matter what
    if (dist > PORTAL_DIST) {
      this._doPortal()
      return
    }

    this._stateTimer -= delta

    // === Walking to a local target ===
    if (this._state === 'walk') {
      const dx = this._targetX - this.x
      const dy = this._targetY - this.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 4 || this._stateTimer <= 0) {
        this._onWalkDone()
        return
      }
      const step = WALK_SPEED * (delta / 1000)
      this.x += (dx / d) * step
      this.y += (dy / d) * step
      this.setFlipX(dx < 0)
      return
    }

    // One-shots (scratch/pounce/special) advance via ANIMATION_COMPLETE callback
    if (this._state === 'scratch' || this._state === 'portal') return

    // Timed loop anims — advance sequence when timer expires
    if (this._stateTimer <= 0) {
      this._runSeqStep()
    }
  }
}
