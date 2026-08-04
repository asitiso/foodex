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
  requiredCatalogIds: readonly string[]
  resultName: string
  resultRarity: Rarity
  consumesSources: boolean
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
  { id: 'hansang-royal', type: 'skin', title: '한상 임금님 스킨', className: 'skin-hansang-royal' },
  { id: 'noodle-knight', type: 'skin', title: '만두초밥 기사단 스킨', className: 'skin-noodle-knight' },
  { id: 'western-terrace', type: 'background', title: '양식 테라스 배경', className: 'background-western-terrace' },
  { id: 'world-tour-crown', type: 'background', title: '세계일주 금관 배경', className: 'background-world-tour-crown' },
] as const

export const COLLECTION_SETS: readonly CollectionSet[] = [
  { id: 'street-team', title: '분식 탐험대', requiredCatalogIds: ['ramen', 'rice', 'snack'], reward: { rewardType: 'skin', rewardId: 'street-festival' } },
  { id: 'sunny-bites', title: '햇살 한입단', requiredCatalogIds: ['fruit', 'drink'], reward: { rewardType: 'background', rewardId: 'sunny-picnic' } },
  { id: 'cozy-breakfast', title: '포근한 아침', requiredCatalogIds: ['bread', 'fruit', 'drink'], reward: { rewardType: 'background', rewardId: 'cozy-morning' } },
  { id: 'korea-full-course', title: '한식 한상', requiredCatalogIds: ['ramen', 'rice', 'side'], reward: { rewardType: 'skin', rewardId: 'hansang-royal' } },
  { id: 'dumpling-sushi-alliance', title: '만두초밥 동맹', requiredCatalogIds: ['dumpling', 'sushi'], reward: { rewardType: 'skin', rewardId: 'noodle-knight' } },
  { id: 'western-feast', title: '양식 정찬', requiredCatalogIds: ['pasta', 'other', 'bread'], reward: { rewardType: 'background', rewardId: 'western-terrace' } },
  { id: 'world-tour', title: '미식 세계일주', requiredCatalogIds: ['ramen', 'dumpling', 'sushi', 'pasta', 'snack'], reward: { rewardType: 'background', rewardId: 'world-tour-crown' } },
] as const

export const FUSION_RECIPES: readonly FusionRecipe[] = [
  // 2개 조합 - 원본 카드 유지
  { id: 'ramen-rice-hero', requiredCatalogIds: ['ramen', 'rice'], resultName: '라밥 용사', resultRarity: 'epic', consumesSources: false },
  { id: 'fruit-drink-fairy', requiredCatalogIds: ['fruit', 'drink'], resultName: '과일소다 요정', resultRarity: 'legendary', consumesSources: false },
  { id: 'bread-fruit-cloud', requiredCatalogIds: ['bread', 'fruit'], resultName: '과일샌드 구름', resultRarity: 'epic', consumesSources: false },
  { id: 'dumpling-sushi-captain', requiredCatalogIds: ['dumpling', 'sushi'], resultName: '만두초밥 대장', resultRarity: 'epic', consumesSources: false },
  { id: 'pasta-ramen-duo', requiredCatalogIds: ['pasta', 'ramen'], resultName: '면면 듀오', resultRarity: 'epic', consumesSources: false },
  { id: 'snack-drink-party', requiredCatalogIds: ['snack', 'drink'], resultName: '간식파티 요정', resultRarity: 'rare', consumesSources: false },
  { id: 'side-rice-table', requiredCatalogIds: ['side', 'rice'], resultName: '든든 한상', resultRarity: 'epic', consumesSources: false },

  // 3개 조합 - 원본 카드 소멸 (고급 조합)
  { id: 'korea-china-japan-trio', requiredCatalogIds: ['ramen', 'rice', 'dumpling'], resultName: '한중일 삼총사', resultRarity: 'legendary', consumesSources: true },
  { id: 'brunch-kingdom', requiredCatalogIds: ['fruit', 'bread', 'drink'], resultName: '브런치 왕국', resultRarity: 'legendary', consumesSources: true },
  { id: 'world-cuisine-master', requiredCatalogIds: ['sushi', 'pasta', 'dumpling'], resultName: '세계 요리 대장', resultRarity: 'legendary', consumesSources: true },
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
