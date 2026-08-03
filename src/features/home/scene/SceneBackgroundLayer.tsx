import { HOME_SCENE_ASSETS } from './HomeSceneAssets'

export function SceneBackgroundLayer() {
  return (
    <div
      className="home-scene-layer home-scene-background"
      data-testid="home-layer-background"
      aria-hidden="true"
    >
      <img className="home-scene-sky" src={HOME_SCENE_ASSETS.backgrounds.sky} alt="" />
      <img className="home-scene-distant" src={HOME_SCENE_ASSETS.backgrounds.distant} alt="" />
      <img className="home-scene-ground" src={HOME_SCENE_ASSETS.backgrounds.ground} alt="" />
    </div>
  )
}
