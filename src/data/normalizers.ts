import type { FoodCard, FoodType } from '../domain/types'
import { catalogForFoodType } from '../domain/v3Content'

type V3CardFields = 'catalogId' | 'regionId' | 'seasonId' | 'evolutionStage' | 'skinId' | 'backgroundId'
export type LegacyOrV3FoodCard = Omit<FoodCard, V3CardFields>
  & Partial<Pick<FoodCard, V3CardFields>>

export function normalizeCard(card: LegacyOrV3FoodCard, foodType: FoodType): FoodCard {
  const catalog = catalogForFoodType(foodType)

  return {
    ...card,
    catalogId: card.catalogId ?? catalog.id,
    regionId: card.regionId ?? catalog.regionId,
    seasonId: card.seasonId ?? catalog.seasonId,
    evolutionStage: card.evolutionStage ?? 1,
  }
}
