import { useState } from 'react'
import { searchFoods } from '../../domain/foodCatalog'
import type { FoodDefinition } from '../../domain/foodCatalog'

export function FoodQuickPicker({
  suggestions,
  selectedId,
  onSelect,
}: {
  suggestions: readonly FoodDefinition[]
  selectedId?: string
  onSelect: (food: FoodDefinition) => void
}) {
  const [query, setQuery] = useState('')
  const foods = query.trim() ? searchFoods(query) : suggestions

  return (
    <div className="food-quick-picker">
      <input
        aria-label="음식 검색"
        type="search"
        value={query}
        placeholder="음식 이름 검색"
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
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
      {foods.length === 0 && <p className="gentle-empty">다른 이름으로 검색해 볼까요?</p>}
    </div>
  )
}
