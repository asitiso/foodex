import { useEffect, useState } from 'react'

export type CompanionEmotion = 'calm' | 'expectant' | 'happy' | 'surprised' | 'celebrating'

const EMOTION_LABELS: Record<CompanionEmotion, string> = {
  calm: '차분한', expectant: '기대하는', happy: '기뻐하는', surprised: '깜짝', celebrating: '축하하는',
}

type Activity = 'idle' | 'walk' | 'jump' | 'sleep' | 'eat'

export function CompanionRoom({
  emotion, line, decorationIds, reducedMotion, onOpenCompanion,
}: {
  emotion: CompanionEmotion
  line: string
  decorationIds: readonly string[]
  reducedMotion: boolean
  onOpenCompanion: () => void
}) {
  const [activity, setActivity] = useState<Activity>('idle')
  const [reaction, setReaction] = useState<string>()

  useEffect(() => {
    if (reducedMotion) return
    const activities: Activity[] = ['idle', 'walk', 'jump', 'sleep', 'eat']
    let index = 0
    const timer = window.setInterval(() => {
      index = (index + 1) % activities.length
      setActivity(activities[index])
    }, 4200)
    return () => window.clearInterval(timer)
  }, [reducedMotion])

  const reactTo = (nextActivity: Activity, message: string) => {
    setActivity(nextActivity)
    setReaction(message)
    window.setTimeout(() => setReaction(undefined), 2200)
  }

  return (
    <section className={`companion-room${reducedMotion ? ' reduced-motion' : ''}`} aria-label="푸디의 방">
      <button className="room-window room-interactive" type="button" aria-label="창문" onClick={() => reactTo('walk', '창문 밖에서 바람이 불어와!')}><span /></button>
      <button className="room-shelf room-interactive" type="button" aria-label="카드 선반" onClick={() => reactTo('jump', '선반의 카드들이 반짝여!')}><i /><i /><i /></button>
      {decorationIds.map((id) => (
        <button type="button" className={`room-decoration decoration-${id}`} data-decoration-id={id} data-testid={`decoration-${id}`} key={id} aria-label={`${id} 장식`} onClick={() => reactTo('eat', id === 'small-plant' ? '화분이 오늘도 쑥쑥 자라!' : '장식이 반짝반짝 빛나!')} />
      ))}
      {reaction && <p className="companion-reaction" role="status">{reaction}</p>}
      <button className="companion-speech" type="button" onClick={onOpenCompanion}>{line}</button>
      <button type="button" className={`companion-character emotion-${emotion} activity-${activity}`} aria-label={`${EMOTION_LABELS[emotion]} 푸디`} onClick={() => reactTo('jump', '꼬리를 흔들며 반가워해!')}>
        <span className="companion-ear left" aria-hidden="true" />
        <span className="companion-ear right" aria-hidden="true" />
        <span className="companion-face" aria-hidden="true"><i className="companion-eye left" /><i className="companion-eye right" /><i className="companion-mouth" /><i className="companion-cheek left" /><i className="companion-cheek right" /></span>
        <span className="companion-body" aria-hidden="true" />
      </button>
      <div className="room-floor" aria-hidden="true" />
      <div className="room-sparkles" aria-hidden="true"><i>✦</i><i>✦</i><i>✧</i></div>
    </section>
  )
}
