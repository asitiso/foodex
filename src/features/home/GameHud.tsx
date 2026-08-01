import { GameIcon } from '../../ui/GameIcon'
import { GameLogo } from './GameLogo'

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
    <header className="game-hud" data-game-surface="hud">
      <GameLogo />

      <button className="game-coin-pill game-touch-target" type="button" aria-label={`보유 코인 ${coinBalance}개`} onClick={onOpenCoins}>
        <span className="game-icon-medallion"><GameIcon name="coin" /></span>
        <span className="game-hud-value">{coinBalance.toLocaleString()}</span>
        <span className="game-coin-add" aria-hidden="true">+</span>
      </button>

      <div className="game-status-rail" aria-label="오늘의 게임 상태">
        <button className="game-status-button game-status-level game-touch-target" data-testid="game-hud-status" type="button" aria-label={`레벨 ${level}, 성장 ${levelProgress}%`} onClick={onOpenLevel}>
          <span className="game-status-title">Lv.</span>
          <span className="game-hud-value">{level}</span>
          <span className="game-hud-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
        </button>

        <button className="game-status-button game-status-cards game-touch-target" data-testid="game-hud-status" type="button" aria-label={`오늘의 카드 ${todayCards}장`} onClick={onOpenCards}>
          <span className="game-status-title">카드</span>
          <span className="game-hud-value">{todayCards}</span>
          <span className="game-status-unit">장</span>
        </button>

        <button className="game-status-button game-status-meals game-touch-target" data-testid="game-hud-status" type="button" aria-label={`오늘 식사 ${todayMeals}회 목표 ${mealTarget}회 연속 ${streakDays}일`} onClick={onOpenMeals}>
          <span className="game-status-title">식사</span>
          <span className="game-hud-value">{todayMeals}/{mealTarget}</span>
          <span className="game-hud-streak">연속 ${streakDays}일</span>
        </button>
      </div>
    </header>
  )
}
