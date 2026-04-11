import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { Player } from '../entities/Player'
import { Orc2 } from '../entities/Orc2'
import { Orc1 } from '../entities/Orc1'
import { FlyingEye } from '../entities/FlyingEye'
import { SandGolem } from '../entities/SandGolem'
import BaseEnemy from '../entities/BaseEnemy'
import { Orc3 } from '../entities/Orc3'
import { Orc0 } from '../entities/Grunt'

type EnemyCtor = new (scene: Phaser.Scene, x: number, y: number, player: Player, tier: number) => Orc0 | Orc1 | Orc2 | Orc3 | FlyingEye

interface SpawnEntry { factory: EnemyCtor; weight: number }

// Cumulative weights are computed at runtime — weights are relative (not required to sum to 100)
const ZONE_SPAWNS: Record<number, SpawnEntry[]> = {
  // Zone 0 — Crossroads: Orc0 50%, Orc1 30%, Orc2 20%
  0: [{ factory: Orc0 as unknown as EnemyCtor, weight: 50 }, { factory: Orc1 as unknown as EnemyCtor, weight: 30 }, { factory: Orc2 as unknown as EnemyCtor, weight: 20 }],
  // Zone 1 — Meadow: Orc0 35%, Orc1 35%, Orc2 30%
  1: [{ factory: Orc0 as unknown as EnemyCtor, weight: 35 }, { factory: Orc1 as unknown as EnemyCtor, weight: 35 }, { factory: Orc2 as unknown as EnemyCtor, weight: 30 }],
  // Zone 2 — Ruins: Orc3 30%, FlyingEye 25%, Orc1 25%, Orc2 20%
  2: [{ factory: Orc3 as unknown as EnemyCtor, weight: 30 }, { factory: FlyingEye as unknown as EnemyCtor, weight: 25 }, { factory: Orc1 as unknown as EnemyCtor, weight: 25 }, { factory: Orc2 as unknown as EnemyCtor, weight: 20 }],
  // Zone 3 — Dark Forest: Orc3 35%, FlyingEye 25%, Orc1 25%, Orc2 15%
  3: [{ factory: Orc3 as unknown as EnemyCtor, weight: 35 }, { factory: FlyingEye as unknown as EnemyCtor, weight: 25 }, { factory: Orc1 as unknown as EnemyCtor, weight: 25 }, { factory: Orc2 as unknown as EnemyCtor, weight: 15 }],
  // Zone 4+ — Wastes: Orc3 40%, FlyingEye 30%, Orc1 20%, Orc2 10%
  4: [{ factory: Orc3 as unknown as EnemyCtor, weight: 40 }, { factory: FlyingEye as unknown as EnemyCtor, weight: 30 }, { factory: Orc1 as unknown as EnemyCtor, weight: 20 }, { factory: Orc2 as unknown as EnemyCtor, weight: 10 }],
}

const ZONE_SPAWN_TOTALS: Record<number, number> = {}
for (const [zone, entries] of Object.entries(ZONE_SPAWNS)) {
  ZONE_SPAWN_TOTALS[Number(zone)] = entries.reduce((s, e) => s + e.weight, 0)
}

function pickWeighted(entries: SpawnEntry[], total: number): EnemyCtor {
  let roll = Math.random() * total
  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry.factory
  }
  return entries[entries.length - 1].factory
}

export class WaveManager {
  private scene: Phaser.Scene
  private players: Player[]
  private player: Player  // alias for players[0] — used by getSpawnPos and legacy code
  private enemies: Phaser.Physics.Arcade.Group
  private spawnTimer: Phaser.Time.TimerEvent | null = null
  private elapsedMs = 0
  private bossSpawned = false
  private lastMiniBossMs = 0
  totalKills = 0
  currentWave = 0
  /** Tracked active enemy count — avoids O(n) countActive() in tick(). */
  private _aliveCount = 0

  constructor(scene: Phaser.Scene, players: Player[], enemies: Phaser.Physics.Arcade.Group) {
    this.scene = scene
    this.players = players
    this.player = players[0]
    this.enemies = enemies
  }

