export function HomeStatusGrid({
  level,
  todayCards,
  quest,
  streakDays,
  onOpenAdventure,
  onOpenCollection,
}: {
  level: number
  todayCards: number
  quest?: { title: string; completed: boolean }
  streakDays: number
  onOpenAdventure: () => void
  onOpenCollection: () => void
}) {
  return (
    <section className="home-status-grid" aria-label="오늘의 게임 상태">
      <button type="button" onClick={onOpenAdventure}>
        <span aria-hidden="true">⭐</span>
        <small>레벨</small>
        <strong>Lv.{level}</strong>
      </button>
      <button type="button" onClick={onOpenCollection}>
        <span aria-hidden="true">🃏</span>
        <small>오늘의 카드</small>
        <strong>{todayCards}장</strong>
      </button>
      <button type="button" onClick={onOpenAdventure}>
        <span aria-hidden="true">🎯</span>
        <small>오늘의 도전</small>
        <strong>{quest ? (quest.completed ? '완료!' : quest.title) : '모두 완료!'}</strong>
      </button>
      <button type="button" onClick={onOpenAdventure}>
        <span aria-hidden="true">🔥</span>
        <small>연속 기록</small>
        <strong>{streakDays}일</strong>
      </button>
    </section>
  )
}
