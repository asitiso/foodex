import { describe, expect, it } from 'vitest'
import { buildProgression } from './progression'
import type { FoodCard, MealRecord } from './types'
import { buildCompanionContext } from './companionContext'

const at = (iso: string) => new Date(iso).getTime()

function entry(
  foodName: string,
  recordedAt: number,
  foodType: MealRecord['foodType'] = 'rice',
  rarity: FoodCard['rarity'] = 'common',
  isNew = false,
) {
  const meal: MealRecord = {
    id: `meal-${foodName}-${recordedAt}`,
    imageData: null,
    foodType,
    foodName,
    amount: 'almostAll',
    recordedAt,
  }
  const card: FoodCard = {
    id: `card-${foodName}-${recordedAt}`,
    mealId: meal.id,
    catalogId: foodName,
    name: `${foodName} 카드`,
    rarity,
    quote: '좋은 발견이야.',
    xp: 30,
    isNew,
    regionId: 'korea',
    evolutionStage: 1,
    createdAt: recordedAt,
  }
  return { meal, card }
}

describe('buildCompanionContext', () => {
  it('uses Seoul day boundaries and counts consecutive repeats from the latest meal', () => {
    const now = at('2026-07-30T19:00:00+09:00')
    const entries = [
      entry('라면', at('2026-07-29T23:50:00+09:00'), 'ramen'),
      entry('김치볶음밥', at('2026-07-30T12:00:00+09:00')),
      entry('김치볶음밥', at('2026-07-30T18:00:00+09:00'), 'rice', 'rare', true),
    ]

    const context = buildCompanionContext(entries, buildProgression(entries, now), now)

    expect(context.mealPeriod).toBe('dinner')
    expect(context.todayCount).toBe(2)
    expect(context.repeatCount).toBe(2)
    expect(context.latestFoodName).toBe('김치볶음밥')
    expect(context.latestRarity).toBe('rare')
    expect(context.isNewFood).toBe(true)
  })

  it.each([
    ['2026-07-30T06:00:00+09:00', 'morning'],
    ['2026-07-30T11:00:00+09:00', 'lunch'],
    ['2026-07-30T15:00:00+09:00', 'dinner'],
    ['2026-07-30T21:00:00+09:00', 'snack'],
  ] as const)('maps %s to the %s meal period', (iso, expected) => {
    const now = at(iso)
    expect(buildCompanionContext([], buildProgression([], now), now).mealPeriod).toBe(expected)
  })

  it('returns safe defaults without entries', () => {
    const now = at('2026-07-30T08:00:00+09:00')
    const context = buildCompanionContext([], buildProgression([], now), now)

    expect(context).toMatchObject({
      todayCount: 0,
      isNewFood: false,
      repeatCount: 0,
      level: 1,
      levelProgress: 0,
      streakDays: 0,
      completedQuestCount: 0,
      completedSetIds: [],
      newlyUnlockedDecorationIds: [],
      newlyUnlockedAchievementIds: [],
      isCategoryReturn: false,
    })
    expect(context.lastMealAt).toBeUndefined()
  })

  it('marks an achievement only on the meal that unlocks it', () => {
    const now = at('2026-07-30T19:00:00+09:00')
    const first = entry('밥', at('2026-07-30T12:00:00+09:00'))
    const second = entry('김치볶음밥', at('2026-07-30T18:00:00+09:00'))

    expect(buildCompanionContext([first], buildProgression([first], now), now).newlyUnlockedAchievementIds)
      .toContain('first-meal')
    expect(buildCompanionContext([first, second], buildProgression([first, second], now), now).newlyUnlockedAchievementIds)
      .not.toContain('first-meal')
  })
})
