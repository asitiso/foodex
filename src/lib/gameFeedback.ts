import type { ExperienceSettings } from '../domain/companionTypes'
import type { FeedbackCue, HapticStrength, SoundCueId } from '../domain/feedback'

interface Tone {
  frequency: number
  offset: number
  duration: number
  gain: number
}

const SOUND_PRESETS: Record<SoundCueId, readonly Tone[]> = {
  'card-common': [{ frequency: 440, offset: 0, duration: .08, gain: .05 }],
  'card-rare': [
    { frequency: 523, offset: 0, duration: .09, gain: .06 },
    { frequency: 659, offset: .08, duration: .12, gain: .055 },
  ],
  'card-epic': [
    { frequency: 392, offset: 0, duration: .12, gain: .06 },
    { frequency: 587, offset: .1, duration: .13, gain: .06 },
    { frequency: 784, offset: .2, duration: .18, gain: .055 },
  ],
  'legendary-fanfare': [
    { frequency: 523, offset: 0, duration: .16, gain: .065 },
    { frequency: 659, offset: .14, duration: .16, gain: .065 },
    { frequency: 784, offset: .28, duration: .24, gain: .06 },
  ],
  'quest-complete': [{ frequency: 660, offset: 0, duration: .1, gain: .05 }],
  'level-up': [
    { frequency: 440, offset: 0, duration: .12, gain: .055 },
    { frequency: 880, offset: .11, duration: .2, gain: .055 },
  ],
  'room-unlock': [
    { frequency: 494, offset: 0, duration: .12, gain: .05 },
    { frequency: 740, offset: .1, duration: .18, gain: .05 },
  ],
  'button-tap': [{ frequency: 360, offset: 0, duration: .035, gain: .025 }],
  'chest-shake': [{ frequency: 180, offset: 0, duration: .08, gain: .04 }],
  'chest-open': [
    { frequency: 330, offset: 0, duration: .12, gain: .055 },
    { frequency: 660, offset: .1, duration: .22, gain: .06 },
  ],
}

const VIBRATION_PATTERNS: Record<HapticStrength, number | number[]> = {
  none: 0,
  light: 18,
  medium: [28, 22, 32],
  heavy: [45, 24, 55],
}

export interface NativeHapticsAdapter {
  vibrate(strength: Exclude<HapticStrength, 'none'>): Promise<void>
}

let nativeHaptics: NativeHapticsAdapter | undefined

export function setNativeHapticsAdapter(adapter?: NativeHapticsAdapter) {
  nativeHaptics = adapter
}

function playSound(cue: SoundCueId) {
  const AudioContextConstructor = globalThis.AudioContext
  if (!AudioContextConstructor) return

  const context = new AudioContextConstructor()
  if (context.state === 'suspended') void context.resume().catch(() => undefined)
  const startedAt = context.currentTime
  let endAt = 0

  SOUND_PRESETS[cue].forEach((tone) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = startedAt + tone.offset
    const end = start + tone.duration
    oscillator.frequency.setValueAtTime(tone.frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(tone.gain, start + .01)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(end)
    endAt = Math.max(endAt, tone.offset + tone.duration)
  })

  globalThis.setTimeout(() => void context.close().catch(() => undefined), (endAt + .05) * 1000)
}

async function playHaptic(strength: HapticStrength) {
  if (strength === 'none') return
  if (nativeHaptics) {
    await nativeHaptics.vibrate(strength)
    return
  }
  globalThis.navigator?.vibrate?.(VIBRATION_PATTERNS[strength])
}

export async function playFeedback(cue: FeedbackCue, settings: ExperienceSettings): Promise<void> {
  try {
    if (settings.soundEnabled) playSound(cue.sound)
    if (settings.hapticsEnabled) await playHaptic(cue.haptic)
  } catch {
    // Game feedback is optional and must never block recording or saving.
  }
}
