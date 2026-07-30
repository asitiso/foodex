import { describe, expect, it } from 'vitest'
import { buildMealAdventureResult, buildProgression } from './progression'
import type { FoodCard, MealRecord } from './types'
import { catalogForFoodType } from './v3Content'

function entry(foodType: MealRecord['foodType'], xp: number, recordedAt: number, rarity: FoodCard['rarity'] = 'common') {
  const catalog = catalogForFoodType(foodType)
  const meal: MealRecord = {
    id: `meal-${foodType}-${recordedAt}`,
    imageData: null,
    foodType,
    foodName: foodType,
    amount: 'taste',
    recordedAt,
  }

  return {
    meal,
    card: {
      id: `card-${foodType}-${recordedAt}`,
      mealId: meal.id,
      catalogId: catalog.id,
      name: `${foodType} card`,
      rarity,
      quote: 'test',
      xp,
      isNew: true,
      regionId: catalog.regionId,
      seasonId: catalog.seasonId,
      evolutionStage: 1,
      createdAt: recordedAt,
    },
  }
}

describe('progression', () => {
  it('derives level, collection completion, and unlocked achievements from saved cards', () => {
    const progression = buildProgression([
      entry('ramen', 30, 1, 'epic'),
      entry('fruit', 20, 2, 'rare'),
      entry('ramen', 20, 3),
    ])

    expect(progression.level).toEqual({
      level: 3,
      currentLevelXp: 10,
      nextLevelXp: 40,
      totalXp: 70,
    })
    expect(progression.collection).toEqual({
      discoveredFoods: 2,
      totalFoods: 11,
      completionPercent: 18,
    })
    expect(progression.achievements.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id)).toEqual([
      'first-meal',
      'ramen-starter',
      'fruit-finder',
      'rare-finder',
    ])
  })

  it('derives daily quests and the current meal streak from calendar days', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const yesterday = new Date(2026, 6, 29, 12).getTime()
    const twoDaysAgo = new Date(2026, 6, 28, 12).getTime()
    const progression = buildProgression([
      entry('fruit', 10, now, 'epic'),
      entry('ramen', 10, yesterday, 'rare'),
      entry('rice', 10, twoDaysAgo, 'rare'),
    ], now)

    expect(progression.streak).toEqual({
      currentDays: 3,
      recordedToday: true,
    })
    expect(progression.dailyQuests.map((quest) => [quest.id, quest.completed])).toEqual([
      ['today-card', true],
      ['new-discovery', true],
      ['fruit-or-drink', true],
    ])
  })

  it('derives V2 evolution, season, reward box, and collection bonuses', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const yesterday = new Date(2026, 6, 29, 12).getTime()
    const twoDaysAgo = new Date(2026, 6, 28, 12).getTime()
    const progression = buildProgression([
      entry('ramen', 30, now, 'epic'),
      entry('ramen', 20, yesterday),
      entry('ramen', 20, twoDaysAgo),
      entry('fruit', 20, now, 'rare'),
      entry('drink', 20, now, 'rare'),
      entry('rice', 20, yesterday, 'rare'),
      entry('bread', 20, twoDaysAgo, 'rare'),
    ], now)

    expect(progression.evolutions.find((evolution) => evolution.foodType === 'ramen')).toEqual({
      foodType: 'ramen',
      label: '라면',
      stage: 2,
      title: '불꽃 라면 Lv.2',
      count: 3,
      nextCount: 7,
    })
    expect(progression.season).toEqual({
      id: 'summer-bite',
      title: '여름 한입 시즌',
      completedSteps: 3,
      totalSteps: 4,
      rewardTitle: '전설의 여름 식탁',
      completed: false,
    })
    expect(progression.rewardBox).toEqual({
      available: true,
      title: '오늘의 상자',
      rewardPreview: 'XP 보너스 또는 시즌 조각',
    })
    expect(progression.collectionBonuses.filter((bonus) => bonus.unlocked).map((bonus) => bonus.id)).toEqual([
      'noodle-explorer',
    ])
  })

  it('composes V3 world progress and excludes rewards already owned', () => {
    const now = Date.parse('2026-07-30T12:00:00+09:00')
    const progression = buildProgression([
      entry('fruit', 20, now, 'rare'),
      entry('drink', 20, now, 'rare'),
    ], now, ['sunny-picnic'])

    expect(progression.v3.completedSetIds).toContain('sunny-bites')
    expect(progression.v3.newRewards).toEqual([])
  })

  it('summarizes a saved meal as a V5 adventure turn', () => {
    const now = new Date(2026, 6, 30, 12).getTime()
    const previousEntries = [
      entry('ramen', 30, now - 86_400_000, 'rare'),
      entry('rice', 20, now - 172_800_000),
    ]
    const currentEntry = entry('fruit', 30, now, 'epic')

    const result = buildMealAdventureResult({
      previousEntries,
      currentEntry,
      now,
      unlockedRewardIds: [],
    })

    expect(result.headline).toBe('과일 카드로 오늘의 모험을 진행했어요')
    expect(result.xpText).toBe('+30 XP')
    expect(result.levelText).toBe('캐릭터 Lv.3')
    expect(result.questText).toBe('오늘 퀘스트 3/3 완료')
    expect(result.museumText).toBe('음식 박물관 3/11 전시')
    expect(result.evolutionText).toBe('햇살 과일단 1/3 성장')
    expect(result.nextGoalText).toBe('다음 목표: 햇살 과일단 2번 더 기록하면 진화')
  })
})
