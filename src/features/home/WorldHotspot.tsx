import { GameIcon, type GameIconName } from '../../ui/GameIcon'

export interface WorldHotspotProps {
  label: string
  className: string
  icon: GameIconName
  onActivate: () => void
}

export function WorldHotspot({ label, className, icon, onActivate }: WorldHotspotProps) {
  return (
    <button type="button" className={`world-hotspot ${className}`} aria-label={label} onClick={onActivate}>
      <GameIcon name={icon} />
    </button>
  )
}
