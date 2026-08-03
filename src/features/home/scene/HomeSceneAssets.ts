import { SCENE_ASSETS } from '../../../ui/sceneAssets'

export interface HomeSceneAssetRegistry {
  backgrounds: {
    sky: string
    distant: string
    ground: string
  }
  landmarks: {
    collection: string
    record: string
    adventure: string
    buddy: string
  }
  character: {
    shadow: string
  }
  effects: {
    sparkle: string
    glow: string
  }
}

const transparentFallback =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E'

export const HOME_SCENE_ASSETS: HomeSceneAssetRegistry = {
  backgrounds: {
    sky: SCENE_ASSETS.worldHome,
    distant: transparentFallback,
    ground: transparentFallback,
  },
  landmarks: {
    collection: transparentFallback,
    record: transparentFallback,
    adventure: transparentFallback,
    buddy: transparentFallback,
  },
  character: {
    shadow: transparentFallback,
  },
  effects: {
    sparkle: transparentFallback,
    glow: transparentFallback,
  },
}
