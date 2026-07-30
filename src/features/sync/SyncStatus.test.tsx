import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SyncStatus } from './SyncStatus'

describe('SyncStatus', () => {
  it('explains that local-only records remain available', () => {
    render(<SyncStatus state="local-only" />)
    expect(screen.getByText('기기에 안전하게 저장 중')).toBeInTheDocument()
  })

  it('offers a retry when cloud synchronization is waiting', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<SyncStatus state="failed" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('dismisses the local-only notice after a short confirmation', () => {
    vi.useFakeTimers()
    const view = render(<SyncStatus state="local-only" />)

    expect(within(view.container).getByText('기기에 안전하게 저장 중')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(4000))
    expect(within(view.container).queryByText('기기에 안전하게 저장 중')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
