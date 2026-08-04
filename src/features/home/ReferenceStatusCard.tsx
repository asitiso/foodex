export interface ReferenceStatusCardProps {
  title: string
  value: string
  helperText?: string
  progress?: number
  tone: 'level' | 'cards' | 'meals'
  ariaLabel: string
  onActivate: () => void
}

export function ReferenceStatusCard({
  title,
  value,
  helperText,
  progress,
  tone,
  ariaLabel,
  onActivate,
}: ReferenceStatusCardProps) {
  const safeProgress = typeof progress === 'number'
    ? Math.max(0, Math.min(100, progress))
    : undefined

  return (
    <button
      type="button"
      className="reference-status-card"
      data-testid="reference-status-card"
      data-status-tone={tone}
      aria-label={ariaLabel}
      onClick={onActivate}
    >
      <span className="reference-status-title">{title}</span>
      <strong className="reference-status-value">{value}</strong>
      {helperText ? <span className="reference-status-helper">{helperText}</span> : null}
      {typeof safeProgress === 'number' ? (
        <span
          className="reference-status-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeProgress}
        >
          <span style={{ width: `${safeProgress}%` }} />
        </span>
      ) : null}
    </button>
  )
}
