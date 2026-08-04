import { useState } from 'react'
import type { MouseEvent } from 'react'
import type { AdventureBoard, DailyQuest, MealStreak, PlayerLevel } from '../../domain/progression'
import type { MealGameLoopState } from '../../domain/mealGameLoop'
import type { MealAdventureState } from '../../domain/mealAdventure'
import type { CompanionCharacterId } from '../../domain/companionCharacters'
import type { CompanionEvolution } from '../../domain/companionEvolution'
import type { CompanionClass } from '../../domain/companionClasses'
import type { AdvancedGameSystems } from '../../domain/advancedGameSystems'
import { CompanionRoom } from './CompanionRoom'
import type { CompanionEmotion } from './CompanionRoom'
import { HomeStatusGrid } from './HomeStatusGrid'
import { timeOfDayFor } from '../../domain/roomAmbience'

interface HomeScreenProps {
  summary: {
    todayCount: number
    discoveredCount: number
    totalXp: number
    lastMealAt?: number
  }
  coinBalance: number
  level: PlayerLevel
  streak: MealStreak
  dailyQuests: DailyQuest[]
  adventureBoard: AdventureBoard
  mealGameLoop: MealGameLoopState
  mealAdventure: MealAdventureState
  characterId?: CompanionCharacterId
  characterName?: string
  evolution?: CompanionEvolution
  companionClass?: CompanionClass
  advancedSystems?: AdvancedGameSystems
  companionLine: string
  companionEmotion: CompanionEmotion
  decorationIds: readonly string[]
  reducedMotion: boolean
  roomBackgroundId?: string
  roomAccessoryId?: string
  nextGoal?: string
  onRecord: () => void
  onOpenCollection: () => void
  onOpenAdventure: () => void
  onOpenCompanion: () => void
  onOpenShop: () => void
}

