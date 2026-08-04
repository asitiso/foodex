import {
  COLLECTION_SETS,
  FOOD_CATALOG,
  FOOD_EVENTS,
  FUSION_RECIPES,
  REGIONS,
} from './v3Content'
import type { FoodCard, MealRecord, Rarity, RegionId, SeasonId } from './types'

type Entry = { card: FoodCard; meal: MealRecord }

export interface V3RewardGrant {
  rewardType: 'skin' | 'background' | 'event-card' | 'fusion-card'
  rewardId: string
  sourceType: 'set' | 'event' | 'fusion'
  sourceId: string
}

export interface V3Progress {
  regions: Array<{ id: RegionId; title: string; discovered: number; total: number; percent: number }>
  activeSeason: SeasonId
  seasonalDiscoveries: string[]
  completedSetIds: string[]
  newRewards: V3RewardGrant[]
  activeEvent?: {
    id: string
    title: string
    description: string
    completed: number
    total: number
    endsAt: string
  }
}

export interface CollectionFilters {
  regionId?: RegionId
  seasonId?: SeasonId
  setId?: string
  rarity?: Rarity
}

export function seasonForDate(now: number): SeasonId {
  const month = Number(new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(now))

  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export function resolveFusion(cards: readonly FoodCard[]) {
  if (cards.length < 2) return undefined
  const uniqueIds = new Set(cards.map((card) => card.id))
  if (uniqueIds.size !== cards.length) return undefined
  const catalogIds = cards.map((card) => card.catalogId).sort().join(':')
  return FUSION_RECIPES.find((recipe) =>
    [...recipe.requiredCatalogIds].sort().join(':') === catalogIds,
  )
}

export function filterCollection(entries: Entry[], filters: CollectionFilters): Entry[] {
  const set = filters.setId
    ? COLLECTION_SETS.find((candidate) => candidate.id === filters.setId)
    : undefined

  return entries.filter(({ card }) =>
    (!filters.regionId || card.regionId === filters.regionId)
    && (!filters.seasonId || card.seasonId === filters.seasonId)
    && (!filters.rarity || card.rarity === filters.rarity)
    && (!filters.setId || Boolean(set?.requiredCatalogIds.includes(card.catalogId))),
  )
}

export function buildV3Progress(
  entries: Entry[],
  unlockedRewardIds: readonly string[],
  now = Date.now(),
): V3Progress {
  const discovered = new Set(entries.map(({ card }) => card.catalogId))
  const activeSeason = seasonForDate(now)
  const completedSets = COLLECTION_SETS.filter((set) =>
    set.requiredCatalogIds.every((catalogId) => discovered.has(catalogId)),
  )
  const newRewards: V3RewardGrant[] = completedSets
    .filter((set) => !unlockedRewardIds.includes(set.reward.rewardId))
    .map((set) => ({
      rewardType: set.reward.rewardType,
      rewardId: set.reward.rewardId,
      sourceType: 'set',
      sourceId: set.id,
    }))
  const activeEventDefinition = FOOD_EVENTS.find((event) =>
    now >= Date.parse(event.startsAt) && now <= Date.parse(event.endsAt),
  )

  if (
    activeEventDefinition
    && activeEventDefinition.requiredCatalogIds.every((id) => discovered.has(id))
    && !unlockedRewardIds.includes(activeEventDefinition.rewardCatalogId)
  ) {
    newRewards.push({
      rewardType: 'event-card',
      rewardId: activeEventDefinition.rewardCatalogId,
      sourceType: 'event',
      sourceId: activeEventDefinition.id,
    })
  }

  return {
    regions: REGIONS.map((region) => {
      const regionFoods = FOOD_CATALOG.filter((food) => food.regionId === region.id)
      const discoveredCount = regionFoods.filter((food) => discovered.has(food.id)).length
      return {
        id: region.id,
        title: region.title,
        discovered: discoveredCount,
        total: regionFoods.length,
        percent: regionFoods.length === 0 ? 0 : Math.round((discoveredCount / regionFoods.length) * 100),
      }
    }),
    activeSeason,
    seasonalDiscoveries: FOOD_CATALOG
      .filter((food) => food.seasonId === activeSeason && discovered.has(food.id))
      .map((food) => food.id),
    completedSetIds: completedSets.map((set) => set.id),
    newRewards,
    ...(activeEventDefinition ? {
      activeEvent: {
        id: activeEventDefinition.id,
        title: activeEventDefinition.title,
        description: `${activeEventDefinition.requiredCatalogIds
          .map((id) => FOOD_CATALOG.find((food) => food.id === id)?.label ?? id)
          .join(', ')} 카드를 모두 모으면 보상을 받아요.`,
        completed: activeEventDefinition.requiredCatalogIds.filter((id) => discovered.has(id)).length,
        total: activeEventDefinition.requiredCatalogIds.length,
        endsAt: activeEventDefinition.endsAt,
      },
    } : {}),
  }
}
