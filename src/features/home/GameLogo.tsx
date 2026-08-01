import type { CSSProperties } from 'react'

export function GameLogo() {
  return (
    <div className="foodex-game-logo" role="img" aria-label="FOODEX">
      <span className="foodex-logo-word" aria-hidden="true">
        {'FOODEX'.split('').map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            style={{ '--letter-index': index } as CSSProperties}
          >
            {letter}
          </span>
        ))}
      </span>
      <span className="foodex-logo-star" data-testid="foodex-logo-star" aria-hidden="true">★</span>
      <span className="foodex-logo-sparkles" aria-hidden="true">✦ ✦</span>
    </div>
  )
}
