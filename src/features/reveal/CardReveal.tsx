import '../../styles.css'
import { FOOD_META } from '../../domain/types'
import type { FoodCard, FoodType } from '../../domain/types'
import type { ReactNode } from 'react'

interface CardRevealProps {
  card: FoodCard
  foodType: FoodType
  imageData: string | null
  isSaving: boolean
  recovery?: ReactNode
  onSave: () => void
  onDiscard: () => void
}

const FOOD_EMOJI: Record<FoodType, string> = {
  ramen: '🍜',
  rice: '🍚',
  fruit: '🍎',
  bread: '🥐',
  side: '🥗',
  snack: '🍪',
  drink: '🧃',
  dumpling: '🥟',
  sushi: '🍣',
  pasta: '🍝',
  other: '✨',
}

export function CardReveal({ card, foodType, imageData, isSaving, recovery, onSave, onDiscard }: CardRevealProps) {
  return (
    <section className="card-reveal" aria-label="발견 카드" aria-busy={isSaving}>
      <p className="eyebrow">새 카드 발견!</p>
      <div className="card-scene">
        <article className={`food-card rarity-${card.rarity}`}>
          <div className="sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>
          <div className="food-card-face food-card-front">
            <span className="rarity-badge">{card.rarity.toUpperCase()}</span>
            <div className="food-illustration" aria-label={FOOD_META[foodType].label}>
              <span>{FOOD_EMOJI[foodType]}</span>
              {imageData && <img src={imageData} alt="기록한 식사" />}
            </div>
            <h1>{card.name}</h1>
            <p>“{card.quote}”</p>
            <span className="xp-pill">+{card.xp} XP</span>
          </div>
        </article>
      </div>
      <p className="reveal-copy">도감에 저장하고 다음 모험도 이어 가자!</p>
      <div className="reveal-actions">
        <button className="secondary-action" type="button" onClick={onDiscard} disabled={isSaving}>다시 선택</button>
        <button type="button" onClick={onSave} disabled={isSaving}>도감에 저장</button>
      </div>
      {recovery}
    </section>
  )
}
