import { FOOD_META } from './types'
import type { FoodCard, FoodType, MealRecord } from './types'
import { buildV3Progress } from './v3Progression'
import type { V3Progress } from './v3Progression'

export interface PlayerLevel {
  level: number
  currentLevelXp: number
  nextLevelXp: number
  totalXp: number
}

export interface CollectionProgress {
  discoveredFoods: number
  totalFoods: number
  completionPercent: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
}

export interface MealStreak {
  currentDays: number
  recordedToday: boolean
}

export interface DailyQuest {
  id: string
  title: string
  description: string
  completed: boolean
}

export interface FoodEvolution {
  foodType: FoodType
  label: string
  stage: number
  title: string
  count: number
  nextCount?: number
}

export interface SeasonEvent {
  id: string
  title: string
  completedSteps: number
  totalSteps: number
  rewardTitle: string
  completed: boolean
}

export interface RewardBox {
  available: boolean
  title: string
  rewardPreview: string
}

export interface CollectionBonus {
  id: string
  title: string
  description: string
  unlocked: boolean
}

export interface Progression {
  level: PlayerLevel
  collection: CollectionProgress
  achievements: Achievement[]
  streak: MealStreak
  dailyQuests: DailyQuest[]
  evolutions: FoodEvolution[]
  season: SeasonEvent
  rewardBox: RewardBox
  collectionBonuses: CollectionBonus[]
  v3: V3Progress
}

const levelThresholds = [0, 30, 60, 100, 150, 210, 280, 360]
const totalFoods = Object.keys(FOOD_META).length

function buildLevel(totalXp: number): PlayerLevel {
  const nextThresholdIndex = levelThresholds.findIndex((threshold) => threshold > totalXp)
  const level = nextThresholdIndex === -1 ? levelThresholds.length : nextThresholdIndex
  const currentThreshold = levelThresholds[level - 1] ?? 0
  const nextThreshold = levelThresholds[level] ?? currentThreshold + 100

  return {
    level,
    currentLevelXp: totalXp - currentThreshold,
    nextLevelXp: nextThreshold - currentThreshold,
    totalXp,
  }
}

function startOfLocalDay(time: number) {
  return new Date(time).setHours(0, 0, 0, 0)
}

function buildStreak(entries: Array<{ meal: MealRecord }>, now: number): MealStreak {
  const mealDays = new Set(entries.map(({ meal }) => startOfLocalDay(meal.recordedAt)))
  const today = startOfLocalDay(now)
  let currentDays = 0

  while (mealDays.has(today - currentDays * 86_400_000)) {
    currentDays += 1
  }

  return {
    currentDays,
    recordedToday: mealDays.has(today),
  }
}

function buildEvolution(foodType: FoodType, count: number): FoodEvolution {
  const baseName = FOOD_META[foodType].variants[0].name
  const stage = count >= 15 ? 4 : count >= 7 ? 3 : count >= 3 ? 2 : 1

  return {
    foodType,
    label: FOOD_META[foodType].label,
    stage,
    title: stage === 4 ? `${baseName} 마스터` : stage > 1 ? `${baseName} Lv.${stage}` : baseName,
    count,
    ...(stage < 4 ? { nextCount: stage === 1 ? 3 : stage === 2 ? 7 : 15 } : {}),
  }
}

