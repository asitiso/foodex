import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { CompanionScreen } from './CompanionScreen'
import { buildProgression } from '../../domain/progression'

const props = {
  entries: [],
  roomUnlocks: [],
  progression: buildProgression([]),
  rewards: [],
  experienceSettings: { soundEnabled: true, musicEnabled: false, hapticsEnabled: true, reducedMotion: false },
  onExperienceSettingsChange: () => undefined,
}

describe('CompanionScreen', () => {
  afterEach(cleanup)

  it('opens on the room with distinct secondary actions and no journal or report content', () => {
    const { container } = render(<CompanionScreen {...props} />)

    expect(container.querySelector('.companion-room-scene')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기록 책장 열기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '리포트 열기' })).toBeInTheDocument()
    expect(screen.queryByText('오늘의 식사 일기')).not.toBeInTheDocument()
    expect(screen.queryByText('주간 리포트')).not.toBeInTheDocument()
  })

  it('reveals each story only after its secondary room action is selected', async () => {
    const user = userEvent.setup()
    render(<CompanionScreen {...props} />)

    await user.click(screen.getByRole('button', { name: '기록 책장 열기' }))
    expect(screen.getByRole('heading', { name: '오늘의 식사 일기' })).toBeInTheDocument()
    expect(screen.queryByText('주간 리포트')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '리포트 열기' }))
    expect(screen.getByRole('heading', { name: '주간 리포트' })).toBeInTheDocument()
  })

  it('opens the shop in the room sheet and preserves preview behavior', async () => {
    const user = userEvent.setup()
    const { container } = render(<CompanionScreen {...props} coinBalance={30} shopOnline />)
    await user.click(screen.getByRole('button', { name: '꾸미기 상점 열기' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /미리보기/ })[0])
    expect(container.querySelector('.shop-dialog')).toBeInTheDocument()
  })
})
