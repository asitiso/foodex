import { describe, expect, it } from 'vitest'
import { directFeedback } from './feedback'

describe('directFeedback', () => {
  it('maps legendary cards to fanfare and strong haptics', () => {
    expect(directFeedback({ type: 'card', rarity: 'legendary' })).toEqual({
      visual: 'legendary-burst',
      sound: 'legendary-fanfare',
      haptic: 'heavy',
    })
  })

  it('scales card feedback with rarity', () => {
    expect(directFeedback({ type: 'card', rarity: 'common' }).sound).toBe('card-common')
    expect(directFeedback({ type: 'card', rarity: 'rare' }).haptic).toBe('medium')
    expect(directFeedback({ type: 'card', rarity: 'epic' }).visual).toBe('epic-burst')
  })
})
