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
      await supabase.from('sessions').insert(session)
    } catch (e) {
      console.warn('Failed to log session:', e)
    }
  }

  static async registerPlayer(name: string): Promise<void> {
    try {
      await supabase.from('players').upsert(
        { name, last_seen: new Date().toISOString() },
        { onConflict: 'name' }
      )
    } catch (e) {
      console.warn('Failed to register player:', e)
    }
  }
}
