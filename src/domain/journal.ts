import type { UserReward } from '../data/foodexDb'
import type { Progression } from './progression'
import { COLLECTION_SETS } from './v3Content'
import { FOOD_META } from './types'
import type { FoodCard, FoodCategory, MealRecord } from './types'

type Entry = { card: FoodCard; meal: MealRecord }

export interface DailyJournal {
  day: string
  recordCount: number
  foodNames: readonly string[]
  text: string
}

export interface MonthlyReport {
  month: string
  recordCount: number
  topFood?: string
  newDiscoveryCount: number
  topCategory?: FoodCategory
  bestStreak: number
  rareCardCount: number
  nearestCollection?: { title: string; completed: number; total: number }
  roomChanges: readonly string[]
  text: string
  suggestion: string
}

function seoulDate(time: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(time)
}

function mostFrequent<T>(values: readonly T[]): T | undefined {
  const counts = new Map<T, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
}

function bestStreak(entries: readonly Entry[]) {
  const days = [...new Set(entries.map(({ meal }) => seoulDate(meal.recordedAt)))].sort()
  let best = 0
  let current = 0
  let previous: number | undefined
  days.forEach((day) => {
    const timestamp = Date.parse(`${day}T00:00:00Z`)
    current = previous !== undefined && timestamp - previous === 86_400_000 ? current + 1 : 1
    best = Math.max(best, current)
    previous = timestamp
  })
  return best
}

export function buildDailyJournal(
  entries: readonly Entry[],
  progression: Progression,
  day: string,
): DailyJournal {
  const dailyEntries = entries
    .filter(({ meal }) => seoulDate(meal.recordedAt) === day)
    .sort((left, right) => left.meal.recordedAt - right.meal.recordedAt)
  const foodNames = dailyEntries.map(({ meal }) => meal.foodName)

  if (dailyEntries.length === 0) {
    return {
      day,
      recordCount: 0,
      foodNames: [],
      text: '첫 기록을 남기면 푸드 친구가 오늘의 이야기를 써 줄게요.',
    }
  }

  const discoveryCount = dailyEntries.filter(({ card }) => card.isNew).length
  const progressLine = discoveryCount > 0
    ? `새 음식 친구 ${discoveryCount}명을 도감에 초대했어.`
    : progression.streak.currentDays > 1
      ? `함께한 모험이 ${progression.streak.currentDays}일째 이어지고 있어.`
      : '오늘의 도감에 반짝이는 한 장을 더했어.'
  const closing = dailyEntries.length === 1
    ? '한 장의 기록도 멋진 모험이에요.'
    : `${dailyEntries.length}번의 기록이 멋진 모험 이야기가 되었어.`

  return {
    day,
    recordCount: dailyEntries.length,
    foodNames,
    text: `오늘은 ${foodNames.join(', ')} 친구를 만났어. ${progressLine} ${closing}`,
  }
}

export function buildMonthlyReport(
  entries: readonly Entry[],
  rewards: readonly UserReward[],
  month: string,
): MonthlyReport {
  const monthlyEntries = entries.filter(({ meal }) => seoulDate(meal.recordedAt).startsWith(month))
  const topFood = mostFrequent(monthlyEntries.map(({ meal }) => meal.foodName))
  const topCategory = mostFrequent(monthlyEntries.map(({ meal }) => FOOD_META[meal.foodType].category))
  const discovered = new Set(monthlyEntries.map(({ card }) => card.catalogId))
  const nearestCollection = COLLECTION_SETS
    .map((set) => ({
      title: set.title,
      completed: set.requiredCatalogIds.filter((id) => discovered.has(id)).length,
      total: set.requiredCatalogIds.length,
    }))
    .sort((left, right) =>
      (right.completed / right.total) - (left.completed / left.total)
      || left.total - right.total)[0]
  const roomChanges = rewards
    .filter((reward) => reward.rewardType === 'background')
    .map((reward) => reward.rewardId)
  const recordCount = monthlyEntries.length
  const rareCardCount = monthlyEntries.filter(({ card }) =>
    card.rarity === 'rare' || card.rarity === 'epic' || card.rarity === 'legendary').length
  const newDiscoveryCount = monthlyEntries.filter(({ card }) => card.isNew).length
  const streak = bestStreak(monthlyEntries)
  const text = recordCount === 0
    ? '이번 달의 첫 음식 카드를 기다리고 있어요.'
    : `이번 달에는 ${recordCount}장의 카드를 모았고, ${topFood} 친구를 가장 자주 만났어. 새 발견은 ${newDiscoveryCount}개, 가장 긴 연속 기록은 ${streak}일이야.`

  return {
    month,
    recordCount,
    ...(topFood ? { topFood } : {}),
    newDiscoveryCount,
    ...(topCategory ? { topCategory } : {}),
    bestStreak: streak,
    rareCardCount,
    ...(nearestCollection ? { nearestCollection } : {}),
    roomChanges,
    text,
    suggestion: '다음 달에는 새로운 음식 카드를 만나볼까요?',
  }
}
