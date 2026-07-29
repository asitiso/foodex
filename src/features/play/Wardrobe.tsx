import { COSMETICS } from '../../domain/v3Content'
import type { CosmeticType, FoodCard } from '../../domain/types'
import type { UserReward } from '../../data/foodexDb'

export function Wardrobe({
  card,
  rewards,
  onApply,
}: {
  card: FoodCard
  rewards: UserReward[]
  onApply: (cardId: string, cosmetic: { type: CosmeticType; id: string }) => void
}) {
  const ownedIds = new Set(rewards.map((reward) => reward.rewardId))

  return (
    <section className="wardrobe" aria-labelledby="wardrobe-title">
      <h2 id="wardrobe-title">{card.name} 꾸미기</h2>
      <p>꾸미기는 카드 능력치에 영향을 주지 않아요.</p>
      <div className="cosmetic-grid">
        {COSMETICS.map((cosmetic) => {
          const owned = ownedIds.has(cosmetic.id)
          return (
            <article className={owned ? 'cosmetic owned' : 'cosmetic locked'} key={cosmetic.id}>
              <strong>{cosmetic.title}</strong>
              <button
                type="button"
                disabled={!owned}
                aria-label={`${cosmetic.title} ${owned ? '적용' : '잠김'}`}
                onClick={() => onApply(card.id, { type: cosmetic.type, id: cosmetic.id })}
              >
                {owned ? '적용' : '잠김'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
