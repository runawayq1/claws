// Server-side game config — mirrors key values from client CONFIG
export const SERVER_CONFIG = {
  WORLD_WIDTH: 3000,
  WORLD_HEIGHT: 3000,

  // Player defaults
  PLAYER_HP: 100,
  PLAYER_SPEED: 160,
  PLAYER_DAMAGE: 25,
  PLAYER_RANGE: 120,
  PLAYER_ATTACK_CD: 800,

  // XP curve
  XP_BASE: 120,
  XP_PER_LEVEL: 55,

  // Spawning
  RUN_DURATION: 600_000, // 10 minutes
  MOB_CAP_BASE: 20,
  MOB_CAP_PER_WAVE: 12,
  MOB_CAP_MAX: 200,

  // Gold
  GOLD_MOB_CHANCE: 0.35,
  GOLD_MOB_MIN: 1,
  GOLD_MOB_MAX: 3,
  GOLD_BOSS_MIN: 5,
  GOLD_BOSS_MAX: 10,

  // Multiplayer scaling
  mobCapMultiplier: (n: number) => 1 + (n - 1) * 0.6,
  hpMultiplier: (n: number) => 1 + (n - 1) * 0.4,
  dmgMultiplier: (n: number) => 1 + (n - 1) * 0.25,
  xpMultiplier: (n: number) => {
    const table: Record<number, number> = { 1: 1.0, 2: 0.9, 3: 0.8, 4: 0.7 }
    return table[n] ?? 0.7
  },

  // Tick
  TICK_RATE: 20, // Hz
  TICK_MS: 50,   // ms per tick

  // Lobby
  MAX_PLAYERS: 4,
  RECONNECT_TIMEOUT: 30, // seconds
}
