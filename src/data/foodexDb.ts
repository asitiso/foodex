import { deleteDB, openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import { FOOD_META } from '../domain/types'
import type { FoodCard, FoodHistory, MealRecord } from '../domain/types'
import type { LegacyOrV3FoodCard } from './normalizers'
import { normalizeCard } from './normalizers'
import type { DialogueHistoryItem } from '../domain/dialogueEngine'
import type { ExperienceSettings } from '../domain/companionTypes'
import { validatePurchase, walletBalance } from '../domain/coinWallet'
import type { CoinTransaction } from '../domain/coinWallet'
import type { ShopProduct } from '../domain/shopCatalog'

export interface SyncQueueItem {
  kind: 'meal-card'
  mealId: string
  attempts: number
  lastError?: string
  rewardKeys?: string[]
  coinTransactionKey?: string
}

export interface UserReward {
  key: string
  id: string
  rewardType: 'skin' | 'background' | 'event-card' | 'fusion-card'
  rewardId: string
  sourceType: 'set' | 'event' | 'fusion' | 'shop'
  sourceId: string
  unlockedAt: number
}

export interface FusionRecord {
  id: string
  leftCardId: string
  rightCardId: string
  fusionCatalogId: string
  createdAt: number
}

interface FoodexDatabaseSchema extends DBSchema {
  meals: {
    key: string
    value: MealRecord
  }
  cards: {
    key: string
    value: LegacyOrV3FoodCard
    indexes: { createdAt: number }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
  }
  rewards: {
    key: string
    value: UserReward
  }
  fusions: {
    key: string
    value: FusionRecord
  }
  settings: {
    key: string
    value: { key: string; value: string }
  }
  dialogueHistory: {
    key: string
    value: DialogueHistoryItem
    indexes: { usedAt: number }
  }
  experienceSettings: {
    key: string
    value: ExperienceSettings
  }
  coinTransactions: {
    key: string
    value: CoinTransaction
  }
}

export interface FoodexRepository {
  saveMealAndCard(
    meal: MealRecord,
    card: FoodCard,
    rewards?: UserReward[],
    coinTransaction?: CoinTransaction,
  ): Promise<void>
  listCards(): Promise<Array<{ card: FoodCard; meal: MealRecord }>>
  getHistory(): Promise<FoodHistory>
  getSummary(now: number): Promise<{
    todayCount: number
    discoveredCount: number
    totalXp: number
    lastMealAt?: number
  }>
  saveRewards?(rewards: UserReward[]): Promise<void>
  listRewards?(): Promise<UserReward[]>
  saveFusion?(fusion: FusionRecord): Promise<void>
  updateCard?(card: FoodCard): Promise<void>
  syncPending?(): Promise<void>
  migrateLegacyData?(): Promise<void>
  listDialogueHistory?(): Promise<DialogueHistoryItem[]>
  saveDialogueHistory?(item: DialogueHistoryItem): Promise<void>
  getExperienceSettings?(): Promise<ExperienceSettings>
  saveExperienceSettings?(settings: ExperienceSettings): Promise<void>
}

const DEFAULT_DATABASE_NAME = 'foodex'
export const DEFAULT_EXPERIENCE_SETTINGS: ExperienceSettings = {
  soundEnabled: true,
  musicEnabled: false,
  hapticsEnabled: true,
  reducedMotion: false,
}

function normalizeMeal(meal: MealRecord): MealRecord {
  return meal.foodName
    ? meal
    : { ...meal, foodName: FOOD_META[meal.foodType].label }
}

function openFoodexDatabase(name: string): Promise<IDBPDatabase<FoodexDatabaseSchema>> {
  return openDB<FoodexDatabaseSchema>(name, 4, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('meals')) {
        database.createObjectStore('meals', { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains('cards')) {
        const cards = database.createObjectStore('cards', { keyPath: 'id' })
        cards.createIndex('createdAt', 'createdAt')
      }
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'mealId' })
      }
      if (!database.objectStoreNames.contains('rewards')) {
        database.createObjectStore('rewards', { keyPath: 'key' })
      }
      if (!database.objectStoreNames.contains('fusions')) {
        database.createObjectStore('fusions', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' })
      }
      if (!database.objectStoreNames.contains('dialogueHistory')) {
        const dialogueHistory = database.createObjectStore('dialogueHistory', { keyPath: 'id' })
        dialogueHistory.createIndex('usedAt', 'usedAt')
      }
      if (!database.objectStoreNames.contains('experienceSettings')) {
        database.createObjectStore('experienceSettings')
      }
      if (!database.objectStoreNames.contains('coinTransactions')) {
        database.createObjectStore('coinTransactions', { keyPath: 'key' })
      }
    },
  })
}

