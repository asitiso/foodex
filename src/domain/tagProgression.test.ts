import { describe, expect, it } from 'vitest'
import { buildTagAchievements, buildTagEvents, buildTagProgress } from './tagProgression'
import type { MealRecord } from './types'

const entry = (foodName: string, foodType: MealRecord['foodType'] = 'snack') => ({
  meal: { id: foodName, imageData: null, foodType, foodName, amount: 'taste', recordedAt: 1 } as MealRecord,
})

describe('tag progression', () => {
  it('counts canonical foods by tag instead of raw user-entered names', () => {
    const progress = buildTagProgress([entry('밀크카라멜'), entry('아메리카노', 'drink')])
    expect(progress.find((item) => item.tag === 'candy')?.discovered).toBe(1)
    expect(progress.find((item) => item.tag === 'coffee')?.discovered).toBe(1)
  })

  it('generates stable tag achievement ids and pair event progress', () => {
    const achievements = buildTagAchievements([entry('밀크카라멜'), entry('쿠키')])
    expect(achievements.some((item) => item.id === 'tag-snack-5')).toBe(true)
    const event = buildTagEvents([entry('라면', 'ramen'), entry('사과', 'fruit')]).find((item) => item.id === 'meal-and-fruit')!
    expect(event.completed).toBe(2)
  })

  it('prioritizes meal and balance achievements before snack bonuses', () => {
    const ids = buildTagAchievements([]).map((item) => item.id)
    expect(ids.slice(0, 3).every((id) => id.startsWith('tag-meal-'))).toBe(true)
    expect(ids.findIndex((id) => id.startsWith('tag-snack-'))).toBeGreaterThan(10)
  })
})
