import { GameIcon } from '../../ui/GameIcon'
import { GameLogo } from './GameLogo'
import { ReferenceStatusCard } from './ReferenceStatusCard'

export interface ReferenceGameHudProps {
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

export function ReferenceGameHud({
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
}: ReferenceGameHudProps) {
  return (
    <header className="reference-game-hud" data-game-surface="hud">
      <div className="reference-status-stack">
        <ReferenceStatusCard
          title="Lv."
          value={String(level)}
          progress={levelProgress}
          tone="level"
          ariaLabel={`레벨 ${level}, 성장 ${levelProgress}%`}
          onActivate={onOpenLevel}
        />
        <ReferenceStatusCard
          title="카드"
          value={String(todayCards)}
          tone="cards"
          ariaLabel={`오늘의 카드 ${todayCards}장`}
          onActivate={onOpenCards}
        />
        <ReferenceStatusCard
          title="식사"
          value={`${todayMeals}/${mealTarget}`}
          helperText={`연속 ${streakDays}일`}
          tone="meals"
          ariaLabel={`오늘 식사 ${todayMeals}회 목표 ${mealTarget}회 연속 ${streakDays}일`}
          onActivate={onOpenMeals}
        />
      </div>

      <GameLogo />

      <button
        type="button"
        className="reference-coin-capsule"
        aria-label={`보유 코인 ${coinBalance}개`}
        onClick={onOpenCoins}
      >
        <span className="reference-coin-icon" aria-hidden="true"><GameIcon name="coin" /></span>
        <strong>{coinBalance.toLocaleString()}</strong>
        <span className="reference-coin-plus" aria-hidden="true">+</span>
      </button>
    </header>
  )
}
