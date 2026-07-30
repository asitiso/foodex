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
})
