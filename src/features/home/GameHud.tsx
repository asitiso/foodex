export interface GameHudProps {
  coinBalance: number
  level: number
  levelProgress: number
  todayCards: number
  todayMeals: number
  mealTarget: number
  streakDays: number
  onOpenLevel: () => void
  onOpenCards: () => void
  onOpenMeals: () => void
  onOpenCoins: () => void
}

export function GameHud({
  coinBalance,
  level,
  levelProgress,
  todayCards,
  todayMeals,
  mealTarget,
  streakDays,
  onOpenLevel,
  onOpenCards,
  onOpenMeals,
  onOpenCoins,
}: GameHudProps) {
  const progress = Math.max(0, Math.min(levelProgress, 100))

  return (
    <header className="game-hud">
      <div className="game-logo" aria-label="Foodex">FOODEX</div>
      <button className="game-coin-pill" type="button" aria-label={`보유 코인 ${coinBalance}개`} onClick={onOpenCoins}>
        <span aria-hidden="true">🪙</span>
        <span className="game-hud-value">{coinBalance}</span>
      </button>
      <div className="game-status-rail" aria-label="오늘의 게임 상태">
        <button
          className="game-status-button"
          data-testid="game-hud-status"
          type="button"
          aria-label={`레벨 ${level}, 성장 ${levelProgress}%`}
          onClick={onOpenLevel}
        >
          <span className="game-hud-label">LV.</span>
          <span className="game-hud-value">{level}</span>
          <span className="game-hud-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </span>
        </button>
        <button
          className="game-status-button"
          data-testid="game-hud-status"
          type="button"
          aria-label={`오늘의 카드 ${todayCards}장`}
          onClick={onOpenCards}
        >
          <span className="game-hud-label">카드</span>
          <span className="game-hud-value">{todayCards}</span>
          <span className="game-hud-unit">장</span>
        </button>
        <button
          className="game-status-button"
          data-testid="game-hud-status"
          type="button"
          aria-label={`오늘 식사 ${todayMeals}회 목표 ${mealTarget}회 연속 ${streakDays}일`}
          onClick={onOpenMeals}
        >
          <span className="game-hud-label">식사</span>
          <span className="game-hud-value">{todayMeals}</span>
          <span className="game-hud-unit">/{mealTarget}</span>
          <span className="game-hud-streak">연속 {streakDays}일</span>
        </button>
      </div>
    </header>
  )
}
