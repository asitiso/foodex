import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CardReveal } from './CardReveal'

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
})
