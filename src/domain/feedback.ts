import type { Rarity } from './types'

export type SoundCueId =
  | 'card-common'
  | 'card-rare'
  | 'card-epic'
  | 'legendary-fanfare'
  | 'quest-complete'
  | 'level-up'
  | 'room-unlock'
  | 'button-tap'
  | 'chest-shake'
  | 'chest-open'

export type VisualCueId =
  | 'card-glow'
  | 'rare-rings'
  | 'epic-burst'
  | 'legendary-burst'
  | 'quest-pop'
  | 'level-burst'
  | 'room-sparkle'
  | 'button-press'
  | 'chest-shake'
  | 'chest-burst'

export type HapticStrength = 'none' | 'light' | 'medium' | 'heavy'

export interface FeedbackCue {
  visual: VisualCueId
  sound: SoundCueId
  haptic: HapticStrength
}

export type FeedbackEvent =
  | { type: 'card'; rarity: Rarity }
  | { type: 'quest-complete' }
  | { type: 'level-up' }
  | { type: 'room-unlock' }
  | { type: 'button' }
  | { type: 'chest-shake' }
  | { type: 'chest-open' }

export function directFeedback(event: FeedbackEvent): FeedbackCue {
  if (event.type === 'card') {
    return {
      common: { visual: 'card-glow', sound: 'card-common', haptic: 'light' },
      rare: { visual: 'rare-rings', sound: 'card-rare', haptic: 'medium' },
      epic: { visual: 'epic-burst', sound: 'card-epic', haptic: 'heavy' },
      legendary: { visual: 'legendary-burst', sound: 'legendary-fanfare', haptic: 'heavy' },
    }[event.rarity] as FeedbackCue
  }

  return {
    'quest-complete': { visual: 'quest-pop', sound: 'quest-complete', haptic: 'medium' },
    'level-up': { visual: 'level-burst', sound: 'level-up', haptic: 'heavy' },
    'room-unlock': { visual: 'room-sparkle', sound: 'room-unlock', haptic: 'medium' },
    button: { visual: 'button-press', sound: 'button-tap', haptic: 'light' },
    'chest-shake': { visual: 'chest-shake', sound: 'chest-shake', haptic: 'medium' },
    'chest-open': { visual: 'chest-burst', sound: 'chest-open', haptic: 'heavy' },
  }[event.type] as FeedbackCue
}
