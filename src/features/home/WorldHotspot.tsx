export interface WorldHotspotProps {
  label: string
  className: string
  icon: string
  onActivate: () => void
}

export function WorldHotspot({ label, className, icon, onActivate }: WorldHotspotProps) {
  return (
    <button
      type="button"
      className={`world-hotspot ${className}`}
      aria-label={label}
      onClick={onActivate}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}
