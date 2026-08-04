import { useState } from 'react'
import type { CosmeticType, FoodCard, MealRecord } from '../../domain/types'
import type { FusionRecord, UserReward } from '../../data/foodexDb'
import { FusionLab } from './FusionLab'
import { Wardrobe } from './Wardrobe'

type PlayTab = 'fusion' | 'wardrobe'

export function PlayScreen({
  entries,
  rewards,
  onFuse,
  onApplyCosmetic,
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  rewards: UserReward[]
  onFuse: (fusion: FusionRecord, reward: UserReward, consumedCardIds: readonly string[]) => void
  onApplyCosmetic: (cardId: string, cosmetic: { type: CosmeticType; id: string }) => void
}) {
  const [activeTab, setActiveTab] = useState<PlayTab>('fusion')
  const tabs: Array<{ id: PlayTab; label: string }> = [
    { id: 'fusion', label: '퓨전 연구소' },
    { id: 'wardrobe', label: '꾸미기' },
  ]

  return (
    <section className="play-screen" aria-label="놀이">
      <header>
        <p className="eyebrow">FOODEX 놀이</p>
        <h1>모은 카드로 새로운 재미를!</h1>
      </header>
      <div className="play-tabs" role="tablist" aria-label="놀이 선택">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`play-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            aria-controls={`play-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`play-panel-${activeTab}`} aria-labelledby={`play-tab-${activeTab}`}>
        {entries.length === 0 ? (
          <p className="gentle-empty">카드를 모으면 여기서 함께 놀 수 있어요.</p>
        ) : activeTab === 'fusion' ? (
          <FusionLab entries={entries} onFuse={onFuse} />
        ) : (
          <Wardrobe card={entries[0].card} rewards={rewards} onApply={onApplyCosmetic} />
        )}
      </div>
    </section>
  )
}
