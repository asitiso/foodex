import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { HOME_SCENE_ASSETS } from './scene/HomeSceneAssets'
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

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('exposes the required landmark actions and reference menu cards', async () => {
  const user = userEvent.setup()
  render(<WorldHomeScene {...props} />)

  const scene = screen.getByRole('region', { name: '푸덱 월드 홈' })
  expect(scene).toHaveAttribute('data-layered-scene', 'true')
  expect(scene).toHaveAttribute('data-reduced-motion', 'true')
  expect(screen.getByRole('button', { name: '도감 열기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '모험 열기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '식사 기록하기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '버디 열기' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: '홈 게임 메뉴' })).toBeInTheDocument()
  for (const label of ['업적', '퀘스트', '상점', '소식']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  }
  expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)

  await user.click(screen.getByRole('button', { name: '도감 열기' }))
  await user.click(screen.getByRole('button', { name: '모험 열기' }))
  await user.click(screen.getByRole('button', { name: '식사 기록하기' }))
  await user.click(screen.getByRole('button', { name: '버디 열기' }))
  await user.click(screen.getByRole('button', { name: '업적' }))
  await user.click(screen.getByRole('button', { name: '퀘스트' }))
  await user.click(screen.getByRole('button', { name: '상점' }))
  await user.click(screen.getByRole('button', { name: '소식' }))

  expect(props.onOpenCollection).toHaveBeenCalledTimes(2)
  expect(props.onOpenAdventure).toHaveBeenCalledTimes(3)
  expect(props.onRecord).toHaveBeenCalledOnce()
  expect(props.onOpenCompanion).toHaveBeenCalledTimes(2)
})

it('renders live HUD values and independent visual layers', () => {
  render(<WorldHomeScene {...props} />)

  expect(screen.getByLabelText('보유 코인 13개')).toBeInTheDocument()
  expect(screen.getByLabelText('레벨 2, 성장 50%')).toBeInTheDocument()
  expect(screen.getByLabelText('오늘의 카드 1장')).toBeInTheDocument()
  expect(screen.getByLabelText('오늘 식사 1회 목표 3회 연속 2일')).toBeInTheDocument()
  expect(screen.getByTestId('home-layer-background')).toBeInTheDocument()
  expect(screen.getByTestId('home-layer-landmarks')).toBeInTheDocument()
  expect(screen.getByTestId('home-layer-character')).toBeInTheDocument()
  expect(screen.getByTestId('home-layer-effects')).toHaveAttribute('data-motion', 'reduced')
})

it('defines replaceable asset slots without embedding live UI text', () => {
  expect(HOME_SCENE_ASSETS).toMatchObject({
    backgrounds: {
      sky: expect.any(String),
      distant: expect.any(String),
      ground: expect.any(String),
    },
    landmarks: {
      collection: expect.any(String),
      record: expect.any(String),
      adventure: expect.any(String),
      buddy: expect.any(String),
    },
    character: {
      shadow: expect.any(String),
    },
    effects: {
      sparkle: expect.any(String),
      glow: expect.any(String),
    },
  })
})
