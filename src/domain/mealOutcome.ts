import type { CompanionClassId } from './companionClasses'
import type { FoodTag, MealRecord } from './types'
import { tagsForMeal } from './foodCatalog'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'late'

export interface MealOutcome {
  slot: MealSlot
  tags: readonly FoodTag[]
  xp: number
  combo: number
  bossDamage: number
  discoveredNewSlot: boolean
}

export function mealSlot(recordedAt: number): MealSlot {
  const hour = new Date(recordedAt).getHours()
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 16 && hour < 22) return 'dinner'
  return 'late'
}

export function buildMealOutcome(meal: MealRecord, history: readonly MealRecord[], classId?: CompanionClassId): MealOutcome {
  const tags = tagsForMeal(meal.foodName, meal.foodType)
  const sameDay = history.filter((item) => new Date(item.recordedAt).toDateString() === new Date(meal.recordedAt).toDateString())
  const distinctTags = new Set(sameDay.flatMap((item) => tagsForMeal(item.foodName, item.foodType)))
  const combo = distinctTags.size >= 3 || tags.some((tag) => distinctTags.has(tag)) ? 1 : 0
  const classBonus = classId === 'hearty-guardian' && tags.some((tag) => tag === 'meal') ? 1.2
    : classId === 'forest-explorer' && tags.some((tag) => tag === 'fruit' || tag === 'healthy') ? 1.15
      : classId === 'balance-alchemist' && combo > 0 ? 1.25
        : classId === 'full-meal-knight' && sameDay.length >= 2 ? 1.5 : 1
  return { slot: mealSlot(meal.recordedAt), tags, xp: Math.round((meal.amount === 'taste' ? 20 : 12) * classBonus) + combo * 5, combo, bossDamage: 25 + combo * 10, discoveredNewSlot: !history.some((item) => item.foodName === meal.foodName) }
}
