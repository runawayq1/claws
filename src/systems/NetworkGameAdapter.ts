/**
 * NetworkGameAdapter — bridges Colyseus server state with GameScene.
 *
 * In online multiplayer mode, this adapter:
 * - Sends local player input to server at 20Hz
 * - Syncs remote player positions from server state
 * - Syncs enemy positions from server state (no local WaveManager)
 * - Handles server events (level-up, death, game-over)
 *
 * GameScene remains the renderer and Phaser coordinator.
 * This adapter just patches positions and triggers events.
 */
import Phaser from 'phaser'
import { gameFont } from '../utils/device'
import { networkManager } from './NetworkManager'
import { getStateCallbacks } from 'colyseus.js'
import type { Player } from '../entities/Player'

// Scale per hero to match Player sprite proportions
const HERO_REMOTE_SCALE: Record<string, number> = {
  ignara: 1.36, sifra: 0.77, nazar: 1.25, amun: 1.5,
  huntress: 1.61, khashin: 1.65, muller: 1.35,
}

// Scale per enemy type — matches client-side entity constructors
const ENEMY_SCALE: Record<string, number> = {
  orc0: 2.0, orc1: 1.58, orc2: 2.0, orc3: 2.0,
  flyingeye: 1.12, sandgolem: 3.2,
}

// Walk animation key per enemy type — matches client entity constructors
const ENEMY_WALK_ANIM: Record<string, string> = {
  orc0: 'orc1_run', orc1: 'orc1_run', orc2: 'orc2_run', orc3: 'orc3_run',
  flyingeye: 'flyingeye_walk', sandgolem: 'orc3_run',
}

// Tint per enemy type — orc0 uses a yellow-green tint to distinguish from orc1
const ENEMY_TINT: Record<string, number> = {
  orc0: 0xbbcc88,
}

// Idle texture fallback — orc0 uses orc1 sprites
const ENEMY_TEXTURE: Record<string, string> = {
  orc0: 'orc1_idle', sandgolem: 'orc3_idle',
}

// Attack animation key per enemy type — matches client entity constructors
const ENEMY_ATTACK_ANIM: Record<string, string> = {
  orc0: 'orc1_attack', orc1: 'orc1_attack', orc2: 'orc2_attack', orc3: 'orc3_attack',
  flyingeye: 'flyingeye_run', sandgolem: 'orc3_attack',
}

interface RemotePlayerSprite {
  sprite: Phaser.Physics.Arcade.Sprite
  nameplate: Phaser.GameObjects.Text
  targetX: number
  targetY: number
  heroType: string
  playerId: string
}

interface RemoteEnemySprite {
  sprite: Phaser.Physics.Arcade.Sprite
  targetX: number
  targetY: number
  hp: number
  maxHp: number
  type: string
  isAttacking: boolean
}

export class NetworkGameAdapter {
  private scene: Phaser.Scene
  private localPlayer: Player
  private remotePlayers = new Map<string, RemotePlayerSprite>()
  private remoteEnemies = new Map<string, RemoteEnemySprite>()
  private inputSendTimer = 0
  private readonly INPUT_SEND_INTERVAL = 50 // 20Hz
  private serverTargetX = 0
  private serverTargetY = 0
  private hasServerPos = false
  /** Phaser group containing remote enemy sprites — used by tryAutoAttack for VFX targeting */
  public enemySprites: Phaser.Physics.Arcade.Group

  constructor(scene: Phaser.Scene, localPlayer: Player) {
    this.scene = scene
    this.localPlayer = localPlayer
    this.enemySprites = scene.physics.add.group()
    this.setupCallbacks()
    this.setupStateSync()
  }

