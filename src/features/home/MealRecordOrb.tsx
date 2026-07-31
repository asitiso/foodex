export interface MealRecordOrbProps {
  onRecord: () => void
  showLabel?: boolean
}

export function MealRecordOrb({ onRecord, showLabel = true }: MealRecordOrbProps) {
  return (
    <button
      type="button"
      className="meal-record-orb"
      aria-label="식사 기록하기"
      onClick={onRecord}
    >
      <span aria-hidden="true">📷</span>
      {showLabel ? <span>식사 기록하기</span> : null}
    </button>
  )
}
