import { describe, expect, it } from 'vitest'
import { buildMealAdventure } from './mealAdventure'
import type { MealRecord } from './types'

const entry = (foodType: MealRecord['foodType'], recordedAt: number) => ({ meal: { id: `${foodType}-${recordedAt}`, imageData: null, foodType, foodName: foodType, amount: 'taste', recordedAt } as MealRecord })

describe('meal adventure', () => {
  it('builds a three-meal route, mood, combo recipe, and room reward', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const state = buildMealAdventure([entry('rice', now), entry('side', now), entry('fruit', now)], now)
    expect(state.route.completed).toBe(true)
    expect(state.mood).toBe('bright')
    expect(state.recipes).toContain('든든한 집밥')
    expect(state.rewardChoices).toHaveLength(3)
  })

  it('builds monthly collection and weekly story progress', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const state = buildMealAdventure([entry('bread', now), entry('ramen', now - 86_400_000)], now)
    expect(state.monthly.breakfast).toBe(1)
    expect(state.monthly.lunch).toBe(1)
    expect(state.chapter.title).toBe('푸디의 첫 식탁')
  })
})
