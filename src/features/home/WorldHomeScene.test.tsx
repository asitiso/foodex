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

it('exposes the required landmark actions and reference menu cards', async () => {
  const user = userEvent.setup()
  render(<WorldHomeScene {...props} />)

  expect(screen.getByRole('region', { name: '푸덱 월드 홈' })).toHaveStyle({
    '--scene-background': 'url("/art/world/world-home-play-city.webp")',
  })
  expect(screen.getByRole('button', { name: '컬렉션 가기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '모험 가기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '식사 기록하기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '버디 가기' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: '홈 게임 메뉴' })).toBeInTheDocument()
  for (const label of ['업적', '퀘스트', '상점', '휴식']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  }
  expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)

  await user.click(screen.getByRole('button', { name: '컬렉션 가기' }))
  await user.click(screen.getByRole('button', { name: '모험 가기' }))
  await user.click(screen.getByRole('button', { name: '식사 기록하기' }))
  await user.click(screen.getByRole('button', { name: '버디 가기' }))
  await user.click(screen.getByRole('button', { name: '업적' }))
  await user.click(screen.getByRole('button', { name: '퀘스트' }))
  await user.click(screen.getByRole('button', { name: '상점' }))
  await user.click(screen.getByRole('button', { name: '휴식' }))

  expect(props.onOpenCollection).toHaveBeenCalledTimes(2)
  expect(props.onOpenAdventure).toHaveBeenCalledTimes(3)
  expect(props.onRecord).toHaveBeenCalledOnce()
  expect(props.onOpenCompanion).toHaveBeenCalledTimes(2)
})
