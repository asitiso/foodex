import { describe, expect, it } from 'vitest'
import { createSupabaseClient } from './supabase'

describe('Supabase client configuration', () => {
  it('returns null when public configuration is missing', () => {
    expect(createSupabaseClient({})).toBeNull()
  })

  it('creates a client from publishable browser configuration', () => {
    const client = createSupabaseClient({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    })

    expect(client).not.toBeNull()
    expect(client?.auth).toBeDefined()
  })
})
