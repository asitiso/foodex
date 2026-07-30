import { describe, expect, it } from 'vitest'
import { buildProgression } from './progression'
import { buildDailyJournal, buildMonthlyReport } from './journal'
import type { FoodCard, MealRecord } from './types'

function entry(foodName: string, foodType: MealRecord['foodType'] = 'side', day = 10) {
  const recordedAt = new Date(`2026-07-${String(day).padStart(2, '0')}T12:00:00+09:00`).getTime()
  const meal: MealRecord = {
    id: `meal-${foodName}-${day}`,
    imageData: null,
    foodType,
    foodName,
    amount: 'almostAll',
    recordedAt,
  }
  const card: FoodCard = {
    id: `card-${foodName}-${day}`,
    mealId: meal.id,
    catalogId: foodType,
    name: `${foodName} 카드`,
    rarity: 'rare',
    quote: '좋은 발견이야.',
    xp: 30,
    isNew: true,
    regionId: 'korea',
    evolutionStage: 1,
    createdAt: recordedAt,
  }
  return { meal, card }
}

describe('journal engine', () => {
  it('describes one record positively without calling it insufficient', () => {
    const entries = [entry('미역국')]
    const journal = buildDailyJournal(entries, buildProgression(entries), '2026-07-10')

    expect(journal.text).toContain('미역국')
    expect(journal.text).toContain('멋진 모험')
    expect(journal.text).not.toMatch(/부족|나쁘|실패/)
  })

  it('calculates the most frequent category from source records', () => {
    const entries = [entry('미역국'), entry('라면', 'ramen', 11), entry('사과', 'fruit', 12)]
    const report = buildMonthlyReport(entries, [], '2026-07')

    expect(report.topCategory).toBe('meal')
    expect(report.recordCount).toBe(3)
    expect(report.rareCardCount).toBe(3)
  })

  it('returns the promised empty copy', () => {
    expect(buildDailyJournal([], buildProgression([]), '2026-07-10').text)
      .toBe('첫 기록을 남기면 푸드 친구가 오늘의 이야기를 써 줄게요.')
  })
})
