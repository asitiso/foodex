import { describe, expect, it } from 'vitest'
import { makeMealId } from './ids'

describe('Supabase-compatible ids', () => {
  it('creates UUID meal ids', () => {
    expect(makeMealId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })
})