  private setupCallbacks() {
    networkManager.setCallbacks({
      onLevelUp: (_data) => {
        this.scene.events.emit('player-levelup', this.localPlayer)
      },

      onUpgradeApplied: (data) => {
        // Only for local player's upgrades
        if (data.playerId !== networkManager.sessionId) return
        // Apply upgrade via tracker (sets hero ability flags, applies stat changes)
        this.scene.events.emit('network-upgrade-applied', data.upgradeId)
      },

      onPlayerAttack: (data) => {
        // Show VFX at attack location
        this.scene.events.emit('network-attack-vfx', data)
        // Also trigger attack animation on the remote player sprite
        const remote = this.remotePlayers.get(data.playerId)
        if (!remote) return
        remote.sprite.setFlipX(data.x < remote.sprite.x)
        const atkAnim = `${remote.heroType}_attack`
        if (this.scene.anims.exists(atkAnim)) {
          remote.sprite.play(atkAnim).once('animationcomplete', () => {
            // Return to idle after attack
            const idleKey = `${remote.heroType}_idle_anim`
            if (this.scene.anims.exists(idleKey)) remote.sprite.play(idleKey)
          })
        }
      },

      onEnemyKilled: (data) => {
        const key = String(data.enemyId)
        const enemy = this.remoteEnemies.get(key)
        if (enemy) {
          const isMiniBoss = enemy.type.includes('boss') || (enemy.maxHp > 100)
          const isLarge = isMiniBoss || enemy.type === 'sandgolem' || enemy.type === 'orc3'
          const xpMap: Record<string, number> = { orc0: 5, orc1: 8, orc2: 8, orc3: 12, flyingeye: 12, sandgolem: 25 }
          const xpValue = xpMap[enemy.type] ?? 8
          const goldValue = isMiniBoss ? Phaser.Math.Between(5, 10) : (Math.random() < 0.35 ? Phaser.Math.Between(1, 3) : 0)

          this.scene.events.emit('enemy-died', data.x, data.y, xpValue, goldValue, isMiniBoss, isLarge)

          // Remove from map FIRST — prevents onRemove from double-destroying
          this.enemySprites.remove(enemy.sprite)
          this.remoteEnemies.delete(key)

          // Play death animation if available, then destroy
          const deathAnim = `${enemy.type === 'orc0' ? 'orc1' : enemy.type}_death`
          if (enemy.sprite.active && this.scene.anims.exists(deathAnim)) {
            enemy.sprite.play(deathAnim)
            enemy.sprite.once('animationcomplete', () => {
              if (enemy.sprite.active) enemy.sprite.destroy()
            })
          } else if (enemy.sprite.active) {
            this.scene.tweens.add({ targets: enemy.sprite, alpha: 0, duration: 200, onComplete: () => {
              if (enemy.sprite.active) enemy.sprite.destroy()
            }})
          }
        }
      },

      onPlayerDowned: (data) => {
        if (data.playerId === networkManager.sessionId) {
          // Local player downed
          this.localPlayer.isDead = true
          this.scene.events.emit('player-died')
        } else {
          // Remote player downed — show visual
          const remote = this.remotePlayers.get(data.playerId)
          if (remote) {
            remote.sprite.setAlpha(0.4)
            remote.nameplate.setText(remote.nameplate.text + ' [DOWNED]')
          }
        }
      },

      onPlayerRevived: (data) => {
        if (data.playerId === networkManager.sessionId) {
          this.localPlayer.isDead = false
        } else {
          const remote = this.remotePlayers.get(data.playerId)
          if (remote) {
            remote.sprite.setAlpha(1)
          }
        }
      },

      onGameOver: (data) => {
        this.scene.events.emit('network-game-over', data)
      },

      onGameWon: (data) => {
        this.scene.events.emit('network-game-won', data)
      },

      onClawsIncoming: () => {
        this.scene.events.emit('claws-incoming')
      },

      onStateChange: (state) => {
        this.syncState(state)
      },
    })
  }

