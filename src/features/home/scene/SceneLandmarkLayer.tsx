import { HOME_SCENE_ASSETS } from './HomeSceneAssets'

export function SceneLandmarkLayer() {
  return (
    <div
      className="home-scene-layer home-scene-landmarks"
      data-testid="home-layer-landmarks"
      aria-hidden="true"
    >
      <img
        className="home-landmark-art home-landmark-art--collection"
        src={HOME_SCENE_ASSETS.landmarks.collection}
        alt=""
      />
      <img
        className="home-landmark-art home-landmark-art--record"
        src={HOME_SCENE_ASSETS.landmarks.record}
        alt=""
      />
      <img
        className="home-landmark-art home-landmark-art--adventure"
        src={HOME_SCENE_ASSETS.landmarks.adventure}
        alt=""
      />
      <img
        className="home-landmark-art home-landmark-art--buddy"
        src={HOME_SCENE_ASSETS.landmarks.buddy}
        alt=""
      />
    </div>
  )
}
