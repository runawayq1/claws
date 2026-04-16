import { CONFIG } from '../config/GameConfig'
import { Chest, type ChestRarity } from '../entities/Chest'
import type { Player } from '../entities/Player'

const GRASS_FRAMES = [4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 28, 29, 30, 31]
// Undead ground: 416/16=26 cols. First rows of solid dark stone tiles.
const UNDEAD_FRAMES = [0, 1, 2, 3, 26, 27, 28, 29, 52, 53, 54, 55, 78, 79, 80, 81]
const STONE_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7]
const ROCK_KEYS = ['rock1_1', 'rock1_2', 'rock2_1', 'rock2_2', 'rock3_1', 'rock3_2']
const TREE_KEYS = ['deco_tree1', 'deco_tree2', 'deco_tree3']
const TUFT_KEYS = ['prop_grass_tuft1', 'prop_grass_tuft3']
// Undead map decoration replacements
const UNDEAD_ROCK_KEYS = ['undead_ruin1', 'undead_ruin2', 'undead_ruin3', 'undead_crystal1', 'undead_crystal2']
const UNDEAD_TREE_KEYS = ['undead_dead_tree1', 'undead_dead_tree2', 'undead_broken_tree1', 'undead_broken_tree2']
const UNDEAD_TUFT_KEYS = ['undead_bones1', 'undead_bones2', 'undead_skulls', 'undead_dead_arm', 'undead_grave1', 'undead_grave2']

const ZONE_TINTS: Record<number, number> = {
  3: 0xccddcc,
  4: 0xbbccbb,
}

const UNDEAD_ZONE_TINTS: Record<number, number> = {
  0: 0x998899,
  1: 0x887788,
  2: 0x776677,
  3: 0x665566,
  4: 0x554455,
}

export type MapStyle = 'grass' | 'undead'

const MIN_ROCK_DIST = 120
const MIN_DECO_DIST = 110
const MIN_CHEST_DIST = 200
const CHUNK_MARGIN = 80

interface Chunk {
  col: number
  row: number
  rt: Phaser.GameObjects.RenderTexture
  rocks: Phaser.Physics.Arcade.Sprite[]
  decos: Phaser.GameObjects.Image[]
  chests: Chest[]
}

export class ChunkManager {
  private scene: Phaser.Scene
  private rocksGroup: Phaser.Physics.Arcade.StaticGroup
  private getZone: (x: number, y: number) => number
  private player: Player
  private chestsGroup: Phaser.GameObjects.Group
  private chunks: Chunk[] = []
  private centerCol = 0
  private centerRow = 0
  private tmpTile: Phaser.GameObjects.Image | null = null
  private recycleQueue: { chunk: Chunk; col: number; row: number }[] = []
  private _undeadFloorTile: Phaser.GameObjects.Image | null = null

  private online: boolean
  private mapStyle: MapStyle

  constructor(
    scene: Phaser.Scene,
    rocksGroup: Phaser.Physics.Arcade.StaticGroup,
    getZone: (x: number, y: number) => number,
    player: Player,
    chestsGroup: Phaser.GameObjects.Group,
    online = false,
    mapStyle: MapStyle = 'grass',
  ) {
    this.scene = scene
    this.rocksGroup = rocksGroup
    this.getZone = getZone
    this.player = player
    this.chestsGroup = chestsGroup
    this.online = online
    this.mapStyle = mapStyle
  }

