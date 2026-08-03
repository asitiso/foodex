import { HOME_SCENE_ASSETS } from './HomeSceneAssets'

export function SceneEffectsLayer({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      className="home-scene-layer home-scene-effects"
      data-testid="home-layer-effects"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      aria-hidden="true"
    >
      <img className="home-effect-glow" src={HOME_SCENE_ASSETS.effects.glow} alt="" />
      <img
        className="home-effect-sparkle home-effect-sparkle--one"
        src={HOME_SCENE_ASSETS.effects.sparkle}
        alt=""
      />
      <img
        className="home-effect-sparkle home-effect-sparkle--two"
        src={HOME_SCENE_ASSETS.effects.sparkle}
        alt=""
      />
    </div>
  )
}
