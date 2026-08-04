import { useEffect, useRef, useState } from 'react'
import { getCompanionCharacter, type CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEvolution } from '../../domain/companionEvolution'
import type { CompanionClass } from '../../domain/companionClasses'
import type { TimeOfDay } from '../../domain/roomAmbience'

export type CompanionEmotion = 'calm' | 'expectant' | 'happy' | 'surprised' | 'celebrating'

const EMOTION_LABELS: Record<CompanionEmotion, string> = {
  calm: '차분한', expectant: '기대하는', happy: '기뻐하는', surprised: '깜짝', celebrating: '축하하는',
}

type Activity = 'idle' | 'walk' | 'jump' | 'sleep' | 'eat' | 'wiggle' | 'tail' | 'ears' | 'sparkle'
const CLICK_MOTIONS: readonly Activity[] = ['jump', 'wiggle', 'tail', 'ears', 'sparkle']

export function CompanionRoom({
  emotion, line, decorationIds, reducedMotion, characterId = 'foody', characterName, evolution, companionClass, backgroundId, accessoryId, timeOfDay, celebrating, onOpenCompanion, onOpenDungeon, onOpenBoard,
}: {
  emotion: CompanionEmotion
  line: string
  decorationIds: readonly string[]
  reducedMotion: boolean
  characterId?: CompanionCharacterId
  characterName?: string
  evolution?: CompanionEvolution
  companionClass?: CompanionClass
  backgroundId?: string
  accessoryId?: string
  timeOfDay?: TimeOfDay
  celebrating?: boolean
  onOpenCompanion: () => void
  onOpenDungeon?: () => void
  onOpenBoard?: () => void
}) {
  const [activity, setActivity] = useState<Activity>('idle')
  const [reaction, setReaction] = useState<string>()
  const [clickFeedback, setClickFeedback] = useState(false)
  const clickMotionIndex = useRef(-1)
  const reactionTimers = useRef<number[]>([])

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

  useEffect(() => () => {
    reactionTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const reactTo = (nextActivity: Activity, message: string) => {
    reactionTimers.current.forEach((timer) => window.clearTimeout(timer))
    setActivity(nextActivity)
    setReaction(message)
    setClickFeedback(true)
    reactionTimers.current = [
      window.setTimeout(() => setReaction(undefined), 2200),
      window.setTimeout(() => setClickFeedback(false), 420),
    ]
  }

  const displayName = (characterName || getCompanionCharacter(characterId).name || '푸디').trim() || '푸디'

  const reactToCharacter = () => {
    clickMotionIndex.current = (clickMotionIndex.current + 1) % CLICK_MOTIONS.length
    const motion = CLICK_MOTIONS[clickMotionIndex.current]
    const messages: Record<Activity, string> = {
      jump: characterId === 'daqong' ? '동글동글 폴짝! 반가워요!' : '통통 뛰며 반가워해!',
      wiggle: characterId === 'daqong' ? '보들보들 몸을 살짝 흔들어요!' : '몸을 좌우로 흔들어!',
      tail: characterId === 'daqong' ? '작은 꽁지깃을 살랑살랑해요!' : '꼬리를 살랑살랑 흔들어!',
      ears: characterId === 'daqong' ? '작은 날개를 파닥파닥해요!' : '귀를 쫑긋 세워!',
      sparkle: characterId === 'daqong' ? '반짝한 눈빛으로 두근거려요!' : '별가루를 톡톡 뿜어!',
      idle: '', walk: '', sleep: '', eat: '',
    }
    const prefix = characterId === 'berry' ? '상큼하게 ' : characterId === 'noodle' ? '후루룩! ' : characterId === 'cocoa' ? '달콤하게 ' : characterId === 'daqong' ? '삐약~ ' : ''
    reactTo(motion, prefix + messages[motion])
  }

  const roomClassName = [
    'companion-room',
    `character-${characterId}`,
    `evolution-stage-${evolution?.stage ?? 1}`,
    reducedMotion ? 'reduced-motion' : '',
    backgroundId ? `room-bg-${backgroundId}` : '',
    timeOfDay ? `time-${timeOfDay}` : '',
    celebrating ? 'celebrating' : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={roomClassName} aria-label={`${displayName}의 방`}>
      <button className="room-window room-interactive" type="button" aria-label="창문" onClick={() => { reactTo('walk', '창문 밖에서 바람이 불어와!'); onOpenDungeon?.() }}><span /></button>
      <button className="room-shelf room-interactive" type="button" aria-label="카드 선반" onClick={() => { reactTo('jump', '선반의 카드들이 반짝여!'); onOpenBoard?.() }}><i /><i /><i /></button>
      {decorationIds.map((id) => (
        <button type="button" className={`room-decoration decoration-${id}`} data-decoration-id={id} data-testid={`decoration-${id}`} key={id} aria-label={`${id} 장식`} onClick={() => reactTo('eat', id === 'small-plant' ? '화분이 오늘도 쑥쑥 자라!' : '장식이 반짝반짝 빛나!')} />
      ))}
      {reaction && <p className="companion-reaction" role="status">{reaction}</p>}
      {clickFeedback && <span className="companion-click-sparkle" data-testid="companion-click-sparkle" aria-label="click sparkle" role="status">✦</span>}
      <button className="companion-speech" type="button" onClick={onOpenCompanion}>{companionClass ? `${companionClass.name} · ${line}` : line}</button>
      <button type="button" className={`companion-character emotion-${emotion} activity-${activity}`} aria-label={`${EMOTION_LABELS[emotion]} ${displayName}`} onClick={reactToCharacter}>
        <span className="companion-ear left" aria-hidden="true" />
        <span className="companion-ear right" aria-hidden="true" />
        <span className="companion-face" aria-hidden="true"><i className="companion-eye left" /><i className="companion-eye right" /><i className="companion-mouth" /><i className="companion-cheek left" /><i className="companion-cheek right" /></span>
        <span className="companion-body" aria-hidden="true" />
        {accessoryId && <span className={`companion-accessory accessory-${accessoryId}`} aria-hidden="true" />}
        {characterId === 'daqong' && <i className="companion-sparkle-bit" aria-hidden="true">✦</i>}
      </button>
      <div className="room-floor" aria-hidden="true" />
      <div className="room-sparkles" aria-hidden="true"><i>✦</i><i>✦</i><i>✧</i></div>
    </section>
  )
}
