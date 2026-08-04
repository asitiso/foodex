import { GameIcon, type GameIconName } from '../../ui/GameIcon'

export type ReferenceLandmarkVariant = 'collection' | 'adventure' | 'buddy'

export interface ReferenceLandmarkButtonProps {
  variant: ReferenceLandmarkVariant
  label: string
  text: string
  icon: GameIconName
  className: string
  onActivate: () => void
}

export function ReferenceLandmarkButton({
  variant,
  label,
  text,
  icon,
  className,
  onActivate,
}: ReferenceLandmarkButtonProps) {
  return (
    <button
      type="button"
      className={`reference-landmark-button reference-landmark-button--${variant} ${className}`}
      data-landmark-variant={variant}
      aria-label={label}
      onClick={onActivate}
    >
      <span className="reference-landmark-face">
        <GameIcon name={icon} />
        <strong>{text}</strong>
      </span>
    </button>
  )
}
