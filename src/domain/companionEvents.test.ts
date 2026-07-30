import { describe, expect, it } from 'vitest'
import { rankCompanionEvents } from './companionEvents'
import type { CompanionContext } from './companionTypes'

function context(overrides: Partial<CompanionContext> = {}): CompanionContext {
  return {
    now: new Date('2026-07-30T19:00:00+09:00').getTime(),
    mealPeriod: 'dinner',
    todayCount: 1,
    isNewFood: false,
    repeatCount: 1,
    level: 1,
    levelProgress: 0.5,
    streakDays: 1,
    completedQuestCount: 0,
    completedSetIds: [],
    newlyUnlockedDecorationIds: [],
    newlyUnlockedAchievementIds: [],
    isCategoryReturn: false,
    ...overrides,
  }
}

describe('rankCompanionEvents', () => {
  it('ranks legendary above a completed quest', () => {
    const result = rankCompanionEvents(context({
      latestRarity: 'legendary',
      completedQuestCount: 3,
    }))

    expect(result.primary.id).toBe('legendary-card')
    expect(result.primary.score).toBe(100)
  })

  it('uses a restart event without guilt when the streak is zero', () => {
    const result = rankCompanionEvents(context({ streakDays: 0, todayCount: 0 }))

    expect(result.primary.id).toBe('welcome-back')
    expect(result.primary.tone).toBe('positive')
  })

  it('returns only the two strongest secondary events', () => {
    const result = rankCompanionEvents(context({
      latestRarity: 'epic',
      completedQuestCount: 2,
      completedSetIds: ['korean-table'],
      newlyUnlockedDecorationIds: ['traditional-lamp'],
      isNewFood: true,
      streakDays: 4,
      repeatCount: 3,
    }))

    expect(result.primary.id).toBe('set-complete')
    expect(result.secondary.map((event) => event.id)).toEqual(['epic-card', 'room-unlock'])
  })

  it('keeps the declared rare-event order when weights tie', () => {
    const result = rankCompanionEvents(context({
      latestRarity: 'epic',
      completedSetIds: ['fruit-set'],
      newlyUnlockedAchievementIds: ['first-meal'],
    }))

    expect([result.primary.id, ...result.secondary.map((event) => event.id)])
      .toEqual(['set-complete', 'achievement', 'epic-card'])
  })
})
