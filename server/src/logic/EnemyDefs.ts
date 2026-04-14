// Enemy stat definitions — mirrors client-side constructors
// Used by server to create authoritative enemy state

export interface EnemyDef {
  type: string
  baseHp: number
  hpPerWave: number
  baseSpeed: number
  speedPerWave: number
  damage: number
  xpBase: number
  xpPerWaves: number // xpBase + floor(wave / xpPerWaves)
  isLarge?: boolean
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  orc0: {
    type: 'orc0',
    baseHp: 20, hpPerWave: 2,
    baseSpeed: 90, speedPerWave: 4,
    damage: 8, xpBase: 5, xpPerWaves: 4,
  },
  orc1: {
    type: 'orc1',
    baseHp: 30, hpPerWave: 3,
    baseSpeed: 140, speedPerWave: 8,
    damage: 8, xpBase: 8, xpPerWaves: 3,
  },
  orc2: {
    type: 'orc2',
    baseHp: 45, hpPerWave: 5,
    baseSpeed: 80, speedPerWave: 4,
    damage: 8, xpBase: 8, xpPerWaves: 3,
  },
  orc3: {
    type: 'orc3',
    baseHp: 70, hpPerWave: 7,
    baseSpeed: 65, speedPerWave: 3,
    damage: 8, xpBase: 12, xpPerWaves: 3,
  },
  flyingeye: {
    type: 'flyingeye',
    baseHp: 20, hpPerWave: 2,
    baseSpeed: 130, speedPerWave: 7,
    damage: 8, xpBase: 12, xpPerWaves: 3,
  },
  flyingeye_boss: {
    type: 'flyingeye',
    baseHp: 150, hpPerWave: 10,
    baseSpeed: 80, speedPerWave: 4,
    damage: 12, xpBase: 25, xpPerWaves: 2,
    isLarge: true,
  },
  sandgolem: {
    type: 'sandgolem',
    baseHp: 180, hpPerWave: 12,
    baseSpeed: 45, speedPerWave: 2,
    damage: 15, xpBase: 25, xpPerWaves: 2,
    isLarge: true,
  },
}

// Zone spawn tables — weights (same as client WaveManager)
export interface SpawnEntry { type: string; weight: number }

export const ZONE_SPAWNS: Record<number, SpawnEntry[]> = {
  0: [{ type: 'orc0', weight: 50 }, { type: 'orc1', weight: 30 }, { type: 'orc2', weight: 20 }],
  1: [{ type: 'orc0', weight: 35 }, { type: 'orc1', weight: 35 }, { type: 'orc2', weight: 30 }],
  2: [{ type: 'orc3', weight: 30 }, { type: 'flyingeye', weight: 25 }, { type: 'orc1', weight: 25 }, { type: 'orc2', weight: 20 }],
  3: [{ type: 'orc3', weight: 35 }, { type: 'flyingeye', weight: 25 }, { type: 'orc1', weight: 25 }, { type: 'orc2', weight: 15 }],
  4: [{ type: 'orc3', weight: 40 }, { type: 'flyingeye', weight: 30 }, { type: 'orc1', weight: 20 }, { type: 'orc2', weight: 10 }],
}

export const ZONE_SPAWN_TOTALS: Record<number, number> = {}
for (const [zone, entries] of Object.entries(ZONE_SPAWNS)) {
  ZONE_SPAWN_TOTALS[Number(zone)] = entries.reduce((s, e) => s + e.weight, 0)
}

export function pickWeightedType(zone: number): string {
  const z = Math.min(zone, 4)
  const entries = ZONE_SPAWNS[z] ?? ZONE_SPAWNS[4]
  const total = ZONE_SPAWN_TOTALS[z] ?? ZONE_SPAWN_TOTALS[4]
  let roll = Math.random() * total
  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry.type
  }
  return entries[entries.length - 1].type
}
