import Phaser from 'phaser'
import { GameScene } from './GameScene'
import { CONFIG } from '../config/GameConfig'

/**
 * Undead map: dark void with stone islands connected by bridges.
 * Uses 16x16 tiles from the undead tileset at scale 4 (= 64px game tiles).
 */

// Island definition: center position (relative to world center) + radius in px
interface Island {
  ox: number   // offset from world center X
  oy: number   // offset from world center Y
  r: number    // radius in px
}

// Bridge: connects two islands
interface Bridge {
  from: number  // island index
  to: number    // island index
  w: number     // width in px
}

// Main island cluster layout — large islands, wide bridges, minimal void
const ISLANDS: Island[] = [
  { ox: 0,     oy: 0,     r: 620 },   // 0: Central plateau (huge)
  { ox: -750,  oy: -600,  r: 450 },   // 1: NW graveyard
  { ox: 750,   oy: -600,  r: 480 },   // 2: NE ruins
  { ox: -800,  oy: 600,   r: 420 },   // 3: SW crystal cave
  { ox: 800,   oy: 600,   r: 450 },   // 4: SE bone fields
  { ox: 0,     oy: -1050, r: 380 },   // 5: N dark shrine
  { ox: 0,     oy: 1050,  r: 400 },   // 6: S lich domain
  { ox: -1250, oy: 0,     r: 350 },   // 7: W outpost
  { ox: 1250,  oy: 0,     r: 350 },   // 8: E outpost
]

const BRIDGES: Bridge[] = [
  { from: 0, to: 1, w: 220 },
  { from: 0, to: 2, w: 220 },
  { from: 0, to: 3, w: 220 },
  { from: 0, to: 4, w: 220 },
  { from: 0, to: 5, w: 180 },
  { from: 0, to: 6, w: 180 },
  { from: 1, to: 5, w: 160 },
  { from: 2, to: 5, w: 160 },
  { from: 3, to: 6, w: 160 },
  { from: 4, to: 6, w: 160 },
  { from: 1, to: 7, w: 140 },
  { from: 3, to: 7, w: 140 },
  { from: 2, to: 8, w: 140 },
  { from: 4, to: 8, w: 140 },
  { from: 1, to: 3, w: 120 },
  { from: 2, to: 4, w: 120 },
]

export class UndeadMapScene extends GameScene {
  constructor() {
    super({ key: 'UndeadMapScene' })
  }

  preload() {
    super.preload()

    // Undead ground tileset (Tiled version: 416x1392, 16x16 tiles, 26 cols × 87 rows)
    this.load.spritesheet('undead_ground', 'assets/undead/Ground_rocks.png', {
      frameWidth: 16, frameHeight: 16,
    })

    // Undead prop images
    this.load.image('undead_grave1', 'assets/undead/Grave_shadow1_1.png')
    this.load.image('undead_grave2', 'assets/undead/Grave_shadow1_2.png')
    this.load.image('undead_grave3', 'assets/undead/Grave_shadow1_3.png')
    this.load.image('undead_grave4', 'assets/undead/Grave_shadow1_4.png')
    this.load.image('undead_ruin1', 'assets/undead/Ruin_shadow1_1.png')
    this.load.image('undead_ruin2', 'assets/undead/Ruin_shadow1_2.png')
    this.load.image('undead_ruin3', 'assets/undead/Ruin_shadow1_3.png')
    this.load.image('undead_dead_tree1', 'assets/undead/Dead_tree_shadow1_1.png')
    this.load.image('undead_dead_tree2', 'assets/undead/Dead_tree_shadow1_2.png')
    this.load.image('undead_broken_tree1', 'assets/undead/Broken_tree_shadow1_1.png')
    this.load.image('undead_broken_tree2', 'assets/undead/Broken_tree_shadow1_2.png')
    this.load.image('undead_crystal1', 'assets/undead/Crystal_shadow1_1.png')
    this.load.image('undead_crystal2', 'assets/undead/Crystal_shadow1_2.png')
    this.load.image('undead_bones1', 'assets/undead/Bones_shadow1_1.png')
    this.load.image('undead_bones2', 'assets/undead/Bones_shadow1_2.png')
    this.load.image('undead_skulls', 'assets/undead/Pile_sculls_shadow1.png')
    this.load.image('undead_dead_arm', 'assets/undead/Dead_arm_shadow1_1.png')
    this.load.image('undead_thorn1', 'assets/undead/Thorn_plant_shadow1_1.png')
    this.load.image('undead_thorn2', 'assets/undead/Thorn_plant_shadow1_2.png')
  }

