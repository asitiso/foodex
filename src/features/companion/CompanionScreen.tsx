import { useState } from 'react'
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

type CompanionTab = 'journal' | 'report' | 'room'

const TABS: readonly { id: CompanionTab; label: string }[] = [
  { id: 'journal', label: '식사 일기' },
  { id: 'report', label: '월간 리포트' },
  { id: 'room', label: '내 방' },
]

export function CompanionScreen({
  entries,
  roomUnlocks,
  progression,
  rewards,
  experienceSettings,
  onExperienceSettingsChange,
  characterId = 'foody',
  onCharacterChange = () => undefined,
  evolution,
  companionClasses = [],
  onClassChange = () => undefined,
}: {
  entries: Array<{ card: FoodCard; meal: MealRecord }>
  roomUnlocks: readonly RoomUnlock[]
  progression: Progression
  rewards: readonly UserReward[]
  experienceSettings: ExperienceSettingsValue
  onExperienceSettingsChange: (value: ExperienceSettingsValue) => void
  characterId?: CompanionCharacterId
  onCharacterChange?: (id: CompanionCharacterId) => void
  evolution?: CompanionEvolution
  companionClasses?: CompanionClass[]
  onClassChange?: (id: CompanionClassId) => void
}) {
  const [activeTab, setActiveTab] = useState<CompanionTab>('journal')
  const now = Date.now()
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const month = day.slice(0, 7)
  const journal = buildDailyJournal(entries, progression, day)
  const report = buildMonthlyReport(entries, rewards, month)

  return (
    <section className="companion-screen" aria-label="AI 친구">
      <header>
        <p className="eyebrow">FOODEX 친구</p>
        <h1>푸디와 만든 맛있는 이야기</h1>
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
          <section className="friend-story-card">
            <span aria-hidden="true">📖</span>
            <h2>오늘의 식사 일기</h2>
            <p>{journal.text}</p>
          </section>
        )}
        {activeTab === 'report' && (
          <section className="friend-story-card">
            <span aria-hidden="true">📊</span>
            <h2>이번 달 한눈에 보기</h2>
            <p>{report.text}</p>
            <strong>{report.suggestion}</strong>
          </section>
        )}
        {activeTab === 'room' && (
          <section className="friend-story-card">
            <span aria-hidden="true">🏠</span>
            <h2>내 방 장식</h2>
            {roomUnlocks.length > 0
              ? <ul>{roomUnlocks.map((unlock) => <li key={unlock.id}>{unlock.title}</li>)}</ul>
              : <p>아직 기본 방이야. 모험을 이어 가면 장식이 생겨!</p>}
            <strong>다음 장식: 레벨 3 작은 화분</strong>
          </section>
        )}
      </div>
      <ExperienceSettings value={experienceSettings} onChange={onExperienceSettingsChange} />
      {evolution && (
        <section className="character-evolution-card" aria-label="푸디 성장과 변신">
          <h2>{evolution.formName}</h2>
          <p>{evolution.title}</p>
          <div className="evolution-progress-track" aria-label={`성장 진행 ${evolution.progress}%`}><span style={{ width: `${evolution.progress}%` }} /></div>
          <small>식사 기록 {evolution.stage}/4단계</small>
        </section>
      )}
      <section className="class-picker" aria-label="푸디 전직 선택">
        <h2>전직 선택</h2>
        <p>식사 행동으로 열린 직업을 선택하면 고유 스킬과 보너스를 얻어요.</p>
        <div className="class-picker-grid">
          {companionClasses.map((job) => <button key={job.id} type="button" disabled={!job.unlocked} className={job.recommended ? 'selected' : ''} aria-pressed={job.recommended} onClick={() => onClassChange(job.id)}><strong>{job.name}</strong><small>{job.unlocked ? `${job.skill} · ${job.bonus}` : `🔒 ${job.requirement}`}</small></button>)}
        </div>
      </section>
      <section className="character-picker" aria-label="푸디 캐릭터 선택">
        <h2>푸디 캐릭터 선택</h2>
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
    </section>
  )
}
