import type { UserReward } from '../data/foodexDb'
import type { Progression } from './progression'
import { COLLECTION_SETS } from './v3Content'
import { FOOD_EMOJI, FOOD_META } from './types'
import type { FoodCard, FoodCategory, FoodType, MealRecord, Rarity } from './types'
import { hash } from './cardComposer'

type Entry = { card: FoodCard; meal: MealRecord }

export interface JournalEntryView {
  id: string
  time: string
  foodName: string
  foodType: FoodType
  emoji: string
  rarity: Rarity
  isShiny: boolean
  reaction: string
}

export interface DailyJournal {
  day: string
  recordCount: number
  foodNames: readonly string[]
  text: string
  entries: readonly JournalEntryView[]
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
  bestCard?: { name: string; emoji: string; rarity: Rarity; isShiny: boolean }
  weekdayCounts: readonly { label: string; count: number }[]
  comparison?: { recordDelta: number; streakDelta: number }
}

function seoulDate(time: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(time)
}

const seoulTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const seoulWeekdayFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
})

const WEEKDAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const RARITY_RANK: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }

const REACTION_POOL = {
  shiny: ['반짝반짝! 오늘 만난 카드는 스페셜했어!', '와, 눈부셔! 반짝이 카드를 만났어!', '이건 정말 운이 좋았어, 반짝여!'],
  legendary: ['우와, 전설의 카드잖아!', '전설이 내 도감에 내려왔어!', '이건 역사에 남을 만해!'],
  epic: ['오, 멋진 카드를 만났어!', '이 정도면 자랑할 만하지!', '멋진 발견이야, 기분 최고!'],
  rare: ['귀한 카드를 발견했어!', '오, 흔치 않은 카드야!', '오늘 운이 따라줬어!'],
  new: ['처음 만나는 친구야, 반가워!', '새로운 친구, 환영해!', '오늘 처음 만난 친구야!'],
  common: ['든든한 한 끼였어.', '오늘도 맛있게 잘 먹었어.', '평범해도 소중한 한 끼야.'],
} as const

function pick<T>(items: readonly T[], seed: string): T {
  return items[hash(seed) % items.length]
}

function reactionFor(card: FoodCard): string {
  if (card.isShiny) return pick(REACTION_POOL.shiny, `${card.mealId}:reaction`)
  if (card.rarity === 'legendary') return pick(REACTION_POOL.legendary, `${card.mealId}:reaction`)
  if (card.rarity === 'epic') return pick(REACTION_POOL.epic, `${card.mealId}:reaction`)
  if (card.rarity === 'rare') return pick(REACTION_POOL.rare, `${card.mealId}:reaction`)
  if (card.isNew) return pick(REACTION_POOL.new, `${card.mealId}:reaction`)
  return pick(REACTION_POOL.common, `${card.mealId}:reaction`)
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
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
      entries: [],
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
    entries: dailyEntries.map(({ card, meal }) => ({
      id: card.id,
      time: seoulTimeFormat.format(meal.recordedAt),
      foodName: meal.foodName,
      foodType: meal.foodType,
      emoji: FOOD_EMOJI[meal.foodType],
      rarity: card.rarity,
      isShiny: Boolean(card.isShiny),
      reaction: reactionFor(card),
    })),
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

  const bestCardEntry = monthlyEntries
    .slice()
    .sort((left, right) => {
      const shinyDiff = Number(Boolean(right.card.isShiny)) - Number(Boolean(left.card.isShiny))
      if (shinyDiff !== 0) return shinyDiff
      return RARITY_RANK[right.card.rarity] - RARITY_RANK[left.card.rarity]
    })[0]
  const bestCard = bestCardEntry ? {
    name: bestCardEntry.card.name,
    emoji: FOOD_EMOJI[bestCardEntry.meal.foodType],
    rarity: bestCardEntry.card.rarity,
    isShiny: Boolean(bestCardEntry.card.isShiny),
  } : undefined

  const weekdayCounts = WEEKDAY_ORDER.map((weekday, index) => ({
    label: WEEKDAY_LABELS[index],
    count: monthlyEntries.filter(({ meal }) => seoulWeekdayFormat.format(meal.recordedAt) === weekday).length,
  }))

  const previousMonth = shiftMonth(month, -1)
  const previousMonthEntries = entries.filter(({ meal }) => seoulDate(meal.recordedAt).startsWith(previousMonth))
  const comparison = previousMonthEntries.length > 0 ? {
    recordDelta: recordCount - previousMonthEntries.length,
    streakDelta: streak - bestStreak(previousMonthEntries),
  } : undefined

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
    ...(bestCard ? { bestCard } : {}),
    weekdayCounts,
    ...(comparison ? { comparison } : {}),
  }
}
