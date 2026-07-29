import { useMemo, useState } from 'react'

type Food = 'ramen' | 'rice' | 'fruit' | 'bread' | 'side' | 'snack' | 'drink' | 'other'
type Amount = 'taste' | 'half' | 'almostAll'
type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
type Tab = 'home' | 'record' | 'collection'

interface Card {
  id: string
  food: Food
  amount: Amount
  rarity: Rarity
  xp: number
  isNew: boolean
  createdAt: number
}

const foods: Record<Food, { label: string; icon: string; name: string; category: string }> = {
  ramen: { label: '라면', icon: '🍜', name: '불꽃 라면', category: '면류' },
  rice: { label: '밥', icon: '🍚', name: '든든 밥방패', category: '밥류' },
  fruit: { label: '과일', icon: '🍎', name: '햇살 과일단', category: '과일' },
  bread: { label: '빵', icon: '🥐', name: '폭신 빵구름', category: '빵' },
  side: { label: '반찬', icon: '🥗', name: '든든 반찬대', category: '한식' },
  snack: { label: '간식', icon: '🍪', name: '반짝 간식별', category: '디저트' },
  drink: { label: '음료', icon: '🧃', name: '찰랑 음료물결', category: '음료' },
  other: { label: '기타', icon: '✨', name: '새로운 발견대', category: '기타' },
}

const amounts: Record<Amount, { label: string; xp: number }> = {
  taste: { label: '맛보기', xp: 10 },
  half: { label: '절반', xp: 20 },
  almostAll: { label: '거의 다', xp: 30 },
}

const rarityLabels: Record<Rarity, string> = {
  common: '일반',
  rare: '희귀',
  epic: '에픽',
  legendary: '전설',
}

function startOfDay(time: number) {
  return new Date(time).setHours(0, 0, 0, 0)
}

function loadCards(): Card[] {
  try {
    return JSON.parse(localStorage.getItem('foodex-v2-cards') || localStorage.getItem('foodex-cards') || '[]')
  } catch {
    return []
  }
}

function saveCards(cards: Card[]) {
  localStorage.setItem('foodex-v2-cards', JSON.stringify(cards))
}

function levelFor(totalXp: number) {
  const thresholds = [0, 30, 60, 100, 150, 210, 280, 360]
  const nextIndex = thresholds.findIndex((threshold) => threshold > totalXp)
  const level = nextIndex === -1 ? thresholds.length : nextIndex
  const current = thresholds[level - 1] ?? 0
  const next = thresholds[level] ?? current + 100
  return { level, currentXp: totalXp - current, nextXp: next - current, remaining: next - totalXp }
}

function cardRarity(food: Food, cards: Card[]): Rarity {
  const seenFoods = new Set(cards.map((card) => card.food))
  const seenCategories = new Set(cards.map((card) => foods[card.food].category))
  if (seenFoods.has(food)) return 'common'
  if (seenCategories.has(foods[food].category)) return 'rare'
  return 'epic'
}

function evolve(food: Food, cards: Card[]) {
  const count = cards.filter((card) => card.food === food).length
  const stage = count >= 15 ? 4 : count >= 7 ? 3 : count >= 3 ? 2 : 1
  const base = foods[food].name
  return {
    count,
    stage,
    title: stage === 4 ? `${base} 마스터` : stage > 1 ? `${base} Lv.${stage}` : base,
    next: stage === 1 ? 3 : stage === 2 ? 7 : stage === 3 ? 15 : undefined,
  }
}

function currentStreak(cards: Card[]) {
  const days = new Set(cards.map((card) => startOfDay(card.createdAt)))
  const today = startOfDay(Date.now())
  let count = 0
  while (days.has(today - count * 86400000)) count += 1
  return count
}