  private setupStateSync() {
    const room = networkManager.currentRoom
    if (!room) return

    // Colyseus schema v3: use getStateCallbacks() proxy for onAdd/onRemove
    const $ = getStateCallbacks(room)

    $(room.state).players.onAdd((player: any, key: string) => {
      if (key === networkManager.sessionId) return
      if (this.remotePlayers.has(key)) return
      this.addRemotePlayer(key, player)
    })
    $(room.state).players.onRemove((_player: any, key: string) => {
      this.removeRemotePlayer(key)
    })

    $(room.state).enemies.onAdd((enemy: any, key: string) => {
      if (this.remoteEnemies.has(key)) return
      this.addRemoteEnemy(key, enemy)
    })
    $(room.state).enemies.onRemove((_enemy: any, key: string) => {
      this.removeRemoteEnemy(key)
    })
  }

  private addRemotePlayer(id: string, playerState: any) {
    // Create a lightweight sprite for the remote player
    const texKey = `${playerState.heroType}_idle`
    const scale = HERO_REMOTE_SCALE[playerState.heroType] ?? 1
    const sprite = this.scene.physics.add.sprite(playerState.x, playerState.y, texKey, 0)
      .setDepth(5)
      .setScale(scale)

    const nameplate = this.scene.add.text(playerState.x, playerState.y - 40, playerState.name, {
      fontFamily: gameFont(),
      fontSize: '11px',
      color: '#aaffaa',
    }).setOrigin(0.5).setDepth(15)

    // Try to play idle animation
    const animKey = `${playerState.heroType}_idle_anim`
    if (this.scene.anims.exists(animKey)) {
      sprite.play(animKey)
    }

    this.remotePlayers.set(id, {
      sprite,
      nameplate,
      targetX: playerState.x,
      targetY: playerState.y,
      heroType: playerState.heroType,
      playerId: id,
    })
  }

  private removeRemotePlayer(id: string) {
    const remote = this.remotePlayers.get(id)
    if (remote) {
      remote.sprite.destroy()
      remote.nameplate.destroy()
      this.remotePlayers.delete(id)
    }
  }

  private addRemoteEnemy(key: string, enemyState: any) {
    // Determine texture — some enemies share sprites (orc0→orc1, sandgolem→orc3)
    const texKey = ENEMY_TEXTURE[enemyState.type] ?? `${enemyState.type}_idle`
    const sprite = this.scene.physics.add.sprite(
      enemyState.x, enemyState.y,
      this.scene.textures.exists(texKey) ? texKey : 'orc1_idle',
      0,
    ).setDepth(3)

    // Apply correct scale per enemy type (matches client entity constructors)
    const baseScale = ENEMY_SCALE[enemyState.type] ?? 1.5
    sprite.setScale(enemyState.isMiniBoss ? baseScale * 1.5 : baseScale)

    // Tint (orc0 has yellow-green tint)
    const tint = ENEMY_TINT[enemyState.type]
    if (tint) sprite.setTint(tint)

    // Play walk animation
    const walkAnim = ENEMY_WALK_ANIM[enemyState.type] ?? `${enemyState.type}_run`
    if (this.scene.anims.exists(walkAnim)) {
      sprite.play(walkAnim)
    }

    // Stub methods so hero attack code (takeDamage, die, etc.) won't crash
    // Actual damage is handled server-side — these are cosmetic-only sprites
    const s = sprite as any
    s.takeDamage = () => {}
    s.die = () => {}
    s.hp = enemyState.hp
    s.maxHp = enemyState.maxHp
    s.hpDirty = false
    s.isMiniBoss = !!enemyState.isMiniBoss

    this.enemySprites.add(sprite)

    this.remoteEnemies.set(key, {
      sprite,
      targetX: enemyState.x,
      targetY: enemyState.y,
      hp: enemyState.hp,
      maxHp: enemyState.maxHp,
      type: enemyState.type,
      isAttacking: false,
    })
  }

  private removeRemoteEnemy(key: string) {
    const enemy = this.remoteEnemies.get(key)
    if (enemy) {
      this.enemySprites.remove(enemy.sprite)
      enemy.sprite.destroy()
      this.remoteEnemies.delete(key)
    }
  }

  /** Server wave number — exposed for UIScene tier display */
  public serverWave = 1

