import { useState } from 'react'
import type { Progression } from '../../domain/progression'
import type { FoodCard, MealRecord } from '../../domain/types'
import { CardCollectionTab } from './CardCollectionTab'
import { SetDexTab } from './SetDexTab'
import { WorldMapTab } from './WorldMapTab'

interface CollectionScreenProps {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  progression: Progression
}

type CollectionTab = 'cards' | 'world' | 'sets'

const tabs: Array<{ id: CollectionTab; label: string }> = [
  { id: 'cards', label: '카드' },
  { id: 'world', label: '세계지도' },
  { id: 'sets', label: '세트 도감' },
]

export function CollectionScreen({ entries, progression }: CollectionScreenProps) {
  const [activeTab, setActiveTab] = useState<CollectionTab>('cards')

  return (
    <section className="collection-screen" aria-label="도감">
      <header>
        <p className="eyebrow">FOODEX 도감</p>
        <h1>내가 만난 맛있는 친구들</h1>
        <p>도감 완성률 {progression.collection.completionPercent}%</p>
      </header>

      <section className="collection-progress" aria-label="도감 완성률">
        <div>
          <strong>{progression.collection.discoveredFoods}/{progression.collection.totalFoods}</strong>
          <span>음식 발견</span>
        </div>
        <div className="level-track" aria-hidden="true">
          <span style={{ width: `${progression.collection.completionPercent}%` }} />
        </div>
      </section>

      <div className="collection-tabs" role="tablist" aria-label="도감 보기">
        {tabs.map((tab) => (
          <button
            role="tab"
            type="button"
            key={tab.id}
            id={`collection-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`collection-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`collection-panel-${activeTab}`}
        aria-labelledby={`collection-tab-${activeTab}`}
      >
        {activeTab === 'cards' && <CardCollectionTab entries={entries} progression={progression} />}
        {activeTab === 'world' && <WorldMapTab progress={progression.v3} />}
        {activeTab === 'sets' && <SetDexTab entries={entries} progress={progression.v3} />}
      </div>
    </section>
  )
}
