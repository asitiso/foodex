import { FOOD_CATALOG, tagsForMeal } from './foodCatalog'
import type { FoodTag, FoodType, MealRecord } from './types'

type Entry = { meal: MealRecord }

export interface TagCollectionProgress {
  tag: FoodTag
  label: string
  discovered: number
  total: number
}

export interface TagAchievement {
  id: string
  title: string
  description: string
  unlocked: boolean
}

export interface TagEvent {
  id: string
  title: string
  tags: readonly FoodTag[]
  completed: number
  total: number
  completedText: string
}

const TAG_LABELS: Record<FoodTag, string> = {
  meal: '식사', fruit: '과일', bakery: '빵·베이커리', snack: '과자', candy: '사탕', drink: '음료',
  chocolate: '초콜릿', coffee: '커피', tea: '차', soda: '탄산음료', juice: '주스',
  dairy: '유제품', convenience: '편의점', dessert: '디저트', noodle: '면 요리', spicy: '매운맛', healthy: '건강식', other: '기타',
}

const TRACKED_TAGS: readonly FoodTag[] = [
  'snack', 'candy', 'chocolate', 'coffee', 'soda', 'juice', 'dessert', 'convenience', 'fruit', 'bakery',
]

const TAG_MILESTONES = [3, 5, 10] as const

function canonicalIdsForTag(tag: FoodTag) {
  return FOOD_CATALOG.filter((food) => food.tags.includes(tag)).map((food) => food.id)
}

function discoveredIdsForTag(entries: readonly Entry[], tag: FoodTag) {
  const ids = new Set<string>()
  entries.forEach(({ meal }) => {
    const food = FOOD_CATALOG.find((candidate) => candidate.name === meal.foodName)
    if (food?.tags.includes(tag)) ids.add(food.id)
    else if (tagsForMeal(meal.foodName, meal.foodType).includes(tag)) ids.add(`${meal.foodType}:${meal.foodName}`)
  })
  return ids
}

export function buildTagProgress(entries: readonly Entry[]): TagCollectionProgress[] {
  return TRACKED_TAGS.map((tag) => ({
    tag,
    label: TAG_LABELS[tag],
    discovered: discoveredIdsForTag(entries, tag).size,
    total: canonicalIdsForTag(tag).length,
  }))
}

export function buildTagAchievements(entries: readonly Entry[]): TagAchievement[] {
  return TRACKED_TAGS.flatMap((tag) => {
    const count = discoveredIdsForTag(entries, tag).size
    return TAG_MILESTONES.map((target) => ({
      id: `tag-${tag}-${target}`,
      title: `${TAG_LABELS[tag]} 탐험가 Lv.${TAG_MILESTONES.indexOf(target) + 1}`,
      description: `${TAG_LABELS[tag]} 음식 ${target}종을 도감에 등록하세요.`,
      unlocked: count >= target,
    }))
  })
}

const TAG_EVENTS: readonly { id: string; title: string; tags: readonly FoodTag[] }[] = [
  { id: 'sweet-break', title: '달콤한 간식 휴식', tags: ['snack', 'dessert'] },
  { id: 'cafe-run', title: '카페 한 바퀴', tags: ['coffee', 'bakery'] },
  { id: 'convenience-hunt', title: '편의점 보물찾기', tags: ['convenience', 'soda'] },
  { id: 'juice-bar', title: '주스 바 탐험', tags: ['fruit', 'juice'] },
]

export function buildTagEvents(entries: readonly Entry[]): TagEvent[] {
  return TAG_EVENTS.map((event) => {
    const progress = event.tags.filter((tag) => discoveredIdsForTag(entries, tag).size > 0).length
    return {
      ...event,
      completed: progress,
      total: event.tags.length,
      completedText: `${progress}/${event.tags.length} 분류 발견`,
    }
  })
}

export function tagLabel(tag: FoodTag) {
  return TAG_LABELS[tag]
}

export function tagsForFoodType(foodType: FoodType): readonly FoodTag[] {
  return tagsForMeal('', foodType)
}
