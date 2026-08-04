import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WorldMapTab } from './WorldMapTab'
import { buildV3Progress } from '../../domain/v3Progression'
import type { FoodCard, MealRecord } from '../../domain/types'

function entry(catalogId: string, foodType: MealRecord['foodType']): { card: FoodCard; meal: MealRecord } {
  const recordedAt = Date.now()
  const meal: MealRecord = {
    id: `meal-${catalogId}`,
    imageData: null,
    foodType,
    foodName: catalogId,
    amount: 'almostAll',
    recordedAt,
  }
  const card: FoodCard = {
    id: `card-${catalogId}`,
    mealId: meal.id,
    catalogId,
    name: `${catalogId} 카드`,
    rarity: 'common',
    quote: '좋은 발견이야.',
    xp: 10,
    isNew: true,
    regionId: 'korea',
    evolutionStage: 1,
    createdAt: recordedAt,
  }
  return { meal, card }
}

describe('WorldMapTab', () => {
  afterEach(cleanup)

  it('shows a mastery badge once every food in a region is discovered', () => {
    const entries = [
      entry('ramen', 'ramen'),
      entry('rice', 'rice'),
      entry('side', 'side'),
    ]
    const discovered = new Set(entries.map(({ card }) => card.catalogId))
    const progress = buildV3Progress(entries, [])

    render(<WorldMapTab progress={progress} discovered={discovered} />)

    expect(screen.getByText('🏆 한식 마스터 칭호 획득!')).toBeInTheDocument()
  })

  it('does not show a mastery badge for a partially discovered region', () => {
    const entries = [entry('ramen', 'ramen')]
    const discovered = new Set(entries.map(({ card }) => card.catalogId))
    const progress = buildV3Progress(entries, [])

    render(<WorldMapTab progress={progress} discovered={discovered} />)

    expect(screen.queryByText('🏆 한식 마스터 칭호 획득!')).not.toBeInTheDocument()
  })
})
