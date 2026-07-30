import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FoodCard, MealRecord } from '../../domain/types'
import type { UserReward } from '../../data/foodexDb'
import { FusionLab } from './FusionLab'
import { PlayScreen } from './PlayScreen'
import { Wardrobe } from './Wardrobe'

function entry(catalogId: 'ramen' | 'rice', name: string) {
  const meal: MealRecord = {
    id: `meal-${catalogId}`,
    imageData: null,
    foodName: catalogId === 'ramen' ? '라면' : '밥',
    foodType: catalogId,
    amount: 'taste',
    recordedAt: 1,
  }
  const card: FoodCard = {
    id: `card-${catalogId}`,
    mealId: meal.id,
    catalogId,
    name,
    rarity: 'rare',
    quote: 'test',
    xp: 10,
    isNew: true,
    regionId: 'korea',
    evolutionStage: 1,
    createdAt: 1,
  }
  return { meal, card }
}

const ramen = entry('ramen', '불꽃 라면')
const rice = entry('rice', '든든 밥방패')
const reward: UserReward = {
  key: 'background:sunny-picnic',
  id: 'reward-1',
  rewardType: 'background',
  rewardId: 'sunny-picnic',
  sourceType: 'set',
  sourceId: 'sunny-bites',
  unlockedAt: 1,
}

describe('V3 play features', () => {
  afterEach(cleanup)

  it('discovers a fusion without removing either source card', async () => {
    const user = userEvent.setup()
    const onFuse = vi.fn()
    render(<FusionLab entries={[ramen, rice]} onFuse={onFuse} />)

    await user.click(screen.getByRole('button', { name: '불꽃 라면 선택' }))
    await user.click(screen.getByRole('button', { name: '든든 밥방패 선택' }))
    await user.click(screen.getByRole('button', { name: '퓨전 발견하기' }))

    expect(onFuse).toHaveBeenCalledWith(
      expect.objectContaining({
        leftCardId: ramen.card.id,
        rightCardId: rice.card.id,
        fusionCatalogId: 'ramen-rice-hero',
      }),
      expect.objectContaining({ rewardType: 'fusion-card', rewardId: 'ramen-rice-hero' }),
    )
    expect(screen.getByText('라밥 용사')).toBeInTheDocument()
    expect(screen.getByText('원본 카드는 그대로 보관돼요.')).toBeInTheDocument()
  })

  it('allows only owned cosmetics to be applied', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<Wardrobe card={ramen.card} rewards={[reward]} onApply={onApply} />)

    expect(screen.getByRole('button', { name: '분식 축제 스킨 잠김' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '햇살 소풍 배경 적용' }))
    expect(onApply).toHaveBeenCalledWith(ramen.card.id, {
      type: 'background',
      id: 'sunny-picnic',
    })
  })

  it('switches between fusion and wardrobe tabs', async () => {
    const user = userEvent.setup()
    render(
      <PlayScreen
        entries={[ramen, rice]}
        rewards={[reward]}
        onFuse={vi.fn()}
        onApplyCosmetic={vi.fn()}
      />,
    )
    expect(screen.getByRole('tabpanel', { name: '퓨전 연구소' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '꾸미기' }))
    expect(screen.getByRole('tabpanel', { name: '꾸미기' })).toBeInTheDocument()
  })
})
