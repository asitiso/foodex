import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeScreen } from './HomeScreen'

const props = {
  summary: { todayCount: 1, discoveredCount: 1, totalXp: 20 },
  coinBalance: 13,
  level: { level: 1, currentLevelXp: 20, nextLevelXp: 30, totalXp: 20 },
  streak: { currentDays: 1, recordedToday: true },
  dailyQuests: [],
  adventureBoard: { title: '오늘의 모험 보드', nextFocus: '', items: [] },
  mealGameLoop: {
    todayMeals: 1,
    gaugeSteps: [true, false, false] as [boolean, boolean, boolean],
    nextMealTarget: 2 as 1 | 2 | 3,
    nextMealRemaining: 1,
    comboLabel: '첫 출발 콤보',
    comboReward: 5,
    weeklyMeals: 1,
    weeklyTarget: 5 as 5 | 10 | 15,
    recoveryAvailable: false,
    totalMeals: 1,
    growth: { current: 0, next: 3, remaining: 2 },
  },
  mealAdventure: {
    choice: { title: '', options: [] },
    route: { id: 'lunch', label: '', stage: 1, completed: false },
    mood: 'energized' as const,
    recipes: [],
    roomReward: { title: '', remaining: 2 },
    chapter: { title: '', line: '' },
    rewardChoices: [],
    monthly: { breakfast: 1, lunch: 1, dinner: 0, completeDays: 1 },
  },
  companionLine: '',
  companionEmotion: 'happy' as const,
  decorationIds: [],
  reducedMotion: false,
  onRecord: vi.fn(),
  onOpenCollection: vi.fn(),
  onOpenAdventure: vi.fn(),
  onOpenMeals: vi.fn(),
  onOpenCompanion: vi.fn(),
  onOpenLevel: vi.fn(),
  onOpenCoins: vi.fn(),
}

describe('HomeScreen', () => {
  afterEach(cleanup)

  it('shows the outdoor game lobby without dashboard sections', () => {
    render(<HomeScreen {...props} />)

    expect(screen.getByRole('region', { name: '푸덱 월드 홈' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '컬렉션 가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '모험 가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '식사 기록하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '버디 가기' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '홈 게임 메뉴' })).toBeInTheDocument()
    expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)
    expect(screen.queryByText('오늘의 모험 보드')).not.toBeInTheDocument()
    expect(screen.queryByText('오늘의 식사 게이지')).not.toBeInTheDocument()
  })

  it('opens the room from the explicit companion action', async () => {
    const user = userEvent.setup()
    render(<HomeScreen {...props} />)

    await user.click(screen.getByRole('button', { name: '버디 가기' }))

    expect(props.onOpenCompanion).toHaveBeenCalledOnce()
  })
})
