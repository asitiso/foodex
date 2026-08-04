import { useState } from 'react'
import { resolveFusion } from '../../domain/v3Progression'
import { FOOD_CATALOG, FUSION_RECIPES } from '../../domain/v3Content'
import { FOOD_EMOJI } from '../../domain/types'
import type { FoodCard, MealRecord, Rarity } from '../../domain/types'
import type { FusionRecord, UserReward } from '../../data/foodexDb'

const RARITY_STARS: Record<Rarity, string> = {
  common: '⭐',
  rare: '⭐⭐',
  epic: '⭐⭐⭐',
  legendary: '⭐⭐⭐⭐',
}

export function FusionLab({
  entries,
  onFuse,
  rewards = [],
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  onFuse: (fusion: FusionRecord, reward: UserReward, consumedCardIds: readonly string[]) => void
  rewards?: readonly UserReward[]
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [result, setResult] = useState<string>()
  const [hint, setHint] = useState<string>()
  const [consumed, setConsumed] = useState<readonly string[]>([])

  const select = (cardId: string) => {
    setResult(undefined)
    setHint(undefined)
    setConsumed([])
    setSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId)
      if (current.length === 3) return [current[1], current[2], cardId]
      return [...current, cardId]
    })
  }

  const fuse = () => {
    const selectedCards = selectedIds
      .map((id) => entries.find(({ card }) => card.id === id)?.card)
      .filter((card): card is FoodCard => Boolean(card))
    if (selectedCards.length < 2) return
    const recipe = resolveFusion(selectedCards)
    if (!recipe) {
      setHint('새로운 조합의 기운이 보여요. 다른 친구와도 만나 보세요.')
      return
    }

    const createdAt = Date.now()
    const fusion: FusionRecord = {
      id: crypto.randomUUID(),
      sourceCardIds: selectedCards.map((card) => card.id),
      fusionCatalogId: recipe.id,
      createdAt,
    }
    const reward: UserReward = {
      key: `fusion-card:${recipe.id}`,
      id: crypto.randomUUID(),
      rewardType: 'fusion-card',
      rewardId: recipe.id,
      sourceType: 'fusion',
      sourceId: fusion.id,
      unlockedAt: createdAt,
    }
    onFuse(fusion, reward, recipe.consumesSources ? selectedCards.map((card) => card.id) : [])
    setResult(recipe.resultName)
    setConsumed(recipe.consumesSources ? selectedCards.map((card) => card.id) : [])
  }

  const discoveredCatalogIds = new Set(entries.map(({ card }) => card.catalogId))
  const discoveredFusionIds = new Set(
    rewards.filter((reward) => reward.sourceType === 'fusion').map((reward) => reward.rewardId),
  )

  return (
    <section className="fusion-lab" aria-labelledby="fusion-title">
      <h2 id="fusion-title">두 친구를 만나게 해볼까?</h2>
      <p>2장 조합은 카드가 그대로 남아요. 3장 조합은 카드가 합쳐져 사라져요.</p>
      <div className="fusion-card-picker">
        {entries.map(({ card }) => (
          <button
            type="button"
            key={card.id}
            className={selectedIds.includes(card.id) ? 'selected' : undefined}
            aria-pressed={selectedIds.includes(card.id)}
            aria-label={`${card.name} 선택`}
            onClick={() => select(card.id)}
          >
            {card.name}
          </button>
        ))}
      </div>
      <button type="button" onClick={fuse} disabled={selectedIds.length < 2}>퓨전 발견하기</button>
      {result && (
        <div className="fusion-result" role="status">
          <strong>{result}</strong>
          <p>{consumed.length > 0 ? '원본 카드가 합쳐져 사라졌어요. 전설의 카드가 탄생했어요!' : '원본 카드는 그대로 보관돼요.'}</p>
        </div>
      )}
      {hint && <p role="status">{hint}</p>}

      <section className="fusion-recipe-book" aria-label="퓨전 레시피 도감">
        <h3>발견한 조합 · 힌트</h3>
        <p>보유한 카드 힌트가 채워져요. 나머지는 직접 조합해서 찾아보세요!</p>
        <ul>
          {FUSION_RECIPES.map((recipe) => {
            const discovered = discoveredFusionIds.has(recipe.id)
            return (
              <li className={discovered ? 'discovered' : ''} key={recipe.id}>
                {discovered ? (
                  <strong>{recipe.resultName}</strong>
                ) : (
                  <span className="fusion-slots" aria-label="아직 발견하지 못한 조합">
                    {recipe.requiredCatalogIds.map((catalogId, index) => {
                      const known = discoveredCatalogIds.has(catalogId)
                      const food = FOOD_CATALOG.find((item) => item.id === catalogId)
                      return (
                        <em key={`${catalogId}-${index}`}>
                          {known && food ? FOOD_EMOJI[food.foodType] : '❔'}
                        </em>
                      )
                    })}
                  </span>
                )}
                <small>{RARITY_STARS[recipe.resultRarity]} · {recipe.consumesSources ? '카드 소멸' : '카드 유지'}</small>
              </li>
            )
          })}
        </ul>
      </section>
    </section>
  )
}