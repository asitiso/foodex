import { useState } from 'react'
import { resolveFusion } from '../../domain/v3Progression'
import type { FoodCard, MealRecord } from '../../domain/types'
import type { FusionRecord, UserReward } from '../../data/foodexDb'

export function FusionLab({
  entries,
  onFuse,
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  onFuse: (fusion: FusionRecord, reward: UserReward) => void
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [result, setResult] = useState<string>()
  const [hint, setHint] = useState<string>()

  const select = (cardId: string) => {
    setResult(undefined)
    setHint(undefined)
    setSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId)
      if (current.length === 2) return [current[1], cardId]
      return [...current, cardId]
    })
  }

  const fuse = () => {
    const [leftId, rightId] = selectedIds
    const left = entries.find(({ card }) => card.id === leftId)?.card
    const right = entries.find(({ card }) => card.id === rightId)?.card
    if (!left || !right) return
    const recipe = resolveFusion(left, right)
    if (!recipe) {
      setHint('새로운 조합의 기운이 보여요. 다른 친구와도 만나 보세요.')
      return
    }

    const createdAt = Date.now()
    const fusion: FusionRecord = {
      id: crypto.randomUUID(),
      leftCardId: left.id,
      rightCardId: right.id,
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
    onFuse(fusion, reward)
    setResult(recipe.resultName)
  }

  return (
    <section className="fusion-lab" aria-labelledby="fusion-title">
      <h2 id="fusion-title">두 친구를 만나게 해볼까?</h2>
      <p>카드는 사라지지 않으니 마음껏 조합해 봐.</p>
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
      <button type="button" onClick={fuse} disabled={selectedIds.length !== 2}>퓨전 발견하기</button>
      {result && (
        <div className="fusion-result" role="status">
          <strong>{result}</strong>
          <p>원본 카드는 그대로 보관돼요.</p>
        </div>
      )}
      {hint && <p role="status">{hint}</p>}
    </section>
  )
}
