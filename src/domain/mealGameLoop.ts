import type { MealRecord } from './types'

export interface MealGameLoopState {
  todayMeals: number
  gaugeSteps: [boolean, boolean, boolean]
  nextMealTarget: 1 | 2 | 3
  nextMealRemaining: number
  totalMeals: number
  growth: {
    current: number
    next?: number
    remaining: number
  }
}

type MealEntry = { meal: MealRecord }

const GROWTH_THRESHOLDS = [3, 7, 14, 30, 100] as const

function localDay(value: number) {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function buildMealGameLoop(entries: MealEntry[], now = Date.now()): MealGameLoopState {
  const todayMeals = entries.filter(({ meal }) => localDay(meal.recordedAt) === localDay(now)).length
  const gaugeCount = Math.min(todayMeals, 3)
  const nextMealTarget = (todayMeals === 0 ? 1 : todayMeals === 1 ? 2 : 3) as 1 | 2 | 3
  const totalMeals = entries.length
  const next = GROWTH_THRESHOLDS.find((threshold) => threshold > totalMeals)
  const current = [...GROWTH_THRESHOLDS].reverse().find((threshold) => threshold <= totalMeals) ?? 0

  return {
    todayMeals,
    gaugeSteps: [gaugeCount >= 1, gaugeCount >= 2, gaugeCount >= 3],
    nextMealTarget,
    nextMealRemaining: Math.max(0, nextMealTarget - todayMeals),
    totalMeals,
    growth: {
      current,
      next,
      remaining: next ? next - totalMeals : 0,
    },
  }
}
