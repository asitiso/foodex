import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BottomNav } from './BottomNav'

describe('BottomNav', () => {
  afterEach(cleanup)

  it('keeps capture in the center of five destinations', () => {
    render(<BottomNav active="home" onNavigate={vi.fn()} />)

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '⌂홈',
      '▦도감',
      '📷촬영',
      '✦모험',
      '●버디',
    ])
    expect(screen.getByRole('button', { name: '촬영' })).toHaveClass('primary')
  })

  it('keeps all five routes and names the companion route 버디', () => {
    render(<BottomNav active="home" onNavigate={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(5)
    expect(screen.getByRole('button', { name: '버디' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '촬영' })).toBeInTheDocument()
  })
})
