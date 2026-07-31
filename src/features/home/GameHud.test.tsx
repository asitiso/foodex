import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameHud } from './GameHud'

const props = {
  coinBalance: 13,
  level: 4,
  levelProgress: 60,
  todayCards: 2,
  todayMeals: 1,
  mealTarget: 3,
  streakDays: 4,
  onOpenLevel: vi.fn(),
  onOpenCards: vi.fn(),
  onOpenMeals: vi.fn(),
  onOpenCoins: vi.fn(),
}

describe('GameHud', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows one coin control and exactly three status controls', () => {
    render(<GameHud {...props} />)

    expect(screen.getByRole('button', { name: '보유 코인 13개' })).toBeInTheDocument()
    expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /레벨 4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /오늘의 카드 2장/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /오늘 식사 1회 목표 3회 연속 4일/ })).toBeInTheDocument()
  })

  it('opens each existing destination', async () => {
    const user = userEvent.setup()
    render(<GameHud {...props} />)

    await user.click(screen.getByRole('button', { name: /레벨 4/ }))
    await user.click(screen.getByRole('button', { name: /오늘의 카드 2장/ }))
    await user.click(screen.getByRole('button', { name: /오늘 식사 1회/ }))

    expect(props.onOpenLevel).toHaveBeenCalledOnce()
    expect(props.onOpenCards).toHaveBeenCalledOnce()
    expect(props.onOpenMeals).toHaveBeenCalledOnce()
  })
})
