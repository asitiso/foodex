import type { MealRecord } from './types'

export type CompanionClassId = 'hearty-guardian' | 'forest-explorer' | 'balance-alchemist' | 'full-meal-knight'
export interface CompanionClass { id: CompanionClassId; name: string; requirement: string; skill: string; bonus: string; unlocked: boolean; recommended: boolean }
type Entry = { meal: MealRecord }

const DEFINITIONS: Omit<CompanionClass, 'unlocked' | 'recommended'>[] = [
  { id: 'hearty-guardian', name: '든든한 수호자', requirement: '밥·반찬 식사 5회', skill: '든든한 방패', bonus: '밥·반찬 기록 XP +20%' },
  { id: 'forest-explorer', name: '숲의 탐험가', requirement: '과일·채소 식사 5회', skill: '숲의 발견', bonus: '과일·채소 발견 보너스' },
  { id: 'balance-alchemist', name: '균형 연금술사', requirement: '서로 다른 식사 7종', skill: '균형 변환', bonus: '새 조합 보상 +1' },
  { id: 'full-meal-knight', name: '완식 기사', requirement: '하루 3끼 달성 3회', skill: '완식의 깃발', bonus: '하루 3끼 콤보 XP +50%' },
]

export function buildCompanionClasses(entries: Entry[], selected?: CompanionClassId): CompanionClass[] {
  const meals = entries.map(({ meal }) => meal)
  const hearty = meals.filter((meal) => ['rice', 'side'].includes(meal.foodType)).length
  const forest = meals.filter((meal) => meal.foodType === 'fruit').length
  const distinct = new Set(meals.map((meal) => meal.foodType)).size
  const dayKey = (value: number) => { const date = new Date(value); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` }
  const days = new Map<string, number>()
  meals.forEach((meal) => days.set(dayKey(meal.recordedAt), (days.get(dayKey(meal.recordedAt)) ?? 0) + 1))
  const fullDays = [...days.values()].filter((count) => count >= 3).length
  const unlocked = [hearty >= 5, forest >= 5, distinct >= 7, fullDays >= 3]
  const recommendedIndex = unlocked.findIndex(Boolean)
  return DEFINITIONS.map((definition, index) => ({ ...definition, unlocked: unlocked[index], recommended: selected ? selected === definition.id : index === recommendedIndex }))
}
