import type { CompanionCharacterId } from './companionCharacters'
import type { MealRecord } from './types'

export interface CompanionEvolution {
  characterId: CompanionCharacterId
  stage: 1 | 2 | 3 | 4
  title: string
  formName: string
  nextAt?: number
  remaining: number
  progress: number
}

const FORMS: Record<CompanionCharacterId, readonly string[]> = {
  foody: ['작은 푸디', '든든한 푸디', '밥의 수호자', '완식 마스터'],
  berry: ['작은 베리', '상큼한 베리', '숲의 탐험가', '생명의 정원사'],
  noodle: ['작은 누들', '용감한 누들', '면 요리 기사', '국물의 전설'],
  cocoa: ['작은 코코아', '달콤한 코코아', '간식 연금술사', '축제의 파티셰'],
}
const THRESHOLDS: readonly number[] = [0, 3, 7, 14]

export function buildCompanionEvolution(characterId: CompanionCharacterId, entries: Array<{ meal: MealRecord }>): CompanionEvolution {
  const count = entries.length
  const stage = (count >= 14 ? 4 : count >= 7 ? 3 : count >= 3 ? 2 : 1) as 1 | 2 | 3 | 4
  const nextAt = stage === 4 ? 14 : THRESHOLDS[stage]
  const previousAt = THRESHOLDS[stage - 1]
  return {
    characterId,
    stage,
    title: stage === 4 ? '최종 변신 완료' : `${nextAt - count}끼를 더 먹으면 변신해요`,
    formName: FORMS[characterId][stage - 1],
    nextAt: stage === 4 ? undefined : nextAt,
    remaining: Math.max(0, nextAt - count),
    progress: stage === 4 ? 100 : Math.min(100, Math.round(((count - previousAt) / (nextAt - previousAt)) * 100)),
  }
}
