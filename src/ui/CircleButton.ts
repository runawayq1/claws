import Phaser from 'phaser'
import { gameFont } from '../utils/device'

export interface CircleButtonConfig {
  x: number
  y: number
  radius?: number
  icon: string
  label?: string
  labelSide?: 'left' | 'right'
  onClick: () => void
  depth?: number
}

export interface CircleButtonHandle {
  graphics: Phaser.GameObjects.Graphics
  iconText: Phaser.GameObjects.Text
  labelText: Phaser.GameObjects.Text | null
  zone: Phaser.GameObjects.Zone
  destroy: () => void
}

export function makeCircleButton(
  scene: Phaser.Scene,
  config: CircleButtonConfig,
): CircleButtonHandle {
  const {
    x, y,
    radius = 16,
    icon,
    label,
    labelSide = 'right',
    onClick,
    depth = 10,
  } = config

  const gfx = scene.add.graphics().setDepth(depth)

  const draw = (hovered: boolean) => {
    gfx.clear()
    gfx.fillStyle(0x1a1a28, 0.9)
    gfx.fillCircle(x, y, radius)
    gfx.lineStyle(1, hovered ? 0x888899 : 0x555566, 1)
    gfx.strokeCircle(x, y, radius)
  }
  draw(false)

  const fontSize = radius <= 13 ? '18px' : '22px'
  const iconText = scene.add.text(x - 1, y - 1, icon, {
    fontFamily: gameFont(),
    fontSize,
    color: '#aaaabb',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 1)

  let labelText: Phaser.GameObjects.Text | null = null
  if (label) {
    const labelFontSize = radius <= 13 ? '10px' : '11px'
    const gap = radius + 8
    const lx = labelSide === 'left' ? x - gap : x + gap
    const originX = labelSide === 'left' ? 1 : 0
    labelText = scene.add.text(lx, y, label, {
      fontFamily: gameFont(),
      fontSize: labelFontSize,
      color: '#888899',
    }).setOrigin(originX, 0.5).setDepth(depth)
  }

  const zone = scene.add
    .zone(x, y, radius * 2 + 4, radius * 2 + 4)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 2)

  zone.on('pointerover', () => {
    draw(true)
    iconText.setColor('#ffffff')
    if (labelText) labelText.setColor('#ffffff')
  })
  zone.on('pointerout', () => {
    draw(false)
    iconText.setColor('#aaaabb')
    if (labelText) labelText.setColor('#888899')
  })
  zone.on('pointerdown', onClick)

  const destroy = () => {
    gfx.destroy()
    iconText.destroy()
    if (labelText) labelText.destroy()
    zone.destroy()
  }

  return { graphics: gfx, iconText, labelText, zone, destroy }
}
