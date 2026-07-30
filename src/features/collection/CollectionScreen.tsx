import { useState } from 'react'
import type { Progression } from '../../domain/progression'
import type { FoodCard, MealRecord } from '../../domain/types'
import { CardCollectionTab } from './CardCollectionTab'
import { SetDexTab } from './SetDexTab'
import { WorldMapTab } from './WorldMapTab'
import { FusionLab } from '../play/FusionLab'
import type { FusionRecord, UserReward } from '../../data/foodexDb'
import type { CosmeticType } from '../../domain/types'

interface CollectionScreenProps {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  progression: Progression
  onFuse?: (fusion: FusionRecord, reward: UserReward) => void
  rewards?: UserReward[]
  onApplyCosmetic?: (cardId: string, cosmetic: { type: CosmeticType; id: string }) => void
}

type CollectionTab = 'cards' | 'growth' | 'world' | 'sets' | 'fusion'

const tabs: Array<{ id: CollectionTab; label: string }> = [
  { id: 'cards', label: '앨범' },
  { id: 'growth', label: '성장' },
  { id: 'world', label: '세계지도' },
  { id: 'sets', label: '세트 도감' },
  { id: 'fusion', label: '퓨전' },
]

export function CollectionScreen({
  entries,
  progression,
  onFuse = () => undefined,
  rewards = [],
  onApplyCosmetic = () => undefined,
}: CollectionScreenProps) {
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
            aria-label={tab.id === 'cards' ? '카드' : undefined}
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
        {(activeTab === 'cards' || activeTab === 'growth') && (
          <CardCollectionTab
            entries={entries}
            progression={progression}
            rewards={rewards}
            onApplyCosmetic={onApplyCosmetic}
            showProgression={activeTab === 'growth'}
          />
        )}
        {activeTab === 'world' && <WorldMapTab progress={progression.v3} />}
        {activeTab === 'sets' && <SetDexTab entries={entries} progress={progression.v3} />}
        {activeTab === 'fusion' && (
          entries.length > 0
            ? <FusionLab entries={entries} onFuse={onFuse} />
            : <p className="gentle-empty">카드를 모으면 퓨전 연구를 시작할 수 있어요.</p>
        )}
      </div>
    </section>
  )
}
