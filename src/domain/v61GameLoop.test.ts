import { describe, expect, it } from 'vitest'
import type { FoodCard, FoodType, MealRecord } from './types'
import { buildGameLoop } from './v61GameLoop'

const entry = (foodType: FoodType, id: string, recordedAt = 1_700_000_000_000) => ({
  card: { id: `card-${id}`, mealId: `meal-${id}`, catalogId: id, name: id, rarity: 'common' as const, quote: '', xp: 10, isNew: true, regionId: 'korea' as const, evolutionStage: 1, createdAt: recordedAt } as FoodCard,
  meal: { id: `meal-${id}`, imageData: null, foodType, foodName: id, amount: 'half' as const, recordedAt } as MealRecord,
})

describe('V6.1/V6.2 game loop', () => {
  it('creates a daily expedition with one clear next action', () => {
    const loop = buildGameLoop([entry('ramen', 'r1')], 1_700_000_000_000)
    expect(loop.expedition.steps).toHaveLength(3)
    expect(loop.expedition.nextAction).toContain('기록하기')
  })

  it('unlocks a combination mission when foods share a set', () => {
    const loop = buildGameLoop([entry('ramen', 'r1'), entry('dumpling', 'd1')])
    expect(loop.combinationMissions.find((mission) => mission.id === 'noodle-feast')?.completed).toBe(true)
  })

  it('derives resident bond, party bonus, weekly event, and relationship episode', () => {
    const loop = buildGameLoop([entry('ramen', 'r1'), entry('rice', 'b1')], 1_700_000_000_000)
    expect(loop.bonds.find((bond) => bond.residentName === 'Ramen Knight')?.level).toBe(1)
    expect(loop.party.members).toHaveLength(2)
    expect(loop.weeklyEvent.title).toBeTruthy()
    expect(loop.episodes.length).toBeGreaterThan(0)
  })
})
