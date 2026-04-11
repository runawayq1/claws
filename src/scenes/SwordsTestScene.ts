import Phaser from 'phaser'
import { gameFont } from '../utils/device'
import { Player } from '../entities/Player'
import { Orc1 } from '../entities/Orc1'
import * as amun from '../entities/heroes/amun'

/**
 * Dedicated debug scene for Amun's Thorns orbiting swords.
 * Shows the player, the swords, hit-radius circles, physics debug bodies,
 * and a few stationary dummy enemies so damage can be verified visually.
 */
export class SwordsTestScene extends Phaser.Scene {
  private thornsAmun?: Player
  private thornsDebug?: Phaser.GameObjects.Graphics
  // Public so amun.updateAmunPassives can read scene.enemies
  enemies?: Phaser.Physics.Arcade.Group

  constructor() {
    super({ key: 'SwordsTestScene' })
  }

  preload() {
    // Amun spritesheet
    this.load.spritesheet('amun_idle', 'assets/amun/Idle.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_run', 'assets/amun/Run.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_attack', 'assets/amun/Attack1.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_hurt', 'assets/amun/Take Hit.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_death', 'assets/amun/Death.png', { frameWidth: 160, frameHeight: 111 })

    // Orc1 dummy enemy spritesheets
    this.load.spritesheet('orc1_idle',   'assets/orc/orc1_idle_without_shadow.png',   { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_run',    'assets/orc/orc1_run_without_shadow.png',    { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_attack', 'assets/orc/orc1_attack_without_shadow.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_hurt',   'assets/orc/orc1_hurt_without_shadow.png',   { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_death',  'assets/orc/orc1_death_without_shadow.png',  { frameWidth: 64, frameHeight: 64 })

    // Sword VFX sprite
    this.load.image('sword', 'assets/vfx/sword.png')
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0a0a0a)

    // Title
    this.add.text(width / 2, 24, 'AMUN THORNS — SWORDS DEBUG', {
      fontFamily: gameFont(),
      fontSize: '24px',
      color: '#ffaa44',
    }).setOrigin(0.5, 0).setDepth(20)

    // Back button
    const backBtn = this.add.text(16, 16, '< BACK', {
      fontFamily: gameFont(),
      fontSize: '14px',
      color: '#888888',
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 0).setDepth(20).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#FFD700'))
    backBtn.on('pointerout', () => backBtn.setColor('#888888'))
    backBtn.on('pointerdown', () => this.scene.start('TestScene'))
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('TestScene'))

    // Animations (must exist before spawning Player)
    Player.createAnimations(this)
    Orc1.createAnimations(this)

    // Enable physics debug rendering
    this.physics.world.drawDebug = true
    if (!this.physics.world.debugGraphic) this.physics.world.createDebugGraphic()
    this.physics.world.debugGraphic.setDepth(50)

    // Stub enemies group so updateAmunPassives can damage targets
    this.enemies = this.physics.add.group()

    // Spawn the Amun player at center
    const cx = width / 2
    const cy = height / 2
    const amunPlayer = new Player(this, cx, cy, 'amun')
    amunPlayer.setImmovable(true)
    const amunBody = amunPlayer.body as Phaser.Physics.Arcade.Body
    amunBody.setVelocity(0, 0)
    amunBody.setAllowGravity(false)
    // Activate Thorns at max level
    amunPlayer.hasThorns = true
    amunPlayer.thornsLevel = 3
    this.thornsAmun = amunPlayer

    // Stationary dummy enemies inside the sword orbit (radius 160) at the cardinals
    const dummyOffsets: Array<[number, number]> = [
      [160, 0], [-160, 0], [0, 160], [0, -160],
      [113, 113], [-113, 113], [113, -113], [-113, -113],
    ]
    for (const [dx, dy] of dummyOffsets) {
      const dummy = new Orc1(this, cx + dx, cy + dy, amunPlayer, 1)
      const db = dummy.body as Phaser.Physics.Arcade.Body
      db.setVelocity(0, 0)
      db.setAllowGravity(false)
      dummy.speed = 0  // pin in place
      this.enemies.add(dummy)
    }

    // Debug overlay for sword hit-radius circles (re-drawn each frame in update)
    this.thornsDebug = this.add.graphics().setDepth(40)

    // Info panel
    this.add.text(width / 2, height - 30, 'Thorns lvl 3 · 8 swords · orbit r=160 · hit 72×20 OBB · physics debug ON · enemies pinned', {
      fontFamily: gameFont(), fontSize: '11px', color: '#ffcc88',
    }).setOrigin(0.5).setDepth(20)
  }

  update(_time: number, delta: number) {
    if (!this.thornsAmun || !this.thornsDebug) return
    // Drive Amun passives manually (no GameScene update loop here)
    amun.updateAmunPassives(this.thornsAmun, delta)

    // Draw oriented blade rectangles around each sword (matches swordHalfLen=36, swordHalfWid=10)
    const g = this.thornsDebug
    g.clear()
    g.lineStyle(2, 0xff4444, 0.9)
    const halfLen = 36, halfWid = 10
    for (const s of this.thornsAmun.orbitSwords) {
      if (!s) continue
      const r = s.rotation - Math.PI / 4  // undo baseRot to get the orbit angle
      const cosR = Math.cos(r), sinR = Math.sin(r)
      // Four corners of the OBB
      const corners: Array<[number, number]> = [
        [ halfLen,  halfWid], [ halfLen, -halfWid],
        [-halfLen, -halfWid], [-halfLen,  halfWid],
      ]
      const pts = corners.map(([lx, ly]) => [
        s.x + lx * cosR - ly * sinR,
        s.y + lx * sinR + ly * cosR,
      ] as [number, number])
      g.beginPath()
      g.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1])
      g.closePath()
      g.strokePath()
    }
    // Orbit ring
    g.lineStyle(1, 0xffaa44, 0.5)
    g.strokeCircle(this.thornsAmun.cx, (this.thornsAmun.y + this.thornsAmun.cy) / 2, 160)
  }
}
