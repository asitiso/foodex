import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameLogo } from './GameLogo'

describe('GameLogo', () => {
  it('renders an accessible Foodex logo with decorative star', () => {
    render(<GameLogo />)

    expect(screen.getByRole('img', { name: 'FOODEX' })).toBeInTheDocument()
    expect(screen.getByTestId('foodex-logo-star')).toHaveAttribute('aria-hidden', 'true')
  })
})
