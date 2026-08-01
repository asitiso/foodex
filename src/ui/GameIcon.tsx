import type { ReactNode } from 'react'

export type GameIconName =
  | 'home'
  | 'collection'
  | 'camera'
  | 'adventure'
  | 'buddy'
  | 'coin'
  | 'level'
  | 'meal'
  | 'cards'
  | 'room'
  | 'river'
  | 'wardrobe'
  | 'bookshelf'
  | 'growth'
  | 'report'
  | 'shop'
  | 'achievement'
  | 'quest'
  | 'news'

interface GameIconProps {
  name: GameIconName
  className?: string
  title?: string
}

const paths: Record<GameIconName, ReactNode> = {
  home: <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4Z" />,
  collection: <><rect x="4" y="5" width="7" height="14" rx="2" /><rect x="13" y="5" width="7" height="14" rx="2" /><path d="M7 9h1M7 13h1M16 9h1M16 13h1" /></>,
  camera: <><path d="M5 8h3l1.4-2h5.2L16 8h3a2 2 0 0 1 2 2v8H3v-8a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="3.2" /></>,
  adventure: <><path d="M5 19V7l5-2 4 2 5-2v12l-5 2-4-2-5 2Z" /><path d="M10 5v12M14 7v12" /><path d="m16.5 8 .7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2Z" /></>,
  buddy: <><circle cx="12" cy="12" r="7" /><circle cx="9.5" cy="11" r=".8" /><circle cx="14.5" cy="11" r=".8" /><path d="M9.2 14.2c1.8 1.5 3.8 1.5 5.6 0" /><path d="M9 5.6 7.5 3.8M15 5.6l1.5-1.8" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="m12 7 1.5 3 3.3.5-2.4 2.3.6 3.2-3-1.6-3 1.6.6-3.2-2.4-2.3 3.3-.5Z" /></>,
  level: <><path d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7Z" /></>,
  meal: <><circle cx="10" cy="12" r="5" /><path d="M18 5v14M16 5v5h4V5M5 5v5M7 5v5M5 10h2v9" /></>,
  cards: <><rect x="5" y="5" width="11" height="14" rx="2" /><path d="m9 10 1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3Z" /><path d="M9 3h10v14" /></>,
  room: <><path d="m4 11 8-6 8 6v9H4Z" /><path d="M9 20v-6h6v6" /><path d="m12 7 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 9.3l2-.3Z" /></>,
  river: <><path d="M4 8c2-2 4 2 6 0s4 2 6 0 4 2 4 2M4 13c2-2 4 2 6 0s4 2 6 0 4 2 4 2M4 18c2-2 4 2 6 0s4 2 6 0 4 2 4 2" /></>,
  wardrobe: <><path d="M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" /><path d="M12 4v16M9.5 11h.1M14.5 11h.1" /><path d="m8 7 2-1 2 1 2-1 2 1" /></>,
  bookshelf: <><path d="M4 5h16v15H4Z" /><path d="M4 13h16M8 7v5M12 6v6M16 8v4M7 15v4M11 15v4M16 15v4" /></>,
  growth: <><path d="M12 3c4 0 7 2.5 7 6v7c0 3-3 5-7 5s-7-2-7-5V9c0-3.5 3-6 7-6Z" /><path d="M9 13c1.8 1.4 4.2 1.4 6 0" /><path d="m12 6 1.1 2.2 2.4.3-1.7 1.7.4 2.4-2.2-1.2-2.2 1.2.4-2.4-1.7-1.7 2.4-.3Z" /></>,
  report: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M8 16v-3M12 16V9M16 16v-5M8 7h8" /></>,
  shop: <><path d="M5 9h14l-1 11H6Z" /><path d="M7 9c0-3 2-5 5-5s5 2 5 5" /><path d="m12 12 1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3Z" /></>,
  achievement: <><path fill="currentColor" d="M7 4h10v4c0 3.1-2.1 5.7-5 6.5C9.1 13.7 7 11.1 7 8Z" /><path d="M7 6H4v2c0 2.2 1.8 4 4 4M17 6h3v2c0 2.2-1.8 4-4 4M12 14.5V18M8.5 20h7" /></>,
  quest: <><rect x="5" y="5" width="14" height="16" rx="2" fill="currentColor" /><path d="M9 5V3h6v2" /><path fill="none" stroke="white" d="m12 9 1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3Z" /></>,
  news: <><path fill="currentColor" d="m4 10 12-5v12L4 14Z" /><path d="M16 8.5c2 0 3.5 1.5 3.5 3.5S18 15.5 16 15.5M6 14l1.5 6h4L10 15" /></>,
}

export function GameIcon({ name, className, title }: GameIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  )
}
