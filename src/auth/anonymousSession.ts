import type { SupabaseClient } from '@supabase/supabase-js'

export type AuthBootstrapResult =
  | { mode: 'cloud'; userId: string; isAnonymous: boolean }
  | { mode: 'local'; reason: 'missing-config' | 'auth-unavailable' }

export async function ensureAnonymousSession(client: SupabaseClient): Promise<AuthBootstrapResult> {
  try {
    const existing = await client.auth.getSession()
    if (existing.data.session) {
      return {
        mode: 'cloud',
        userId: existing.data.session.user.id,
        isAnonymous: existing.data.session.user.is_anonymous ?? false,
      }
    }

    const created = await client.auth.signInAnonymously()
    if (created.error || !created.data.user) {
      return { mode: 'local', reason: 'auth-unavailable' }
    }

    return {
      mode: 'cloud',
      userId: created.data.user.id,
      isAnonymous: created.data.user.is_anonymous ?? true,
    }
  } catch {
    return { mode: 'local', reason: 'auth-unavailable' }
  }
}
