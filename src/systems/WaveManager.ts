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
import { Archer } from '../entities/Archer'
import { DarkBat } from '../entities/DarkBat'
import { FlyingDemon } from '../entities/FlyingDemon'

type EnemyCtor = new (scene: Phaser.Scene, x: number, y: number, player: Player, tier: number) => Orc0 | Orc1 | Orc2 | Orc3 | FlyingEye | Archer | DarkBat | FlyingDemon

interface SpawnEntry { factory: EnemyCtor; weight: number }

// Archer unlocks from wave 5+ (after ~2min). Filtered out of the picker below that.
const ARCHER_MIN_WAVE = 5

// Cumulative weights are computed at runtime — weights are relative (not required to sum to 100)
const ZONE_SPAWNS: Record<number, SpawnEntry[]> = {
  // Zone 0 — Crossroads: Orc0 52%, Orc1 29%, Orc2 16%, Archer 3%
  0: [{ factory: Orc0 as unknown as EnemyCtor, weight: 52 }, { factory: Orc1 as unknown as EnemyCtor, weight: 29 }, { factory: Orc2 as unknown as EnemyCtor, weight: 16 }, { factory: Archer as unknown as EnemyCtor, weight: 3 }],
  // Zone 1 — Meadow: Orc0 34%, Orc1 34%, Orc2 28%, Archer 4%
  1: [{ factory: Orc0 as unknown as EnemyCtor, weight: 34 }, { factory: Orc1 as unknown as EnemyCtor, weight: 34 }, { factory: Orc2 as unknown as EnemyCtor, weight: 28 }, { factory: Archer as unknown as EnemyCtor, weight: 4 }],
  // Zone 2 — Ruins: Orc3 29%, FlyingEye 23%, Orc1 23%, Orc2 21%, Archer 4%
  2: [{ factory: Orc3 as unknown as EnemyCtor, weight: 29 }, { factory: FlyingEye as unknown as EnemyCtor, weight: 23 }, { factory: Orc1 as unknown as EnemyCtor, weight: 23 }, { factory: Orc2 as unknown as EnemyCtor, weight: 21 }, { factory: Archer as unknown as EnemyCtor, weight: 4 }],
  // Zone 3 — Dark Forest: Orc3 34%, FlyingEye 23%, Orc1 23%, Orc2 15%, Archer 5%
  3: [{ factory: Orc3 as unknown as EnemyCtor, weight: 34 }, { factory: FlyingEye as unknown as EnemyCtor, weight: 23 }, { factory: Orc1 as unknown as EnemyCtor, weight: 23 }, { factory: Orc2 as unknown as EnemyCtor, weight: 15 }, { factory: Archer as unknown as EnemyCtor, weight: 5 }],
  // Zone 4+ — Wastes: Orc3 40%, FlyingEye 28%, Orc1 18%, Orc2 8%, Archer 6%
  4: [{ factory: Orc3 as unknown as EnemyCtor, weight: 40 }, { factory: FlyingEye as unknown as EnemyCtor, weight: 28 }, { factory: Orc1 as unknown as EnemyCtor, weight: 18 }, { factory: Orc2 as unknown as EnemyCtor, weight: 8 }, { factory: Archer as unknown as EnemyCtor, weight: 6 }],
}

// Pre-filtered pools for early waves (no Archer). Built once at module load.
const ZONE_SPAWNS_EARLY: Record<number, SpawnEntry[]> = {}
for (const [zone, entries] of Object.entries(ZONE_SPAWNS)) {
  ZONE_SPAWNS_EARLY[Number(zone)] = entries.filter(e => e.factory !== (Archer as unknown as EnemyCtor))
}
const ZONE_SPAWN_TOTALS_EARLY: Record<number, number> = {}
for (const [zone, entries] of Object.entries(ZONE_SPAWNS_EARLY)) {
  ZONE_SPAWN_TOTALS_EARLY[Number(zone)] = entries.reduce((s, e) => s + e.weight, 0)
}

const ZONE_SPAWN_TOTALS: Record<number, number> = {}
for (const [zone, entries] of Object.entries(ZONE_SPAWNS)) {
  ZONE_SPAWN_TOTALS[Number(zone)] = entries.reduce((s, e) => s + e.weight, 0)
}

// Undead map spawn tables — DarkBat replaces FlyingEye, FlyingDemon added as ranged threat
const UNDEAD_ZONE_SPAWNS: Record<number, SpawnEntry[]> = {
  0: [{ factory: Orc0 as unknown as EnemyCtor, weight: 40 }, { factory: Orc1 as unknown as EnemyCtor, weight: 30 }, { factory: DarkBat as unknown as EnemyCtor, weight: 20 }, { factory: FlyingDemon as unknown as EnemyCtor, weight: 10 }],
  1: [{ factory: Orc1 as unknown as EnemyCtor, weight: 30 }, { factory: Orc2 as unknown as EnemyCtor, weight: 25 }, { factory: DarkBat as unknown as EnemyCtor, weight: 25 }, { factory: FlyingDemon as unknown as EnemyCtor, weight: 15 }, { factory: Archer as unknown as EnemyCtor, weight: 5 }],
  2: [{ factory: Orc2 as unknown as EnemyCtor, weight: 20 }, { factory: Orc3 as unknown as EnemyCtor, weight: 25 }, { factory: DarkBat as unknown as EnemyCtor, weight: 25 }, { factory: FlyingDemon as unknown as EnemyCtor, weight: 20 }, { factory: Archer as unknown as EnemyCtor, weight: 10 }],
  3: [{ factory: Orc3 as unknown as EnemyCtor, weight: 30 }, { factory: DarkBat as unknown as EnemyCtor, weight: 25 }, { factory: FlyingDemon as unknown as EnemyCtor, weight: 25 }, { factory: Archer as unknown as EnemyCtor, weight: 15 }, { factory: Orc2 as unknown as EnemyCtor, weight: 5 }],
  4: [{ factory: Orc3 as unknown as EnemyCtor, weight: 25 }, { factory: DarkBat as unknown as EnemyCtor, weight: 30 }, { factory: FlyingDemon as unknown as EnemyCtor, weight: 30 }, { factory: Archer as unknown as EnemyCtor, weight: 15 }],
}

