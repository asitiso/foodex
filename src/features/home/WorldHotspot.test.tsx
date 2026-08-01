import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { WorldHotspot } from './WorldHotspot'

afterEach(() => {
  cleanup()
})

it('exposes a decorative world object as a named action', async () => {
  const onActivate = vi.fn()
  const user = userEvent.setup()
  const { container } = render(
    <WorldHotspot
      label="푸드 마을 모험 보기"
      className="village"
      icon="room"
      onActivate={onActivate}
    />,
  )

  await user.click(screen.getByRole('button', { name: '푸드 마을 모험 보기' }))

  expect(onActivate).toHaveBeenCalledOnce()
  expect(container.querySelector('svg')).not.toBeNull()
})
