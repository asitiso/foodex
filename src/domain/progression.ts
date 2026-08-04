import { COLLECTION_SETS, COSMETICS, FOOD_CATALOG } from './v3Content'
import { FOOD_META } from './types'
import type { FoodCard, FoodType, MealRecord } from './types'
import { tagsForMeal } from './foodCatalog'
import { buildV3Progress } from './v3Progression'
import type { V3Progress } from './v3Progression'
import { buildTagAchievements, buildTagEvents, buildTagProgress } from './tagProgression'
import type { TagAchievement, TagCollectionProgress, TagEvent } from './tagProgression'
import { buildMealGameLoop } from './mealGameLoop'
import type { MealGameLoopState } from './mealGameLoop'
import { buildMealAdventure } from './mealAdventure'
import type { MealAdventureState } from './mealAdventure'
import { rewardBoxCoinAmount } from './coinWallet'

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
  description: string
  completedSteps: number
  totalSteps: number
  rewardTitle: string
  completed: boolean
  steps: Array<{ label: string; completed: boolean }>
}

export interface RewardBox {
  available: boolean
  title: string
  rewardPreview: string
  dayKey: string
  coinAmount: number
}

export interface CollectionBonus {
  id: string
  title: string
  description: string
  unlocked: boolean
}

export interface AdventureBoardItem {
  id: string
  title: string
  reward: string
  completed: boolean
}

export interface AdventureBoard {
  title: string
  items: AdventureBoardItem[]
  nextFocus: string
}

export interface Progression {
  level: PlayerLevel
  collection: CollectionProgress
  achievements: Achievement[]
  streak: MealStreak
  dailyQuests: DailyQuest[]
  adventureBoard: AdventureBoard
  evolutions: FoodEvolution[]
  season: SeasonEvent
  seasonMissions: SeasonEvent[]
  rewardBox: RewardBox
  collectionBonuses: CollectionBonus[]
  tagProgress: TagCollectionProgress[]
  tagAchievements: TagAchievement[]
  tagEvents: TagEvent[]
  mealGameLoop: MealGameLoopState
  mealAdventure: MealAdventureState
  v3: V3Progress
}

type Entry = { card: FoodCard; meal: MealRecord }

export interface MealAdventureResult {
  headline: string
  xpText: string
  levelText: string
  questText: string
  museumText: string
  evolutionText: string
  nextGoalText: string
  rewardTexts: string[]
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

function localDayKey(time: number) {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

function buildAdventureBoard(
  dailyQuests: DailyQuest[],
  evolutions: FoodEvolution[],
): AdventureBoard {
  const evolutionTarget = evolutions.find((evolution) => evolution.nextCount)
  const remainingMeals = evolutionTarget?.nextCount
    ? evolutionTarget.nextCount - evolutionTarget.count
    : 0
  const nextEvolutionName = evolutionTarget?.nextCount
    ? buildEvolution(evolutionTarget.foodType, evolutionTarget.nextCount).title
    : undefined

  return {
    title: '오늘의 모험 보드',
    items: [
      {
        id: dailyQuests[0]?.id ?? 'today-card',
        title: dailyQuests[0]?.title ?? '식사 카드 1장',
        reward: '보상: 20 XP',
        completed: dailyQuests[0]?.completed ?? false,
      },
      {
        id: dailyQuests[1]?.id ?? 'new-discovery',
        title: dailyQuests[1]?.title ?? '새 음식 발견',
        reward: '보상: 박물관 전시 +1',
        completed: dailyQuests[1]?.completed ?? false,
      },
      {
        id: 'evolution-focus',
        title: evolutionTarget ? `${evolutionTarget.label} 진화 준비` : '새 음식 찾기',
        reward: evolutionTarget && remainingMeals > 0
          ? `진화까지 ${remainingMeals}끼`
          : '보상: 박물관 전시 +1',
        completed: false,
      },
    ],
    nextFocus: evolutionTarget && remainingMeals > 0 && nextEvolutionName
      ? `${evolutionTarget.label} ${remainingMeals}번 더 기록하면 ${nextEvolutionName}`
      : '새로운 음식을 기록하면 박물관 전시가 늘어나요',
  }
}

export function buildProgression(
  entries: Entry[],
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
  const seasonStepDefs = [
    { label: '과일 카드 발견하기', completed: hasFood('fruit') },
    { label: '음료 카드 발견하기', completed: hasFood('drink') },
    { label: '밥이나 라면 2번 기록하기', completed: entries.filter(({ meal }) => meal.foodType === 'rice' || meal.foodType === 'ramen').length >= 2 },
    { label: '5일 연속 기록하기', completed: buildStreak(entries, now).currentDays >= 5 },
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
    todayEntries.some(({ meal }) => ['ramen', 'rice', 'bread', 'side', 'dumpling', 'sushi', 'pasta'].includes(meal.foodType)),
  ].filter(Boolean).length
  const dailyQuests: DailyQuest[] = [
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
      id: 'meal-anchor',
      title: '상큼 카드',
      description: '과일이나 음료 카드를 모아요.',
      completed: todayEntries.some(({ meal }) => ['ramen', 'rice', 'bread', 'side', 'dumpling', 'sushi', 'pasta'].includes(meal.foodType)),
    },
  ]
  dailyQuests[2] = {
    ...dailyQuests[2],
    title: '든든한 한 끼',
    description: '밥·면·빵·반찬 중 하나를 오늘 기록하세요.',
  }
  const tagProgress = buildTagProgress(entries)
  const tagAchievements = buildTagAchievements(entries)
  const tagEvents = buildTagEvents(entries)

  const summerBiteMission: SeasonEvent = {
    id: 'summer-bite',
    title: '여름 한입 시즌',
    description: '여름 한정 이벤트예요. 아래 4가지를 모두 채우면 특별한 보상을 받아요.',
    completedSteps: seasonStepDefs.filter((step) => step.completed).length,
    totalSteps: seasonStepDefs.length,
    rewardTitle: '전설의 여름 식탁',
    completed: seasonStepDefs.every((step) => step.completed),
    steps: seasonStepDefs,
  }

  const riceHeartStepDefs = [
    { label: '밥이나 반찬 3번 기록하기', completed: entries.filter(({ meal }) => meal.foodType === 'rice' || meal.foodType === 'side').length >= 3 },
    { label: '면 요리 2번 기록하기', completed: entries.filter(({ meal }) => meal.foodType === 'ramen' || meal.foodType === 'pasta').length >= 2 },
  ]
  const riceHeartMission: SeasonEvent = {
    id: 'rice-heart-challenge',
    title: '밥심 챌린지',
    description: '밥과 면 요리로 든든하게 모험을 채워 보세요.',
    completedSteps: riceHeartStepDefs.filter((step) => step.completed).length,
    totalSteps: riceHeartStepDefs.length,
    rewardTitle: '든든 밥심 훈장',
    completed: riceHeartStepDefs.every((step) => step.completed),
    steps: riceHeartStepDefs,
  }

  const entryTags = entries.map(({ meal }) => tagsForMeal(meal.foodName, meal.foodType))
  const snackExplorerStepDefs = [
    { label: '간식 태그 카드 2번 만나기', completed: entryTags.filter((tags) => tags.includes('snack')).length >= 2 },
    { label: '음료 태그 카드 2번 만나기', completed: entryTags.filter((tags) => tags.includes('drink')).length >= 2 },
    { label: '디저트 태그 카드 1번 만나기', completed: entryTags.some((tags) => tags.includes('dessert')) },
  ]
  const snackExplorerMission: SeasonEvent = {
    id: 'snack-exploration-squad',
    title: '간식 탐험대',
    description: '간식과 음료를 모아 달콤한 탐험을 완성해 보세요.',
    completedSteps: snackExplorerStepDefs.filter((step) => step.completed).length,
    totalSteps: snackExplorerStepDefs.length,
    rewardTitle: '반짝 간식 지도',
    completed: snackExplorerStepDefs.every((step) => step.completed),
    steps: snackExplorerStepDefs,
  }

  const seasonMissions: SeasonEvent[] = [summerBiteMission, riceHeartMission, snackExplorerMission]

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
      ...tagAchievements,
    ],
    streak: buildStreak(entries, now),
    dailyQuests,
    adventureBoard: buildAdventureBoard(dailyQuests, evolutions),
    evolutions,
    season: summerBiteMission,
    seasonMissions,
    rewardBox: (() => {
      const dayKey = localDayKey(now)
      const coinAmount = rewardBoxCoinAmount(dayKey)
      return {
        available: todayEntries.length > 0 && completedQuestCount >= 2,
        title: '오늘의 상자',
        rewardPreview: `보너스 코인 ${coinAmount}개`,
        dayKey,
        coinAmount,
      }
    })(),
    collectionBonuses,
    tagProgress,
    tagAchievements,
    tagEvents,
    mealGameLoop: buildMealGameLoop(entries, now),
    mealAdventure: buildMealAdventure(entries, now),
    v3: buildV3Progress(entries, unlockedRewardIds, now),
  }
}

