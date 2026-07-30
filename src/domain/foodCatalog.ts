import type { FoodTag, FoodType, MealRecord } from './types'

export type FoodFlavor = 'warm' | 'spicy' | 'cool' | 'sweet' | 'fresh' | 'savory' | 'neutral'
export type MealPeriod = 'morning' | 'lunch' | 'dinner' | 'snack'

export interface FoodDefinition {
  id: string
  name: string
  aliases: readonly string[]
  foodType: FoodType
  flavor: FoodFlavor
  periods: readonly MealPeriod[]
  tags: readonly FoodTag[]
}

type FoodRow = readonly [id: string, name: string, aliases?: readonly string[]]

function defineFoods(
  foodType: FoodType,
  flavor: FoodFlavor,
  periods: readonly MealPeriod[],
  rows: readonly FoodRow[],
): FoodDefinition[] {
  return rows.map(([id, name, aliases = []]) => ({
    id, name, aliases, foodType, flavor, periods, tags: tagsForFood(foodType, id),
  }))
}

const BASE_TAGS: Record<FoodType, readonly FoodTag[]> = {
  ramen: ['meal', 'noodle'], rice: ['meal'], fruit: ['fruit', 'healthy'], bread: ['bakery'],
  side: ['meal'], snack: ['snack', 'convenience'], drink: ['drink'], dumpling: ['meal'],
  sushi: ['meal', 'healthy'], pasta: ['meal', 'noodle'], other: ['meal'],
}

function tagsForFood(foodType: FoodType, id: string): readonly FoodTag[] {
  const special: Record<string, readonly FoodTag[]> = {
    'milk-caramel': ['snack', 'candy', 'dairy', 'convenience'], coffee: ['drink', 'coffee', 'convenience'],
    cola: ['drink', 'soda', 'convenience'], 'grape-juice': ['drink', 'juice'], chips: ['snack', 'convenience'],
    cookie: ['snack', 'dessert'], chocolate: ['snack', 'chocolate', 'dessert'], 'ice-cream': ['snack', 'dessert', 'dairy'],
  }
  return special[id] ?? BASE_TAGS[foodType]
}

