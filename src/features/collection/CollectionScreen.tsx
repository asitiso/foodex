import { useState } from 'react'
import type { Progression } from '../../domain/progression'
import type { FoodCard, MealRecord } from '../../domain/types'
import { CardCollectionTab } from './CardCollectionTab'
import { SetDexTab } from './SetDexTab'
import { WorldMapTab } from './WorldMapTab'
import { FusionLab } from '../play/FusionLab'
import type { FusionRecord, UserReward } from '../../data/foodexDb'
import type { CosmeticType } from '../../domain/types'
import { GameIcon, type GameIconName } from '../../ui/GameIcon'

interface CollectionScreenProps {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  progression: Progression
  onFuse?: (fusion: FusionRecord, reward: UserReward) => void
  rewards?: UserReward[]
  onApplyCosmetic?: (cardId: string, cosmetic: { type: CosmeticType; id: string }) => void
  recentCardId?: string
}

type CollectionTab = 'cards' | 'growth' | 'world' | 'sets' | 'fusion'

const tabs: Array<{ id: CollectionTab; label: string; icon: GameIconName }> = [
  { id: 'cards', label: '앨범', icon: 'collection' },
  { id: 'growth', label: '성장', icon: 'growth' },
  { id: 'world', label: '세계지도', icon: 'adventure' },
  { id: 'sets', label: '세트 도감', icon: 'cards' },
  { id: 'fusion', label: '퓨전', icon: 'shop' },
]

export function CollectionScreen({
  entries,
  progression,
  onFuse = () => undefined,
  rewards = [],
  onApplyCosmetic = () => undefined,
  recentCardId,
}: CollectionScreenProps) {
  const [activeTab, setActiveTab] = useState<CollectionTab>('cards')
  const completion = progression.collection.completionPercent

  return (
    <section className="collection-screen" aria-label="도감" data-game-surface="collection">
      <header className="collection-hero">
        <div className="collection-title-lockup">
          <span className="collection-title-icon" aria-hidden="true"><GameIcon name="collection" /></span>
          <div>
            <p className="eyebrow">FOODEX COLLECTION</p>
            <h1>맛있는 친구 도감</h1>
            <p>먹어 본 순간이 모험 카드가 돼요.</p>
          </div>
        </div>
        <span className="collection-rank-badge" aria-label={`도감 완성률 ${completion}%`}>
          <strong>{completion}%</strong>
          <small>완성</small>
        </span>
      </header>

      <section className="collection-progress" role="status" aria-label="도감 수집 현황">
        <div className="collection-progress-copy">
          <span className="game-icon-medallion" aria-hidden="true"><GameIcon name="cards" /></span>
          <div>
            <strong>{progression.collection.discoveredFoods}/{progression.collection.totalFoods}</strong>
            <span>음식 발견</span>
          </div>
          <small>다음 발견까지 계속 기록해 보세요</small>
        </div>
        <div className="level-track" aria-hidden="true">
          <span style={{ width: `${completion}%` }} />
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
            aria-label={tab.id === 'cards' ? '카드' : tab.label}
            aria-controls={`collection-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <GameIcon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div
        className="collection-panel"
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
            recentCardId={recentCardId}
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
