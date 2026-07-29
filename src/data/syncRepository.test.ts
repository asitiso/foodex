import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FoodCard, MealRecord } from '../domain/types'
import { createFoodexRepository, deleteFoodexDatabase } from './foodexDb'
import type { UserReward } from './foodexDb'
import { createSyncRepository } from './syncRepository'

const databaseName = 'foodex-sync-test'
const meal: MealRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  imageData: 'data:image/jpeg;base64,dGVzdA==',
  foodType: 'fruit',
  amount: 'half',
  recordedAt: 1,
}
const card: FoodCard = {
  id: '22222222-2222-4222-8222-222222222222',
  mealId: meal.id,
  catalogId: 'fruit',
  name: '햇살 과일단',
  rarity: 'rare',
  quote: 'test',
  xp: 20,
  isNew: true,
  regionId: 'snack-island',
  seasonId: 'summer',
  evolutionStage: 1,
  createdAt: 1,
}
const reward: UserReward = {
  key: 'background:sunny-picnic',
  id: '33333333-3333-4333-8333-333333333333',
  rewardType: 'background',
  rewardId: 'sunny-picnic',
  sourceType: 'set',
  sourceId: 'sunny-bites',
  unlockedAt: 1,
}

function createRemote(options: { fail?: boolean } = {}) {
  return {
    uploadMealPhoto: vi.fn(async () => {
      if (options.fail) throw new Error('offline')
      return `user-1/${meal.id}/original.jpg`
    }),
    upsertMealBundle: vi.fn(async () => {
      if (options.fail) throw new Error('offline')
    }),
  }
}

describe('local-first synchronization', () => {
  beforeEach(() => deleteFoodexDatabase(databaseName))

  it('keeps the meal locally and queued when remote synchronization fails', async () => {
    const local = createFoodexRepository(databaseName)
    const repository = createSyncRepository(local, createRemote({ fail: true }))

    await repository.saveMealAndCard(meal, card, [reward])

    expect(await local.listCards()).toHaveLength(1)
    expect(await local.listRewards()).toHaveLength(1)
    await vi.waitFor(async () => {
      expect(await local.listPendingSync()).toEqual([
        expect.objectContaining({ mealId: meal.id, attempts: 1 }),
      ])
    })
  })

  it('returns after the local commit without waiting for a slow remote upload', async () => {
    let finishUpload!: (path: string) => void
    const upload = new Promise<string>((resolve) => {
      finishUpload = resolve
    })
    const remote = {
      uploadMealPhoto: vi.fn(() => upload),
      upsertMealBundle: vi.fn(async () => undefined),
    }
    const repository = createSyncRepository(createFoodexRepository(databaseName), remote)
    let saved = false
    const saving = repository.saveMealAndCard(meal, card).then(() => {
      saved = true
    })

    await vi.waitFor(() => expect(remote.uploadMealPhoto).toHaveBeenCalledOnce())
    await Promise.resolve()
    const returnedBeforeUpload = saved
    finishUpload(`user-1/${meal.id}/original.jpg`)
    await saving

    expect(returnedBeforeUpload).toBe(true)
  })

  it('clears completed work and does not repeat it on a second sync pass', async () => {
    const local = createFoodexRepository(databaseName)
    const remote = createRemote()
    const repository = createSyncRepository(local, remote)
    await repository.saveMealAndCard(meal, card, [reward])

    await repository.syncPending()

    expect(remote.upsertMealBundle).toHaveBeenCalledTimes(1)
    expect(await local.listPendingSync()).toEqual([])
  })

  it('marks legacy migration complete only after all queued records sync', async () => {
    const local = createFoodexRepository(databaseName)
    await local.saveMealAndCard(meal, card)
    const repository = createSyncRepository(local, createRemote())

    await repository.migrateLegacyData()

    expect(await local.getSetting('migration_complete')).toBe('true')
    expect(await local.listPendingSync()).toEqual([])
  })
})
