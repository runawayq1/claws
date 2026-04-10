import { Schema, type, MapSchema } from '@colyseus/schema'

export type HeroType = 'ignara' | 'sifra' | 'amun' | 'nazar' | 'huntress' | 'khashin' | 'muller'
export type EnemyType = 'orc0' | 'orc1' | 'orc2' | 'orc3' | 'flyingeye' | 'sandgolem'

export class PlayerState extends Schema {
  @type('string') id: string = ''
  @type('string') name: string = ''
  @type('string') heroType: string = 'ignara'
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') hp: number = 100
  @type('float32') maxHp: number = 100
  @type('uint8') level: number = 1
  @type('float32') xp: number = 0
  @type('float32') xpToNext: number = 120
  @type('float32') speed: number = 160
  @type('float32') damage: number = 25
  @type('boolean') isDowned: boolean = false
  @type('boolean') isDead: boolean = false
  @type('string') stance: string = 'default'
  // Input from client (not synced to others directly — server uses these)
  inputDx: number = 0
  inputDy: number = 0
  inputStance: boolean = false
  // Upgrades chosen (server-side tracking)
  upgrades: Record<string, number> = {}
}

export class EnemyState extends Schema {
  @type('uint16') id: number = 0
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') hp: number = 40
  @type('float32') maxHp: number = 40
  @type('string') type: string = 'orc0'
  @type('uint8') tier: number = 1
  @type('float32') speed: number = 90
  @type('boolean') isMiniBoss: boolean = false
  @type('float32') targetX: number = 0
  @type('float32') targetY: number = 0
}

export class ProjectileState extends Schema {
  @type('uint16') id: number = 0
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') vx: number = 0
  @type('float32') vy: number = 0
  @type('string') type: string = ''
  @type('string') ownerId: string = ''
}

export class GameRoomState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
  @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>()
  @type('float32') elapsedMs: number = 0
  @type('uint8') wave: number = 0
  @type('float32') sharedGold: number = 0
  @type('uint32') seed: number = 0
  @type('string') status: string = 'waiting' // 'waiting' | 'playing' | 'ended'
  @type('uint8') playerCount: number = 0
}
