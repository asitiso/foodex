import { describe, expect, it } from 'vitest'
import { buildMealOutcome, mealSlot } from './mealOutcome'
import type { MealRecord } from './types'

const meal = (foodName: string, foodType: MealRecord['foodType'], recordedAt: number): MealRecord => ({ id: foodName + recordedAt, imageData: null, foodName, foodType, amount: 'taste', recordedAt })

describe('meal outcome', () => {
  it('maps Korea-local clock buckets to dungeon slots', () => {
    expect(mealSlot(new Date(2026, 0, 1, 8).getTime())).toBe('breakfast')
    expect(mealSlot(new Date(2026, 0, 1, 12).getTime())).toBe('lunch')
    expect(mealSlot(new Date(2026, 0, 1, 19).getTime())).toBe('dinner')
  })

  it('applies class bonuses and combo damage', () => {
    const now = new Date(2026, 0, 1, 12).getTime()
    const history = [meal('사과', 'fruit', now - 1000), meal('밥', 'rice', now - 2000)]
    const outcome = buildMealOutcome(meal('김치', 'side', now), history, 'balance-alchemist')
    expect(outcome.combo).toBe(1)
    expect(outcome.xp).toBeGreaterThan(20)
    expect(outcome.bossDamage).toBe(35)
    expect(outcome.discoveredNewSlot).toBe(true)
    expect(outcome.coins).toBe(8)
  })

  it('awards 5 coins for the first meal of the local day', () => {
    const now = new Date(2026, 0, 1, 8).getTime()
    const previousDay = meal('밥', 'rice', new Date(2025, 11, 31, 20).getTime())

    expect(buildMealOutcome(meal('죽', 'rice', now), [previousDay]).coins).toBe(5)
  })
})
