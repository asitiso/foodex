import type { FoodType, MealRecord } from './types'
import { FOOD_MUSEUM_ROOMS, FOOD_VILLAGES } from './v6WorldContent'
import type { FoodVillage } from './v6WorldContent'

type Entry = { meal: MealRecord }

export interface WorldRelationship {
  kind: 'neighbors' | 'today-friends' | 'adventure-buddies'
  label: string
  members: string[]
}

export interface WorldProgress {
  villages: Array<FoodVillage & { discovered: boolean; residentNames: string[] }>
  museumRooms: Array<{ id: string; name: string; curator: string; discovered: number; total: number; completed: boolean }>
  relationships: WorldRelationship[]
  residentCount: number
  activeEvent: string
  nextGoal: string
}

const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0)

export function buildWorldProgress(entries: Entry[], now = Date.now()): WorldProgress {
  const foodTypes = new Set(entries.map(({ meal }) => meal.foodType))
  const residentNames = new Set<string>()
  const villages = FOOD_VILLAGES.map((village) => {
    const residents = village.foodTypes.filter((foodType) => foodTypes.has(foodType)).map((foodType) => village.residentByFood[foodType]).filter((name): name is string => Boolean(name))
    residents.forEach((name) => residentNames.add(name))
    return { ...village, discovered: residents.length > 0, residentNames: residents }
  })
  const museumRooms = FOOD_MUSEUM_ROOMS.map((room) => {
    const discovered = room.foodTypes.filter((foodType) => foodTypes.has(foodType)).length
    return { id: room.id, name: room.name, curator: room.curator, discovered, total: room.foodTypes.length, completed: discovered === room.foodTypes.length }
  })
  const relationships: WorldRelationship[] = []
  const discoveredNames = villages.flatMap((village) => village.residentNames)
  villages.filter((village) => village.residentNames.length > 1).forEach((village) => relationships.push({ kind: 'neighbors', label: `${village.name} 이웃`, members: village.residentNames }))
  const todayNames = villages.flatMap((village) => {
    const typesToday = new Set(entries.filter(({ meal }) => startOfDay(meal.recordedAt) === startOfDay(now)).map(({ meal }) => meal.foodType))
    return village.foodTypes.filter((type) => typesToday.has(type)).map((type) => village.residentByFood[type]).filter((name): name is string => Boolean(name))
  })
  if (todayNames.length > 1) relationships.push({ kind: 'today-friends', label: '오늘의 친구', members: [...new Set(todayNames)] })
  if (discoveredNames.length >= 2) relationships.push({ kind: 'adventure-buddies', label: '모험 동료', members: discoveredNames.slice(0, 2) })
  const nextVillage = villages.find((village) => !village.discovered)
  return {
    villages, museumRooms, relationships, residentCount: residentNames.size,
    activeEvent: entries.length === 0 ? '첫 음식 친구를 초대해보세요' : '오늘은 주민들이 광장에서 기다리고 있어요',
    nextGoal: nextVillage ? `${nextVillage.name}에 첫 주민 초대하기` : '모든 마을의 주민들과 인사하기',
  }
}

export type { FoodType }
