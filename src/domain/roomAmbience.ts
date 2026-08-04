export type TimeOfDay = 'day' | 'night'

export function timeOfDayFor(now: number): TimeOfDay {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    hour12: false,
  }).format(now)) % 24
  return hour >= 6 && hour < 19 ? 'day' : 'night'
}
