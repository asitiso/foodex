import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReferenceGameHud } from './ReferenceGameHud'

describe('ReferenceGameHud', () => {
  it('renders three status cards, logo, coin capsule, and preserves callbacks', async () => {
    const user = userEvent.setup()
    const onOpenLevel = vi.fn()
    const onOpenCards = vi.fn()
    const onOpenMeals = vi.fn()
    const onOpenCoins = vi.fn()

    render(
      <ReferenceGameHud
        coinBalance={1250}
        level={12}
        levelProgress={42}
        todayCards={32}
        todayMeals={2}
        mealTarget={3}
        streakDays={3}
        onOpenLevel={onOpenLevel}
        onOpenCards={onOpenCards}
        onOpenMeals={onOpenMeals}
        onOpenCoins={onOpenCoins}
      />,
    )

    expect(screen.getAllByTestId('reference-status-card')).toHaveLength(3)
    expect(screen.getByRole('img', { name: 'FOODEX' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '보유 코인 1250개' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '레벨 12, 성장 42%' }))
    await user.click(screen.getByRole('button', { name: '오늘의 카드 32장' }))
    await user.click(screen.getByRole('button', { name: '오늘 식사 2회 목표 3회 연속 3일' }))
    await user.click(screen.getByRole('button', { name: '보유 코인 1250개' }))

    expect(onOpenLevel).toHaveBeenCalledTimes(1)
    expect(onOpenCards).toHaveBeenCalledTimes(1)
    expect(onOpenMeals).toHaveBeenCalledTimes(1)
    expect(onOpenCoins).toHaveBeenCalledTimes(1)
  })
})
