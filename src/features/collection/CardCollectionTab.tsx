import { useEffect, useRef, useState } from 'react'
import type { Progression } from '../../domain/progression'
import { filterCollection } from '../../domain/v3Progression'
import { AMOUNT_META, FOOD_META } from '../../domain/types'
import type { CosmeticType, FoodCard, FoodCategory, MealRecord, Rarity, RegionId } from '../../domain/types'
import { REGIONS } from '../../domain/v3Content'
import type { UserReward } from '../../data/foodexDb'
import { Wardrobe } from '../play/Wardrobe'
import { FOOD_CATALOG } from '../../domain/foodCatalog'

const categories: Array<{ id: FoodCategory | 'all'; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'meal', label: '식사' },
  { id: 'produce', label: '과일' },
  { id: 'bakery', label: '빵' },
  { id: 'treat', label: '간식' },
  { id: 'drink', label: '음료' },
  { id: 'other', label: '기타' },
]

const rarityLabels: Record<Rarity, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
}

function formatRecordedDate(recordedAt: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(recordedAt)
}

export function CardCollectionTab({
  entries,
  progression,
  rewards = [],
  onApplyCosmetic = () => undefined,
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  progression: Progression
  rewards?: UserReward[]
  onApplyCosmetic?: (cardId: string, cosmetic: { type: CosmeticType; id: string }) => void
}) {
  const [category, setCategory] = useState<FoodCategory | 'all'>('all')
  const [regionId, setRegionId] = useState<RegionId | ''>('')
  const [rarity, setRarity] = useState<Rarity | ''>('')
  const [achievementsExpanded, setAchievementsExpanded] = useState(true)
  const [selected, setSelected] = useState<{ card: FoodCard; meal: MealRecord }>()
  const detailDialog = useRef<HTMLDialogElement>(null)
  const filtered = filterCollection(entries, {
    regionId: regionId || undefined,
    rarity: rarity || undefined,
  })
  const visibleEntries = filtered.filter(({ meal }) =>
    category === 'all' || FOOD_META[meal.foodType].category === category,
  )
  const normalizeFood = (value: string) => value.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')
  const catalogSlots = FOOD_CATALOG.filter((food) => category === 'all' || FOOD_META[food.foodType].category === category).map((food) => ({
    food,
    entry: visibleEntries.find(({ meal, card }) => normalizeFood(meal.foodName) === normalizeFood(food.name) || normalizeFood(card.name) === normalizeFood(food.name)),
  }))
  const matchedIds = new Set(catalogSlots.flatMap(({ entry }) => entry ? [entry.card.id] : []))
  const albumSlots = visibleEntries.length === 0 && entries.length > 0
    ? []
    : [...catalogSlots, ...visibleEntries.filter(({ card }) => !matchedIds.has(card.id)).map((entry) => ({ food: { id: `custom-${entry.card.id}`, name: entry.card.name, foodType: entry.meal.foodType }, entry }))]

  const closeDetail = () => {
    const dialog = detailDialog.current
    if (dialog?.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
    setSelected(undefined)
  }

  useEffect(() => {
    if (!selected) return
    const dialog = detailDialog.current
    if (!dialog) return
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    return () => {
      if (dialog.open) {
        if (typeof dialog.close === 'function') dialog.close()
        else dialog.removeAttribute('open')
      }
    }
  }, [selected])

  return (
    <>
      <section className="achievement-panel" aria-labelledby="achievement-title">
        <div className="section-title-row">
          <h2 id="achievement-title">업적</h2>
          <button className="inline-button achievement-toggle" type="button" aria-expanded={achievementsExpanded} aria-controls="achievement-list" onClick={() => setAchievementsExpanded((expanded) => !expanded)}>
            {achievementsExpanded ? '업적 접기' : '업적 펼치기'}
          </button>
        </div>
        {achievementsExpanded && <div className="achievement-list" id="achievement-list">
          {progression.achievements.map((achievement) => (
            <article className={achievement.unlocked ? 'achievement unlocked' : 'achievement'} key={achievement.id}>
              <span className="achievement-badge" aria-hidden="true" data-progress={achievement.unlocked ? '100' : '0'}>{achievement.unlocked ? '★' : '☆'}</span>
              <div><strong>{achievement.title}</strong><small>{achievement.description}</small></div>
            </article>
          ))}
        </div>}
      </section>

      {progression.evolutions.length > 0 && (
        <section className="evolution-panel" aria-labelledby="evolution-title">
          <div className="section-title-row"><h2 id="evolution-title">음식 진화</h2></div>
          <div className="achievement-list">
            {progression.evolutions.slice(0, 4).map((evolution) => (
              <article className={evolution.stage > 1 ? 'achievement unlocked' : 'achievement'} key={evolution.foodType}>
                <span aria-hidden="true">{evolution.stage > 1 ? '★' : '☆'}</span>
                <div>
                  <strong>{evolution.title}</strong>
                  <small>{evolution.count}회 기록{evolution.nextCount ? ` · 다음 ${evolution.nextCount}회` : ''}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="bonus-panel" aria-labelledby="bonus-title">
        <div className="section-title-row"><h2 id="bonus-title">컬렉션 보너스</h2></div>
        <div className="achievement-list">
          {progression.collectionBonuses.map((bonus) => (
            <article className={bonus.unlocked ? 'achievement unlocked' : 'achievement'} key={bonus.id}>
              <span aria-hidden="true">{bonus.unlocked ? '★' : '☆'}</span>
              <div><strong>{bonus.title}</strong><small>{bonus.description}</small></div>
            </article>
          ))}
        </div>
      </section>

      <section className="tag-progress-panel" aria-labelledby="tag-progress-title">
        <div className="section-title-row"><h2 id="tag-progress-title">분류별 수집 현황</h2></div>
        <div className="tag-progress-grid">
          {progression.tagProgress.map((item) => (
            <article className="tag-progress-item" key={item.tag}>
              <div><strong>{item.label}</strong><span>{item.discovered}/{item.total}</span></div>
              <div className="tag-progress-track" aria-hidden="true"><span style={{ width: `${item.total ? Math.min(100, Math.round((item.discovered / item.total) * 100)) : 0}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <div className="collection-filters">
        <label>지역
          <select value={regionId} onChange={(event) => setRegionId(event.target.value as RegionId | '')}>
            <option value="">전체</option>
            {REGIONS.map((region) => <option key={region.id} value={region.id}>{region.title}</option>)}
          </select>
        </label>
        <label>희귀도
          <select value={rarity} onChange={(event) => setRarity(event.target.value as Rarity | '')}>
            <option value="">전체</option>
            {Object.entries(rarityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="category-chips" aria-label="도감 카테고리">
        {categories.map((item) => (
          <button
            className={category === item.id ? 'category-chip selected' : 'category-chip'}
            type="button"
            key={item.id}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="album-summary" aria-label="음식 앨범 진행률">
        <div><strong>{albumSlots.filter(({ entry }) => entry).length} / {albumSlots.length}</strong><span> 음식 앨범 수집</span></div>
        <div className="album-progress-track" aria-hidden="true"><span style={{ width: `${albumSlots.length ? Math.round((albumSlots.filter(({ entry }) => entry).length / albumSlots.length) * 100) : 0}%` }} /></div>
        <small>빈칸을 채워 다음 카드를 발견해 보세요 ✨</small>
      </section>
      {entries.length === 0 || albumSlots.length === 0 ? (
        <div className="collection-empty">
          <span aria-hidden="true">🧺</span>
          <p>{entries.length === 0
            ? '첫 식사 카드를 만나러 가볼까요?'
            : '조건에 맞는 카드가 아직 없어요. 필터를 하나 줄여 볼까요?'}</p>
        </div>
      ) : (
        <div className="collection-grid">
          {albumSlots.filter(({ entry }) => entry).map(({ entry }) => (
            <button
              className={[
                'collection-card',
                `rarity-${entry!.card.rarity}`,
                entry!.card.skinId ? `skin-${entry!.card.skinId}` : '',
                entry!.card.backgroundId ? `background-${entry!.card.backgroundId}` : '',
              ].filter(Boolean).join(' ')}
              type="button"
              key={entry!.card.id}
              onClick={() => setSelected(entry!)}
            >
              {entry!.meal.imageData ? <img src={entry!.meal.imageData} alt="" /> : <span aria-hidden="true">🍽️</span>}
              {entry!.card.isNew && <span className="new-card-badge">NEW · 새 카드</span>}
              <small>{rarityLabels[entry!.card.rarity]}</small>
              <strong>{entry!.card.name}</strong>
            </button>
          ))}
          {albumSlots.filter(({ entry }) => !entry).map(({ food }) => (
            <div className="collection-card album-locked" key={food.id} aria-label={`${food.name} 미획득`}>
              <span aria-hidden="true">?</span><small>미발견</small><strong>???</strong>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <dialog
          className="card-detail"
          ref={detailDialog}
          aria-label={`${selected.card.name} 카드 상세`}
          onCancel={(event) => {
            event.preventDefault()
            closeDetail()
          }}
        >
          <button className="dialog-close" type="button" onClick={closeDetail}>닫기</button>
          {selected.meal.imageData ? (
            <img src={selected.meal.imageData} alt="기록한 식사 사진" />
          ) : (
            <div className="detail-no-photo" aria-label="사진 없이 저장한 카드">🍽️</div>
          )}
          <span className={`detail-rarity rarity-${selected.card.rarity}`}>{rarityLabels[selected.card.rarity]}</span>
          <h2>{selected.card.name}</h2>
          <p>{formatRecordedDate(selected.meal.recordedAt)} · {FOOD_META[selected.meal.foodType].label} · {AMOUNT_META[selected.meal.amount].label}</p>
          <blockquote>“{selected.card.quote}”</blockquote>
          <details className="card-wardrobe">
            <summary>꾸미기</summary>
            <Wardrobe card={selected.card} rewards={rewards} onApply={onApplyCosmetic} />
          </details>
        </dialog>
      )}
    </>
  )
}
