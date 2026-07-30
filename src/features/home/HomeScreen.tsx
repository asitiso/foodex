import type { AdventureBoard, DailyQuest, MealStreak, PlayerLevel } from '../../domain/progression'
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
  adventureBoard: AdventureBoard
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
  adventureBoard,
  companionLine,
  companionEmotion,
  decorationIds,
  reducedMotion,
  onRecord,
  onOpenCollection,
  onOpenAdventure,
  onOpenCompanion,
}: HomeScreenProps) {
  const nextQuest = dailyQuests.find((quest) => !quest.completed && !adventureBoard.items.some((item) => item.title === quest.title))
    ?? dailyQuests.find((quest) => !quest.completed)
    ?? dailyQuests.at(-1)
  const statusQuest = nextQuest && adventureBoard.items.some((item) => item.title === nextQuest.title)
    ? { ...nextQuest, title: '세계 탐험' }
    : nextQuest

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
        quest={statusQuest}
        streakDays={streak.currentDays}
        onOpenAdventure={onOpenAdventure}
        onOpenCollection={onOpenCollection}
      />

      <section className="home-adventure-board" aria-label={adventureBoard.title}>
        <div className="section-title-row">
          <h2>{adventureBoard.title}</h2>
          <button className="inline-button" type="button" onClick={onOpenAdventure}>모험 보기</button>
        </div>
        <div className="home-adventure-list">
          {adventureBoard.items.map((item) => (
            <article className={item.completed ? 'home-adventure-item completed' : 'home-adventure-item'} key={item.id}>
              <span aria-hidden="true">{item.completed ? '✓' : '□'}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.reward}</small>
              </div>
            </article>
          ))}
        </div>
        <p>{adventureBoard.nextFocus}</p>
      </section>

      <button className="primary-cta room-record-cta" type="button" onClick={onRecord}>
        <span aria-hidden="true">📷</span>
        식사 카드 획득하기
      </button>
    </section>
  )
}
