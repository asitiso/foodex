import { describe, expect, it } from 'vitest'
import type { FoodType, MealRecord } from './types'
import { buildWorldProgress } from './v6WorldProgression'

const entry = (foodType: FoodType, id: string, recordedAt = 1_700_000_000_000) => ({
  card: {
    id: `card-${id}`, mealId: `meal-${id}`, catalogId: id, name: id, rarity: 'common' as const,
    quote: '', xp: 10, isNew: true, regionId: 'korea' as const, evolutionStage: 1, createdAt: recordedAt,
  },
  meal: { id: `meal-${id}`, imageData: null, foodType, foodName: id, amount: 'half' as const, recordedAt },
})

describe('Foodex V6 world progression', () => {
  it('maps collected foods to villages and unique residents', () => {
    const progress = buildWorldProgress([entry('ramen', 'ramen-1'), entry('ramen', 'ramen-2'), entry('fruit', 'fruit-1')])

    expect(progress.residentCount).toBe(2)
    expect(progress.villages.find((village) => village.id === 'noodle-village')?.residentNames).toContain('Ramen Knight')
    expect(progress.villages.find((village) => village.id === 'fruit-forest')?.discovered).toBe(true)
  })

  it('creates a same-day relationship without counting duplicate cards twice', () => {
    const progress = buildWorldProgress([entry('ramen', 'ramen-1'), entry('rice', 'rice-1')], 1_700_000_000_000)

    expect(progress.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'today-friends', members: ['Ramen Knight', 'Rice Guardian'] }),
    ]))
  })

  it('reports museum room completion from unique food types', () => {
    const progress = buildWorldProgress([entry('ramen', 'ramen-1'), entry('dumpling', 'dumpling-1')])

    expect(progress.museumRooms.find((room) => room.id === 'noodle-room')?.completed).toBe(true)
    expect(progress.museumRooms.find((room) => room.id === 'fruit-room')?.completed).toBe(false)
  })
})