export function HomeScreen({
  summary,
  coinBalance,
  level,
  streak,
  dailyQuests,
  adventureBoard,
  mealGameLoop,
  mealAdventure,
  characterId,
  characterName,
  evolution,
  companionClass,
  advancedSystems,
  companionLine,
  companionEmotion,
  decorationIds,
  reducedMotion,
  roomBackgroundId,
  roomAccessoryId,
  nextGoal,
  onRecord,
  onOpenCollection,
  onOpenAdventure,
  onOpenCompanion,
  onOpenShop,
}: HomeScreenProps) {
  const uniqueQuest = dailyQuests.find((quest) => !quest.completed && !adventureBoard.items.some((item) => item.title === quest.title))
  const fallbackQuest = dailyQuests.find((quest) => !quest.completed) ?? dailyQuests.at(-1)
  const statusQuest = uniqueQuest
    ?? (fallbackQuest && !fallbackQuest.completed ? { ...fallbackQuest, title: '진행 중' } : fallbackQuest)
  const roomOwnerName = (characterName || '푸디').trim() || '푸디'
  const adventureChapterTitle = mealAdventure.chapter.title.replace(/^푸디(?=의)/, roomOwnerName)
  const personalize = (text: string) => text.replace(/푸디/g, roomOwnerName)
  const [openPanel, setOpenPanel] = useState<'dungeon' | 'board' | 'world' | 'level'>()
  const nearLevelUp = level.nextLevelXp > 0 && level.currentLevelXp / level.nextLevelXp >= 0.9
  const timeOfDay = timeOfDayFor(Date.now())
  const dungeonComplete = Boolean(advancedSystems && advancedSystems.dungeon.cleared >= advancedSystems.dungeon.rooms.length)
  const celebrating = dungeonComplete || Boolean(advancedSystems?.boss.defeated)
  const closePanel = () => setOpenPanel(undefined)
  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closePanel()
  }

  return (
    <section className="home-screen home-room-screen" aria-label="홈">
      <header className="room-home-header">
        <button className="room-title-button" type="button" onClick={() => setOpenPanel('world')}>
          <p className="eyebrow">FOODEX ROOM</p>
          <h1>{roomOwnerName}의 맛있는 방</h1>
        </button>
        <div className="home-wallet-cluster">
          <button className="home-coin-pill" type="button" aria-label={`보유 코인 ${coinBalance}개 · 방 꾸미기 상점 열기`} onClick={onOpenShop}>◆ {coinBalance}</button>
          <button
            className={`room-level-pill${nearLevelUp && !reducedMotion ? ' near-levelup' : ''}`}
            type="button"
            aria-label={`레벨 ${level.level} · 다음 레벨까지 필요한 경험치 보기`}
            onClick={() => setOpenPanel('level')}
          >
            LV.{level.level}
          </button>
        </div>
      </header>

      <CompanionRoom
        emotion={companionEmotion}
        line={companionLine}
        decorationIds={decorationIds}
        reducedMotion={reducedMotion}
        characterId={characterId}
        characterName={roomOwnerName}
        evolution={evolution}
        companionClass={companionClass}
        backgroundId={roomBackgroundId}
        accessoryId={roomAccessoryId}
        timeOfDay={timeOfDay}
        celebrating={celebrating}
        onOpenCompanion={onOpenCompanion}
        onOpenDungeon={() => setOpenPanel('dungeon')}
        onOpenBoard={() => setOpenPanel('board')}
      />

      <section className="home-hero-mission" aria-label="오늘의 다음 행동">
        <div><span className="home-hero-mission-icon" aria-hidden="true">🗺️</span><div><strong>오늘의 다음 방</strong><p>{nextGoal ?? (mealGameLoop.nextMealRemaining > 0 ? `다음 식사 기록까지 ${mealGameLoop.nextMealRemaining}끼 남았어요` : '오늘의 식사 던전을 모두 클리어했어요!')}</p></div></div>
        <span className="home-hero-mission-reward">+{mealGameLoop.comboReward} XP</span>
      </section>

      <HomeStatusGrid
        level={level.level}
        todayCards={summary.todayCount}
        quest={statusQuest}
        streakDays={streak.currentDays}
        onOpenAdventure={onOpenAdventure}
        onOpenCollection={onOpenCollection}
      />

      <button className="primary-cta room-record-cta reward-cta" type="button" onClick={onRecord}>
        <span aria-hidden="true">📷</span>
        오늘의 보상 받기
      </button>

      {openPanel === 'level' && (
        <div className="room-popup-backdrop" role="presentation" onMouseDown={onBackdropClick}>
          <section className="level-popup" aria-label="레벨 정보">
            <button className="room-popup-close" type="button" aria-label="레벨 정보 닫기" onClick={closePanel}>×</button>
            <div className="section-title-row">
              <h2>LV.{level.level}</h2>
              <strong>{level.currentLevelXp}/{level.nextLevelXp} XP</strong>
            </div>
            <div className="level-track" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.round((level.currentLevelXp / level.nextLevelXp) * 100))}%` }} />
            </div>
            <p>다음 레벨까지 {Math.max(0, level.nextLevelXp - level.currentLevelXp)} XP 남았어요</p>
          </section>
        </div>
      )}

      {openPanel === 'dungeon' && (
        <div className="room-popup-backdrop" role="presentation" onMouseDown={onBackdropClick}>
          <section className="meal-game-loop" aria-label="오늘의 식사 게이지">
            <button className="room-popup-close" type="button" aria-label="오늘의 식사 게이지 닫기" onClick={closePanel}>×</button>
            <div className="section-title-row">
              <h2>오늘의 식사 게이지</h2>
              <strong>{mealGameLoop.todayMeals}끼</strong>
            </div>
            <div className="meal-gauge-steps" aria-label={`${mealGameLoop.todayMeals}끼 기록됨`}>
              {mealGameLoop.gaugeSteps.map((completed, index) => (
                <span className={completed ? 'meal-gauge-step completed' : 'meal-gauge-step'} key={index}>
                  {completed ? '✓' : index + 1}
                </span>
              ))}
            </div>
            <p className="meal-next-goal">
              {mealGameLoop.nextMealRemaining > 0
                ? `다음 한 끼까지 ${mealGameLoop.nextMealRemaining}끼 남았어요`
                : '오늘의 식사 게이지를 모두 채웠어요!'}
            </p>
            <p className="meal-growth-goal">
              {mealGameLoop.growth.next
                ? `다음 성장까지 ${mealGameLoop.growth.remaining}끼`
                : '전설의 식사 기록을 달성했어요'}
            </p>
            <p className="meal-combo-goal">{mealGameLoop.comboLabel} · +{mealGameLoop.comboReward} XP</p>
            <p className="meal-weekly-goal">
              이번 주 원정 {mealGameLoop.weeklyMeals}/{mealGameLoop.weeklyTarget}끼
              {mealGameLoop.recoveryAvailable ? ' · 회복권 사용 가능' : ''}
            </p>
            {advancedSystems && <div className="home-dungeon-map" aria-label="오늘의 식사 던전">
              {advancedSystems.dungeon.rooms.map((room) => <span className={room.cleared ? 'cleared' : ''} key={room.id}><b>{room.cleared ? '✓' : '○'}</b>{room.name}</span>)}
            </div>}
          </section>
        </div>
      )}

      {openPanel === 'board' && (
        <div className="room-popup-backdrop" role="presentation" onMouseDown={onBackdropClick}>
          <section className="home-adventure-board" aria-label={adventureBoard.title}>
            <button className="room-popup-close" type="button" aria-label={`${adventureBoard.title} 닫기`} onClick={closePanel}>×</button>
            <div className="section-title-row">
              <h2>{adventureBoard.title}</h2>
              <button className="inline-button" type="button" onClick={onOpenAdventure}>모험 보기</button>
            </div>
            <div className="home-adventure-list">
              {adventureBoard.items.map((item) => (
                <article className={item.completed ? 'home-adventure-item completed' : 'home-adventure-item'} key={item.id}>
                  <span aria-hidden="true">{item.completed ? '✓' : '□'}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.reward}</small>
                  </div>
                </article>
              ))}
            </div>
            <p>{adventureBoard.nextFocus}</p>
          </section>
        </div>
      )}

      {openPanel === 'world' && (
        <div className="room-popup-backdrop" role="presentation" onMouseDown={onBackdropClick}>
          <section className="meal-adventure-panel" aria-label="식사 모험">
            <button className="room-popup-close" type="button" aria-label="식사 모험 닫기" onClick={closePanel}>×</button>
            <div className="section-title-row"><h2>{adventureChapterTitle}</h2><strong>{mealAdventure.route.label}</strong></div>
            <p>{mealAdventure.chapter.line}</p>
            <p>{personalize(`${roomOwnerName} 상태: ${mealAdventure.mood === 'bright' ? '최고 컨디션' : mealAdventure.mood === 'energized' ? '기운이 돌아왔어요' : '조금 배고파 보여요'}`)}</p>
            {mealAdventure.recipes.length > 0 && <p>발견한 조합: {mealAdventure.recipes.join(', ')}</p>}
            <p>이번 달 컬렉션: 아침 {mealAdventure.monthly.breakfast} · 점심 {mealAdventure.monthly.lunch} · 저녁 {mealAdventure.monthly.dinner}</p>
            <small>다음 보상: {mealAdventure.roomReward.title}까지 {mealAdventure.roomReward.remaining}끼</small>
          </section>
        </div>
      )}
    </section>
  )
}
