import { describe, expect, it } from 'vitest'
import { todaysWeather } from './inGameWeather'

const VALID_WEATHERS = ['sunny', 'rainy', 'snowy', 'rainbow', 'windy']

describe('todaysWeather', () => {
  it('returns one of the five defined weather values', () => {
    const samples = [
      Date.parse('2026-01-01T03:00:00+09:00'),
      Date.parse('2026-03-15T12:00:00+09:00'),
      Date.parse('2026-07-04T18:30:00+09:00'),
      Date.parse('2026-09-20T09:00:00+09:00'),
      Date.parse('2026-12-25T23:59:00+09:00'),
    ]

    for (const sample of samples) {
      expect(VALID_WEATHERS).toContain(todaysWeather(sample))
    }
  })

  it('is deterministic for different times on the same calendar day', () => {
    const morning = Date.parse('2026-07-30T00:30:00+09:00')
    const noon = Date.parse('2026-07-30T12:00:00+09:00')
    const night = Date.parse('2026-07-30T23:45:00+09:00')

    expect(todaysWeather(morning)).toBe(todaysWeather(noon))
    expect(todaysWeather(noon)).toBe(todaysWeather(night))
  })

  it('is stable across repeated calls for the same instant', () => {
    const now = Date.parse('2026-05-05T05:05:00+09:00')
    expect(todaysWeather(now)).toBe(todaysWeather(now))
  })
})
