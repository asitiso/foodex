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

interface GameIconProps {
  name: GameIconName
  className?: string
  title?: string
}

const paths: Record<GameIconName, JSX.Element> = {
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
