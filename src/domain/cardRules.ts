import { AMOUNT_META, FOOD_META } from './types'
import type { FoodCard, FoodHistory, FoodType, MealAmount, Rarity } from './types'
import { catalogForFoodType } from './v3Content'
import { FOOD_CATALOG } from './foodCatalog'
import type { FoodDefinition } from './foodCatalog'
import { composeCardCopy } from './cardComposer'

export function xpForAmount(amount: MealAmount): number {
  return AMOUNT_META[amount].xp
}

export function rarityForFood(foodType: FoodType, foodName: string, history: FoodHistory): Rarity {
  if (history.foodNames.includes(foodName)) {
    return 'common'
  }

  if (history.categories.includes(FOOD_META[foodType].category)) {
    return 'rare'
  }

  return 'epic'
}

export function createCard(
  input: { mealId: string; foodType: FoodType; foodName: string; amount: MealAmount; now: number; rewardSource?: 'season' | 'collection' },
  history: FoodHistory,
): FoodCard {
  const rarity = input.rewardSource ? 'legendary' : rarityForFood(input.foodType, input.foodName, history)
  const discoveryBonus = rarity === 'common' ? 0 : 10
  const rewardBonus = rarity === 'legendary' ? 10 : 0
  const catalog = catalogForFoodType(input.foodType)
  const food: FoodDefinition = FOOD_CATALOG.find((candidate) => candidate.name === input.foodName) ?? {
    id: input.foodName,
    name: input.foodName,
    aliases: [],
    foodType: input.foodType,
    flavor: 'neutral',
    periods: ['morning', 'lunch', 'dinner', 'snack'],
    tags: ['other'],
  }
  const copy = composeCardCopy({ food, rarity, seed: input.mealId })

  return {
    id: input.mealId,
    mealId: input.mealId,
    catalogId: catalog.id,
    name: copy.name,
    rarity,
    quote: copy.quote,
    xp: xpForAmount(input.amount) + discoveryBonus + rewardBonus,
    isNew: rarity !== 'common',
    regionId: catalog.regionId,
    seasonId: catalog.seasonId,
    evolutionStage: 1,
    createdAt: input.now,
  }
}
