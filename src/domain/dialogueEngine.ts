import { dialoguePartsFor } from './dialogueContent'
import type { FoodDefinition } from './foodCatalog'
import type { CompanionContext, RankedCompanionEvents } from './companionTypes'

const THIRTY_DAYS = 30 * 86_400_000

export interface DialogueHistoryItem {
  id: string
  dialogueId: string
  eventId: string
  openingId: string
  modifierId: string
  usedAt: number
}

export interface DialogueInput {
  mealId: string
  food: FoodDefinition
  context: CompanionContext
  events: RankedCompanionEvents
  history: readonly DialogueHistoryItem[]
  now: number
}

export interface ComposedDialogue {
  id: string
  openingId: string
  modifierId: string
  text: string
  tone: RankedCompanionEvents['primary']['tone']
}

function hash(value: string) {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function localDate(time: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(time)
}

export function composeDialogue(input: DialogueInput): ComposedDialogue {
  const eventId = input.events.primary.id
  const { openings, modifiers, endings } = dialoguePartsFor(eventId, input.food.flavor)
  const candidates = openings.flatMap((opening) =>
    modifiers.flatMap((modifier) =>
      endings.map((ending) => ({
        id: `${eventId}:${opening.id}:${modifier.id}:${ending.id}`,
        openingId: opening.id,
        modifierId: modifier.id,
        text: `${opening.text} ${modifier.text} ${ending.text}`,
        tone: input.events.primary.tone,
      })),
    ),
  )
  const recent = [...input.history].sort((left, right) => right.usedAt - left.usedAt)
  const recentLineIds = new Set(
    recent.filter((item) => input.now - item.usedAt < THIRTY_DAYS).map((item) => item.dialogueId),
  )
  const recentOpeningIds = new Set(recent.slice(0, 5).map((item) => item.openingId))
  const recentModifierIds = new Set(recent.slice(0, 3).map((item) => item.modifierId))
  const available = candidates.filter((candidate) =>
    !recentLineIds.has(candidate.id)
    && !recentOpeningIds.has(candidate.openingId)
    && !recentModifierIds.has(candidate.modifierId),
  )
  const pool = available.length > 0 ? available : [...candidates].sort((left, right) => {
    const lastUsed = (id: string) =>
      recent.find((item) => item.dialogueId === id)?.usedAt ?? Number.NEGATIVE_INFINITY
    return lastUsed(left.id) - lastUsed(right.id)
  })
  const seed = `${input.mealId}:${eventId}:${localDate(input.now)}`

  return pool[hash(seed) % pool.length]
}
