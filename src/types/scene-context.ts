import type Phaser from 'phaser'

/**
 * Subset of GameScene / UndeadMapScene properties that hero and enemy modules
 * need to access from outside the scene class. Beats `(scene as any).foo`
 * casts that bypass TypeScript entirely. Keep minimal — only add fields that
 * are actually accessed cross-module.
 */
export interface GameSceneContext extends Phaser.Scene {
  enemies?: Phaser.Physics.Arcade.Group
  rocks?: Phaser.Physics.Arcade.StaticGroup
  chests?: Phaser.GameObjects.Group
  /** Per-frame kill counter used by BaseEnemy.die() for hit-stop detection */
  _frameKills?: number
}
