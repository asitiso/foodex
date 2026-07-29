import { describe, expect, it } from 'vitest'
import { createCard, rarityForFood, xpForAmount } from './cardRules'

describe('card rules', () => {
  it.each([
    ['taste', 10],
    ['half', 20],
    ['almostAll', 30],
  ] as const)('maps %s to %i XP', (amount, xp) => {
    expect(xpForAmount(amount)).toBe(xp)
  })

  it('awards Epic for a first category', () => {
    expect(rarityForFood('ramen', { foodTypes: [], categories: [] })).toBe('epic')
  })

  it('awards Rare for a new food in a known category', () => {
    expect(rarityForFood('ramen', { foodTypes: [], categories: ['meal'] })).toBe('rare')
  })

  it('awards Common for a repeated food regardless of amount', () => {
    const history = { foodTypes: ['ramen'] as const, categories: ['meal'] as const }
    expect(createCard({ mealId: 'm1', foodType: 'ramen', amount: 'taste', now: 1 }, history).rarity).toBe('common')
    expect(createCard({ mealId: 'm2', foodType: 'ramen', amount: 'almostAll', now: 2 }, history).rarity).toBe('common')
  })

  it('awards Legendary for a season reward card', () => {
    const card = createCard(
      { mealId: 'm1', foodType: 'fruit', amount: 'taste', now: 1, rewardSource: 'season' },
      { foodTypes: [], categories: [] },
    )

    expect(card.rarity).toBe('legendary')
    expect(card.xp).toBe(30)
  })

  it('adds discovery XP without penalizing small amounts', () => {
    const card = createCard(
      { mealId: 'm1', foodType: 'fruit', amount: 'taste', now: 1 },
      { foodTypes: [], categories: [] },
    )

    expect(card.xp).toBe(20)
  })
})
