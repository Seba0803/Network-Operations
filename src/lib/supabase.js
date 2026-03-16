import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xjdansvutcphqeedmjgp.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0fdYtlHpQS89ucRSFQgf-A_zsML2tsQ.' // la tua chiave completa

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
})

export const ANON_USER_ID = '00000000-0000-0000-0000-000000000000'
