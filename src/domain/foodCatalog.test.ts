import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG, searchFoods, suggestFoods, tagsForMeal } from './foodCatalog'

describe('food catalog', () => {
  it('starts with enough named foods to avoid repetitive generic choices', () => {
    expect(FOOD_CATALOG.length).toBeGreaterThanOrEqual(100)
  })

  it('finds a food by a common alias', () => {
    expect(searchFoods('돈까스')[0]?.name).toBe('돈가스')
  })

  it('includes representative snack and drink entries with stable tags', () => {
    expect(searchFoods('밀크카라멜')[0]?.id).toBe('milk-caramel')
    expect(tagsForMeal('아메리카노', 'drink')).toEqual(expect.arrayContaining(['coffee', 'drink']))
    expect(tagsForMeal('탄산음료', 'drink')).toEqual(expect.arrayContaining(['soda', 'drink']))
  })

  it('puts a recent dinner food before generic dinner suggestions', () => {
    const now = new Date('2026-07-30T19:00:00+09:00').getTime()
    const result = suggestFoods({
      now,
      entries: [{
        id: 'meal-1',
        imageData: null,
        foodType: 'rice',
        foodName: '김치볶음밥',
        amount: 'half',
        recordedAt: now - 86_400_000,
      }],
      query: '',
    })

    expect(result[0]?.name).toBe('김치볶음밥')
  })
})
