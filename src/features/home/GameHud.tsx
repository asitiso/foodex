import { GameIcon } from '../../ui/GameIcon'

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
        <GameIcon name="coin" />
        <span className="game-hud-value">{coinBalance}</span>
      </button>
      <div className="game-status-rail" aria-label="오늘의 게임 상태">
        <button className="game-status-button" data-testid="game-hud-status" type="button" aria-label={`레벨 ${level}, 성장 ${levelProgress}%`} onClick={onOpenLevel}>
          <GameIcon name="level" />
          <span className="game-hud-value">{level}</span>
          <span className="game-hud-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
        </button>
        <button className="game-status-button" data-testid="game-hud-status" type="button" aria-label={`오늘의 카드 ${todayCards}장`} onClick={onOpenCards}>
          <GameIcon name="cards" />
          <span className="game-hud-value">{todayCards}</span>
        </button>
        <button className="game-status-button" data-testid="game-hud-status" type="button" aria-label={`오늘 식사 ${todayMeals}회 목표 ${mealTarget}회 연속 ${streakDays}일`} onClick={onOpenMeals}>
          <GameIcon name="meal" />
          <span className="game-hud-value">{todayMeals}/{mealTarget}</span>
          <span className="game-hud-streak">{streakDays}일</span>
        </button>
      </div>
    </header>
  )
}
