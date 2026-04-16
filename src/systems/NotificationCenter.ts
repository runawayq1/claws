/**
 * NotificationCenter — persistent in-game messages (patch notes, tips, events).
 * Stored in localStorage under 'claws_notifications'.
 */

export interface GameNotification {
  id: string
  title: string
  body: string
  icon?: string          // asset key (e.g. 'skill_icons' + frame, or path)
  iconFrame?: number
  image?: string         // full-size image asset key
  timestamp: number      // ms since epoch
  read: boolean
}

const STORAGE_KEY = 'claws_notifications'
// Per-seed flag prefix — each SEED entry is seeded at most once,
// keyed by its stable `seedId`. This lets us append new patch notes in
// future versions without re-delivering older ones.
const SEED_FLAG_PREFIX = 'claws_notif_seed_'

// Seed messages — delivered to every player's inbox exactly once per seedId.
// To add a new patch note in a future release, append a new entry with a
// unique `seedId` and keep the existing entries intact.
type SeedNotification = Omit<GameNotification, 'id' | 'timestamp' | 'read'> & { seedId: string }
const SEED_MESSAGES: SeedNotification[] = [
  {
    seedId: 'v0_5_vael_nightborne',
    title: 'v0.5 — Vael & Nightborne',
    body: [
      'Two new heroes joined the roster.',
      '',
      '• VAEL (Pale Doctor) — dual-stance necromancer. Orbs shoot Soul Bolts and drop armor-stacking bones. Drain stance channels green vampiric tendrils that heal you continuously.',
      '',
      '• NIGHTBORNE (Void Blade) — fast purple crescent melee with three branches: raw Void Blade damage, Phantom duplication, and Rift spatial manipulation.',
      '',
      'New assets:',
      '• Real spritesheets for both heroes + bone thrall minions',
      '• 27 new skill icons (Nazar + Vael + Ignara)',
      '',
      'Balance pass:',
      '• Sifra Frost Ice Armor nerfed (shield regen 3s → 5s)',
      '• Nazar Assassinate split: ×2 solo / ×1.5 with nearby enemies',
      '• Amun Bastion armor cap 70% → 60%',
      '• Huntress Marked Target +40% → +25%',
      '• Ignara Pyre lifesteal 4% → 2%',
      '',
      'UI refinement:',
      '• HP/energy block redesigned — thin pill-shaped energy bars above HP',
      '• Mastery stars replaced with rotating diamonds',
      '• Boss HP bar got a red 3-layer fill with vine/horn frame',
      '',
      'And many fixes: arrows blocked by rocks, Caesar cat portal rework, overkill guards, VFX pooling — see the full changelog in docs/sessions/.',
    ].join('\n'),
    iconFrame: 19,  // phoenix heart icon as placeholder
  },
  {
    seedId: 'v0_5_1_hero_popup_scene',
    title: 'v0.5.1 — Hero Select Overhaul',
    body: [
      'The hero-select screen got a full rework.',
      '',
      'NEW HERO POPUP',
      '• Clicking a hero now opens a detailed card: animated portrait in a gold-framed window, full stats with animated bars, combat stances, and three stance options.',
      '• Pick your starting stance BEFORE the run — no more level-1 branch picker. You start the run already specialized.',
      '• Each stance card shows its theme, icon, and a bold one-line bonus summary (e.g. Pyre: "Burn aura 25%/s · +45% damage · molten volley").',
      '• Cycle heroes from inside the popup: arrow buttons, keyboard Left/Right, or swipe on mobile.',
      '• Attack animation plays when you pick a stance (except Vael/Khashin/Muller who pulse instead).',
      '• Hero-themed ambient particles in the portrait frame — embers for Ignara, snow for Sifra, leaves for Lyra, void motes for Nightborne, etc.',
      '• Gold tracer runs around the portrait and the PLAY button, shine sweep on the selected card, staggered entry and close animations.',
      '',
      'HERO SELECT SCENE',
      '• Circle grid redesigned: 3×3 on desktop with bigger circles, 2-column on mobile.',
      '• Gold halo + per-hero accent stripe + idle breathe on every unlocked circle.',
      '• Locked heroes now reveal their unlock hint on hover (no more hunt-and-tap).',
      '• Gold dot marks your last-played hero.',
      '• Ambient drifting particles, staggered entry, restyled circular back button.',
      '',
      'COLOR PALETTE',
      '• All hero and branch colors moved to a Tailwind-inspired harmonized palette. In-game VFX, HUD, and level-up cards all match.',
      '',
      'TEXT CLEANUP',
      '• ~85 upgrade descriptions rewritten: "dmg" → "damage", "cd" → "cooldown", "20px blast" → "2m blast", "×1.6 proj" → "+60% projectile size", etc.',
      '',
      'ACCESSIBILITY & POLISH',
      '• Respects prefers-reduced-motion (loop animations stop, entry fades stay).',
      '• ESC / click-outside / X button all close the popup cleanly.',
      '• Keyboard: 1/2/3 pick stance, Enter plays, arrows cycle heroes.',
    ].join('\n'),
    iconFrame: 19,
  },
]

export class NotificationCenter {
  static load(): GameNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw) as GameNotification[]
    } catch {
      return []
    }
  }

  static save(notes: GameNotification[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch {}
  }

  /**
   * Call on game start — seeds any initial messages that haven't been
   * delivered yet. Each seed is gated on its own `seedId` flag, so new
   * patch notes added in later releases are delivered exactly once even
   * to players who've already seen earlier seeds.
   */
  static ensureSeeded() {
    try {
      const existing = NotificationCenter.load()
      let changed = false
      const now = Date.now()
      for (const seed of SEED_MESSAGES) {
        const flagKey = `${SEED_FLAG_PREFIX}${seed.seedId}`
        if (localStorage.getItem(flagKey)) continue
        const { seedId: _seedId, ...rest } = seed
        existing.unshift({
          id: `seed_${seed.seedId}_${now}`,
          timestamp: now,
          read: false,
          ...rest,
        })
        localStorage.setItem(flagKey, '1')
        changed = true
      }
      if (changed) NotificationCenter.save(existing.slice(0, 20))
    } catch {}
  }

  static add(note: Omit<GameNotification, 'id' | 'timestamp' | 'read'>) {
    const existing = NotificationCenter.load()
    existing.unshift({
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      read: false,
      ...note,
    })
    // Cap at 20 most recent
    NotificationCenter.save(existing.slice(0, 20))
  }

  static markRead(id: string) {
    const existing = NotificationCenter.load()
    const note = existing.find(n => n.id === id)
    if (note) {
      note.read = true
      NotificationCenter.save(existing)
    }
  }

  static markAllRead() {
    const existing = NotificationCenter.load()
    for (const n of existing) n.read = true
    NotificationCenter.save(existing)
  }

  static unreadCount(): number {
    return NotificationCenter.load().filter(n => !n.read).length
  }
}
