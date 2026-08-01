import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { MealRecordOrb } from './MealRecordOrb'

afterEach(() => {
  cleanup()
})

it('starts the existing meal flow from the large orb', async () => {
  const onRecord = vi.fn()
  const user = userEvent.setup()
  render(<MealRecordOrb onRecord={onRecord} />)

  await user.click(screen.getByRole('button', { name: '식사 기록하기' }))

  expect(onRecord).toHaveBeenCalledOnce()
})
