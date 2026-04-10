import { supabase } from './SupabaseClient'

export interface GameSession {
  player_name: string
  hero: string
  kills: number
  level: number
  time_ms: number
  wave: number
  won: boolean
  upgrades: string[]
  date: string
}

export class SessionLogger {
  static async logSession(session: GameSession): Promise<void> {
    try {
      // Coerce numeric fields to safe integers — Phaser's gameTime is a float
      // and Postgres `integer` columns reject decimals.
      const payload: GameSession = {
        ...session,
        kills:   Math.max(0, Math.floor(session.kills)),
        level:   Math.max(1, Math.floor(session.level)),
        time_ms: Math.max(0, Math.floor(session.time_ms)),
        wave:    Math.max(0, Math.floor(session.wave)),
      }
      const { error } = await supabase.from('sessions').insert(payload)
      if (error) console.error('[SessionLogger] insert error:', error, payload)
    } catch (e) {
      console.error('[SessionLogger] threw:', e)
    }
  }

  static async registerPlayer(name: string): Promise<void> {
    try {
      const { error } = await supabase.from('players').upsert(
        { name, last_seen: new Date().toISOString() },
        { onConflict: 'name' }
      )
      if (error) console.error('[SessionLogger] upsert error:', error, name)
    } catch (e) {
      console.error('[SessionLogger] threw:', e)
    }
  }
}
