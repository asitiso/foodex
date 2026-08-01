import type { ReactNode } from 'react'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEvolution } from '../../domain/companionEvolution'
import { GameIcon, type GameIconName } from '../../ui/GameIcon'
import { GameSheet } from '../../ui/GameSheet'
import { HeroCompanion, type CompanionEmotion } from './HeroCompanion'

export type RoomPanel = 'wardrobe' | 'journal' | 'growth' | 'report' | 'shop' | null

export interface CompanionRoomSceneProps {
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
  evolution?: CompanionEvolution
  coinBalance: number
  activePanel: RoomPanel
  onPanelChange: (panel: RoomPanel) => void
  childrenByPanel: Partial<Record<Exclude<RoomPanel, null>, ReactNode>>
}

const ROOM_LOCATIONS: ReadonlyArray<{
  panel: Exclude<RoomPanel, null>
  label: string
  icon: GameIconName
  className: string
  title: string
}> = [
  { panel: 'wardrobe', label: '옷장 열기', icon: 'wardrobe', className: 'room-hotspot-wardrobe', title: '옷장' },
  { panel: 'journal', label: '기록 책장 열기', icon: 'bookshelf', className: 'room-hotspot-journal', title: '기록 책장' },
  { panel: 'growth', label: '성장 거울 열기', icon: 'growth', className: 'room-hotspot-growth', title: '성장 거울' },
  { panel: 'report', label: '리포트 열기', icon: 'report', className: 'room-hotspot-report', title: '리포트' },
  { panel: 'shop', label: '꾸미기 상점 열기', icon: 'shop', className: 'room-hotspot-shop', title: '꾸미기 상점' },
]

function getPanelTitle(panel: RoomPanel): string {
  return ROOM_LOCATIONS.find((location) => location.panel === panel)?.title ?? ''
}

export function CompanionRoomScene({
  characterId,
  emotion,
  reducedMotion,
  evolution,
  coinBalance,
  activePanel,
  onPanelChange,
  childrenByPanel,
}: CompanionRoomSceneProps) {
  return (
    <section className="companion-room-scene" aria-label="친구의 방">
      <div className="buddy-room-title" aria-label="버디 룸">
        <span className="buddy-room-avatar" aria-hidden="true"><GameIcon name="buddy" /></span>
        <span><strong>Buddy 룸</strong><small>우리 멋지고 건강하게 자라자!</small></span>
      </div>
      <button
        type="button"
        className="game-coin-pill"
        aria-label={`보유 코인 ${coinBalance}개, 꾸미기 상점 열기`}
        onClick={() => onPanelChange('shop')}
      >
        <GameIcon name="coin" />
        <strong>{coinBalance.toLocaleString()}</strong>
        <span className="coin-add" aria-hidden="true">+</span>
      </button>

      <div className="buddy-character-stage" data-testid="buddy-character-stage">
        <HeroCompanion
          characterId={characterId}
          emotion={emotion}
          reducedMotion={reducedMotion}
          evolutionStage={evolution?.stage}
        />
      </div>

      <div className="room-prop-hotspots buddy-room-hotspots" role="group" aria-label="방 활동">
        {ROOM_LOCATIONS.map(({ panel, label, icon, className, title }) => (
          <button
            key={panel}
            type="button"
            className={`room-prop-hotspot ${className}`}
            data-room-panel={panel}
            aria-label={label}
            onClick={() => onPanelChange(panel)}
          >
            <span className="room-prop-icon" aria-hidden="true"><GameIcon name={icon} /></span>
            <span className="room-prop-label">{title}</span>
          </button>
        ))}
      </div>
      <GameSheet open={activePanel !== null} title={getPanelTitle(activePanel)} onClose={() => onPanelChange(null)}>
        {activePanel ? childrenByPanel[activePanel] : null}
      </GameSheet>
    </section>
  )
}
