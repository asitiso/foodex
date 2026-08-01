import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/homeGameUi.css'), 'utf8')

describe('reference home CSS contract', () => {
  it('keeps account protection accessible but outside the painted composition', () => {
    expect(css).toMatch(/\.account-protection\s*\{[^}]*width:\s*1px;[^}]*height:\s*1px;[^}]*clip-path:\s*inset\(50%\)/s)
    expect(css).toMatch(/\.sync-status\s*\{[^}]*width:\s*1px;[^}]*height:\s*1px;[^}]*clip-path:\s*inset\(50%\)/s)
  })

  it('binds the meal plaque to the painted camera instead of drawing a camera card', () => {
    expect(css).toMatch(/\.meal-record-orb\s*\{[^}]*left:\s*36%;[^}]*top:\s*41%;[^}]*height:\s*2\.9rem/s)
    expect(css).toMatch(/\.meal-record-orb svg\s*\{[^}]*display:\s*none/s)
  })

  it('keeps the painted strawberry plaque clear of the camera plaque', () => {
    expect(css).toMatch(/\.world-landmark-collection\s*\{[^}]*left:\s*2%;/s)
  })

  it('gives the dock visible side and bottom breathing room', () => {
    expect(css).toMatch(/--home-safe-bottom:\s*max\(\.9rem,/)
    expect(css).toMatch(/--home-safe-inline:\s*max\(\.75rem,/)
    expect(css).toMatch(/\.home-menu-dock\s*\{[^}]*right:\s*var\(--home-safe-inline\);[^}]*left:\s*var\(--home-safe-inline\)/s)
  })

  it('preserves a reference-scaled short HUD and starts the logo near y 62', () => {
    expect(css).toMatch(/@media \(max-height:\s*700px\)[\s\S]*?\.foodex-game-logo\s*\{[^}]*top:\s*calc\(var\(--home-safe-top\) \+ 3\.3rem\)/)
    expect(css).toMatch(/@media \(max-height:\s*700px\)[\s\S]*?\.game-status-button:nth-child\(3\)\s*\{\s*min-height:\s*4\.5rem;/)
  })
})
