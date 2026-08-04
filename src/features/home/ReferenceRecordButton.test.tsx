import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReferenceRecordButton } from './ReferenceRecordButton'

describe('ReferenceRecordButton', () => {
  it('keeps the meal recording action', async () => {
    const onRecord = vi.fn()
    const user = userEvent.setup()
    render(<ReferenceRecordButton onRecord={onRecord} />)
    const button = screen.getByRole('button', { name: '식사 기록하기' })
    expect(button).toHaveAttribute('data-home-landmark', 'record')
    await user.click(button)
    expect(onRecord).toHaveBeenCalledTimes(1)
  })
})
