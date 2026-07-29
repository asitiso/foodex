import { describe, expect, it, vi } from 'vitest'
import { ensureAnonymousSession } from './anonymousSession'

describe('anonymous session bootstrap', () => {
  it('reuses an existing session without creating another user', async () => {
    const signInAnonymously = vi.fn()
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-1', is_anonymous: true } } },
          error: null,
        }),
        signInAnonymously,
      },
    }

    const result = await ensureAnonymousSession(client as never)

    expect(result).toEqual({ mode: 'cloud', userId: 'user-1', isAnonymous: true })
    expect(signInAnonymously).not.toHaveBeenCalled()
  })

  it('creates an invisible anonymous session when none exists', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-2', is_anonymous: true }, session: {} },
          error: null,
        }),
      },
    }

    expect(await ensureAnonymousSession(client as never)).toEqual({
      mode: 'cloud',
      userId: 'user-2',
      isAnonymous: true,
    })
  })

  it('returns local mode instead of blocking when authentication is unavailable', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockRejectedValue(new Error('offline')),
        signInAnonymously: vi.fn(),
      },
    }

    expect(await ensureAnonymousSession(client as never)).toEqual({
      mode: 'local',
      reason: 'auth-unavailable',
    })
  })
})
