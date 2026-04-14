import Phaser from 'phaser'

/**
 * Simple obstacle avoidance for ground mobs.
 * Checks rocks between mob and player; if one blocks the direct path,
 * steers the mob around it by offsetting the target angle.
 */
export function getSteeringTarget(
  mob: Phaser.Physics.Arcade.Sprite,
  playerX: number,
  playerY: number,
  rocks: Phaser.Physics.Arcade.StaticGroup,
): { x: number; y: number } {
  const dx = playerX - mob.x
  const dy = playerY - mob.y
  const distSq = dx * dx + dy * dy

  // If very close to player, go direct
  if (distSq < 6400) return { x: playerX, y: playerY } // 80*80

  const distToPlayer = Math.sqrt(distSq)
  const dirAngle = Math.atan2(dy, dx)

  // Precompute squared cull distance
  const cullDist = Math.min(distToPlayer, 200)
  const cullDistSq = cullDist * cullDist

  // Check rocks ahead in a narrow cone
  let closestBlocker: Phaser.Physics.Arcade.Sprite | null = null
  let closestDist = Infinity

  for (const rock of rocks.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    if (!rock.active) continue
    const rx = rock.x - mob.x
    const ry = rock.y - mob.y
    const rockDistSq = rx * rx + ry * ry

    // Squared distance cull — skip sqrt for most rocks
    if (rockDistSq > cullDistSq) continue
    if (rockDistSq < 400) continue // 20*20 — already overlapping

    // Only compute sqrt for rocks that survive the cull
    const rockDist = Math.sqrt(rockDistSq)

    // Check if rock is roughly in our path (within ~35 degrees)
    const rockAngle = Math.atan2(ry, rx)
    let angleDiff = rockAngle - dirAngle
    // Normalize to [-PI, PI]
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    else if (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    if (Math.abs(angleDiff) < 0.6) {
      // Check perpendicular distance to our path line
      const perpDist = Math.abs(Math.sin(angleDiff) * rockDist)
      const rockRadius = Math.max(rock.displayWidth, rock.displayHeight) * 0.4 + 25

      if (perpDist < rockRadius && rockDist < closestDist) {
        closestDist = rockDist
        closestBlocker = rock
      }
    }
  }

  if (!closestBlocker) return { x: playerX, y: playerY }

  // Steer around the blocking rock
  const rockAngle = Math.atan2(closestBlocker.y - mob.y, closestBlocker.x - mob.x)
  let angleDiff = rockAngle - dirAngle
  if (angleDiff > Math.PI) angleDiff -= Math.PI * 2
  else if (angleDiff < -Math.PI) angleDiff += Math.PI * 2

  const steerAngle = dirAngle + (angleDiff > 0 ? -0.9 : 0.9)
  const steerDist = Math.min(closestDist + 50, 150)

  return {
    x: mob.x + Math.cos(steerAngle) * steerDist,
    y: mob.y + Math.sin(steerAngle) * steerDist,
  }
}
