import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecordFlow } from './RecordFlow'

class SuccessfulFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null
  result: string | ArrayBuffer | null = null

  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,dGVzdA=='
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
  }
}

class ErrorFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null
  onabort: ((event: ProgressEvent<FileReader>) => void) | null = null
  result: string | ArrayBuffer | null = null

  readAsDataURL() {
    this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>)
  }
}

class AbortedFileReader extends ErrorFileReader {
  readAsDataURL() {
    this.onabort?.(new ProgressEvent('abort') as ProgressEvent<FileReader>)
  }
}

describe('RecordFlow', () => {
  beforeEach(() => {
    vi.stubGlobal('FileReader', SuccessfulFileReader)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('requires a photo before food selection', () => {
    render(<RecordFlow onComplete={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('uses a gallery picker without capture and advances after its upload', async () => {
    const user = userEvent.setup()
    render(<RecordFlow onComplete={vi.fn()} onCancel={vi.fn()} />)
    const cameraInput = screen.getByLabelText('식사 사진 선택')
    const galleryInput = screen.getByLabelText('사진첩에서 고르기')
    const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' })

    expect(cameraInput).toHaveAttribute('capture', 'environment')
    expect(galleryInput).not.toHaveAttribute('capture')

    await user.upload(galleryInput, file)
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByRole('heading', { name: '무엇을 먹었어?' })).toBeInTheDocument()
  })

  it('completes with one photo and two selections', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<RecordFlow onComplete={onComplete} onCancel={vi.fn()} />)
    const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' })

    await user.upload(screen.getByLabelText('식사 사진 선택'), file)
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.type(screen.getByRole('searchbox', { name: '음식 검색' }), '라면')
    await user.click(screen.getByRole('button', { name: '라면' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '맛보기' }))
    await user.click(screen.getByRole('button', { name: '카드 열기' }))

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      imageData: 'data:image/jpeg;base64,dGVzdA==',
      foodType: 'ramen',
      foodName: '라면',
      amount: 'taste',
    }))
  })

  it.each([
    [ErrorFileReader, '사진을 불러오지 못했어요. 다시 선택해 주세요.'],
    [AbortedFileReader, '사진 불러오기가 취소됐어요. 다시 선택해 주세요.'],
  ])('explains a photo reader failure in Korean', async (Reader, message) => {
    vi.stubGlobal('FileReader', Reader)
    const user = userEvent.setup()
    render(<RecordFlow onComplete={vi.fn()} onCancel={vi.fn()} />)

    await user.upload(
      screen.getByLabelText('식사 사진 선택'),
      new File(['image'], 'meal.jpg', { type: 'image/jpeg' }),
    )

    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })
})
