import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BottomNav } from './BottomNav'

describe('BottomNav', () => {
  afterEach(cleanup)

  it('keeps capture in the center of five reference destinations', () => {
    render(<BottomNav active="home" onNavigate={vi.fn()} />)

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '홈',
      '도감',
      '촬영',
      '모험',
      '버디룸',
    ])
    expect(screen.getByRole('button', { name: '촬영' })).toHaveClass('primary', 'reference-bottom-nav-item--primary')
    expect(screen.getByRole('button', { name: '홈' })).toHaveAttribute('data-nav-tab', 'home')
  })

  it('renders one svg icon for every route', () => {
    const { container } = render(<BottomNav active="home" onNavigate={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(5)
    expect(container.querySelectorAll('.bottom-nav-icon svg')).toHaveLength(5)
  })
})