  start() {
    this.spawnTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => this.tick(),
      loop: true,
    })
  }

  private tick() {
    this.elapsedMs += 100

    this.currentWave = Math.floor(this.elapsedMs / 30000) + 1

    const baseInterval = Math.max(200, 800 - this.currentWave * 50)
    const shouldSpawn = this.elapsedMs % baseInterval < 100

    if (shouldSpawn) {
      // Mob cap — don't spawn if at limit
      const cap = Math.min(
        CONFIG.MOB_CAP_MAX,
        CONFIG.MOB_CAP_BASE + this.currentWave * CONFIG.MOB_CAP_PER_WAVE
      )
      if (this._aliveCount < cap) {
        this.spawnMob()
        if (this._aliveCount < cap) this.spawnMob()
      }
    }

    // Mini-boss every 30 seconds
    if (this.elapsedMs - this.lastMiniBossMs >= 30000) {
      this.lastMiniBossMs = this.elapsedMs
      this.spawnMiniBoss()
    }

    // CLAWS boss at 10 minutes
    if (this.elapsedMs >= CONFIG.RUN_DURATION && !this.bossSpawned) {
      this.bossSpawned = true
      this.scene.events.emit('claws-incoming')
      if (this.spawnTimer) this.spawnTimer.destroy()
      this.scene.time.delayedCall(3000, () => {
        this.scene.events.emit('claws-spawn')
      })
    }
  }

  private getSpawnPos(): { x: number; y: number } {
    const cam = this.scene.cameras.main
    const vw = cam.worldView
    const pad = 60 // spawn just outside visible edge
    // Pick random edge: 0=top, 1=bottom, 2=left, 3=right
    const edge = Math.floor(Math.random() * 4)
    switch (edge) {
      case 0: return { x: Phaser.Math.Between(vw.left - pad, vw.right + pad), y: vw.top - pad }
      case 1: return { x: Phaser.Math.Between(vw.left - pad, vw.right + pad), y: vw.bottom + pad }
      case 2: return { x: vw.left - pad, y: Phaser.Math.Between(vw.top - pad, vw.bottom + pad) }
      default: return { x: vw.right + pad, y: Phaser.Math.Between(vw.top - pad, vw.bottom + pad) }
    }
  }

  private spawnMiniBoss() {
    if (this._aliveCount >= CONFIG.MOB_CAP_MAX) return
    const { x, y } = this.getSpawnPos()

    // After wave 5, FlyingEye mini-boss can appear; chance grows with waves
    const flyingEyeChance = this.currentWave >= 5
      ? Math.min(0.5, (this.currentWave - 5) * 0.1)
      : 0
    const useFlyingEye = Math.random() < flyingEyeChance

    let mob: BaseEnemy
    if (useFlyingEye) {
      mob = new FlyingEye(this.scene, x, y, this.player, this.currentWave, true)
    } else {
      mob = new SandGolem(this.scene, x, y, this.player, this.currentWave)
    }
    mob.players = this.players
    mob.isMiniBoss = true
    mob.goldValue = Phaser.Math.Between(CONFIG.GOLD_BOSS_MIN, CONFIG.GOLD_BOSS_MAX)
      + Math.floor(this.currentWave * 3)
    this.enemies.add(mob)
    this._aliveCount++
  }

  private spawnMob() {
    const { x, y } = this.getSpawnPos()
    const tier = this.currentWave

    const zone: number = Math.min((this.scene as any).getZone(x, y) as number, 4)
    const spawnTable = ZONE_SPAWNS[zone] ?? ZONE_SPAWNS[4]
    const Factory = pickWeighted(spawnTable, ZONE_SPAWN_TOTALS[zone] ?? ZONE_SPAWN_TOTALS[4])
    const mob = new Factory(this.scene, x, y, this.player, tier)
    mob.players = this.players

    this.enemies.add(mob)
    this._aliveCount++

    // Random buffs at higher tiers
    if (tier >= 5 && Math.random() < 0.3) {
      mob.speed *= 1.3
    }
    if (tier >= 8 && Math.random() < 0.3) {
      mob.maxHp *= 1.5
      mob.hp = mob.maxHp
    }
  }

  onEnemyKilled() {
    this.totalKills++
    this._aliveCount = Math.max(0, this._aliveCount - 1)
  }
}
