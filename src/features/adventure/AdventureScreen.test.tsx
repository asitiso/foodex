import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { buildProgression } from '../../domain/progression'
import { AdventureScreen } from './AdventureScreen'

describe('AdventureScreen', () => {
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
})
