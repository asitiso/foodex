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
      <p className="set-overview">완성률 {COLLECTION_SETS.filter((set) => progress.completedSetIds.includes(set.id)).length}/{COLLECTION_SETS.length}</p>
      {COLLECTION_SETS.map((set) => {
        const complete = progress.completedSetIds.includes(set.id)
        const reward = COSMETICS.find((item) => item.id === set.reward.rewardId)
        const foundCount = set.requiredCatalogIds.filter((catalogId) => discovered.has(catalogId)).length
        const missingCount = set.requiredCatalogIds.length - foundCount

        return (
          <article className={complete ? 'set-card complete' : 'set-card'} key={set.id}>
            <span>{complete ? '세트 완성' : '모으는 중'}</span>
            <h2>{set.title}</h2>
            <p className="set-progress-meta">
              {foundCount}/{set.requiredCatalogIds.length}개 발견 · {complete ? '보상 수령 완료' : `${missingCount}개 더 모으면 보상`}
            </p>
            <ul>
              {set.requiredCatalogIds.map((catalogId) => {
                const food = FOOD_CATALOG.find((item) => item.id === catalogId)
                const isFound = discovered.has(catalogId)
                return (
                  <li key={catalogId} className={isFound ? 'found' : ''}>
                    <strong>{isFound ? '✓' : '○'}</strong>
                    <span>{food?.label ?? '미지의 음식'}</span>
                  </li>
                )
              })}
            </ul>
            <p>보상 · {reward?.title}</p>
          </article>
        )
      })}
    </div>
  )
}
