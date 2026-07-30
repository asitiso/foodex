import { describe, expect, it } from 'vitest'
import { buildProgression } from './progression'
import { deriveRoomUnlocks } from './roomProgression'

describe('deriveRoomUnlocks', () => {
  it('unlocks the plant at level three exactly once', () => {
    const progression = buildProgression([])
    const result = deriveRoomUnlocks({
      ...progression,
      level: { ...progression.level, level: 3 },
    })

    expect(result).toContainEqual(expect.objectContaining({ id: 'small-plant' }))
    expect(result.filter((unlock) => unlock.id === 'small-plant')).toHaveLength(1)
    expect(result.some((unlock) => unlock.id === 'food-poster')).toBe(false)
  })

  it('unlocks collection and season decorations from completed content', () => {
    const progression = buildProgression([])
    const result = deriveRoomUnlocks({
      ...progression,
      season: { ...progression.season, completed: true },
      v3: {
        ...progression.v3,
        completedSetIds: ['korean-table', 'sunny-bites', 'street-team'],
      },
    })

    expect(result.map((unlock) => unlock.id)).toEqual(expect.arrayContaining([
      'korean-lamp',
      'fruit-cushion',
      'noodle-pot',
      'season-wallpaper',
    ]))
  })
})
