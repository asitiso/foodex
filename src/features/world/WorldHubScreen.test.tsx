import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildWorldProgress } from '../../domain/v6WorldProgression'
import { buildGameLoop } from '../../domain/v61GameLoop'
import type { FoodCard, MealRecord } from '../../domain/types'
import { WorldHubScreen } from './WorldHubScreen'

const meal = { id: 'meal-1', imageData: null, foodType: 'ramen', foodName: 'ramen', amount: 'half', recordedAt: 1_700_000_000_000 } as MealRecord
const card = { id: 'card-1', mealId: 'meal-1', catalogId: 'ramen', name: 'ramen', rarity: 'common', quote: '', xp: 10, isNew: true, regionId: 'korea', evolutionStage: 1, createdAt: meal.recordedAt } as FoodCard

describe('WorldHubScreen', () => {
  it('shows the daily expedition and long-term game systems together', () => {
    render(<WorldHubScreen progress={buildWorldProgress([{ meal }], meal.recordedAt)} gameLoop={buildGameLoop([{ meal, card }], meal.recordedAt)} />)

    expect(screen.getByRole('heading', { name: '오늘의 원정' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '주간 축제' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '주민 파티' })).toBeInTheDocument()
  })
})
