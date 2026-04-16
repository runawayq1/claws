import Phaser from 'phaser'
import { MetaProgress } from '../systems/MetaProgress'
import { NotificationCenter } from '../systems/NotificationCenter'
import { NotificationBell } from '../ui/NotificationBell'
import { makeCircleButton } from '../ui/CircleButton'
import { addDiagonalBg } from '../utils/bgScroll'
import { isMobileDevice, gameFont } from '../utils/device'

export class StartScene extends Phaser.Scene {
  private playerName = ''

  constructor() {
    super({ key: 'StartScene' })
  }

  preload() {
    if (!this.textures.exists('book_anim')) {
      this.load.spritesheet('book_anim', 'assets/book/book_anim.png', { frameWidth: 542, frameHeight: 542 })
    }
  }

  create(data?: { playerName?: string }) {
    this.cameras.main.fadeIn(200)
    const { width, height } = this.scale
    const compact = height < 500

    // Resolve name: passed via scene data, or fall back to localStorage
    this.playerName = data?.playerName
      || localStorage.getItem('claws_player_name')
      || ''

    // Ensure MetaProgress is initialised
    MetaProgress.load()

    this.cameras.main.setBackgroundColor(0x0d0d1a)
    addDiagonalBg(this)

    // Title
    const titleTxt = this.add.text(width / 2, compact ? 18 : height * 0.08, 'CLAWS', {
      fontFamily: gameFont(), fontSize: compact ? '28px' : '48px',
      color: '#FFD700',
    }).setOrigin(0.5)
    titleTxt.setShadow(0, 1, '#000000', 2, true, true)

    this.add.text(width / 2, compact ? 46 : height * 0.08 + 46, 'Survive the Swarm', {
      fontFamily: gameFont(), fontSize: compact ? '13px' : '16px',
      color: '#888888',
    }).setOrigin(0.5)

    if (this.playerName) {
      this.add.text(16, compact ? 8 : 16, `Playing as: ${this.playerName}`, {
        fontFamily: gameFont(), fontSize: compact ? '13px' : '13px',
        color: '#FFD700',
      }).setOrigin(0, 0)
    }

    // Boss demon art — loaded lazily so it doesn't block first frame
    const isPortrait = height > width
    const bossScale = isPortrait ? 3 : (compact ? 3.5 : 5)
    const bossLeftX = isPortrait ? 40 : (compact ? 80 : 130)
    const bossRightX = width - (isPortrait ? 40 : (compact ? 80 : 130))
    const bossY = height - (compact ? 5 : 8)
    let bossOnLeft = true
    let bossSprite: Phaser.GameObjects.Sprite | null = null

    const initBoss = () => {
      if (!this.anims.exists('start_boss_idle')) {
        this.anims.create({ key: 'start_boss_idle', frames: this.anims.generateFrameNumbers('boss_demon', { start: 0, end: 5 }), frameRate: 6, repeat: -1 })
      }
      if (!this.anims.exists('start_boss_cleave')) {
        this.anims.create({ key: 'start_boss_cleave', frames: this.anims.generateFrameNumbers('boss_demon', { start: 18, end: 32 }), frameRate: 10, repeat: 0 })
      }
      if (!this.anims.exists('start_boss_death')) {
        this.anims.create({ key: 'start_boss_death', frames: this.anims.generateFrameNumbers('boss_demon', { start: 38, end: 59 }), frameRate: 8, repeat: 0 })
      }
      if (!this.anims.exists('start_boss_spawn')) {
        this.anims.create({ key: 'start_boss_spawn', frames: this.anims.generateFrameNumbers('boss_demon', { start: 59, end: 38 }), frameRate: 10, repeat: 0 })
      }
      bossSprite = this.add.sprite(bossLeftX, bossY, 'boss_demon', 0)
        .setScale(bossScale).setDepth(1).setAlpha(0)
        .setOrigin(0.5, 1)
      playBossLoop()
    }

    const playBossLoop = () => {
      if (!bossSprite) return
      const posX = bossOnLeft ? bossLeftX : bossRightX
      bossSprite.setPosition(posX, bossY)
      bossSprite.setFlipX(bossOnLeft)
      bossOnLeft = !bossOnLeft

      bossSprite.setAlpha(0)
      bossSprite.play('start_boss_spawn')
      this.tweens.add({ targets: bossSprite, alpha: 0.3, duration: 600 })
      bossSprite.once('animationcomplete', () => {
        if (!bossSprite) return
        bossSprite.play('start_boss_idle')
        this.time.delayedCall(3000, () => {
          if (!bossSprite) return
          bossSprite.play('start_boss_cleave')
          bossSprite.once('animationcomplete', () => {
            if (!bossSprite) return
            bossSprite.play('start_boss_death')
            bossSprite.once('animationcomplete', () => {
              if (!bossSprite) return
              this.tweens.add({
                targets: bossSprite, alpha: 0, duration: 800,
                onComplete: () => { this.time.delayedCall(1500, playBossLoop) },
              })
            })
          })
        })
      })
    }

    if (this.textures.exists('boss_demon')) {
      this.time.delayedCall(2000, initBoss)
    } else {
      this.time.delayedCall(1500, () => {
        this.load.spritesheet('boss_demon', 'assets/boss_demon/spritesheet.png', { frameWidth: 288, frameHeight: 160 })
        this.load.once('complete', () => { this.time.delayedCall(800, initBoss) })
        this.load.start()
      })
    }

    // Encyclopedia book icon (bottom-right) with decorative frame
    const bookSize = compact ? 64 : 90
    const framePad = bookSize / 2 + 16
    const frameX = width - framePad
    const frameY = height - framePad - (compact ? 10 : 18)

    const fr = bookSize / 2 + 8

    const drawFrame = (bright: boolean) => {
      frameG.clear()
      frameG.fillStyle(0x3a6ea5, bright ? 0.25 : 0.15)
      frameG.beginPath(); frameG.moveTo(pts[0].x, pts[0].y)
      pts.forEach((p, i) => { if (i > 0) frameG.lineTo(p.x, p.y) }); frameG.closePath(); frameG.fillPath()
      frameG.lineStyle(bright ? 2.5 : 2, bright ? 0x7db4e0 : 0x5b8cb8, bright ? 0.9 : 0.7)
      frameG.beginPath(); frameG.moveTo(pts[0].x, pts[0].y)
      pts.forEach((p, i) => { if (i > 0) frameG.lineTo(p.x, p.y) }); frameG.closePath(); frameG.strokePath()
      frameG.lineStyle(1, 0xd4b483, bright ? 0.5 : 0.35)
      frameG.beginPath(); frameG.moveTo(iPts[0].x, iPts[0].y)
      iPts.forEach((p, i) => { if (i > 0) frameG.lineTo(p.x, p.y) }); frameG.closePath(); frameG.strokePath()
      pts.forEach(p => { frameG.fillStyle(bright ? 0xffd700 : 0xd4b483, bright ? 0.8 : 0.6); frameG.fillCircle(p.x, p.y, bright ? 3 : 2.5) })
    }

    const frameG = this.add.graphics().setDepth(9)
    const pts = [
      { x: frameX, y: frameY - fr },
      { x: frameX + fr, y: frameY - fr * 0.35 },
      { x: frameX + fr * 0.7, y: frameY + fr * 0.85 },
      { x: frameX - fr * 0.7, y: frameY + fr * 0.85 },
      { x: frameX - fr, y: frameY - fr * 0.35 },
    ]
    const ir = fr - 5
    const iPts = [
      { x: frameX, y: frameY - ir },
      { x: frameX + ir, y: frameY - ir * 0.35 },
      { x: frameX + ir * 0.7, y: frameY + ir * 0.85 },
      { x: frameX - ir * 0.7, y: frameY + ir * 0.85 },
      { x: frameX - ir, y: frameY - ir * 0.35 },
    ]
    drawFrame(false)

    if (!this.anims.exists('book_open')) {
      this.anims.create({ key: 'book_open', frames: this.anims.generateFrameNumbers('book_anim', { start: 11, end: 0 }), frameRate: 18, repeat: 0 })
    }
    if (!this.anims.exists('book_close')) {
      this.anims.create({ key: 'book_close', frames: this.anims.generateFrameNumbers('book_anim', { start: 0, end: 11 }), frameRate: 18, repeat: 0 })
    }

    const bookSprite = this.add.sprite(frameX, frameY, 'book_anim', 11)
      .setDisplaySize(bookSize, bookSize)
      .setInteractive({ useHandCursor: true })
      .setDepth(10)

    const labelY = frameY + fr * 0.85 + 8
    const bookLabel = this.add.text(frameX, labelY, 'Encyclopedia', {
      fontFamily: gameFont(), fontSize: compact ? '11px' : '10px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(10)

    const isMobile = isMobileDevice()

    if (!isMobile) {
      bookSprite.on('pointerover', () => {
        bookSprite.play('book_open')
        bookLabel.setColor('#d4b483')
        drawFrame(true)
      })
      bookSprite.on('pointerout', () => {
        bookSprite.play('book_close')
        bookLabel.setColor('#888888')
        drawFrame(false)
      })
      bookSprite.on('pointerdown', () => {
        this.cameras.main.fadeOut(200)
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('EncyclopediaScene'))
      })
    } else {
      bookSprite.on('pointerdown', () => {
        bookSprite.disableInteractive()
        bookSprite.play('book_open')
        bookSprite.once('animationcomplete', () => {
          this.cameras.main.fadeOut(200)
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('EncyclopediaScene'))
        })
      })
    }

    // Mode selection buttons — two large buttons centered vertically
    const btnW = compact ? 120 : 180
    const btnH = compact ? 52 : 80
    const btnGap = compact ? 16 : 28
    const btnCY = height * 0.52
    const soloCX = width / 2 - btnW / 2 - btnGap / 2
    const multiCX = width / 2 + btnW / 2 + btnGap / 2

    const makeModeBg = (cx: number, cy: number, fillColor: number, alpha: number) => {
      const g = this.add.graphics().setDepth(5)
      g.fillStyle(fillColor, alpha)
      g.fillRoundedRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH, 10)
      g.lineStyle(2, fillColor, 0.8)
      g.strokeRoundedRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH, 10)
      return g
    }

    // SOLO button
    const soloBg = makeModeBg(soloCX, btnCY, 0xffd700, 0.12)
    const soloTitle = this.add.text(soloCX, btnCY - (compact ? 8 : 12), 'SOLO', {
      fontFamily: gameFont(), fontSize: compact ? '14px' : '20px',
      color: '#FFD700',
    }).setOrigin(0.5).setDepth(6)
    const soloSub = this.add.text(soloCX, btnCY + (compact ? 10 : 16), 'Classic mode', {
      fontFamily: gameFont(), fontSize: compact ? '12px' : '11px',
      color: '#aa9900',
    }).setOrigin(0.5).setDepth(6)

    const soloZone = this.add.zone(soloCX, btnCY, btnW, btnH)
      .setInteractive({ useHandCursor: true }).setDepth(7)
    soloZone.on('pointerover', () => {
      soloBg.clear()
      soloBg.fillStyle(0xffd700, 0.25)
      soloBg.fillRoundedRect(soloCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      soloBg.lineStyle(2.5, 0xffd700, 1)
      soloBg.strokeRoundedRect(soloCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      soloBg.lineStyle(1, 0xffd700, 0.6)
      soloBg.strokeRoundedRect(soloCX - btnW / 2 - 3, btnCY - btnH / 2 - 3, btnW + 6, btnH + 6, 12)
      soloTitle.setColor('#ffffff')
      this.tweens.add({ targets: [soloTitle, soloSub], scaleX: 1.12, scaleY: 1.12, duration: 120, ease: 'Sine.Out' })
    })
    soloZone.on('pointerout', () => {
      soloBg.clear()
      soloBg.fillStyle(0xffd700, 0.12)
      soloBg.fillRoundedRect(soloCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      soloBg.lineStyle(2, 0xffd700, 0.8)
      soloBg.strokeRoundedRect(soloCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      soloTitle.setColor('#FFD700')
      this.tweens.add({ targets: [soloTitle, soloSub], scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.Out' })
    })
    soloZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(200)
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('HeroSelectScene', { playerName: this.playerName, mode: 'solo' })
      )
    })

    // MULTIPLAYER button
    const multiBg = makeModeBg(multiCX, btnCY, 0x4488ff, 0.12)
    const multiTitle = this.add.text(multiCX, btnCY - (compact ? 8 : 12), 'MULTIPLAYER', {
      fontFamily: gameFont(), fontSize: compact ? '13px' : '15px',
      color: '#88aaff',
    }).setOrigin(0.5).setDepth(6)
    const multiSub = this.add.text(multiCX, btnCY + (compact ? 10 : 16), 'Online co-op', {
      fontFamily: gameFont(), fontSize: compact ? '12px' : '11px',
      color: '#4466aa',
    }).setOrigin(0.5).setDepth(6)

    const multiZone = this.add.zone(multiCX, btnCY, btnW, btnH)
      .setInteractive({ useHandCursor: true }).setDepth(7)
    multiZone.on('pointerover', () => {
      multiBg.clear()
      multiBg.fillStyle(0x4488ff, 0.25)
      multiBg.fillRoundedRect(multiCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      multiBg.lineStyle(2.5, 0x88aaff, 1)
      multiBg.strokeRoundedRect(multiCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      multiBg.lineStyle(1, 0xffd700, 0.6)
      multiBg.strokeRoundedRect(multiCX - btnW / 2 - 3, btnCY - btnH / 2 - 3, btnW + 6, btnH + 6, 12)
      multiTitle.setColor('#ffffff')
      this.tweens.add({ targets: [multiTitle, multiSub], scaleX: 1.12, scaleY: 1.12, duration: 120, ease: 'Sine.Out' })
    })
    multiZone.on('pointerout', () => {
      multiBg.clear()
      multiBg.fillStyle(0x4488ff, 0.12)
      multiBg.fillRoundedRect(multiCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      multiBg.lineStyle(2, 0x4488ff, 0.8)
      multiBg.strokeRoundedRect(multiCX - btnW / 2, btnCY - btnH / 2, btnW, btnH, 10)
      multiTitle.setColor('#88aaff')
      this.tweens.add({ targets: [multiTitle, multiSub], scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.Out' })
    })
    multiZone.on('pointerdown', () => {
      // Show connecting state
      multiTitle.setText('Connecting...')
      multiSub.setText('')
      multiZone.disableInteractive()

      import('../systems/NetworkManager').then(({ networkManager }) => {
        networkManager.connect().then(() => {
          return networkManager.joinOrCreate(this.playerName, 'ignara')
        }).then(() => {
          this.cameras.main.fadeOut(200)
          this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start('LobbyScene', { playerName: this.playerName, online: true })
          )
        }).catch((err: Error) => {
          console.error('[StartScene] Multiplayer connect failed:', err)
          multiTitle.setText('MULTIPLAYER')
          multiSub.setText('Server unavailable')
          multiSub.setColor('#ff4444')
          multiZone.setInteractive({ useHandCursor: true })
          // Reset error text after 3 seconds
          this.time.delayedCall(3000, () => {
            multiSub.setText('Online co-op')
            multiSub.setColor('#4466aa')
          })
        })
      })
    })

    // Bottom button row: PROFILE | SCORES | FORGE — pill style
    const pillW = 110
    const pillH = 32
    const pillR = 8
    const pillGap = 20
    const totalRowW = 3 * pillW + 2 * pillGap
    const rowStartX = width / 2 - totalRowW / 2
    const pillY = compact ? height - 14 : height * 0.92

    const makePill = (index: number, label: string, scene: string, idleTextColor: string) => {
      const cx = rowStartX + pillW / 2 + index * (pillW + pillGap)
      const bg = this.add.graphics().setDepth(5)
      const drawPill = (hover: boolean) => {
        bg.clear()
        bg.fillStyle(0x1a1a28, 1)
        bg.fillRoundedRect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH, pillR)
        bg.lineStyle(1, hover ? 0xffd700 : 0x555566, 1)
        bg.strokeRoundedRect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH, pillR)
      }
      drawPill(false)
      const txt = this.add.text(cx, pillY, label, {
        fontFamily: gameFont(), fontSize: '13px', fontStyle: 'bold',
        color: idleTextColor,
      }).setOrigin(0.5).setDepth(6)
      const zone = this.add.zone(cx, pillY, pillW, pillH)
        .setInteractive({ useHandCursor: true }).setDepth(7)
      zone.on('pointerover', () => { drawPill(true); txt.setColor('#FFD700') })
      zone.on('pointerout', () => { drawPill(false); txt.setColor(idleTextColor) })
      zone.on('pointerdown', () => {
        this.cameras.main.fadeOut(200)
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene))
      })
    }

    makePill(0, 'PROFILE', 'ProfileScene', '#888899')
    makePill(1, 'SCORES', 'LeaderboardScene', '#888899')
    makePill(2, 'FORGE', 'ForgeScene', '#888899')

    // DEV: TestScene shortcut (T key)
    if (import.meta.env.DEV) {
      this.input.keyboard?.on('keydown-T', () => {
        this.cameras.main.fadeOut(150)
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TestScene'))
      })
    }

    // Notification bell — top-right, left of logout
    NotificationCenter.ensureSeeded()
    const bellX = width - (compact ? 50 : 60)
    const bellY = compact ? 20 : 26
    new NotificationBell(this, bellX, bellY)

    // Logout button — top-right corner, circular style matching other buttons
    if (this.playerName) {
      makeCircleButton(this, {
        x: width - (compact ? 18 : 24),
        y: compact ? 18 : 24,
        radius: compact ? 13 : 16,
        icon: '⏻',
        onClick: () => {
          localStorage.removeItem('claws_player_name')
          this.cameras.main.fadeOut(200)
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('NameInputScene'))
        },
        depth: 20,
      })
    }
  }
}
