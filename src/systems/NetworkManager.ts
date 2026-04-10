import { Client, Room } from 'colyseus.js'

// Server URL — Render free tier (dev) or Railway (prod)
const DEFAULT_SERVER_URL = import.meta.env.VITE_COLYSEUS_URL || 'ws://localhost:2567'

export interface PlayerSlot {
  id: string
  name: string
  heroType: string
  isHost: boolean
}

export interface NetworkCallbacks {
  onPlayerJoined?: (data: { playerId: string; playerName: string; heroType: string; slot: number }) => void
  onPlayerLeft?: (data: { playerId: string }) => void
  onHeroTaken?: (data: { heroType: string }) => void
  onGameStart?: (data: { seed: number; players: PlayerSlot[] }) => void
  onStateChange?: (state: any) => void
  onError?: (code: number, message: string) => void
  onLeave?: (code: number) => void

  // In-game events
  onLevelUp?: (data: { level: number }) => void
  onPlayerAttack?: (data: { playerId: string; targetId: number; damage: number; x: number; y: number }) => void
  onEnemyKilled?: (data: { enemyId: number; x: number; y: number; type: string }) => void
  onPlayerDowned?: (data: { playerId: string }) => void
  onPlayerRevived?: (data: { playerId: string }) => void
  onUpgradeApplied?: (data: { playerId: string; upgradeId: string }) => void
  onGameOver?: (data: { elapsedMs: number; sharedGold: number }) => void
  onGameWon?: (data: { elapsedMs: number; sharedGold: number }) => void
  onClawsIncoming?: () => void
}

class NetworkManager {
  private client: Client | null = null
  private room: Room | null = null
  private _connected = false
  private _isHost = false
  private _sessionId = ''
  private callbacks: NetworkCallbacks = {}

  get connected() { return this._connected }
  get isHost() { return this._isHost }
  get sessionId() { return this._sessionId }
  get currentRoom() { return this.room }

  /** Connect to Colyseus server */
  async connect(url?: string): Promise<void> {
    const serverUrl = url || DEFAULT_SERVER_URL
    this.client = new Client(serverUrl)
    this._connected = true
  }

  /** Quick Play: join an existing room or create a new one */
  async joinOrCreate(playerName: string, heroType: string): Promise<Room> {
    if (!this.client) throw new Error('Not connected')

    this.room = await this.client.joinOrCreate('game', {
      playerName,
      heroType,
    })

    this._sessionId = this.room.sessionId
    this.setupRoomListeners()
    return this.room
  }

  /** Create a new room (host) */
  async createRoom(playerName: string, heroType: string): Promise<Room> {
    if (!this.client) throw new Error('Not connected')

    this.room = await this.client.create('game', {
      playerName,
      heroType,
    })

    this._sessionId = this.room.sessionId
    this._isHost = true
    this.setupRoomListeners()
    return this.room
  }

  /** Join an existing room by ID */
  async joinRoom(roomId: string, playerName: string, heroType: string): Promise<Room> {
    if (!this.client) throw new Error('Not connected')

    this.room = await this.client.joinById(roomId, {
      playerName,
      heroType,
    })

    this._sessionId = this.room.sessionId
    this.setupRoomListeners()
    return this.room
  }

  /** Set callbacks for room events */
  setCallbacks(cb: NetworkCallbacks) {
    this.callbacks = cb
  }

  /** Send player input to server (called every tick, ~20Hz) */
  sendInput(dx: number, dy: number, stance?: boolean) {
    if (!this.room) return
    this.room.send('input', { dx, dy, stance })
  }

  /** Select hero in lobby */
  selectHero(heroType: string) {
    if (!this.room) return
    this.room.send('select-hero', { heroType })
  }

  /** Host starts the game */
  startGame() {
    if (!this.room) return
    this.room.send('start')
  }

  /** Send chosen upgrade after level-up */
  sendUpgradeChoice(upgradeId: string) {
    if (!this.room) return
    this.room.send('upgrade-chosen', { upgradeId })
  }

  /** Request to revive a downed player */
  sendRevive(targetId: string) {
    if (!this.room) return
    this.room.send('revive', { targetId })
  }

  /** Leave the room */
  leave() {
    if (this.room) {
      this.room.leave()
      this.room = null
    }
    this._connected = false
    this._isHost = false
    this._sessionId = ''
  }

  /** Disconnect from server entirely */
  disconnect() {
    this.leave()
    this.client = null
  }

  // ─── Internal ─────────────────────────────────────────────

  private setupRoomListeners() {
    if (!this.room) return

    // State changes (auto-delta patches from Colyseus)
    this.room.onStateChange((state) => {
      this.callbacks.onStateChange?.(state)
    })

    // Lobby events
    this.room.onMessage('player-joined', (data) => {
      // First player to join is host
      if (!this._isHost && data.slot === 0 && data.playerId === this._sessionId) {
        this._isHost = true
      }
      this.callbacks.onPlayerJoined?.(data)
    })

    this.room.onMessage('player-left', (data) => {
      this.callbacks.onPlayerLeft?.(data)
    })

    this.room.onMessage('hero-taken', (data) => {
      this.callbacks.onHeroTaken?.(data)
    })

    this.room.onMessage('game-start', (data) => {
      this.callbacks.onGameStart?.(data)
    })

    // In-game events
    this.room.onMessage('level-up', (data) => {
      this.callbacks.onLevelUp?.(data)
    })

    this.room.onMessage('player-attack', (data) => {
      this.callbacks.onPlayerAttack?.(data)
    })

    this.room.onMessage('enemy-killed', (data) => {
      this.callbacks.onEnemyKilled?.(data)
    })

    this.room.onMessage('player-downed', (data) => {
      this.callbacks.onPlayerDowned?.(data)
    })

    this.room.onMessage('player-revived', (data) => {
      this.callbacks.onPlayerRevived?.(data)
    })

    this.room.onMessage('upgrade-applied', (data) => {
      this.callbacks.onUpgradeApplied?.(data)
    })

    this.room.onMessage('game-over', (data) => {
      this.callbacks.onGameOver?.(data)
    })

    this.room.onMessage('game-won', (data) => {
      this.callbacks.onGameWon?.(data)
    })

    this.room.onMessage('claws-incoming', () => {
      this.callbacks.onClawsIncoming?.()
    })

    // Room error
    this.room.onError((code, message) => {
      console.error(`[NetworkManager] Room error: ${code} — ${message}`)
      this.callbacks.onError?.(code, message ?? '')
    })

    // Room leave
    this.room.onLeave((code) => {
      console.log(`[NetworkManager] Left room: code ${code}`)
      this._connected = false
      this.callbacks.onLeave?.(code)
    })
  }
}

// Singleton
export const networkManager = new NetworkManager()
