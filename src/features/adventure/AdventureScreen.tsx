import { useState } from 'react'
import type { Progression } from '../../domain/progression'

type AdventureTab = 'today' | 'achievements' | 'events'

const TABS: readonly { id: AdventureTab; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: 'achievements', label: '업적' },
  { id: 'events', label: '이벤트' },
]

export function AdventureScreen({ progression }: { progression: Progression }) {
  const [activeTab, setActiveTab] = useState<AdventureTab>('today')

  return (
    <section className="adventure-screen" aria-label="모험">
      <header>
        <p className="eyebrow">FOODEX 모험</p>
        <h1>오늘의 모험을 확인해 봐!</h1>
      </header>
      <div className="collection-tabs adventure-tabs" role="tablist" aria-label="모험 보기">
        {TABS.map((tab) => (
          <button
            id={`adventure-tab-${tab.id}`}
            role="tab"
            type="button"
            key={tab.id}
            aria-selected={activeTab === tab.id}
            aria-controls={`adventure-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="adventure-panel"
        id={`adventure-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`adventure-tab-${activeTab}`}
      >
        {activeTab === 'today' && (
          <>
            <section className="adventure-hero">
              <span>Lv.{progression.level.level}</span>
              <strong>연속 {progression.streak.currentDays}일</strong>
            </section>
            <h2>오늘의 도전</h2>
            <div className="quest-list">
              {progression.dailyQuests.map((quest) => (
                <article className={quest.completed ? 'quest completed' : 'quest'} key={quest.id}>
                  <div><strong>{quest.title}</strong><small>{quest.description}</small></div>
                  <span>{quest.completed ? '완료' : '진행중'}</span>
                </article>
              ))}
            </div>
            <section className={progression.rewardBox.available ? 'reward-box available' : 'reward-box'}>
              <strong>{progression.rewardBox.title}</strong>
              <p>{progression.rewardBox.rewardPreview}</p>
            </section>
          </>
        )}
        {activeTab === 'achievements' && (
          <div className="achievement-list">
            {[...progression.achievements, ...progression.collectionBonuses].map((item) => (
              <article className={item.unlocked ? 'achievement unlocked' : 'achievement'} key={item.id}>
                <span aria-hidden="true">{item.unlocked ? '★' : '☆'}</span>
                <div><strong>{item.title}</strong><small>{item.description}</small></div>
              </article>
            ))}
          </div>
        )}
        {activeTab === 'events' && (
          <>
            <section className="season-panel">
              <div className="section-title-row">
                <h2>{progression.season.title}</h2>
                <strong>{progression.season.completedSteps}/{progression.season.totalSteps}</strong>
              </div>
              <p>{progression.season.rewardTitle}</p>
            </section>
            {progression.v3.activeEvent ? (
              <section className="active-event">
                <strong>{progression.v3.activeEvent.title}</strong>
                <p>{progression.v3.activeEvent.completed}/{progression.v3.activeEvent.total} 발견</p>
              </section>
            ) : <p className="gentle-empty">다음 지역 이벤트를 준비하고 있어요.</p>}
          </>
        )}
      </div>
    </section>
  )
}
