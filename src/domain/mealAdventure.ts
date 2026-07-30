import type { MealRecord } from './types'

type Entry = { meal: MealRecord }

export interface MealAdventureState {
  choice: { title: string; options: string[] }
  route: { id: string; label: string; stage: number; completed: boolean }
  mood: 'hungry' | 'energized' | 'bright'
  recipes: string[]
  roomReward: { title: string; remaining: number }
  chapter: { title: string; line: string }
  rewardChoices: string[]
  monthly: { breakfast: number; lunch: number; dinner: number; completeDays: number }
}

export function buildMealAdventure(entries: Entry[], now = Date.now()): MealAdventureState {
  const today = new Date(now)
  const dayKey = (value: number) => { const date = new Date(value); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` }
  const todayEntries = entries.filter(({ meal }) => dayKey(meal.recordedAt) === dayKey(now))
  const todayCount = todayEntries.length
  const mood = todayCount >= 3 ? 'bright' : todayCount >= 1 ? 'energized' : 'hungry'
  const route = todayCount >= 3
    ? { id: 'complete', label: '하루 완식 루트', stage: 3, completed: true }
    : todayCount === 2
      ? { id: 'evening', label: '하루 마무리 루트', stage: 2, completed: false }
      : todayCount === 1
        ? { id: 'lunch', label: '에너지 충전 루트', stage: 1, completed: false }
        : { id: 'breakfast', label: '하루 출발 루트', stage: 0, completed: false }
  const types = new Set(todayEntries.map(({ meal }) => meal.foodType))
  const recipes = [types.has('rice') && types.has('side') ? '든든한 집밥' : '', types.has('ramen') && types.has('side') ? '면 요새 세트' : '', types.has('bread') && types.has('fruit') ? '아침 탐험 세트' : ''].filter(Boolean)
  const totalMeals = entries.length
  const rewardSteps = [3, 7, 14, 30, 100]
  const nextReward = rewardSteps.find((step) => step > totalMeals) ?? 100
  const chapters = ['푸디의 첫 식탁', '사라진 점심 도시', '야식 몬스터의 습격', '완식 축제']
  const chapterIndex = Math.min(Math.floor(totalMeals / 7), chapters.length - 1)
  const monthlyEntries = entries.filter(({ meal }) => { const date = new Date(meal.recordedAt); return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() })
  const completeDays = new Set(monthlyEntries.map(({ meal }) => dayKey(meal.recordedAt))).size
  return {
    choice: { title: todayCount ? '오늘 식사 루트를 골라보세요' : '첫 끼를 기록하고 모험을 시작해요', options: ['집밥 마을', '빠른 한 끼', '새로운 음식'] },
    route,
    mood,
    recipes,
    roomReward: { title: nextReward >= 100 ? '전용 방 테마' : '방 꾸미기 장식', remaining: Math.max(0, nextReward - totalMeals) },
    chapter: { title: chapters[chapterIndex], line: `${chapterIndex + 1}장 진행 중 · 다음 장까지 ${Math.max(0, (chapterIndex + 1) * 7 - totalMeals)}끼` },
    rewardChoices: ['XP 보너스', '방 장식', '내일 보호권'],
    monthly: { breakfast: monthlyEntries.filter(({ meal }) => meal.foodType === 'bread').length, lunch: monthlyEntries.filter(({ meal }) => ['rice', 'ramen', 'pasta'].includes(meal.foodType)).length, dinner: monthlyEntries.filter(({ meal }) => ['side', 'sushi', 'dumpling'].includes(meal.foodType)).length, completeDays },
  }
}
