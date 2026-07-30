import { describe, expect, it, vi } from 'vitest'
import type { FoodCard, MealRecord } from '../domain/types'
import type { UserReward } from './foodexDb'
import { createSupabaseRepository, dataUrlToBlob } from './supabaseRepository'

const meal: MealRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  imageData: 'data:image/jpeg;base64,dGVzdA==',
  foodType: 'ramen',
  foodName: '라면',
  amount: 'taste',
  recordedAt: 1,
}

const card: FoodCard = {
  id: '22222222-2222-4222-8222-222222222222',
  mealId: meal.id,
  catalogId: 'ramen',
  name: '불꽃 라면',
  rarity: 'rare',
  quote: 'test',
  xp: 20,
  isNew: true,
  regionId: 'korea',
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

function createClient() {
  const upload = vi.fn().mockResolvedValue({ data: {}, error: null })
  const rpc = vi.fn().mockResolvedValue({ data: [], error: null })
  const operations = new Map<string, { upsert: ReturnType<typeof vi.fn> }>()
  const client = {
    storage: {
      from: vi.fn(() => ({ upload })),
    },
    from: vi.fn((table: string) => {
      const operation = {
        upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }
      operations.set(table, operation)
      return operation
    }),
    rpc,
  }
  return { client, upload, operations, rpc }
}

describe('Supabase Foodex repository', () => {
  it('converts base64 image data into the original bytes and MIME type', async () => {
    const result = dataUrlToBlob('data:image/jpeg;base64,dGVzdA==')
    expect(result.mime).toBe('image/jpeg')
    expect(result.blob.type).toBe('image/jpeg')
    expect(result.blob.size).toBe(4)
  })

  it('uploads a private photo beneath the current user and meal path', async () => {
    const { client, upload } = createClient()
    const repository = createSupabaseRepository(client as never, 'user-1')

    const path = await repository.uploadMealPhoto(meal.id, meal.imageData!)

    expect(path).toBe(`user-1/${meal.id}/original.jpg`)
    expect(client.storage.from).toHaveBeenCalledWith('meal-photos')
    expect(upload).toHaveBeenCalledWith(path, expect.any(Blob), {
      contentType: 'image/jpeg',
      upsert: true,
    })
  })

  it('upserts a meal, card, and rewards with owner ids and conflict keys', async () => {
    const { client, operations } = createClient()
    const repository = createSupabaseRepository(client as never, 'user-1')

    await repository.upsertMealBundle(meal, card, [reward], `user-1/${meal.id}/original.jpg`)

    expect(operations.get('meal_records')?.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: meal.id, user_id: 'user-1', food_name: '라면' }),
      { onConflict: 'id' },
    )
    expect(operations.get('food_cards')?.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ meal_id: meal.id, user_id: 'user-1' }),
      { onConflict: 'user_id,meal_id' },
    )
    expect(operations.get('user_rewards')?.upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ reward_id: 'sunny-picnic', user_id: 'user-1' })],
      { ignoreDuplicates: true, onConflict: 'user_id,reward_type,reward_id' },
    )
  })

  it('upserts dialogue history with the authenticated owner and event', async () => {
    const { client, operations } = createClient()
    const repository = createSupabaseRepository(client as never, 'user-1')

    await repository.upsertDialogueHistory({
      id: '44444444-4444-4444-8444-444444444444',
      dialogueId: 'first-warm-discovery',
      eventId: 'first-discovery',
      openingId: 'first-find',
      modifierId: 'warm-bowl',
      usedAt: 1,
    })

    expect(operations.get('dialogue_history')?.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        dialogue_id: 'first-warm-discovery',
        event_id: 'first-discovery',
        used_at: new Date(1).toISOString(),
      }),
      { onConflict: 'user_id,id' },
    )
  })

  it('retries meal storage without food_name when an older remote schema is still active', async () => {
    const mealUpsert = vi.fn()
      .mockResolvedValueOnce({ error: { code: 'PGRST204', message: "Could not find the 'food_name' column" } })
      .mockResolvedValueOnce({ data: {}, error: null })
    const client = {
      storage: { from: vi.fn(() => ({ upload: vi.fn().mockResolvedValue({ data: {}, error: null }) })) },
      from: vi.fn((table: string) => ({ upsert: table === 'meal_records' ? mealUpsert : vi.fn().mockResolvedValue({ data: {}, error: null }) })),
    }
    const repository = createSupabaseRepository(client as never, 'user-1')

    await repository.upsertMealBundle(meal, card, [], null)

    expect(mealUpsert).toHaveBeenCalledTimes(2)
    expect(mealUpsert.mock.calls[1][0]).not.toHaveProperty('food_name')
  })

  it('claims meal coins through the server-owned reward rule', async () => {
    const { client, rpc } = createClient()
    rpc.mockResolvedValueOnce({
      data: [{ balance: 13, awarded: 8, transaction_key: `meal:${meal.id}:coins` }],
      error: null,
    })
    const repository = createSupabaseRepository(client as never, 'user-1')

    await expect(repository.claimMealCoins(meal.id, `meal:${meal.id}:coins`)).resolves.toEqual({
      balance: 13,
      awarded: 8,
      transactionKey: `meal:${meal.id}:coins`,
    })
    expect(rpc).toHaveBeenCalledWith('claim_meal_coins', {
      p_meal_id: meal.id,
      p_transaction_key: `meal:${meal.id}:coins`,
    })
  })

  it('purchases a shop product without sending a client-controlled price', async () => {
    const { client, rpc } = createClient()
    rpc.mockResolvedValueOnce({
      data: [{
        balance: 10,
        reward_id: '55555555-5555-4555-8555-555555555555',
        reward_type: 'background',
        product_id: 'shop-sunroom',
        transaction_key: 'shop:44444444-4444-4444-8444-444444444444',
      }],
      error: null,
    })
    const repository = createSupabaseRepository(client as never, 'user-1')

    const result = await repository.purchaseShopProduct(
      'shop-sunroom',
      'shop:44444444-4444-4444-8444-444444444444',
    )

    expect(rpc).toHaveBeenCalledWith('purchase_shop_product', {
      p_product_id: 'shop-sunroom',
      p_transaction_key: 'shop:44444444-4444-4444-8444-444444444444',
    })
    expect(result).toEqual(expect.objectContaining({
      balance: 10,
      reward: expect.objectContaining({
        rewardId: 'shop-sunroom',
        sourceType: 'shop',
      }),
    }))
  })
})
