type AppTab = 'home' | 'record' | 'collection' | 'play'

interface BottomNavProps {
  active: AppTab
  onNavigate: (tab: AppTab) => void
}

const navItems: Array<{ tab: AppTab; label: string; icon: string }> = [
  { tab: 'home', label: '홈', icon: '⌂' },
  { tab: 'record', label: '기록', icon: '＋' },
  { tab: 'collection', label: '도감', icon: '▦' },
  { tab: 'play', label: '놀이', icon: '✦' },
]

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {navItems.map((item) => (
        <button
          className={active === item.tab ? 'active' : undefined}
          type="button"
          key={item.tab}
          aria-current={active === item.tab ? 'page' : undefined}
          onClick={() => onNavigate(item.tab)}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