export interface LocalFoodexRepository extends FoodexRepository {
  enqueueSync(item: SyncQueueItem): Promise<void>
  listPendingSync(): Promise<SyncQueueItem[]>
  markSynced(mealId: string): Promise<void>
  saveRewards(rewards: UserReward[]): Promise<void>
  listRewards(): Promise<UserReward[]>
  saveFusion(fusion: FusionRecord): Promise<void>
  listFusions(): Promise<FusionRecord[]>
  getSetting(key: string): Promise<string | undefined>
  setSetting(key: string, value: string): Promise<void>
  getEntry(mealId: string): Promise<{ meal: MealRecord; card: FoodCard } | undefined>
  getRewards(keys: readonly string[]): Promise<UserReward[]>
  updateCard(card: FoodCard): Promise<void>
  listDialogueHistory(): Promise<DialogueHistoryItem[]>
  saveDialogueHistory(item: DialogueHistoryItem): Promise<void>
  getExperienceSettings(): Promise<ExperienceSettings>
  saveExperienceSettings(settings: ExperienceSettings): Promise<void>
  listCoinTransactions(): Promise<CoinTransaction[]>
  getCoinTransaction(key: string): Promise<CoinTransaction | undefined>
  getCoinBalance(): Promise<number>
  purchaseProduct(product: ShopProduct, purchaseId: string, purchasedAt: number): Promise<UserReward>
}

async function withDatabase<T>(name: string, action: (database: IDBPDatabase<FoodexDatabaseSchema>) => Promise<T>): Promise<T> {
  const database = await openFoodexDatabase(name)

  try {
    return await action(database)
  } finally {
    database.close()
  }
}

