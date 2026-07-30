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

const CORE_TAGS: readonly FoodTag[] = ['meal', 'noodle', 'bakery', 'fruit', 'healthy', 'dairy']
const BONUS_TAGS: readonly FoodTag[] = ['snack', 'candy', 'chocolate', 'coffee', 'soda', 'juice', 'dessert', 'convenience']
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
  return CORE_TAGS.flatMap((tag) => {
    const count = discoveredIdsForTag(entries, tag).size
    return TAG_MILESTONES.map((target) => ({
      id: `tag-${tag}-${target}`,
      title: `${TAG_LABELS[tag]} 탐험가 Lv.${TAG_MILESTONES.indexOf(target) + 1}`,
      description: `${TAG_LABELS[tag]} 음식 ${target}종을 도감에 등록하세요.`,
      unlocked: count >= target,
    }))
  }).concat(BONUS_TAGS.flatMap((tag) => {
    const count = discoveredIdsForTag(entries, tag).size
    return [{
      id: `tag-${tag}-5`,
      title: `${TAG_LABELS[tag]} 보너스 탐험가`,
      description: `${TAG_LABELS[tag]} 음식 5종을 발견하면 보너스를 받아요.`,
      unlocked: count >= 5,
    }]
  }))
}

const TAG_EVENTS: readonly { id: string; title: string; tags: readonly FoodTag[] }[] = [
  { id: 'meal-and-fruit', title: '든든한 한 끼와 과일', tags: ['meal', 'fruit'] },
  { id: 'breakfast-balance', title: '아침 균형 챌린지', tags: ['bakery', 'fruit'] },
  { id: 'noodle-meal', title: '따뜻한 면 한 그릇', tags: ['meal', 'noodle'] },
  { id: 'sweet-break', title: '식사 후 달콤한 보너스', tags: ['meal', 'snack'] },
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
