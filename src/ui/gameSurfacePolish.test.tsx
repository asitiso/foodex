import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameHud } from '../features/home/GameHud'
import { GameSheet } from './GameSheet'

describe('shared game surface polish', () => {
  afterEach(cleanup)

  it('keeps the home HUD compact with three status actions', () => {
    render(
      <GameHud
        coinBalance={1280}
        level={7}
        levelProgress={42}
        todayCards={3}
        todayMeals={2}
        mealTarget={3}
        streakDays={5}
        onOpenLevel={vi.fn()}
        onOpenCards={vi.fn()}
        onOpenMeals={vi.fn()}
        onOpenCoins={vi.fn()}
      />,
    )

    expect(screen.getByRole('banner')).toHaveAttribute('data-game-surface', 'hud')
    expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)
    expect(screen.getByRole('button', { name: '보유 코인 1280개' })).toHaveClass('game-touch-target')
  })

  it('marks the sheet body as a keyboard-scrollable game surface', () => {
    render(
      <GameSheet open title="도감" onClose={vi.fn()}>
        <p>도감 내용</p>
      </GameSheet>,
    )

    expect(screen.getByRole('dialog', { name: '도감' })).toHaveAttribute('data-game-surface', 'sheet')
    expect(screen.getByTestId('game-sheet-scroll')).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('button', { name: '도감 닫기' })).toHaveClass('game-touch-target')
  })
})
