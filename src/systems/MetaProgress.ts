const STORAGE_KEY = 'claws_meta'

export interface SessionRecord {
  id: number
  hero: string
  kills: number
  level: number
  timeMs: number
  wave: number
  won: boolean
  tookDamage: boolean
  date: string
  upgrades: string[]
  goldEarned: number
}

export interface AchievementDef {
  id: string
  name: string
  desc: string
  category: 'kills' | 'survival' | 'hero' | 'progression' | 'wave' | 'secret'
  check: (meta: MetaData, lastSession?: SessionRecord) => boolean
}

export interface AchievementState {
  id: string
  unlocked: boolean
  unlockedAt?: string
}

export interface MetaData {
  totalKills: number
  totalRuns: number
  totalTimeMs: number
  totalWins: number
  bestKills: number
  bestWave: number
  bestTime: number
  heroRuns: Record<string, number>
  heroWins: Record<string, number>
  sessions: SessionRecord[]
  achievements: AchievementState[]
  goldTotal: number
  goldEarned: number
  metaUpgrades: Record<string, number>
}

// ============================================================
// META-UPGRADE DEFINITIONS
// ============================================================
export interface MetaUpgradeDef {
  id: string
  label: string
  desc: string
  maxTier: number
  costs: number[]
  perTier: number
  icon: string
}

// Gold economy targets (100h to max all):
// Average raid (5 min): ~300 mob kills × 35% drop = 105 mob gold
//                       + ~10 mini-bosses × avg 7.5 = 75 boss gold = ~180 gold/raid
// 100 hours = 1200 raids × 180 = ~216,000 total gold budget
// 5 upgrades × 5 tiers, costs scale sharply: T1≈100, T2≈400, T3≈1500, T4≈6000, T5≈35000
// Total sum: ~215,000 gold — aligns with 100h budget
// Early tiers (T1+T2) reachable within first ~10 raids (~1h)
export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: 'mu_hp',    label: 'Iron Constitution', desc: '+20 Max HP per tier',       maxTier: 5, costs: [100,  400,  1500,  6000, 34000], perTier: 20,   icon: 'hp' },
  { id: 'mu_dmg',   label: 'Sharpened Claws',   desc: '+3 Damage per tier',        maxTier: 5, costs: [120,  450,  1600,  6500, 36000], perTier: 3,    icon: 'dmg' },
  { id: 'mu_spd',   label: "Wanderer's Boots",  desc: '+8 Speed per tier',         maxTier: 5, costs: [ 80,  350,  1400,  5500, 33000], perTier: 8,    icon: 'spd' },
  { id: 'mu_regen', label: 'Blood Mender',       desc: '+0.5 HP Regen/s per tier', maxTier: 5, costs: [100,  400,  1500,  6000, 34000], perTier: 0.5,  icon: 'regen' },
  { id: 'mu_cd',    label: 'Honed Reflexes',     desc: '-8% Attack CD per tier',   maxTier: 5, costs: [150,  500,  1800,  7500, 38000], perTier: 0.08, icon: 'cd' },
]

