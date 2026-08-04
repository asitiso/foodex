import { describe, expect, it } from 'vitest'
import { COMPANION_CHARACTERS, getCompanionCharacter } from './companionCharacters'

describe('companion characters', () => {
  it('offers four selectable characters with a safe fallback', () => {
    expect(COMPANION_CHARACTERS).toHaveLength(4)
    expect(new Set(COMPANION_CHARACTERS.map((character) => character.id)).size).toBe(4)
    expect(getCompanionCharacter('noodle').name).toBe('누들')
    expect(getCompanionCharacter('invalid' as never).id).toBe('foody')
  })
})
