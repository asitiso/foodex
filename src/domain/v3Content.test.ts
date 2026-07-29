import { describe, expect, it } from 'vitest'
import {
  COLLECTION_SETS,
  COSMETICS,
  FOOD_CATALOG,
  FOOD_EVENTS,
  FUSION_RECIPES,
  REGIONS,
} from './v3Content'

describe('V3 content catalog', () => {
  it('references only existing food, region, and cosmetic ids', () => {
    const foodIds = new Set(FOOD_CATALOG.map((food) => food.id))
    const regionIds = new Set(REGIONS.map((region) => region.id))
    const cosmeticIds = new Set(COSMETICS.map((cosmetic) => cosmetic.id))

    FOOD_CATALOG.forEach((food) => expect(regionIds.has(food.regionId)).toBe(true))
    COLLECTION_SETS.forEach((set) => {
      set.requiredCatalogIds.forEach((id) => expect(foodIds.has(id)).toBe(true))
      expect(cosmeticIds.has(set.reward.rewardId)).toBe(true)
    })
    FUSION_RECIPES.forEach((recipe) => {
      expect(foodIds.has(recipe.leftCatalogId)).toBe(true)
      expect(foodIds.has(recipe.rightCatalogId)).toBe(true)
    })
    FOOD_EVENTS.forEach((event) => expect(foodIds.has(event.rewardCatalogId)).toBe(true))
  })

  it('has unique ids and order-independent fusion pairs', () => {
    const ids = FOOD_CATALOG.map((food) => food.id)
    const pairs = FUSION_RECIPES.map((recipe) =>
      [recipe.leftCatalogId, recipe.rightCatalogId].sort().join(':'),
    )

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(pairs).size).toBe(pairs.length)
  })
})
