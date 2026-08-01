import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { HomeMenuCard } from './HomeMenuCard'

afterEach(cleanup)

it('renders a named toy-card action', async () => {
  const user = userEvent.setup()
  const onActivate = vi.fn()
  render(<HomeMenuCard label="업적" icon="achievement" onActivate={onActivate} />)

  await user.click(screen.getByRole('button', { name: '업적' }))

  expect(onActivate).toHaveBeenCalledOnce()
})
