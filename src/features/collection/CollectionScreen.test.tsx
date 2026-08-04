import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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
      foodName: '라면',
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

  it('shows V2 evolution stages and tag progress', async () => {
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

    const user = userEvent.setup()
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    const growthDetails = screen.getByText('성장 기록 보기').closest('details')
    expect(growthDetails).not.toHaveAttribute('open')
    await user.click(screen.getByText('성장 기록 보기'))
    expect(growthDetails).toHaveAttribute('open')

    expect(screen.getByText('불꽃 라면 Lv.2')).toBeInTheDocument()
    const tagPanel = screen.getByText('분류별 수집 현황').closest('section')!
    expect(within(tagPanel).getByText('과일')).toBeInTheDocument()
  })

  it('keeps achievements and collection bonuses out of the dex album tab', async () => {
    render(<CollectionScreen entries={[ramenEntry]} progression={buildProgression([ramenEntry])} />)

    await userEvent.setup().click(screen.getByText('성장 기록 보기'))

    expect(screen.queryByText('업적')).not.toBeInTheDocument()
    expect(screen.queryByText('컬렉션 보너스')).not.toBeInTheDocument()
  })

  it('highlights the album slot filled by the latest meal result', () => {
    const entries = [ramenEntry]
    render(
      <CollectionScreen
        entries={entries}
        progression={buildProgression(entries)}
        recentCardId="card-ramen"
      />,
    )

    expect(screen.getByTestId('card-card-ramen')).toHaveClass('recently-unlocked')
  })

  it('opens a stacked album group and filters the view to that food type', async () => {
    const user = userEvent.setup()
    const entries: CollectionEntry[] = [
      ramenEntry,
      {
        card: { ...ramenEntry.card, id: 'card-ramen-2', mealId: 'meal-ramen-2', createdAt: 2 },
        meal: { ...ramenEntry.meal, id: 'meal-ramen-2', recordedAt: 2 },
      },
      {
        card: { ...ramenEntry.card, id: 'card-rice', mealId: 'meal-rice', name: '든든 밥방패' },
        meal: { ...ramenEntry.meal, id: 'meal-rice', foodType: 'rice', recordedAt: 3 },
      },
    ]
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    await user.click(screen.getByRole('button', { name: /라면 앨범 보기/ }))
    expect(screen.getAllByRole('button', { name: /불꽃 라면/ }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /든든 밥방패/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /전체 앨범 보기/ }))
    expect(screen.getByRole('button', { name: /든든 밥방패/ })).toBeInTheDocument()
  })

  it('switches between card, world, set, and fusion views', async () => {
    const user = userEvent.setup()
    const entries = [ramenEntry]
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    expect(screen.getByRole('tabpanel', { name: '카드' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '발견 지역' }))
    expect(screen.getByRole('tabpanel', { name: '발견 지역' })).toHaveTextContent('한식마을')

    await user.click(screen.getByRole('tab', { name: '세트' }))
    const setPanel = screen.getByRole('tabpanel', { name: '세트' })
    expect(setPanel).toHaveTextContent('분식 탐험대')
    expect(setPanel).toHaveTextContent('개 발견')
    expect(setPanel).toHaveTextContent('완성률')

    await user.click(screen.getByRole('tab', { name: '퓨전' }))
    expect(screen.getByRole('tabpanel', { name: '퓨전' })).toHaveTextContent('두 친구를 만나게 해볼까?')
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

  it('shows stats, a shiny badge, and secret tag badges in the card detail dialog', async () => {
    const user = userEvent.setup()
    const entries: CollectionEntry[] = [
      {
        card: {
          ...ramenEntry.card,
          stats: { power: 55, luck: 12, warmth: 80 },
          isShiny: true,
          secretTags: ['seasonal', 'unknown-future-tag'],
        },
        meal: ramenEntry.meal,
      },
    ]
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    expect(screen.getByTestId('card-card-ramen')).toHaveClass('shiny-card')

    await user.click(screen.getByRole('button', { name: /불꽃 라면/ }))
    const dialog = screen.getByRole('dialog', { name: '불꽃 라면 카드 상세' })
    expect(dialog).toHaveTextContent('55')
    expect(dialog).toHaveTextContent('12')
    expect(dialog).toHaveTextContent('80')
    expect(within(dialog).getByText('✨ 반짝이 카드!')).toBeInTheDocument()
    expect(within(dialog).getByText('🍉 제철 카드')).toBeInTheDocument()
    expect(within(dialog).queryByText('unknown-future-tag')).not.toBeInTheDocument()
  })

  it('does not show a shiny marker for non-shiny cards', () => {
    const entries = [ramenEntry]
    render(<CollectionScreen entries={entries} progression={buildProgression(entries)} />)

    expect(screen.getByTestId('card-card-ramen')).not.toHaveClass('shiny-card')
  })
})
