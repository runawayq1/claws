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

  // ── Tutorial / Hero Unlock ──────────────────────────────────
  // Heroes the player has unlocked. Default: ['amun'] on fresh save.
  unlockedHeroes: string[]
  // True once the Amun tutorial (Run 1 quest trio) is fully complete.
  tutorialComplete: boolean
  // Per-hero branch unlocks. Shape: { amun: ['Wrath', 'Bastion', 'Quake'] }
  // Missing key = hero not yet played; treat as "only free branches available".
  unlockedBranches: Partial<Record<string, string[]>>
  // Accumulated cross-run branch progress counters (reserved for future heroes).
  branchProgress: Partial<Record<string, Partial<Record<string, number>>>>
  // Persistently completed quest IDs (survive across runs/deaths).
  completedQuests: string[]
  // Most recently selected hero for a run — shown as a "last played" dot in HeroSelect.
  lastHero?: string
}

// ── Quest system ──────────────────────────────────────────────
// A QuestDef describes a single tutorial/unlock quest. Progress lives in
// MetaData so it persists across runs (though Run 1 quests are checked
// in-run and complete within the same run).
export interface QuestDef {
  id: string
  title: string
  description: string
  goal: number
  /** Called when the quest completes. Receives the MetaData so it can mutate it. */
  onComplete: (meta: MetaData) => void
}

