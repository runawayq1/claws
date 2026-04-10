import Phaser from 'phaser'

export interface IInputController {
  /** Returns normalized direction {dx, dy} where each is -1..1. {0,0} = no input */
  getDirection(): { dx: number; dy: number }
  /** Returns true if stance toggle was just pressed this frame */
  getStanceToggle(): boolean
  /** Called once per frame before getDirection/getStanceToggle */
  update(): void
  /** Cleanup */
  destroy(): void
}

export class KeyboardInputController implements IInputController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null
  private qKey: Phaser.Input.Keyboard.Key | null = null

  private touchTarget: Phaser.Math.Vector2 | null = null
  private joystickDir: { dx: number; dy: number } | null = null

  // For stance toggle edge detection
  private _stanceToggleThisFrame = false
  // We track via Phaser key 'down' event (edge, not held)
  private _qPressed = false

  constructor(scene: Phaser.Scene) {
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys()
      this.wasd = {
        W: scene.input.keyboard.addKey('W'),
        A: scene.input.keyboard.addKey('A'),
        S: scene.input.keyboard.addKey('S'),
        D: scene.input.keyboard.addKey('D'),
      }
      this.qKey = scene.input.keyboard.addKey('Q')
      this.qKey.on('down', () => { this._qPressed = true })
    }
  }

  setTouchTarget(x: number, y: number) {
    if (this.touchTarget) this.touchTarget.set(x, y)
    else this.touchTarget = new Phaser.Math.Vector2(x, y)
  }

  clearTouchTarget() { this.touchTarget = null }

  setJoystickDirection(dx: number, dy: number) {
    if (dx === 0 && dy === 0) {
      this.joystickDir = null
    } else {
      this.joystickDir = { dx, dy }
    }
    this.touchTarget = null
  }

  clearJoystick() { this.joystickDir = null }

  update() {
    // Latch Q press for this frame; clear after getStanceToggle reads it
    this._stanceToggleThisFrame = this._qPressed
    this._qPressed = false
  }

  getDirection(): { dx: number; dy: number } {
    // Keyboard takes priority
    let kbX = 0, kbY = 0
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) kbX = -1
      if (this.cursors.right.isDown || this.wasd.D.isDown) kbX = 1
      if (this.cursors.up.isDown || this.wasd.W.isDown) kbY = -1
      if (this.cursors.down.isDown || this.wasd.S.isDown) kbY = 1
    }

    if (kbX !== 0 || kbY !== 0) {
      const len = Math.sqrt(kbX * kbX + kbY * kbY)
      return { dx: kbX / len, dy: kbY / len }
    }

    if (this.joystickDir) {
      return { dx: this.joystickDir.dx, dy: this.joystickDir.dy }
    }

    // Touch target: return direction toward it (caller handles distance check)
    // We return a special sentinel for touch target via a separate getter
    return { dx: 0, dy: 0 }
  }

  /** Returns the current touch target, if any */
  getTouchTarget(): Phaser.Math.Vector2 | null { return this.touchTarget }

  /** Clears the touch target from outside (e.g. when player reaches it) */
  consumeTouchTarget() { this.touchTarget = null }

  getStanceToggle(): boolean {
    const val = this._stanceToggleThisFrame
    this._stanceToggleThisFrame = false
    return val
  }

  destroy() {
    if (this.qKey) {
      this.qKey.destroy()
      this.qKey = null
    }
  }
}

/** Always returns no input. Used for remote/AI-controlled players. */
export class DummyInputController implements IInputController {
  getDirection() { return { dx: 0, dy: 0 } }
  getStanceToggle() { return false }
  update() { /* no-op */ }
  destroy() { /* no-op */ }
}
