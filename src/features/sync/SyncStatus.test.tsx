import { render, screen } from '@testing-library/react'
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
})