// The three Run-1 tutorial quests. Ordered by typical completion time.
export const RUN1_QUESTS: QuestDef[] = [
  {
    id: 'q_forged_in_battle',
    title: 'Forged in Battle',
    description: 'Kill 100 enemies',
    goal: 100,
    onComplete: (meta) => {
      // Unlock Amun's Bastion branch — add it if not already present
      const branches = meta.unlockedBranches['amun'] || ['Wrath']
      if (!branches.includes('Bastion')) branches.push('Bastion')
      meta.unlockedBranches['amun'] = branches
    },
  },
  {
    id: 'q_the_long_watch',
    title: 'The Long Watch',
    description: 'Survive 150 seconds',
    goal: 150_000, // ms
    onComplete: (meta) => {
      // Unlock Amun's Quake branch
      const branches = meta.unlockedBranches['amun'] || ['Wrath']
      if (!branches.includes('Quake')) branches.push('Quake')
      meta.unlockedBranches['amun'] = branches
    },
  },
  {
    id: 'q_find_sifra',
    title: 'Find Sifra',
    description: 'Find Sifra in the wastes',
    goal: 1,
    onComplete: (meta) => {
      // Unlock Sifra
      if (!meta.unlockedHeroes.includes('sifra')) {
        meta.unlockedHeroes.push('sifra')
      }
      meta.tutorialComplete = true
    },
  },
]

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
const HEROES = ['ignara', 'nazar', 'sifra', 'amun', 'huntress', 'khashin', 'muller', 'vael']

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
      // Tutorial / unlock defaults
      unlockedHeroes: ['amun', 'vael', 'nightborne'],
      tutorialComplete: false,
      unlockedBranches: { amun: ['Wrath'] },
      branchProgress: {},
      completedQuests: [],
      lastHero: undefined,
    }
  }

  static load(): MetaData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return MetaProgress.defaultData()
      const data = JSON.parse(raw) as MetaData
      // ── One-time tutorial reset migration (runs once per browser) ──
      // Wipes Sifra unlock + branch unlocks so new players must complete
      // Amun's tutorial to unlock Sifra. Bumped to v2 to re-run for existing
      // players who had Sifra auto-unlocked by prior stale saves.
      const RESET_FLAG = 'claws_tutorial_reset_v2'
      if (!localStorage.getItem(RESET_FLAG)) {
        data.tutorialComplete = false
        data.unlockedHeroes = ['amun']
        data.unlockedBranches = { amun: ['Wrath'] }
        localStorage.setItem(RESET_FLAG, '1')
      }
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
      // Migrate old saves missing tutorial/unlock fields
      if (!data.unlockedHeroes) data.unlockedHeroes = ['amun']
      if (data.tutorialComplete === undefined) data.tutorialComplete = false
      if (!data.unlockedBranches) data.unlockedBranches = { amun: ['Wrath'] }
      if (!data.branchProgress) data.branchProgress = {}
      // Migrate old saves missing completedQuests
      if (!data.completedQuests) data.completedQuests = []
      // Migrate old saves missing lastHero (optional field)
      if (data.lastHero === undefined) data.lastHero = undefined
      // Nightborne + Vael are default-unlocked
      if (!data.unlockedHeroes.includes('nightborne')) data.unlockedHeroes.push('nightborne')
      if (!data.unlockedHeroes.includes('vael')) data.unlockedHeroes.push('vael')
      // Back-compat: if tutorial is done but sifra not in unlockedHeroes, add it
      if (data.tutorialComplete && !data.unlockedHeroes.includes('sifra')) {
        data.unlockedHeroes.push('sifra')
      }
      // Back-compat: if tutorial is done but Amun branches incomplete, add them all
      if (data.tutorialComplete) {
        const ab = data.unlockedBranches['amun'] || []
        for (const b of ['Wrath', 'Bastion', 'Quake']) {
          if (!ab.includes(b)) ab.push(b)
        }
        data.unlockedBranches['amun'] = ab
      }
      // Test account: "Ori" has all heroes + branches unlocked + tutorial complete
      if (localStorage.getItem('claws_player_name') === 'Ori') {
        data.tutorialComplete = true
        const allHeroes = ['amun', 'sifra', 'ignara', 'nazar', 'khashin', 'huntress', 'muller', 'nightborne', 'vael']
        for (const h of allHeroes) {
          if (!data.unlockedHeroes.includes(h)) data.unlockedHeroes.push(h)
        }
        data.unlockedBranches['amun'] = ['Wrath', 'Bastion', 'Quake']
        if (data.goldTotal < 10000) data.goldTotal = 10000
      }
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
    const meta = MetaProgress._getMeta()
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

  // ============================================================
  // HERO / BRANCH UNLOCK API
  // ============================================================

  static isHeroUnlocked(heroType: string): boolean {
    const meta = MetaProgress.load()
    return meta.unlockedHeroes.includes(heroType)
  }

  static unlockHero(heroType: string): void {
    const meta = MetaProgress.load()
    if (!meta.unlockedHeroes.includes(heroType)) {
      meta.unlockedHeroes.push(heroType)
      MetaProgress.save(meta)
    }
  }

  /** Records the most recent hero the player started a run with (for HeroSelect "last played" indicator). */
  static setLastHero(heroType: string): void {
    const meta = MetaProgress.load()
    meta.lastHero = heroType
    MetaProgress.save(meta)
  }

  /**
   * Check post-run hero unlock conditions (ignara, nazar, khashin).
   * Must be called AFTER recordSession() so meta totals are up-to-date.
   * Returns list of newly unlocked hero type strings.
   */
  static checkPostRunUnlocks(session: SessionRecord): string[] {
    const meta = MetaProgress.load()
    const newlyUnlocked: string[] = []

    const tryUnlock = (heroType: string, condition: boolean) => {
      if (condition && !meta.unlockedHeroes.includes(heroType)) {
        meta.unlockedHeroes.push(heroType)
        newlyUnlocked.push(heroType)
      }
    }

    // Ignara: complete 3 runs (any hero, any outcome)
    tryUnlock('ignara', meta.totalRuns >= 3)

    // Nazar: win at least 1 run (any hero)
    tryUnlock('nazar', meta.totalWins >= 1)

    // Khashin: survive 8 minutes as Sifra
    tryUnlock('khashin', session.hero === 'sifra' && session.timeMs >= 480_000)

    if (newlyUnlocked.length > 0) {
      MetaProgress.save(meta)
    }

    return newlyUnlocked
  }

  /**
   * Returns the set of unlocked branch names for a hero.
   * If the tutorial is complete, Amun always gets all three branches.
   * For heroes with no entry yet, returns their default free branches.
   */
  static getUnlockedBranches(heroType: string): string[] {
    const meta = MetaProgress.load()
    if (heroType === 'amun') {
      if (meta.tutorialComplete) return ['Wrath', 'Bastion', 'Quake']
      return meta.unlockedBranches['amun'] || ['Wrath']
    }
    // All other heroes: all branches free (future gating can be added here)
    return meta.unlockedBranches[heroType] || ['__all__']
  }

  static isBranchUnlocked(heroType: string, branchName: string): boolean {
    const unlocked = MetaProgress.getUnlockedBranches(heroType)
    return unlocked.includes('__all__') || unlocked.includes(branchName)
  }

  static unlockBranch(heroType: string, branchName: string): void {
    const meta = MetaProgress.load()
    const branches = meta.unlockedBranches[heroType] || []
    if (!branches.includes(branchName)) {
      branches.push(branchName)
      meta.unlockedBranches[heroType] = branches
      MetaProgress.save(meta)
    }
  }

  // ============================================================
  // RUN-1 QUEST API (in-memory runtime state + persistence)
  // ============================================================

  /**
   * Per-run in-memory quest state. Reset each time a run starts via initRun().
   * We track kills/time in-memory to avoid hammering localStorage on every frame.
   * Progress is committed to localStorage only when a quest completes or the run ends.
   */
  private static _runHero: string = ''
  private static _runKills: number = 0
  private static _runTimeMs: number = 0
  private static _runEnded: boolean = false
  // Which quests have already fired their onComplete this run (prevent double-fire)
  private static _completedThisRun: Set<string> = new Set()
  // Snapshot of quests already completed at run start (prior runs).
  // Used by getActiveQuests() to filter out quests completed in earlier runs
  // while keeping this-run completions visible in the side panel as "DONE".
  private static _priorRunCompleted: Set<string> = new Set()
  // Callbacks that UIScene registers to be notified when a quest completes mid-run
  private static _onQuestComplete: ((questId: string, meta: MetaData) => void)[] = []

  // In-memory cache of MetaData for the duration of a run. Populated in
  // initRun() and nulled in reportRunEnded(). Hot paths that fire on every
  // kill or every second (_checkQuestProgress, getActiveQuests, etc.) read
  // this instead of doing a full localStorage parse each call.
  private static _runMeta: MetaData | null = null

  /** Returns the run-scoped meta cache if active, otherwise loads fresh from storage. */
  private static _getMeta(): MetaData {
    return MetaProgress._runMeta ?? MetaProgress.load()
  }

  /** Call at the start of each run (before first reportKill / reportTimeMs). */
  static initRun(heroType: string): void {
    MetaProgress._runHero = heroType
    MetaProgress._runKills = 0
    MetaProgress._runTimeMs = 0
    MetaProgress._runEnded = false
    MetaProgress._sifraFound = false
    // Tag most-recent hero for HeroSelect "last played" indicator
    MetaProgress.setLastHero(heroType)
    // Seed from persistent completed quests so already-done quests don't re-fire
    const meta = MetaProgress.load()
    MetaProgress._runMeta = meta
    MetaProgress._completedThisRun = new Set(meta.completedQuests)
    MetaProgress._priorRunCompleted = new Set(meta.completedQuests)
    MetaProgress._onQuestComplete = []  // defensive: prevent stale callbacks across re-runs
  }

  /** Register a callback that fires when a quest completes mid-run. */
  static onQuestComplete(cb: (questId: string, meta: MetaData) => void): void {
    MetaProgress._onQuestComplete.push(cb)
  }

  /** Remove all mid-run quest-complete callbacks (call on scene shutdown). */
  static clearQuestCallbacks(): void {
    MetaProgress._onQuestComplete = []
  }

  /** Called by GameScene's enemy-died handler. Increments kill count and checks quests. */
  static reportKill(): void {
    if (MetaProgress._runHero !== 'amun') return  // only Amun has gated quests right now
    MetaProgress._runKills++
    MetaProgress._checkQuestProgress()
  }

  /**
   * Called once per second from UIScene's update loop (not every frame).
   * @param ms  Current gameTime in milliseconds.
   */
  static reportTimeMs(ms: number): void {
    if (MetaProgress._runHero !== 'amun') return
    MetaProgress._runTimeMs = ms
    MetaProgress._checkQuestProgress()
  }

  /**
   * Called by UIScene's showEndScreen (run ended — either death or win).
   * Returns list of quest IDs that completed at run-end.
   * Note: q_find_sifra only completes via reportSifraFound — not at run-end.
   */
  static reportRunEnded(_won: boolean, _heroType: string): string[] {
    if (MetaProgress._runEnded) return []
    MetaProgress._runEnded = true
    // Drop the run-scoped cache so subsequent loads (recordSession, menus)
    // read fresh state from storage.
    MetaProgress._runMeta = null
    return []
  }

  /** Returns true if the quest has been persistently completed (survived across runs). */
  static isQuestPersistentlyComplete(questId: string): boolean {
    const meta = MetaProgress._getMeta()
    return meta.completedQuests.includes(questId)
  }

  /** Returns quests that are active (tutorial not yet complete and player is Amun).
   * Filters out quests completed in a PRIOR run (snapshotted at initRun) so they
   * don't clutter the side quest panel on subsequent runs, while keeping this-run
   * completions visible as a "DONE" row until the run ends. */
  static getActiveQuests(): QuestDef[] {
    const meta = MetaProgress._getMeta()
    if (meta.tutorialComplete) return []
    if (MetaProgress._runHero !== 'amun') return []
    return RUN1_QUESTS.filter(q => !MetaProgress._priorRunCompleted.has(q.id))
  }

  /** Returns current progress value for a given quest id (in-run, not persisted). */
  static getQuestProgress(questId: string): number {
    if (questId === 'q_forged_in_battle') return MetaProgress._runKills
    if (questId === 'q_the_long_watch')   return MetaProgress._runTimeMs
    if (questId === 'q_find_sifra')       return MetaProgress._sifraFound ? 1 : 0
    return 0
  }

  /** In-memory flag set when the player finds Sifra this run. */
  private static _sifraFound = false

  /**
   * Called by GameScene when the player walks within range of the Sifra NPC.
   * Completes the q_find_sifra quest and fires callbacks.
   */
  static reportSifraFound(): void {
    if (MetaProgress._runHero !== 'amun') return
    if (MetaProgress._sifraFound) return
    MetaProgress._sifraFound = true
    MetaProgress._checkQuestProgress()
  }

  /** Internal: check all in-flight quests and fire callbacks on completion. */
  private static _checkQuestProgress(): void {
    const meta = MetaProgress._getMeta()
    if (meta.tutorialComplete) return

    const toCheck = RUN1_QUESTS

    for (const quest of toCheck) {
      if (MetaProgress._completedThisRun.has(quest.id)) continue
      const progress = MetaProgress.getQuestProgress(quest.id)
      if (progress >= quest.goal) {
        MetaProgress._completedThisRun.add(quest.id)
        quest.onComplete(meta)
        // Persist completion so subsequent runs know this quest is already done
        if (!meta.completedQuests.includes(quest.id)) {
          meta.completedQuests.push(quest.id)
        }
        MetaProgress.save(meta)
        // Notify UIScene (and any other listener)
        for (const cb of MetaProgress._onQuestComplete) cb(quest.id, meta)
      }
    }
  }
}
