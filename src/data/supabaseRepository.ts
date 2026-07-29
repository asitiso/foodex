import type { SupabaseClient } from '@supabase/supabase-js'
import type { FoodCard, MealRecord } from '../domain/types'
import type { UserReward } from './foodexDb'

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
      const mealResult = await client.from('meal_records').upsert({
        id: meal.id,
        user_id: userId,
        food_type: meal.foodType,
        amount: meal.amount,
        recorded_at: new Date(meal.recordedAt).toISOString(),
        photo_path: photoPath,
        client_created_at: new Date(meal.recordedAt).toISOString(),
      }, { onConflict: 'id' })
      throwIfError(mealResult)

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
  }
}

export type SupabaseFoodexRepository = ReturnType<typeof createSupabaseRepository>
