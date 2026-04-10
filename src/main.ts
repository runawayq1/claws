import Phaser from 'phaser'
import { CONFIG } from './config/GameConfig'
import { NameInputScene } from './scenes/NameInputScene'
import { StartScene } from './scenes/StartScene'
import { GameScene } from './scenes/GameScene'
import { UndeadMapScene } from './scenes/UndeadMapScene'
import { UIScene } from './scenes/UIScene'
import { LevelUpScene } from './scenes/LevelUpScene'
import { ProfileScene } from './scenes/ProfileScene'
import { TestScene } from './scenes/TestScene'
import { BossTestScene } from './scenes/BossTestScene'
import { SwordsTestScene } from './scenes/SwordsTestScene'
import { EncyclopediaScene } from './scenes/EncyclopediaScene'
import { ForgeScene } from './scenes/ForgeScene'
import { LeaderboardScene } from './scenes/LeaderboardScene'
import { LoadingScene } from './scenes/LoadingScene'

// Bigger displays (anything wider than a 2020 MacBook Air's 1440 CSS px) get
// a 30% logical zoom — Phaser renders at a smaller logical size, then the
// canvas is CSS-stretched to fill the window so every world/UI element looks
// 1.3× larger without per-scene changes. Requires Scale.NONE so Phaser doesn't
// auto-fit the canvas back to the parent and clobber our sizing.
const ZOOM_THRESHOLD_W = 1440
function getRenderZoom(w: number): number {
  return w > ZOOM_THRESHOLD_W ? 1.3 : 1.0
}
const initZoom = getRenderZoom(window.innerWidth)
const initLogicalW = Math.round(window.innerWidth / initZoom)
const initLogicalH = Math.round(window.innerHeight / initZoom)

// Size map chunks so the 3x3 grid always covers the canvas with margin.
// Worst-case visible half-extent from the player is 1 chunk (when the player
// sits at a chunk edge), so each chunk must be at least half the longest
// canvas dimension. CHUNK_TILES is rounded up to the nearest tile.
{
  const minChunkPx = Math.max(initLogicalW, initLogicalH) / 2 + 200 // margin for offscreen culling
  const tiles = Math.max(15, Math.ceil(minChunkPx / CONFIG.TILE_SIZE))
  CONFIG.CHUNK_TILES = tiles
  CONFIG.CHUNK_SIZE = tiles * CONFIG.TILE_SIZE
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: initLogicalW,
  height: initLogicalH,
  backgroundColor: '#0d0d1a',
  parent: document.body,
  dom: {
    createContainer: true,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [NameInputScene, StartScene, LoadingScene, ...(import.meta.env.DEV ? [TestScene, BossTestScene, SwordsTestScene] : []), GameScene, UndeadMapScene, UIScene, LevelUpScene, ProfileScene, EncyclopediaScene, ForgeScene, LeaderboardScene],
  scale: {
    // NONE = we own canvas size; RESIZE auto-fits to parent and overrides our
    // CSS stretching, so the zoom strategy never took effect. resizeGame()
    // below sets both the logical game size and the canvas CSS size manually.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  pixelArt: true,
  input: {
    activePointers: 2,
  },
}

const game = new Phaser.Game(config);
(window as any).__PHASER_GAME__ = game

// Pause game when tab is hidden, resume when visible again (GameScene + UIScene only)
// Only resume scenes that were running before the tab hide — never override a manual
// pause triggered by the player (UIScene.isPaused tracks that state).
const PAUSEABLE_SCENES = ['GameScene', 'UndeadMapScene', 'UIScene']
const _autoHidePaused = new Set<string>()
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    _autoHidePaused.clear()
    for (const key of PAUSEABLE_SCENES) {
      const s = game.scene.getScene(key)
      if (s?.scene.isActive()) {
        s.scene.pause()
        _autoHidePaused.add(key)
      }
    }
  } else {
    // Only resume scenes we actually paused here, and only if UIScene is not
    // in a manual-pause state (which keeps GameScene intentionally paused).
    const uiScene = game.scene.getScene('UIScene') as any
    const manuallyPaused = uiScene?.isPaused === true
    for (const key of _autoHidePaused) {
      if (manuallyPaused && (key === 'GameScene' || key === 'UndeadMapScene')) continue
      const s = game.scene.getScene(key)
      if (s?.scene.isPaused()) s.scene.resume()
    }
    _autoHidePaused.clear()
  }
})

// Try to lock orientation to landscape on mobile
try {
  (screen.orientation as any)?.lock?.('landscape').catch(() => {})
} catch (_) { /* not supported */ }

// Force correct sizing on mobile (Safari address bar, notch, etc.) AND apply
// the global zoom: render at logicalW x logicalH, stretch the canvas via CSS
// to fill the real window. With Scale.NONE this sticks (RESIZE used to clobber
// the style on every browser resize event).
const resizeGame = () => {
  const w = window.innerWidth
  const h = window.innerHeight
  const z = getRenderZoom(w)
  const lw = Math.round(w / z)
  const lh = Math.round(h / z)
  game.scale.resize(lw, lh)
  game.canvas.style.width = w + 'px'
  game.canvas.style.height = h + 'px'
  game.canvas.style.display = 'block'
}
// Apply once immediately so the initial canvas matches the window before any
// browser resize event fires.
resizeGame()
window.addEventListener('resize', resizeGame)
window.addEventListener('orientationchange', () => setTimeout(resizeGame, 150))
// Safari-on-mobile sometimes settles after a short delay (address bar, notch).
setTimeout(resizeGame, 300)