// Pre-filtered undead pools for early waves (no Archer)
const UNDEAD_ZONE_SPAWNS_EARLY: Record<number, SpawnEntry[]> = {}
for (const [zone, entries] of Object.entries(UNDEAD_ZONE_SPAWNS)) {
  UNDEAD_ZONE_SPAWNS_EARLY[Number(zone)] = entries.filter(e => e.factory !== (Archer as unknown as EnemyCtor))
}
const UNDEAD_ZONE_SPAWN_TOTALS_EARLY: Record<number, number> = {}
for (const [zone, entries] of Object.entries(UNDEAD_ZONE_SPAWNS_EARLY)) {
  UNDEAD_ZONE_SPAWN_TOTALS_EARLY[Number(zone)] = entries.reduce((s, e) => s + e.weight, 0)
}
const UNDEAD_ZONE_SPAWN_TOTALS: Record<number, number> = {}
for (const [zone, entries] of Object.entries(UNDEAD_ZONE_SPAWNS)) {
  UNDEAD_ZONE_SPAWN_TOTALS[Number(zone)] = entries.reduce((s, e) => s + e.weight, 0)
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
  private isUndead: boolean

  constructor(scene: Phaser.Scene, players: Player[], enemies: Phaser.Physics.Arcade.Group) {
    this.scene = scene
    this.players = players
    this.player = players[0]
    this.enemies = enemies
    this.isUndead = scene.scene.key === 'UndeadMapScene'
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
      console.log(`[BOSS] WaveManager: elapsedMs=${this.elapsedMs} >= RUN_DURATION=${CONFIG.RUN_DURATION}, emitting claws-incoming`)
      this.scene.events.emit('claws-incoming')
      if (this.spawnTimer) this.spawnTimer.destroy()
      this.scene.time.delayedCall(3000, () => {
        console.log('[BOSS] WaveManager: emitting claws-spawn')
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
    // Use pre-filtered pool (no Archer) until wave unlock
    const useEarly = this.currentWave < ARCHER_MIN_WAVE
    let spawnTable: SpawnEntry[]
    let spawnTotal: number
    if (this.isUndead) {
      spawnTable = useEarly
        ? (UNDEAD_ZONE_SPAWNS_EARLY[zone] ?? UNDEAD_ZONE_SPAWNS_EARLY[4])
        : (UNDEAD_ZONE_SPAWNS[zone] ?? UNDEAD_ZONE_SPAWNS[4])
      spawnTotal = useEarly
        ? (UNDEAD_ZONE_SPAWN_TOTALS_EARLY[zone] ?? UNDEAD_ZONE_SPAWN_TOTALS_EARLY[4])
        : (UNDEAD_ZONE_SPAWN_TOTALS[zone] ?? UNDEAD_ZONE_SPAWN_TOTALS[4])
    } else {
      spawnTable = useEarly
        ? (ZONE_SPAWNS_EARLY[zone] ?? ZONE_SPAWNS_EARLY[4])
        : (ZONE_SPAWNS[zone] ?? ZONE_SPAWNS[4])
      spawnTotal = useEarly
        ? (ZONE_SPAWN_TOTALS_EARLY[zone] ?? ZONE_SPAWN_TOTALS_EARLY[4])
        : (ZONE_SPAWN_TOTALS[zone] ?? ZONE_SPAWN_TOTALS[4])
    }
    let Factory = pickWeighted(spawnTable, spawnTotal)

    // Archer cap — max 5 archers near the player at any time to prevent barrage spam
    if (Factory === (Archer as unknown as EnemyCtor)) {
      let archerCount = 0
      const px = this.player.x, py = this.player.y
      for (const e of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!e.active) continue
        if ((e as any).constructor?.name === 'Archer' && Phaser.Math.Distance.Between(px, py, e.x, e.y) < 500) {
          archerCount++
        }
      }
      if (archerCount >= 5) {
        const earlyTable = this.isUndead
          ? (UNDEAD_ZONE_SPAWNS_EARLY[zone] ?? UNDEAD_ZONE_SPAWNS_EARLY[4])
          : (ZONE_SPAWNS_EARLY[zone] ?? ZONE_SPAWNS_EARLY[4])
        const earlyTotal = this.isUndead
          ? (UNDEAD_ZONE_SPAWN_TOTALS_EARLY[zone] ?? UNDEAD_ZONE_SPAWN_TOTALS_EARLY[4])
          : (ZONE_SPAWN_TOTALS_EARLY[zone] ?? ZONE_SPAWN_TOTALS_EARLY[4])
        Factory = pickWeighted(earlyTable, earlyTotal)
      }
    }
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

  /** Spawn a single mob of the given type at explicit world coordinates. */
  spawnMobAt(type: string, x: number, y: number): void {
    const tier = this.currentWave
    let mob: BaseEnemy
    switch (type) {
      case 'orc1':
        mob = new Orc1(this.scene, x, y, this.player, tier)
        break
      case 'flyingeye':
        mob = new FlyingEye(this.scene, x, y, this.player, tier, false)
        break
      default:
        mob = new Orc1(this.scene, x, y, this.player, tier)
    }
    mob.players = this.players
    this.enemies.add(mob)
    this._aliveCount++
  }
}
