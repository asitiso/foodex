import { GameIcon } from '../../ui/GameIcon'

export interface ReferenceRecordButtonProps {
  onRecord: () => void
}

export function ReferenceRecordButton({ onRecord }: ReferenceRecordButtonProps) {
  return (
    <button
      type="button"
      className="reference-record-button"
      data-home-landmark="record"
      aria-label="식사 기록하기"
      onClick={onRecord}
    >
      <span className="reference-record-camera" aria-hidden="true">
        <span className="reference-record-camera-top" />
        <span className="reference-record-lens"><GameIcon name="camera" /></span>
      </span>
      <strong>식사 기록</strong>
    </button>
  )
}
