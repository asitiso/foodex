import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProtectCollection } from './ProtectCollection'

describe('ProtectCollection', () => {
  it('waits for email verification before claiming the collection is protected', async () => {
    const user = userEvent.setup()
    const onProtect = vi.fn().mockResolvedValue(undefined)
    render(<ProtectCollection onProtect={onProtect} />)

    await user.type(screen.getByLabelText('이메일'), 'foodex@example.com')
    await user.click(screen.getByRole('button', { name: '확인 메일 보내기' }))

    expect(onProtect).toHaveBeenCalledWith('foodex@example.com')
    expect(await screen.findByText('확인 메일을 보냈어요. 메일의 안내를 완료하면 다른 기기에서도 도감을 찾을 수 있어요.')).toBeInTheDocument()
  })
})
