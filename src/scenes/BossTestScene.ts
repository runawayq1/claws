import Phaser from 'phaser'

/**
 * BossTestScene — visual test for the demon slime boss spritesheet.
 * Shows all 5 animations: idle, walk, cleave, take_hit, death.
 * Accessible from TestScene or StartScene.
 */
export class BossTestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossTestScene' })
  }

  preload() {
    // Boss demon slime spritesheet: 288x160 per frame, 22 cols x 5 rows
    // Row 0: idle (6 frames: 0-5)
    // Row 1: walk (12 frames: 22-33)  — row 1 starts at frame 22
    // Row 2: cleave (15 frames: 44-58)
    // Row 3: take_hit (5 frames: 66-70)
    // Row 4: death (22 frames: 88-109)
    this.load.spritesheet('boss_demon', 'assets/boss_demon/spritesheet.png', {
      frameWidth: 288,
      frameHeight: 160,
    })
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0a0a0a)

    // Title
    this.add.text(width / 2, 24, 'BOSS TEST — DEMON SLIME', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(20)

    // Back button
    const backBtn = this.add.text(16, 16, '< BACK', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 0).setDepth(20).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#FFD700'))
    backBtn.on('pointerout', () => backBtn.setColor('#888888'))
    backBtn.on('pointerdown', () => this.scene.start('StartScene'))

    // Create all boss animations
    const anims: { key: string; start: number; end: number; rate: number; repeat: number }[] = [
      { key: 'boss_idle', start: 0, end: 5, rate: 8, repeat: -1 },
      { key: 'boss_walk', start: 22, end: 33, rate: 10, repeat: -1 },
      { key: 'boss_cleave', start: 44, end: 58, rate: 12, repeat: -1 },
      { key: 'boss_hit', start: 66, end: 70, rate: 8, repeat: -1 },
      { key: 'boss_death', start: 88, end: 109, rate: 10, repeat: 0 },
    ]

    const labels = ['IDLE', 'WALK', 'CLEAVE', 'TAKE HIT', 'DEATH']

    anims.forEach((a) => {
      if (!this.anims.exists(a.key)) {
        this.anims.create({
          key: a.key,
          frames: this.anims.generateFrameNumbers('boss_demon', { start: a.start, end: a.end }),
          frameRate: a.rate,
          repeat: a.repeat,
        })
      }
    })

    // Display each animation in a row
    const totalAnims = anims.length
    const spacing = Math.min(200, (width - 80) / totalAnims)
    const startX = width / 2 - ((totalAnims - 1) * spacing) / 2
    const rowY = height * 0.38

    anims.forEach((a, i) => {
      const x = startX + i * spacing

      const sprite = this.add.sprite(x, rowY, 'boss_demon')
        .setScale(2.5)
        .setDepth(10)
      sprite.play(a.key)

      // Label
      this.add.text(x, rowY + 120, labels[i], {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ff8888',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(20)

      // Frame info
      this.add.text(x, rowY + 138, `${a.end - a.start + 1}f`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(20)
    })

    // Big showcase boss in the lower half — interactive
    const bigBoss = this.add.sprite(width / 2, height * 0.72, 'boss_demon')
      .setScale(4)
      .setDepth(10)
    bigBoss.play('boss_idle')

    // Click big boss to cycle through animations
    bigBoss.setInteractive({ useHandCursor: true })
    let currentAnim = 0
    bigBoss.on('pointerdown', () => {
      currentAnim = (currentAnim + 1) % anims.length
      bigBoss.play(anims[currentAnim].key)
      animLabel.setText(labels[currentAnim])
    })

    const animLabel = this.add.text(width / 2, height * 0.72 + 110, 'CLICK TO CYCLE — IDLE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(20)

    // Boss info panel
    this.add.text(width / 2, height - 40, 'Spritesheet: 288×160 per frame | 22 cols × 5 rows | idle:6  walk:12  cleave:15  hit:5  death:22', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#555555',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(20)
  }
}
