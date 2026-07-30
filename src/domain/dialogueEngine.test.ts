import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG } from './foodCatalog'
import { allDialogueText } from './dialogueContent'
import { composeDialogue } from './dialogueEngine'
import type { CompanionContext, RankedCompanionEvents } from './companionTypes'

const now = new Date('2026-07-30T19:00:00+09:00').getTime()
const food = FOOD_CATALOG.find((candidate) => candidate.id === 'ramen')!
const context: CompanionContext = {
  now,
  mealPeriod: 'dinner',
  todayCount: 1,
  latestFoodName: food.name,
  latestFoodType: food.foodType,
  latestRarity: 'epic',
  isNewFood: true,
  repeatCount: 1,
  level: 2,
  levelProgress: 0.3,
  streakDays: 1,
  completedQuestCount: 1,
  completedSetIds: [],
  newlyUnlockedDecorationIds: [],
  newlyUnlockedAchievementIds: [],
  isCategoryReturn: false,
}
const events: RankedCompanionEvents = {
  primary: { id: 'first-discovery', score: 40, tone: 'happy' },
  secondary: [],
}

describe('composeDialogue', () => {
  it('does not reuse a line used within thirty days', () => {
    const initial = composeDialogue({ mealId: 'meal-1', food, context, events, history: [], now })
    const result = composeDialogue({
      mealId: 'meal-1',
      food,
      context,
      events,
      history: [{
        id: 'history-1',
        dialogueId: initial.id,
        eventId: events.primary.id,
        openingId: initial.openingId,
        modifierId: initial.modifierId,
        usedAt: now - 86_400_000,
      }],
      now,
    })

    expect(result.id).not.toBe(initial.id)
  })

  it('is deterministic for the same meal and local date', () => {
    const first = composeDialogue({ mealId: 'meal-2', food, context, events, history: [], now })
    const second = composeDialogue({ mealId: 'meal-2', food, context, events, history: [], now })

    expect(second).toEqual(first)
  })

  it.each(['왜 안 왔어', '부족', '나쁜 식습관', '실망'])('never emits punitive copy: %s', (phrase) => {
    expect(allDialogueText().join(' ')).not.toContain(phrase)
  })
})
