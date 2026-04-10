import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wilssueuaznqrbtlqzgj.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_vq1TExg3GWkMV8F56b77uw_tQfgM05S'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
