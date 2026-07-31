import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { WorldHomeScene } from './WorldHomeScene'

const props = {
  coinBalance: 13,
  level: { level: 2, currentLevelXp: 25, nextLevelXp: 50, totalXp: 75 },
  todayCards: 1,
  todayMeals: 1,
  mealTarget: 3,
  streakDays: 2,
  characterId: 'foody' as const,
  emotion: 'happy' as const,
  reducedMotion: true,
  onRecord: vi.fn(),
  onOpenCollection: vi.fn(),
  onOpenAdventure: vi.fn(),
  onOpenMeals: vi.fn(),
  onOpenCompanion: vi.fn(),
  onOpenLevel: vi.fn(),
  onOpenCoins: vi.fn(),
}

afterEach(cleanup)

it('keeps the lobby actions in one outdoor scene', async () => {
  const user = userEvent.setup()
  render(<WorldHomeScene {...props} />)

  expect(screen.getByRole('region', { name: '푸덱 월드 홈' })).toHaveStyle({
    '--scene-background': 'url("/art/world/world-home-day.webp")',
  })
  expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)

  await user.click(screen.getByRole('button', { name: '푸덱 마을 모험 보기' }))
  await user.click(screen.getByRole('button', { name: '오늘의 식사 도전 보기' }))
  await user.click(screen.getByRole('button', { name: '식사 기록하기' }))

  expect(props.onOpenAdventure).toHaveBeenCalledTimes(2)
  expect(props.onRecord).toHaveBeenCalledOnce()
})
