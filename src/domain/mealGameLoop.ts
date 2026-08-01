import type { MealRecord } from './types'

export interface MealGameLoopState {
  todayMeals: number
  gaugeSteps: [boolean, boolean, boolean]
  nextMealTarget: 1 | 2 | 3
  nextMealRemaining: number
  comboLabel: string
  comboReward: number
  weeklyMeals: number
  weeklyTarget: 5 | 10 | 15
  recoveryAvailable: boolean
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

function localDayNumber(value: number) {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function buildMealGameLoop(entries: MealEntry[], now = Date.now()): MealGameLoopState {
  const todayMeals = entries.filter(({ meal }) => localDay(meal.recordedAt) === localDay(now)).length
  const gaugeCount = Math.min(todayMeals, 3)
  const nextMealTarget = (todayMeals === 0 ? 1 : todayMeals === 1 ? 2 : 3) as 1 | 2 | 3
  const totalMeals = entries.length
  const todayDate = new Date(now)
  const weekStart = new Date(now)
  weekStart.setDate(todayDate.getDate() - 6)
  const weeklyMeals = entries.filter(({ meal }) => {
    const recorded = new Date(meal.recordedAt)
    return recorded >= new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()) && recorded.getTime() <= now
  }).length
  const weeklyTarget = (weeklyMeals < 5 ? 5 : weeklyMeals < 10 ? 10 : 15) as 5 | 10 | 15
  const comboLabel = todayMeals >= 3 ? '하루 완식 콤보' : todayMeals === 2 ? '든든한 2끼 콤보' : todayMeals === 1 ? '첫 끼 출발 콤보' : '첫 끼를 기록해보세요'
  const comboReward = todayMeals >= 3 ? 30 : todayMeals === 2 ? 15 : todayMeals === 1 ? 5 : 0
  const dayKeys = [...new Set(entries.map(({ meal }) => localDay(meal.recordedAt)))].sort()
  const dayNumbers = dayKeys.map((day) => {
    const [year, month, date] = day.split('-').map(Number)
    return new Date(year, month, date).getTime()
  })
  const recoveryAvailable = dayNumbers.some((day, index) => index > 0 && Math.floor((day - dayNumbers[index - 1]) / 86_400_000) === 2)
  const next = GROWTH_THRESHOLDS.find((threshold) => threshold > totalMeals)
  const current = [...GROWTH_THRESHOLDS].reverse().find((threshold) => threshold <= totalMeals) ?? 0

  return {
    todayMeals,
    gaugeSteps: [gaugeCount >= 1, gaugeCount >= 2, gaugeCount >= 3],
    nextMealTarget,
    nextMealRemaining: Math.max(0, nextMealTarget - todayMeals),
    comboLabel,
    comboReward,
    weeklyMeals,
    weeklyTarget,
    recoveryAvailable,
    totalMeals,
    growth: {
      current,
      next,
      remaining: next ? next - totalMeals : 0,
    },
  }
}
