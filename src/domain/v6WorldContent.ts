import type { FoodType } from './types'

export interface FoodVillage {
  id: string
  name: string
  description: string
  foodTypes: readonly FoodType[]
  residentByFood: Partial<Record<FoodType, string>>
  chef: string
}

export interface MuseumRoom {
  id: string
  name: string
  foodTypes: readonly FoodType[]
  curator: string
}

export const FOOD_VILLAGES: readonly FoodVillage[] = [
  { id: 'noodle-village', name: '면 요리 마을', description: '따뜻한 국물과 면 요리가 모이는 곳', foodTypes: ['ramen', 'dumpling'], residentByFood: { ramen: 'Ramen Knight', dumpling: 'Dumpling Cloud' }, chef: '국물 안내 셰프' },
  { id: 'fruit-forest', name: '햇살 과일숲', description: '계절 과일 친구들이 자라는 숲', foodTypes: ['fruit'], residentByFood: { fruit: 'Strawberry Fairy' }, chef: '계절 셰프' },
  { id: 'rice-town', name: '든든한 밥상마을', description: '매일의 한 끼를 지켜주는 마을', foodTypes: ['rice', 'side'], residentByFood: { rice: 'Rice Guardian', side: 'Side-dish Scout' }, chef: '밥상 안내 셰프' },
  { id: 'bread-hill', name: '빵구름 언덕', description: '달콤한 간식과 빵이 쉬어가는 언덕', foodTypes: ['bread', 'snack', 'drink'], residentByFood: { bread: 'Bread Cloud', snack: 'Snack Jester', drink: 'Tea Sprite' }, chef: '간식 셰프' },
  { id: 'world-street', name: '세계 음식 거리', description: '서로 다른 맛이 친구가 되는 거리', foodTypes: ['sushi', 'pasta', 'other'], residentByFood: { sushi: 'Sushi Ninja', pasta: 'Pasta Mage', other: 'Flavor Traveler' }, chef: '세계 요리 셰프' },
]

export const FOOD_MUSEUM_ROOMS: readonly MuseumRoom[] = [
  { id: 'noodle-room', name: '면과 만두 전시실', foodTypes: ['ramen', 'dumpling'], curator: '박물관 큐레이터 셰프' },
  { id: 'rice-room', name: '밥상 전시실', foodTypes: ['rice', 'side'], curator: '박물관 큐레이터 셰프' },
  { id: 'fruit-room', name: '과일 전시실', foodTypes: ['fruit'], curator: '박물관 큐레이터 셰프' },
  { id: 'bakery-room', name: '빵과 간식 전시실', foodTypes: ['bread', 'snack', 'drink'], curator: '박물관 큐레이터 셰프' },
  { id: 'world-room', name: '세계 음식 전시실', foodTypes: ['sushi', 'pasta', 'other'], curator: '박물관 큐레이터 셰프' },
]
