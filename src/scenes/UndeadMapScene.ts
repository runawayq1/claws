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
    const ss = (key: string, path: string, fw: number, fh: number) => {
      if (!this.textures.exists(key)) this.load.spritesheet(key, path, { frameWidth: fw, frameHeight: fh })
    }
    const img = (key: string, path: string) => {
      if (!this.textures.exists(key)) this.load.image(key, path)
    }
    // Undead-only enemies
    ss('darkbat_idle',   'assets/dark_bat/idle.png',   64, 64)
    ss('darkbat_attack', 'assets/dark_bat/attack.png', 64, 64)
    ss('darkbat_hurt',   'assets/dark_bat/hurt.png',   64, 64)
    ss('darkbat_death',  'assets/dark_bat/death.png',  64, 64)
    ss('fdemon_idle',       'assets/flying_demon/idle.png',       79, 69)
    ss('fdemon_attack',     'assets/flying_demon/attack.png',     79, 69)
    ss('fdemon_hurt',       'assets/flying_demon/hurt.png',       79, 69)
    ss('fdemon_death',      'assets/flying_demon/death.png',      79, 69)
    ss('fdemon_flying',     'assets/flying_demon/flying.png',     79, 69)
    ss('fdemon_projectile', 'assets/flying_demon/projectile.png', 16, 32)
    // Undead terrain
    ss('undead_ground', 'assets/undead/Ground_rocks.png', 16, 16)
    ss('undead_floor', 'assets/undead/floor_tiles.png', 64, 64)
    img('undead_grave1',       'assets/undead/Grave_shadow1_1.png')
    img('undead_grave2',       'assets/undead/Grave_shadow1_2.png')
    img('undead_grave3',       'assets/undead/Grave_shadow1_3.png')
    img('undead_grave4',       'assets/undead/Grave_shadow1_4.png')
    img('undead_ruin1',        'assets/undead/Ruin_shadow1_1.png')
    img('undead_ruin2',        'assets/undead/Ruin_shadow1_2.png')
    img('undead_ruin3',        'assets/undead/Ruin_shadow1_3.png')
    img('undead_dead_tree1',   'assets/undead/Dead_tree_shadow1_1.png')
    img('undead_dead_tree2',   'assets/undead/Dead_tree_shadow1_2.png')
    img('undead_broken_tree1', 'assets/undead/Broken_tree_shadow1_1.png')
    img('undead_broken_tree2', 'assets/undead/Broken_tree_shadow1_2.png')
    img('undead_crystal1',     'assets/undead/Crystal_shadow1_1.png')
    img('undead_crystal2',     'assets/undead/Crystal_shadow1_2.png')
    img('undead_bones1',       'assets/undead/Bones_shadow1_1.png')
    img('undead_bones2',       'assets/undead/Bones_shadow1_2.png')
    img('undead_skulls',       'assets/undead/Pile_sculls_shadow1.png')
    img('undead_dead_arm',     'assets/undead/Dead_arm_shadow1_1.png')
    img('undead_thorn1',       'assets/undead/Thorn_plant_shadow1_1.png')
    img('undead_thorn2',       'assets/undead/Thorn_plant_shadow1_2.png')
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

  protected drawTerrainProgressive() {
    const tileSize = CONFIG.TILE_SIZE
    const totalRows = Math.ceil(CONFIG.WORLD_HEIGHT / tileSize)
    const cols = Math.ceil(CONFIG.WORLD_WIDTH / tileSize)

    const rng = (x: number, y: number, salt: number) => {
      const n = Math.sin(x * 127.1 + y * 311.7 + salt * 42) * 43758.5453
      return n - Math.floor(n)
    }

    const FILL_LIGHT = [54, 253, 256, 433]
    const FILL_VARIED = [235, 239, 339, 342, 345]

    // Clear the green base fill from the parent class so void areas are transparent
    this.terrainRT.clear()

    // Grey background instead of black void — shows through the transparent RT void areas
    this.add.rectangle(
      CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2,
      CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT,
      0x2a2a3a
    ).setDepth(-1)

    // Use a single temporary image drawn to the RenderTexture (1 draw call vs ~2209 sprites)
    const tmpTile = this.add.image(0, 0, 'undead_ground', 0).setScale(4).setVisible(false)

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * tileSize + tileSize / 2
        const py = r * tileSize + tileSize / 2
        if (!this.isOnGround(px, py)) continue

        const rand = rng(c, r, 3)
        const frame = rand < 0.2
          ? FILL_VARIED[Math.floor(rng(c, r, 7) * FILL_VARIED.length)]
          : FILL_LIGHT[Math.floor(rng(c, r, 7) * FILL_LIGHT.length)]

        tmpTile.setFrame(frame).setPosition(px, py)
        this.terrainRT.draw(tmpTile)
      }
    }

    tmpTile.destroy()
  }

  protected scatterDecorations(_filterMin = 0, _filterMax = Infinity) {
    const cx = CONFIG.WORLD_WIDTH / 2
    const cy = CONFIG.WORLD_HEIGHT / 2
    this.treePositions = []

    const MIN_DIST = 120
    const MAX_ATTEMPTS = 80
    const placed: { x: number; y: number; key: string }[] = []

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

    // Scales — some props bigger than before
    const propScales: Record<string, number> = {
      undead_grave1: 3, undead_grave2: 3, undead_grave3: 2.8, undead_grave4: 3.2,
      undead_bones1: 3.5, undead_bones2: 5.5,
      undead_crystal1: 2, undead_crystal2: 1.8,
      undead_dead_arm: 1.8,
      undead_ruin1: 1.3, undead_ruin2: 1.3, undead_ruin3: 1.8,
      undead_dead_tree1: 1.3, undead_dead_tree2: 1.2,
      undead_broken_tree1: 1.2, undead_broken_tree2: 3.5,
      undead_thorn1: 1.1, undead_thorn2: 1.1,
      undead_skulls: 1.0,
    }

    // Props that get physics hitboxes (solid obstacles)
    const SOLID_PROPS = new Set([
      'undead_ruin1', 'undead_ruin2', 'undead_ruin3',
      'undead_dead_tree1', 'undead_dead_tree2',
      'undead_crystal1', 'undead_crystal2',
    ])

    const addProp = (x: number, y: number, key: string, tint?: number) => {
      placed.push({ x, y, key })
      this.treePositions.push({ x, y })
      const s = propScales[key] ?? 1.0

      if (SOLID_PROPS.has(key)) {
        // Solid obstacle with physics body
        const sprite = this.rocks.create(x, y, key) as Phaser.Physics.Arcade.Sprite
        sprite.setDepth(3).setScale(s)
        if (tint !== undefined) sprite.setTint(tint)
        sprite.refreshBody()
        const body = sprite.body as Phaser.Physics.Arcade.StaticBody
        const dw = sprite.displayWidth
        const dh = sprite.displayHeight
        const scale = sprite.scaleX
        body.setSize(dw * 0.4, dh * 0.35)
        body.setOffset((sprite.width - dw * 0.4 / scale) / 2, (sprite.height - dh * 0.35 / scale) * 0.65)
      } else {
        // Decorative only
        const img = this.add.image(x, y, key).setDepth(3).setScale(s)
        if (tint !== undefined) img.setTint(tint)
      }
    }

    // Pick from array — avoid keys already used by any neighbor within 250px
    const pickUnique = (arr: string[], x: number, y: number): string => {
      const nearbyKeys = new Set<string>()
      for (const p of placed) {
        if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < 250) nearbyKeys.add(p.key)
      }
      const filtered = arr.filter(k => !nearbyKeys.has(k))
      const pool = filtered.length > 0 ? filtered : arr
      return pool[Phaser.Math.Between(0, pool.length - 1)]
    }

    const graveKeys = ['undead_grave1', 'undead_grave2', 'undead_grave3', 'undead_grave4']
    const ruinKeys = ['undead_ruin1', 'undead_ruin2', 'undead_ruin3']
    const deadTreeKeys = ['undead_dead_tree1', 'undead_dead_tree2']
    const brokenTreeKeys = ['undead_broken_tree1', 'undead_broken_tree2']
    const crystalKeys = ['undead_crystal1', 'undead_crystal2']
    const bonesKeys = ['undead_bones1', 'undead_bones2']
    const thornKeys = ['undead_thorn1', 'undead_thorn2']

    // Helper to place N items from a pool on an island
    const scatter = (islandIdx: number, count: number, pool: string[], tint?: number) => {
      for (let i = 0; i < count; i++) {
        const p = tryPlace(islandIdx)
        if (p) addProp(p.x, p.y, pickUnique(pool, p.x, p.y), tint)
      }
    }

    // --- Island 0: Central Plateau — sparse, spawn area ---
    scatter(0, 3, bonesKeys)
    scatter(0, 3, thornKeys)
    scatter(0, 3, deadTreeKeys)

    // --- Island 1: NW Graveyard ---
    scatter(1, 10, graveKeys, 0xaaaacc)
    scatter(1, 4, deadTreeKeys, 0x778877)
    scatter(1, 3, bonesKeys)

    // --- Island 2: NE Ruins ---
    scatter(2, 7, ruinKeys, 0xbbbbcc)
    scatter(2, 5, graveKeys)
    scatter(2, 4, brokenTreeKeys)

    // --- Island 3: SW Crystal Cave ---
    scatter(3, 8, crystalKeys, 0x8888dd)
    scatter(3, 4, thornKeys, 0x667766)
    scatter(3, 3, deadTreeKeys)

    // --- Island 4: SE Bone Fields ---
    scatter(4, 8, bonesKeys)
    scatter(4, 5, [...graveKeys, 'undead_skulls'])
    scatter(4, 3, ['undead_dead_arm'])

    // --- Island 5: N Dark Shrine ---
    scatter(5, 5, ruinKeys, 0x9999aa)
    scatter(5, 4, crystalKeys, 0xaa88dd)

    // --- Island 6: S Lich Domain ---
    scatter(6, 4, ruinKeys)
    scatter(6, 6, graveKeys, 0x889988)
    scatter(6, 3, ['undead_dead_arm'])

    // --- Islands 7 & 8: Outposts ---
    for (const idx of [7, 8]) {
      scatter(idx, 4, deadTreeKeys)
      scatter(idx, 3, thornKeys)
      scatter(idx, 2, crystalKeys, 0x7777bb)
      scatter(idx, 2, graveKeys)
    }
  }

  protected useInfiniteMap(): boolean { return true }
  protected getMapStyle() { return 'undead' as const }

  public getZone(px: number, py: number): number {
    // Infinite map: player spawns at (0,0), zones radiate from origin
    const dist = Phaser.Math.Distance.Between(px, py, 0, 0)
    if (dist < 600) return 0
    if (dist < 1200) return 1
    if (dist < 1800) return 2
    if (dist < 2400) return 3
    return 4
  }
}
