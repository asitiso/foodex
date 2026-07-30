import type { DailyQuest, MealStreak, PlayerLevel } from '../../domain/progression'
import { CompanionRoom } from './CompanionRoom'
import type { CompanionEmotion } from './CompanionRoom'
import { HomeStatusGrid } from './HomeStatusGrid'

interface HomeScreenProps {
  summary: {
    todayCount: number
    discoveredCount: number
    totalXp: number
    lastMealAt?: number
  }
  level: PlayerLevel
  streak: MealStreak
  dailyQuests: DailyQuest[]
  companionLine: string
  companionEmotion: CompanionEmotion
  decorationIds: readonly string[]
  reducedMotion: boolean
  onRecord: () => void
  onOpenCollection: () => void
  onOpenAdventure: () => void
  onOpenCompanion: () => void
}

export function HomeScreen({
  summary,
  level,
  streak,
  dailyQuests,
  companionLine,
  companionEmotion,
  decorationIds,
  reducedMotion,
  onRecord,
  onOpenCollection,
  onOpenAdventure,
  onOpenCompanion,
}: HomeScreenProps) {
  const nextQuest = dailyQuests.find((quest) => !quest.completed)
    ?? dailyQuests.at(-1)

  return (
    <section className="home-screen home-room-screen" aria-label="홈">
      <header className="room-home-header">
        <div>
          <p className="eyebrow">FOODEX ROOM</p>
          <h1>푸디의 맛있는 방</h1>
        </div>
        <span className="room-level-pill">LV.{level.level}</span>
      </header>

      <CompanionRoom
        emotion={companionEmotion}
        line={companionLine}
        decorationIds={decorationIds}
        reducedMotion={reducedMotion}
        onOpenCompanion={onOpenCompanion}
      />

      <HomeStatusGrid
        level={level.level}
        todayCards={summary.todayCount}
        quest={nextQuest}
        streakDays={streak.currentDays}
        onOpenAdventure={onOpenAdventure}
        onOpenCollection={onOpenCollection}
      />

      <button className="primary-cta room-record-cta" type="button" onClick={onRecord}>
        <span aria-hidden="true">📷</span>
        식사 카드 획득하기
      </button>
    </section>
  )
}
