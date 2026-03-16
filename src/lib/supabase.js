import { createClient } from '@supabase/supabase-js'

// ⚠️  SOSTITUISCI con i tuoi valori da Supabase → Project Settings → API
const SUPABASE_URL = 'https://xjdansvutcphqeedmjgp.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0fdYtlHpQS89ucRSFQgf-A_zsML2tsQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
