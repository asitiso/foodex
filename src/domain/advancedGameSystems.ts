import type { CompanionClassId } from './companionClasses'
import type { FoodType, MealRecord } from './types'
import { buildMealOutcome } from './mealOutcome'

type Entry = { meal: MealRecord }
export interface AdvancedGameSystems {
  skill: { name: string; effect: string; active: boolean }
  dungeon: { rooms: Array<{ id: string; name: string; cleared: boolean }>; cleared: number; bossCleared: boolean }
  event: { id: string; title: string; reward: string }
  transformation: { ready: boolean; message: string }
  recipes: string[]
  equipment: string[]
  boss: { name: string; hp: number; maxHp: number; defeated: boolean }
  npcs: string[]
}

export function buildAdvancedGameSystems(entries: Entry[], classId: CompanionClassId | undefined, evolutionStage: number): AdvancedGameSystems {
  const meals = entries.map(({ meal }) => meal)
  const types = new Set<FoodType>(meals.map((meal) => meal.foodType))
  const today = new Date().toDateString()
  const todayMeals = meals.filter((meal) => new Date(meal.recordedAt).toDateString() === today).length
  const skillMap: Record<CompanionClassId, { name: string; effect: string }> = {
    'hearty-guardian': { name: '든든한 방패', effect: '밥·반찬 XP +20%' },
    'forest-explorer': { name: '숲의 발견', effect: '과일 발견 보너스' },
    'balance-alchemist': { name: '균형 변환', effect: '조합 보상 +1' },
    'full-meal-knight': { name: '완식의 깃발', effect: '3끼 콤보 XP +50%' },
  }
  const skill = skillMap[classId ?? 'hearty-guardian']
  const rooms = ['아침 방', '점심 방', '저녁 방'].map((name, index) => ({ id: String(index), name, cleared: todayMeals > index }))
  const total = meals.length
  const bossMax = 100
  const todayRecords = meals.filter((meal) => new Date(meal.recordedAt).toDateString() === new Date().toDateString())
  const bossDamage = todayRecords.reduce((sum, meal, index) => sum + buildMealOutcome(meal, todayRecords.slice(0, index), classId).bossDamage, 0)
  const bossHp = Math.max(0, bossMax - Math.min(100, bossDamage))
  const recipes = [types.has('rice') && types.has('side') ? '든든한 집밥' : '', types.has('bread') && types.has('fruit') ? '아침 탐험 세트' : '', types.has('ramen') && types.has('side') ? '면 요새 세트' : ''].filter(Boolean)
  const equipment = [total >= 3 ? '푸디 앞치마' : '', total >= 7 ? '탐험 배낭' : '', total >= 14 ? '빛나는 왕관' : ''].filter(Boolean)
  const npcs = [types.has('rice') ? '쌀 마을 이장' : '', types.has('fruit') ? '숲의 요정' : '', types.has('ramen') ? '국물 장인' : '', types.has('bread') ? '빵집 셰프' : ''].filter(Boolean)
  return {
    skill: { ...skill, active: Boolean(classId) },
    dungeon: { rooms, cleared: rooms.filter((room) => room.cleared).length, bossCleared: rooms.every((room) => room.cleared) },
    event: total % 5 === 0 && total > 0 ? { id: 'golden-plate', title: '황금 식판 발견!', reward: '+20 XP 보너스' } : { id: 'food-spark', title: '음식 별가루가 반짝여요', reward: '다음 기록 XP +5' },
    transformation: { ready: evolutionStage >= 2, message: evolutionStage >= 2 ? '새로운 변신의 힘이 깨어났어요!' : '식사 3끼를 기록하면 변신해요.' },
    recipes,
    equipment,
    boss: { name: '야식 몬스터', hp: bossHp, maxHp: bossMax, defeated: bossHp === 0 },
    npcs,
  }
}