export function createFoodexRepository(databaseName = DEFAULT_DATABASE_NAME): LocalFoodexRepository {
  return {
    async saveMealAndCard(meal, card, rewards = [], coinTransaction) {
      await withDatabase(databaseName, async (database) => {
        const transaction = database.transaction(['meals', 'cards', 'rewards', 'coinTransactions'], 'readwrite')
        await Promise.all([
          transaction.objectStore('meals').put(meal),
          transaction.objectStore('cards').put(card),
          ...rewards.map((reward) => transaction.objectStore('rewards').put(reward)),
          ...(coinTransaction ? [transaction.objectStore('coinTransactions').put(coinTransaction)] : []),
          transaction.done,
        ])
      })
    },

    async listCards() {
      return withDatabase(databaseName, async (database) => {
        const transaction = database.transaction(['cards', 'meals'], 'readonly')
        const [cards, meals] = await Promise.all([
          transaction.objectStore('cards').getAll(),
          transaction.objectStore('meals').getAll(),
          transaction.done,
        ])
        const mealsById = new Map(meals.map(normalizeMeal).map((meal) => [meal.id, meal]))

        return cards
          .flatMap((card) => {
            const meal = mealsById.get(card.mealId)
            return meal ? [{ card: normalizeCard(card, meal.foodType), meal }] : []
          })
          .sort((left, right) => right.card.createdAt - left.card.createdAt)
      })
    },

    async getHistory() {
      return withDatabase(databaseName, async (database) => {
        const meals = (await database.getAll('meals')).map(normalizeMeal)
        const foodTypes = new Set(meals.map((meal) => meal.foodType))
        const foodNames = new Set(meals.map((meal) => meal.foodName))
        const categories = new Set(meals.map((meal) => FOOD_META[meal.foodType].category))

        return {
          foodTypes: [...foodTypes],
          foodNames: [...foodNames],
          categories: [...categories],
        }
      })
    },

    async getSummary(now) {
      return withDatabase(databaseName, async (database) => {
        const [meals, cards] = await Promise.all([
          database.getAll('meals'),
          database.getAll('cards'),
        ])
        const startOfToday = new Date(now).setHours(0, 0, 0, 0)
        const startOfTomorrow = new Date(startOfToday).setDate(new Date(startOfToday).getDate() + 1)
        const mealTimes = meals.map((meal) => meal.recordedAt)
        const foodTypes = new Set(meals.map((meal) => meal.foodType))

        return {
          todayCount: mealTimes.filter((recordedAt) => recordedAt >= startOfToday && recordedAt < startOfTomorrow).length,
          discoveredCount: foodTypes.size,
          totalXp: cards.reduce((total, card) => total + card.xp, 0),
          ...(mealTimes.length > 0 ? { lastMealAt: Math.max(...mealTimes) } : {}),
        }
      })
    },

    async enqueueSync(item) {
      await withDatabase(databaseName, (database) => database.put('syncQueue', item))
    },

    async listPendingSync() {
      return withDatabase(databaseName, (database) => database.getAll('syncQueue'))
    },

    async markSynced(mealId) {
      await withDatabase(databaseName, (database) => database.delete('syncQueue', mealId))
    },

    async saveRewards(rewards) {
      await withDatabase(databaseName, async (database) => {
        const transaction = database.transaction('rewards', 'readwrite')
        await Promise.all([
          ...rewards.map((reward) => transaction.store.put(reward)),
          transaction.done,
        ])
      })
    },

    async listRewards() {
      return withDatabase(databaseName, (database) => database.getAll('rewards'))
    },

    async updateCard(card) {
      await withDatabase(databaseName, (database) => database.put('cards', card))
    },

    async saveFusion(fusion) {
      await withDatabase(databaseName, (database) => database.put('fusions', fusion))
    },

    async listFusions() {
      return withDatabase(databaseName, (database) => database.getAll('fusions'))
    },

    async getSetting(key) {
      const setting = await withDatabase(databaseName, (database) => database.get('settings', key))
      return setting?.value
    },

    async setSetting(key, value) {
      await withDatabase(databaseName, (database) => database.put('settings', { key, value }))
    },

    async getEntry(mealId) {
      return withDatabase(databaseName, async (database) => {
        const transaction = database.transaction(['meals', 'cards'], 'readonly')
        const [meal, cards] = await Promise.all([
          transaction.objectStore('meals').get(mealId),
          transaction.objectStore('cards').getAll(),
          transaction.done,
        ])
        const card = cards.find((candidate) => candidate.mealId === mealId)
        return meal && card
          ? { meal: normalizeMeal(meal), card: normalizeCard(card, meal.foodType) }
          : undefined
      })
    },

    async getRewards(keys) {
      return withDatabase(databaseName, async (database) => {
        const transaction = database.transaction('rewards', 'readonly')
        const rewards = await Promise.all(keys.map((key) => transaction.store.get(key)))
        await transaction.done
        return rewards.filter((reward): reward is UserReward => Boolean(reward))
      })
    },

    async listDialogueHistory() {
      return withDatabase(databaseName, async (database) => {
        const items = await database.getAllFromIndex('dialogueHistory', 'usedAt')
        return items.sort((left, right) => right.usedAt - left.usedAt)
      })
    },

    async saveDialogueHistory(item) {
      await withDatabase(databaseName, (database) => database.put('dialogueHistory', item))
    },

    async getExperienceSettings() {
      return withDatabase(databaseName, async (database) =>
        (await database.get('experienceSettings', 'experience')) ?? DEFAULT_EXPERIENCE_SETTINGS)
    },

    async saveExperienceSettings(settings) {
      await withDatabase(databaseName, (database) =>
        database.put('experienceSettings', settings, 'experience'))
    },

    async listCoinTransactions() {
      return withDatabase(databaseName, (database) => database.getAll('coinTransactions'))
    },

    async getCoinTransaction(key) {
      return withDatabase(databaseName, (database) => database.get('coinTransactions', key))
    },

    async getCoinBalance() {
      return withDatabase(databaseName, async (database) =>
        walletBalance(await database.getAll('coinTransactions')))
    },

    async purchaseProduct(product, purchaseId, purchasedAt) {
      return withDatabase(databaseName, async (database) => {
        const transaction = database.transaction(['coinTransactions', 'rewards'], 'readwrite')
        const coinStore = transaction.objectStore('coinTransactions')
        const rewardStore = transaction.objectStore('rewards')
        const rewardType: UserReward['rewardType'] = product.type === 'background' ? 'background' : 'skin'
        const rewardKey = `${rewardType}:${product.id}`
        const ownedReward = await rewardStore.get(rewardKey)
        const transactions = await coinStore.getAll()
        const validation = validatePurchase(
          walletBalance(transactions),
          product,
          new Set(ownedReward ? [product.id] : []),
        )

        if (!validation.ok) {
          throw new Error(validation.reason === 'owned' ? 'already-owned' : 'insufficient-coins')
        }

        const debit: CoinTransaction = {
          id: purchaseId,
          key: `shop:${purchaseId}`,
          kind: 'shop-spent',
          amount: -product.price,
          productId: product.id,
          createdAt: purchasedAt,
        }
        const reward: UserReward = {
          key: rewardKey,
          id: purchaseId,
          rewardType,
          rewardId: product.id,
          sourceType: 'shop',
          sourceId: product.id,
          unlockedAt: purchasedAt,
        }

        await Promise.all([
          coinStore.put(debit),
          rewardStore.put(reward),
          transaction.done,
        ])
        return reward
      })
    },
  }
}

export function deleteFoodexDatabase(databaseName = DEFAULT_DATABASE_NAME): Promise<void> {
  return deleteDB(databaseName)
}

export const foodexRepository = createFoodexRepository()
