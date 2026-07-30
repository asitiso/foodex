import { describe, expect, it } from 'vitest'
import type { FoodCard, FoodType, MealRecord, RegionId } from './types'
import { buildV3Progress, filterCollection, resolveFusion, seasonForDate } from './v3Progression'

function entry(catalogId: string, foodType: FoodType, regionId: RegionId, seasonId?: FoodCard['seasonId']) {
  const recordedAt = Date.parse('2026-07-30T12:00:00+09:00')
  const meal: MealRecord = {
    id: `meal-${catalogId}`,
    imageData: null,
    foodType,
    foodName: catalogId,
    amount: 'taste',
    recordedAt,
  }
  const card: FoodCard = {
    id: `card-${catalogId}`,
    mealId: meal.id,
    catalogId,
    name: catalogId,
    rarity: 'common',
    quote: 'test',
    xp: 10,
    isNew: true,
    regionId,
    seasonId,
    evolutionStage: 1,
    createdAt: recordedAt,
  }
  return { meal, card }
}

describe('V3 progression', () => {
  it('counts unique discoveries and grants each completed set once', () => {
    const entries = [
      entry('fruit', 'fruit', 'snack-island', 'summer'),
      entry('drink', 'drink', 'snack-island', 'summer'),
      { ...entry('fruit', 'fruit', 'snack-island', 'summer'), card: { ...entry('fruit', 'fruit', 'snack-island', 'summer').card, id: 'card-fruit-2' } },
    ]
    const progress = buildV3Progress(entries, [], Date.parse('2026-07-30T12:00:00+09:00'))

    expect(progress.regions.find((region) => region.id === 'snack-island')?.discovered).toBe(2)
    expect(progress.completedSetIds).toContain('sunny-bites')
    expect(progress.newRewards).toEqual([
      expect.objectContaining({ rewardId: 'sunny-picnic', sourceId: 'sunny-bites' }),
    ])
    expect(buildV3Progress(entries, ['sunny-picnic'], Date.now()).newRewards).toEqual([])
  })

  it('resolves fusion regardless of selection order without changing source cards', () => {
    const ramen = entry('ramen', 'ramen', 'korea').card
    const rice = entry('rice', 'rice', 'korea').card

    expect(resolveFusion(ramen, rice)?.id).toBe('ramen-rice-hero')
    expect(resolveFusion(rice, ramen)?.id).toBe('ramen-rice-hero')
    expect([ramen.id, rice.id]).toEqual(['card-ramen', 'card-rice'])
  })

  it('uses Korean calendar months for seasons and exposes active events', () => {
    const now = Date.parse('2026-07-30T12:00:00+09:00')
    const progress = buildV3Progress([entry('fruit', 'fruit', 'snack-island', 'summer')], [], now)

    expect(seasonForDate(now)).toBe('summer')
    expect(progress.activeEvent).toEqual(expect.objectContaining({
      id: 'summer-table-2026',
      completed: 1,
      total: 3,
    }))
  })

  it('combines collection filters with logical AND', () => {
    const entries = [
      { ...entry('ramen', 'ramen', 'korea'), card: { ...entry('ramen', 'ramen', 'korea').card, rarity: 'rare' as const } },
      { ...entry('sushi', 'sushi', 'japan', 'spring'), card: { ...entry('sushi', 'sushi', 'japan', 'spring').card, rarity: 'epic' as const } },
    ]

    expect(filterCollection(entries, { regionId: 'korea', rarity: 'rare' }).map(({ card }) => card.id)).toEqual(['card-ramen'])
  })
})
