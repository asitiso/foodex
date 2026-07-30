import type { CompanionEventId } from './companionTypes'
import type { FoodFlavor } from './foodCatalog'

export interface DialoguePart {
  id: string
  text: string
}

const DEFAULT_OPENINGS: readonly DialoguePart[] = [
  { id: 'today-find', text: '오늘의 발견이네!' },
  { id: 'nice-meet', text: '반가운 한입이야!' },
  { id: 'adventure-start', text: '맛있는 모험 출발!' },
]

export const EVENT_OPENINGS: Partial<Record<CompanionEventId, readonly DialoguePart[]>> = {
  'legendary-card': [
    { id: 'legend-arrives', text: '전설이 나타났어!' },
    { id: 'sky-sparkles', text: '하늘까지 반짝여!' },
    { id: 'great-moment', text: '굉장한 순간이야!' },
  ],
  'set-complete': [
    { id: 'set-finished', text: '한 세트를 완성했어!' },
    { id: 'collection-shines', text: '도감이 환하게 빛나!' },
    { id: 'friends-together', text: '음식 친구들이 모였어!' },
  ],
  'first-discovery': [
    { id: 'first-find', text: '처음 만난 친구야!' },
    { id: 'new-page', text: '새 도감 페이지 발견!' },
    { id: 'welcome-new', text: '새 친구를 환영해!' },
  ],
  'welcome-back': [
    { id: 'new-start', text: '오늘부터 새 모험이야!' },
    { id: 'glad-together', text: '다시 함께해서 신나!' },
    { id: 'door-open', text: '모험의 문이 열렸어!' },
  ],
}

export const FLAVOR_MODIFIERS: Record<FoodFlavor, readonly DialoguePart[]> = {
  warm: [
    { id: 'warm-bowl', text: '따뜻한 한 그릇이' },
    { id: 'cozy-bite', text: '포근한 한입이' },
    { id: 'steam-power', text: '김 모락 힘이' },
  ],
  spicy: [
    { id: 'spicy-spark', text: '매콤한 불꽃이' },
    { id: 'red-power', text: '붉은 한입이' },
    { id: 'hot-adventure', text: '화끈한 모험이' },
  ],
  cool: [
    { id: 'cool-wave', text: '시원한 물결이' },
    { id: 'clear-drop', text: '맑은 한 모금이' },
    { id: 'fresh-breeze', text: '산뜻한 바람이' },
  ],
  sweet: [
    { id: 'sweet-star', text: '달콤한 별빛이' },
    { id: 'soft-cloud', text: '폭신한 구름이' },
    { id: 'happy-sugar', text: '즐거운 한입이' },
  ],
  fresh: [
    { id: 'fresh-light', text: '상큼한 햇살이' },
    { id: 'green-energy', text: '싱그러운 힘이' },
    { id: 'fruit-breeze', text: '과일 바람이' },
  ],
  savory: [
    { id: 'savory-power', text: '든든한 힘이' },
    { id: 'table-hero', text: '식탁의 영웅이' },
    { id: 'full-bite', text: '고소한 한입이' },
  ],
  neutral: [
    { id: 'curious-bite', text: '신기한 한입이' },
    { id: 'new-energy', text: '새로운 힘이' },
    { id: 'little-find', text: '작은 발견이' },
  ],
}

const DEFAULT_ENDINGS: readonly DialoguePart[] = [
  { id: 'dex-light', text: '도감에 빛을 켰어!' },
  { id: 'room-energy', text: '우리 방에 힘을 채웠어!' },
  { id: 'card-awake', text: '카드 친구를 깨웠어!' },
]

export const EVENT_ENDINGS: Partial<Record<CompanionEventId, readonly DialoguePart[]>> = {
  'legendary-card': [
    { id: 'legend-book', text: '전설의 페이지를 열었어!' },
    { id: 'legend-room', text: '우리 방을 별빛으로 채웠어!' },
    { id: 'legend-friend', text: '최고의 카드 친구를 불렀어!' },
  ],
  'quest-complete': [
    { id: 'quest-clear', text: '오늘의 도전을 해냈어!' },
    { id: 'quest-badge', text: '도전 배지를 반짝였어!' },
    { id: 'quest-step', text: '모험을 한 칸 전진시켰어!' },
  ],
  'welcome-back': [
    { id: 'start-together', text: '우리와 다시 출발해!' },
    { id: 'today-page', text: '오늘의 첫 장을 열어 줘!' },
    { id: 'easy-start', text: '가벼운 한 장부터 만나자!' },
  ],
}

export function dialoguePartsFor(eventId: CompanionEventId, flavor: FoodFlavor) {
  return {
    openings: EVENT_OPENINGS[eventId] ?? DEFAULT_OPENINGS,
    modifiers: FLAVOR_MODIFIERS[flavor],
    endings: EVENT_ENDINGS[eventId] ?? DEFAULT_ENDINGS,
  }
}

export function allDialogueText(): string[] {
  return [
    ...DEFAULT_OPENINGS,
    ...Object.values(EVENT_OPENINGS).flatMap((parts) => parts ?? []),
    ...Object.values(FLAVOR_MODIFIERS).flat(),
    ...DEFAULT_ENDINGS,
    ...Object.values(EVENT_ENDINGS).flatMap((parts) => parts ?? []),
  ].map((part) => part.text)
}
