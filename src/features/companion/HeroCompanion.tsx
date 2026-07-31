import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import { getCompanionArt } from '../../ui/sceneAssets'

export type CompanionEmotion = 'calm' | 'expectant' | 'happy' | 'surprised' | 'celebrating'

interface HeroCompanionProps {
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
  evolutionStage?: number
  onOpenRoom?: () => void
}

const EMOTION_LABELS: Record<CompanionEmotion, string> = {
  calm: '차분한 ', expectant: '기대하는 ', happy: '기뻐하는 ', surprised: '깜짝 ', celebrating: '축하하는 ',
}

const CHARACTER_LABELS: Record<CompanionCharacterId, string> = {
  foody: '푸디', berry: '베리', noodle: '누들', cocoa: '코코',
}

const CLICK_REACTIONS = ['jump', 'wiggle', 'ears', 'spin', 'sparkle'] as const
type Activity = 'idle' | 'walk' | 'jump' | 'sleep' | 'eat'

const REACTION_MESSAGES: Record<(typeof CLICK_REACTIONS)[number], string> = {
  jump: '통통 뛰며 반가워해!',
  wiggle: '몸을 좌우로 흔들어!',
  ears: '귀를 쫑긋 세웠어!',
  spin: '휙! 신나게 돌아볼까!',
  sparkle: '반짝거리는 별송이가 있어!',
}

export function HeroCompanion({ characterId, emotion, reducedMotion, evolutionStage = 1, onOpenRoom }: HeroCompanionProps) {
  const [activity, setActivity] = useState<Activity>('idle')
  const [reaction, setReaction] = useState<(typeof CLICK_REACTIONS)[number]>()
  const [message, setMessage] = useState<string>()
  const [clickFeedback, setClickFeedback] = useState(false)
  const reactionIndex = useRef(-1)
  const reactionTimers = useRef<number[]>([])
  const holdTimer = useRef<number | undefined>(undefined)
  const holdStart = useRef<{ x: number, y: number } | undefined>(undefined)

  const clearReactionTimers = () => {
    reactionTimers.current.forEach((timer) => window.clearTimeout(timer))
    reactionTimers.current = []
  }

  const cancelHold = () => {
    if (holdTimer.current !== undefined) window.clearTimeout(holdTimer.current)
    holdTimer.current = undefined
    holdStart.current = undefined
  }

  useEffect(() => () => {
    clearReactionTimers()
    cancelHold()
  }, [])

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

  const reactToCharacter = () => {
    clearReactionTimers()
    reactionIndex.current = (reactionIndex.current + 1) % CLICK_REACTIONS.length
    const nextReaction = CLICK_REACTIONS[reactionIndex.current]
    const prefix = characterId === 'berry' ? '상큼하게 ' : characterId === 'noodle' ? '후루룩! ' : characterId === 'cocoa' ? '달콤하게 ' : ''
    setReaction(nextReaction)
    setMessage(prefix + REACTION_MESSAGES[nextReaction])
    setClickFeedback(true)
    reactionTimers.current = [
      window.setTimeout(() => setMessage(undefined), 2200),
      window.setTimeout(() => setClickFeedback(false), 420),
    ]
  }

  const startHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (!onOpenRoom || event.pointerType === 'mouse' && event.button !== 0) return
    holdStart.current = { x: event.clientX, y: event.clientY }
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = undefined
      holdStart.current = undefined
      onOpenRoom()
    }, 600)
  }

  const cancelMovedHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (!holdStart.current) return
    if (Math.hypot(event.clientX - holdStart.current.x, event.clientY - holdStart.current.y) > 4) cancelHold()
  }

  return (
    <div className="hero-companion-wrap">
      {message && <p className="companion-reaction" role="status">{message}</p>}
      {clickFeedback && <span className="companion-click-sparkle" data-testid="companion-click-sparkle" aria-label="click sparkle" role="status">✦</span>}
      <button
        className={`companion-character character-${characterId} evolution-stage-${evolutionStage} emotion-${emotion} activity-${reaction ?? activity}${reducedMotion ? ' reduced-motion' : ''}`}
        type="button"
        aria-label={`${EMOTION_LABELS[emotion]}${CHARACTER_LABELS[characterId]}`}
        data-reaction={reaction}
        style={{ '--companion-art': `url("${getCompanionArt(characterId)}")` } as CSSProperties}
        onClick={reactToCharacter}
        onPointerDown={startHold}
        onPointerMove={cancelMovedHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
      >
        <span className="companion-ear left" aria-hidden="true" />
        <span className="companion-ear right" aria-hidden="true" />
        <span className="companion-face" aria-hidden="true"><i className="companion-eye left" /><i className="companion-eye right" /><i className="companion-mouth" /><i className="companion-cheek left" /><i className="companion-cheek right" /></span>
        <span className="companion-body" aria-hidden="true" />
      </button>
      {onOpenRoom && <button className="companion-room-action" type="button" onClick={onOpenRoom}>방으로 가기</button>}
    </div>
  )
}
