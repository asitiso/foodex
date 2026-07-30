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
    expect(achievements.some((item) => item.id === 'tag-snack-3')).toBe(true)
    const event = buildTagEvents([entry('커피', 'drink'), entry('크루아상', 'bread')]).find((item) => item.id === 'cafe-run')!
    expect(event.completed).toBe(2)
  })
})
