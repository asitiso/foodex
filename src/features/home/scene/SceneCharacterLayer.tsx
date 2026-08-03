import type { CompanionCharacterId } from '../../../domain/companionCharacters'
import { HeroCompanion, type CompanionEmotion } from '../../companion/HeroCompanion'
import { HOME_SCENE_ASSETS } from './HomeSceneAssets'

export interface SceneCharacterLayerProps {
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
}

export function SceneCharacterLayer(props: SceneCharacterLayerProps) {
  return (
    <div
      className="home-scene-layer home-scene-character"
      data-testid="home-layer-character"
    >
      <img
        className="home-character-shadow"
        src={HOME_SCENE_ASSETS.character.shadow}
        alt=""
        aria-hidden="true"
      />
      <HeroCompanion {...props} onOpenRoom={undefined} />
    </div>
  )
}
