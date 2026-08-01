import { useState, type CSSProperties } from 'react'
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
import type { AdvancedGameSystems } from '../../domain/advancedGameSystems'
import type { ShopProduct } from '../../domain/shopCatalog'
import { SCENE_ASSETS } from '../../ui/sceneAssets'
import { CosmeticShop } from './CosmeticShop'
import { CompanionRoomScene, type RoomPanel } from './CompanionRoomScene'

function getInitialRoomPanel(): RoomPanel {
  if (window.sessionStorage.getItem('foodex-open-companion-shop') !== '1') return null
  window.sessionStorage.removeItem('foodex-open-companion-shop')
  return 'shop'
}

export function CompanionScreen({
  entries, roomUnlocks, progression, rewards, experienceSettings, onExperienceSettingsChange,
  characterId = 'foody', onCharacterChange = () => undefined, evolution, companionClasses = [],
  onClassChange = () => undefined, advancedSystems, coinBalance = 0, shopOnline = false,
  onPurchaseProduct = async () => undefined,
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
  advancedSystems?: AdvancedGameSystems
  coinBalance?: number
  shopOnline?: boolean
  onPurchaseProduct?: (product: ShopProduct) => Promise<void>
}) {
  const [activePanel, setActivePanel] = useState<RoomPanel>(getInitialRoomPanel)
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(Date.now())
  const journal = buildDailyJournal(entries, progression, day)
  const report = buildMonthlyReport(entries, rewards, day.slice(0, 7))
  const ownedIds = rewards.filter((reward) => reward.sourceType === 'shop').map((reward) => reward.rewardId)

  return (
    <section
      className="companion-screen"
      aria-label="AI 친구"
      style={{ '--scene-background': `url("${SCENE_ASSETS.companionRoom}")` } as CSSProperties}
    >
      <CompanionRoomScene
        characterId={characterId}
        emotion="happy"
        reducedMotion={experienceSettings.reducedMotion}
        evolution={evolution}
        coinBalance={coinBalance}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        childrenByPanel={{
          wardrobe: <>
            <section className="character-picker" aria-label="친구 캐릭터 선택"><div className="character-picker-grid">{COMPANION_CHARACTERS.map((character) => <button key={character.id} type="button" className={characterId === character.id ? 'selected' : ''} aria-pressed={characterId === character.id} onClick={() => onCharacterChange(character.id)}><span className={`mini-companion mini-${character.id}`} aria-hidden="true" /><strong>{character.name}</strong><small>{character.description}</small></button>)}</div></section>
            <section className="friend-story-card"><h3>방 꾸미기 보유품</h3>{roomUnlocks.length ? <ul>{roomUnlocks.map((unlock) => <li key={unlock.id}>{unlock.title}</li>)}</ul> : <p>모험을 이어가면 새 장식을 찾을 수 있어요.</p>}</section>
          </>,
          journal: <section className="friend-story-card buddy-journal-card"><h2>오늘의 식사 일기</h2><p>{journal.text}</p></section>,
          growth: <>
            {evolution && <section className="character-evolution-card" aria-label="친구 성장과 변화"><h3>{evolution.formName}</h3><p>{evolution.title}</p><div className="evolution-progress-track" aria-label={`성장 진행 ${evolution.progress}%`}><span style={{ width: `${evolution.progress}%` }} /></div><small>식사 기록 {evolution.stage}/4단계</small></section>}
            <section className="class-picker" aria-label="친구 직업 선택"><h3>직업 선택</h3><div className="class-picker-grid">{companionClasses.map((job) => <button key={job.id} type="button" disabled={!job.unlocked} className={job.recommended ? 'selected' : ''} aria-pressed={job.recommended} onClick={() => onClassChange(job.id)}><strong>{job.name}</strong><small>{job.unlocked ? `${job.skill} · ${job.bonus}` : `🔒 ${job.requirement}`}</small></button>)}</div></section>
            {advancedSystems && <details className="advanced-systems-panel"><summary>자세한 게임 시스템 보기</summary><p>{advancedSystems.event.title} · {advancedSystems.event.reward}</p><p>{advancedSystems.transformation.message}</p></details>}
            <ExperienceSettings value={experienceSettings} onChange={onExperienceSettingsChange} />
          </>,
          report: <section className="friend-story-card buddy-report-card"><h2>주간 리포트</h2><p>{report.text}</p><strong>{report.suggestion}</strong></section>,
          shop: <CosmeticShop compact balance={coinBalance} ownedIds={ownedIds} online={shopOnline} onPurchase={onPurchaseProduct} />,
        }}
      />
    </section>
  )
}
