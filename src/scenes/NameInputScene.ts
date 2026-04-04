import Phaser from 'phaser'
import { SessionLogger } from '../systems/SessionLogger'

const STORAGE_KEY = 'claws_player_name'

export class NameInputScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NameInputScene' })
  }

  create() {
    console.log('NameInputScene.create() called, height:', this.scale.height, 'width:', this.scale.width)

    const { width, height } = this.scale
    const compact = height < 500

    this.cameras.main.setBackgroundColor(0x0d0d1a)

    // Title — left side on compact, centered on desktop
    const titleSize = compact ? '36px' : '64px'
    const titleY = compact ? height * 0.22 : height * 0.22
    const leftCol = compact ? width * 0.28 : width / 2
    const rightCol = compact ? width * 0.65 : width / 2

    this.add.text(leftCol, titleY, 'CLAWS', {
      fontFamily: 'monospace',
      fontSize: titleSize,
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: compact ? 5 : 8,
    }).setOrigin(0.5)

    this.add.text(leftCol, titleY + (compact ? 34 : 60), 'Survive the Swarm', {
      fontFamily: 'monospace',
      fontSize: compact ? '11px' : '16px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    // Right column (or center on desktop): input group
    const inputGroupY = compact ? height * 0.35 : height * 0.5

    // Prompt
    this.add.text(rightCol, inputGroupY - (compact ? 38 : 60), 'Enter your name', {
      fontFamily: 'monospace',
      fontSize: compact ? '15px' : '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // DOM input element
    const inputEl = document.createElement('input')
    inputEl.type = 'text'
    inputEl.maxLength = 16
    inputEl.placeholder = 'Player'
    const inputW = compact ? 200 : 260
    const inputFS = compact ? '16px' : '22px'
    const inputPad = compact ? '7px 12px' : '10px 18px'
    inputEl.style.cssText = [
      'background: #1a1a2e',
      'color: #FFD700',
      'border: 2px solid #444466',
      'border-radius: 6px',
      'font-family: monospace',
      `font-size: ${inputFS}`,
      'text-align: center',
      `padding: ${inputPad}`,
      'outline: none',
      `width: ${inputW}px`,
      'letter-spacing: 2px',
    ].join(';')

    const domInput = this.add.dom(rightCol, inputGroupY, inputEl)

    // Error text (hidden initially)
    const errorText = this.add.text(rightCol, inputGroupY + (compact ? 32 : 52), '', {
      fontFamily: 'monospace',
      fontSize: compact ? '11px' : '13px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    // PLAY button
    const btnY = inputGroupY + (compact ? 62 : 86)
    const playBtn = this.add.text(rightCol, btnY, 'PLAY', {
      fontFamily: 'monospace',
      fontSize: compact ? '18px' : '22px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5,
      backgroundColor: '#2a2a4e',
      padding: { x: compact ? 24 : 32, y: compact ? 8 : 12 },
    } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'))
    playBtn.on('pointerout', () => playBtn.setColor('#FFD700'))
    playBtn.on('pointerdown', () => this.submit(inputEl, errorText))

    // Enter key handler on the input element
    inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.submit(inputEl, errorText)
      }
    })

    // Focus the input after a short delay (Phaser DOM needs a moment)
    this.time.delayedCall(100, () => inputEl.focus())

    // Instruction hint
    this.add.text(rightCol, btnY + (compact ? 32 : 52), '2–16 characters', {
      fontFamily: 'monospace',
      fontSize: compact ? '10px' : '12px',
      color: '#555577',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.scale.on('resize', () => {
      const nw = this.scale.width
      const nh = this.scale.height
      const col = nh < 500 ? nw * 0.65 : nw / 2
      domInput.setPosition(col, nh < 500 ? nh * 0.35 : nh * 0.5)
    })
  }

  private submit(
    inputEl: HTMLInputElement,
    errorText: Phaser.GameObjects.Text,
  ) {
    const name = inputEl.value.trim()
    if (name.length < 2) {
      errorText.setText('Name must be at least 2 characters')
      return
    }
    if (name.length > 16) {
      errorText.setText('Name must be 16 characters or fewer')
      return
    }

    localStorage.setItem(STORAGE_KEY, name)

    // Fire-and-forget Supabase registration
    SessionLogger.registerPlayer(name).catch(() => {/* silently ignore */})

    // Enter fullscreen on mobile only
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1)
    if (isMobile) {
      const el = document.documentElement as any
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {})
      }
    }

    this.scene.start('StartScene', { playerName: name })
  }
}
