import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ExperienceSettings } from '../domain/companionTypes'
import { playFeedback } from './gameFeedback'

const settings: ExperienceSettings = {
  soundEnabled: true,
  musicEnabled: false,
  hapticsEnabled: true,
  reducedMotion: false,
}

describe('playFeedback', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps working when AudioContext and vibration are unavailable', async () => {
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('navigator', {})

    await expect(playFeedback({
      visual: 'epic-burst',
      sound: 'card-epic',
      haptic: 'medium',
    }, settings)).resolves.toBeUndefined()
  })

  it('does not touch audio or vibration when they are disabled', async () => {
    const audio = vi.fn()
    const vibrate = vi.fn()
    vi.stubGlobal('AudioContext', audio)
    vi.stubGlobal('navigator', { vibrate })

    await playFeedback({
      visual: 'card-glow',
      sound: 'card-common',
      haptic: 'light',
    }, { ...settings, soundEnabled: false, hapticsEnabled: false })

    expect(audio).not.toHaveBeenCalled()
    expect(vibrate).not.toHaveBeenCalled()
  })
})
