import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const captureNativeMealPhoto = vi.hoisted(() => vi.fn())

vi.mock('../../lib/nativePlatform', () => ({
  captureNativeMealPhoto,
  isNativeApp: () => true,
}))

import { RecordFlow } from './RecordFlow'

describe('RecordFlow on Android', () => {
  afterEach(() => {
    cleanup()
    captureNativeMealPhoto.mockReset()
  })

  it('uses the native camera and enables the next step after capture', async () => {
    captureNativeMealPhoto.mockResolvedValue('data:image/jpeg;base64,bmF0aXZl')
    const user = userEvent.setup()
    render(<RecordFlow onComplete={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '카메라로 식사 사진 찍기' }))

    expect(captureNativeMealPhoto).toHaveBeenCalledOnce()
    expect(screen.getByAltText('선택한 식사 사진')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled()
  })
})