// ============================================================
// ACHIEVEMENT DEFINITIONS (25 total)
// ============================================================
const HEROES = ['ignara', 'nazar', 'sifra', 'amun', 'huntress', 'khashin', 'muller']

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // --- Kill milestones ---
  { id: 'kill_100',     name: 'First Blood',     desc: '100 total kills',              category: 'kills',    check: m => m.totalKills >= 100 },
  { id: 'kill_500',     name: 'Slayer',           desc: '500 total kills',              category: 'kills',    check: m => m.totalKills >= 500 },
  { id: 'kill_2000',    name: 'Annihilator',      desc: '2000 total kills',             category: 'kills',    check: m => m.totalKills >= 2000 },
  { id: 'kill_50_run',  name: 'Massacre',          desc: '50 kills in one run',         category: 'kills',    check: (_m, s) => !!s && s.kills >= 50 },
  { id: 'kill_150_run', name: 'Carnage',           desc: '150 kills in one run',        category: 'kills',    check: (_m, s) => !!s && s.kills >= 150 },

  // --- Survival ---
  { id: 'survive_3m',   name: 'Survivor',          desc: 'Survive 3 minutes',           category: 'survival', check: (_m, s) => !!s && s.timeMs >= 180_000 },
  { id: 'survive_5m',   name: 'Endurance',          desc: 'Survive 5 minutes',          category: 'survival', check: (_m, s) => !!s && s.timeMs >= 300_000 },
  { id: 'survive_10m',  name: 'Immortal',           desc: 'Survive full 10 minutes',    category: 'survival', check: (_m, s) => !!s && s.won },
  { id: 'win_3',        name: 'Veteran',             desc: 'Win 3 runs',                category: 'survival', check: m => m.totalWins >= 3 },
  { id: 'win_10',       name: 'Legend',              desc: 'Win 10 runs',               category: 'survival', check: m => m.totalWins >= 10 },

  // --- Hero mastery ---
  { id: 'play_all',     name: 'Roster Call',         desc: 'Play with every hero',      category: 'hero', check: m => HEROES.every(h => (m.heroRuns[h] || 0) >= 1) },
  { id: 'win_ignara',   name: 'Fire Sovereign',      desc: 'Win with Ignara',           category: 'hero', check: m => (m.heroWins['ignara'] || 0) >= 1 },
  { id: 'win_nazar',    name: 'Shadow Master',        desc: 'Win with Nazar',           category: 'hero', check: m => (m.heroWins['nazar'] || 0) >= 1 },
  { id: 'win_sifra',    name: 'Ice Queen',            desc: 'Win with Sifra',           category: 'hero', check: m => (m.heroWins['sifra'] || 0) >= 1 },
  { id: 'win_amun',     name: 'Guardian King',        desc: 'Win with Amun',            category: 'hero', check: m => (m.heroWins['amun'] || 0) >= 1 },
  { id: 'win_huntress', name: 'Apex Predator',        desc: 'Win with Huntress',        category: 'hero', check: m => (m.heroWins['huntress'] || 0) >= 1 },
  { id: 'win_khashin',  name: 'Scarab Lord',          desc: 'Win with Khashin',         category: 'hero', check: m => (m.heroWins['khashin'] || 0) >= 1 },
  { id: 'win_muller',   name: 'Iron Giant',           desc: 'Win with Muller',          category: 'hero', check: m => (m.heroWins['muller'] || 0) >= 1 },
  { id: 'win_all',      name: 'True Champion',        desc: 'Win with every hero',      category: 'hero', check: m => HEROES.every(h => (m.heroWins[h] || 0) >= 1) },

  // --- Progression ---
  { id: 'level_5',      name: 'Growing Power',        desc: 'Reach level 5 in a run',   category: 'progression', check: (_m, s) => !!s && s.level >= 5 },
  { id: 'level_10',     name: 'Ascendant',            desc: 'Reach level 10 in a run',  category: 'progression', check: (_m, s) => !!s && s.level >= 10 },
  { id: 'branch_max',   name: 'Specialist',           desc: 'Max a hero branch (5/5)',  category: 'progression', check: (_m, s) => {
    if (!s) return false
    // Count upgrade prefixes: if5, nv5, etc. — if any branch has 5 picks
    const prefixes: Record<string, number> = {}
    for (const u of s.upgrades) {
      const prefix = u.replace(/\d+$/, '').replace(/_.*/, '')
      if (prefix.length === 2) prefixes[prefix] = (prefixes[prefix] || 0) + 1
    }
    return Object.values(prefixes).some(c => c >= 5)
  }},
  { id: 'runs_10',      name: 'Dedicated',            desc: 'Complete 10 runs',         category: 'progression', check: m => m.totalRuns >= 10 },
  { id: 'runs_50',      name: 'Addicted',             desc: 'Complete 50 runs',         category: 'progression', check: m => m.totalRuns >= 50 },

  // --- Wave/Tier ---
  { id: 'wave_5',       name: 'Wave Rider',            desc: 'Reach wave tier 5',       category: 'wave', check: m => m.bestWave >= 5 },
  { id: 'wave_10',      name: 'Tsunami',               desc: 'Reach wave tier 10',      category: 'wave', check: m => m.bestWave >= 10 },
  { id: 'wave_20',      name: 'Unstoppable',           desc: 'Reach wave tier 20',      category: 'wave', check: m => m.bestWave >= 20 },

  // --- Secret ---
  { id: 'speed_kill',   name: 'Speed Demon',           desc: '50 kills in first 2 min', category: 'secret', check: (_m, s) => !!s && s.kills >= 50 && s.timeMs <= 120_000 },
  { id: 'no_damage',    name: 'Untouchable',           desc: 'Win a run without taking damage', category: 'secret', check: (_m, s) => !!s && s.won && !s.tookDamage },
]

