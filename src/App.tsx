import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { foodexRepository } from './data/foodexDb'
import type { FoodexRepository } from './data/foodexDb'
import { createSupabaseRepository } from './data/supabaseRepository'
import { createSyncRepository } from './data/syncRepository'
import { createCard } from './domain/cardRules'
import { buildProgression } from './domain/progression'
import { COLLECTION_SETS, COSMETICS, FOOD_CATALOG, REGIONS } from './domain/v3Content'
import type { CosmeticType, FoodCard, MealRecord } from './domain/types'
import type { FusionRecord, UserReward } from './data/foodexDb'
import type { AuthBootstrapResult } from './auth/anonymousSession'
import { CollectionScreen } from './features/collection/CollectionScreen'
import { ProtectCollection } from './features/account/ProtectCollection'
import { HomeScreen } from './features/home/HomeScreen'
import { PlayScreen } from './features/play/PlayScreen'
import { RecordFlow } from './features/record/RecordFlow'
import type { MealDraft } from './features/record/RecordFlow'
import { CardReveal } from './features/reveal/CardReveal'
import type { V3DiscoveryResult } from './features/reveal/V3DiscoverySummary'
import { SyncStatus } from './features/sync/SyncStatus'
import type { SyncState } from './features/sync/SyncStatus'
import { BottomNav } from './ui/BottomNav'
import './styles.css'

type Screen = 'home' | 'record' | 'collection' | 'play' | 'reveal'
type SaveError = 'quota' | 'generic' | undefined
type SaveMode = 'withPhoto' | 'withoutPhoto'
type ReadError = 'load' | 'history' | undefined

interface PendingDiscovery {
  meal: MealRecord
  card: FoodCard
}

const emptySummary = {
  todayCount: 0,
  discoveredCount: 0,
  totalXp: 0,
}

function makeMealId(now: number) {
  return `meal-${now}-${Math.random().toString(36).slice(2, 8)}`
}

function isQuotaError(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'QuotaExceededError'
}

function RecoveryAlert({ children, className = '' }: { children: ReactNode; className?: string }) {
  const alert = useRef<HTMLDivElement>(null)

  useEffect(() => {
    alert.current?.focus()
    alert.current?.scrollIntoView?.({ block: 'nearest' })
  }, [])

  return (
    <div className={`save-error ${className}`.trim()} ref={alert} role="alert" tabIndex={-1}>
      {children}
    </div>
  )
}

