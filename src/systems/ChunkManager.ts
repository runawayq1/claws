import { CONFIG } from '../config/GameConfig'
import { Chest, type ChestRarity } from '../entities/Chest'
import type { Player } from '../entities/Player'

const GRASS_FRAMES = [4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 28, 29, 30, 31]
const STONE_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7]
const ROCK_KEYS = ['rock1_1', 'rock1_2', 'rock2_1', 'rock2_2', 'rock3_1', 'rock3_2']
const TREE_KEYS = ['deco_tree1', 'deco_tree2', 'deco_tree3']
const TUFT_KEYS = ['prop_grass_tuft1', 'prop_grass_tuft3']

const ZONE_TINTS: Record<number, number> = {
  3: 0xccddcc,
  4: 0xbbccbb,
}

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

  private online: boolean

  constructor(
    scene: Phaser.Scene,
    rocksGroup: Phaser.Physics.Arcade.StaticGroup,
    getZone: (x: number, y: number) => number,
    player: Player,
    chestsGroup: Phaser.GameObjects.Group,
    online = false,
  ) {
    this.scene = scene
    this.rocksGroup = rocksGroup
    this.getZone = getZone
    this.player = player
    this.chestsGroup = chestsGroup
    this.online = online
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
    if (!this.tmpTile) {
      this.tmpTile = this.scene.add.image(0, 0, 'terrain_grass', 0)
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
        let useStone = false
        if (zone >= 3) {
          useStone = rand < 0.85
        } else if (zone === 2) {
          useStone = rand < 0.5
        }

        const tint = ZONE_TINTS[zone]

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
          const frame = GRASS_FRAMES[Math.floor(rand * GRASS_FRAMES.length)]
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

    for (let i = 0; i < rockCount; i++) {
      const pos = tryPlace(i, 0, MIN_ROCK_DIST)
      if (!pos) continue

      placed.push({ ...pos, minDist: MIN_ROCK_DIST })

      const keyIdx = Math.floor(this.seededRng(chunk.col, chunk.row, i * 3 + 2) * ROCK_KEYS.length)
      const key = ROCK_KEYS[keyIdx]

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

    const decoTint = ZONE_TINTS[chunkZone]

    for (let i = 0; i < treeCount; i++) {
      const pos = tryPlace(rockCount + i, 10, MIN_DECO_DIST)
      if (!pos) continue

      placed.push({ ...pos, minDist: MIN_DECO_DIST })

      const keyIdx = Math.floor(this.seededRng(chunk.col, chunk.row, rockCount * 3 + i * 3 + 12) * TREE_KEYS.length)
      const key = TREE_KEYS[keyIdx]

      const img = this.scene.add.image(pos.x, pos.y, key).setDepth(3)
      if (decoTint !== undefined) img.setTint(decoTint)
      chunk.decos.push(img)
    }

    for (let i = 0; i < tuftCount; i++) {
      const pos = tryPlace(rockCount + treeCount + i, 20, MIN_DECO_DIST)
      if (!pos) continue

      placed.push({ ...pos, minDist: MIN_DECO_DIST })

      const keyIdx = Math.floor(this.seededRng(chunk.col, chunk.row, rockCount * 3 + treeCount * 3 + i * 3 + 22) * TUFT_KEYS.length)
      const key = TUFT_KEYS[keyIdx]

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
  }
}
