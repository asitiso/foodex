import type { FoodCard, MealRecord } from '../../domain/types'
import type { DailyQuest, MealStreak, PlayerLevel, RewardBox, SeasonEvent } from '../../domain/progression'
import type { V3Progress } from '../../domain/v3Progression'
import { V3DiscoverySummary } from '../reveal/V3DiscoverySummary'
import type { V3DiscoveryResult } from '../reveal/V3DiscoverySummary'

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
  season: SeasonEvent
  rewardBox: RewardBox
  latestCards: Array<{ card: FoodCard; meal: MealRecord }>
  discovery?: V3DiscoveryResult
  activeEvent?: V3Progress['activeEvent']
  onRecord: () => void
  onOpenCollection: () => void
}

function formatMealTime(recordedAt?: number) {
  if (!recordedAt) return '아직 기록된 식사가 없어요'

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(recordedAt)
}

export function HomeScreen({ summary, level, streak, dailyQuests, season, rewardBox, latestCards, discovery, activeEvent, onRecord, onOpenCollection }: HomeScreenProps) {
  const remainingXp = level.nextLevelXp - level.currentLevelXp

  return (
    <section className="home-screen" aria-label="홈">
      <header className="home-header">
        <p className="eyebrow">FOODEX</p>
        <h1>오늘의 한입이<br />멋진 카드가 돼!</h1>
        <p>{formatMealTime(summary.lastMealAt)}</p>
      </header>

      {discovery && <V3DiscoverySummary {...discovery} />}

      {activeEvent && (
        <section className="active-event" aria-labelledby="active-event-title">
          <div className="section-title-row">
            <h2 id="active-event-title">{activeEvent.title}</h2>
            <strong>{activeEvent.completed}/{activeEvent.total}</strong>
          </div>
          <p>{new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(activeEvent.endsAt))}까지</p>
        </section>
      )}

      <div className="today-card" aria-label={`오늘 카드 ${summary.todayCount}장`}>
        <span>오늘 카드</span>
        <strong>오늘 카드 {summary.todayCount}장</strong>
        <small>맛있게 먹은 순간을 기록해 봐.</small>
      </div>

      <dl className="summary-grid">
        <div><dt>발견한 음식</dt><dd>{summary.discoveredCount}개</dd></div>
        <div><dt>모은 경험치</dt><dd>{summary.totalXp} XP</dd></div>
      </dl>

      <section className="level-panel" aria-label={`레벨 ${level.level}`}>
        <div>
          <span>나의 모험 레벨</span>
          <strong>레벨 {level.level}</strong>
        </div>
        <p>다음 레벨까지 {remainingXp} XP</p>
        <div className="level-track" aria-hidden="true">
          <span style={{ width: `${Math.min(100, Math.round((level.currentLevelXp / level.nextLevelXp) * 100))}%` }} />
        </div>
      </section>

      <section className="quest-panel" aria-labelledby="quest-title">
        <div className="section-title-row">
          <h2 id="quest-title">오늘 퀘스트</h2>
          <strong>연속 {streak.currentDays}일</strong>
        </div>
        <div className="quest-list">
          {dailyQuests.map((quest) => (
            <article className={quest.completed ? 'quest completed' : 'quest'} key={quest.id}>
              <div>
                <strong>{quest.title}</strong>
                <small>{quest.description}</small>
              </div>
              <span>{quest.completed ? '완료' : '진행중'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="season-panel" aria-labelledby="season-title">
        <div className="section-title-row">
          <h2 id="season-title">{season.title}</h2>
          <strong>{season.completedSteps}/{season.totalSteps}</strong>
        </div>
        <p>{season.completed ? `${season.rewardTitle} 획득 가능` : `${season.rewardTitle}까지 조금만 더`}</p>
        <div className="level-track" aria-hidden="true">
          <span style={{ width: `${Math.round((season.completedSteps / season.totalSteps) * 100)}%` }} />
        </div>
      </section>

      <section className={rewardBox.available ? 'reward-box available' : 'reward-box'} aria-label={rewardBox.title}>
        <div>
          <span>{rewardBox.available ? '열 수 있어요' : '퀘스트를 더 해봐요'}</span>
          <strong>{rewardBox.title}</strong>
        </div>
        <p>{rewardBox.rewardPreview}</p>
      </section>

      <section className="latest-section" aria-labelledby="latest-title">
        <div className="section-title-row">
          <h2 id="latest-title">최근 발견</h2>
          {latestCards.length > 0 && <button className="inline-button" type="button" onClick={onOpenCollection}>모두 보기</button>}
        </div>
        {latestCards.length === 0 ? (
          <p className="gentle-empty">첫 번째 식사 카드를 만나 볼까?</p>
        ) : (
          <div className="latest-cards">
            {latestCards.slice(0, 3).map(({ card }) => (
              <article className={`mini-card rarity-${card.rarity}`} key={card.id}>
                <span>{card.rarity.toUpperCase()}</span>
                <strong>{card.name}</strong>
                <small>+{card.xp} XP</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <button className="primary-cta" type="button" onClick={onRecord}>식사 카드 획득하기</button>
    </section>
  )
}
