import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getCompanionArt, SCENE_ASSETS } from './sceneAssets'

function publicAssetExists(assetPath: string): boolean {
  return existsSync(resolve(process.cwd(), 'public', assetPath.replace(/^\//, '')))
}

describe('Foodex production art registry', () => {
  it('resolves the approved play-city and fantasy-room backgrounds', () => {
    expect(SCENE_ASSETS).toEqual({
      worldHome: '/art/world/world-home-reference-city.png',
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

  it('keeps every registered production asset present under public', () => {
    const registeredAssets = [
      ...Object.values(SCENE_ASSETS),
      getCompanionArt('foody'),
      getCompanionArt('berry'),
      getCompanionArt('noodle'),
      getCompanionArt('cocoa'),
    ]

    for (const assetPath of registeredAssets) {
      expect(publicAssetExists(assetPath), `${assetPath} should exist`).toBe(true)
    }
  })
})
