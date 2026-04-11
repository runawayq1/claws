import { Room, Client } from 'colyseus'
import { GameRoomState, PlayerState, EnemyState } from '../schema/GameState'
import { HERO_DEFS } from '../logic/HeroDefs'
import { ENEMY_DEFS, pickWeightedType } from '../logic/EnemyDefs'
import { SERVER_CONFIG as CFG } from '../logic/GameConfig'
import { SpatialGrid } from '../logic/SpatialGrid'

interface JoinOptions {
  playerName: string
  heroType: string
}

interface InputMessage {
  dx: number
  dy: number
  stance?: boolean
}

interface HeroSelectMessage {
  heroType: string
}

interface UpgradeChosenMessage {
  upgradeId: string
}

export class GameRoom extends Room<GameRoomState> {
  maxClients = CFG.MAX_PLAYERS
  private tickInterval: ReturnType<typeof setInterval> | null = null
  private nextEnemyId = 1
  private enemyAttackTimers = new Map<number, number>() // enemyId → ms since last hit
  private playerAttackTimers = new Map<string, number>() // playerId → ms since last attack
  private enemyRetargetTimers = new Map<number, number>() // enemyId → ms until retarget
  private pendingLevelUps = new Map<string, string[]>() // playerId → offered upgrade IDs
  private readyPlayers = new Set<string>() // clients that finished loading
  private spatialGrid = new SpatialGrid(120)

  onCreate() {
    console.log(`[GameRoom] Room created: ${this.roomId}`)
    this.setState(new GameRoomState())
    this.state.seed = Math.floor(Math.random() * 0xFFFFFFFF)
    this.state.status = 'waiting'

    // --- Input handler ---
    this.onMessage('input', (client: Client, msg: InputMessage) => {
      const p = this.state.players.get(client.sessionId)
      if (!p || p.isDead || p.isDowned) return
      // Clamp direction
      const len = Math.sqrt(msg.dx * msg.dx + msg.dy * msg.dy)
      if (len > 0) {
        p.inputDx = msg.dx / len
        p.inputDy = msg.dy / len
      } else {
        p.inputDx = 0
        p.inputDy = 0
      }
      if (msg.stance) p.inputStance = true
    })

    // --- Hero selection in lobby ---
    this.onMessage('select-hero', (client: Client, msg: HeroSelectMessage) => {
      if (this.state.status !== 'waiting') return
      const hero = msg.heroType
      if (!HERO_DEFS[hero]) return

      // Check uniqueness — no two players can pick the same hero
      let taken = false
      this.state.players.forEach((p) => {
        if (p.id !== client.sessionId && p.heroType === hero) taken = true
      })
      if (taken) {
        client.send('hero-taken', { heroType: hero })
        return
      }

      const p = this.state.players.get(client.sessionId)
      if (p) {
        p.heroType = hero
        const def = HERO_DEFS[hero]
        p.hp = def.hp
        p.maxHp = def.hp
        p.speed = def.speed
        p.damage = def.damage
      }
    })

    // --- Host starts the game ---
    this.onMessage('start', (client: Client) => {
      if (this.state.status !== 'waiting') return
      // Only the first player (host) can start
      const ids = Array.from(this.state.players.keys())
      if (ids[0] !== client.sessionId) return
      // Need at least 2 players
      if (this.state.players.size < 2) return
      // All players must have selected a hero
      let allReady = true
      this.state.players.forEach(p => {
        if (!HERO_DEFS[p.heroType]) allReady = false
      })
      if (!allReady) return

      this.startGame()
    })

    // --- Upgrade chosen after level-up ---
    this.onMessage('upgrade-chosen', (client: Client, msg: UpgradeChosenMessage) => {
      const p = this.state.players.get(client.sessionId)
      if (!p) return
      // Apply upgrade (simple stat boosts for now)
      this.applyUpgrade(p, msg.upgradeId)
    })

    // --- Client finished loading, ready to play ---
    this.onMessage('ready', (client: Client) => {
      if (this.state.status !== 'playing') return
      this.readyPlayers.add(client.sessionId)
      console.log(`[GameRoom] Player ready: ${client.sessionId} (${this.readyPlayers.size}/${this.state.players.size})`)
      // Start tick only when ALL players are ready
      if (this.readyPlayers.size >= this.state.players.size && !this.tickInterval) {
        console.log(`[GameRoom] All players ready — starting game tick`)
        this.tickInterval = setInterval(() => this.gameTick(), CFG.TICK_MS)
      }
    })

    // --- Revive request ---
    this.onMessage('revive', (client: Client, msg: { targetId: string }) => {
      const reviver = this.state.players.get(client.sessionId)
      const target = this.state.players.get(msg.targetId)
      if (!reviver || !target) return
      if (reviver.isDead || reviver.isDowned) return
      if (!target.isDowned) return
      // Check proximity
      const dx = reviver.x - target.x
      const dy = reviver.y - target.y
      if (dx * dx + dy * dy < 80 * 80) {
        target.isDowned = false
        target.hp = Math.ceil(target.maxHp * 0.5)
        this.broadcast('player-revived', { playerId: msg.targetId })
      }
    })
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(`[GameRoom] onJoin: ${client.sessionId}, name=${options.playerName}, hero=${options.heroType}, room=${this.roomId}, players=${this.state.players.size}`)
    const p = new PlayerState()
    p.id = client.sessionId
    p.name = options.playerName || 'Player'
    p.heroType = options.heroType || 'ignara'

    // Spawn at origin (matches client infinite map) with slight offset per player
    const idx = this.state.players.size
    p.x = idx * 60
    p.y = 0

    // Apply hero stats
    const def = HERO_DEFS[p.heroType]
    if (def) {
      p.hp = def.hp
      p.maxHp = def.hp
      p.speed = def.speed
      p.damage = def.damage
      // Set initial stance to first defined stance
      if (def.stances && def.stances.length > 0) {
        p.stance = def.stances[0]
      }
    }

    p.xpToNext = CFG.XP_BASE

    this.state.players.set(client.sessionId, p)
    this.state.playerCount = this.state.players.size

    // Notify others
    this.broadcast('player-joined', {
      playerId: client.sessionId,
      playerName: p.name,
      heroType: p.heroType,
      slot: idx,
    })
  }

