import type { MealPeriod } from './foodCatalog'
import type { FoodType, Rarity } from './types'

export interface CompanionContext {
  now: number
  mealPeriod: MealPeriod
  todayCount: number
  lastMealAt?: number
  latestFoodName?: string
  latestFoodType?: FoodType
  latestRarity?: Rarity
  isNewFood: boolean
  repeatCount: number
  level: number
  levelProgress: number
  streakDays: number
  completedQuestCount: number
  nearCompleteQuestId?: string
  completedSetIds: readonly string[]
  newlyUnlockedDecorationIds: readonly string[]
  newlyUnlockedAchievementIds: readonly string[]
  isCategoryReturn: boolean
}

export interface ExperienceSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  hapticsEnabled: boolean
  reducedMotion: boolean
}

export type CompanionEventId =
  | 'legendary-card'
  | 'set-complete'
  | 'achievement'
  | 'epic-card'
  | 'room-unlock'
  | 'quest-complete'
  | 'first-discovery'
  | 'level-up'
  | 'streak'
  | 'category-return'
  | 'repeat-food'
  | 'welcome-back'
  | 'meal-recorded'

export type CompanionTone = 'calm' | 'expectant' | 'happy' | 'surprised' | 'celebratory' | 'positive'

export interface CompanionEvent {
  id: CompanionEventId
  score: number
  tone: CompanionTone
}

export interface RankedCompanionEvents {
  primary: CompanionEvent
  secondary: readonly CompanionEvent[]
}
