import Phaser from 'phaser'
import { type HeroType } from '../entities/Player'
import { unlockHero } from './EncyclopediaScene'
import { shouldShowHint } from '../systems/HintFlags'

interface HeroDef {
  type: HeroType
  name: string
  role: string
  color: number
  asset: string
  fw: number
  fh: number
  scale: number
  tint?: number
  frames: number
  yOff?: number // vertical offset to center sprite in circle
}

const HEROES: HeroDef[] = [
  { type: 'sifra', name: 'Sifra', role: 'Ice Mage', color: 0x82ccdd,
    asset: 'assets/sifra/Idle.png', fw: 231, fh: 190, scale: 0.65, frames: 6 },
  { type: 'ignara', name: 'Ignara', role: 'Fire Mage', color: 0xe84118,
    asset: 'assets/ignara/Idle.png', fw: 150, fh: 150, scale: 1.1, frames: 8 },
  { type: 'amun', name: 'Amun', role: 'Guardian', color: 0xfff200,
    asset: 'assets/amun/Idle.png', fw: 160, fh: 111, scale: 1.3, frames: 8, yOff: -30 },
  { type: 'nazar', name: 'Nazar', role: 'Samurai', color: 0xc23616,
    asset: 'assets/nazar/Idle.png', fw: 200, fh: 200, scale: 1.0, frames: 8, yOff: 8 },
  { type: 'huntress', name: 'Lyra', role: 'Spear Thrower', color: 0x2ecc71,
    asset: 'assets/lyra/Idle.png', fw: 150, fh: 150, scale: 1.265, frames: 8 },
  { type: 'khashin', name: 'Khashin', role: 'Sand Assassin', color: 0x88ddff,
    asset: 'assets/khashin/Idle_cropped.png', fw: 48, fh: 42, scale: 1.36, frames: 8 },
  { type: 'muller', name: 'Givi', role: 'Crystal Gnome', color: 0x44aaff,
    asset: 'assets/givi/Idle_cropped.png', fw: 51, fh: 44, scale: 1.12, frames: 8, yOff: 10 },
]

// Only first hero is unlocked; rest are locked
const UNLOCKED_HEROES = new Set<HeroType>(['sifra'])

export class StartScene extends Phaser.Scene {
  private circles: Phaser.GameObjects.Graphics[] = []
  private selectedIndex = -1
  private playerName = ''
  private selectedMap: 'GameScene' | 'UndeadMapScene' = 'GameScene'

  constructor() {
    super({ key: 'StartScene' })
  }

