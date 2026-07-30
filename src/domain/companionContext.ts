import type { MealPeriod } from './foodCatalog'
import { buildProgression } from './progression'
import type { Progression } from './progression'
import { FOOD_META } from './types'
import type { FoodCard, MealRecord } from './types'
import type { CompanionContext } from './companionTypes'

type Entry = { card: FoodCard; meal: MealRecord }

const SEOUL_TIME_ZONE = 'Asia/Seoul'
const CATEGORY_RETURN_GAP = 7 * 86_400_000

function seoulParts(time: number) {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(time)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    values.find((value) => value.type === type)?.value ?? ''

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    hour: Number(part('hour')),
  }
}

function mealPeriodFor(time: number): MealPeriod {
  const { hour } = seoulParts(time)
  if (hour < 11) return 'morning'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

function countLatestRepeat(entries: readonly Entry[]) {
  const latestName = entries[0]?.meal.foodName.trim().toLocaleLowerCase('ko-KR')
  if (!latestName) return 0

  let count = 0
  for (const { meal } of entries) {
    if (meal.foodName.trim().toLocaleLowerCase('ko-KR') !== latestName) break
    count += 1
  }
  return count
}

function isReturningCategory(entries: readonly Entry[]) {
  const latest = entries[0]
  if (!latest) return false
  const latestCategory = FOOD_META[latest.meal.foodType].category
  const previous = entries.slice(1).find(({ meal }) => FOOD_META[meal.foodType].category === latestCategory)
  return Boolean(previous && latest.meal.recordedAt - previous.meal.recordedAt >= CATEGORY_RETURN_GAP)
}

export function buildCompanionContext(
  entries: readonly Entry[],
  progression: Progression,
  now: number,
): CompanionContext {
  const sorted = [...entries].sort((left, right) => right.meal.recordedAt - left.meal.recordedAt)
  const latest = sorted[0]
  const previousProgression = buildProgression(sorted.slice(1), now)
  const today = seoulParts(now).date
  const todayCount = sorted.filter(({ meal }) => seoulParts(meal.recordedAt).date === today).length
  const completedQuestCount = progression.dailyQuests.filter((quest) => quest.completed).length
  const nearCompleteQuest = completedQuestCount === progression.dailyQuests.length - 1
    ? progression.dailyQuests.find((quest) => !quest.completed)
    : undefined
  const nextLevelXp = progression.level.nextLevelXp

  return {
    now,
    mealPeriod: mealPeriodFor(now),
    todayCount,
    ...(latest ? {
      lastMealAt: latest.meal.recordedAt,
      latestFoodName: latest.meal.foodName,
      latestFoodType: latest.meal.foodType,
      latestRarity: latest.card.rarity,
    } : {}),
    isNewFood: latest?.card.isNew ?? false,
    repeatCount: countLatestRepeat(sorted),
    level: progression.level.level,
    levelProgress: nextLevelXp > 0
      ? Math.min(1, progression.level.currentLevelXp / nextLevelXp)
      : 1,
    streakDays: progression.streak.currentDays,
    completedQuestCount,
    ...(nearCompleteQuest ? { nearCompleteQuestId: nearCompleteQuest.id } : {}),
    completedSetIds: progression.v3.completedSetIds
      .filter((id) => !previousProgression.v3.completedSetIds.includes(id)),
    newlyUnlockedDecorationIds: progression.v3.newRewards
      .filter((reward) => reward.rewardType === 'background')
      .map((reward) => reward.rewardId),
    newlyUnlockedAchievementIds: progression.achievements
      .filter((achievement) =>
        achievement.unlocked
        && !previousProgression.achievements.some((previous) =>
          previous.id === achievement.id && previous.unlocked,
        ))
      .map((achievement) => achievement.id),
    isCategoryReturn: isReturningCategory(sorted),
  }
}
