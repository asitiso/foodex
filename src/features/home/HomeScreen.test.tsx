import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { HomeScreen } from './HomeScreen'

const props = {
  summary: { todayCount: 1, discoveredCount: 1, totalXp: 20 },
  level: { level: 1, currentLevelXp: 20, nextLevelXp: 30, totalXp: 20 },
  streak: { currentDays: 1, recordedToday: true },
  dailyQuests: [
    { id: 'today-card', title: '식사 카드 1장', description: '한 장 기록해요.', completed: true },
    { id: 'new-food', title: '새 음식 발견', description: '새 음식을 찾아요.', completed: false },
  ],
  adventureBoard: {
    title: '오늘의 모험 보드',
    nextFocus: '라면 1번 더 기록하면 불꽃 라면 Lv.2',
    items: [
      { id: 'today-card', title: '식사 카드 1장', reward: '보상: 20 XP', completed: false },
      { id: 'new-discovery', title: '새 음식 발견', reward: '보상: 박물관 전시 +1', completed: false },
      { id: 'evolution', title: '라면 진화 준비', reward: '진화까지 1끼', completed: false },
    ],
  },
  mealGameLoop: {
    todayMeals: 1,
    gaugeSteps: [true, false, false] as [boolean, boolean, boolean],
    nextMealTarget: 2 as 1 | 2 | 3,
    nextMealRemaining: 1,
    comboLabel: '첫 끼 출발 콤보',
    comboReward: 5,
    weeklyMeals: 1,
    weeklyTarget: 5 as 5 | 10 | 15,
    recoveryAvailable: false,
    totalMeals: 1,
    growth: { current: 0, next: 3, remaining: 2 },
  },
  mealAdventure: {
    choice: { title: '오늘 식사 루트를 골라보세요', options: ['집밥 마을', '빠른 한 끼', '새로운 음식'] },
    route: { id: 'lunch', label: '에너지 충전 루트', stage: 1, completed: false },
    mood: 'energized' as const,
    recipes: [],
    roomReward: { title: '방 꾸미기 장식', remaining: 2 },
    chapter: { title: '푸디의 첫 식탁', line: '1장 진행 중' },
    rewardChoices: ['XP 보너스', '방 장식', '내일 보호권'],
    monthly: { breakfast: 1, lunch: 1, dinner: 0, completeDays: 1 },
  },
  companionLine: '새 친구를 환영해!',
  companionEmotion: 'happy' as const,
  decorationIds: [],
  reducedMotion: false,
  onRecord: () => undefined,
  onOpenCollection: () => undefined,
  onOpenAdventure: () => undefined,
  onOpenCompanion: () => undefined,
}

describe('HomeScreen', () => {
  afterEach(cleanup)

  it('shows only the four compact status cards below the companion', () => {
    render(<HomeScreen {...props} />)

    expect(screen.getByText('레벨')).toBeInTheDocument()
    expect(screen.getByText('오늘의 카드')).toBeInTheDocument()
    expect(screen.getByText('오늘의 도전')).toBeInTheDocument()
    expect(screen.getByText('연속 기록')).toBeInTheDocument()
    expect(screen.queryByText('여름 한입 시즌')).not.toBeInTheDocument()
    expect(screen.queryByText('오늘의 상자')).not.toBeInTheDocument()
    expect(screen.queryByText('최근 발견')).not.toBeInTheDocument()
  })

  it('keeps the main recording action visible', () => {
    render(<HomeScreen {...props} />)
    expect(screen.getByRole('button', { name: '오늘의 보상 받기' })).toBeInTheDocument()
  })

  it('shows the unified next goal in the existing hero mission', () => {
    render(<HomeScreen {...props} nextGoal="저녁 방을 열어보세요" />)
    expect(screen.getByRole('region', { name: '오늘의 다음 행동' })).toHaveTextContent('저녁 방을 열어보세요')
  })

  it('shows the meal gauge and the next meal goal', () => {
    render(<HomeScreen {...props} />)

    expect(screen.getByRole('region', { name: '오늘의 식사 게이지' })).toHaveTextContent('1끼')
    expect(screen.getByText('다음 한 끼까지 1끼 남았어요')).toBeInTheDocument()
    expect(screen.getByText('다음 성장까지 2끼')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '오늘의 식사 게이지' })).toHaveTextContent('첫 끼 출발 콤보')
    expect(screen.getByRole('region', { name: '식사 모험' })).toHaveTextContent('푸디의 첫 식탁')
  })

  it('shows the V5.2 adventure board with rewards and the next evolution focus', () => {
    render(<HomeScreen {...props} />)

    expect(screen.getByRole('region', { name: '오늘의 모험 보드' })).toHaveTextContent('식사 카드 1장')
    expect(screen.getByText('보상: 20 XP')).toBeInTheDocument()
    expect(screen.getByText('새 음식 발견')).toBeInTheDocument()
    expect(screen.getByText('보상: 박물관 전시 +1')).toBeInTheDocument()
    expect(screen.getByText('라면 진화 준비')).toBeInTheDocument()
    expect(screen.getByText('진화까지 1끼')).toBeInTheDocument()
    expect(screen.getByText('라면 1번 더 기록하면 불꽃 라면 Lv.2')).toBeInTheDocument()
  })
})
