import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildProgression } from '../../domain/progression'
import type { FoodCard, MealRecord } from '../../domain/types'
import { CollectionScreen } from './CollectionScreen'

const entry: { card: FoodCard; meal: MealRecord } = {
  card: {
    id: 'card-ramen',
    mealId: 'meal-ramen',
    catalogId: 'ramen',
    name: '불꽃 라면',
    rarity: 'epic',
    quote: '후루룩! 오늘의 모험이 뜨거워졌어.',
    xp: 10,
    isNew: true,
    regionId: 'korea',
    evolutionStage: 1,
    createdAt: 1,
  },
  meal: {
    id: 'meal-ramen',
    imageData: 'data:image/jpeg;base64,dGVzdA==',
    foodType: 'ramen',
    foodName: '라면',
    amount: 'taste',
    recordedAt: 1,
  },
}

describe('collectible game collection surface', () => {
  afterEach(cleanup)

  it('presents collection progress and five game destinations without changing card detail behavior', async () => {
    const user = userEvent.setup()
    const progression = buildProgression([entry])
    render(<CollectionScreen entries={[entry]} progression={progression} />)

    expect(screen.getByRole('region', { name: '도감' })).toHaveAttribute('data-game-surface', 'collection')
    expect(screen.getByRole('status', { name: '도감 수집 현황' })).toHaveTextContent('음식 발견')
    expect(screen.getAllByRole('tab')).toHaveLength(5)
    expect(screen.getByRole('tab', { name: '카드' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('button', { name: /불꽃 라면/ }))
    expect(screen.getByRole('dialog', { name: '불꽃 라면 카드 상세' })).toBeInTheDocument()
  })
})
