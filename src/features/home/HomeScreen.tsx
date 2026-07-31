import type { AdventureBoard, DailyQuest, MealStreak, PlayerLevel } from '../../domain/progression'
import type { MealGameLoopState } from '../../domain/mealGameLoop'
import type { MealAdventureState } from '../../domain/mealAdventure'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEvolution } from '../../domain/companionEvolution'
import type { CompanionClass } from '../../domain/companionClasses'
import type { AdvancedGameSystems } from '../../domain/advancedGameSystems'
import type { CompanionEmotion } from '../companion/HeroCompanion'
import { WorldHomeScene } from './WorldHomeScene'

export interface HomeScreenProps {
  summary: { todayCount: number; discoveredCount: number; totalXp: number; lastMealAt?: number }
  coinBalance: number
  level: PlayerLevel
  streak: MealStreak
  dailyQuests: DailyQuest[]
  adventureBoard: AdventureBoard
  mealGameLoop: MealGameLoopState
  mealAdventure: MealAdventureState
  characterId?: CompanionCharacterId
  evolution?: CompanionEvolution
  companionClass?: CompanionClass
  advancedSystems?: AdvancedGameSystems
  companionLine: string
  companionEmotion: CompanionEmotion
  decorationIds: readonly string[]
  reducedMotion: boolean
  nextGoal?: string
  onRecord: () => void
  onOpenCollection: () => void
  onOpenAdventure: () => void
  onOpenCompanion: () => void
  onOpenLevel: () => void
  onOpenCoins: () => void
}

export function HomeScreen({
  summary,
  coinBalance,
  level,
  streak,
  mealGameLoop,
  characterId = 'foody',
  companionEmotion,
  reducedMotion,
  onRecord,
  onOpenCollection,
  onOpenAdventure,
  onOpenCompanion,
  onOpenLevel,
  onOpenCoins,
}: HomeScreenProps) {
  return (
    <WorldHomeScene
      coinBalance={coinBalance}
      level={level}
      todayCards={summary.todayCount}
      todayMeals={mealGameLoop.todayMeals}
      mealTarget={mealGameLoop.gaugeSteps.length}
      streakDays={streak.currentDays}
      characterId={characterId}
      emotion={companionEmotion}
      reducedMotion={reducedMotion}
      onRecord={onRecord}
      onOpenCollection={onOpenCollection}
      onOpenAdventure={onOpenAdventure}
      onOpenCompanion={onOpenCompanion}
      onOpenLevel={onOpenLevel}
      onOpenCoins={onOpenCoins}
    />
  )
}