  async onLeave(client: Client, consented: boolean) {
    try {
      console.log(`[GameRoom] onLeave: ${client.sessionId}, consented=${consented}`)
      const p = this.state.players.get(client.sessionId)
      if (!p) return

      if (this.state.status === 'playing' && !consented) {
        try {
          await this.allowReconnection(client, CFG.RECONNECT_TIMEOUT)
          console.log(`[GameRoom] Player reconnected: ${client.sessionId}`)
          return
        } catch {
          console.log(`[GameRoom] Reconnect timeout: ${client.sessionId}`)
        }
      }

      this.state.players.delete(client.sessionId)
      this.state.playerCount = this.state.players.size
      this.broadcast('player-left', { playerId: client.sessionId })

      // If all players left, dispose room gracefully
      if (this.state.players.size === 0) {
        if (this.state.status === 'playing') {
          this.endGame()
        }
        // Room auto-disposes when empty — no need to call this.disconnect()
      }
    } catch (err) {
      console.error(`[GameRoom] onLeave error:`, err)
    }
  }

  onDispose() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
  }

  // ─── Game Start ───────────────────────────────────────────

  private startGame() {
    this.state.status = 'playing'
    this.state.elapsedMs = 0
    this.state.wave = 1
    this.readyPlayers.clear()

    this.broadcast('game-start', {
      seed: this.state.seed,
      players: this.getPlayerSlots(),
    })

    // Lock room — no more joins
    this.lock()

    // Tick starts when all clients send 'ready' (after loading)
    // Safety: if clients don't send ready within 5s, start anyway
    setTimeout(() => {
      if (!this.tickInterval && this.state.status === 'playing') {
        console.log(`[GameRoom] Ready timeout — force-starting game tick`)
        this.tickInterval = setInterval(() => this.gameTick(), CFG.TICK_MS)
      }
    }, 5000)
  }

  private endGame() {
    this.state.status = 'ended'
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    this.broadcast('game-over', {
      elapsedMs: this.state.elapsedMs,
      sharedGold: this.state.sharedGold,
    })
  }

  // ─── Server Game Loop @ 20Hz ──────────────────────────────

  private gameTick() {
    const dt = CFG.TICK_MS

    this.state.elapsedMs += dt
    this.state.wave = Math.floor(this.state.elapsedMs / 30_000) + 1

    this.updatePlayers(dt)
    this.updateEnemies(dt)

    // Rebuild spatial grid after enemy positions updated
    this.spatialGrid.clear()
    this.state.enemies.forEach((e, key) => this.spatialGrid.insert(key, e.x, e.y))

    this.checkPlayerEnemyCollisions(dt)
    this.checkPlayerAttacks(dt)
    this.spawnEnemies()

    // HP regen from mu_regen upgrade stacks
    this.state.players.forEach(p => {
      if (p.isDead || p.isDowned) return
      const stacks = p.upgrades['mu_regen'] ?? 0
      if (stacks > 0) p.hp = Math.min(p.maxHp, p.hp + stacks * 2 * (CFG.TICK_MS / 1000))
    })

    // Check game over — all players dead
    let allDead = true
    this.state.players.forEach(p => {
      if (!p.isDead) allDead = false
    })
    if (allDead && this.state.players.size > 0) {
      this.endGame()
    }

    // Boss at 10 min
    if (this.state.elapsedMs >= CFG.RUN_DURATION && this.state.status === 'playing') {
      this.broadcast('claws-incoming', {})
      // For now, end game as win after boss event
      this.state.status = 'ended'
      if (this.tickInterval) {
        clearInterval(this.tickInterval)
        this.tickInterval = null
      }
      this.broadcast('game-won', {
        elapsedMs: this.state.elapsedMs,
        sharedGold: this.state.sharedGold,
      })
    }
  }

  // ─── Player Movement ──────────────────────────────────────

  /** Leash zone: players can't go further than LEASH_RADIUS from the group center */
  private readonly LEASH_RADIUS = 450 // ~2x camera half-width

  private getGroupCenter(): { x: number; y: number } {
    let cx = 0, cy = 0, count = 0
    this.state.players.forEach(p => {
      if (p.isDead) return
      cx += p.x; cy += p.y; count++
    })
    if (count === 0) return { x: 0, y: 0 }
    return { x: cx / count, y: cy / count }
  }

  private updatePlayers(dt: number) {
    const center = this.getGroupCenter()

    this.state.players.forEach((p) => {
      if (p.isDead || p.isDowned) return

      // Stance toggle
      if (p.inputStance) {
        p.inputStance = false
        const heroDef = HERO_DEFS[p.heroType]
        const stances = heroDef?.stances
        if (stances && stances.length > 1) {
          const idx = stances.indexOf(p.stance)
          p.stance = stances[(idx + 1) % stances.length] ?? stances[0]
        }
      }

      if (p.inputDx === 0 && p.inputDy === 0) return

      const newX = p.x + p.inputDx * p.speed * (dt / 1000)
      const newY = p.y + p.inputDy * p.speed * (dt / 1000)

      // Clamp to leash zone around group center (square)
      p.x = Math.max(center.x - this.LEASH_RADIUS, Math.min(center.x + this.LEASH_RADIUS, newX))
      p.y = Math.max(center.y - this.LEASH_RADIUS, Math.min(center.y + this.LEASH_RADIUS, newY))
    })
  }

  // ─── Enemy AI ─────────────────────────────────────────────

  private updateEnemies(dt: number) {
    this.state.enemies.forEach((e, key) => {
      // Retarget timer
      let retargetMs = this.enemyRetargetTimers.get(e.id) ?? 0
      retargetMs -= dt
      if (retargetMs <= 0) {
        retargetMs = 2000
        this.retargetEnemy(e)
      }
      this.enemyRetargetTimers.set(e.id, retargetMs)

      // Move toward target
      const dx = e.targetX - e.x
      const dy = e.targetY - e.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 20) {
        const moveX = (dx / dist) * e.speed * (dt / 1000)
        const moveY = (dy / dist) * e.speed * (dt / 1000)
        e.x += moveX
        e.y += moveY
      }
    })
  }

  private retargetEnemy(e: EnemyState) {
    let nearestDist = Infinity
    let nearestX = e.x
    let nearestY = e.y

    this.state.players.forEach(p => {
      if (p.isDead || p.isDowned) return
      const dx = p.x - e.x
      const dy = p.y - e.y
      const dist = dx * dx + dy * dy
      if (dist < nearestDist) {
        nearestDist = dist
        nearestX = p.x
        nearestY = p.y
      }
    })

    e.targetX = nearestX
    e.targetY = nearestY
  }

  // ─── Collision: Enemy → Player Damage ─────────────────────

  private checkPlayerEnemyCollisions(dt: number) {
    this.state.players.forEach(p => {
      if (p.isDead || p.isDowned) return

      const nearbyKeys = this.spatialGrid.query(p.x, p.y, 80)
      for (const key of nearbyKeys) {
        const e = this.state.enemies.get(key)
        if (!e) continue

        const dx = p.x - e.x
        const dy = p.y - e.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 40) continue // collision radius

        // Damage per second → per tick
        const def = ENEMY_DEFS[e.type] ?? ENEMY_DEFS['orc0']
        const dmg = def.damage * CFG.dmgMultiplier(this.state.playerCount) * (dt / 1000)

        // Damage mitigation from armor upgrades
        // cr1 = Stone Skin: each stack reduces incoming damage by 5%, max 60%
        const armorStacks = p.upgrades['mu_armor'] ?? p.upgrades['cr1'] ?? 0
        const damageReduction = Math.min(0.6, armorStacks * 0.05)
        const reducedDmg = dmg * (1 - damageReduction)
        p.hp -= reducedDmg

        if (p.hp <= 0) {
          p.hp = 0
          this.playerDowned(p)
        }
      }
    })
  }

  // ─── Player Attacks → Enemy Damage ────────────────────────

  private checkPlayerAttacks(dt: number) {
    this.state.players.forEach(p => {
      if (p.isDead || p.isDowned) return

      let timer = this.playerAttackTimers.get(p.id) ?? 0
      timer -= dt
      if (timer > 0) { this.playerAttackTimers.set(p.id, timer); return }

      const heroDef = HERO_DEFS[p.heroType]
      if (!heroDef) return

      // Apply stance multipliers
      const isAltStance = heroDef.stances && heroDef.stances.length > 1 && p.stance !== heroDef.stances[0]
      const damageMult = (isAltStance && heroDef.altStanceDamageMult) ? heroDef.altStanceDamageMult : 1
      const rangeMult = (isAltStance && heroDef.altStanceRangeMult) ? heroDef.altStanceRangeMult : 1
      const effectiveRange = heroDef.range * rangeMult
      const effectiveDamage = p.damage * damageMult

      // Find nearest enemy in range — use spatial grid for efficiency
      let nearestKey: string | null = null
      let nearestDist = effectiveRange * effectiveRange
      const candidateKeys = this.spatialGrid.query(p.x, p.y, effectiveRange)
      for (const key of candidateKeys) {
        const e = this.state.enemies.get(key)
        if (!e) continue
        const dx = p.x - e.x
        const dy = p.y - e.y
        const dist = dx * dx + dy * dy
        if (dist < nearestDist) { nearestDist = dist; nearestKey = key }
      }

      if (!nearestKey) return

      const primaryTarget = this.state.enemies.get(nearestKey)!
      this.playerAttackTimers.set(p.id, heroDef.cooldown)
      this.broadcast('player-attack', { playerId: p.id, targetId: primaryTarget.id, damage: effectiveDamage, x: primaryTarget.x, y: primaryTarget.y })

      // Apply damage based on attack pattern
      const killed: [EnemyState, string][] = []

      if (heroDef.attackPattern === 'aoe') {
        const radius = heroDef.splashRadius ?? 80
        this.state.enemies.forEach((e, key) => {
          const dx = primaryTarget.x - e.x
          const dy = primaryTarget.y - e.y
          if (dx * dx + dy * dy <= radius * radius) {
            e.hp -= effectiveDamage
            if (e.hp <= 0) killed.push([e, key])
          }
        })
      } else if (heroDef.attackPattern === 'cone') {
        const halfAngle = ((heroDef.coneAngle ?? 90) / 2) * (Math.PI / 180)
        const aimAngle = Math.atan2(primaryTarget.y - p.y, primaryTarget.x - p.x)
        this.state.enemies.forEach((e, key) => {
          const dx = e.x - p.x
          const dy = e.y - p.y
          const dist2 = dx * dx + dy * dy
          if (dist2 > effectiveRange * effectiveRange * 1.5) return
          const angle = Math.atan2(dy, dx)
          let diff = Math.abs(angle - aimAngle)
          if (diff > Math.PI) diff = Math.PI * 2 - diff
          if (diff <= halfAngle) {
            e.hp -= effectiveDamage
            if (e.hp <= 0) killed.push([e, key])
          }
        })
      } else if (heroDef.attackPattern === 'line') {
        // Line from player through primary target, width ~30px
        const aimAngle = Math.atan2(primaryTarget.y - p.y, primaryTarget.x - p.x)
        const lineWidth = 30
        this.state.enemies.forEach((e, key) => {
          const dx = e.x - p.x
          const dy = e.y - p.y
          const dist2 = dx * dx + dy * dy
          if (dist2 > effectiveRange * effectiveRange * 1.5) return
          // Project onto aim direction, check perpendicular distance
          const along = dx * Math.cos(aimAngle) + dy * Math.sin(aimAngle)
          if (along < 0) return
          const perp = Math.abs(-dx * Math.sin(aimAngle) + dy * Math.cos(aimAngle))
          if (perp <= lineWidth) {
            e.hp -= effectiveDamage
            if (e.hp <= 0) killed.push([e, key])
          }
        })
      } else {
        // single
        primaryTarget.hp -= effectiveDamage
        if (primaryTarget.hp <= 0) killed.push([primaryTarget, nearestKey])
      }

      for (const [e, key] of killed) this.enemyKilled(e, p, key)
    })
  }

  // ─── Enemy Death ──────────────────────────────────────────

  private enemyKilled(e: EnemyState, killer: PlayerState, key: string) {
    const def = ENEMY_DEFS[e.type] ?? ENEMY_DEFS['orc0']
    const wave = this.state.wave
    const xp = def.xpBase + Math.floor(wave / def.xpPerWaves)
    const xpPerPlayer = Math.floor(xp * CFG.xpMultiplier(this.state.playerCount))

    // XP to all alive players
    this.state.players.forEach(p => {
      if (p.isDead || p.isDowned) return
      p.xp += xpPerPlayer
      this.checkLevelUp(p)
    })

    // Gold to shared pool
    if (Math.random() < CFG.GOLD_MOB_CHANCE) {
      const gold = e.isMiniBoss
        ? randInt(CFG.GOLD_BOSS_MIN, CFG.GOLD_BOSS_MAX) + Math.floor(wave * 3)
        : randInt(CFG.GOLD_MOB_MIN, CFG.GOLD_MOB_MAX)
      this.state.sharedGold += gold
    }

    // Remove enemy
    this.state.enemies.delete(key)
    this.enemyRetargetTimers.delete(e.id)
    this.enemyAttackTimers.delete(e.id)

    this.broadcast('enemy-killed', { enemyId: e.id, x: e.x, y: e.y, type: e.type })
  }

  // ─── Level Up ─────────────────────────────────────────────

  private checkLevelUp(p: PlayerState) {
    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext
      p.level++
      p.xpToNext = CFG.XP_BASE + CFG.XP_PER_LEVEL * (p.level - 1)

      // Notify client to show upgrade picker
      const client = this.clients.find(c => c.sessionId === p.id)
      if (client) {
        client.send('level-up', {
          level: p.level,
          // Client will generate upgrade options based on hero + level
        })
      }
    }
  }

  private applyUpgrade(p: PlayerState, upgradeId: string) {
    // Track upgrades
    p.upgrades[upgradeId] = (p.upgrades[upgradeId] ?? 0) + 1

    // Apply stat upgrades (simplified — client has full upgrade definitions)
    if (upgradeId.startsWith('mu_hp')) { p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp) }
    else if (upgradeId.startsWith('mu_spd')) p.speed += 15
    else if (upgradeId.startsWith('mu_dmg')) p.damage += 8
    else if (upgradeId.startsWith('mu_regen')) { /* hp regen handled per tick */ }

    this.broadcast('upgrade-applied', { playerId: p.id, upgradeId })
  }

  // ─── Player Downed ────────────────────────────────────────

  private playerDowned(p: PlayerState) {
    // Check if any other player is alive
    let anyAlive = false
    this.state.players.forEach(other => {
      if (other.id !== p.id && !other.isDead && !other.isDowned) anyAlive = true
    })

    if (anyAlive) {
      p.isDowned = true
      this.broadcast('player-downed', { playerId: p.id })
    } else {
      // All dead — mark as dead
      p.isDead = true
      this.state.players.forEach(other => {
        if (other.isDowned) other.isDead = true
      })
    }
  }

  // ─── Spawning ─────────────────────────────────────────────

  private spawnEnemies() {
    // Spawn protection: no enemies for first 3 seconds
    if (this.state.elapsedMs < 3000) return

    const n = this.state.playerCount
    const wave = this.state.wave
    const cap = Math.min(
      CFG.MOB_CAP_MAX * CFG.mobCapMultiplier(n),
      CFG.MOB_CAP_BASE + wave * CFG.MOB_CAP_PER_WAVE
    )

    const alive = this.state.enemies.size
    if (alive >= cap) return

    // Ramp up spawn rate: 1 per tick for first 10s, then 2
    const maxPerTick = this.state.elapsedMs < 10_000 ? 1 : 2
    const toSpawn = Math.min(maxPerTick, cap - alive)
    for (let i = 0; i < toSpawn; i++) {
      this.spawnMob()
    }

    // Mini-boss every 30s
    const miniBossInterval = 30_000
    const prevCheck = this.state.elapsedMs - CFG.TICK_MS
    if (Math.floor(this.state.elapsedMs / miniBossInterval) > Math.floor(prevCheck / miniBossInterval)) {
      this.spawnMiniBoss()
    }
  }

  private spawnMob() {
    const pos = this.getSpawnPos()
    const type = pickWeightedType(this.getZone(pos.x, pos.y))
    const def = ENEMY_DEFS[type] ?? ENEMY_DEFS['orc0']
    const wave = this.state.wave
    const n = this.state.playerCount

    const e = new EnemyState()
    e.id = this.nextEnemyId++
    e.x = pos.x
    e.y = pos.y
    e.type = type
    e.tier = wave
    e.maxHp = Math.floor((def.baseHp + (wave - 1) * def.hpPerWave) * CFG.hpMultiplier(n))
    e.hp = e.maxHp
    e.speed = def.baseSpeed + wave * def.speedPerWave

    // Random buffs at higher tiers
    if (wave >= 5 && Math.random() < 0.3) e.speed *= 1.3
    if (wave >= 8 && Math.random() < 0.3) { e.maxHp *= 1.5; e.hp = e.maxHp }

    this.state.enemies.set(String(e.id), e)
    this.retargetEnemy(e)
    this.enemyRetargetTimers.set(e.id, Math.random() * 2000)
  }

  private spawnMiniBoss() {
    if (this.state.enemies.size >= CFG.MOB_CAP_MAX) return
    const pos = this.getSpawnPos()
    const wave = this.state.wave
    const n = this.state.playerCount

    const useFlyingEye = wave >= 5 && Math.random() < Math.min(0.5, (wave - 5) * 0.1)
    const defKey = useFlyingEye ? 'flyingeye_boss' : 'sandgolem'
    const def = ENEMY_DEFS[defKey]

    const e = new EnemyState()
    e.id = this.nextEnemyId++
    e.x = pos.x
    e.y = pos.y
    e.type = def.type
    e.tier = wave
    e.maxHp = Math.floor((def.baseHp + (wave - 1) * def.hpPerWave) * CFG.hpMultiplier(n))
    e.hp = e.maxHp
    e.speed = def.baseSpeed + wave * def.speedPerWave
    e.isMiniBoss = true

    this.state.enemies.set(String(e.id), e)
    this.retargetEnemy(e)
    this.enemyRetargetTimers.set(e.id, Math.random() * 2000)
  }

  private getSpawnPos(): { x: number; y: number } {
    // Spawn near a random alive player, just outside view (~600px away)
    const alivePlayers: PlayerState[] = []
    this.state.players.forEach(p => {
      if (!p.isDead && !p.isDowned) alivePlayers.push(p)
    })
    if (alivePlayers.length === 0) return { x: CFG.WORLD_WIDTH / 2, y: CFG.WORLD_HEIGHT / 2 }

    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
    const angle = Math.random() * Math.PI * 2
    const dist = 500 + Math.random() * 200
    return {
      x: target.x + Math.cos(angle) * dist,
      y: target.y + Math.sin(angle) * dist,
    }
  }

  private getZone(x: number, y: number): number {
    // Zone = distance from player cluster center (not world center)
    const center = this.getPlayerCenter()
    const dist = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2)
    if (dist < 400) return 0
    if (dist < 800) return 1
    if (dist < 1200) return 2
    if (dist < 1600) return 3
    return 4
  }

  private getPlayerCenter(): { x: number; y: number } {
    let sx = 0, sy = 0, count = 0
    this.state.players.forEach(p => {
      if (!p.isDead && !p.isDowned) { sx += p.x; sy += p.y; count++ }
    })
    if (count === 0) return { x: 0, y: 0 }
    return { x: sx / count, y: sy / count }
  }

  // ─── Helpers ──────────────────────────────────────────────

  private getPlayerSlots() {
    const slots: { id: string; name: string; heroType: string; isHost: boolean }[] = []
    let first = true
    this.state.players.forEach(p => {
      slots.push({ id: p.id, name: p.name, heroType: p.heroType, isHost: first })
      first = false
    })
    return slots
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
