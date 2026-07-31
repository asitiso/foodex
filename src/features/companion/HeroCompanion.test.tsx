import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HeroCompanion } from './HeroCompanion'

describe('HeroCompanion', () => {
  it('renders the selected layered character asset', () => {
    render(<HeroCompanion characterId="berry" emotion="happy" reducedMotion={false} />)

    expect(screen.getByRole('button', { name: '기뻐하는 베리' })).toHaveStyle({
      '--companion-art': 'url("/art/characters/berry.png")',
    })
  })

  it('does not repeat the same click reaction consecutively', async () => {
    const user = userEvent.setup()
    render(<HeroCompanion characterId="foody" emotion="happy" reducedMotion={false} />)
    const companion = screen.getByRole('button', { name: '기뻐하는 푸디' })

    await user.click(companion)
    const first = companion.getAttribute('data-reaction')
    await user.click(companion)

    expect(companion.getAttribute('data-reaction')).not.toBe(first)
  })

  it('marks the character as reduced motion without removing its identity', () => {
    render(<HeroCompanion characterId="cocoa" emotion="calm" reducedMotion />)

    expect(screen.getByRole('button', { name: '차분한 코코' })).toHaveClass('reduced-motion')
  })
})
