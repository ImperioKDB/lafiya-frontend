import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly rather than silently constructing a broken client --
  // matches the "flag unknowns early" discipline already established
  // on the backend (see wema_client.py, README.md).
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY -- check .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
