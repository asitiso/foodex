import { GameIcon, type GameIconName } from '../../ui/GameIcon'

export interface WorldHotspotProps {
  label: string
  text: string
  className: string
  icon: GameIconName
  onActivate: () => void
}

export function WorldHotspot({ label, text, className, icon, onActivate }: WorldHotspotProps) {
  return (
    <button type="button" className={`world-hotspot ${className}`} aria-label={label} onClick={onActivate}>
      <GameIcon name={icon} />
      <span>{text}</span>
    </button>
  )
}