  preload() {
    const loaded = new Set<string>()
    for (const hero of HEROES) {
      if (loaded.has(hero.asset)) continue
      loaded.add(hero.asset)
      const key = hero.asset.replace(/[^a-z0-9]/gi, '_')
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, hero.asset, { frameWidth: hero.fw, frameHeight: hero.fh })
      }
    }
    if (!this.textures.exists('book_anim')) {
      this.load.spritesheet('book_anim', 'assets/book/book_anim.png', { frameWidth: 542, frameHeight: 542 })
    }
  }

  create(data?: { playerName?: string }) {
    this.cameras.main.fadeIn(200)
    const { width, height } = this.scale
    const compact = height < 500
    this.circles = []
    this.selectedIndex = -1

    // Resolve name: passed via scene data, or fall back to localStorage
    this.playerName = data?.playerName
      || localStorage.getItem('claws_player_name')
      || ''

    this.cameras.main.setBackgroundColor(0x0d0d1a)

    // Title
    this.add.text(width / 2, compact ? 18 : height * 0.08, 'CLAWS', {
      fontFamily: 'monospace', fontSize: compact ? '28px' : '48px',
      color: '#FFD700', stroke: '#000000', strokeThickness: compact ? 4 : 6,
    }).setOrigin(0.5)

    this.add.text(width / 2, compact ? 46 : height * 0.08 + 46, 'Survive the Swarm', {
      fontFamily: 'monospace', fontSize: compact ? '10px' : '16px',
      color: '#888888', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    if (this.playerName) {
      this.add.text(16, compact ? 8 : 16, `Playing as: ${this.playerName}`, {
        fontFamily: 'monospace', fontSize: compact ? '10px' : '13px',
        color: '#FFD700', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0, 0)
    }

    this.add.text(width / 2, compact ? 64 : height * 0.24, 'Choose your Hero', {
      fontFamily: 'monospace', fontSize: compact ? '13px' : '18px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    // Layout heroes — detect portrait mobile
    const isPortrait = height > width
    const circleRadius = isPortrait ? 32 : (compact ? 36 : 52)
    const gap = isPortrait ? 12 : (compact ? 16 : 20)

    // Portrait: grid layout (2 columns). Landscape: single row.
    let startX: number, heroY: number
    const cols = isPortrait ? 2 : HEROES.length
    const rowH = circleRadius * 2 + (isPortrait ? 50 : 0)
    if (isPortrait) {
      const gridW = cols * (circleRadius * 2) + (cols - 1) * gap
      startX = width / 2 - gridW / 2 + circleRadius
      heroY = height * 0.28
    } else {
      const totalW = HEROES.length * (circleRadius * 2) + (HEROES.length - 1) * gap
      startX = width / 2 - totalW / 2 + circleRadius
      heroY = compact ? height * 0.48 : height * 0.46
    }

    // Create idle animations for each hero
    HEROES.forEach((hero, _i) => {
      const animKey = `start_idle_${hero.type}`
      if (!this.anims.exists(animKey)) {
        const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: hero.frames - 1 }),
          frameRate: 8,
          repeat: -1,
        })
      }
    })

    // Boss demon art — loaded lazily so it doesn't block first frame
    const bossScale = compact ? 3.5 : 5
    const bossLeftX = compact ? 80 : 130
    const bossRightX = width - (compact ? 80 : 130)
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

    // Loop: spawn → idle 3s → cleave → death → fade → teleport to other side → restart
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

    // Load boss_demon lazily — don't block first frame
    if (this.textures.exists('boss_demon')) {
      this.time.delayedCall(2000, initBoss)
    } else {
      this.load.spritesheet('boss_demon', 'assets/boss_demon/spritesheet.png', { frameWidth: 288, frameHeight: 160 })
      this.load.once('complete', () => { this.time.delayedCall(2000, initBoss) })
      this.load.start()
    }

    // Encyclopedia book icon (bottom-right) with decorative frame
    const bookSize = compact ? 64 : 90
    const framePad = bookSize / 2 + 16   // enough margin so pentagon + label fits
    const frameX = width - framePad
    const frameY = height - framePad - (compact ? 10 : 18)

    // Pentagon geometry
    const fr = bookSize / 2 + 8

    // Helper: draw pentagon frame at given brightness
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

    // Book animations
    if (!this.anims.exists('book_open')) {
      this.anims.create({ key: 'book_open', frames: this.anims.generateFrameNumbers('book_anim', { start: 11, end: 0 }), frameRate: 18, repeat: 0 })
    }
    if (!this.anims.exists('book_close')) {
      this.anims.create({ key: 'book_close', frames: this.anims.generateFrameNumbers('book_anim', { start: 0, end: 11 }), frameRate: 18, repeat: 0 })
    }

    // Book sprite centered in pentagon
    const bookSprite = this.add.sprite(frameX, frameY, 'book_anim', 11)
      .setDisplaySize(bookSize, bookSize)
      .setInteractive({ useHandCursor: true })
      .setDepth(10)

    // Label under the frame
    const labelY = frameY + fr * 0.85 + 8
    const bookLabel = this.add.text(frameX, labelY, 'Encyclopedia', {
      fontFamily: 'monospace', fontSize: compact ? '8px' : '10px',
      color: '#888888', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10)

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1)

    if (!isMobile) {
      // Desktop: hover opens/closes, click goes straight
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
      // Mobile: tap plays open animation, then transitions
      bookSprite.on('pointerdown', () => {
        bookSprite.disableInteractive()
        bookSprite.play('book_open')
        bookSprite.once('animationcomplete', () => {
          this.cameras.main.fadeOut(200)
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('EncyclopediaScene'))
        })
      })
    }

    // Profile button
    const profileBtn = this.add.text(width / 2 + (compact ? 52 : 72), compact ? height - 14 : height * 0.92, 'PROFILE', {
      fontFamily: 'monospace', fontSize: compact ? '11px' : '14px',
      color: '#888888', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#1a1a2e', padding: { x: compact ? 10 : 16, y: compact ? 4 : 8 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setInteractive({ useHandCursor: true })
    profileBtn.on('pointerover', () => profileBtn.setColor('#FFD700'))
    profileBtn.on('pointerout', () => profileBtn.setColor('#888888'))
    profileBtn.on('pointerdown', () => { this.cameras.main.fadeOut(200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ProfileScene')) })

    // Forge button (meta-upgrades)
    const forgeBtnY = compact ? height - 14 : height * 0.92
    const forgeBtnX = width / 2 + (compact ? 130 : 180)
    const forgeBtn = this.add.text(forgeBtnX, forgeBtnY, 'FORGE', {
      fontFamily: 'monospace', fontSize: compact ? '11px' : '14px',
      color: '#FFD700', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#1a1a2e', padding: { x: compact ? 10 : 16, y: compact ? 4 : 8 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setInteractive({ useHandCursor: true })
    forgeBtn.on('pointerover', () => forgeBtn.setColor('#ffffff'))
    forgeBtn.on('pointerout', () => forgeBtn.setColor('#FFD700'))
    forgeBtn.on('pointerdown', () => { this.cameras.main.fadeOut(200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ForgeScene')) })

    // Map selector — hidden for now (only Grasslands available)
    this.selectedMap = 'GameScene'

    // TEST button — corner shortcut to hitbox debug scene
    const testBtn = this.add.text(width - 10, height - 10, 'TEST', {
      fontFamily: 'monospace', fontSize: '10px',
      color: '#444466', stroke: '#000000', strokeThickness: 2,
      backgroundColor: '#111122', padding: { x: 6, y: 3 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(1, 1).setInteractive({ useHandCursor: true })
    testBtn.on('pointerover', () => testBtn.setColor('#aaaaff'))
    testBtn.on('pointerout', () => testBtn.setColor('#444466'))
    testBtn.on('pointerdown', () => { this.cameras.main.fadeOut(200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TestScene')) })

    HEROES.forEach((hero, i) => {
      let cx: number, cy: number
      if (isPortrait) {
        const col = i % cols
        const row = Math.floor(i / cols)
        cx = startX + col * (circleRadius * 2 + gap)
        cy = heroY + row * (rowH + gap)
      } else {
        cx = startX + i * (circleRadius * 2 + gap)
        cy = heroY
      }
      const colorHex = `#${hero.color.toString(16).padStart(6, '0')}`
      const isLocked = !UNLOCKED_HEROES.has(hero.type)

      // Circle background + border
      const g = this.add.graphics().setDepth(0)
      this.circles.push(g)
      this.drawCircle(g, cx, cy, circleRadius, isLocked ? 0x444444 : hero.color, false)

      // Animated sprite — circular mask
      const texKey = hero.asset.replace(/[^a-z0-9]/gi, '_')
      const sprY = cy + (hero.yOff || 0)
      const sprite = this.add.sprite(cx, sprY, texKey, 0)
        .setScale(hero.scale).setDepth(1)
      if (hero.tint) sprite.setTint(hero.tint)
      sprite.play(`start_idle_${hero.type}`)

      // Circular mask to clip sprite inside the circle
      const maskShape = this.make.graphics({ x: 0, y: 0 })
      maskShape.fillStyle(0xffffff)
      maskShape.fillCircle(cx, cy, circleRadius - 3)
      const mask = maskShape.createGeometryMask()
      sprite.setMask(mask)

      // Locked overlay: darken sprite + lock icon
      if (isLocked) {
        sprite.setTint(0x333333)
        const lockOverlay = this.add.graphics().setDepth(3)
        lockOverlay.fillStyle(0x000000, 0.5)
        lockOverlay.fillCircle(cx, cy, circleRadius - 3)
        // Lock icon — procedural padlock
        const lx = cx, ly = cy
        const lockG = this.add.graphics().setDepth(4)
        lockG.lineStyle(2, 0x888888, 1)
        // Shackle (arc)
        lockG.beginPath()
        lockG.arc(lx, ly - 6, 7, Math.PI, 0, false)
        lockG.strokePath()
        // Body (rect)
        lockG.fillStyle(0x666666, 1)
        lockG.fillRect(lx - 9, ly - 6, 18, 14)
        lockG.lineStyle(1, 0x888888, 1)
        lockG.strokeRect(lx - 9, ly - 6, 18, 14)
        // Keyhole
        lockG.fillStyle(0x222222, 1)
        lockG.fillCircle(lx, ly, 2)
        lockG.fillRect(lx - 1, ly, 2, 5)
      }

      // Hero name below circle
      const nameText = this.add.text(cx, cy + circleRadius + (compact ? 8 : 14), hero.name, {
        fontFamily: 'monospace', fontSize: isPortrait ? '10px' : (compact ? '11px' : '14px'),
        color: isLocked ? '#555555' : colorHex, stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(2)

      // Role below name
      this.add.text(cx, cy + circleRadius + (compact ? 22 : 32), hero.role, {
        fontFamily: 'monospace', fontSize: isPortrait ? '7px' : (compact ? '8px' : '10px'),
        color: isLocked ? '#444444' : '#888888', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(2)

      // Interactive zone over the circle
      const zone = this.add.zone(cx, cy, circleRadius * 2, circleRadius * 2 + 50)
        .setInteractive({ useHandCursor: !isLocked })

      if (isLocked) {
        // Locked heroes: shake + show unlock condition
        zone.on('pointerdown', () => {
          // Brief shake to indicate locked
          this.tweens.add({ targets: g, x: 3, duration: 40, yoyo: true, repeat: 2, onComplete: () => g.setX(0) })
          // Show floating unlock hint below the hero (fades after 2s)
          shouldShowHint(`locked_hero_tapped_${hero.type}`) // mark first tap
          const hintTxt = this.add.text(cx, cy + circleRadius + (compact ? 52 : 68), 'Play more runs to unlock', {
            fontFamily: 'monospace', fontSize: isPortrait ? '8px' : (compact ? '9px' : '11px'),
            color: '#aaaaaa', stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(5)
          this.tweens.add({
            targets: hintTxt, alpha: 0, duration: 600,
            delay: 1400,
            onComplete: () => hintTxt.destroy(),
          })
        })
      } else {
        zone.on('pointerover', () => {
          if (this.selectedIndex !== i) {
            this.drawCircle(g, cx, cy, circleRadius, hero.color, true)
            sprite.setScale(hero.scale * 1.15)
            nameText.setColor('#ffffff')
          }
        })

        zone.on('pointerout', () => {
          if (this.selectedIndex !== i) {
            this.drawCircle(g, cx, cy, circleRadius, hero.color, false)
            sprite.setScale(hero.scale)
            nameText.setColor(colorHex)
          }
        })

        zone.on('pointerdown', () => {
          // Deselect previous
          if (this.selectedIndex >= 0 && this.selectedIndex !== i) {
            const prev = HEROES[this.selectedIndex]
            let prevCx: number, prevCy: number
            if (isPortrait) {
              const pc = this.selectedIndex % cols
              const pr = Math.floor(this.selectedIndex / cols)
              prevCx = startX + pc * (circleRadius * 2 + gap)
              prevCy = heroY + pr * (rowH + gap)
            } else {
              prevCx = startX + this.selectedIndex * (circleRadius * 2 + gap)
              prevCy = heroY
            }
            this.drawCircle(this.circles[this.selectedIndex], prevCx, prevCy, circleRadius, prev.color, false)
          }

          this.selectedIndex = i
          this.drawCircle(g, cx, cy, circleRadius, hero.color, true)
          sprite.setScale(hero.scale * 1.15)

          // Enter fullscreen + lock landscape on mobile
          const isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1)
          if (isMob) {
            const el = document.documentElement as any
            if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
              const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {})
              // Try to lock orientation to landscape after fullscreen
              if (p && typeof p.then === 'function') {
                p.then(() => {
                  (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
                })
              }
            } else {
              (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
            }
          }

          // Save hero to encyclopedia
          unlockHero(hero.type)

          // Brief flash then start game scene directly
          this.cameras.main.flash(200, 255, 255, 255, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
            if (progress >= 1) {
              this.scene.start('LoadingScene', { hero: hero.type, map: this.selectedMap, playerName: this.playerName })
            }
          })
        })
      }
    })
  }

  private drawCircle(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, r: number,
    color: number, highlighted: boolean,
  ) {
    g.clear()

    if (highlighted) {
      // Outer glow
      g.fillStyle(color, 0.15)
      g.fillCircle(cx, cy, r + 8)
      g.fillStyle(color, 0.08)
      g.fillCircle(cx, cy, r + 14)
    }

    // Dark bg
    g.fillStyle(highlighted ? 0x222244 : 0x111122)
    g.fillCircle(cx, cy, r)

    // Border
    g.lineStyle(highlighted ? 3 : 2, color, highlighted ? 1 : 0.6)
    g.strokeCircle(cx, cy, r)

    // Inner subtle ring
    g.lineStyle(1, color, 0.2)
    g.strokeCircle(cx, cy, r - 4)
  }
}
