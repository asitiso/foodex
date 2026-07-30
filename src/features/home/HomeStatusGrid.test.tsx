import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HomeStatusGrid } from './HomeStatusGrid'

describe('HomeStatusGrid', () => {
  it('shows four compact game statuses and opens their destinations', async () => {
    const onOpenAdventure = vi.fn()
    const onOpenCollection = vi.fn()
    render(
      <HomeStatusGrid
        level={3}
        todayCards={2}
        quest={{ title: '새 음식 발견', completed: false }}
        streakDays={4}
        onOpenAdventure={onOpenAdventure}
        onOpenCollection={onOpenCollection}
      />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByText('레벨')).toBeInTheDocument()
    expect(screen.getByText('오늘의 카드')).toBeInTheDocument()
    expect(screen.getByText('오늘의 도전')).toBeInTheDocument()
    expect(screen.getByText('연속 기록')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /오늘의 카드/ }))
    expect(onOpenCollection).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: /오늘의 도전/ }))
    expect(onOpenAdventure).toHaveBeenCalledOnce()
  })
})
