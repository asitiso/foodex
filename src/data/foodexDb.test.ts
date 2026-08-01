import { beforeEach, describe, expect, it } from 'vitest'
import { createFoodexRepository, deleteFoodexDatabase } from './foodexDb'
import type { FoodCard, MealRecord } from '../domain/types'
import type { ExperienceSettings } from '../domain/companionTypes'
import type { CoinTransaction } from '../domain/coinWallet'
import { SHOP_PRODUCTS } from '../domain/shopCatalog'

const databaseName = 'foodex-test'

const mealAt = (recordedAt: number, foodType: MealRecord['foodType'] = 'rice'): MealRecord => ({
  id: `meal-${recordedAt}`,
  imageData: null,
  foodType,
  foodName: foodType === 'ramen' ? '라면' : '밥',
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

    expect(await repo.getHistory()).toEqual({ foodTypes: ['ramen'], foodNames: ['라면'], categories: ['meal'] })
    expect((await repo.getSummary(1)).totalXp).toBe(10)
  })

  it('normalizes legacy meals that do not have a named food', async () => {
    const repo = createFoodexRepository(databaseName)
    const legacyMeal = { ...mealAt(1, 'ramen'), foodName: undefined } as unknown as MealRecord
    await repo.saveMealAndCard(legacyMeal, cardAt(1))

    expect((await repo.listCards())[0]?.meal.foodName).toBe('라면')
    expect(await repo.getHistory()).toEqual({
      foodTypes: ['ramen'],
      foodNames: ['라면'],
      categories: ['meal'],
    })
    expect((await repo.getEntry(legacyMeal.id))?.meal.foodName).toBe('라면')
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

  it('saves a retried meal bundle without duplicating its reward', async () => {
    const repo = createFoodexRepository(databaseName)
    const reward = {
      key: 'background:sunny-picnic',
      id: 'reward-1',
      rewardType: 'background' as const,
      rewardId: 'sunny-picnic',
      sourceType: 'set' as const,
      sourceId: 'sunny-bites',
      unlockedAt: 1,
    }

    await repo.saveMealAndCard(mealAt(1), cardAt(1), [reward])
    await repo.saveMealAndCard(mealAt(1), cardAt(1), [reward])

    expect(await repo.listCards()).toHaveLength(1)
    expect((await repo.listRewards()).filter((item) => item.key === reward.key)).toHaveLength(1)
  })

  it('stores dialogue history and experience settings in the V4 database', async () => {
    const repo = createFoodexRepository(databaseName)
    const settings: ExperienceSettings = {
      soundEnabled: false,
      musicEnabled: true,
      hapticsEnabled: false,
      reducedMotion: true,
    }
    await repo.saveDialogueHistory({
      id: 'history-1',
      dialogueId: 'first-warm-discovery',
      eventId: 'first-discovery',
      openingId: 'first-find',
      modifierId: 'warm-bowl',
      usedAt: 10,
    })
    await repo.saveExperienceSettings(settings)

    expect(await repo.listDialogueHistory()).toEqual([
      expect.objectContaining({ id: 'history-1', eventId: 'first-discovery' }),
    ])
    expect(await repo.getExperienceSettings()).toEqual(settings)
  })

  it('returns safe default experience settings before a preference is saved', async () => {
    const repo = createFoodexRepository(databaseName)
    expect(await repo.getExperienceSettings()).toEqual({
      soundEnabled: true,
      musicEnabled: false,
      hapticsEnabled: true,
      reducedMotion: false,
    })
  })

  it('stores a meal coin transaction atomically and deduplicates its stable key', async () => {
    const repo = createFoodexRepository(databaseName)
    const coinTransaction: CoinTransaction = {
      id: 'coin-1',
      key: 'meal:meal-1:coins',
      kind: 'meal-earned',
      amount: 5,
      mealId: 'meal-1',
      createdAt: 1,
    }

    await repo.saveMealAndCard(mealAt(1), cardAt(1), [], coinTransaction)
    await repo.saveMealAndCard(mealAt(1), cardAt(1), [], coinTransaction)

    expect(await repo.listCoinTransactions()).toEqual([coinTransaction])
    expect(await repo.getCoinBalance()).toBe(5)
  })

  it('purchases a product with one atomic debit and owned reward', async () => {
    const repo = createFoodexRepository(databaseName)
    const product = SHOP_PRODUCTS[0]
    await repo.saveMealAndCard(mealAt(1), cardAt(1), [], {
      id: 'coin-1',
      key: 'meal:meal-1:coins',
      kind: 'meal-earned',
      amount: product.price,
      mealId: 'meal-1',
      createdAt: 1,
    })

    const reward = await repo.purchaseProduct(product, 'purchase-1', 2)

    expect(reward).toEqual(expect.objectContaining({
      key: `background:${product.id}`,
      rewardId: product.id,
      sourceType: 'shop',
    }))
    expect(await repo.getCoinBalance()).toBe(0)
    expect(await repo.listRewards()).toContainEqual(reward)
    await expect(repo.purchaseProduct(product, 'purchase-2', 3)).rejects.toThrow('already-owned')
  })

  it('does not create a reward or debit when the wallet is short', async () => {
    const repo = createFoodexRepository(databaseName)
    const product = SHOP_PRODUCTS[0]

    await expect(repo.purchaseProduct(product, 'purchase-1', 1)).rejects.toThrow('insufficient-coins')
    expect(await repo.getCoinBalance()).toBe(0)
    expect(await repo.listRewards()).toEqual([])
    expect(await repo.listCoinTransactions()).toEqual([])
  })
})
