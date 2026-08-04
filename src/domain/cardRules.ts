import { AMOUNT_META, FOOD_META } from './types'
import type { FoodCard, FoodHistory, FoodType, MealAmount, Rarity } from './types'
import { catalogForFoodType } from './v3Content'
import { seasonForDate } from './v3Progression'
import { FOOD_CATALOG } from './foodCatalog'
import type { FoodDefinition } from './foodCatalog'
import { composeCardCopy, hash, rollStat } from './cardComposer'
import { mealSlot } from './mealOutcome'
import { todaysWeather } from './inGameWeather'

export function xpForAmount(amount: MealAmount): number {
  return AMOUNT_META[amount].xp
}

function normalizeFoodName(value: string) {
  return value
    .toLocaleLowerCase('ko-KR')
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
}

export function rarityForFood(foodType: FoodType, foodName: string, history: FoodHistory): Rarity {
  const normalizedName = normalizeFoodName(foodName)
  const hasSeenFoodName = history.foodNames.some((knownName) => normalizeFoodName(knownName) === normalizedName)

  if (hasSeenFoodName) {
    return 'common'
  }

  if (history.foodTypes.includes(foodType)) {
    return 'rare'
  }

  if (history.categories.includes(FOOD_META[foodType].category)) {
    return 'rare'
  }

  if (history.foodNames.length === 0 && history.categories.length === 0) {
    return 'epic'
  }

  return 'rare'
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
  const stats = {
    power: rollStat(`${input.mealId}:power`),
    luck: rollStat(`${input.mealId}:luck`),
    warmth: rollStat(`${input.mealId}:warmth`),
  }
  // Rolled independently of rarity so a common card can be just as shiny as a legendary one.
  const isShiny = hash(`${input.mealId}:shiny`) % 20 === 0
  const secretTags: string[] = []
  if (mealSlot(input.now) === 'late') {
    secretTags.push('midnight')
  }
  if (catalog.seasonId && catalog.seasonId === seasonForDate(input.now)) {
    secretTags.push('seasonal')
  }
  // 'rainbow' is the special/rare in-game weather value; treat it as a "lucky day" bonus.
  if (todaysWeather(input.now) === 'rainbow') {
    secretTags.push('rainy')
  }
  // TODO(v7 phase 2/3): 'combo' secret tag (same-day tag variety, see mealOutcome.ts's
  // `combo`) is deferred — createCard() only receives a summarized FoodHistory
  // (foodTypes/foodNames/categories, no recordedAt), not same-day MealRecords, so
  // detecting a same-day combo here would require plumbing full meal history through
  // App.tsx's completeRecord and the repository layer, which is out of scope for the
  // domain-only phase.

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
    stats,
    isShiny,
    secretTags,
  }
}