  // Check if a world pixel is on solid ground (island or bridge)
  private isOnGround(px: number, py: number): boolean {
    const cx = CONFIG.WORLD_WIDTH / 2
    const cy = CONFIG.WORLD_HEIGHT / 2

    // Check islands
    for (const island of ISLANDS) {
      const ix = cx + island.ox
      const iy = cy + island.oy
      const dist = Phaser.Math.Distance.Between(px, py, ix, iy)
      if (dist <= island.r) return true
    }

    // Check bridges
    for (const bridge of BRIDGES) {
      const a = ISLANDS[bridge.from]
      const b = ISLANDS[bridge.to]
      const ax = cx + a.ox, ay = cy + a.oy
      const bx = cx + b.ox, by = cy + b.oy

      // Point-to-segment distance
      const dx = bx - ax, dy = by - ay
      const len2 = dx * dx + dy * dy
      if (len2 === 0) continue
      let t = ((px - ax) * dx + (py - ay) * dy) / len2
      t = Math.max(0, Math.min(1, t))
      const projX = ax + t * dx
      const projY = ay + t * dy
      const distToBridge = Phaser.Math.Distance.Between(px, py, projX, projY)
      if (distToBridge <= bridge.w / 2) return true
    }

    return false
  }

  // Get which island index this point is closest to (for themed decorations)
  private getIslandIdx(px: number, py: number): number {
    const cx = CONFIG.WORLD_WIDTH / 2
    const cy = CONFIG.WORLD_HEIGHT / 2
    let bestIdx = 0, bestDist = Infinity
    for (let i = 0; i < ISLANDS.length; i++) {
      const d = Phaser.Math.Distance.Between(px, py, cx + ISLANDS[i].ox, cy + ISLANDS[i].oy)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    return bestIdx
  }

  protected drawTerrain() {
    const tileSize = CONFIG.TILE_SIZE

    const rng = (x: number, y: number, salt: number) => {
      const n = Math.sin(x * 127.1 + y * 311.7 + salt * 42) * 43758.5453
      return n - Math.floor(n)
    }

    // Ground_rocks (Tiled layout): 26 cols × 87 rows, 16x16 tiles
    // Verified fill frames from TMX analysis:
    //   Light fill (mean=111, var=14): 54, 253, 256, 433
    //   Light varied (var=41): 235, 239, 339, 342, 345
    //   Dark fill (mean=86, var=14): 1495
    const FILL_LIGHT = [54, 253, 256, 433]
    const FILL_VARIED = [235, 239, 339, 342, 345]
    const FILL_DARK = [1495]

    const cols = Math.ceil(CONFIG.WORLD_WIDTH / tileSize)
    const rows = Math.ceil(CONFIG.WORLD_HEIGHT / tileSize)

    // Dark void background
    this.add.rectangle(
      CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2,
      CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT,
      0x0a0812
    ).setDepth(-1)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * tileSize + tileSize / 2
        const py = r * tileSize + tileSize / 2

        if (!this.isOnGround(px, py)) continue

        const rand = rng(c, r, 3)
        const islandIdx = this.getIslandIdx(px, py)

        // Central islands: light ground, outer islands: darker
        let frame: number
        if (islandIdx === 0) {
          // Central plateau: mostly uniform light fill
          frame = rand < 0.15
            ? FILL_VARIED[Math.floor(rng(c, r, 7) * FILL_VARIED.length)]
            : FILL_LIGHT[Math.floor(rng(c, r, 7) * FILL_LIGHT.length)]
        } else if (islandIdx <= 4) {
          // Inner ring: mix of light and varied
          frame = rand < 0.3
            ? FILL_VARIED[Math.floor(rng(c, r, 7) * FILL_VARIED.length)]
            : FILL_LIGHT[Math.floor(rng(c, r, 7) * FILL_LIGHT.length)]
        } else {
          // Outer islands: dark fill
          frame = rand < 0.3
            ? FILL_LIGHT[Math.floor(rng(c, r, 7) * FILL_LIGHT.length)]
            : FILL_DARK[0]
        }

        this.add.image(px, py, 'undead_ground', frame)
          .setScale(4)
          .setDepth(0)
      }
    }
  }

  protected scatterDecorations() {
    const cx = CONFIG.WORLD_WIDTH / 2
    const cy = CONFIG.WORLD_HEIGHT / 2
    this.treePositions = []

    const MIN_DIST = 100
    const MAX_ATTEMPTS = 80
    const placed: { x: number; y: number }[] = []

    // Only place on ground
    const tryPlace = (islandIdx: number): { x: number; y: number } | null => {
      const island = ISLANDS[islandIdx]
      const ix = cx + island.ox, iy = cy + island.oy

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const angle = Math.random() * Math.PI * 2
        const dist = Phaser.Math.FloatBetween(30, island.r * 0.85)
        const x = ix + Math.cos(angle) * dist
        const y = iy + Math.sin(angle) * dist
        if (!this.isOnGround(x, y)) continue
        if (placed.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < MIN_DIST)) continue
        return { x, y }
      }
      return null
    }

    // Fixed scale per sprite size — no random variance
    const propScales: Record<string, number> = {
      undead_grave1: 2.5, undead_grave2: 2.5, undead_grave3: 2.5, undead_grave4: 2.5,  // 32px → 80
      undead_bones1: 3, undead_bones2: 5,  // 32px→96, 16px→80
      undead_crystal1: 1.5, undead_crystal2: 1.5,  // 64px → 96
      undead_dead_arm: 1.5,  // 64px → 96
      undead_ruin1: 1, undead_ruin2: 1, undead_ruin3: 1.5,  // 128→128, 64→96
      undead_dead_tree1: 1, undead_dead_tree2: 1,  // 128px → 128
      undead_broken_tree1: 1, undead_broken_tree2: 3,  // 128→128, 32→96
      undead_thorn1: 0.9, undead_thorn2: 0.9,  // 128px → 115
      undead_skulls: 0.8,  // 128px → 102
    }

    const addProp = (x: number, y: number, key: string, tint?: number) => {
      placed.push({ x, y })
      this.treePositions.push({ x, y })
      const s = propScales[key] ?? 1.0
      const img = this.add.image(x, y, key).setDepth(3).setScale(s)
      if (tint !== undefined) img.setTint(tint)
    }

    const pick = <T>(arr: T[]): T => arr[Phaser.Math.Between(0, arr.length - 1)]

    const graveKeys = ['undead_grave1', 'undead_grave2', 'undead_grave3', 'undead_grave4']
    const ruinKeys = ['undead_ruin1', 'undead_ruin2', 'undead_ruin3']
    const deadTreeKeys = ['undead_dead_tree1', 'undead_dead_tree2']
    const brokenTreeKeys = ['undead_broken_tree1', 'undead_broken_tree2']
    const crystalKeys = ['undead_crystal1', 'undead_crystal2']
    const bonesKeys = ['undead_bones1', 'undead_bones2']
    const thornKeys = ['undead_thorn1', 'undead_thorn2']

    // --- Island 0: Central Plateau — sparse, spawn area ---
    for (let i = 0; i < 3; i++) {
      const p = tryPlace(0)
      if (p) addProp(p.x, p.y, pick(bonesKeys))
    }
    for (let i = 0; i < 3; i++) {
      const p = tryPlace(0)
      if (p) addProp(p.x, p.y, pick(thornKeys))
    }
    for (let i = 0; i < 3; i++) {
      const p = tryPlace(0)
      if (p) addProp(p.x, p.y, pick(deadTreeKeys))
    }

    // --- Island 1: NW Graveyard ---
    for (let i = 0; i < 10; i++) {
      const p = tryPlace(1)
      if (p) addProp(p.x, p.y, pick(graveKeys), 0xaaaacc)
    }
    for (let i = 0; i < 4; i++) {
      const p = tryPlace(1)
      if (p) addProp(p.x, p.y, pick(deadTreeKeys), 0x778877)
    }
    for (let i = 0; i < 3; i++) {
      const p = tryPlace(1)
      if (p) addProp(p.x, p.y, pick(bonesKeys))
    }

    // --- Island 2: NE Ruins ---
    for (let i = 0; i < 7; i++) {
      const p = tryPlace(2)
      if (p) addProp(p.x, p.y, pick(ruinKeys), 0xbbbbcc)
    }
    for (let i = 0; i < 5; i++) {
      const p = tryPlace(2)
      if (p) addProp(p.x, p.y, pick(graveKeys))
    }
    for (let i = 0; i < 4; i++) {
      const p = tryPlace(2)
      if (p) addProp(p.x, p.y, pick(brokenTreeKeys))
    }

    // --- Island 3: SW Crystal Cave ---
    for (let i = 0; i < 8; i++) {
      const p = tryPlace(3)
      if (p) addProp(p.x, p.y, pick(crystalKeys), 0x8888dd)
    }
    for (let i = 0; i < 4; i++) {
      const p = tryPlace(3)
      if (p) addProp(p.x, p.y, pick(thornKeys), 0x667766)
    }
    for (let i = 0; i < 3; i++) {
      const p = tryPlace(3)
      if (p) addProp(p.x, p.y, pick(deadTreeKeys))
    }

    // --- Island 4: SE Bone Fields ---
    for (let i = 0; i < 8; i++) {
      const p = tryPlace(4)
      if (p) addProp(p.x, p.y, pick(bonesKeys))
    }
    for (let i = 0; i < 5; i++) {
      const p = tryPlace(4)
      if (p) addProp(p.x, p.y, 'undead_skulls')
    }
    for (let i = 0; i < 3; i++) {
      const p = tryPlace(4)
      if (p) addProp(p.x, p.y, 'undead_dead_arm')
    }

    // --- Island 5: N Dark Shrine ---
    for (let i = 0; i < 5; i++) {
      const p = tryPlace(5)
      if (p) addProp(p.x, p.y, pick(ruinKeys), 0x9999aa)
    }
    for (let i = 0; i < 4; i++) {
      const p = tryPlace(5)
      if (p) addProp(p.x, p.y, pick(crystalKeys), 0xaa88dd)
    }

    // --- Island 6: S Lich Domain ---
    for (let i = 0; i < 4; i++) {
      const p = tryPlace(6)
      if (p) addProp(p.x, p.y, pick(ruinKeys))
    }
    for (let i = 0; i < 6; i++) {
      const p = tryPlace(6)
      if (p) addProp(p.x, p.y, pick(graveKeys), 0x889988)
    }
    for (let i = 0; i < 3; i++) {
      const p = tryPlace(6)
      if (p) addProp(p.x, p.y, 'undead_dead_arm')
    }

    // --- Islands 7 & 8: Outposts ---
    for (const idx of [7, 8]) {
      for (let i = 0; i < 4; i++) {
        const p = tryPlace(idx)
        if (p) addProp(p.x, p.y, pick(deadTreeKeys))
      }
      for (let i = 0; i < 3; i++) {
        const p = tryPlace(idx)
        if (p) addProp(p.x, p.y, pick(thornKeys))
      }
      for (let i = 0; i < 2; i++) {
        const p = tryPlace(idx)
        if (p) addProp(p.x, p.y, pick(crystalKeys), 0x7777bb)
      }
      for (let i = 0; i < 2; i++) {
        const p = tryPlace(idx)
        if (p) addProp(p.x, p.y, pick(graveKeys))
      }
    }
  }
}
