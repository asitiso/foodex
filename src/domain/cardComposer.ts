import type { FoodDefinition, FoodFlavor } from './foodCatalog'
import type { Rarity } from './types'

const RARE_PREFIXES: Record<FoodFlavor, readonly string[]> = {
  warm: ['포근한', '온기의', '김 모락'],
  spicy: ['불꽃', '붉은', '매콤'],
  cool: ['서리', '푸른', '찰랑'],
  sweet: ['별사탕', '달빛', '폭신'],
  fresh: ['햇살', '초록', '상큼'],
  savory: ['황금', '든든', '고소한'],
  neutral: ['신비한', '반짝', '새로운'],
}

const EPIC_PREFIXES: Record<FoodFlavor, readonly string[]> = {
  warm: ['태양의', '용광로의', '불멸의 온기'],
  spicy: ['화염의', '홍련의', '불꽃 폭풍'],
  cool: ['빙하의', '푸른 파도의', '서리 왕국'],
  sweet: ['별빛의', '꿈구름의', '달콤 왕국'],
  fresh: ['새벽숲의', '초록 바람의', '햇살 정령'],
  savory: ['황금 식탁의', '대지의', '든든 수호대'],
  neutral: ['미지의', '차원 너머', '신비 왕국'],
}

const QUOTES: Record<FoodFlavor, readonly string[]> = {
  warm: ['포근한 기운이 모험을 데워 줘.', '따뜻한 힘이 방 안에 피어났어.'],
  spicy: ['매콤한 불꽃이 도감을 밝혔어.', '화끈한 한입이 용기를 깨웠어.'],
  cool: ['시원한 물결이 기분 좋게 반짝여.', '맑은 기운이 모험길을 열었어.'],
  sweet: ['달콤한 별빛이 살며시 내려앉았어.', '폭신한 행복이 카드에 담겼어.'],
  fresh: ['상큼한 햇살이 오늘을 밝혔어.', '싱그러운 바람이 도감을 넘겼어.'],
  savory: ['든든한 힘이 모험 가방을 채웠어.', '고소한 용기가 한 칸 자랐어.'],
  neutral: ['새로운 한입이 작은 이야기를 열었어.', '신기한 발견이 카드로 깨어났어.'],
}

export function hash(value: string) {
  return [...value].reduce((result, character) =>
    Math.imul(result ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261)
}

function pick<T>(items: readonly T[], seed: string) {
  return items[hash(seed) % items.length]
}

/** Deterministically rolls a 1-99 stat value from a seed string. */
export function rollStat(seed: string): number {
  return (hash(seed) % 99) + 1
}

export function composeCardCopy({
  food,
  rarity,
  seed,
}: {
  food: FoodDefinition
  rarity: Rarity
  seed: string
}): { name: string; quote: string } {
  if (rarity === 'legendary') {
    return {
      name: `천공을 가르는 ${food.name}왕`,
      quote: `${food.name}의 전설이 오늘의 도감에 내려왔어!`,
    }
  }

  const name = rarity === 'epic'
    ? `${pick(EPIC_PREFIXES[food.flavor], `${seed}:epic`)} ${food.name}`
    : rarity === 'rare'
      ? `${pick(RARE_PREFIXES[food.flavor], `${seed}:rare`)} ${food.name}`
      : `반가운 ${food.name}`

  return {
    name,
    quote: pick(QUOTES[food.flavor], `${seed}:quote`),
  }
}
