import { createClient } from '@supabase/supabase-js'

export interface SupabasePublicEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

export function createSupabaseClient(env: SupabasePublicEnv = import.meta.env) {
  const url = env.VITE_SUPABASE_URL
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) return null
  return createClient(url, publishableKey)
}

export const supabase = createSupabaseClient()
