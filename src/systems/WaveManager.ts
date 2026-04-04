import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { Player } from '../entities/Player'
import { Skeleton } from '../entities/Skeleton'
import { Goblin } from '../entities/Zergling'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'

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

    // Pick enemy type based on tier + random chance
    // Skeleton = basic (always), Goblin = fast (tier 2+), FlyingEye = flying dmg (tier 4+), SandGolem = tank (tier 6+)
    const roll = Math.random()
    let mob: Skeleton | Goblin | FlyingEye | SandGolem

    if (tier >= 6 && roll < 0.08) {
      mob = new SandGolem(this.scene, x, y, this.player, tier)
    } else if (tier >= 4 && roll < 0.15) {
      mob = new FlyingEye(this.scene, x, y, this.player, tier)
    } else if (tier >= 2 && roll < 0.30) {
      mob = new Goblin(this.scene, x, y, this.player, tier)
    } else {
      mob = new Skeleton(this.scene, x, y, this.player, tier)
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
