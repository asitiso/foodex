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
    idle: string
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
    sky: '/assets/home/backgrounds/sky-ground.webp',
    distant: transparentFallback,
    ground: transparentFallback,
  },
  landmarks: {
    collection: '/assets/home/landmarks/collection-house.webp',
    record: '/assets/home/landmarks/camera-building.webp',
    adventure: '/assets/home/landmarks/adventure-castle.webp',
    buddy: '/assets/home/landmarks/buddy-house.webp',
  },
  character: {
    idle: '/assets/home/characters/foody-idle.webp',
    shadow: transparentFallback,
  },
  effects: {
    sparkle: '/assets/home/effects/sparkles.webp',
    glow: '/assets/home/effects/glow-ring.webp',
  },
}
