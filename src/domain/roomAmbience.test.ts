import { describe, expect, it } from 'vitest'
import { timeOfDayFor } from './roomAmbience'

describe('timeOfDayFor', () => {
  it('treats daytime hours in Seoul as day', () => {
    expect(timeOfDayFor(new Date('2026-07-10T09:00:00+09:00').getTime())).toBe('day')
    expect(timeOfDayFor(new Date('2026-07-10T18:00:00+09:00').getTime())).toBe('day')
  })

  it('treats evening and early morning hours in Seoul as night', () => {
    expect(timeOfDayFor(new Date('2026-07-10T19:00:00+09:00').getTime())).toBe('night')
    expect(timeOfDayFor(new Date('2026-07-10T23:30:00+09:00').getTime())).toBe('night')
    expect(timeOfDayFor(new Date('2026-07-10T00:30:00+09:00').getTime())).toBe('night')
  })
})
