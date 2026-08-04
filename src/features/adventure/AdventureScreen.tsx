import { useState } from 'react'
import type { Progression } from '../../domain/progression'
import type { WorldProgress } from '../../domain/v6WorldProgression'
import { buildWorldProgress } from '../../domain/v6WorldProgression'
import type { GameLoopProgress } from '../../domain/v61GameLoop'
import type { AdvancedGameSystems } from '../../domain/advancedGameSystems'
import { tagLabel } from '../../domain/tagProgression'
import { WorldHubScreen } from '../world/WorldHubScreen'

type AdventureTab = 'today' | 'world' | 'achievements' | 'events'
const TABS: readonly { id: AdventureTab; label: string }[] = [
  { id: 'today', label: '오늘' }, { id: 'world', label: '세계' }, { id: 'achievements', label: '업적' }, { id: 'events', label: '이벤트' },
]

interface InfoPopup {
  title: string
  description: string
  meta?: string
  steps?: Array<{ label: string; completed: boolean }>
}

export function AdventureScreen({
  progression,
  worldProgress = buildWorldProgress([]),
  gameLoop,
  advancedSystems,
  recentQuestIds = [],
  recentAchievementIds = [],
  rewardBoxOpened = false,
  onOpenRewardBox = () => undefined,
}: {
  progression: Progression
  worldProgress?: WorldProgress
  gameLoop?: GameLoopProgress
  advancedSystems?: AdvancedGameSystems
  recentQuestIds?: readonly string[]
  recentAchievementIds?: readonly string[]
  rewardBoxOpened?: boolean
  onOpenRewardBox?: () => void
}) {
  const [activeTab, setActiveTab] = useState<AdventureTab>('today')
  const [activeInfo, setActiveInfo] = useState<InfoPopup>()

  const activeEvent = progression.v3.activeEvent

  return (
    <section className="adventure-screen" aria-label="모험">
      <header><p className="eyebrow">FOODEX 모험</p><h1>오늘의 모험을 확인해요</h1></header>
      <div className="collection-tabs adventure-tabs" role="tablist" aria-label="모험 보기">{TABS.map((tab) => <button id={`adventure-tab-${tab.id}`} role="tab" type="button" key={tab.id} aria-selected={activeTab === tab.id} aria-controls={`adventure-panel-${tab.id}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
      <div className="adventure-panel" id={`adventure-panel-${activeTab}`} role="tabpanel" aria-labelledby={`adventure-tab-${activeTab}`}>
        {activeTab === 'world' && <WorldHubScreen progress={worldProgress} gameLoop={gameLoop} />}
        {activeTab === 'today' && <>
          <section className="adventure-hero"><span>Lv.{progression.level.level}</span><strong>연속 {progression.streak.currentDays}일</strong></section>
          {advancedSystems && (() => {
            const dungeonComplete = advancedSystems.dungeon.cleared >= advancedSystems.dungeon.rooms.length
            return (
              <button
                type="button"
                className={`advanced-systems-panel${dungeonComplete ? ' dungeon-complete' : ''}`}
                aria-label="오늘의 식사 던전"
                onClick={() => setActiveInfo({
                  title: '오늘의 식사 던전',
                  description: '아침 방 · 점심 방 · 저녁 방이 있어요. 오늘 식사를 기록할 때마다 방이 하나씩 열려요. 세 방을 모두 열면 오늘의 던전을 완주하는 거예요!',
                  meta: dungeonComplete
                    ? '오늘의 던전을 모두 열었어요!'
                    : `오늘 연 방 ${advancedSystems.dungeon.cleared}/${advancedSystems.dungeon.rooms.length}개`,
                  steps: advancedSystems.dungeon.rooms.map((room) => ({ label: room.name, completed: room.cleared })),
                })}
              >
                <h2>오늘의 식사 던전{dungeonComplete && <span className="dungeon-complete-badge"> · 완주!</span>}</h2>
                <div className="home-dungeon-map">{advancedSystems.dungeon.rooms.map((room) => <span className={room.cleared ? 'cleared' : ''} key={room.id}><b>{room.cleared ? '✓' : '○'}</b>{room.name}</span>)}</div>
              </button>
            )
          })()}
          {advancedSystems && (
            <button
              type="button"
              className="boss-fight-panel"
              aria-label="오늘의 보스전"
              onClick={() => setActiveInfo({
                title: '오늘의 보스전',
                description: advancedSystems.boss.mvpCard
                  ? `골고루 먹을수록 보스에게 더 큰 피해를 줘요! 오늘의 스탯 MVP는 "${advancedSystems.boss.mvpCard.name}" — 추가로 ${advancedSystems.boss.mvpCard.bonusDamage} 피해를 더 줬어요.`
                  : '골고루 먹을수록 보스에게 더 큰 피해를 줘요! 오늘 기록한 식사들이 보스 체력을 깎아냈어요.',
                meta: advancedSystems.boss.defeated ? '오늘 보스를 물리쳤어요!' : `오늘 깎은 체력 ${advancedSystems.boss.maxHp - advancedSystems.boss.hp} / ${advancedSystems.boss.maxHp}`,
              })}
            >
              <div className="section-title-row"><h2>오늘의 보스전 · {advancedSystems.boss.name}</h2><strong>{advancedSystems.boss.defeated ? '격파!' : `${advancedSystems.boss.hp}/${advancedSystems.boss.maxHp}`}</strong></div>
              <div className="boss-hp-track" aria-hidden="true"><span className="boss-hp-bar" style={{ width: `${Math.round((advancedSystems.boss.hp / advancedSystems.boss.maxHp) * 100)}%` }} /></div>
              <p>{advancedSystems.boss.mvpCard ? `👑 ${advancedSystems.boss.mvpCard.name} 카드가 오늘의 스탯 MVP예요` : '오늘 내가 깎은 보스 체력이에요'}</p>
            </button>
          )}
          <h2>오늘의 도전</h2>
          <div className="quest-list">
            {progression.dailyQuests.map((quest) => (
              <button
                type="button"
                data-testid={`quest-${quest.id}`}
                className={`${quest.completed ? 'quest completed' : 'quest'}${recentQuestIds.includes(quest.id) ? ' recently-unlocked' : ''}`}
                key={quest.id}
                onClick={() => setActiveInfo({ title: quest.title, description: quest.description, meta: quest.completed ? '완료했어요!' : '아직 진행 중이에요' })}
              >
                <div><strong>{quest.title}</strong><small>{quest.description}</small></div>
                <span>{quest.completed ? '완료' : '진행중'}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={progression.rewardBox.available ? 'reward-box available' : 'reward-box'}
            disabled={!progression.rewardBox.available || rewardBoxOpened}
            onClick={onOpenRewardBox}
          >
            <strong>{progression.rewardBox.title}</strong>
            <p>{rewardBoxOpened ? '오늘 이미 열었어요! 내일 또 만나요' : progression.rewardBox.rewardPreview}</p>
          </button>
        </>}
        {activeTab === 'achievements' && (
          <div className="achievement-list">
            {[...progression.achievements, ...progression.collectionBonuses].map((item) => (
              <button
                type="button"
                data-testid={`achievement-${item.id}`}
                className={`${item.unlocked ? 'achievement unlocked' : 'achievement'}${recentAchievementIds.includes(item.id) ? ' recently-unlocked' : ''}`}
                key={item.id}
                onClick={() => setActiveInfo({ title: item.title, description: item.description, meta: item.unlocked ? '달성 완료!' : '아직 도전 중이에요' })}
              >
                <span aria-hidden="true">{item.unlocked ? '🏅' : '🔒'}</span>
                <div><strong>{item.title}</strong><small>{item.description}</small></div>
              </button>
            ))}
          </div>
        )}
        {activeTab === 'events' && <>
          {progression.seasonMissions.map((mission) => (
            <button
              type="button"
              className="season-panel"
              key={mission.id}
              aria-label={mission.title}
              onClick={() => setActiveInfo({
                title: mission.title,
                description: mission.description,
                meta: `보상 · ${mission.rewardTitle}`,
                steps: mission.steps,
              })}
            >
              <div className="section-title-row"><h2>{mission.title}</h2><strong>{mission.completedSteps}/{mission.totalSteps}</strong></div>
              <p>{mission.rewardTitle}</p>
            </button>
          ))}
          {activeEvent ? (
            <button
              type="button"
              className="active-event"
              onClick={() => setActiveInfo({ title: activeEvent.title, description: activeEvent.description, meta: `${activeEvent.completed}/${activeEvent.total} 발견` })}
            >
              <strong>{activeEvent.title}</strong>
              <p>{activeEvent.completed}/{activeEvent.total} 발견</p>
            </button>
          ) : <p className="gentle-empty">다음 이벤트를 준비하고 있어요.</p>}
          <div className="achievement-list tag-event-list">
            {progression.tagEvents.map((event) => (
              <button
                type="button"
                className={event.completed === event.total ? 'achievement unlocked' : 'achievement'}
                key={event.id}
                onClick={() => setActiveInfo({
                  title: event.title,
                  description: `${event.tags.map(tagLabel).join(', ')} 태그의 음식을 각각 하나씩 발견하면 완료돼요.`,
                  meta: event.completedText,
                })}
              >
                <span aria-hidden="true">{event.completed === event.total ? '🏆' : '🔒'}</span>
                <div><strong>{event.title}</strong><small>{event.completedText}</small></div>
              </button>
            ))}
          </div>
        </>}
      </div>

      {activeInfo && (
        <div className="room-popup-backdrop" role="presentation" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) setActiveInfo(undefined) }}>
          <section className="info-popup" role="dialog" aria-modal="true" aria-label={activeInfo.title}>
            <button className="room-popup-close" type="button" aria-label={`${activeInfo.title} 닫기`} onClick={() => setActiveInfo(undefined)}>×</button>
            <h2>{activeInfo.title}</h2>
            <p>{activeInfo.description}</p>
            {activeInfo.steps && (
              <ul className="info-popup-steps">
                {activeInfo.steps.map((step) => (
                  <li key={step.label} className={step.completed ? 'completed' : ''}>
                    <span aria-hidden="true">{step.completed ? '✓' : '○'}</span>{step.label}
                  </li>
                ))}
              </ul>
            )}
            {activeInfo.meta && <strong className="info-popup-meta">{activeInfo.meta}</strong>}
          </section>
        </div>
      )}
    </section>
  )
}
