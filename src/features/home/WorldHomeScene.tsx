import type { CSSProperties } from 'react'
import type { PlayerLevel } from '../../domain/progression'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import { HeroCompanion, type CompanionEmotion } from '../companion/HeroCompanion'
import { SCENE_ASSETS } from '../../ui/sceneAssets'
import { GameHud } from './GameHud'
import { HomeMenuCard } from './HomeMenuCard'
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

export function WorldHomeScene({ coinBalance, level, todayCards, todayMeals, mealTarget, streakDays, characterId, emotion, reducedMotion, onRecord, onOpenCollection, onOpenAdventure, onOpenMeals, onOpenCompanion, onOpenLevel, onOpenCoins }: WorldHomeSceneProps) {
  const levelProgress = level.nextLevelXp > 0
    ? Math.min(100, Math.round((level.currentLevelXp / level.nextLevelXp) * 100))
    : 100

  return (
    <section className="world-home-scene" aria-label="푸덱 월드 홈" style={{ '--scene-background': `url("${SCENE_ASSETS.worldHome}")` } as CSSProperties}>
      <GameHud coinBalance={coinBalance} level={level.level} levelProgress={levelProgress} todayCards={todayCards} todayMeals={todayMeals} mealTarget={mealTarget} streakDays={streakDays} onOpenLevel={onOpenLevel} onOpenCards={onOpenCollection} onOpenMeals={onOpenMeals} onOpenCoins={onOpenCoins} />
      <WorldHotspot className="world-landmark-collection" label="도감 열기" text="도감" icon="collection" onActivate={onOpenCollection} />
      <WorldHotspot className="world-landmark-adventure" label="모험 열기" text="모험" icon="adventure" onActivate={onOpenAdventure} />
      <MealRecordOrb onRecord={onRecord} />
      <WorldHotspot className="world-landmark-buddy" label="버디 열기" text="버디" icon="buddy" onActivate={onOpenCompanion} />
      <HeroCompanion characterId={characterId} emotion={emotion} reducedMotion={reducedMotion} onOpenRoom={undefined} />
      <nav className="home-menu-dock" aria-label="홈 게임 메뉴">
        <HomeMenuCard label="업적" icon="achievement" onActivate={onOpenAdventure} />
        <HomeMenuCard label="퀘스트" icon="quest" onActivate={onOpenAdventure} />
        <HomeMenuCard label="상점" icon="shop" onActivate={onOpenCollection} />
        <HomeMenuCard label="소식" icon="news" onActivate={onOpenCompanion} />
      </nav>
    </section>
  )
}
