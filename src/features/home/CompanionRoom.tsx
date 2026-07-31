import { useEffect, useRef, useState } from 'react'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEvolution } from '../../domain/companionEvolution'
import type { CompanionClass } from '../../domain/companionClasses'
import { HeroCompanion } from '../companion/HeroCompanion'
import type { CompanionEmotion } from '../companion/HeroCompanion'

export type { CompanionEmotion } from '../companion/HeroCompanion'

type Activity = 'walk' | 'jump' | 'eat'

export function CompanionRoom({
  emotion, line, decorationIds, reducedMotion, characterId = 'foody', evolution, companionClass, onOpenCompanion,
}: {
  emotion: CompanionEmotion
  line: string
  decorationIds: readonly string[]
  reducedMotion: boolean
  characterId?: CompanionCharacterId
  evolution?: CompanionEvolution
  companionClass?: CompanionClass
  onOpenCompanion: () => void
}) {
  const [reaction, setReaction] = useState<string>()
  const reactionTimers = useRef<number[]>([])

  useEffect(() => () => {
    reactionTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const reactTo = (nextActivity: Activity, message: string) => {
    reactionTimers.current.forEach((timer) => window.clearTimeout(timer))
    setReaction(message)
    reactionTimers.current = [window.setTimeout(() => setReaction(undefined), 2200)]
  }

  return (
    <section className={`companion-room evolution-stage-${evolution?.stage ?? 1}${reducedMotion ? ' reduced-motion' : ''}`} aria-label="푸디의 방">
      <button className="room-window room-interactive" type="button" aria-label="창문" onClick={() => reactTo('walk', '창문 밖에서 바람이 불어와!')}><span /></button>
      <button className="room-shelf room-interactive" type="button" aria-label="카드 선반" onClick={() => reactTo('jump', '선반의 카드들이 반짝여!')}><i /><i /><i /></button>
      {decorationIds.map((id) => (
        <button type="button" className={`room-decoration decoration-${id}`} data-decoration-id={id} data-testid={`decoration-${id}`} key={id} aria-label={`${id} 장식`} onClick={() => reactTo('eat', id === 'small-plant' ? '화분이 오늘도 쑥쑥 자라!' : '장식이 반짝반짝 빛나!')} />
      ))}
      {reaction && <p className="companion-reaction" role="status">{reaction}</p>}
      <button className="companion-speech" type="button" onClick={onOpenCompanion}>{companionClass ? `${companionClass.name} · ${line}` : line}</button>
      <HeroCompanion characterId={characterId} emotion={emotion} reducedMotion={reducedMotion} evolutionStage={evolution?.stage} onOpenRoom={onOpenCompanion} />
      <div className="room-floor" aria-hidden="true" />
      <div className="room-sparkles" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></div>
    </section>
  )
}
