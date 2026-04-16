/**
 * NotificationBell — small bell icon with unread badge + popup list.
 * Usage: new NotificationBell(scene, x, y) — draws itself, handles click.
 */

import Phaser from 'phaser'
import { NotificationCenter, type GameNotification } from '../systems/NotificationCenter'
import { gameFont } from '../utils/device'

export class NotificationBell {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private gfx: Phaser.GameObjects.Graphics
  private badge?: Phaser.GameObjects.Text
  private hitZone: Phaser.GameObjects.Zone
  private pulseT: Phaser.Time.TimerEvent | null = null
  private haloGfx: Phaser.GameObjects.Graphics | null = null
  private haloTween: Phaser.Tweens.Tween | null = null

  // Popup state
  private popupGroup: Phaser.GameObjects.Container | null = null

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.container = scene.add.container(x, y).setDepth(80)

    this.gfx = scene.add.graphics()
    this.container.add(this.gfx)

    // Click zone
    this.hitZone = scene.add.zone(0, 0, 34, 34).setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.container.add(this.hitZone)
    this.hitZone.on('pointerover', () => this.draw(true))
    this.hitZone.on('pointerout', () => this.draw(false))
    this.hitZone.on('pointerdown', () => this.open())

    this.draw(false)
    this.updateBadge()
  }

  private draw(hover: boolean) {
    const g = this.gfx
    g.clear()
    const col = hover ? 0xffffff : 0xdddddd
    const a = hover ? 1 : 0.85
    // Bell body — rounded dome
    g.lineStyle(2.5, col, a)
    g.fillStyle(0x1a1a2e, 0.7)
    // Dome top
    g.beginPath()
    g.arc(0, -3, 9, Math.PI, 0, false)
    g.lineTo(11, 5)
    g.lineTo(-11, 5)
    g.closePath()
    g.fillPath()
    g.strokePath()
    // Clapper
    g.fillStyle(col, a)
    g.fillCircle(0, 8, 2)
    // Handle on top
    g.lineStyle(2.5, col, a)
    g.beginPath()
    g.moveTo(-3, -12)
    g.lineTo(3, -12)
    g.strokePath()
  }

  private updateBadge() {
    const count = NotificationCenter.unreadCount()
    if (count === 0) {
      if (this.badge) { this.badge.destroy(); this.badge = undefined }
      if (this.pulseT) { this.pulseT.destroy(); this.pulseT = null }
      if (this.haloTween) { this.haloTween.stop(); this.haloTween = null }
      if (this.haloGfx) { this.haloGfx.destroy(); this.haloGfx = null }
      this.container.setScale(1)
      return
    }
    // Red circle badge top-right
    if (!this.badge) {
      this.badge = this.scene.add.text(10, -10, '', {
        fontFamily: gameFont(), fontSize: '10px', color: '#000000',
        backgroundColor: '#FFD700', padding: { x: 4, y: 1 },
      } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setDepth(81)
      this.container.add(this.badge)
    }
    this.badge.setText(count > 9 ? '9+' : `${count}`)

    // Gentle pulse animation
    if (!this.pulseT) {
      this.scene.tweens.add({
        targets: this.container, scale: 1.12, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
      this.pulseT = this.scene.time.addEvent({ delay: 0 }) as unknown as Phaser.Time.TimerEvent
    }

    // Gold halo behind bell when unread
    if (!this.haloGfx) {
      this.haloGfx = this.scene.add.graphics()
      this.haloGfx.fillStyle(0xffd700, 0.15)
      this.haloGfx.fillCircle(0, 0, 18)
      this.container.addAt(this.haloGfx, 0) // behind everything
      this.haloTween = this.scene.tweens.add({
        targets: this.haloGfx, alpha: { from: 0.1, to: 0.25 },
        duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
    }
  }

  private close() {
    if (this.popupGroup) {
      this.popupGroup.destroy()
      this.popupGroup = null
      this.updateBadge()
    }
  }

  private open() {
    if (this.popupGroup) { this.close(); return }
    const { width, height } = this.scene.scale
    const group = this.scene.add.container(0, 0).setDepth(90)

    // Backdrop
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setInteractive()
    bg.on('pointerdown', () => this.close())
    group.add(bg)

    // Panel
    const panelW = Math.min(520, width - 40)
    const panelH = Math.min(560, height - 80)
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    const panel = this.scene.add.graphics()
    panel.fillStyle(0x0a0a1e, 0.96).fillRoundedRect(panelX, panelY, panelW, panelH, 12)
    panel.lineStyle(2, 0xFFD700, 0.5).strokeRoundedRect(panelX, panelY, panelW, panelH, 12)
    group.add(panel)

    // Title
    const title = this.scene.add.text(panelX + panelW / 2, panelY + 22, 'MESSAGES', {
      fontFamily: gameFont(), fontSize: '18px', color: '#FFD700',
    }).setOrigin(0.5, 0)
    group.add(title)

    // Close X
    const closeX = this.scene.add.text(panelX + panelW - 20, panelY + 16, '×', {
      fontFamily: gameFont(), fontSize: '24px', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeX.on('pointerover', () => closeX.setColor('#ffffff'))
    closeX.on('pointerout', () => closeX.setColor('#888888'))
    closeX.on('pointerdown', () => this.close())
    group.add(closeX)

    // List
    const notes = NotificationCenter.load()
    const listX = panelX + 20
    const listY = panelY + 56
    const rowH = 56
    const rowW = panelW - 40

    if (notes.length === 0) {
      const empty = this.scene.add.text(panelX + panelW / 2, panelY + panelH / 2, 'No messages', {
        fontFamily: gameFont(), fontSize: '14px', color: '#666666',
      }).setOrigin(0.5)
      group.add(empty)
    } else {
      notes.slice(0, 8).forEach((note, i) => {
        const rowY = listY + i * (rowH + 6)
        const row = this.scene.add.graphics()
        const rowBg = note.read ? 0x15152a : 0x2a1a0a
        row.fillStyle(rowBg, 0.8).fillRoundedRect(listX, rowY, rowW, rowH, 6)
        row.lineStyle(1, note.read ? 0x333344 : 0xFFD700, 0.7).strokeRoundedRect(listX, rowY, rowW, rowH, 6)
        group.add(row)

        // Unread dot
        if (!note.read) {
          const dot = this.scene.add.circle(listX + 10, rowY + rowH / 2, 4, 0xff4444)
          group.add(dot)
        }

        const titleTxt = this.scene.add.text(listX + 22, rowY + 10, note.title, {
          fontFamily: gameFont(), fontSize: '13px', color: note.read ? '#aaaaaa' : '#ffffff',
        })
        group.add(titleTxt)

        // Preview first line
        const preview = note.body.split('\n')[0].slice(0, 60)
        const previewTxt = this.scene.add.text(listX + 22, rowY + 28, preview, {
          fontFamily: gameFont(), fontSize: '10px', color: '#888888',
        })
        group.add(previewTxt)

        // Date
        const date = new Date(note.timestamp).toLocaleDateString()
        const dateTxt = this.scene.add.text(listX + rowW - 12, rowY + 10, date, {
          fontFamily: gameFont(), fontSize: '9px', color: '#666666',
        }).setOrigin(1, 0)
        group.add(dateTxt)

        // Click
        const zone = this.scene.add.zone(listX + rowW / 2, rowY + rowH / 2, rowW, rowH)
          .setInteractive({ useHandCursor: true })
        zone.on('pointerdown', () => {
          this.close()
          NotificationCenter.markRead(note.id)
          this.openDetail(note)
        })
        group.add(zone)
      })
    }

    this.popupGroup = group
  }

  private openDetail(note: GameNotification) {
    const { width, height } = this.scene.scale
    const group = this.scene.add.container(0, 0).setDepth(95)

    const cleanup = () => { group.destroy(); this.updateBadge() }

    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setInteractive()
    bg.on('pointerdown', cleanup)
    group.add(bg)

    const panelW = Math.min(600, width - 40)
    const panelH = Math.min(520, height - 60)
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    const panel = this.scene.add.graphics()
    panel.fillStyle(0x0a0a1e, 0.98).fillRoundedRect(panelX, panelY, panelW, panelH, 14)
    panel.lineStyle(3, 0xFFD700, 0.7).strokeRoundedRect(panelX, panelY, panelW, panelH, 14)
    group.add(panel)

    // Title
    const title = this.scene.add.text(panelX + panelW / 2, panelY + 24, note.title, {
      fontFamily: gameFont(), fontSize: '20px', color: '#FFD700',
      wordWrap: { width: panelW - 80 }, align: 'center',
    }).setOrigin(0.5, 0)
    group.add(title)

    // Close X
    const closeX = this.scene.add.text(panelX + panelW - 24, panelY + 16, '×', {
      fontFamily: gameFont(), fontSize: '28px', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeX.on('pointerover', () => closeX.setColor('#ffffff'))
    closeX.on('pointerout', () => closeX.setColor('#888888'))
    closeX.on('pointerdown', cleanup)
    group.add(closeX)

    // Scrollable content area bounds
    const contentTop = panelY + 60
    const contentBottom = panelY + panelH - 20
    const contentH = contentBottom - contentTop
    const contentX = panelX + 30
    const contentW = panelW - 60

    // Icon (inside scroll area, scrolls with body)
    let cursorY = contentTop + 10
    const scrollItems: Phaser.GameObjects.GameObject[] = []

    if (note.icon && this.scene.textures.exists(note.icon)) {
      const icon = this.scene.add.image(panelX + panelW / 2, cursorY + 32, note.icon, note.iconFrame ?? 0)
        .setDisplaySize(64, 64)
      scrollItems.push(icon)
      cursorY += 80
    } else if (note.iconFrame !== undefined && this.scene.textures.exists('skill_icons')) {
      const icon = this.scene.add.image(panelX + panelW / 2, cursorY + 32, 'skill_icons', note.iconFrame)
        .setDisplaySize(64, 64)
      scrollItems.push(icon)
      cursorY += 80
    }

    // Body
    const body = this.scene.add.text(contentX, cursorY, note.body, {
      fontFamily: gameFont(), fontSize: '12px', color: '#cccccc',
      wordWrap: { width: contentW }, lineSpacing: 4,
    })
    scrollItems.push(body)

    // Mask — clip content to panel bounds (use shape graphics)
    const maskShape = this.scene.make.graphics({ x: 0, y: 0 })
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(panelX + 2, contentTop, panelW - 4, contentH)
    const mask = maskShape.createGeometryMask()
    scrollItems.forEach((obj) => {
      ;(obj as any).setMask?.(mask)
      group.add(obj)
    })

    // Total scrollable height
    const totalContentH = (cursorY - contentTop) + body.height + 20
    const maxScroll = Math.max(0, totalContentH - contentH)

    // Scroll state
    let scrollY = 0
    const originalYs = scrollItems.map((o) => (o as any).y as number)

    const applyScroll = () => {
      scrollItems.forEach((o, i) => { (o as any).y = originalYs[i] - scrollY })
      if (maxScroll > 0 && scrollbar) {
        const ratio = scrollY / maxScroll
        const thumbY = contentTop + ratio * (contentH - thumbH)
        scrollbar.clear()
        // Track
        scrollbar.fillStyle(0x1a1a2e, 0.6)
        scrollbar.fillRoundedRect(panelX + panelW - 10, contentTop, 4, contentH, 2)
        // Thumb
        scrollbar.fillStyle(0xFFD700, 0.6)
        scrollbar.fillRoundedRect(panelX + panelW - 10, thumbY, 4, thumbH, 2)
      }
    }

    // Scrollbar
    let scrollbar: Phaser.GameObjects.Graphics | null = null
    const thumbH = maxScroll > 0 ? Math.max(20, (contentH / totalContentH) * contentH) : contentH
    if (maxScroll > 0) {
      scrollbar = this.scene.add.graphics()
      group.add(scrollbar)
      applyScroll()
    }

    // Wheel scroll — panel-bound
    const wheelHandler = (_pointer: Phaser.Input.Pointer, _gos: any, _dx: number, dy: number) => {
      scrollY = Phaser.Math.Clamp(scrollY + dy * 0.5, 0, maxScroll)
      applyScroll()
    }
    this.scene.input.on('wheel', wheelHandler)

    // Drag scroll (touch / mouse)
    let dragStartY = 0
    let dragStartScroll = 0
    let dragging = false
    const scrollZone = this.scene.add.zone(panelX + panelW / 2, contentTop + contentH / 2, panelW - 4, contentH)
      .setOrigin(0.5).setInteractive()
    scrollZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragging = true
      dragStartY = p.y
      dragStartScroll = scrollY
    })
    scrollZone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown) return
      scrollY = Phaser.Math.Clamp(dragStartScroll + (dragStartY - p.y), 0, maxScroll)
      applyScroll()
    })
    scrollZone.on('pointerup', () => { dragging = false })
    scrollZone.on('pointerout', () => { dragging = false })
    group.add(scrollZone)

    // Cleanup wheel listener on group destroy
    group.once('destroy', () => { this.scene.input.off('wheel', wheelHandler) })
  }

  /** Call on scene shutdown to clean up */
  destroy() {
    if (this.popupGroup) this.popupGroup.destroy()
    if (this.pulseT) this.pulseT.destroy()
    this.container.destroy()
  }
}
