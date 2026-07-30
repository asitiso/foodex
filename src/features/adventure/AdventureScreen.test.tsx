import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { buildProgression } from '../../domain/progression'
import { AdventureScreen } from './AdventureScreen'

describe('AdventureScreen', () => {
  afterEach(cleanup)
  it('groups quests achievements and events without putting them on home', async () => {
    render(<AdventureScreen progression={buildProgression([])} />)

    expect(screen.getByRole('tab', { name: '오늘' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '업적' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '이벤트' })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: '오늘' })).toHaveTextContent('오늘의 도전')

    await userEvent.click(screen.getByRole('tab', { name: '업적' }))
    expect(screen.getByRole('tabpanel', { name: '업적' })).toHaveTextContent('첫 식사')
    expect(screen.queryByRole('tabpanel', { name: '오늘' })).not.toBeInTheDocument()
  })

  it('highlights missions and achievements completed by the latest meal', async () => {
    const progression = buildProgression([])
    progression.dailyQuests[0] = { ...progression.dailyQuests[0], completed: true }
    progression.achievements[0] = { ...progression.achievements[0], unlocked: true }
    render(
      <AdventureScreen
        progression={progression}
        recentQuestIds={['today-card']}
        recentAchievementIds={['first-meal']}
      />,
    )

    expect(screen.getByTestId('quest-today-card')).toHaveClass('recently-unlocked')
    await userEvent.click(screen.getByRole('tab', { name: '업적' }))
    expect(screen.getByTestId('achievement-first-meal')).toHaveClass('recently-unlocked')
  })
})
