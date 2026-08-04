import { describe, expect, it } from 'vitest'
import { buildCompanionClasses } from './companionClasses'
import type { MealRecord } from './types'
const entry = (foodType: MealRecord['foodType'], day: number) => ({ meal: { id: `${foodType}-${day}`, imageData: null, foodType, foodName: foodType, amount: 'taste', recordedAt: day } as MealRecord })
describe('companion classes', () => {
  it('unlocks behavior-based jobs and recommends the first available one', () => {
    const classes = buildCompanionClasses(Array.from({ length: 5 }, (_, i) => entry('rice', i)))
    expect(classes.find((item) => item.id === 'hearty-guardian')?.unlocked).toBe(true)
    expect(classes.find((item) => item.id === 'hearty-guardian')?.recommended).toBe(true)
  })

  it('lets the player freely pick any unlocked class instead of the auto-recommendation', () => {
    const entries = [
      ...Array.from({ length: 5 }, (_, i) => entry('rice', i)),
      ...Array.from({ length: 5 }, (_, i) => entry('fruit', 100 + i)),
    ]
    const autoPicked = buildCompanionClasses(entries)
    expect(autoPicked.find((item) => item.id === 'hearty-guardian')?.recommended).toBe(true)
    expect(autoPicked.find((item) => item.id === 'forest-explorer')?.unlocked).toBe(true)

    const playerPicked = buildCompanionClasses(entries, 'forest-explorer')
    expect(playerPicked.find((item) => item.id === 'forest-explorer')?.recommended).toBe(true)
    expect(playerPicked.find((item) => item.id === 'hearty-guardian')?.recommended).toBe(false)
  })
})
