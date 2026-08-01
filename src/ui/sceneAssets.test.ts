import { describe, expect, it } from 'vitest'
import { getCompanionArt, SCENE_ASSETS } from './sceneAssets'

describe('Foodex production art registry', () => {
  it('resolves the approved play-city and fantasy-room backgrounds', () => {
    expect(SCENE_ASSETS).toEqual({
      worldHome: '/art/world/world-home-play-city.webp',
      companionRoom: '/art/room/buddy-fantasy-room.webp',
    })
  })

  it.each([
    ['foody', '/art/characters/foody.png'],
    ['berry', '/art/characters/berry.png'],
    ['noodle', '/art/characters/noodle.png'],
    ['cocoa', '/art/characters/cocoa.png'],
  ] as const)('maps %s to a browser-loadable character asset', (id, path) => {
    expect(getCompanionArt(id)).toBe(path)
  })
})