// ============================================================
// META PROGRESS CLASS
// ============================================================
export class MetaProgress {
  static defaultData(): MetaData {
    return {
      totalKills: 0, totalRuns: 0, totalTimeMs: 0, totalWins: 0,
      bestKills: 0, bestWave: 0, bestTime: 0,
      heroRuns: {}, heroWins: {},
      sessions: [],
      achievements: ACHIEVEMENT_DEFS.map(a => ({ id: a.id, unlocked: false })),
      goldTotal: 0,
      goldEarned: 0,
      metaUpgrades: {},
    }
  }

  static load(): MetaData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return MetaProgress.defaultData()
      const data = JSON.parse(raw) as MetaData
      // Ensure new achievements are included
      for (const def of ACHIEVEMENT_DEFS) {
        if (!data.achievements.find(a => a.id === def.id)) {
          data.achievements.push({ id: def.id, unlocked: false })
        }
      }
      // Migrate old saves missing gold fields
      if (data.goldTotal === undefined) data.goldTotal = 0
      if (data.goldEarned === undefined) data.goldEarned = 0
      if (!data.metaUpgrades) data.metaUpgrades = {}
      return data
    } catch {
      return MetaProgress.defaultData()
    }
  }

  static save(data: MetaData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch { /* storage full — silently fail */ }
  }

  static recordSession(session: SessionRecord): MetaData {
    const meta = MetaProgress.load()

    // Update totals
    meta.totalKills += session.kills
    meta.totalRuns += 1
    meta.totalTimeMs += session.timeMs
    if (session.won) meta.totalWins += 1

    // Best records
    meta.bestKills = Math.max(meta.bestKills, session.kills)
    meta.bestWave = Math.max(meta.bestWave, session.wave)
    meta.bestTime = Math.max(meta.bestTime, session.timeMs)

    // Hero stats
    meta.heroRuns[session.hero] = (meta.heroRuns[session.hero] || 0) + 1
    if (session.won) {
      meta.heroWins[session.hero] = (meta.heroWins[session.hero] || 0) + 1
    }

    // Gold accumulation (minimum 5 per run for progression feel)
    const earnedGold = Math.max(session.goldEarned || 0, 5)
    meta.goldTotal += earnedGold
    meta.goldEarned += earnedGold

    // Add session (keep last 20)
    session.id = meta.totalRuns
    meta.sessions.unshift(session)
    if (meta.sessions.length > 20) meta.sessions.length = 20

    MetaProgress.save(meta)
    return meta
  }

  /** Check all achievements, return newly unlocked IDs */
  static checkAchievements(lastSession?: SessionRecord): string[] {
    const meta = MetaProgress.load()
    const newlyUnlocked: string[] = []

    for (const def of ACHIEVEMENT_DEFS) {
      const state = meta.achievements.find(a => a.id === def.id)
      if (!state || state.unlocked) continue

      if (def.check(meta, lastSession)) {
        state.unlocked = true
        state.unlockedAt = new Date().toISOString()
        newlyUnlocked.push(def.id)
      }
    }

    if (newlyUnlocked.length > 0) {
      MetaProgress.save(meta)
    }

    return newlyUnlocked
  }

  static getAchievementDefs(): AchievementDef[] {
    return ACHIEVEMENT_DEFS
  }

  static getUnlockedCount(): { unlocked: number; total: number } {
    const meta = MetaProgress.load()
    const unlocked = meta.achievements.filter(a => a.unlocked).length
    return { unlocked, total: ACHIEVEMENT_DEFS.length }
  }
}
