import type {
  CosmeticType,
  FoodType,
  Rarity,
  RegionId,
  SeasonId,
} from './types'

export interface FoodCatalogItem {
  id: string
  foodType: FoodType
  label: string
  regionId: RegionId
  seasonId?: SeasonId
  rarity: Rarity
}

export interface CollectionSet {
  id: string
  title: string
  requiredCatalogIds: readonly string[]
  reward: { rewardType: CosmeticType; rewardId: string }
}

export interface FusionRecipe {
  id: string
  leftCatalogId: string
  rightCatalogId: string
  resultName: string
  resultRarity: Rarity
}

export interface CosmeticItem {
  id: string
  type: CosmeticType
  title: string
  className: string
}

export interface FoodEvent {
  id: string
  title: string
  startsAt: string
  endsAt: string
  requiredCatalogIds: readonly string[]
  rewardCatalogId: string
}

export const REGIONS = [
  { id: 'korea', title: '한식마을' },
  { id: 'china', title: '중화항구' },
  { id: 'japan', title: '일식숲' },
  { id: 'west', title: '양식언덕' },
  { id: 'snack-island', title: '간식섬' },
] as const

export const FOOD_CATALOG: readonly FoodCatalogItem[] = [
  { id: 'ramen', foodType: 'ramen', label: '불꽃 라면', regionId: 'korea', rarity: 'rare' },
  { id: 'rice', foodType: 'rice', label: '든든 밥방패', regionId: 'korea', rarity: 'common' },
  { id: 'fruit', foodType: 'fruit', label: '햇살 과일단', regionId: 'snack-island', seasonId: 'summer', rarity: 'rare' },
  { id: 'bread', foodType: 'bread', label: '폭신 빵구름', regionId: 'west', seasonId: 'winter', rarity: 'common' },
  { id: 'side', foodType: 'side', label: '든든 반찬대', regionId: 'korea', rarity: 'common' },
  { id: 'snack', foodType: 'snack', label: '반짝 간식별', regionId: 'snack-island', rarity: 'common' },
  { id: 'drink', foodType: 'drink', label: '찰랑 음료물결', regionId: 'snack-island', seasonId: 'summer', rarity: 'common' },
  { id: 'dumpling', foodType: 'dumpling', label: '구름 만두', regionId: 'china', seasonId: 'winter', rarity: 'rare' },
  { id: 'sushi', foodType: 'sushi', label: '초밥 닌자', regionId: 'japan', seasonId: 'spring', rarity: 'epic' },
  { id: 'pasta', foodType: 'pasta', label: '파스타 마법사', regionId: 'west', seasonId: 'autumn', rarity: 'rare' },
  { id: 'other', foodType: 'other', label: '새로운 발견대', regionId: 'west', rarity: 'common' },
] as const

export const COSMETICS: readonly CosmeticItem[] = [
  { id: 'street-festival', type: 'skin', title: '분식 축제 스킨', className: 'skin-street-festival' },
  { id: 'sunny-picnic', type: 'background', title: '햇살 소풍 배경', className: 'background-sunny-picnic' },
  { id: 'cozy-morning', type: 'background', title: '포근한 아침 배경', className: 'background-cozy-morning' },
] as const

export const COLLECTION_SETS: readonly CollectionSet[] = [
  { id: 'street-team', title: '분식 탐험대', requiredCatalogIds: ['ramen', 'rice', 'snack'], reward: { rewardType: 'skin', rewardId: 'street-festival' } },
  { id: 'sunny-bites', title: '햇살 한입단', requiredCatalogIds: ['fruit', 'drink'], reward: { rewardType: 'background', rewardId: 'sunny-picnic' } },
  { id: 'cozy-breakfast', title: '포근한 아침', requiredCatalogIds: ['bread', 'fruit', 'drink'], reward: { rewardType: 'background', rewardId: 'cozy-morning' } },
] as const

export const FUSION_RECIPES: readonly FusionRecipe[] = [
  { id: 'ramen-rice-hero', leftCatalogId: 'ramen', rightCatalogId: 'rice', resultName: '라밥 용사', resultRarity: 'epic' },
  { id: 'fruit-drink-fairy', leftCatalogId: 'fruit', rightCatalogId: 'drink', resultName: '과일소다 요정', resultRarity: 'legendary' },
  { id: 'bread-fruit-cloud', leftCatalogId: 'bread', rightCatalogId: 'fruit', resultName: '과일샌드 구름', resultRarity: 'epic' },
] as const

export const FOOD_EVENTS: readonly FoodEvent[] = [
  {
    id: 'summer-table-2026',
    title: '2026 여름 식탁',
    startsAt: '2026-06-01T00:00:00+09:00',
    endsAt: '2026-08-31T23:59:59+09:00',
    requiredCatalogIds: ['fruit', 'drink', 'ramen'],
    rewardCatalogId: 'fruit',
  },
] as const

export const SEASONS: readonly SeasonId[] = ['spring', 'summer', 'autumn', 'winter']

export function catalogForFoodType(foodType: FoodType): FoodCatalogItem {
  return FOOD_CATALOG.find((item) => item.foodType === foodType)
    ?? FOOD_CATALOG.find((item) => item.id === 'other')!
}
