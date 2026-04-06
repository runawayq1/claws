import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { Player } from '../entities/Player'
import { Orc2 } from '../entities/Skeleton'
import { Orc1 } from '../entities/Zergling'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'
import { Orc3 } from '../entities/Skeleton2'
import { Vampire } from '../entities/Vampire'

export class WaveManager {
  private scene: Phaser.Scene
  private player: Player
  private enemies: Phaser.Physics.Arcade.Group
  private spawnTimer: Phaser.Time.TimerEvent | null = null
  private elapsedMs = 0
  private bossSpawned = false
  totalKills = 0
  currentWave = 0

  constructor(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group) {
    this.scene = scene
    this.player = player
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
      // Mob cap — don't spawn if at limit (like Vampire Survivors)
      const cap = Math.min(
        CONFIG.MOB_CAP_MAX,
        CONFIG.MOB_CAP_BASE + this.currentWave * CONFIG.MOB_CAP_PER_WAVE
      )
      const alive = this.enemies.countActive()
      if (alive < cap) {
        this.spawnMob()
        if (alive + 1 < cap) this.spawnMob()
      }
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
    const angle = Math.random() * Math.PI * 2
    const x = this.player.x + Math.cos(angle) * CONFIG.SPAWN_RADIUS
    const y = this.player.y + Math.sin(angle) * CONFIG.SPAWN_RADIUS
    return {
      x: Phaser.Math.Clamp(x, 0, CONFIG.WORLD_WIDTH),
      y: Phaser.Math.Clamp(y, 0, CONFIG.WORLD_HEIGHT),
    }
  }

  private spawnMob() {
    const { x, y } = this.getSpawnPos()
    const tier = this.currentWave

    // Pick enemy type based on zone (distance from world center)
    // Zone 0 — Crossroads: only Skeleton
    // Zone 1 — Meadow:     Skeleton 70%, Goblin 30%
    // Zone 2 — Ruins:      Skeleton 40%, Goblin 30%, FlyingEye 20%, SandGolem 10%
    // Zone 3 — Dark Forest: Goblin 30%, FlyingEye 30%, SandGolem 25%, Skeleton 15%
    // Zone 4 — Wastes:     SandGolem 40%, FlyingEye 30%, Goblin 20%, Skeleton 10%
    const zone: number = (this.scene as any).getZone(x, y)
    const roll = Math.random()
    let mob: Orc1 | Orc2 | Orc3 | FlyingEye | SandGolem | Vampire

    // Zone 0 — Crossroads: only Orc2
    // Zone 1 — Meadow:     Orc2 70%, Orc1 30%
    // Zone 2 — Ruins:      Orc2 40%, Orc1 30%, FlyingEye 20%, SandGolem 10%, Orc3 15%
    // Zone 3 — Dark Forest: Orc1 30%, FlyingEye 30%, SandGolem 25%, Orc3 30%, Vampire 15%
    // Zone 4 — Wastes:     SandGolem 40%, FlyingEye 30%, Orc1 20%, Orc3 35%, Vampire 20%
    if (zone <= 0) {
      mob = new Orc2(this.scene, x, y, this.player, tier)
    } else if (zone === 1) {
      mob = roll < 0.30
        ? new Orc1(this.scene, x, y, this.player, tier)
        : new Orc2(this.scene, x, y, this.player, tier)
    } else if (zone === 2) {
      // Zone 2 — Ruins: Orc3 appears
      if (roll < 0.10) mob = new SandGolem(this.scene, x, y, this.player, tier)
      else if (roll < 0.25) mob = new Orc3(this.scene, x, y, this.player, tier)
      else if (roll < 0.40) mob = new FlyingEye(this.scene, x, y, this.player, tier)
      else if (roll < 0.65) mob = new Orc1(this.scene, x, y, this.player, tier)
      else mob = new Orc2(this.scene, x, y, this.player, tier)
    } else if (zone === 3) {
      // Zone 3 — Dark Forest: Orc3 + Vampire appear
      if (roll < 0.15) mob = new Vampire(this.scene, x, y, this.player, tier)
      else if (roll < 0.30) mob = new Orc3(this.scene, x, y, this.player, tier)
      else if (roll < 0.50) mob = new SandGolem(this.scene, x, y, this.player, tier)
      else if (roll < 0.70) mob = new FlyingEye(this.scene, x, y, this.player, tier)
      else if (roll < 0.85) mob = new Orc1(this.scene, x, y, this.player, tier)
      else mob = new Orc2(this.scene, x, y, this.player, tier)
    } else {
      // Zone 4 — Wastes: high Vampire + Orc3 density
      if (roll < 0.20) mob = new Vampire(this.scene, x, y, this.player, tier)
      else if (roll < 0.35) mob = new Orc3(this.scene, x, y, this.player, tier)
      else if (roll < 0.55) mob = new SandGolem(this.scene, x, y, this.player, tier)
      else if (roll < 0.75) mob = new FlyingEye(this.scene, x, y, this.player, tier)
      else if (roll < 0.90) mob = new Orc1(this.scene, x, y, this.player, tier)
      else mob = new Orc2(this.scene, x, y, this.player, tier)
    }

    this.enemies.add(mob)

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
  }
}