  create(playerX: number, playerY: number): void {
    this.centerCol = Math.floor(playerX / CONFIG.CHUNK_SIZE)
    this.centerRow = Math.floor(playerY / CONFIG.CHUNK_SIZE)

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const col = this.centerCol + dc
        const row = this.centerRow + dr
        const slot = this.slotIndex(col, row)
        const worldX = col * CONFIG.CHUNK_SIZE
        const worldY = row * CONFIG.CHUNK_SIZE
        const rt = this.scene.add.renderTexture(worldX, worldY, CONFIG.CHUNK_SIZE, CONFIG.CHUNK_SIZE)
        rt.setOrigin(0, 0).setDepth(0)
        const chunk: Chunk = { col, row, rt, rocks: [], decos: [], chests: [] }
        this.chunks[slot] = chunk
        this.buildChunk(chunk)
      }
    }

    this.rocksGroup.refresh()
  }

  update(playerX: number, playerY: number): void {
    const newCenterCol = Math.floor(playerX / CONFIG.CHUNK_SIZE)
    const newCenterRow = Math.floor(playerY / CONFIG.CHUNK_SIZE)

    // Detect chunk boundary crossing — queue stale chunks for recycling
    if (newCenterCol !== this.centerCol || newCenterRow !== this.centerRow) {
      this.centerCol = newCenterCol
      this.centerRow = newCenterRow

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const targetCol = newCenterCol + dc
          const targetRow = newCenterRow + dr
          const slot = this.slotIndex(targetCol, targetRow)
          const chunk = this.chunks[slot]
          if (chunk.col !== targetCol || chunk.row !== targetRow) {
            this.recycleQueue.push({ chunk, col: targetCol, row: targetRow })
          }
        }
      }
    }

    // Process max 1 chunk per frame to avoid freezes
    if (this.recycleQueue.length > 0) {
      const job = this.recycleQueue.shift()!
      this.recycleChunk(job.chunk, job.col, job.row)
      this.rocksGroup.refresh()
    }
  }

  private buildChunk(chunk: Chunk): void {
    this.drawTerrainTiles(chunk)
    this.scatterProps(chunk)
  }

  private recycleChunk(chunk: Chunk, newCol: number, newRow: number): void {
    for (const rock of chunk.rocks) {
      this.rocksGroup.remove(rock, true, true)
    }
    chunk.rocks = []

    for (const deco of chunk.decos) {
      deco.destroy()
    }
    chunk.decos = []

    for (const chest of chunk.chests) {
      this.chestsGroup.remove(chest, true, true)
    }
    chunk.chests = []

    chunk.col = newCol
    chunk.row = newRow

    const worldX = newCol * CONFIG.CHUNK_SIZE
    const worldY = newRow * CONFIG.CHUNK_SIZE
    chunk.rt.setPosition(worldX, worldY)
    chunk.rt.clear()

    this.buildChunk(chunk)
  }

  private drawTerrainTiles(chunk: Chunk): void {
    const isUndead = this.mapStyle === 'undead'

    // Ensure cached tile matches current map style (prevents grass tiles on undead after restart)
    if (isUndead && this.tmpTile) {
      this.tmpTile.destroy()
      this.tmpTile = null
    }
    if (!isUndead && this._undeadFloorTile) {
      this._undeadFloorTile.destroy()
      this._undeadFloorTile = null
    }

    // Undead: tiled floor using 64px stone tiles (6 variants: 4 clean + 2 cracked)
    if (isUndead) {
      const { CHUNK_SIZE } = CONFIG
      const UTILE = 64
      const tilesPerRow = Math.ceil(CHUNK_SIZE / UTILE)
      if (!this._undeadFloorTile) {
        if (this.scene.textures.exists('undead_floor')) {
          this._undeadFloorTile = this.scene.add.image(0, 0, 'undead_floor', 0)
            .setOrigin(0).setVisible(false)
        }
      }
      if (this._undeadFloorTile) {
        for (let tr = 0; tr < tilesPerRow; tr++) {
          for (let tc = 0; tc < tilesPerRow; tc++) {
            const seed1 = this.seededRng(chunk.col * tilesPerRow + tc, chunk.row * tilesPerRow + tr, 77)
            const seed2 = this.seededRng(chunk.col * tilesPerRow + tc, chunk.row * tilesPerRow + tr, 33)
            // Mostly clean stone (0-3), 15% chance of cracked (4-5)
            let frame: number
            if (seed2 < 0.15) {
              frame = 4 + Math.floor(seed1 * 2)  // cracked variants
            } else {
              frame = Math.floor(seed1 * 4)  // clean variants
            }
            this._undeadFloorTile.setFrame(frame)
            this._undeadFloorTile.setPosition(tc * UTILE, tr * UTILE)
            // Random flip for variety (no rotation — bricks should stay aligned)
            this._undeadFloorTile.setFlipX(seed2 > 0.5)
            this._undeadFloorTile.setFlipY(seed1 > 0.5)
            // Zone-based darkening: center bright, edges dark (like grasslands)
            const zone = this.getZone(
              chunk.col * CHUNK_SIZE + tc * UTILE,
              chunk.row * CHUNK_SIZE + tr * UTILE,
            )
            const zoneTint = [0x9977bb, 0x8866aa, 0x775599, 0x664488, 0x553377][Math.min(zone, 4)]
            this._undeadFloorTile.setTint(zoneTint)
            chunk.rt.draw(this._undeadFloorTile)
          }
        }
      }
      return
    }

    const tileKey = 'terrain_grass'
    if (!this.tmpTile) {
      this.tmpTile = this.scene.add.image(0, 0, tileKey, 0)
        .setScale(2)
        .setVisible(false)
    }

    const { CHUNK_SIZE, CHUNK_TILES, TILE_SIZE } = CONFIG
    const chunkWorldX = chunk.col * CHUNK_SIZE
    const chunkWorldY = chunk.row * CHUNK_SIZE

    // Lazily created stone tile image for zone 2+ blending
    let tmpStone: Phaser.GameObjects.Image | null = null

    for (let tr = 0; tr < CHUNK_TILES; tr++) {
      for (let tc = 0; tc < CHUNK_TILES; tc++) {
        const localX = tc * TILE_SIZE + TILE_SIZE / 2
        const localY = tr * TILE_SIZE + TILE_SIZE / 2
        const wx = chunkWorldX + localX
        const wy = chunkWorldY + localY
        const zone = this.getZone(wx, wy)

        const rand = this.seededRng(chunk.col * CHUNK_TILES + tc, chunk.row * CHUNK_TILES + tr, 3)

        // Zone-aware tile selection: zone 2 = 50/50 grass+stone, zone 3+ = mostly stone
        // Undead map: always use ground texture (no grass/stone split)
        let useStone = false
        if (!isUndead) {
          if (zone >= 3) {
            useStone = rand < 0.85
          } else if (zone === 2) {
            useStone = rand < 0.5
          }
        }

        const tint = isUndead ? UNDEAD_ZONE_TINTS[zone] : ZONE_TINTS[zone]

        if (useStone) {
          if (!tmpStone) {
            tmpStone = this.scene.add.image(0, 0, 'terrain_stone', 0)
              .setScale(2)
              .setVisible(false)
          }
          const stoneRand = this.seededRng(chunk.col * CHUNK_TILES + tc, chunk.row * CHUNK_TILES + tr, 9)
          const frame = STONE_FRAMES[Math.floor(stoneRand * STONE_FRAMES.length)]
          tmpStone.setFrame(frame).setPosition(localX, localY)
          if (tint !== undefined) {
            tmpStone.setTint(tint)
          } else {
            tmpStone.clearTint()
          }
          chunk.rt.draw(tmpStone)
        } else {
          const tileFrames = isUndead ? UNDEAD_FRAMES : GRASS_FRAMES
          const frame = tileFrames[Math.floor(rand * tileFrames.length)]
          this.tmpTile!.setFrame(frame).setPosition(localX, localY)
          if (tint !== undefined) {
            this.tmpTile!.setTint(tint)
          } else {
            this.tmpTile!.clearTint()
          }
          chunk.rt.draw(this.tmpTile!)
        }
      }
    }

    if (tmpStone) tmpStone.destroy()
  }

  private scatterProps(chunk: Chunk): void {
    const { CHUNK_SIZE } = CONFIG
    const chunkWorldX = chunk.col * CHUNK_SIZE
    const chunkWorldY = chunk.row * CHUNK_SIZE
    const chunkCenterX = chunkWorldX + CHUNK_SIZE / 2
    const chunkCenterY = chunkWorldY + CHUNK_SIZE / 2
    const maxDist = CHUNK_SIZE / 2 - CHUNK_MARGIN

    const chunkZone = this.getZone(chunkCenterX, chunkCenterY)
    const rockCount = chunkZone === 0 ? this.seededRngInt(chunk.col, chunk.row, 99, 1, 2)
      : this.seededRngInt(chunk.col, chunk.row, 99, 3, 6)
    const treeCount = this.seededRngInt(chunk.col, chunk.row, 100, 3, 7)
    const tuftCount = this.seededRngInt(chunk.col, chunk.row, 101, 2, 4)

    const placed: { x: number; y: number; minDist: number }[] = []

    const tryPlace = (i: number, salt: number, newMinDist: number): { x: number; y: number } | null => {
      for (let attempt = 0; attempt < 8; attempt++) {
        const angle = this.seededRng(chunk.col, chunk.row, i * 3 + salt + attempt * 0.3) * Math.PI * 2
        const dist = this.seededRng(chunk.col, chunk.row, i * 3 + 1 + salt + attempt * 0.3) * maxDist
        const x = chunkCenterX + Math.cos(angle) * dist
        const y = chunkCenterY + Math.sin(angle) * dist
        const tooClose = placed.some(p => {
          const threshold = Math.max(newMinDist, p.minDist)
          return Math.hypot(x - p.x, y - p.y) < threshold
        })
        if (!tooClose) return { x, y }
      }
      return null
    }

    let lastRockKey = ''
    for (let i = 0; i < rockCount; i++) {
      const pos = tryPlace(i, 0, MIN_ROCK_DIST)
      if (!pos) continue

      placed.push({ ...pos, minDist: MIN_ROCK_DIST })

      const rockKeys = this.mapStyle === 'undead' ? UNDEAD_ROCK_KEYS : ROCK_KEYS
      let keyIdx = Math.floor(this.seededRng(chunk.col, chunk.row, i * 3 + 2) * rockKeys.length)
      let key = rockKeys[keyIdx]
      if (key === lastRockKey && rockKeys.length > 1) {
        keyIdx = (keyIdx + 1) % rockKeys.length
        key = rockKeys[keyIdx]
      }
      lastRockKey = key

      const rock = this.rocksGroup.create(pos.x, pos.y, key) as Phaser.Physics.Arcade.Sprite
      const scaleSeed = this.seededRng(chunk.col, chunk.row, i * 3 + 50)
      const scale = 0.9 + scaleSeed * 0.9
      rock.setDepth(2).setScale(scale)
      rock.refreshBody()

      const body = rock.body as Phaser.Physics.Arcade.StaticBody
      const dw = rock.displayWidth
      const dh = rock.displayHeight
      const sc = rock.scaleX
      body.setSize(dw * 0.45, dh * 0.4)
      body.setOffset(
        (rock.width - (dw * 0.45) / sc) / 2,
        (rock.height - (dh * 0.4) / sc) / 2
      )

      chunk.rocks.push(rock)
    }

    const isUndead = this.mapStyle === 'undead'
    const decoTint = isUndead ? UNDEAD_ZONE_TINTS[chunkZone] : ZONE_TINTS[chunkZone]
    const treeKeys = isUndead ? UNDEAD_TREE_KEYS : TREE_KEYS
    const tuftKeys = isUndead ? UNDEAD_TUFT_KEYS : TUFT_KEYS

    // Track last used key per category to avoid identical neighbours
    let lastTreeKey = ''
    let lastTuftKey = ''

    for (let i = 0; i < treeCount; i++) {
      const pos = tryPlace(rockCount + i, 10, MIN_DECO_DIST)
      if (!pos) continue

      placed.push({ ...pos, minDist: MIN_DECO_DIST })

      let keyIdx = Math.floor(this.seededRng(chunk.col, chunk.row, rockCount * 3 + i * 3 + 12) * treeKeys.length)
      let key = treeKeys[keyIdx]
      // Avoid same key twice in a row
      if (key === lastTreeKey && treeKeys.length > 1) {
        keyIdx = (keyIdx + 1) % treeKeys.length
        key = treeKeys[keyIdx]
      }
      lastTreeKey = key

      if (!this.scene.textures.exists(key)) continue
      const img = this.scene.add.image(pos.x, pos.y, key).setDepth(3)
      if (decoTint !== undefined) img.setTint(decoTint)
      chunk.decos.push(img)
    }

    for (let i = 0; i < tuftCount; i++) {
      const pos = tryPlace(rockCount + treeCount + i, 20, MIN_DECO_DIST)
      if (!pos) continue

      placed.push({ ...pos, minDist: MIN_DECO_DIST })

      let keyIdx = Math.floor(this.seededRng(chunk.col, chunk.row, rockCount * 3 + treeCount * 3 + i * 3 + 22) * tuftKeys.length)
      let key = tuftKeys[keyIdx]
      if (key === lastTuftKey && tuftKeys.length > 1) {
        keyIdx = (keyIdx + 1) % tuftKeys.length
        key = tuftKeys[keyIdx]
      }
      lastTuftKey = key

      if (!this.scene.textures.exists(key)) continue
      const img = this.scene.add.image(pos.x, pos.y, key).setDepth(3)
      if (decoTint !== undefined) img.setTint(decoTint)
      chunk.decos.push(img)
    }

    // Chests — ~50% chance per chunk, rare in zone 2+
    // Skipped in online mode — chests are client-side only, causing desync
    const chestRoll = this.seededRng(chunk.col, chunk.row, 200)
    if (!this.online && chestRoll < 0.5) {
      const chestIdx = rockCount + treeCount + tuftCount
      const pos = tryPlace(chestIdx, 30, MIN_CHEST_DIST)
      if (pos) {
        const rarity: ChestRarity = chunkZone >= 2 && this.seededRng(chunk.col, chunk.row, 201) < 0.25
          ? 'rare' : 'common'
        const chest = new Chest(this.scene, pos.x, pos.y, rarity, this.player)
        this.chestsGroup.add(chest)
        chunk.chests.push(chest)
        placed.push({ ...pos, minDist: MIN_CHEST_DIST })
      }
    }
  }

  private seededRng(col: number, row: number, salt: number): number {
    const n = Math.sin(col * 127.1 + row * 311.7 + salt * 42) * 43758.5453
    return n - Math.floor(n)
  }

  private seededRngInt(col: number, row: number, salt: number, min: number, max: number): number {
    return min + Math.floor(this.seededRng(col, row, salt) * (max - min + 1))
  }

  private slotIndex(col: number, row: number): number {
    return ((col % 3 + 3) % 3) + ((row % 3 + 3) % 3) * 3
  }

  destroy(): void {
    for (const chunk of this.chunks) {
      if (!chunk) continue
      for (const rock of chunk.rocks) {
        this.rocksGroup.remove(rock, true, true)
      }
      for (const deco of chunk.decos) {
        deco.destroy()
      }
      for (const chest of chunk.chests) {
        this.chestsGroup.remove(chest, true, true)
      }
      chunk.rt.destroy()
    }
    this.chunks = []

    if (this.tmpTile) {
      this.tmpTile.destroy()
      this.tmpTile = null
    }
    if (this._undeadFloorTile) {
      this._undeadFloorTile.destroy()
      this._undeadFloorTile = null
    }
  }
}
