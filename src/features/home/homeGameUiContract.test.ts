import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/homeGameUi.css'), 'utf8')
const sceneAssets = readFileSync(resolve(process.cwd(), 'src/ui/sceneAssets.ts'), 'utf8')

describe('reference home CSS contract', () => {
  it('uses a home-only composition with the reference landmark hierarchy', () => {
    expect(sceneAssets).toContain("worldHome: '/art/world/world-home-reference-city.png'")
    expect(existsSync(resolve(process.cwd(), 'public/art/world/world-home-reference-city.png'))).toBe(true)
  })

  it('keeps account protection accessible but outside the painted composition', () => {
    expect(css).toMatch(/\.account-protection\s*\{[^}]*width:\s*1px;[^}]*height:\s*1px;[^}]*clip-path:\s*inset\(50%\)/s)
    expect(css).toMatch(/\.sync-status\s*\{[^}]*width:\s*1px;[^}]*height:\s*1px;[^}]*clip-path:\s*inset\(50%\)/s)
  })

  it('binds the meal plaque to the painted camera instead of drawing a camera card', () => {
    expect(css).toMatch(/\.meal-record-orb\s*\{[^}]*left:\s*50%;[^}]*top:\s*44%;[^}]*height:\s*2\.9rem/s)
    expect(css).toMatch(/\.meal-record-orb svg\s*\{[^}]*display:\s*none/s)
  })

  it('keeps the painted strawberry plaque clear of the camera plaque', () => {
    expect(css).toMatch(/\.world-landmark-collection\s*\{[^}]*left:\s*24%;[^}]*top:\s*43%;/s)
  })

  it('gives the dock visible side and bottom breathing room', () => {
    expect(css).toMatch(/--home-safe-bottom:\s*clamp\(1\.5rem,\s*3\.75vh,\s*2rem\)/)
    expect(css).toMatch(/\.home-menu-dock\s*\{[^}]*right:\s*5\.33vw;[^}]*left:\s*6\.67vw;/s)
    expect(css).toMatch(/@media \(max-height:\s*700px\)[\s\S]*?--home-dock-height:\s*4\.75rem;/)
  })

  it('integrates plaques without universal hanger tabs', () => {
    expect(css).not.toContain('.world-home-scene .world-hotspot::after')
  })

  it('preserves a reference-scaled short HUD and starts the logo near y 62', () => {
    expect(css).toMatch(/@media \(max-height:\s*700px\)[\s\S]*?\.foodex-game-logo\s*\{[^}]*top:\s*calc\(var\(--home-safe-top\) \+ 3\.3rem\)/)
    expect(css).toMatch(/@media \(max-height:\s*700px\)[\s\S]*?\.game-status-button:nth-child\(3\)\s*\{\s*min-height:\s*4\.5rem;/)
  })
})
