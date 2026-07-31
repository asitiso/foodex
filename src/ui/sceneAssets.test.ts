import { describe, expect, it } from 'vitest'
import { COMPANION_CHARACTERS } from '../domain/companionCharacters'
import { getCompanionArt, SCENE_ASSETS } from './sceneAssets'

describe('scene assets', () => {
  it('defines separate home and room backgrounds', () => {
    expect(SCENE_ASSETS.worldHome).toBe('/art/world/world-home-day.webp')
    expect(SCENE_ASSETS.companionRoom).toBe('/art/room/companion-room-day.webp')
  })

  it('maps every selectable companion to an independent image', () => {
    for (const character of COMPANION_CHARACTERS) {
      expect(getCompanionArt(character.id)).toMatch(
        new RegExp(`/art/characters/${character.id}\\.png$`),
      )
    }
  })
})