  private syncState(state: any) {
    if (!state) return

    // Sync wave from server
    if (state.wave) this.serverWave = state.wave

    // Sync local player from server (authoritative)
    const localState = state.players?.get(networkManager.sessionId)
    if (localState) {
      this.localPlayer.hp = localState.hp
      this.localPlayer.maxHp = localState.maxHp
      this.localPlayer.level = localState.level
      this.localPlayer.xp = localState.xp

      // Sync death/downed state from server (covers missed messages during loading)
      if (localState.isDead && !this.localPlayer.isDead) {
        this.localPlayer.isDead = true
        this.scene.events.emit('player-died')
      }
      if (localState.isDowned && !this.localPlayer.isDead) {
        this.localPlayer.isDead = true
        this.scene.events.emit('player-died')
      }

      // Server-authoritative position: store target, interpolate in update()
      this.serverTargetX = localState.x
      this.serverTargetY = localState.y
      this.hasServerPos = true
    }

    // Sync remote players
    if (state.players) {
      state.players.forEach((p: any, key: string) => {
        if (key === networkManager.sessionId) return
        const remote = this.remotePlayers.get(key)
        if (remote) {
          remote.targetX = p.x
          remote.targetY = p.y
          // Sync stance — affects which animation prefix to use in future
          if (p.stance && p.stance !== (remote as any).stance) {
            (remote as any).stance = p.stance
          }
        }
      })
    }

    // Sync enemies
    if (state.enemies) {
      state.enemies.forEach((e: any, key: string) => {
        const remote = this.remoteEnemies.get(key)
        if (remote) {
          remote.targetX = e.x
          remote.targetY = e.y
          remote.hp = e.hp
          remote.maxHp = e.maxHp
          // Keep sprite stubs in sync for hero code that reads enemy.hp
          const s = remote.sprite as any
          s.hp = e.hp
          s.maxHp = e.maxHp
        }
      })
    }
  }

  /** Call from GameScene.update() */
  update(_time: number, delta: number) {
    // Send input to server at 20Hz
    this.inputSendTimer += delta
    if (this.inputSendTimer >= this.INPUT_SEND_INTERVAL) {
      this.inputSendTimer -= this.INPUT_SEND_INTERVAL
      const input = this.localPlayer.inputController
      if (input) {
        const dir = input.getDirection()
        networkManager.sendInput(dir.dx, dir.dy, input.getStanceToggle())
      }
    }

    // Server-authoritative: interpolate local player toward server position
    // No client-side prediction — server is the truth, client just renders
    if (this.hasServerPos) {
      const body = this.localPlayer.body as Phaser.Physics.Arcade.Body
      if (body) body.setVelocity(0, 0) // disable physics movement

      const dx = this.serverTargetX - this.localPlayer.x
      const dy = this.serverTargetY - this.localPlayer.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 300) {
        // Large gap (spawn, reconnect) — hard snap
        if (body) body.reset(this.serverTargetX, this.serverTargetY)
      } else if (dist > 2) {
        // Smooth interpolation toward server pos
        const t = 1 - Math.exp(-delta / 80) // exponential, frame-rate independent
        this.localPlayer.x += dx * t
        this.localPlayer.y += dy * t
      }
    }

    // Frame-rate independent exponential lerp — converges in ~80ms regardless of fps
    const lerpFactor = 1 - Math.exp(-delta / 80)
    this.remotePlayers.forEach(remote => {
      const prevX = remote.sprite.x
      const prevY = remote.sprite.y
      remote.sprite.x += (remote.targetX - remote.sprite.x) * lerpFactor
      remote.sprite.y += (remote.targetY - remote.sprite.y) * lerpFactor
      remote.nameplate.setPosition(remote.sprite.x, remote.sprite.y - 40)

      // Flip sprite based on movement direction
      if (remote.targetX < remote.sprite.x - 1) remote.sprite.setFlipX(true)
      else if (remote.targetX > remote.sprite.x + 1) remote.sprite.setFlipX(false)

      // Toggle walk/idle animation based on movement
      const dx = remote.sprite.x - prevX
      const dy = remote.sprite.y - prevY
      const moving = dx * dx + dy * dy > 0.5
      const runKey = `${remote.heroType}_run`
      const idleKey = `${remote.heroType}_idle_anim`
      if (moving && remote.sprite.anims.currentAnim?.key !== runKey && this.scene.anims.exists(runKey)) {
        remote.sprite.play(runKey)
      } else if (!moving && remote.sprite.anims.currentAnim?.key === runKey && this.scene.anims.exists(idleKey)) {
        remote.sprite.play(idleKey)
      }
    })