export function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [cards, setCards] = useState<Card[]>(loadCards)
  const [photo, setPhoto] = useState<string | null>(null)
  const [food, setFood] = useState<Food>('ramen')
  const [amount, setAmount] = useState<Amount>('taste')

  const progress = useMemo(() => {
    const totalXp = cards.reduce((sum, card) => sum + (card.xp || amounts[card.amount].xp), 0)
    const discovered = new Set(cards.map((card) => card.food))
    const todayCards = cards.filter((card) => startOfDay(card.createdAt) === startOfDay(Date.now()))
    const dailyQuests = [
      { title: '식사 카드 1장', done: todayCards.length > 0 },
      { title: '새 음식 발견', done: todayCards.some((card) => card.isNew) },
      { title: '상큼 카드', done: todayCards.some((card) => card.food === 'fruit' || card.food === 'drink') },
    ]
    const seasonSteps = [
      discovered.has('fruit'),
      discovered.has('drink'),
      cards.filter((card) => card.food === 'rice' || card.food === 'ramen').length >= 2,
      currentStreak(cards) >= 5,
    ]
    const bonuses = [
      { title: '면 탐험가', done: cards.filter((card) => card.food === 'ramen').length >= 3 },
      { title: '과일 친구', done: cards.filter((card) => card.food === 'fruit').length >= 3 },
      { title: '도감 절반', done: discovered.size >= Math.ceil(Object.keys(foods).length / 2) },
    ]
    return {
      totalXp,
      level: levelFor(totalXp),
      discovered: discovered.size,
      completion: Math.round((discovered.size / Object.keys(foods).length) * 100),
      todayCount: todayCards.length,
      streak: currentStreak(cards),
      dailyQuests,
      boxAvailable: todayCards.length > 0 && dailyQuests.filter((quest) => quest.done).length >= 2,
      seasonDone: seasonSteps.filter(Boolean).length,
      seasonTotal: seasonSteps.length,
      bonuses,
    }
  }, [cards])

  const addCard = () => {
    const rarity = cardRarity(food, cards)
    const xp = amounts[amount].xp + (rarity === 'common' ? 0 : 10)
    const next: Card = {
      id: crypto.randomUUID(),
      food,
      amount,
      rarity,
      xp,
      isNew: rarity !== 'common',
      createdAt: Date.now(),
    }
    const nextCards = [next, ...cards]
    setCards(nextCards)
    saveCards(nextCards)
    setPhoto(null)
    setTab('collection')
  }

  const topEvolutions = Object.keys(foods).map((key) => ({ food: key as Food, ...evolve(key as Food, cards) })).filter((item) => item.count > 0).slice(0, 4)

  return (
    <main className="shell">
      {tab === 'home' && (
        <section className="screen home">
          <p className="eyebrow">Foodex V2</p>
          <h1>오늘 식사를 카드로 수집해요</h1>
          <div className="hero-card">
            <span>오늘 카드</span>
            <strong>오늘 카드 {progress.todayCount}장</strong>
            <small>도감 완성률 {progress.completion}%</small>
          </div>
          <div className="stats">
            <div><span>레벨</span><strong>레벨 {progress.level.level}</strong><small>다음 레벨까지 {progress.level.remaining} XP</small></div>
            <div><span>연속 기록</span><strong>연속 {progress.streak}일</strong><small>{progress.totalXp} XP</small></div>
          </div>
          <section className="panel">
            <div className="row"><h2>오늘 퀘스트</h2><strong>{progress.dailyQuests.filter((q) => q.done).length}/3</strong></div>
            {progress.dailyQuests.map((quest) => <p className={quest.done ? 'done' : ''} key={quest.title}>{quest.title}<span>{quest.done ? '완료' : '진행중'}</span></p>)}
          </section>
          <section className="panel season">
            <div className="row"><h2>여름 한입 시즌</h2><strong>{progress.seasonDone}/{progress.seasonTotal}</strong></div>
            <div className="bar"><span style={{ width: `${Math.round((progress.seasonDone / progress.seasonTotal) * 100)}%` }} /></div>
            <small>보상: 전설의 여름 식탁</small>
          </section>
          <section className={progress.boxAvailable ? 'box available' : 'box'}>
            <span>{progress.boxAvailable ? '열 수 있어요' : '퀘스트를 더 해봐요'}</span>
            <strong>오늘의 상자</strong>
            <small>XP 보너스 또는 시즌 조각</small>
          </section>
          <button className="primary" onClick={() => setTab('record')}>식사 카드 획득하기</button>
        </section>
      )}

      {tab === 'record' && (
        <section className="screen record">
          <p className="eyebrow">기록</p>
          <h1>사진 한 장과 선택 두 번이면 충분해요</h1>
          <label className="photo">
            <input aria-label="식사 사진 선택" type="file" accept="image/*" capture="environment" onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => setPhoto(String(reader.result))
              reader.readAsDataURL(file)
            }} />
            {photo ? <img src={photo} alt="선택한 식사" /> : <span>사진 선택</span>}
          </label>
          <div className="grid two">
            {Object.entries(foods).map(([key, item]) => <button className={food === key ? 'selected' : ''} key={key} onClick={() => setFood(key as Food)}>{item.icon} {item.label}</button>)}
          </div>
          <div className="grid three">
            {Object.entries(amounts).map(([key, item]) => <button className={amount === key ? 'selected' : ''} key={key} onClick={() => setAmount(key as Amount)}>{item.label}</button>)}
          </div>
          <button className="primary" disabled={!photo} onClick={addCard}>카드 열기</button>
        </section>
      )}

      {tab === 'collection' && (
        <section className="screen collection">
          <p className="eyebrow">도감</p>
          <h1>내 식사 카드</h1>
          <section className="panel"><div className="row"><h2>음식 진화</h2><strong>{topEvolutions.length}</strong></div>{topEvolutions.length === 0 ? <p>아직 진화할 카드가 없어요.</p> : topEvolutions.map((item) => <p className={item.stage > 1 ? 'done' : ''} key={item.food}>{item.title}<span>{item.count}회</span></p>)}</section>
          <section className="panel"><div className="row"><h2>컬렉션 보너스</h2><strong>{progress.bonuses.filter((bonus) => bonus.done).length}/3</strong></div>{progress.bonuses.map((bonus) => <p className={bonus.done ? 'done' : ''} key={bonus.title}>{bonus.title}<span>{bonus.done ? '완료' : '잠김'}</span></p>)}</section>
          {cards.length === 0 ? <p className="empty">첫 식사 카드를 만나러 가볼까요?</p> : <div className="cards">{cards.map((card) => <article className={`card ${card.rarity}`} key={card.id}><span>{foods[card.food].icon}</span><small>{rarityLabels[card.rarity]}</small><strong>{evolve(card.food, cards).title}</strong><em>{amounts[card.amount].label} · +{card.xp || amounts[card.amount].xp} XP</em></article>)}</div>}
        </section>
      )}

      <nav className="nav" aria-label="주요 메뉴">
        <button aria-current={tab === 'home' ? 'page' : undefined} onClick={() => setTab('home')}>홈</button>
        <button aria-current={tab === 'record' ? 'page' : undefined} onClick={() => setTab('record')}>기록</button>
        <button aria-current={tab === 'collection' ? 'page' : undefined} onClick={() => setTab('collection')}>도감</button>
      </nav>
    </main>
  )
}
