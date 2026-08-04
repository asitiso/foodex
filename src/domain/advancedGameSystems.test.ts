import { describe, expect, it } from 'vitest'
import { buildAdvancedGameSystems } from './advancedGameSystems'
import type { FoodCard, MealRecord } from './types'
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

  it('gives extra boss damage from today\'s highest-stat card and names it the MVP', () => {
    const now = Date.now()
    const lowStatCard: FoodCard = {
      id: 'card-low', mealId: 'rice-x', catalogId: 'rice', name: '든든 밥방패', rarity: 'common',
      quote: '', xp: 10, isNew: true, regionId: 'korea', evolutionStage: 1, createdAt: now,
      stats: { power: 1, luck: 1, warmth: 1 },
    }
    const highStatCard: FoodCard = {
      id: 'card-high', mealId: 'ramen-x', catalogId: 'ramen', name: '불꽃 라면', rarity: 'rare',
      quote: '', xp: 20, isNew: true, regionId: 'korea', evolutionStage: 1, createdAt: now,
      stats: { power: 90, luck: 5, warmth: 5 },
    }
    const lowOnly = buildAdvancedGameSystems([{ ...entry('rice', now), card: lowStatCard }], 'hearty-guardian', 1)
    const highOnly = buildAdvancedGameSystems([{ ...entry('rice', now), card: highStatCard }], 'hearty-guardian', 1)

    expect(highOnly.boss.mvpCard).toEqual({ name: '불꽃 라면', bonusDamage: 9 })
    expect(highOnly.boss.hp).toBeLessThan(lowOnly.boss.hp)
    expect(lowOnly.boss.mvpCard).toBeUndefined()
  })
})
