import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { ExperienceSettings } from './ExperienceSettings'

const defaults = {
  soundEnabled: true,
  musicEnabled: false,
  hapticsEnabled: true,
  reducedMotion: false,
}

afterEach(cleanup)

describe('ExperienceSettings', () => {
  it('turns sound off without changing haptics', async () => {
    const onChange = vi.fn()
    render(<ExperienceSettings value={defaults} onChange={onChange} />)

    await userEvent.click(screen.getByRole('switch', { name: '효과음' }))

    expect(onChange).toHaveBeenCalledWith({ ...defaults, soundEnabled: false })
  })

  it('exposes every option as an accessible switch', () => {
    render(<ExperienceSettings value={defaults} onChange={() => undefined} />)

    expect(screen.getByRole('switch', { name: '효과음' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: '배경음' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('switch', { name: '진동' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: '움직임 줄이기' })).toHaveAttribute('aria-checked', 'false')
  })
})
