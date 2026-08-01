import type { FoodCard, FoodType, MealRecord } from './types'
import { FOOD_VILLAGES } from './v6WorldContent'

type Entry = { card: FoodCard; meal: MealRecord }

export interface ExpeditionStep { id: string; title: string; completed: boolean }
export interface Expedition { title: string; target: FoodType; steps: ExpeditionStep[]; nextAction: string }
export interface CombinationMission { id: string; title: string; foodTypes: readonly FoodType[]; completed: boolean; reward: string }
export interface ResidentBond { residentName: string; foodType: FoodType; level: number; nextCount?: number; title: string }
export interface Party { members: string[]; bonus: string }
export interface WeeklyEvent { id: string; title: string; description: string; target: FoodType; progress: number; total: number; reward: string }
export interface RelationshipEpisode { id: string; title: string; text: string; unlocked: boolean }
export interface GameLoopProgress { expedition: Expedition; combinationMissions: CombinationMission[]; bonds: ResidentBond[]; party: Party; weeklyEvent: WeeklyEvent; episodes: RelationshipEpisode[] }

const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0)
const countByFood = (entries: Entry[]) => entries.reduce((map, { meal }) => map.set(meal.foodType, (map.get(meal.foodType) ?? 0) + 1), new Map<FoodType, number>())

const residentFor = (foodType: FoodType) => FOOD_VILLAGES.find((village) => village.foodTypes.includes(foodType))?.residentByFood[foodType] ?? 'Flavor Traveler'

function buildExpedition(entries: Entry[], counts: Map<FoodType, number>, now: number): Expedition {
  const target = FOOD_VILLAGES.flatMap((village) => village.foodTypes).find((foodType) => !counts.has(foodType)) ?? 'ramen'
  const today = startOfDay(now)
  const todayCount = entries.filter(({ meal }) => startOfDay(meal.recordedAt) === today).length
  const targetCount = counts.get(target) ?? 0
  const steps = [
    { id: 'prepare', title: '원정 목표 확인하기', completed: true },
    { id: 'record', title: `${target} 음식 기록하기`, completed: targetCount > 0 },
    { id: 'return', title: '주민에게 원정 결과 전하기', completed: targetCount > 0 && todayCount > 0 },
  ]
  const next = steps.find((step) => !step.completed)
  return { title: `${residentFor(target)}의 오늘의 원정`, target, steps, nextAction: next?.title ?? '오늘의 원정을 완료했어요' }
}

export function buildGameLoop(entries: Entry[], now = Date.now()): GameLoopProgress {
  const counts = countByFood(entries)
  const expedition = buildExpedition(entries, counts, now)
  const combinationMissions: CombinationMission[] = [
    { id: 'noodle-feast', title: '면 요리 마을의 잔치', foodTypes: ['ramen', 'dumpling'], completed: counts.has('ramen') && counts.has('dumpling'), reward: '면 요리 마을 장식' },
    { id: 'sunny-picnic', title: '햇살 피크닉', foodTypes: ['fruit', 'drink'], completed: counts.has('fruit') && counts.has('drink'), reward: '햇살 피크닉 배경' },
    { id: 'home-table', title: '든든한 집밥', foodTypes: ['rice', 'side'], completed: counts.has('rice') && counts.has('side'), reward: '밥상 전시 스탬프' },
  ]
  const bonds = [...counts.entries()].map(([foodType, count]) => {
    const level = count >= 7 ? 3 : count >= 3 ? 2 : 1
    return { residentName: residentFor(foodType), foodType, level, ...(level < 3 ? { nextCount: level === 1 ? 3 : 7 } : {}), title: level === 3 ? '절친 주민' : level === 2 ? '친한 주민' : '새 주민' }
  }).sort((a, b) => b.level - a.level || a.residentName.localeCompare(b.residentName))
  const members = bonds.slice(0, 3).map((bond) => bond.residentName)
  const target: FoodType = (['fruit', 'ramen', 'rice', 'sushi'] as FoodType[])[Math.floor(new Date(now).getDate() / 8) % 4]
  const weeklyEvent: WeeklyEvent = { id: `week-${new Date(now).getFullYear()}-${Math.ceil((new Date(now).getDate() + new Date(now).getDay()) / 7)}`, title: `${residentFor(target)}의 주간 축제`, description: `${target} 음식을 기록하고 축제 스탬프를 모아보세요`, target, progress: counts.get(target) ?? 0, total: 3, reward: '축제 카드 테두리' }
  const episodes: RelationshipEpisode[] = members.length >= 2 ? [{ id: 'first-table', title: '첫 식탁의 만남', text: `${members[0]}와 ${members[1]}가 같은 식탁에서 인사를 나눴어요.`, unlocked: true }] : []
  return { expedition, combinationMissions, bonds, party: { members, bonus: members.length > 0 ? `${members[0]}의 음식 기록 보너스` : '주민을 만나면 파티 보너스가 열려요' }, weeklyEvent, episodes }
}
