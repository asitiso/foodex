export type CompanionEmotion = 'calm' | 'expectant' | 'happy' | 'surprised' | 'celebrating'

const EMOTION_LABELS: Record<CompanionEmotion, string> = {
  calm: '차분한',
  expectant: '기대하는',
  happy: '기뻐하는',
  surprised: '놀란',
  celebrating: '축하하는',
}

export function CompanionRoom({
  emotion,
  line,
  decorationIds,
  reducedMotion,
  onOpenCompanion,
}: {
  emotion: CompanionEmotion
  line: string
  decorationIds: readonly string[]
  reducedMotion: boolean
  onOpenCompanion: () => void
}) {
  return (
    <section className={`companion-room${reducedMotion ? ' reduced-motion' : ''}`} aria-label="푸디의 방">
      <div className="room-window" aria-hidden="true"><span /></div>
      <div className="room-shelf" aria-hidden="true"><i /><i /><i /></div>
      {decorationIds.map((id) => (
        <span
          className={`room-decoration decoration-${id}`}
          data-decoration-id={id}
          data-testid={`decoration-${id}`}
          key={id}
          aria-hidden="true"
        />
      ))}
      <button className="companion-speech" type="button" onClick={onOpenCompanion}>
        {line}
      </button>
      <div
        className={`companion-character emotion-${emotion}`}
        aria-label={`${EMOTION_LABELS[emotion]} 푸디`}
        role="img"
      >
        <span className="companion-ear left" aria-hidden="true" />
        <span className="companion-ear right" aria-hidden="true" />
        <span className="companion-face" aria-hidden="true">
          <i className="companion-eye left" />
          <i className="companion-eye right" />
          <i className="companion-mouth" />
          <i className="companion-cheek left" />
          <i className="companion-cheek right" />
        </span>
        <span className="companion-body" aria-hidden="true" />
      </div>
      <div className="room-floor" aria-hidden="true" />
      <div className="room-sparkles" aria-hidden="true"><i>✦</i><i>✦</i><i>✧</i></div>
    </section>
  )
}
