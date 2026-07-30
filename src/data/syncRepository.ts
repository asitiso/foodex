import type { FoodCard, MealRecord } from '../domain/types'
import type {
  LocalFoodexRepository,
  SyncQueueItem,
  UserReward,
} from './foodexDb'
import type { DialogueHistoryItem } from '../domain/dialogueEngine'

interface RemoteSyncRepository {
  uploadMealPhoto(mealId: string, imageData: string): Promise<string>
  upsertMealBundle(
    meal: MealRecord,
    card: FoodCard,
    rewards: UserReward[],
    photoPath: string | null,
  ): Promise<void>
  upsertDialogueHistory?(item: DialogueHistoryItem): Promise<void>
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

    async saveMealAndCard(meal: MealRecord, card: FoodCard, rewards: UserReward[] = []) {
      await local.saveMealAndCard(meal, card)
      await local.saveRewards(rewards)
      const item: SyncQueueItem = {
        kind: 'meal-card',
        mealId: meal.id,
        attempts: 0,
        rewardKeys: rewards.map((reward) => reward.key),
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
  }
}

export type SyncFoodexRepository = ReturnType<typeof createSyncRepository>