    // Interpolate enemy positions + attack animation based on proximity
    this.remoteEnemies.forEach(enemy => {
      enemy.sprite.x += (enemy.targetX - enemy.sprite.x) * lerpFactor
      enemy.sprite.y += (enemy.targetY - enemy.sprite.y) * lerpFactor

      // Flip sprite based on movement direction
      if (enemy.targetX < enemy.sprite.x - 1) enemy.sprite.setFlipX(true)
      else if (enemy.targetX > enemy.sprite.x + 1) enemy.sprite.setFlipX(false)

      // Attack animation: check proximity to any known player (local + remote)
      const ATTACK_RANGE = 45
      let nearPlayer = false
      // Check local player
      const dx0 = enemy.sprite.x - this.localPlayer.x
      const dy0 = enemy.sprite.y - this.localPlayer.y
      if (dx0 * dx0 + dy0 * dy0 < ATTACK_RANGE * ATTACK_RANGE) nearPlayer = true
      // Check remote players
      if (!nearPlayer) {
        this.remotePlayers.forEach(rp => {
          const dx = enemy.sprite.x - rp.sprite.x
          const dy = enemy.sprite.y - rp.sprite.y
          if (dx * dx + dy * dy < ATTACK_RANGE * ATTACK_RANGE) nearPlayer = true
        })
      }

      if (nearPlayer && !enemy.isAttacking) {
        enemy.isAttacking = true
        const atkAnim = ENEMY_ATTACK_ANIM[enemy.type]
        if (atkAnim && this.scene.anims.exists(atkAnim)) enemy.sprite.play(atkAnim)
      } else if (!nearPlayer && enemy.isAttacking) {
        enemy.isAttacking = false
        const walkAnim = ENEMY_WALK_ANIM[enemy.type] ?? `${enemy.type}_run`
        if (this.scene.anims.exists(walkAnim)) enemy.sprite.play(walkAnim)
      }
    })
  }

  /** Get a remote player sprite entry by session ID */
  getRemotePlayer(playerId: string) {
    return this.remotePlayers.get(playerId) ?? null
  }

  /** Draw HP bars for remote enemies */
  drawEnemyHpBars(g: Phaser.GameObjects.Graphics) {
    this.remoteEnemies.forEach(e => {
      if (e.hp >= e.maxHp) return
      const barWidth = e.maxHp > 100 ? 40 : e.maxHp > 30 ? 30 : 24
      const barHeight = e.maxHp > 100 ? 5 : 3
      const bx = e.sprite.x - barWidth / 2
      const by = e.sprite.y - 20

      g.fillStyle(0x000000, 0.6)
      g.fillRect(bx - 1, by - 1, barWidth + 2, barHeight + 2)
      g.fillStyle(0x222222, 1)
      g.fillRect(bx, by, barWidth, barHeight)

      const ratio = Math.max(0, e.hp / e.maxHp)
      const color = ratio > 0.5 ? 0x44ff44 : ratio > 0.25 ? 0xffaa00 : 0xff4444
      g.fillStyle(color, 1)
      g.fillRect(bx, by, barWidth * ratio, barHeight)
    })
  }

  destroy() {
    this.remotePlayers.forEach(r => {
      r.sprite.destroy()
      r.nameplate.destroy()
    })
    this.remotePlayers.clear()

    this.remoteEnemies.forEach(e => {
      e.sprite.destroy()
    })
    this.remoteEnemies.clear()
  }
}
