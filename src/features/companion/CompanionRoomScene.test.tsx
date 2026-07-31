import { cleanup, render, screen } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CompanionRoomScene } from './CompanionRoomScene'

const props = {
  characterId: 'foody' as const,
  emotion: 'happy' as const,
  reducedMotion: false,
  evolution: {
    characterId: 'foody' as const,
    stage: 2 as const,
    title: '성장 중',
    formName: '든든한 푸디',
    nextAt: 7,
    remaining: 4,
    progress: 43,
  },
  coinBalance: 13,
  activePanel: null,
  onPanelChange: vi.fn(),
  childrenByPanel: {
    wardrobe: <p>옷장 내용</p>,
    growth: <p>성장 내용</p>,
    shop: <p>상점 내용</p>,
  },
}

describe('CompanionRoomScene', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders one warm room scene and three named locations', () => {
    render(<CompanionRoomScene {...props} />)

    expect(screen.getByRole('region', { name: '친구의 방' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '옷장 열기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '성장 거울 열기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '꾸미기 상점 열기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '보유 코인 13개, 꾸미기 상점 열기' })).toBeInTheDocument()
  })

  it('opens the shop when the coin balance is pressed', async () => {
    const user = userEvent.setup()
    render(<CompanionRoomScene {...props} />)

    await user.click(screen.getByRole('button', { name: '보유 코인 13개, 꾸미기 상점 열기' }))

    expect(props.onPanelChange).toHaveBeenCalledWith('shop')
  })

  it('opens the requested room panel', async () => {
    const user = userEvent.setup()
    render(<CompanionRoomScene {...props} />)

    await user.click(screen.getByRole('button', { name: '꾸미기 상점 열기' }))

    expect(props.onPanelChange).toHaveBeenCalledWith('shop')
  })

  it('clears the active panel when the shared sheet closes', async () => {
    const user = userEvent.setup()
    const onPanelChange = vi.fn()

    function RoomHarness() {
      const [activePanel, setActivePanel] = useState<'wardrobe' | 'growth' | 'shop' | null>(null)
      const handlePanelChange = (panel: 'wardrobe' | 'growth' | 'shop' | null) => {
        onPanelChange(panel)
        setActivePanel(panel)
      }

      return <CompanionRoomScene {...props} activePanel={activePanel} onPanelChange={handlePanelChange} />
    }

    render(<RoomHarness />)
    await user.click(screen.getByRole('button', { name: '꾸미기 상점 열기' }))
    await user.click(screen.getByRole('button', { name: '꾸미기 상점 닫기' }))

    expect(onPanelChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByRole('dialog', { name: '꾸미기 상점' })).not.toBeInTheDocument()
  })

  it('mounts only the active panel in its named sheet', () => {
    render(<CompanionRoomScene {...props} activePanel="growth" />)

    expect(screen.getByRole('dialog', { name: '성장 거울' })).toBeInTheDocument()
    expect(screen.getByText('성장 내용')).toBeInTheDocument()
    expect(screen.queryByText('옷장 내용')).not.toBeInTheDocument()
    expect(screen.queryByText('상점 내용')).not.toBeInTheDocument()
  })
})
