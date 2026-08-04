import { useMemo, useState } from 'react'
import type { FoodCard, MealRecord } from '../../domain/types'
import type { RoomUnlock } from '../../domain/roomProgression'
import type { Progression } from '../../domain/progression'
import type { UserReward } from '../../data/foodexDb'
import { buildDailyJournal, buildMonthlyReport } from '../../domain/journal'
import type { ExperienceSettings as ExperienceSettingsValue } from '../../domain/companionTypes'
import { ExperienceSettings } from '../settings/ExperienceSettings'
import { COMPANION_CHARACTERS } from '../../domain/companionCharacters'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEvolution } from '../../domain/companionEvolution'
import type { CompanionClass, CompanionClassId } from '../../domain/companionClasses'
import type { ShopProduct } from '../../domain/shopCatalog'
import { CosmeticShop } from './CosmeticShop'

export type CompanionTab = 'journal' | 'report' | 'room' | 'character'

const TABS: readonly { id: CompanionTab; label: string }[] = [
  { id: 'journal', label: '일기' },
  { id: 'report', label: '리포트' },
  { id: 'room', label: '내 방' },
  { id: 'character', label: '캐릭터' },
]

export function CompanionScreen({
  entries,
  roomUnlocks,
  progression,
  rewards,
  experienceSettings,
  onExperienceSettingsChange,
  characterId = 'foody',
  characterName,
  onCharacterChange = () => undefined,
  onCharacterNameChange = () => undefined,
  evolution,
  companionClasses = [],
  onClassChange = () => undefined,
  coinBalance = 0,
  shopOnline = false,
  onPurchaseProduct = async () => undefined,
  initialTab = 'journal',
  roomBackgroundId,
  roomAccessoryId,
  onApplyRoomCosmetic = () => undefined,
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  roomUnlocks: readonly RoomUnlock[]
  progression: Progression
  rewards: readonly UserReward[]
  experienceSettings: ExperienceSettingsValue
  onExperienceSettingsChange: (value: ExperienceSettingsValue) => void
  characterId?: CompanionCharacterId
  characterName?: string
  onCharacterChange?: (id: CompanionCharacterId) => void
  onCharacterNameChange?: (name: string) => void
  evolution?: CompanionEvolution
  companionClasses?: CompanionClass[]
  onClassChange?: (id: CompanionClassId) => void
  coinBalance?: number
  shopOnline?: boolean
  onPurchaseProduct?: (product: ShopProduct) => Promise<void>
  initialTab?: CompanionTab
  roomBackgroundId?: string
  roomAccessoryId?: string
  onApplyRoomCosmetic?: (selection: { type: ShopProduct['type']; id?: string }) => void
}) {
  const [activeTab, setActiveTab] = useState<CompanionTab>(initialTab)
  const [dayOffset, setDayOffset] = useState(0)
  const now = Date.now()
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now + dayOffset * 86_400_000)
  const dayLabel = dayOffset === 0
    ? '오늘'
    : dayOffset === -1
      ? '어제'
      : dayOffset === -2
        ? '그저께'
        : `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`
  const month = today.slice(0, 7)
  const journal = useMemo(() => buildDailyJournal(entries, progression, day), [entries, progression, day])
  const report = useMemo(() => buildMonthlyReport(entries, rewards, month), [entries, rewards, month])
  const maxWeekdayCount = Math.max(1, ...report.weekdayCounts.map((item) => item.count))
  const topWeekday = report.weekdayCounts.reduce((best, item) => (item.count > best.count ? item : best), report.weekdayCounts[0])
  const hasTopWeekday = topWeekday.count > 0

  const storyName = (characterName || '푸디').trim() || '푸디'
  const personalize = (text: string) => text.replace(/푸디/g, storyName)

  const [showSettings, setShowSettings] = useState(false)

  return (
    <section className="companion-screen" aria-label="AI 친구">
      <header>
        <div>
          <p className="eyebrow">FOODEX 친구</p>
          <h1>{storyName}와 만든 맛있는 이야기</h1>
        </div>
        <button
          type="button"
          className="companion-settings-button"
          aria-label="게임 효과 설정 열기"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>
      </header>
      <div className="collection-tabs companion-tabs" role="tablist" aria-label="친구 보기">
        {TABS.map((tab) => (
          <button
            id={`companion-tab-${tab.id}`}
            role="tab"
            type="button"
            key={tab.id}
            aria-selected={activeTab === tab.id}
            aria-controls={`companion-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="companion-panel"
        id={`companion-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`companion-tab-${activeTab}`}
      >
        {activeTab === 'journal' && (
          <>
            <div className="journal-date-nav" aria-label="일기 날짜 이동">
              <button type="button" aria-label="이전 날짜" onClick={() => setDayOffset((value) => value - 1)}>‹</button>
              <strong>{dayLabel}</strong>
              <button type="button" aria-label="다음 날짜" disabled={dayOffset >= 0} onClick={() => setDayOffset((value) => Math.min(0, value + 1))}>›</button>
            </div>
            <section className="friend-story-card">
              <span aria-hidden="true">📖</span>
              <h2>{dayLabel}의 식사 일기</h2>
              <p>{journal.text}</p>
            </section>
            {journal.entries.length > 0 && (
              <ul className="journal-timeline" aria-label={`${dayLabel} 식사 타임라인`}>
                {journal.entries.map((entry) => (
                  <li className={entry.isShiny ? 'shiny' : ''} key={entry.id}>
                    <span className="journal-timeline-emoji" aria-hidden="true">{entry.emoji}</span>
                    <div>
                      <div className="journal-timeline-meta"><strong>{entry.time}</strong><span>{entry.foodName}</span></div>
                      <p>{entry.reaction}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {activeTab === 'report' && (
          <>
            <section className="friend-story-card">
              <span aria-hidden="true">📊</span>
              <h2>이번 달 한눈에 보기</h2>
              <p>{report.text}</p>
              <strong>{report.suggestion}</strong>
            </section>
            {report.bestCard && (
              <section className={`best-card-highlight rarity-${report.bestCard.rarity}${report.bestCard.isShiny ? ' shiny' : ''}`} aria-label="이달의 베스트 카드">
                <span aria-hidden="true">{report.bestCard.emoji}</span>
                <div>
                  <small>이달의 베스트 카드</small>
                  <strong>{report.bestCard.name}</strong>
                  {report.bestCard.isShiny && <em>✨ 반짝이</em>}
                </div>
              </section>
            )}
            <section className="weekday-heatmap" aria-label="요일별 기록 현황">
              <h2>요일별 기록</h2>
              <div className="weekday-heatmap-bars">
                {report.weekdayCounts.map((weekday) => (
                  <div className="weekday-bar" key={weekday.label}>
                    {hasTopWeekday && weekday.label === topWeekday.label && <span className="weekday-bar-crown" aria-hidden="true">👑</span>}
                    <span className="weekday-bar-fill" style={{ height: `${Math.round((weekday.count / maxWeekdayCount) * 100)}%` }} />
                    <small>{weekday.label}</small>
                  </div>
                ))}
              </div>
              {hasTopWeekday && <p className="weekday-persona">{personalize(`${storyName}는 ${topWeekday.label}요일 타입이에요!`)}</p>}
            </section>
            {report.comparison && (
              <section className="month-comparison" aria-label="지난달과 비교">
                <span className={report.comparison.recordDelta >= 0 ? 'up' : 'down'}>
                  기록 {report.comparison.recordDelta >= 0 ? '+' : ''}{report.comparison.recordDelta}장
                </span>
                <span className={report.comparison.streakDelta >= 0 ? 'up' : 'down'}>
                  연속 기록 {report.comparison.streakDelta >= 0 ? '+' : ''}{report.comparison.streakDelta}일
                </span>
              </section>
            )}
          </>
        )}
        {activeTab === 'room' && (
          <>
            <section className="friend-story-card">
              <span aria-hidden="true">🏠</span>
              <h2>내 방 장식</h2>
              {roomUnlocks.length > 0
                ? <ul>{roomUnlocks.map((unlock) => <li key={unlock.id}>{unlock.title}</li>)}</ul>
                : <p>아직 기본 방이에요. 모험을 이어 가면 장식이 생겨요!</p>}
              <strong>다음 장식: 레벨 3 작은 화분</strong>
            </section>
            <CosmeticShop
              balance={coinBalance}
              ownedIds={rewards.filter((reward) => reward.sourceType === 'shop').map((reward) => reward.rewardId)}
              online={shopOnline}
              onPurchase={onPurchaseProduct}
              companionName={storyName}
              appliedIds={[roomBackgroundId, roomAccessoryId].filter((id): id is string => Boolean(id))}
              onApply={onApplyRoomCosmetic}
            />
          </>
        )}
        {activeTab === 'character' && (
          <>
            <section className="character-picker" aria-label={`${personalize('푸디 캐릭터 선택')}`}>
              <h2>{personalize('푸디 캐릭터 선택')}</h2>
              <div className="character-picker-grid">
                {COMPANION_CHARACTERS.map((character) => (
                  <button key={character.id} type="button" className={characterId === character.id ? 'selected' : ''} aria-pressed={characterId === character.id} onClick={() => onCharacterChange(character.id)}>
                    <span className={`mini-companion mini-${character.id}`} aria-hidden="true" />
                    <strong>{character.name}</strong>
                    <small>{character.description}</small>
                  </button>
                ))}
              </div>
            </section>
            {characterId === 'daqong' && (
              <section className="character-name-editor" aria-label={`${storyName} 이름 수정`}>
                <h2>{storyName} 이름 수정</h2>
                <label htmlFor="daqong-name-input">이름</label>
                <input
                  id="daqong-name-input"
                  type="text"
                  value={characterName || '다쿵이'}
                  maxLength={12}
                  onChange={(event) => onCharacterNameChange(event.target.value.trimStart().slice(0, 12) || '다쿵이')}
                />
                <small>이 이름은 홈 방 제목과 캐릭터 안내에 반영돼요.</small>
              </section>
            )}
            {evolution && (
              <section className="character-evolution-card" aria-label={`${personalize('푸디 성장과 변신')}`}>
                <h2>{evolution.formName}</h2>
                <p>{evolution.title}</p>
                <div className="evolution-progress-track" aria-label={`성장 진행 ${evolution.progress}%`}><span style={{ width: `${evolution.progress}%` }} /></div>
                <small>식사 기록 {evolution.stage}/4단계</small>
              </section>
            )}
            <section className="class-picker" aria-label={`${personalize('푸디 전직 선택')}`}>
              <h2>전직 선택</h2>
              <p>식사 행동으로 열린 직업을 선택하면 고유 스킬과 보너스를 얻어요.</p>
              <div className="class-picker-grid">
                {companionClasses.map((job) => <button key={job.id} type="button" disabled={!job.unlocked} className={job.recommended ? 'selected' : ''} aria-pressed={job.recommended} onClick={() => onClassChange(job.id)}><strong>{job.name}</strong><small>{job.unlocked ? `${job.skill} · ${job.bonus}` : `🔒 ${job.requirement}`}</small></button>)}
              </div>
            </section>
          </>
        )}
      </div>
      {showSettings && (
        <div className="room-popup-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSettings(false) }}>
          <div className="companion-settings-popup">
            <button className="room-popup-close" type="button" aria-label="게임 효과 설정 닫기" onClick={() => setShowSettings(false)}>×</button>
            <ExperienceSettings value={experienceSettings} onChange={onExperienceSettingsChange} />
          </div>
        </div>
      )}
    </section>
  )
}
