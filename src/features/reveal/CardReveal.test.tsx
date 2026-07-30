import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CardReveal } from './CardReveal'
import type { IntegratedMealResult } from '../../domain/integratedMealResult'

const integratedResult: IntegratedMealResult = {
  mealId: 'meal-ramen',
  cardId: 'card-ramen',
  outcome: {
    slot: 'lunch',
    tags: ['meal', 'noodle'],
    xp: 25,
    coins: 8,
    combo: 1,
    bossDamage: 35,
    discoveredNewSlot: true,
  },
  primaryRewards: [
    { id: 'card', label: '음식 카드', value: '불꽃 라면', kind: 'card' },
    { id: 'xp', label: '성장 경험치', value: '+25 XP', kind: 'xp' },
    { id: 'coin', label: '모험 코인', value: '+8', kind: 'coin' },
  ],
  detailRewards: [{ id: 'quest', label: '점심 방 완료' }],
  persistedRewards: [],
  completedQuestIds: ['today-card'],
  unlockedAchievementIds: ['first-meal'],
  nextGoal: { kind: 'dungeon-room', label: '저녁 방을 열어보세요' },
}

describe('CardReveal', () => {
  afterEach(cleanup)

  it('uses the meal food type for art even when the card name is not its first variant', () => {
    render(
      <CardReveal
        card={{
          id: 'card-fruit',
          mealId: 'meal-fruit',
          catalogId: 'fruit',
          name: '두 번째 과일 카드',
          rarity: 'rare',
          quote: '새로운 과일 친구야.',
          xp: 20,
          isNew: true,
          regionId: 'snack-island',
          seasonId: 'summer',
          evolutionStage: 1,
          createdAt: 1,
        }}
        foodType="fruit"
        imageData={null}
        isSaving={false}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('과일')).toHaveTextContent('🍎')
    expect(screen.getByLabelText('발견 카드')).toHaveAttribute('data-feedback-visual', 'rare-rings')
    expect(screen.getByRole('button', { name: '도감에 저장' })).toBeEnabled()
  })

  it('shows the V5 adventure result before saving the card', () => {
    render(
      <CardReveal
        card={{
          id: 'card-ramen',
          mealId: 'meal-ramen',
          catalogId: 'ramen',
          name: '불꽃 라면',
          rarity: 'epic',
          quote: '뜨거운 모험이야.',
          xp: 30,
          isNew: true,
          regionId: 'korea',
          seasonId: 'summer',
          evolutionStage: 1,
          createdAt: 1,
        }}
        foodType="ramen"
        imageData={null}
        isSaving={false}
        adventureResult={{
          headline: '라면 카드로 오늘의 모험을 진행했어요',
          xpText: '+30 XP',
          levelText: '캐릭터 Lv.3',
          questText: '오늘 퀘스트 2/3 완료',
          museumText: '음식 박물관 4/11 전시',
          evolutionText: '불꽃 라면 2/3 성장',
          nextGoalText: '다음 목표: 불꽃 라면 1번 더 기록하면 진화',
          rewardTexts: ['새 장식 획득: 햇살 피크닉'],
        }}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />,
    )

    expect(screen.getByRole('region', { name: '한 끼 모험 결과' })).toHaveTextContent('라면 카드로 오늘의 모험을 진행했어요')
    expect(screen.getByText('캐릭터 Lv.3')).toBeInTheDocument()
    expect(screen.getByText('오늘 퀘스트 2/3 완료')).toBeInTheDocument()
    expect(screen.getByText('음식 박물관 4/11 전시')).toBeInTheDocument()
    expect(screen.getByText('불꽃 라면 2/3 성장')).toBeInTheDocument()
    expect(screen.getByText('다음 목표: 불꽃 라면 1번 더 기록하면 진화')).toBeInTheDocument()
    expect(screen.getByText('새 장식 획득: 햇살 피크닉')).toBeInTheDocument()
  })

  it('keeps the card first, limits primary rewards, and folds extra results', () => {
    render(
      <CardReveal
        card={{
          id: 'card-ramen',
          mealId: 'meal-ramen',
          catalogId: 'ramen',
          name: '불꽃 라면',
          rarity: 'epic',
          quote: '뜨거운 모험이야.',
          xp: 30,
          isNew: true,
          regionId: 'korea',
          evolutionStage: 1,
          createdAt: 1,
        }}
        foodType="ramen"
        imageData={null}
        isSaving={false}
        integratedResult={integratedResult}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />,
    )

    expect(screen.getAllByTestId('primary-reward')).toHaveLength(3)
    expect(screen.getByText('저녁 방을 열어보세요')).toBeInTheDocument()
    expect(screen.getByText('추가 보상 1개')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '보상 확인 완료' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '다시 선택' })).not.toBeInTheDocument()
  })
})
