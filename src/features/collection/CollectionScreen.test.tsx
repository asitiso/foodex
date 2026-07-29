import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildProgression } from '../../domain/progression'
import type { FoodCard, MealRecord } from '../../domain/types'
import { CollectionScreen } from './CollectionScreen'

type CollectionEntry = { card: FoodCard; meal: MealRecord }

describe('CollectionScreen', () => {
  afterEach(cleanup)

  const ramenEntry: CollectionEntry = {
    card: {
      id: 'card-ramen',
      mealId: 'meal-ramen',
      catalogId: 'ramen',
      name: '불꽃 라면',
      rarity: 'epic' as const,
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
      foodType: 'ramen' as const,
      amount: 'taste' as const,
      recordedAt: 1,
    },
  }

  it('opens a modal detail dialog and clears it from the close control or native cancel event', async () => {
    const user = userEvent.setup()
    const entries = [ramenEntry]
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    await user.click(screen.getByRole('button', { name: /불꽃 라면/ }))
    expect(screen.getByRole('dialog', { name: '불꽃 라면 카드 상세' })).toHaveAttribute('open')
    expect(screen.getByAltText('기록한 식사 사진')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /불꽃 라면/ }))
    fireEvent(screen.getByRole('dialog', { name: '불꽃 라면 카드 상세' }), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('marks new cards in the grid and shows Korean food type in detail', async () => {
    const user = userEvent.setup()
    const entries: CollectionEntry[] = [
      ramenEntry,
      {
        card: {
          ...ramenEntry.card,
          id: 'card-rice',
          mealId: 'meal-rice',
          name: '든든 밥방패',
          isNew: false,
        },
        meal: {
          ...ramenEntry.meal,
          id: 'meal-rice',
          foodType: 'rice',
        },
      },
    ]
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    const newCard = screen.getByRole('button', { name: /불꽃 라면/ })
    const existingCard = screen.getByRole('button', { name: /든든 밥방패/ })
    expect(newCard).toHaveTextContent('새 카드')
    expect(existingCard).not.toHaveTextContent('새 카드')

    await user.click(newCard)
    expect(screen.getByRole('dialog')).toHaveTextContent('라면')
    expect(screen.getByRole('dialog')).toHaveTextContent('맛보기')
  })

  it('shows V2 evolution stages and collection bonuses', () => {
    const entries: CollectionEntry[] = [
      ramenEntry,
      {
        card: { ...ramenEntry.card, id: 'card-ramen-2', mealId: 'meal-ramen-2', createdAt: 2 },
        meal: { ...ramenEntry.meal, id: 'meal-ramen-2', recordedAt: 2 },
      },
      {
        card: { ...ramenEntry.card, id: 'card-ramen-3', mealId: 'meal-ramen-3', createdAt: 3 },
        meal: { ...ramenEntry.meal, id: 'meal-ramen-3', recordedAt: 3 },
      },
      {
        card: { ...ramenEntry.card, id: 'card-rice', mealId: 'meal-rice', name: '든든 밥방패' },
        meal: { ...ramenEntry.meal, id: 'meal-rice', foodType: 'rice' },
      },
      {
        card: { ...ramenEntry.card, id: 'card-fruit', mealId: 'meal-fruit', name: '햇살 과일단' },
        meal: { ...ramenEntry.meal, id: 'meal-fruit', foodType: 'fruit' },
      },
      {
        card: { ...ramenEntry.card, id: 'card-drink', mealId: 'meal-drink', name: '찰랑 음료물결' },
        meal: { ...ramenEntry.meal, id: 'meal-drink', foodType: 'drink' },
      },
    ]

    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    expect(screen.getByText('불꽃 라면 Lv.2')).toBeInTheDocument()
    expect(screen.getByText('컬렉션 보너스')).toBeInTheDocument()
    expect(screen.getByText('면 탐험가')).toBeInTheDocument()
    expect(screen.getByText('도감 절반')).toBeInTheDocument()
  })

  it('switches between card, world, and set views', async () => {
    const user = userEvent.setup()
    const entries = [ramenEntry]
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    expect(screen.getByRole('tabpanel', { name: '카드' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '세계지도' }))
    expect(screen.getByRole('tabpanel', { name: '세계지도' })).toHaveTextContent('한식마을')

    await user.click(screen.getByRole('tab', { name: '세트 도감' }))
    expect(screen.getByRole('tabpanel', { name: '세트 도감' })).toHaveTextContent('분식 탐험대')
  })

  it('combines region and rarity filters in the card view', async () => {
    const user = userEvent.setup()
    render(<CollectionScreen entries={[ramenEntry]} progression={buildProgression([ramenEntry])} />)

    await user.selectOptions(screen.getByLabelText('지역'), 'korea')
    await user.selectOptions(screen.getByLabelText('희귀도'), 'epic')
    expect(screen.getByRole('button', { name: /불꽃 라면/ })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('지역'), 'west')
    expect(screen.getByText('조건에 맞는 카드가 아직 없어요. 필터를 하나 줄여 볼까요?')).toBeInTheDocument()
  })
})
