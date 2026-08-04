import type { PlayerLevel } from '../../domain/progression'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEmotion } from '../companion/HeroCompanion'
import { ReferenceGameHud } from './ReferenceGameHud'
import { ReferenceLandmarkButton } from './ReferenceLandmarkButton'
import { ReferenceRecordButton } from './ReferenceRecordButton'
import { SceneBackgroundLayer } from './scene/SceneBackgroundLayer'
import { SceneCharacterLayer } from './scene/SceneCharacterLayer'
import { SceneEffectsLayer } from './scene/SceneEffectsLayer'
import { SceneLandmarkLayer } from './scene/SceneLandmarkLayer'
import './homeScene.css'
import './homeSceneUi.css'
import './homeSceneV4.css'
import './homeSceneHudFix.css'
import './referenceHomeUi.css'
import './referenceBottomNav.css'

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
      data-layered-scene="true"
      data-reference-home="true"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <SceneBackgroundLayer />
      <SceneLandmarkLayer />
      <SceneCharacterLayer
        characterId={characterId}
        emotion={emotion}
        reducedMotion={reducedMotion}
      />
      <SceneEffectsLayer reducedMotion={reducedMotion} />

      <ReferenceGameHud
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

      <ReferenceLandmarkButton
        variant="collection"
        className="world-landmark-collection"
        label="도감 열기"
        text="도감"
        icon="collection"
        onActivate={onOpenCollection}
      />
      <ReferenceLandmarkButton
        variant="adventure"
        className="world-landmark-adventure"
        label="모험 열기"
        text="모험"
        icon="adventure"
        onActivate={onOpenAdventure}
      />
      <ReferenceRecordButton onRecord={onRecord} />
      <ReferenceLandmarkButton
        variant="buddy"
        className="world-landmark-buddy"
        label="버디 열기"
        text="버디"
        icon="buddy"
        onActivate={onOpenCompanion}
      />
    </section>
  )
}
