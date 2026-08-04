import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CompanionScreen } from './CompanionScreen'
import { buildProgression } from '../../domain/progression'
import { buildCompanionClasses } from '../../domain/companionClasses'
import type { FoodCard, MealRecord } from '../../domain/types'

function todayEntry(foodName: string, foodType: MealRecord['foodType'], overrides: Partial<FoodCard> = {}) {
  const recordedAt = Date.now()
  const meal: MealRecord = {
    id: `meal-${foodName}`,
    imageData: null,
    foodType,
    foodName,
    amount: 'almostAll',
    recordedAt,
  }
  const card: FoodCard = {
    id: `card-${foodName}`,
    mealId: meal.id,
    catalogId: foodType,
    name: `${foodName} 카드`,
    rarity: 'rare',
    quote: '좋은 발견이야.',
    xp: 30,
    isNew: true,
    regionId: 'korea',
    evolutionStage: 1,
    createdAt: recordedAt,
    ...overrides,
  }
  return { meal, card }
}

describe('CompanionScreen', () => {
  afterEach(cleanup)

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

    expect(screen.getByRole('tab', { name: '일기' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '리포트' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '내 방' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '캐릭터' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('첫 기록을 남기면 푸드 친구가 오늘의 이야기를 써 줄게요.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: '내 방' }))
    expect(screen.getByRole('tabpanel', { name: '내 방' })).toHaveTextContent('다음 장식')
  })

  it('keeps character setup and settings out of the journal, report, and room tabs', async () => {
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

    expect(screen.queryByText('전직 선택')).not.toBeInTheDocument()
    expect(screen.queryByText('게임 효과 설정')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: '캐릭터' }))
    expect(screen.getByRole('tabpanel', { name: '캐릭터' })).toHaveTextContent('전직 선택')

    await userEvent.click(screen.getByRole('button', { name: '게임 효과 설정 열기' }))
    expect(screen.getByText('게임 효과 설정')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '게임 효과 설정 닫기' }))
    expect(screen.queryByText('게임 효과 설정')).not.toBeInTheDocument()
  })

  it('shows a reaction timeline for today and lets you page to earlier days', async () => {
    const user = userEvent.setup()
    const entries = [todayEntry('불꽃 라면', 'ramen', { isShiny: true })]
    render(
      <CompanionScreen
        entries={entries}
        roomUnlocks={[]}
        progression={buildProgression(entries)}
        rewards={[]}
        experienceSettings={{ soundEnabled: true, musicEnabled: false, hapticsEnabled: true, reducedMotion: false }}
        onExperienceSettingsChange={() => undefined}
      />,
    )

    const timeline = screen.getByRole('list', { name: '오늘 식사 타임라인' })
    expect(timeline).toHaveTextContent('불꽃 라면')
    expect(timeline).toHaveTextContent('반짝')
    expect(screen.getByRole('button', { name: '다음 날짜' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '이전 날짜' }))
    expect(screen.getByText('어제')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 날짜' })).toBeEnabled()
  })

  it('lets the player pick a different unlocked class than the auto-recommendation', async () => {
    const user = userEvent.setup()
    const now = Date.now()
    const mealEntries = [
      ...Array.from({ length: 5 }, (_, i) => ({ meal: { id: `rice-${i}`, imageData: null, foodType: 'rice' as const, foodName: '밥', amount: 'taste' as const, recordedAt: now - i } })),
      ...Array.from({ length: 5 }, (_, i) => ({ meal: { id: `fruit-${i}`, imageData: null, foodType: 'fruit' as const, foodName: '과일', amount: 'taste' as const, recordedAt: now - 1000 - i } })),
    ]
    const companionClasses = buildCompanionClasses(mealEntries)
    const onClassChange = vi.fn()
    render(
      <CompanionScreen
        entries={[]}
        roomUnlocks={[]}
        progression={buildProgression([])}
        rewards={[]}
        experienceSettings={{ soundEnabled: true, musicEnabled: false, hapticsEnabled: true, reducedMotion: false }}
        onExperienceSettingsChange={() => undefined}
        companionClasses={companionClasses}
        onClassChange={onClassChange}
      />,
    )

    await user.click(screen.getByRole('tab', { name: '캐릭터' }))
    expect(screen.getByRole('button', { name: /^든든한 수호자/ })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /^숲의 탐험가/ }))
    expect(onClassChange).toHaveBeenCalledWith('forest-explorer')
  })

  it('shows the monthly report best card, weekday heatmap, and text summary', async () => {
    const user = userEvent.setup()
    const entries = [todayEntry('불꽃 라면', 'ramen', { rarity: 'legendary' })]
    render(
      <CompanionScreen
        entries={entries}
        roomUnlocks={[]}
        progression={buildProgression(entries)}
        rewards={[]}
        experienceSettings={{ soundEnabled: true, musicEnabled: false, hapticsEnabled: true, reducedMotion: false }}
        onExperienceSettingsChange={() => undefined}
      />,
    )

    await user.click(screen.getByRole('tab', { name: '리포트' }))
    const bestCard = screen.getByRole('region', { name: '이달의 베스트 카드' })
    expect(bestCard).toHaveTextContent('불꽃 라면 카드')
    expect(screen.getByRole('region', { name: '요일별 기록 현황' })).toBeInTheDocument()
  })
})
