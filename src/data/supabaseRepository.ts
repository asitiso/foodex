import type { SupabaseClient } from '@supabase/supabase-js'
import type { FoodCard, MealRecord } from '../domain/types'
import type { UserReward } from './foodexDb'
import type { DialogueHistoryItem } from '../domain/dialogueEngine'

export function dataUrlToBlob(dataUrl: string) {
  const [header, payload] = dataUrl.split(',')
  if (!header || !payload) throw new Error('invalid-image-data')
  const mime = header.match(/^data:(.*?);base64$/)?.[1] ?? 'image/jpeg'
  const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0))
  return { blob: new Blob([bytes], { type: mime }), mime }
}

function extensionForMime(mime: string) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

function throwIfError(result: { error: unknown }) {
  if (result.error) throw result.error
}

export function createSupabaseRepository(client: SupabaseClient, userId: string) {
  return {
    async uploadMealPhoto(mealId: string, imageData: string) {
      const { blob, mime } = dataUrlToBlob(imageData)
      const path = `${userId}/${mealId}/original.${extensionForMime(mime)}`
      const result = await client.storage.from('meal-photos').upload(path, blob, {
        contentType: mime,
        upsert: true,
      })
      throwIfError(result)
      return path
    },

    async upsertMealBundle(
      meal: MealRecord,
      card: FoodCard,
      rewards: UserReward[],
      photoPath: string | null,
    ) {
      const mealPayload = {
        id: meal.id,
        user_id: userId,
        food_type: meal.foodType,
        food_name: meal.foodName,
        amount: meal.amount,
        recorded_at: new Date(meal.recordedAt).toISOString(),
        photo_path: photoPath,
        client_created_at: new Date(meal.recordedAt).toISOString(),
      }
      const mealResult = await client.from('meal_records').upsert(mealPayload, { onConflict: 'id' })
      const missingFoodName = mealResult.error
        && typeof mealResult.error === 'object'
        && mealResult.error !== null
        && 'code' in mealResult.error
        && mealResult.error.code === 'PGRST204'
        && 'message' in mealResult.error
        && typeof mealResult.error.message === 'string'
        && mealResult.error.message.includes('food_name')
      if (missingFoodName) {
        const { food_name: _foodName, ...legacyMealPayload } = mealPayload
        const legacyResult = await client.from('meal_records').upsert(legacyMealPayload, { onConflict: 'id' })
        throwIfError(legacyResult)
      } else {
        throwIfError(mealResult)
      }

      const cardResult = await client.from('food_cards').upsert({
        id: card.id,
        user_id: userId,
        meal_id: meal.id,
        catalog_id: card.catalogId,
        name: card.name,
        rarity: card.rarity,
        quote: card.quote,
        xp: card.xp,
        region_id: card.regionId,
        season_id: card.seasonId ?? null,
        evolution_stage: card.evolutionStage,
        skin_id: card.skinId ?? null,
        background_id: card.backgroundId ?? null,
        created_at: new Date(card.createdAt).toISOString(),
      }, { onConflict: 'user_id,meal_id' })
      throwIfError(cardResult)

      if (rewards.length > 0) {
        const rewardResult = await client.from('user_rewards').upsert(
          rewards.map((reward) => ({
            id: reward.id,
            user_id: userId,
            reward_type: reward.rewardType,
            reward_id: reward.rewardId,
            source_type: reward.sourceType,
            source_id: reward.sourceId,
            unlocked_at: new Date(reward.unlockedAt).toISOString(),
          })),
          {
            ignoreDuplicates: true,
            onConflict: 'user_id,reward_type,reward_id',
          },
        )
        throwIfError(rewardResult)
      }
    },

    async upsertDialogueHistory(item: DialogueHistoryItem) {
      const result = await client.from('dialogue_history').upsert({
        id: item.id,
        user_id: userId,
        dialogue_id: item.dialogueId,
        event_id: item.eventId,
        opening_id: item.openingId,
        modifier_id: item.modifierId,
        used_at: new Date(item.usedAt).toISOString(),
      }, { onConflict: 'user_id,id' })
      throwIfError(result)
    },

    async claimMealCoins(mealId: string, transactionKey: string) {
      const result = await client.rpc('claim_meal_coins', {
        p_meal_id: mealId,
        p_transaction_key: transactionKey,
      })
      throwIfError(result)
      const row = result.data?.[0]
      if (!row) throw new Error('coin-claim-empty')
      return {
        balance: row.balance as number,
        awarded: row.awarded as number,
        transactionKey: row.transaction_key as string,
      }
    },

    async purchaseShopProduct(productId: string, transactionKey: string) {
      const result = await client.rpc('purchase_shop_product', {
        p_product_id: productId,
        p_transaction_key: transactionKey,
      })
      throwIfError(result)
      const row = result.data?.[0]
      if (!row) throw new Error('shop-purchase-empty')
      const purchasedAt = Date.now()
      const reward: UserReward = {
        key: `${row.reward_type}:${row.product_id}`,
        id: row.reward_id,
        rewardType: row.reward_type,
        rewardId: row.product_id,
        sourceType: 'shop',
        sourceId: row.product_id,
        unlockedAt: purchasedAt,
      }
      return {
        balance: row.balance as number,
        transactionKey: row.transaction_key as string,
        reward,
      }
    },
  }
}

export type SupabaseFoodexRepository = ReturnType<typeof createSupabaseRepository>
