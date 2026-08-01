import type { FoodCard, MealRecord } from '../domain/types'
import type {
  LocalFoodexRepository,
  SyncQueueItem,
  UserReward,
} from './foodexDb'
import type { DialogueHistoryItem } from '../domain/dialogueEngine'
import type { CoinTransaction } from '../domain/coinWallet'
import type { ShopProduct } from '../domain/shopCatalog'

interface RemoteSyncRepository {
  uploadMealPhoto(mealId: string, imageData: string): Promise<string>
  upsertMealBundle(
    meal: MealRecord,
    card: FoodCard,
    rewards: UserReward[],
    photoPath: string | null,
  ): Promise<void>
  upsertDialogueHistory?(item: DialogueHistoryItem): Promise<void>
  claimMealCoins?(
    mealId: string,
    transactionKey: string,
  ): Promise<{ balance: number; awarded: number; transactionKey: string }>
  purchaseShopProduct?(
    productId: string,
    transactionKey: string,
  ): Promise<{ balance: number; transactionKey: string; reward: UserReward }>
}

export function createSyncRepository(
  local: LocalFoodexRepository,
  remote?: RemoteSyncRepository,
) {
  const inFlight = new Map<string, Promise<void>>()

  async function syncItem(item: SyncQueueItem) {
    if (!remote) return
    const entry = await local.getEntry(item.mealId)
    if (!entry) {
      await local.markSynced(item.mealId)
      return
    }

    try {
      const rewards = await local.getRewards(item.rewardKeys ?? [])
      const photoPath = entry.meal.imageData
        ? await remote.uploadMealPhoto(entry.meal.id, entry.meal.imageData)
        : null
      await remote.upsertMealBundle(entry.meal, entry.card, rewards, photoPath)
      if (item.coinTransactionKey) {
        if (!remote.claimMealCoins) throw new Error('coin-sync-unavailable')
        await remote.claimMealCoins(entry.meal.id, item.coinTransactionKey)
      }
      await local.markSynced(item.mealId)
    } catch (error) {
      await local.enqueueSync({
        ...item,
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : 'sync-failed',
      })
    }
  }

  function scheduleSync(item: SyncQueueItem) {
    const existing = inFlight.get(item.mealId)
    if (existing) return existing
    const syncing = syncItem(item).finally(() => inFlight.delete(item.mealId))
    inFlight.set(item.mealId, syncing)
    return syncing
  }

  async function syncPending() {
    const pending = await local.listPendingSync()
    for (const item of pending) await scheduleSync(item)
  }

  return {
    ...local,

    async saveMealAndCard(
      meal: MealRecord,
      card: FoodCard,
      rewards: UserReward[] = [],
      coinTransaction?: CoinTransaction,
    ) {
      const existingRewardKeys = new Set(
        (await local.getRewards(rewards.map((reward) => reward.key))).map((reward) => reward.key),
      )
      const newRewards = rewards.filter((reward) => !existingRewardKeys.has(reward.key))
      await local.saveMealAndCard(meal, card, newRewards, coinTransaction)
      const item: SyncQueueItem = {
        kind: 'meal-card',
        mealId: meal.id,
        attempts: 0,
        rewardKeys: newRewards.map((reward) => reward.key),
        ...(coinTransaction ? { coinTransactionKey: coinTransaction.key } : {}),
      }
      await local.enqueueSync(item)
      void scheduleSync(item)
    },

    async saveDialogueHistory(item: DialogueHistoryItem) {
      await local.saveDialogueHistory(item)
      if (remote?.upsertDialogueHistory) {
        void remote.upsertDialogueHistory(item).catch(() => undefined)
      }
    },

    syncPending,

    async migrateLegacyData() {
      if (await local.getSetting('migration_complete') === 'true') return
      const entries = await local.listCards()
      const pendingIds = new Set((await local.listPendingSync()).map((item) => item.mealId))
      for (const { meal } of entries) {
        if (!pendingIds.has(meal.id)) {
          await local.enqueueSync({ kind: 'meal-card', mealId: meal.id, attempts: 0 })
        }
      }
      await syncPending()
      if ((await local.listPendingSync()).length === 0) {
        await local.setSetting('migration_complete', 'true')
      }
    },

    async retryPhoto(mealId: string) {
      const item = (await local.listPendingSync()).find((candidate) => candidate.mealId === mealId)
      if (item) await syncItem(item)
    },

    async purchaseShopProduct(product: ShopProduct) {
      if (!remote?.purchaseShopProduct) throw new Error('shop-offline')
      const purchaseId = crypto.randomUUID()
      const transactionKey = `shop:${purchaseId}`
      await remote.purchaseShopProduct(product.id, transactionKey)
      return local.purchaseProduct(product, purchaseId, Date.now())
    },
  }
}

export type SyncFoodexRepository = ReturnType<typeof createSyncRepository>
