import Phaser from 'phaser'

const TEX_KEY = 'bg_diag_tile'
const TILE_SIZE = 64

function ensureTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(TEX_KEY)) return
  const g = scene.add.graphics()
  // Drifting dust — bright core dot + faint glow halo for visibility
  const dots: Array<[number, number, number]> = [
    [10, 12, 1.8],
    [42, 20, 1.4],
    [24, 46, 1.6],
    [54, 50, 1.9],
    [6, 36, 1.3],
    [34, 6, 1.2],
    [50, 34, 1.1],
    [18, 28, 1.0],
  ]
  // Halo
  g.fillStyle(0xaabbff, 0.04)
  for (const [x, y, r] of dots) g.fillCircle(x, y, r + 1.2)
  // Core
  g.fillStyle(0xffffff, 0.15)
  for (const [x, y, r] of dots) g.fillCircle(x, y, r)
  g.generateTexture(TEX_KEY, TILE_SIZE, TILE_SIZE)
  g.destroy()
}

/**
 * Adds a tiled, diagonally-scrolling background that fills the scene.
 * The tile sprite is placed at depth -100 so it sits behind every other GO.
 * Cleans up its update handler on scene shutdown.
 */
export function addDiagonalBg(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  ensureTexture(scene)
  const ts = scene.add.tileSprite(0, 0, scene.scale.width, scene.scale.height, TEX_KEY)
    .setOrigin(0, 0)
    .setDepth(-100)
    .setScrollFactor(0)
    .setAlpha(1)

  const onUpdate = (_t: number, dt: number) => {
    // Negative values = visual content drifts right + up
    ts.tilePositionX -= 0.012 * dt
    ts.tilePositionY -= 0.020 * dt
  }
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate)

  const onResize = () => ts.setSize(scene.scale.width, scene.scale.height)
  scene.scale.on('resize', onResize)

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate)
    scene.scale.off('resize', onResize)
  })

  return ts
}
