import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG } from './foodCatalog'
import { composeCardCopy, rollStat } from './cardComposer'

const kimchiRice = FOOD_CATALOG.find((food) => food.id === 'kimchi-fried-rice')!
const ramen = FOOD_CATALOG.find((food) => food.id === 'ramen')!

describe('composeCardCopy', () => {
  it('creates a rare spicy food title from its flavor', () => {
    const spicyKimchiRice = { ...kimchiRice, flavor: 'spicy' as const }
    expect(composeCardCopy({ food: spicyKimchiRice, rarity: 'rare', seed: 'meal-1' }).name)
      .toMatch(/불꽃|붉은|매콤/)
  })

  it('uses the fixed legendary title', () => {
    expect(composeCardCopy({ food: ramen, rarity: 'legendary', seed: 'meal-2' }).name)
      .toBe('천공을 가르는 라면왕')
  })

  it('returns stable copy for the same seed', () => {
    expect(composeCardCopy({ food: kimchiRice, rarity: 'epic', seed: 'meal-3' }))
      .toEqual(composeCardCopy({ food: kimchiRice, rarity: 'epic', seed: 'meal-3' }))
  })
})

describe('rollStat', () => {
  it('rolls a value in the 1-99 range', () => {
    for (const seed of ['m1:power', 'm1:luck', 'm1:warmth', 'another-meal:power']) {
      const value = rollStat(seed)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(99)
    }
  })

  it('is deterministic for the same seed', () => {
    expect(rollStat('meal-42:power')).toBe(rollStat('meal-42:power'))
  })
})
