export type AppTab = 'home' | 'collection' | 'record' | 'adventure' | 'companion'

interface BottomNavProps {
  active: AppTab
  onNavigate: (tab: AppTab) => void
}

const navItems: Array<{ tab: AppTab; label: string; icon: string; primary?: boolean }> = [
  { tab: 'home', label: '홈', icon: '⌂' },
  { tab: 'collection', label: '도감', icon: '▦' },
  { tab: 'record', label: '촬영', icon: '📷', primary: true },
  { tab: 'adventure', label: '모험', icon: '✦' },
  { tab: 'companion', label: '버디', icon: '●' },
]

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {navItems.map((item) => (
        <button
          className={[
            active === item.tab ? 'active' : '',
            item.primary ? 'primary' : '',
          ].filter(Boolean).join(' ') || undefined}
          type="button"
          key={item.tab}
          aria-current={active === item.tab ? 'page' : undefined}
          onClick={() => onNavigate(item.tab)}
        >
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
