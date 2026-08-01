import { GameIcon, type GameIconName } from '../../ui/GameIcon'

export interface HomeMenuCardProps {
  label: string
  icon: GameIconName
  onActivate: () => void
}

export function HomeMenuCard({ label, icon, onActivate }: HomeMenuCardProps) {
  return (
    <button className="home-menu-card" type="button" onClick={onActivate} aria-label={label}>
      <GameIcon name={icon} />
      <span>{label}</span>
    </button>
  )
}
