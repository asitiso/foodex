import { useMemo, useState } from 'react'

type Food = 'ramen' | 'rice' | 'fruit' | 'bread' | 'snack' | 'drink'
type Amount = 'taste' | 'half' | 'full'
type Tab = 'home' | 'record' | 'collection'

interface Card {
  id: string
  food: Food
  amount: Amount
  rarity: 'Common' | 'Rare' | 'Epic'
  createdAt: number
}

const foods: Record<Food, { label: string; icon: string; name: string }> = {
  ramen: { label: '라면', icon: '🍜', name: '불꽃 라면' },
  rice: { label: '밥', icon: '🍚', name: '든든한 밥상' },
  fruit: { label: '과일', icon: '🍎', name: '반짝 과일' },
  bread: { label: '빵', icon: '🥐', name: '고소한 빵' },
  snack: { label: '간식', icon: '🍪', name: '달콤 간식' },
  drink: { label: '음료', icon: '🧃', name: '상큼 음료' },
}

const amounts: Record<Amount, string> = {
  taste: '맛보기',
  half: '절반',
  full: '거의 다',
}

function loadCards(): Card[] {
  try {
    return JSON.parse(localStorage.getItem('foodex-cards') || '[]')
  } catch {
    return []
  }
}

function saveCards(cards: Card[]) {
  localStorage.setItem('foodex-cards', JSON.stringify(cards))
}

export function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [cards, setCards] = useState<Card[]>(loadCards)
  const [photo, setPhoto] = useState<string | null>(null)
  const [food, setFood] = useState<Food>('ramen')
  const [amount, setAmount] = useState<Amount>('taste')

  const todayCount = useMemo(() => {
    const start = new Date().setHours(0, 0, 0, 0)
    return cards.filter((card) => card.createdAt >= start).length
  }, [cards])

  const addCard = () => {
    const seen = new Set(cards.map((card) => card.food))
    const next: Card = {
      id: crypto.randomUUID(),
      food,
      amount,
      rarity: cards.length === 0 ? 'Epic' : seen.has(food) ? 'Common' : 'Rare',
      createdAt: Date.now(),
    }
    const nextCards = [next, ...cards]
    setCards(nextCards)
    saveCards(nextCards)
    setPhoto(null)
    setTab('collection')
  }

  return (
    <main className="shell">
      {tab === 'home' && (
        <section className="screen home">
          <p className="eyebrow">Foodex</p>
          <h1>오늘 식사를 카드로 수집해요</h1>
          <div className="hero-card">
            <span>오늘 획득한 카드</span>
            <strong>{todayCount}장</strong>
            <small>도감 완성률 {Math.round((new Set(cards.map((card) => card.food)).size / Object.keys(foods).length) * 100)}%</small>
          </div>
          <div className="stats">
            <div><span>마지막 식사</span><strong>{cards[0] ? new Date(cards[0].createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '아직 없음'}</strong></div>
            <div><span>총 카드</span><strong>{cards.length}장</strong></div>
          </div>
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
            {Object.entries(amounts).map(([key, label]) => <button className={amount === key ? 'selected' : ''} key={key} onClick={() => setAmount(key as Amount)}>{label}</button>)}
          </div>
          <button className="primary" disabled={!photo} onClick={addCard}>카드 열기</button>
        </section>
      )}

      {tab === 'collection' && (
        <section className="screen collection">
          <p className="eyebrow">도감</p>
          <h1>내 식사 카드</h1>
          {cards.length === 0 ? <p className="empty">첫 식사 카드를 만나러 가볼까요?</p> : <div className="cards">{cards.map((card) => <article className="card" key={card.id}><span>{foods[card.food].icon}</span><small>{card.rarity}</small><strong>{foods[card.food].name}</strong><em>{amounts[card.amount]}</em></article>)}</div>}
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
