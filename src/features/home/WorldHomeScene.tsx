import type { CSSProperties } from 'react'
import type { PlayerLevel } from '../../domain/progression'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import { HeroCompanion, type CompanionEmotion } from '../companion/HeroCompanion'
import { SCENE_ASSETS } from '../../ui/sceneAssets'
import { GameHud } from './GameHud'
import { MealRecordOrb } from './MealRecordOrb'
import { WorldHotspot } from './WorldHotspot'

export interface WorldHomeSceneProps {
  coinBalance: number
  level: PlayerLevel
  todayCards: number
  todayMeals: number
  mealTarget: number
  streakDays: number
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
  onRecord: () => void
  onOpenCollection: () => void
  onOpenAdventure: () => void
  onOpenMeals: () => void
  onOpenCompanion: () => void
  onOpenLevel: () => void
  onOpenCoins: () => void
}

export function WorldHomeScene({
  coinBalance,
  level,
  todayCards,
  todayMeals,
  mealTarget,
  streakDays,
  characterId,
  emotion,
  reducedMotion,
  onRecord,
  onOpenCollection,
  onOpenAdventure,
  onOpenMeals,
  onOpenCompanion,
  onOpenLevel,
  onOpenCoins,
}: WorldHomeSceneProps) {
  const levelProgress = level.nextLevelXp > 0
    ? Math.min(100, Math.round((level.currentLevelXp / level.nextLevelXp) * 100))
    : 100

  return (
    <section
      className="world-home-scene"
      aria-label="푸덱 월드 홈"
      style={{ '--scene-background': `url("${SCENE_ASSETS.worldHome}")` } as CSSProperties}
    >
      <GameHud
        coinBalance={coinBalance}
        level={level.level}
        levelProgress={levelProgress}
        todayCards={todayCards}
        todayMeals={todayMeals}
        mealTarget={mealTarget}
        streakDays={streakDays}
        onOpenLevel={onOpenLevel}
        onOpenCards={onOpenCollection}
        onOpenMeals={onOpenMeals}
        onOpenCoins={onOpenCoins}
      />
      <HeroCompanion
        characterId={characterId}
        emotion={emotion}
        reducedMotion={reducedMotion}
        onOpenRoom={undefined}
      />
      <button className="open-room-action" type="button" onClick={onOpenCompanion}>버디 방으로 가기</button>
      <WorldHotspot
        className="world-hotspot-village"
        label="푸덱 마을 모험 보기"
        icon="🏘️"
        onActivate={onOpenAdventure}
      />
      <WorldHotspot
        className="world-hotspot-river"
        label="오늘의 식사 도전 보기"
        icon="🌊"
        onActivate={onOpenAdventure}
      />
      <MealRecordOrb onRecord={onRecord} />
    </section>
  )
}
