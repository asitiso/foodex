import { COLLECTION_SETS, COSMETICS, FOOD_CATALOG } from '../../domain/v3Content'
import type { V3Progress } from '../../domain/v3Progression'
import type { FoodCard, MealRecord } from '../../domain/types'

export function SetDexTab({
  entries,
  progress,
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  progress: V3Progress
}) {
  const discovered = new Set(entries.map(({ card }) => card.catalogId))

  return (
    <div className="set-grid">
      {COLLECTION_SETS.map((set) => {
        const complete = progress.completedSetIds.includes(set.id)
        const reward = COSMETICS.find((item) => item.id === set.reward.rewardId)
        return (
          <article className={complete ? 'set-card complete' : 'set-card'} key={set.id}>
            <span>{complete ? '세트 완성' : '모으는 중'}</span>
            <h2>{set.title}</h2>
            <ul>
              {set.requiredCatalogIds.map((catalogId) => (
                <li key={catalogId}>
                  {discovered.has(catalogId) ? '✓' : '○'} {FOOD_CATALOG.find((food) => food.id === catalogId)?.label}
                </li>
              ))}
            </ul>
            <p>보상 · {reward?.title}</p>
          </article>
        )
      })}
    </div>
  )
}
