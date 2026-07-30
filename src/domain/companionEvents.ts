import type {
  CompanionContext,
  CompanionEvent,
  RankedCompanionEvents,
} from './companionTypes'

interface EventRule extends CompanionEvent {
  matches: (context: CompanionContext) => boolean
}

const EVENT_RULES: readonly EventRule[] = [
  {
    id: 'legendary-card',
    score: 100,
    tone: 'surprised',
    matches: (context) => context.latestRarity === 'legendary',
  },
  {
    id: 'set-complete',
    score: 60,
    tone: 'celebratory',
    matches: (context) => context.completedSetIds.length > 0,
  },
  {
    id: 'achievement',
    score: 60,
    tone: 'celebratory',
    matches: (context) => context.newlyUnlockedAchievementIds.length > 0,
  },
  {
    id: 'epic-card',
    score: 60,
    tone: 'surprised',
    matches: (context) => context.latestRarity === 'epic',
  },
  {
    id: 'room-unlock',
    score: 55,
    tone: 'celebratory',
    matches: (context) => context.newlyUnlockedDecorationIds.length > 0,
  },
  {
    id: 'quest-complete',
    score: 50,
    tone: 'happy',
    matches: (context) => context.completedQuestCount > 0,
  },
  {
    id: 'first-discovery',
    score: 40,
    tone: 'happy',
    matches: (context) => context.isNewFood,
  },
  {
    id: 'level-up',
    score: 30,
    tone: 'celebratory',
    matches: (context) => context.levelProgress >= 0.8 || (context.level > 1 && context.levelProgress === 0),
  },
  {
    id: 'streak',
    score: 30,
    tone: 'happy',
    matches: (context) => context.todayCount > 0 && context.streakDays >= 2,
  },
  {
    id: 'category-return',
    score: 25,
    tone: 'happy',
    matches: (context) => context.isCategoryReturn,
  },
  {
    id: 'repeat-food',
    score: 20,
    tone: 'expectant',
    matches: (context) => context.repeatCount >= 3,
  },
]

export function rankCompanionEvents(context: CompanionContext): RankedCompanionEvents {
  const matches = EVENT_RULES
    .filter((rule) => rule.matches(context))
    .map(({ id, score, tone }) => ({ id, score, tone }))

  if (matches.length === 0) {
    const primary: CompanionEvent = context.todayCount === 0
      ? { id: 'welcome-back', score: 10, tone: 'positive' }
      : { id: 'meal-recorded', score: 10, tone: 'calm' }
    return { primary, secondary: [] }
  }

  return {
    primary: matches[0],
    secondary: matches.slice(1, 3),
  }
}
