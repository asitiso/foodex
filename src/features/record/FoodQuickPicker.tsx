import { useMemo, useState } from 'react'
import { searchFoods } from '../../domain/foodCatalog'
import type { FoodDefinition } from '../../domain/foodCatalog'

function normalizeQuery(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')
}

const FAMILY_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: 'meal', label: '한 끼' },
  { id: 'produce', label: '과일' },
  { id: 'bakery', label: '빵/간식' },
  { id: 'drink', label: '음료' },
] as const

function makeCustomFood(name: string): FoodDefinition {
  const cleaned = name.trim()
  const safeName = cleaned || '새 음식'

  return {
    id: `custom-${safeName}`,
    name: safeName,
    aliases: [safeName],
    foodType: 'other',
    flavor: 'neutral',
    periods: ['morning', 'lunch', 'dinner', 'snack'],
    tags: ['other'],
  }
}

export function FoodQuickPicker({
  suggestions,
  customFoods = [],
  selectedId,
  onSelect,
}: {
  suggestions: readonly FoodDefinition[]
  customFoods?: readonly FoodDefinition[]
  selectedId?: string
  onSelect: (food: FoodDefinition) => void
}) {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<(typeof FAMILY_OPTIONS)[number]['id']>('all')

  const foods = useMemo(() => {
    const trimmed = query.trim()
    const customMatches = trimmed
      ? customFoods.filter((food) =>
          [food.name, ...food.aliases].some((candidate) => normalizeQuery(candidate).includes(normalizeQuery(trimmed))),
        )
      : customFoods

    const base = trimmed ? [...searchFoods(trimmed), ...customMatches] : [...suggestions, ...customFoods]
    const deduped = Array.from(new Map(base.map((food) => [food.id, food])).values())

    if (family === 'all') return deduped
    const familyMap: Record<string, readonly string[]> = {
      meal: ['meal', 'noodle', 'spicy'],
      produce: ['fruit', 'healthy'],
      bakery: ['bakery', 'snack', 'dessert', 'candy', 'chocolate'],
      drink: ['drink', 'coffee', 'tea', 'soda', 'juice'],
    }
    const allowed = new Set(familyMap[family] ?? [])
    return deduped.filter((food) => food.tags.some((tag) => allowed.has(tag)))
  }, [customFoods, family, query, suggestions])

  const canAddCustom = query.trim().length > 0

  return (
    <div className="food-quick-picker">
      <label className="food-search-label" htmlFor="food-search-input">음식 검색</label>
      <input
        id="food-search-input"
        aria-label="음식 검색"
        type="search"
        value={query}
        placeholder="예: 김치찌개, 샌드위치, 우동"
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <input
        aria-label="직접 입력"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, left: '-9999px' }}
      />
      <div className="family-chips" role="tablist" aria-label="음식 분류">
        {FAMILY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={family === option.id}
            className={family === option.id ? 'family-chip active' : 'family-chip'}
            onClick={() => setFamily(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="choice-grid food-grid" role="group" aria-label="음식 선택">
        {foods.map((food) => (
          <button
            className={food.id === selectedId ? 'choice-button selected' : 'choice-button'}
            type="button"
            key={food.id}
            aria-pressed={food.id === selectedId}
            onClick={() => onSelect(food)}
          >
            {food.name}
          </button>
        ))}
      </div>
      {canAddCustom && (
        <button
          type="button"
          className="custom-food-button"
          aria-label="직접 등록"
          onClick={() => onSelect(makeCustomFood(query))}
        >
          직접 등록
        </button>
      )}
      {foods.length === 0 && !canAddCustom && <p className="gentle-empty">다른 이름으로 검색해 볼까요?</p>}
    </div>
  )
}
