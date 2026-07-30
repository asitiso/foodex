import { describe, expect, it } from 'vitest'
import { buildMealGameLoop } from './mealGameLoop'
import type { MealRecord } from './types'

const entry = (recordedAt: number) => ({
  meal: { id: String(recordedAt), imageData: null, foodType: 'rice', foodName: 'rice', amount: 'taste', recordedAt } as MealRecord,
})

describe('meal game loop', () => {
  it('turns today meals into a capped three-step gauge and next meal target', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const state = buildMealGameLoop([entry(now), entry(now + 60_000), entry(now + 120_000)], now)

    expect(state.todayMeals).toBe(3)
    expect(state.gaugeSteps).toEqual([true, true, true])
    expect(state.nextMealTarget).toBe(3)
    expect(state.nextMealRemaining).toBe(0)
    expect(state.comboLabel).toBe('하루 완식 콤보')
    expect(state.comboReward).toBe(30)
  })

  it('counts cumulative meals toward the next growth threshold', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const state = buildMealGameLoop(Array.from({ length: 7 }, (_, index) => entry(now - index * 86_400_000)), now)

    expect(state.totalMeals).toBe(7)
    expect(state.growth.current).toBe(7)
    expect(state.growth.next).toBe(14)
    expect(state.growth.remaining).toBe(7)
    expect(state.weeklyMeals).toBe(7)
    expect(state.weeklyTarget).toBe(10)
    expect(state.recoveryAvailable).toBe(false)
  })

  it('offers a recovery when the latest meal day has a one-day gap', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const state = buildMealGameLoop([entry(now), entry(now - 2 * 86_400_000)], now)
    expect(state.recoveryAvailable).toBe(true)
  })
})
