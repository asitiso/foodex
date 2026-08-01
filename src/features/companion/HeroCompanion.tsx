import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import { getCompanionArt } from '../../ui/sceneAssets'

export type CompanionEmotion = 'calm' | 'expectant' | 'happy' | 'surprised' | 'celebrating'
export type CompanionReaction = 'smile' | 'jump' | 'surprise' | 'sleepy' | 'satisfied' | 'discovery'

interface HeroCompanionProps {
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
  evolutionStage?: number
  onOpenRoom?: () => void
}

const EMOTION_LABELS: Record<CompanionEmotion, string> = {
  calm: '차분한 ',
  expectant: '기대하는 ',
  happy: '기뻐하는 ',
  surprised: '깜짝 놀란 ',
  celebrating: '축하하는 ',
}

const CHARACTER_LABELS: Record<CompanionCharacterId, string> = {
  foody: '푸디',
  berry: '베리',
  noodle: '누들',
  cocoa: '코코아',
}

export const COMPANION_REACTIONS: readonly CompanionReaction[] = [
  'smile',
  'jump',
  'surprise',
  'sleepy',
  'satisfied',
  'discovery',
]

type Activity = 'idle' | 'walk' | 'jump' | 'sleep' | 'eat'

const REACTION_MESSAGES: Record<CompanionReaction, string> = {
  smile: '활짝 웃으며 반가워해!',
  jump: '통통 뛰며 신나해!',
  surprise: '우와! 깜짝 놀랐어!',
  sleepy: '포근하게 졸고 있어.',
  satisfied: '냠냠, 정말 만족스러워!',
  discovery: '반짝이는 걸 발견했어!',
}

export function HeroCompanion({
  characterId,
  emotion,
  reducedMotion,
  evolutionStage = 1,
  onOpenRoom,
}: HeroCompanionProps) {
  const [activity, setActivity] = useState<Activity>('idle')
  const [reaction, setReaction] = useState<CompanionReaction>()
  const [message, setMessage] = useState<string>()
  const [clickFeedback, setClickFeedback] = useState(false)
  const reactionIndex = useRef(-1)
  const reactionTimers = useRef<number[]>([])
  const holdTimer = useRef<number | undefined>(undefined)
  const holdStart = useRef<{ x: number; y: number } | undefined>(undefined)
  const activePointerId = useRef<number | null>(null)

  const clearReactionTimers = () => {
    reactionTimers.current.forEach((timer) => window.clearTimeout(timer))
    reactionTimers.current = []
  }

  const cancelHold = (pointerId?: number) => {
    if (pointerId !== undefined && activePointerId.current !== pointerId) return
    if (holdTimer.current !== undefined) window.clearTimeout(holdTimer.current)
    holdTimer.current = undefined
    holdStart.current = undefined
    activePointerId.current = null
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
    reactionIndex.current = (reactionIndex.current + 1) % COMPANION_REACTIONS.length
    const nextReaction = COMPANION_REACTIONS[reactionIndex.current]
    const prefix = characterId === 'berry'
      ? '상큼하게 '
      : characterId === 'noodle'
        ? '후루룩! '
        : characterId === 'cocoa'
          ? '달콤하게 '
          : ''

    setReaction(nextReaction)
    setMessage(prefix + REACTION_MESSAGES[nextReaction])
    setClickFeedback(nextReaction === 'discovery' || nextReaction === 'surprise')
    reactionTimers.current = [
      window.setTimeout(() => setClickFeedback(false), 520),
      window.setTimeout(() => setMessage(undefined), 1800),
      window.setTimeout(() => setReaction(undefined), 1900),
    ]
  }

  const startHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (!onOpenRoom || activePointerId.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
    activePointerId.current = event.pointerId
    holdStart.current = { x: event.clientX, y: event.clientY }
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = undefined
      holdStart.current = undefined
      activePointerId.current = null
      onOpenRoom()
    }, 600)
  }

  const cancelMovedHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerId.current !== event.pointerId || !holdStart.current) return
    if (Math.hypot(event.clientX - holdStart.current.x, event.clientY - holdStart.current.y) > 4) {
      cancelHold(event.pointerId)
    }
  }

  const visualState = reaction ? `reaction-${reaction}` : `activity-${activity}`

  return (
    <div className="hero-companion-wrap">
      {message && <p className="companion-reaction" role="status">{message}</p>}
      {clickFeedback && (
        <span
          className="companion-click-sparkle"
          data-testid="companion-click-sparkle"
          aria-label="반짝 발견 효과"
          role="status"
        >
          ✦
        </span>
      )}
      <button
        className={`companion-character character-${characterId} evolution-stage-${evolutionStage} emotion-${emotion} ${visualState}${reducedMotion ? ' reduced-motion' : ''}`}
        type="button"
        aria-label={`${EMOTION_LABELS[emotion]}${CHARACTER_LABELS[characterId]}`}
        data-reaction={reaction}
        style={{ '--companion-art': `url("${getCompanionArt(characterId)}")` } as CSSProperties}
        onClick={reactToCharacter}
        onPointerDown={startHold}
        onPointerMove={cancelMovedHold}
        onPointerUp={(event) => cancelHold(event.pointerId)}
        onPointerCancel={(event) => cancelHold(event.pointerId)}
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
      </button>
      {onOpenRoom && (
        <button className="companion-room-action" type="button" onClick={onOpenRoom}>
          방으로 가기
        </button>
      )}
    </div>
  )
}
