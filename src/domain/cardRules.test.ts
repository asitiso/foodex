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
    expect(rarityForFood('ramen', '라면', { foodTypes: [], foodNames: [], categories: [] })).toBe('epic')
  })

  it('awards Rare for a new food in a known category', () => {
    expect(rarityForFood('ramen', '라면', { foodTypes: [], foodNames: [], categories: ['meal'] })).toBe('rare')
  })

  it('awards Rare when the coarse type is known but the named food is new', () => {
    expect(rarityForFood('rice', '김치볶음밥', {
      foodTypes: ['rice'],
      foodNames: ['밥'],
      categories: ['meal'],
    })).toBe('rare')
  })

  it('awards Common for a repeated food regardless of amount', () => {
    const history = { foodTypes: ['ramen'] as const, foodNames: ['라면'] as const, categories: ['meal'] as const }
    expect(createCard({ mealId: 'm1', foodType: 'ramen', foodName: '라면', amount: 'taste', now: 1 }, history).rarity).toBe('common')
    expect(createCard({ mealId: 'm2', foodType: 'ramen', foodName: '라면', amount: 'almostAll', now: 2 }, history).rarity).toBe('common')
  })

  it('treats the same food with whitespace or casing differences as a repeat', () => {
    const history = { foodTypes: ['ramen'] as const, foodNames: [' 라 면 '] as const, categories: ['meal'] as const }
    expect(rarityForFood('ramen', '라면', history)).toBe('common')
  })

  it('uses the UUID meal id for the card id so Supabase foreign keys remain valid', () => {
    expect(createCard({ mealId: 'm1', foodType: 'ramen', foodName: '?쇰㈃', amount: 'taste', now: 1 }, { foodTypes: [], foodNames: [], categories: [] }).id).toBe('m1')
  })

  it('awards Legendary for a season reward card', () => {
    const card = createCard(
      { mealId: 'm1', foodType: 'fruit', foodName: '딸기', amount: 'taste', now: 1, rewardSource: 'season' },
      { foodTypes: [], foodNames: [], categories: [] },
    )

    expect(card.rarity).toBe('legendary')
    expect(card.xp).toBe(30)
  })

  it('adds discovery XP without penalizing small amounts', () => {
    const card = createCard(
      { mealId: 'm1', foodType: 'fruit', foodName: '딸기', amount: 'taste', now: 1 },
      { foodTypes: [], foodNames: [], categories: [] },
    )

    expect(card.xp).toBe(20)
  })

  it('rolls power/luck/warmth stats in the 1-99 range, deterministically for a fixed mealId', () => {
    const history = { foodTypes: [], foodNames: [], categories: [] }
    const card = createCard({ mealId: 'stats-meal', foodType: 'ramen', foodName: '라면', amount: 'taste', now: 1 }, history)
    const again = createCard({ mealId: 'stats-meal', foodType: 'ramen', foodName: '라면', amount: 'taste', now: 1 }, history)

    expect(card.stats).toBeDefined()
    for (const value of [card.stats!.power, card.stats!.luck, card.stats!.warmth]) {
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(99)
    }
    expect(card.stats).toEqual(again.stats)
  })

  it('always returns a boolean isShiny flag, independent of rarity', () => {
    const history = { foodTypes: [], foodNames: [], categories: [] }
    const card = createCard({ mealId: 'shiny-meal', foodType: 'ramen', foodName: '라면', amount: 'taste', now: 1 }, history)

    expect(typeof card.isShiny).toBe('boolean')
  })

  it('tags secretTags with midnight for late-night meals', () => {
    const lateNight = new Date(2026, 6, 15, 23, 30).getTime()
    const card = createCard(
      { mealId: 'm1', foodType: 'ramen', foodName: '라면', amount: 'taste', now: lateNight },
      { foodTypes: [], foodNames: [], categories: [] },
    )

    expect(Array.isArray(card.secretTags)).toBe(true)
    expect(card.secretTags).toContain('midnight')
  })

  it('tags secretTags with seasonal when the food catalog season matches the real season', () => {
    const summerNoon = Date.parse('2026-07-15T12:00:00+09:00')
    const card = createCard(
      { mealId: 'm1', foodType: 'fruit', foodName: '딸기', amount: 'taste', now: summerNoon },
      { foodTypes: [], foodNames: [], categories: [] },
    )

    expect(card.secretTags).toContain('seasonal')
  })

  it('defaults secretTags to an empty array when no conditions match', () => {
    const springNoon = Date.parse('2026-04-15T12:00:00+09:00')
    const card = createCard(
      { mealId: 'no-tags-meal', foodType: 'ramen', foodName: '라면', amount: 'taste', now: springNoon },
      { foodTypes: [], foodNames: [], categories: [] },
    )

    expect(Array.isArray(card.secretTags)).toBe(true)
  })
})
