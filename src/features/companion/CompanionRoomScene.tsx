import type { CSSProperties, ReactNode } from 'react'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEvolution } from '../../domain/companionEvolution'
import { GameSheet } from '../../ui/GameSheet'
import { SCENE_ASSETS } from '../../ui/sceneAssets'
import { HeroCompanion, type CompanionEmotion } from './HeroCompanion'

export type RoomPanel = 'wardrobe' | 'growth' | 'shop' | null

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
  icon: string
  className: string
  title: string
}> = [
  { panel: 'wardrobe', label: '옷장 열기', icon: '👕', className: 'room-hotspot-wardrobe', title: '옷장' },
  { panel: 'growth', label: '성장 거울 열기', icon: '🪞', className: 'room-hotspot-growth', title: '성장 거울' },
  { panel: 'shop', label: '꾸미기 상점 열기', icon: '🛍️', className: 'room-hotspot-shop', title: '꾸미기 상점' },
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
    <section
      className="companion-room-scene"
      aria-label="친구의 방"
      style={{ '--scene-background': `url("${SCENE_ASSETS.companionRoom}")` } as CSSProperties}
    >
      <div className="game-coin-pill" aria-label={`보유 코인 ${coinBalance}개`}>
        <span aria-hidden="true">🪙</span> {coinBalance}
      </div>
      <HeroCompanion
        characterId={characterId}
        emotion={emotion}
        reducedMotion={reducedMotion}
        evolutionStage={evolution?.stage}
      />
      <div className="room-hotspot-rail" aria-label="방 활동">
        {ROOM_LOCATIONS.map(({ panel, label, icon, className }) => (
          <button
            key={panel}
            type="button"
            className={`room-hotspot ${className}`}
            aria-label={label}
            onClick={() => onPanelChange(panel)}
          >
            <span aria-hidden="true">{icon}</span>
          </button>
        ))}
      </div>
      <GameSheet open={activePanel !== null} title={getPanelTitle(activePanel)} onClose={() => onPanelChange(null)}>
        {activePanel ? childrenByPanel[activePanel] : null}
      </GameSheet>
    </section>
  )
}
