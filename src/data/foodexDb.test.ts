import { beforeEach, describe, expect, it } from 'vitest'
import { createFoodexRepository, deleteFoodexDatabase } from './foodexDb'
import type { FoodCard, MealRecord } from '../domain/types'

const databaseName = 'foodex-test'

const mealAt = (recordedAt: number, foodType: MealRecord['foodType'] = 'rice'): MealRecord => ({
  id: `meal-${recordedAt}`,
  imageData: null,
  foodType,
  amount: 'almostAll',
  recordedAt,
})

const cardAt = (createdAt: number, xp = 30): FoodCard => ({
  id: `card-${createdAt}`,
  mealId: `meal-${createdAt}`,
  catalogId: 'rice',
  name: '든든 밥방패',
  rarity: 'epic',
  quote: '작은 한술도 모험가의 힘이 돼.',
  xp,
  isNew: true,
  regionId: 'korea',
  evolutionStage: 1,
  createdAt,
})

describe('Foodex repository', () => {
  beforeEach(() => deleteFoodexDatabase(databaseName))

  it('saves a meal and card atomically and lists newest first', async () => {
    const repo = createFoodexRepository(databaseName)
    await repo.saveMealAndCard(mealAt(1), cardAt(1))
    await repo.saveMealAndCard(mealAt(2), cardAt(2))

    expect((await repo.listCards()).map((entry) => entry.card.createdAt)).toEqual([2, 1])
  })

  it('derives history and summary from saved records', async () => {
    const repo = createFoodexRepository(databaseName)
    await repo.saveMealAndCard(mealAt(1, 'ramen'), cardAt(1, 10))

    expect(await repo.getHistory()).toEqual({ foodTypes: ['ramen'], categories: ['meal'] })
    expect((await repo.getSummary(1)).totalXp).toBe(10)
  })

  it('keeps one pending sync item per meal and replaces retry state', async () => {
    const repo = createFoodexRepository(databaseName)
    await repo.enqueueSync({ kind: 'meal-card', mealId: 'meal-1', attempts: 0 })
    await repo.enqueueSync({ kind: 'meal-card', mealId: 'meal-1', attempts: 1, lastError: 'offline' })

    expect(await repo.listPendingSync()).toEqual([
      { kind: 'meal-card', mealId: 'meal-1', attempts: 1, lastError: 'offline' },
    ])

    await repo.markSynced('meal-1')
    expect(await repo.listPendingSync()).toEqual([])
  })

  it('stores rewards, fusion history, and migration settings', async () => {
    const repo = createFoodexRepository(databaseName)
    await repo.saveRewards([{
      key: 'background:sunny-picnic',
      id: 'reward-1',
      rewardType: 'background',
      rewardId: 'sunny-picnic',
      sourceType: 'set',
      sourceId: 'sunny-bites',
      unlockedAt: 1,
    }])
    await repo.saveFusion({
      id: 'fusion-1',
      leftCardId: 'card-1',
      rightCardId: 'card-2',
      fusionCatalogId: 'ramen-rice-hero',
      createdAt: 1,
    })
    await repo.setSetting('migration_complete', 'true')

    expect(await repo.listRewards()).toHaveLength(1)
    expect(await repo.listFusions()).toHaveLength(1)
    expect(await repo.getSetting('migration_complete')).toBe('true')
  })
})
