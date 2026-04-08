import Phaser from 'phaser'
import { StartScene } from './scenes/StartScene'
import { GameScene } from './scenes/GameScene'
import { UndeadMapScene } from './scenes/UndeadMapScene'
import { UIScene } from './scenes/UIScene'
import { LevelUpScene } from './scenes/LevelUpScene'
import { ProfileScene } from './scenes/ProfileScene'
import { TestScene } from './scenes/TestScene'
import { BossTestScene } from './scenes/BossTestScene'
import { EncyclopediaScene } from './scenes/EncyclopediaScene'
import { ForgeScene } from './scenes/ForgeScene'
import { LoadingScene } from './scenes/LoadingScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0d0d1a',
  parent: document.body,
  dom: {
    createContainer: true,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [StartScene, LoadingScene, ...(import.meta.env.DEV ? [TestScene, BossTestScene] : []), GameScene, UndeadMapScene, UIScene, LevelUpScene, ProfileScene, EncyclopediaScene, ForgeScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  input: {
    activePointers: 2,
  },
}

const game = new Phaser.Game(config);
(window as any).__PHASER_GAME__ = game

// Pause game when tab is hidden, resume when visible again (GameScene + UIScene only)
const PAUSEABLE_SCENES = ['GameScene', 'UndeadMapScene', 'UIScene']
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    for (const key of PAUSEABLE_SCENES) {
      const s = game.scene.getScene(key)
      if (s?.scene.isActive()) s.scene.pause()
    }
  } else {
    for (const key of PAUSEABLE_SCENES) {
      const s = game.scene.getScene(key)
      if (s?.scene.isPaused()) s.scene.resume()
    }
  }
})

// Try to lock orientation to landscape on mobile
try {
  (screen.orientation as any)?.lock?.('landscape').catch(() => {})
} catch (_) { /* not supported */ }

// Force correct sizing on mobile (Safari address bar, notch, etc.)
const resizeGame = () => {
  const w = window.innerWidth
  const h = window.innerHeight
  game.scale.resize(w, h)
  game.canvas.style.width = w + 'px'
  game.canvas.style.height = h + 'px'
}
window.addEventListener('resize', resizeGame)
window.addEventListener('orientationchange', () => setTimeout(resizeGame, 150))
// Initial kick after Safari settles
setTimeout(resizeGame, 300)
