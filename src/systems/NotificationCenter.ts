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
const SEEDED_KEY = 'claws_notifications_seeded'

// Seed messages — shown once on first load
const SEED_MESSAGES: Omit<GameNotification, 'id' | 'timestamp' | 'read'>[] = [
  {
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

  /** Call on game start — seeds initial messages only once */
  static ensureSeeded() {
    try {
      if (localStorage.getItem(SEEDED_KEY)) return
      const existing = NotificationCenter.load()
      const now = Date.now()
      for (const seed of SEED_MESSAGES) {
        existing.push({
          id: `seed_${seed.title.replace(/\W+/g, '_').toLowerCase()}_${now}`,
          timestamp: now,
          read: false,
          ...seed,
        })
      }
      NotificationCenter.save(existing)
      localStorage.setItem(SEEDED_KEY, '1')
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
