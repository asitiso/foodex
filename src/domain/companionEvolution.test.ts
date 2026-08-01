import { describe, expect, it } from 'vitest'
import { buildCompanionEvolution } from './companionEvolution'
import type { MealRecord } from './types'

const entries = (count: number) => Array.from({ length: count }, (_, index) => ({ meal: { id: String(index), imageData: null, foodType: 'rice', foodName: 'rice', amount: 'taste', recordedAt: index } as MealRecord }))

describe('companion evolution', () => {
  it('advances the selected character through meal-based forms', () => {
    expect(buildCompanionEvolution('foody', entries(0)).formName).toBe('작은 푸디')
    expect(buildCompanionEvolution('foody', entries(3)).formName).toBe('든든한 푸디')
    expect(buildCompanionEvolution('foody', entries(7)).formName).toBe('밥의 수호자')
    expect(buildCompanionEvolution('foody', entries(14)).formName).toBe('완식 마스터')
  })

  it('keeps each selected character on its own transformation path', () => {
    const evolution = buildCompanionEvolution('noodle', entries(7))
    expect(evolution.formName).toBe('면 요리 기사')
    expect(evolution.progress).toBe(0)
    expect(evolution.remaining).toBe(7)
  })
})
