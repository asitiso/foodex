export type FoodType = 'ramen' | 'rice' | 'fruit' | 'bread' | 'side' | 'snack' | 'drink' | 'dumpling' | 'sushi' | 'pasta' | 'other'
export type FoodCategory = 'meal' | 'produce' | 'bakery' | 'treat' | 'drink' | 'other'
export type MealAmount = 'taste' | 'half' | 'almostAll'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type RegionId = 'korea' | 'china' | 'japan' | 'west' | 'snack-island'
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter'
export type CosmeticType = 'skin' | 'background'

export interface FoodHistory {
  foodTypes: readonly FoodType[]
  foodNames: readonly string[]
  categories: readonly FoodCategory[]
}

export interface MealRecord {
  id: string
  imageData: string | null
  foodType: FoodType
  foodName: string
  amount: MealAmount
  recordedAt: number
}

export interface FoodCard {
  id: string
  mealId: string
  catalogId: string
  name: string
  rarity: Rarity
  quote: string
  xp: number
  isNew: boolean
  regionId: RegionId
  seasonId?: SeasonId
  evolutionStage: number
  skinId?: string
  backgroundId?: string
  createdAt: number
}

interface CardCopy {
  name: string
  quote: string
}

export const FOOD_META: Record<FoodType, {
  label: string
  category: FoodCategory
  variants: readonly CardCopy[]
}> = {
  ramen: {
    label: '라면',
    category: 'meal',
    variants: [{ name: '불꽃 라면', quote: '후루룩! 오늘의 모험이 뜨거워졌어.' }],
  },
  rice: {
    label: '밥',
    category: 'meal',
    variants: [{ name: '든든 밥방패', quote: '작은 한술도 모험가의 힘이 돼.' }],
  },
  fruit: {
    label: '과일',
    category: 'produce',
    variants: [{ name: '햇살 과일단', quote: '상큼한 한입이 오늘의 지도를 밝혔어.' }],
  },
  bread: {
    label: '빵',
    category: 'bakery',
    variants: [{ name: '폭신 빵구름', quote: '포근한 한입으로 힘을 모았어.' }],
  },
  side: {
    label: '반찬',
    category: 'meal',
    variants: [{ name: '든든 반찬대', quote: '용감한 한입이 식탁을 빛냈어.' }],
  },
  snack: {
    label: '간식',
    category: 'treat',
    variants: [{ name: '반짝 간식별', quote: '즐거운 한입을 발견했어.' }],
  },
  drink: {
    label: '음료',
    category: 'drink',
    variants: [{ name: '찰랑 음료물결', quote: '시원한 모험 에너지가 채워졌어.' }],
  },
  dumpling: {
    label: '만두',
    category: 'meal',
    variants: [{ name: '구름 만두', quote: '포근한 만두 구름이 중화항구를 밝혔어.' }],
  },
  sushi: {
    label: '초밥',
    category: 'meal',
    variants: [{ name: '초밥 닌자', quote: '날렵한 한입이 일식숲을 스쳐 갔어.' }],
  },
  pasta: {
    label: '파스타',
    category: 'meal',
    variants: [{ name: '파스타 마법사', quote: '빙글빙글 면발에 양식 마법이 피어났어.' }],
  },
  other: {
    label: '기타',
    category: 'other',
    variants: [{ name: '새로운 발견대', quote: '새로운 한입을 기록했어.' }],
  },
}

export const AMOUNT_META: Record<MealAmount, { label: string; xp: number }> = {
  taste: { label: '맛보기', xp: 10 },
  half: { label: '절반', xp: 20 },
  almostAll: { label: '거의 다', xp: 30 },
}
