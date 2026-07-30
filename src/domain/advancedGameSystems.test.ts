import { describe, expect, it } from 'vitest'
import { buildAdvancedGameSystems } from './advancedGameSystems'
import type { MealRecord } from './types'
const entry = (foodType: MealRecord['foodType'], recordedAt: number) => ({ meal: { id: `${foodType}-${recordedAt}`, imageData: null, foodType, foodName: foodType, amount: 'taste', recordedAt } as MealRecord })
describe('advanced game systems', () => {
  it('connects dungeon, skill, recipes, equipment, boss and NPCs', () => {
    const now = Date.now()
    const state = buildAdvancedGameSystems([entry('rice', now), entry('side', now), entry('fruit', now), entry('ramen', now)], 'hearty-guardian', 2)
    expect(state.dungeon.cleared).toBe(3)
    expect(state.skill.active).toBe(true)
    expect(state.recipes).toContain('든든한 집밥')
    expect(state.equipment).toContain('푸디 앞치마')
    expect(state.npcs.length).toBeGreaterThan(1)
  })
})
