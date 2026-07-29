import { AMOUNT_META, FOOD_META } from './types'
import type { FoodCard, FoodHistory, FoodType, MealAmount, Rarity } from './types'
import { catalogForFoodType } from './v3Content'

export function xpForAmount(amount: MealAmount): number {
  return AMOUNT_META[amount].xp
}

export function rarityForFood(foodType: FoodType, history: FoodHistory): Rarity {
  if (history.foodTypes.includes(foodType)) {
    return 'common'
  }

  if (history.categories.includes(FOOD_META[foodType].category)) {
    return 'rare'
  }

  return 'epic'
}

export function createCard(
  input: { mealId: string; foodType: FoodType; amount: MealAmount; now: number; rewardSource?: 'season' | 'collection' },
  history: FoodHistory,
): FoodCard {
  const variants = FOOD_META[input.foodType].variants
  const variant = variants[input.now % variants.length]
  const rarity = input.rewardSource ? 'legendary' : rarityForFood(input.foodType, history)
  const discoveryBonus = rarity === 'common' ? 0 : 10
  const rewardBonus = rarity === 'legendary' ? 10 : 0
  const catalog = catalogForFoodType(input.foodType)

  return {
    id: `card-${input.mealId}`,
    mealId: input.mealId,
    catalogId: catalog.id,
    name: variant.name,
    rarity,
    quote: variant.quote,
    xp: xpForAmount(input.amount) + discoveryBonus + rewardBonus,
    isNew: rarity !== 'common',
    regionId: catalog.regionId,
    seasonId: catalog.seasonId,
    evolutionStage: 1,
    createdAt: input.now,
  }
}