export function buildMealAdventureResult({
  previousEntries,
  currentEntry,
  now = Date.now(),
  unlockedRewardIds = [],
}: {
  previousEntries: Entry[]
  currentEntry: Entry
  now?: number
  unlockedRewardIds?: readonly string[]
}): MealAdventureResult {
  const nextProgression = buildProgression(
    [...previousEntries, currentEntry],
    now,
    unlockedRewardIds,
  )
  const completedQuests = nextProgression.dailyQuests.filter((quest) => quest.completed).length
  const evolution = nextProgression.evolutions.find((item) => item.foodType === currentEntry.meal.foodType)
  const baseName = FOOD_META[currentEntry.meal.foodType].variants[0].name
  const remainingMeals = evolution?.nextCount ? evolution.nextCount - evolution.count : 0
  const rewardTexts = nextProgression.v3.newRewards.flatMap((reward) => {
    const set = COLLECTION_SETS.find((candidate) => candidate.reward.rewardId === reward.rewardId)
    const cosmetic = COSMETICS.find((candidate) => candidate.id === reward.rewardId)
    const food = FOOD_CATALOG.find((candidate) => candidate.id === reward.rewardId)

    if (cosmetic) return [`새 장식 획득: ${cosmetic.title}`]
    if (food) return [`이벤트 카드 획득: ${food.label}`]
    if (set) return [`세트 완성 보상: ${set.title}`]
    return []
  })

  return {
    headline: `${FOOD_META[currentEntry.meal.foodType].label} 카드로 오늘의 모험을 진행했어요`,
    xpText: `+${currentEntry.card.xp} XP`,
    levelText: `캐릭터 Lv.${nextProgression.level.level}`,
    questText: `오늘 퀘스트 ${completedQuests}/${nextProgression.dailyQuests.length} 완료`,
    museumText: `음식 박물관 ${nextProgression.collection.discoveredFoods}/${nextProgression.collection.totalFoods} 전시`,
    evolutionText: evolution?.nextCount
      ? `${baseName} ${evolution.count}/${evolution.nextCount} 성장`
      : `${baseName} 최종 진화 완료`,
    nextGoalText: remainingMeals > 0
      ? `다음 목표: ${baseName} ${remainingMeals}번 더 기록하면 진화`
      : '다음 목표: 새로운 음식을 발견해 박물관을 넓히기',
    rewardTexts,
  }
}
