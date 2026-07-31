import type { CompanionCharacterId } from '../domain/companionCharacters'

export type SceneAssetKey = 'worldHome' | 'companionRoom'

export const SCENE_ASSETS: Record<SceneAssetKey, string> = {
  worldHome: '/art/world/world-home-day.webp',
  companionRoom: '/art/room/companion-room-day.webp',
}

const COMPANION_ART: Record<CompanionCharacterId, string> = {
  foody: '/art/characters/foody.png',
  berry: '/art/characters/berry.png',
  noodle: '/art/characters/noodle.png',
  cocoa: '/art/characters/cocoa.png',
}

export function getCompanionArt(id: CompanionCharacterId): string {
  return COMPANION_ART[id]
}
