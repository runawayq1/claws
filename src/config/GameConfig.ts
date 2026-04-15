// Note: not `as const` — CHUNK_SIZE/CHUNK_TILES are sized to the viewport in
// main.ts before scenes start, so the 3x3 chunk grid always covers the canvas.
export const CONFIG = {
  WORLD_WIDTH: 3000,
  WORLD_HEIGHT: 3000,

  // Player
  PLAYER_HP: 100,
  PLAYER_SPEED: 160,
  PLAYER_DAMAGE: 25,
  PLAYER_RANGE: 120,
  PLAYER_ATTACK_CD: 800,
  PLAYER_HP_REGEN: 0,

  // Sprite info (64x64 frames, 4 direction rows)
  FRAME_WIDTH: 64,
  FRAME_HEIGHT: 64,
  SPRITE_COLS_IDLE: 12,
  SPRITE_COLS_RUN: 8,
  SPRITE_COLS_ATTACK: 8,
  SPRITE_COLS_DEATH: 7,
  SPRITE_COLS_HURT: 5,
  // Row 2 = facing down (toward camera) — best for top-down view
  SPRITE_DIR_ROW: 2,

  // XP — easy early levels, quadratic ramp after level 5 (see Player.xpToNextLevel)
  XP_BASE: 60,
  XP_PER_LEVEL: 35,

  // Zergling / Orc
  ZERGLING_BASE_HP: 40,
  ZERGLING_BASE_SPEED: 90,
  ZERGLING_DAMAGE: 8, // per second
  ZERGLING_XP: 10,

  // Spawning (continuous, no waves)
  SPAWN_RADIUS: 600,
  RUN_DURATION: 600000, // 10 minutes in ms

  // Mob cap — like Vampire Survivors, limits alive enemies on screen
  MOB_CAP_BASE: 20,       // starting cap at wave 1
  MOB_CAP_PER_WAVE: 12,   // +12 per wave tier
  MOB_CAP_MAX: 200,        // hard ceiling

  // Minimap
  MINIMAP_SIZE: 140,
  MINIMAP_MARGIN: 10,
  MINIMAP_WORLD_RADIUS: 1200,

  // Chunks (infinite map)
  CHUNK_SIZE: 960,
  CHUNK_TILES: 15,

  // Terrain — grass meadow
  TILE_SIZE: 64,
  TILE_COLOR_1: 0xd4b483,  // warm sand
  TILE_COLOR_2: 0xc9a86c,  // darker sand
  TILE_SPECKLE: 0xb8956a,  // speckle dots

  // Gold drops
  GOLD_MOB_CHANCE: 0.35,
  GOLD_MOB_MIN: 1,
  GOLD_MOB_MAX: 3,
  GOLD_BOSS_MIN: 5,
  GOLD_BOSS_MAX: 10,
}