export function App({
  repository: providedRepository = foodexRepository,
  authResult: initialAuthResult,
}: {
  repository?: FoodexRepository
  authResult?: AuthBootstrapResult
}) {
  const [repository, setRepository] = useState<FoodexRepository>(providedRepository)
  const [screen, setScreen] = useState<Screen>('home')
  const [entries, setEntries] = useState<Array<{ card: FoodCard; meal: MealRecord }>>([])
  const [summary, setSummary] = useState(emptySummary)
  const [pending, setPending] = useState<PendingDiscovery>()
  const [saveError, setSaveError] = useState<SaveError>()
  const [readError, setReadError] = useState<ReadError>()
  const [failedDraft, setFailedDraft] = useState<MealDraft>()
  const [rewards, setRewards] = useState<UserReward[]>([])
  const [discovery, setDiscovery] = useState<V3DiscoveryResult>()
  const [syncState, setSyncState] = useState<SyncState>(
    initialAuthResult?.mode === 'local' ? 'local-only' : 'idle',
  )
  const [canProtectCollection, setCanProtectCollection] = useState(false)
  const [showProtection, setShowProtection] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMode, setSaveMode] = useState<SaveMode>('withPhoto')
  const latestRefresh = useRef(0)
  const supabaseClient = useRef<SupabaseClient | null>(null)
  const progression = useMemo(
    () => buildProgression(entries, Date.now(), rewards.map((reward) => reward.rewardId)),
    [entries, rewards],
  )

  const refresh = useCallback(async () => {
    const refreshId = ++latestRefresh.current

    try {
      const [nextEntries, nextSummary, nextRewards] = await Promise.all([
        repository.listCards(),
        repository.getSummary(Date.now()),
        repository.listRewards?.() ?? Promise.resolve(undefined),
      ])
      if (refreshId !== latestRefresh.current) return

      setEntries([...nextEntries].sort((left, right) => right.card.createdAt - left.card.createdAt))
      setSummary(nextSummary)
      if (nextRewards) setRewards(nextRewards)
      setReadError((error) => error === 'load' ? undefined : error)
    } catch {
      if (refreshId === latestRefresh.current) setReadError('load')
    }
  }, [repository])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (providedRepository !== foodexRepository || initialAuthResult) return
    let active = true
    void (async () => {
      const [{ supabase }, { ensureAnonymousSession }] = await Promise.all([
        import('./lib/supabase'),
        import('./auth/anonymousSession'),
      ])
      if (!active) return
      if (!supabase) {
        setSyncState('local-only')
        return
      }
      supabaseClient.current = supabase
      const auth = await ensureAnonymousSession(supabase)
      if (!active) return
      if (auth.mode === 'local') {
        setSyncState('local-only')
        return
      }

      const synced = createSyncRepository(
        foodexRepository,
        createSupabaseRepository(supabase, auth.userId),
      )
      setRepository(synced)
      setCanProtectCollection(auth.isAnonymous)
      setSyncState('syncing')
      try {
        await synced.migrateLegacyData()
        await synced.syncPending()
        if (active) setSyncState('idle')
      } catch {
        if (active) setSyncState('failed')
      }
    })()

    return () => {
      active = false
    }
  }, [initialAuthResult, providedRepository])

  useEffect(() => {
    const sync = () => {
      if (!repository.syncPending) return
      setSyncState('syncing')
      void repository.syncPending()
        .then(() => setSyncState('idle'))
        .catch(() => setSyncState('failed'))
    }
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [repository])

  const completeRecord = async (draft: MealDraft) => {
    const now = Date.now()
    const meal: MealRecord = {
      id: makeMealId(now),
      imageData: draft.imageData,
      foodType: draft.foodType,
      amount: draft.amount,
      recordedAt: now,
    }
    try {
      const history = await repository.getHistory()
      const card = createCard({ mealId: meal.id, foodType: meal.foodType, amount: meal.amount, now }, history)

      setPending({ meal, card })
      setFailedDraft(undefined)
      setReadError((error) => error === 'history' ? undefined : error)
      setSaveError(undefined)
      setSaveMode('withPhoto')
      setScreen('reveal')
    } catch {
      setFailedDraft(draft)
      setReadError('history')
    }
  }

  const savePending = async (mode: SaveMode = saveMode) => {
    if (!pending || isSaving) return

    setIsSaving(true)
    setSaveError(undefined)
    setSaveMode(mode)
    const withoutPhoto = mode === 'withoutPhoto'
    const meal = withoutPhoto ? { ...pending.meal, imageData: null } : pending.meal

    try {
      const nextProgression = buildProgression(
        [...entries, { meal, card: pending.card }],
        Date.now(),
        rewards.map((reward) => reward.rewardId),
      )
      const unlockedAt = Date.now()
      const newRewards = nextProgression.v3.newRewards.map((reward) => ({
        ...reward,
        key: `${reward.rewardType}:${reward.rewardId}`,
        id: crypto.randomUUID(),
        unlockedAt,
      }))

      await repository.saveMealAndCard(meal, pending.card, newRewards)
      const region = REGIONS.find((candidate) => candidate.id === pending.card.regionId)
      const completedSetTitles = nextProgression.v3.completedSetIds
        .filter((id) => !progression.v3.completedSetIds.includes(id))
        .flatMap((id) => {
          const set = COLLECTION_SETS.find((candidate) => candidate.id === id)
          return set ? [set.title] : []
        })
      const rewardTitles = newRewards.flatMap((reward) => {
        const cosmetic = COSMETICS.find((candidate) => candidate.id === reward.rewardId)
        const food = FOOD_CATALOG.find((candidate) => candidate.id === reward.rewardId)
        return cosmetic ? [cosmetic.title] : food ? [food.label] : []
      })
      const seasonTitles = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' } as const
      setDiscovery(pending.card.isNew && region ? {
        regionTitle: region.title,
        ...(pending.card.seasonId ? { seasonTitle: seasonTitles[pending.card.seasonId] } : {}),
        completedSetTitles,
        rewardTitles,
      } : undefined)
      setRewards((current) => [
        ...current,
        ...newRewards.filter((reward) => !current.some((item) => item.key === reward.key)),
      ])
      setPending(undefined)
      await refresh()
      setScreen('home')
    } catch (error) {
      setSaveError(isQuotaError(error) && !withoutPhoto ? 'quota' : 'generic')
    } finally {
      setIsSaving(false)
    }
  }

  const navigate = (tab: Exclude<Screen, 'reveal'>) => {
    setSaveError(undefined)
    setScreen(tab)
  }

  const activeTab = screen === 'reveal' ? 'record' : screen
  const historyRecovery = screen === 'record' && readError === 'history' && failedDraft ? (
    <RecoveryAlert>
      <p>카드를 만들 준비를 하지 못했어요. 다시 시도해 주세요.</p>
      <button type="button" onClick={() => void completeRecord(failedDraft)}>다시 카드 열기</button>
    </RecoveryAlert>
  ) : undefined
  const saveRecovery = saveError === 'quota' ? (
    <RecoveryAlert>
      <p>사진 저장 공간이 부족해요. 카드만 저장할까요?</p>
      <button type="button" onClick={() => void savePending('withoutPhoto')} disabled={isSaving}>카드만 저장</button>
    </RecoveryAlert>
  ) : saveError === 'generic' ? (
    <RecoveryAlert>
      <p>저장하지 못했어요. 다시 시도해 주세요.</p>
      <button type="button" onClick={() => void savePending()} disabled={isSaving}>다시 저장</button>
    </RecoveryAlert>
  ) : undefined

  return (
    <main className="app-shell">
      {screen === 'home' && (
        <HomeScreen
          summary={summary}
          level={progression.level}
          streak={progression.streak}
          dailyQuests={progression.dailyQuests}
          season={progression.season}
          rewardBox={progression.rewardBox}
          latestCards={entries}
          discovery={discovery}
          activeEvent={progression.v3.activeEvent}
          onRecord={() => navigate('record')}
          onOpenCollection={() => navigate('collection')}
        />
      )}
      {screen === 'record' && <RecordFlow onComplete={completeRecord} onCancel={() => navigate('home')} recovery={historyRecovery} />}
      {screen === 'collection' && <CollectionScreen entries={entries} progression={progression} />}
      {screen === 'play' && (
        <PlayScreen
          entries={entries}
          rewards={rewards}
          onFuse={(fusion: FusionRecord, reward: UserReward) => {
            setRewards((current) => current.some((item) => item.key === reward.key) ? current : [...current, reward])
            void repository.saveFusion?.(fusion)
            void repository.saveRewards?.([reward])
          }}
          onApplyCosmetic={(cardId: string, cosmetic: { type: CosmeticType; id: string }) => {
            setEntries((current) => current.map((entry) => {
              if (entry.card.id !== cardId) return entry
              const card = cosmetic.type === 'skin'
                ? { ...entry.card, skinId: cosmetic.id }
                : { ...entry.card, backgroundId: cosmetic.id }
              void repository.updateCard?.(card)
              return { ...entry, card }
            }))
          }}
        />
      )}
      {screen === 'home' && canProtectCollection && (
        <section className="account-protection">
          {!showProtection ? (
            <button type="button" className="inline-button" onClick={() => setShowProtection(true)}>
              내 도감 안전하게 보관하기
            </button>
          ) : (
            <ProtectCollection
              onProtect={async (email) => {
                if (!supabaseClient.current) throw new Error('cloud-unavailable')
                const result = await supabaseClient.current.auth.updateUser({ email })
                if (result.error) throw result.error
              }}
            />
          )}
        </section>
      )}
      <SyncStatus
        state={syncState}
        onRetry={repository.syncPending ? () => {
          setSyncState('syncing')
          void repository.syncPending?.()
            .then(() => setSyncState('idle'))
            .catch(() => setSyncState('failed'))
        } : undefined}
      />
      {readError === 'load' && (
        <RecoveryAlert className="app-read-error">
          <p>불러오지 못했어요. 다시 시도해 주세요.</p>
          <button type="button" onClick={() => void refresh()}>다시 불러오기</button>
        </RecoveryAlert>
      )}
      {screen === 'reveal' && pending && (
        <CardReveal
          card={pending.card}
          foodType={pending.meal.foodType}
          imageData={pending.meal.imageData}
          isSaving={isSaving}
          recovery={saveRecovery}
          onSave={() => void savePending('withPhoto')}
          onDiscard={() => { setPending(undefined); navigate('record') }}
        />
      )}
      {screen !== 'reveal' && <BottomNav active={activeTab} onNavigate={navigate} />}
    </main>
  )
}
