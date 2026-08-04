import { describe, expect, it } from 'vitest'
import { buildProgression } from './progression'
import { buildIntegratedMealResult } from './integratedMealResult'
import type { FoodCard, MealRecord } from './types'

const recordedAt = new Date(2026, 6, 30, 12, 0).getTime()
const meal: MealRecord = {
  id: 'meal-lunch',
  imageData: null,
  foodName: '라면',
  foodType: 'ramen',
  amount: 'almostAll',
  recordedAt,
}
const card: FoodCard = {
  id: 'card-lunch',
  mealId: meal.id,
  catalogId: 'ramen-basic',
  name: '라면 기사',
  rarity: 'rare',
  quote: '든든한 한 끼예요.',
  xp: 30,
  isNew: true,
  regionId: 'korea',
  evolutionStage: 1,
  createdAt: recordedAt,
}

describe('integrated meal result', () => {
  it('returns a card-first result with at most three rewards and the next dungeon room', () => {
    const before = buildProgression([], recordedAt)
    const after = buildProgression([{ meal, card }], recordedAt)

    const result = buildIntegratedMealResult({
      meal,
      card,
      history: [],
      before,
      after,
      classId: 'hearty-guardian',
      existingRewardKeys: [],
    })

    expect(result.mealId).toBe(meal.id)
    expect(result.primaryRewards.map((reward) => reward.kind)).toEqual(['card', 'xp', 'coin'])
    expect(result.primaryRewards).toHaveLength(3)
    expect(result.coinTransaction).toEqual(expect.objectContaining({
      key: `meal:${meal.id}:coins`,
      kind: 'meal-earned',
      amount: 5,
      mealId: meal.id,
    }))
    expect(result.completedQuestIds).toContain('today-card')
    expect(result.unlockedAchievementIds).toContain('first-meal')
    expect(result.nextGoal).toEqual({
      kind: 'dungeon-room',
      label: '저녁 방을 열려면 한 끼를 더 기록해 보세요',
    })
  })

  it('omits persistent unlocks whose stable keys already exist', () => {
    const before = buildProgression([], recordedAt)
    const after = {
      ...buildProgression([{ meal, card }], recordedAt),
      v3: {
        ...buildProgression([{ meal, card }], recordedAt).v3,
        newRewards: [{
          rewardType: 'background' as const,
          rewardId: 'sunny-picnic',
          sourceType: 'set' as const,
          sourceId: 'lunch-set',
        }],
      },
    }
    const key = 'background:sunny-picnic'

    const result = buildIntegratedMealResult({
      meal,
      card,
      history: [],
      before,
      after,
      existingRewardKeys: [key],
    })

    expect(result.persistedRewards.map((reward) => reward.key)).not.toContain(key)
  })

  it('reports evolvedFood when a save crosses an evolution threshold', () => {
    const earlierRamen = (index: number): { meal: MealRecord; card: FoodCard } => {
      const recordedAtEarlier = recordedAt - (index + 1) * 86_400_000
      const earlierMeal: MealRecord = { ...meal, id: `meal-ramen-${index}`, recordedAt: recordedAtEarlier }
      const earlierCard: FoodCard = { ...card, id: `card-ramen-${index}`, mealId: earlierMeal.id, createdAt: recordedAtEarlier }
      return { meal: earlierMeal, card: earlierCard }
    }
    const previousEntries = [earlierRamen(0), earlierRamen(1)]
    const before = buildProgression(previousEntries, recordedAt)
    const after = buildProgression([...previousEntries, { meal, card }], recordedAt)

    const result = buildIntegratedMealResult({
      meal,
      card,
      history: previousEntries.map((entry) => entry.meal),
      before,
      after,
      existingRewardKeys: [],
    })

    expect(result.evolvedFood).toEqual({
      foodType: 'ramen',
      title: '불꽃 라면 Lv.2',
      stage: 2,
    })
  })

  it('leaves evolvedFood undefined when no threshold is crossed', () => {
    const before = buildProgression([], recordedAt)
    const after = buildProgression([{ meal, card }], recordedAt)

    const result = buildIntegratedMealResult({
      meal,
      card,
      history: [],
      before,
      after,
      existingRewardKeys: [],
    })

    expect(result.evolvedFood).toBeUndefined()
  })
})
