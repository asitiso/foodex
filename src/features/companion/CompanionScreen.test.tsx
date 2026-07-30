import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CompanionScreen } from './CompanionScreen'
import { buildProgression } from '../../domain/progression'

describe('CompanionScreen', () => {
  it('separates journal report and room without a fake chat input', async () => {
    render(
      <CompanionScreen
        entries={[]}
        roomUnlocks={[]}
        progression={buildProgression([])}
        rewards={[]}
        experienceSettings={{
          soundEnabled: true,
          musicEnabled: false,
          hapticsEnabled: true,
          reducedMotion: false,
        }}
        onExperienceSettingsChange={() => undefined}
      />,
    )

    expect(screen.getByRole('tab', { name: '식사 일기' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '월간 리포트' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '내 방' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('첫 기록을 남기면 푸드 친구가 오늘의 이야기를 써 줄게요.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: '내 방' }))
    expect(screen.getByRole('tabpanel', { name: '내 방' })).toHaveTextContent('다음 장식')
  })
})
