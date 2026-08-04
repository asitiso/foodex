export type CompanionCharacterId = 'foody' | 'berry' | 'noodle' | 'cocoa' | 'daqong'

export interface CompanionCharacter {
  id: CompanionCharacterId
  name: string
  description: string
  color: string
}

export const COMPANION_CHARACTERS: readonly CompanionCharacter[] = [
  { id: 'foody', name: '푸디', description: '따뜻한 밥을 좋아하는 기본 친구', color: '#7454db' },
  { id: 'berry', name: '베리', description: '상큼한 과일을 좋아하는 친구', color: '#e9789a' },
  { id: 'noodle', name: '누들', description: '면 요리를 좋아하는 친구', color: '#e8aa37' },
  { id: 'cocoa', name: '코코아', description: '달콤한 간식을 좋아하는 친구', color: '#9a6b56' },
  { id: 'daqong', name: '다쿵이', description: '귀여운 병아리 친구', color: '#ffcb45' },
]

export function getCompanionCharacter(id: CompanionCharacterId) {
  return COMPANION_CHARACTERS.find((character) => character.id === id) ?? COMPANION_CHARACTERS[0]
}
