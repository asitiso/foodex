import { describe, expect, it } from 'vitest'
import { normalizeCard } from './normalizers'

describe('persisted data normalizers', () => {
  it('adds V3 catalog metadata to a legacy V2 card', () => {
    expect(normalizeCard({
      id: 'card-1',
      mealId: 'meal-1',
      name: '불꽃 라면',
      rarity: 'rare',
      quote: 'test',
      xp: 20,
      isNew: true,
      createdAt: 1,
    }, 'ramen')).toEqual(expect.objectContaining({
      catalogId: 'ramen',
      regionId: 'korea',
      evolutionStage: 1,
    }))
  })

  it('preserves cosmetic choices already stored on a V3 card', () => {
    expect(normalizeCard({
      id: 'card-1',
      mealId: 'meal-1',
      catalogId: 'fruit',
      name: '햇살 과일단',
      rarity: 'rare',
      quote: 'test',
      xp: 20,
      isNew: true,
      regionId: 'snack-island',
      seasonId: 'summer',
      evolutionStage: 2,
      backgroundId: 'sunny-picnic',
      createdAt: 1,
    }, 'fruit')).toEqual(expect.objectContaining({
      evolutionStage: 2,
      backgroundId: 'sunny-picnic',
    }))
  })
})
