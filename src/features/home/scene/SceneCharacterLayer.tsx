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
      <img
        className="home-character-art"
        src={HOME_SCENE_ASSETS.character.idle}
        alt=""
        aria-hidden="true"
      />
      <div className="home-character-interaction">
        <HeroCompanion {...props} onOpenRoom={undefined} />
      </div>
    </div>
  )
}