export function buildProgression(
  entries: Array<{ card: FoodCard; meal: MealRecord }>,
  now = Date.now(),
  unlockedRewardIds: readonly string[] = [],
): Progression {
  const totalXp = entries.reduce((total, entry) => total + entry.card.xp, 0)
  const discoveredFoods = new Set(entries.map(({ meal }) => meal.foodType))
  const hasFood = (foodType: FoodType) => discoveredFoods.has(foodType)
  const hasRareOrBetter = entries.some(({ card }) => card.rarity === 'rare' || card.rarity === 'epic')
  const today = startOfLocalDay(now)
  const todayEntries = entries.filter(({ meal }) => startOfLocalDay(meal.recordedAt) === today)
  const countsByFood = entries.reduce((counts, { meal }) => {
    counts.set(meal.foodType, (counts.get(meal.foodType) ?? 0) + 1)
    return counts
  }, new Map<FoodType, number>())
  const evolutions = [...countsByFood.entries()]
    .map(([foodType, count]) => buildEvolution(foodType, count))
    .sort((left, right) => right.count - left.count)
  const seasonSteps = [
    hasFood('fruit'),
    hasFood('drink'),
    entries.filter(({ meal }) => meal.foodType === 'rice' || meal.foodType === 'ramen').length >= 2,
    buildStreak(entries, now).currentDays >= 5,
  ]
  const collectionBonuses: CollectionBonus[] = [
    {
      id: 'noodle-explorer',
      title: '면 탐험가',
      description: '면 카드를 3장 모았어요.',
      unlocked: (countsByFood.get('ramen') ?? 0) >= 3,
    },
    {
      id: 'fruit-friend',
      title: '과일 친구',
      description: '과일 카드를 3장 모았어요.',
      unlocked: (countsByFood.get('fruit') ?? 0) >= 3,
    },
    {
      id: 'half-dex',
      title: '도감 절반',
      description: '전체 음식의 절반을 발견했어요.',
      unlocked: discoveredFoods.size >= Math.ceil(totalFoods / 2),
    },
  ]
  const completedQuestCount = [
    todayEntries.length > 0,
    todayEntries.some(({ card }) => card.isNew),
    todayEntries.some(({ meal }) => meal.foodType === 'fruit' || meal.foodType === 'drink'),
  ].filter(Boolean).length

  return {
    level: buildLevel(totalXp),
    collection: {
      discoveredFoods: discoveredFoods.size,
      totalFoods,
      completionPercent: Math.round((discoveredFoods.size / totalFoods) * 100),
    },
    achievements: [
      {
        id: 'first-meal',
        title: '첫 식사',
        description: '첫 카드를 도감에 저장했어요.',
        unlocked: entries.length > 0,
      },
      {
        id: 'ramen-starter',
        title: '면 스타터',
        description: '라면 카드를 발견했어요.',
        unlocked: hasFood('ramen'),
      },
      {
        id: 'fruit-finder',
        title: '과일 수집가',
        description: '과일 카드를 발견했어요.',
        unlocked: hasFood('fruit'),
      },
      {
        id: 'rare-finder',
        title: '레어 발견',
        description: '레어 이상 카드를 만났어요.',
        unlocked: hasRareOrBetter,
      },
    ],
    streak: buildStreak(entries, now),
    dailyQuests: [
      {
        id: 'today-card',
        title: '식사 카드 1장',
        description: '오늘 식사를 한 번 기록해요.',
        completed: todayEntries.length > 0,
      },
      {
        id: 'new-discovery',
        title: '새 음식 발견',
        description: '처음 만나는 음식을 하나 모아요.',
        completed: todayEntries.some(({ card }) => card.isNew),
      },
      {
        id: 'fruit-or-drink',
        title: '상큼 카드',
        description: '과일이나 음료 카드를 모아요.',
        completed: todayEntries.some(({ meal }) => meal.foodType === 'fruit' || meal.foodType === 'drink'),
      },
    ],
    evolutions,
    season: {
      id: 'summer-bite',
      title: '여름 한입 시즌',
      completedSteps: seasonSteps.filter(Boolean).length,
      totalSteps: seasonSteps.length,
      rewardTitle: '전설의 여름 식탁',
      completed: seasonSteps.every(Boolean),
    },
    rewardBox: {
      available: todayEntries.length > 0 && completedQuestCount >= 2,
      title: '오늘의 상자',
      rewardPreview: 'XP 보너스 또는 시즌 조각',
    },
    collectionBonuses,
    v3: buildV3Progress(entries, unlockedRewardIds, now),
  }
}