export const FOOD_CATALOG: readonly FoodDefinition[] = [
  ...defineFoods('rice', 'savory', ['morning', 'lunch', 'dinner'], [
    ['plain-rice', '밥'], ['kimchi-fried-rice', '김치볶음밥', ['김치 볶음밥']],
    ['fried-rice', '볶음밥'], ['bibimbap', '비빔밥'], ['curry-rice', '카레라이스', ['카레밥']],
    ['omelet-rice', '오므라이스'], ['rice-ball', '주먹밥'], ['gimbap', '김밥'],
    ['sushi-roll', '롤'], ['porridge', '죽'], ['beef-rice', '소고기덮밥'], ['chicken-rice', '치킨마요덮밥'],
  ]),
  ...defineFoods('ramen', 'warm', ['lunch', 'dinner', 'snack'], [
    ['ramen', '라면'], ['udon', '우동'], ['jajangmyeon', '자장면', ['짜장면']],
    ['jjamppong', '짬뽕'], ['kalguksu', '칼국수'], ['sujebi', '수제비'],
    ['naengmyeon', '냉면'], ['rice-noodle', '쌀국수'], ['bibim-noodle', '비빔국수'],
    ['ramyeon-rice-cake', '라볶이'], ['buckwheat-noodle', '메밀국수'],
  ]),
  ...defineFoods('side', 'savory', ['morning', 'lunch', 'dinner'], [
    ['egg-roll', '계란말이'], ['fried-egg', '계란프라이'], ['tofu', '두부'],
    ['kimchi', '김치'], ['bulgogi', '불고기'], ['galbi', '갈비'],
    ['pork-cutlet', '돈가스', ['돈까스']], ['fried-chicken', '치킨'], ['sausage', '소시지'],
    ['fish-cake', '어묵'], ['seaweed-soup', '미역국'], ['soybean-soup', '된장국'],
  ]),
  ...defineFoods('fruit', 'fresh', ['morning', 'snack'], [
    ['apple', '사과'], ['banana', '바나나'], ['strawberry', '딸기'], ['watermelon', '수박'],
    ['grape', '포도'], ['orange', '오렌지'], ['tangerine', '귤'], ['peach', '복숭아'],
    ['pear', '배'], ['kiwi', '키위'], ['pineapple', '파인애플'], ['blueberry', '블루베리'],
  ]),
  ...defineFoods('bread', 'sweet', ['morning', 'snack'], [
    ['toast', '토스트'], ['sandwich', '샌드위치'], ['croissant', '크루아상'],
    ['bagel', '베이글'], ['cream-bread', '크림빵'], ['redbean-bread', '단팥빵'],
    ['pizza', '피자'], ['hamburger', '햄버거'], ['hotdog', '핫도그'],
    ['pancake', '팬케이크'], ['waffle', '와플'],
  ]),
  ...defineFoods('snack', 'sweet', ['snack'], [
    ['tteokbokki', '떡볶이'], ['rice-cake', '떡'], ['cookie', '쿠키'], ['chocolate', '초콜릿'],
    ['ice-cream', '아이스크림'], ['cake', '케이크'], ['yogurt', '요거트'],
    ['cereal', '시리얼'], ['chips', '감자칩'], ['popcorn', '팝콘'], ['jelly', '젤리'],
    ['milk-caramel', '밀크카라멜', ['카라멜', '밀크 캐러멜']], ['pepero', '빼빼로', ['초코과자']],
    ['potato-snack', '감자스낵', ['감자칩']], ['mint-candy', '민트캔디', ['민트사탕']],
  ]),
  ...defineFoods('drink', 'cool', ['morning', 'lunch', 'dinner', 'snack'], [
    ['water', '물'], ['milk', '우유'], ['soy-milk', '두유'], ['orange-juice', '오렌지주스'],
    ['apple-juice', '사과주스'], ['grape-juice', '포도주스', ['포도 주스']], ['smoothie', '스무디'], ['cocoa', '코코아'],
    ['coffee', '커피', ['아메리카노', '라떼']], ['cola', '콜라', ['탄산음료']],
    ['tea', '차'], ['lemonade', '레모네이드'], ['sparkling-water', '탄산수'],
  ]),
  ...defineFoods('dumpling', 'warm', ['lunch', 'dinner', 'snack'], [
    ['steamed-dumpling', '찐만두'], ['fried-dumpling', '군만두'], ['kimchi-dumpling', '김치만두'],
    ['meat-dumpling', '고기만두'], ['dumpling-soup', '만둣국'], ['water-dumpling', '물만두'],
    ['shrimp-dumpling', '새우만두'], ['xiao-long-bao', '샤오롱바오'],
  ]),
  ...defineFoods('sushi', 'fresh', ['lunch', 'dinner'], [
    ['salmon-sushi', '연어초밥'], ['shrimp-sushi', '새우초밥'], ['egg-sushi', '계란초밥'],
    ['tuna-sushi', '참치초밥'], ['eel-sushi', '장어초밥'], ['inari-sushi', '유부초밥'],
    ['sashimi', '회'], ['sushi-set', '모둠초밥'],
  ]),
  ...defineFoods('pasta', 'savory', ['lunch', 'dinner'], [
    ['tomato-pasta', '토마토파스타'], ['cream-pasta', '크림파스타'], ['oil-pasta', '오일파스타'],
    ['rose-pasta', '로제파스타'], ['lasagna', '라자냐'], ['mac-and-cheese', '맥앤치즈'],
    ['gnocchi', '뇨키'], ['spaghetti', '스파게티'],
  ]),
  ...defineFoods('other', 'neutral', ['morning', 'lunch', 'dinner', 'snack'], [
    ['salad', '샐러드'], ['steak', '스테이크'], ['taco', '타코'], ['burrito', '부리토'],
    ['spring-roll', '월남쌈'], ['omelet', '오믈렛'], ['soup', '수프'], ['cheese', '치즈'],
  ]),
] as const

function normalize(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')
}

function mealPeriodFor(now: number): MealPeriod {
  const hour = new Date(now).getHours()
  if (hour < 10) return 'morning'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

export function searchFoods(query: string): FoodDefinition[] {
  const normalized = normalize(query)
  if (!normalized) return []
  return FOOD_CATALOG.filter((food) =>
    [food.name, ...food.aliases].some((candidate) => normalize(candidate).includes(normalized)),
  ).slice(0, 12)
}

export function tagsForMeal(foodName: string, foodType: FoodType): readonly FoodTag[] {
  const normalized = normalize(foodName)
  if (!normalized) return BASE_TAGS[foodType]
  const match = FOOD_CATALOG.find((food) =>
    [food.name, ...food.aliases].some((candidate) => normalize(candidate) === normalized),
  )
  return match?.tags ?? BASE_TAGS[foodType]
}

export function suggestFoods({
  now,
  entries,
  query,
}: {
  now: number
  entries: readonly MealRecord[]
  query: string
}): FoodDefinition[] {
  if (query.trim()) return searchFoods(query)

  const period = mealPeriodFor(now)
  const stats = new Map<string, { count: number; periodCount: number; lastAt: number }>()
  entries.forEach((meal) => {
    const key = normalize(meal.foodName)
    const current = stats.get(key) ?? { count: 0, periodCount: 0, lastAt: 0 }
    current.count += 1
    current.periodCount += mealPeriodFor(meal.recordedAt) === period ? 1 : 0
    current.lastAt = Math.max(current.lastAt, meal.recordedAt)
    stats.set(key, current)
  })

  return [...FOOD_CATALOG]
    .map((food, index) => {
      const usage = stats.get(normalize(food.name))
      const recency = usage ? Math.max(0, 10 - Math.floor((now - usage.lastAt) / 86_400_000)) : 0
      const score = recency * 100
        + (usage?.periodCount ?? 0) * 20
        + (usage?.count ?? 0) * 5
        + (food.periods.includes(period) ? 3 : 0)
      return { food, score, index }
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 8)
    .map(({ food }) => food)
}
