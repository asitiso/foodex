export type Weather = 'sunny' | 'rainy' | 'snowy' | 'rainbow' | 'windy'

const WEATHER_VALUES: readonly Weather[] = ['sunny', 'rainy', 'snowy', 'rainbow', 'windy']

// Small FNV-1a-style hash, duplicated from cardComposer.ts to avoid an import
// cycle (cardRules.ts -> cardComposer.ts -> ... ); keep in sync if that hash changes.
function hash(value: string) {
  return [...value].reduce((result, character) =>
    Math.imul(result ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261)
}

function calendarDateKey(now: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(now)
}

/**
 * Deterministic "in-game weather" for a given moment, stable across the whole
 * calendar day (Asia/Seoul). Purely a flavor/bonus layer.
 */
export function todaysWeather(now: number): Weather {
  return WEATHER_VALUES[hash(calendarDateKey(now)) % WEATHER_VALUES.length]
}
