import Phaser from 'phaser'

/**
 * Trail particle pool — reuse inactive circles instead of create/destroy every 25-30ms.
 * Eliminates GC pressure from high-frequency trail spawning across multiple projectiles.
 */

function getTrailPool(scene: Phaser.Scene): Phaser.GameObjects.Arc[] {
  if (!(scene as any)._trailPool) (scene as any)._trailPool = []
  return (scene as any)._trailPool as Phaser.GameObjects.Arc[]
}

export function spawnTrailCircle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number
): Phaser.GameObjects.Arc {
  const pool = getTrailPool(scene)
  let trail = pool.find(t => !t.active)
  if (trail) {
    trail
      .setPosition(x, y)
      .setRadius(radius)
      .setFillStyle(color, alpha)
      .setActive(true)
      .setVisible(true)
      .setScale(1)
      .setAlpha(alpha)
  } else {
    trail = scene.add.circle(x, y, radius, color, alpha).setDepth(8)
    pool.push(trail)
  }
  return trail
}
