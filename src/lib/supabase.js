import { createClient } from '@supabase/supabase-js'

// ⚠️  SOSTITUISCI con i tuoi valori da Supabase → Project Settings → API
const SUPABASE_URL = 'https://TUO-PROGETTO.supabase.co'
const SUPABASE_ANON_KEY = 'tua-anon-key-qui'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
