import type { Progression } from './progression'

export type RoomUnlockId =
  | 'small-plant'
  | 'food-poster'
  | 'card-shelf'
  | 'window-view'
  | 'korean-lamp'
  | 'fruit-cushion'
  | 'noodle-pot'
  | 'season-wallpaper'

export interface RoomUnlock {
  id: RoomUnlockId
  title: string
  source: 'level' | 'collection' | 'season'
}

const LEVEL_UNLOCKS: readonly (RoomUnlock & { level: number })[] = [
  { id: 'small-plant', title: '작은 화분', source: 'level', level: 3 },
  { id: 'food-poster', title: '음식 포스터', source: 'level', level: 5 },
  { id: 'card-shelf', title: '카드 진열대', source: 'level', level: 8 },
  { id: 'window-view', title: '창문 풍경', source: 'level', level: 10 },
]

const SET_UNLOCKS: readonly (RoomUnlock & { setIds: readonly string[] })[] = [
  { id: 'korean-lamp', title: '전통 조명', source: 'collection', setIds: ['korea-full-course'] },
  { id: 'fruit-cushion', title: '과일 쿠션', source: 'collection', setIds: ['sunny-bites'] },
  { id: 'noodle-pot', title: '냄비 장식', source: 'collection', setIds: ['street-team'] },
]

export function deriveRoomUnlocks(progression: Progression): RoomUnlock[] {
  const levelUnlocks = LEVEL_UNLOCKS
    .filter((unlock) => progression.level.level >= unlock.level)
    .map(({ id, title, source }) => ({ id, title, source }))
  const setUnlocks = SET_UNLOCKS
    .filter((unlock) => unlock.setIds.some((id) => progression.v3.completedSetIds.includes(id)))
    .map(({ id, title, source }) => ({ id, title, source }))

  return [
    ...levelUnlocks,
    ...setUnlocks,
    ...(progression.season.completed
      ? [{ id: 'season-wallpaper', title: '시즌 한정 벽지', source: 'season' } as RoomUnlock]
      : []),
  ]
}
