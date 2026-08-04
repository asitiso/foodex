import { useEffect, useMemo, useRef, useState } from 'react'
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

const SECRET_TAG_META: Record<string, string> = {
  midnight: '🌙 심야 카드',
  seasonal: '🍉 제철 카드',
  rainy: '🌈 행운의 날 카드',
}

function secretTagLabels(secretTags?: string[]) {
  if (!secretTags) return []
  return secretTags.map((tag) => SECRET_TAG_META[tag]).filter((label): label is string => Boolean(label))
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
  recentCardId,
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  progression: Progression
  rewards?: UserReward[]
  onApplyCosmetic?: (cardId: string, cosmetic: { type: CosmeticType; id: string }) => void
  recentCardId?: string
}) {
  const [category, setCategory] = useState<FoodCategory | 'all'>('all')
  const [regionId, setRegionId] = useState<RegionId | ''>('')
  const [rarity, setRarity] = useState<Rarity | ''>('')
  const [albumFocus, setAlbumFocus] = useState<MealRecord['foodType'] | 'all'>('all')
  const [selected, setSelected] = useState<{ card: FoodCard; meal: MealRecord }>()
  const detailDialog = useRef<HTMLDialogElement>(null)
  const focusedEntries = useMemo(() => {
    const filtered = filterCollection(entries, {
      regionId: regionId || undefined,
      rarity: rarity || undefined,
    })
    const visibleEntries = filtered.filter(({ meal }) =>
      category === 'all' || FOOD_META[meal.foodType].category === category,
    )
    return albumFocus === 'all'
      ? visibleEntries
      : visibleEntries.filter(({ meal }) => meal.foodType === albumFocus)
  }, [entries, regionId, rarity, category, albumFocus])

  const albumSlots = useMemo(() => focusedEntries.map((entry) => ({
    food: {
      id: `custom-${entry.card.id}`,
      name: entry.card.name,
      foodType: entry.meal.foodType,
    },
    entry,
  })), [focusedEntries])

  const albumGroups = useMemo(() => Object.values(focusedEntries.reduce((groups, entry) => {
    const key = entry.meal.foodType
    const group = groups[key] ?? {
      key,
      label: FOOD_META[entry.meal.foodType].label,
      cards: [] as Array<{ card: FoodCard; meal: MealRecord }>,
    }
    group.cards.push(entry)
    groups[key] = group
    return groups
  }, {} as Record<string, { key: MealRecord['foodType']; label: string; cards: Array<{ card: FoodCard; meal: MealRecord }> }>))
    .sort((left, right) => right.cards.length - left.cards.length)
    .filter(({ cards }) => cards.length > 1), [focusedEntries])

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
        <div><strong>{albumSlots.length} / {Math.max(1, focusedEntries.length)}</strong><span> {albumFocus === 'all' ? '음식 앨범 수집' : `${FOOD_META[albumFocus].label} 앨범 수집`}</span></div>
        <div className="album-progress-track" aria-hidden="true"><span style={{ width: `${focusedEntries.length ? Math.round((albumSlots.length / focusedEntries.length) * 100) : 0}%` }} /></div>
        <small>{albumFocus === 'all' ? '빈칸을 채워 다음 카드를 발견해 보세요 ✨' : `${FOOD_META[albumFocus].label} 앨범을 정리하고 있어요 🎯`}</small>
      </section>

      <details className="collection-growth-section">
        <summary>성장 기록 보기</summary>
        <div className="collection-growth-stack">
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
        </div>
      </details>

      {entries.length === 0 || albumSlots.length === 0 ? (
        <div className="collection-empty">
          <span aria-hidden="true">🧺</span>
          <p>{entries.length === 0
            ? '첫 식사 카드를 만나러 가볼까요?'
            : '조건에 맞는 카드가 아직 없어요. 필터를 하나 줄여 볼까요?'}</p>
        </div>
      ) : (
        <>
          {albumGroups.length > 0 && (
            <section className="album-stack-panel" aria-label="앨범 묶음">
              <div className="section-title-row">
                <h2>앨범 묶음</h2>
                {albumFocus !== 'all' && (
                  <button className="inline-button" type="button" onClick={() => setAlbumFocus('all')} aria-label="전체 앨범 보기">
                    전체 앨범 보기
                  </button>
                )}
              </div>
              <div className="album-stack-grid">
                {albumGroups.map((group) => (
                  <button
                    className={albumFocus === group.key ? 'album-stack-card selected' : 'album-stack-card'}
                    key={group.key}
                    type="button"
                    onClick={() => setAlbumFocus(group.key)}
                    aria-label={`${group.label} 앨범 보기`}
                  >
                    <span>{group.cards.length}장</span>
                    <strong>{group.label} 앨범</strong>
                    <small>{group.cards[0].card.name} · {group.cards.length > 1 ? `${group.cards.length - 1}장 더 쌓임` : '첫 카드'}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="collection-grid">
            {albumSlots.map(({ entry }) => (
              <button
                className={[
                  'collection-card',
                  `rarity-${entry.card.rarity}`,
                  entry.card.skinId ? `skin-${entry.card.skinId}` : '',
                  entry.card.backgroundId ? `background-${entry.card.backgroundId}` : '',
                  entry.card.id === recentCardId ? 'recently-unlocked' : '',
                  entry.card.isShiny ? 'shiny-card' : '',
                ].filter(Boolean).join(' ')}
                data-testid={`card-${entry.card.id}`}
                type="button"
                key={entry.card.id}
                onClick={() => setSelected(entry)}
              >
                {entry.meal.imageData ? <img src={entry.meal.imageData} alt="" /> : <span aria-hidden="true">🍽️</span>}
                {entry.card.isNew && <span className="new-card-badge">NEW · 새 카드</span>}
                {entry.card.isShiny && <span className="shiny-marker" aria-hidden="true">✨</span>}
                <small>{rarityLabels[entry.card.rarity]}</small>
                <strong>{entry.card.name}</strong>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <dialog
          className={`card-detail rarity-${selected.card.rarity}${selected.card.isShiny ? ' shiny' : ''}`}
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
          {selected.card.isShiny && <span className="shiny-badge-inline">✨ 반짝이 카드!</span>}
          <h2>{selected.card.name}</h2>
          <p>{formatRecordedDate(selected.meal.recordedAt)} · {FOOD_META[selected.meal.foodType].label} · {AMOUNT_META[selected.meal.amount].label}</p>
          <blockquote>“{selected.card.quote}”</blockquote>
          {selected.card.stats && (
            <div className="card-stats-row" aria-label="힘 · 행운 · 온기">
              <span><b>힘</b>{selected.card.stats.power}</span>
              <span><b>행운</b>{selected.card.stats.luck}</span>
              <span><b>온기</b>{selected.card.stats.warmth}</span>
            </div>
          )}
          {secretTagLabels(selected.card.secretTags).length > 0 && (
            <div className="secret-tag-badges" aria-label="비밀 조건 카드">
              {secretTagLabels(selected.card.secretTags).map((label) => <span className="secret-tag-badge" key={label}>{label}</span>)}
            </div>
          )}
          <details className="card-wardrobe">
            <summary>꾸미기</summary>
            <Wardrobe card={selected.card} rewards={rewards} onApply={onApplyCosmetic} />
          </details>
        </dialog>
      )}
    </>
  )
}
