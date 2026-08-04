import type { CompanionClassId } from './companionClasses'
import { buildMealOutcome } from './mealOutcome'
import type { MealOutcome } from './mealOutcome'
import type { Progression } from './progression'
import type { FoodCard, FoodType, MealRecord } from './types'
import type { UserReward } from '../data/foodexDb'
import { mealCoinKey } from './coinWallet'
import type { CoinTransaction } from './coinWallet'

export interface IntegratedReward {
  id: string
  label: string
  value: string
  kind: 'card' | 'xp' | 'coin' | 'unlock'
}

export interface IntegratedMealResult {
  mealId: string
  cardId: string
  outcome: MealOutcome
  coinTransaction: CoinTransaction
  primaryRewards: IntegratedReward[]
  detailRewards: Array<{ id: string; label: string }>
  persistedRewards: Array<{
    key: string
    rewardType: UserReward['rewardType']
    rewardId: string
    sourceType: UserReward['sourceType']
    sourceId: string
  }>
  completedQuestIds: string[]
  unlockedAchievementIds: string[]
  nextGoal: {
    kind: 'dungeon-room' | 'daily-quest' | 'growth' | 'album' | 'weekly'
    label: string
  }
  evolvedFood?: { foodType: FoodType; title: string; stage: number }
}

interface BuildIntegratedMealResultInput {
  meal: MealRecord
  card: FoodCard
  history: readonly MealRecord[]
  before: Progression
  after: Progression
  classId?: CompanionClassId
  existingRewardKeys: readonly string[]
}

function newlyCompleted<T extends { id: string }>(
  before: readonly T[],
  after: readonly T[],
  isComplete: (item: T) => boolean,
) {
  const completedBefore = new Set(before.filter(isComplete).map((item) => item.id))
  return after.filter(isComplete).map((item) => item.id).filter((id) => !completedBefore.has(id))
}

function nextGoal(after: Progression, outcome: MealOutcome): IntegratedMealResult['nextGoal'] {
  if (after.mealGameLoop.todayMeals < 3 && outcome.slot === 'breakfast') {
    return { kind: 'dungeon-room', label: '점심 방을 열려면 한 끼를 더 기록해 보세요' }
  }
  if (after.mealGameLoop.todayMeals < 3 && outcome.slot === 'lunch') {
    return { kind: 'dungeon-room', label: '저녁 방을 열려면 한 끼를 더 기록해 보세요' }
  }

  const openQuest = after.dailyQuests.find((quest) => !quest.completed)
  if (openQuest) return { kind: 'daily-quest', label: openQuest.description }

  if (after.mealGameLoop.growth.remaining > 0) {
    return {
      kind: 'growth',
      label: `캐릭터 성장까지 ${after.mealGameLoop.growth.remaining}끼 남았어요`,
    }
  }
  if (after.collection.discoveredFoods < after.collection.totalFoods) {
    return { kind: 'album', label: '아직 만나지 못한 음식 친구를 발견해 보세요' }
  }
  return {
    kind: 'weekly',
    label: `주간 목표까지 ${Math.max(0, after.mealGameLoop.weeklyTarget - after.mealGameLoop.weeklyMeals)}끼 남았어요`,
  }
}

export function buildIntegratedMealResult({
  meal,
  card,
  history,
  before,
  after,
  classId,
  existingRewardKeys,
}: BuildIntegratedMealResultInput): IntegratedMealResult {
  const outcome = buildMealOutcome(meal, history, classId)
  const beforeEvolution = before.evolutions.find((evolution) => evolution.foodType === meal.foodType)
  const afterEvolution = after.evolutions.find((evolution) => evolution.foodType === meal.foodType)
  // A food not yet recorded before this meal has no `before` entry at all; its implicit
  // baseline is stage 1 (same as the first-ever record of that food), so only stage
  // increases relative to an *existing* evolution count as a fresh evolvedFood moment.
  const evolvedFood = afterEvolution && afterEvolution.stage > (beforeEvolution?.stage ?? 1)
    ? { foodType: afterEvolution.foodType, title: afterEvolution.title, stage: afterEvolution.stage }
    : undefined
  const completedQuestIds = newlyCompleted(before.dailyQuests, after.dailyQuests, (quest) => quest.completed)
  const unlockedAchievementIds = newlyCompleted(before.achievements, after.achievements, (achievement) => achievement.unlocked)
  const existingKeys = new Set(existingRewardKeys)
  const persistedRewards = after.v3.newRewards
    .map((reward) => ({ ...reward, key: `${reward.rewardType}:${reward.rewardId}` }))
    .filter((reward) => !existingKeys.has(reward.key))
  const detailRewards = [
    ...completedQuestIds.map((id) => ({
      id: `quest:${id}`,
      label: after.dailyQuests.find((quest) => quest.id === id)?.title ?? '오늘의 목표 완료',
    })),
    ...unlockedAchievementIds.map((id) => ({
      id: `achievement:${id}`,
      label: after.achievements.find((achievement) => achievement.id === id)?.title ?? '새 업적 달성',
    })),
    ...persistedRewards.map((reward) => ({
      id: `unlock:${reward.key}`,
      label: '새 꾸미기 보상 잠금 해제',
    })),
  ]

  return {
    mealId: meal.id,
    cardId: card.id,
    outcome,
    coinTransaction: {
      id: meal.id,
      key: mealCoinKey(meal.id),
      kind: 'meal-earned',
      amount: outcome.coins,
      mealId: meal.id,
      createdAt: meal.recordedAt,
    },
    primaryRewards: [
      { id: `meal:${meal.id}:card`, label: '음식 카드', value: card.name, kind: 'card' },
      { id: `meal:${meal.id}:xp`, label: '성장 경험치', value: `+${outcome.xp} XP`, kind: 'xp' },
      { id: `meal:${meal.id}:coin`, label: '모험 코인', value: `+${outcome.coins}`, kind: 'coin' },
    ],
    detailRewards,
    persistedRewards,
    completedQuestIds,
    unlockedAchievementIds,
    nextGoal: nextGoal(after, outcome),
    evolvedFood,
  }
}
