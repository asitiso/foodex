# Foodex V3 World Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Foodex V3 collection world with region, season, set, fusion, cosmetic, event, and secure Supabase synchronization features.

**Architecture:** Keep game content definitions in typed TypeScript catalogs and derive progress with pure functions. Persist each user's records, cards, rewards, and fusion history through a local-first repository that writes to IndexedDB immediately and synchronizes idempotently to Supabase under anonymous authentication and owner-scoped RLS.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, IndexedDB via `idb` 8, `@supabase/supabase-js` 2.111.0, Supabase Auth/Postgres/Storage, Vercel, Node.js 22+

## Global Constraints

- The first screen must never require sign-up or login.
- Missing Supabase configuration or a failed anonymous session must fall back to local-only mode.
- Existing IndexedDB meals and cards must remain readable throughout the upgrade.
- A meal UUID is created once and reused for every local and remote retry.
- Fusion never deletes or decrements either source card.
- Game rules are deterministic pure functions; persistence code does not decide rewards.
- Every table exposed through the Supabase Data API has RLS enabled.
- Every owner policy uses `(select auth.uid()) = user_id`, and UPDATE policies include both `USING` and `WITH CHECK`.
- The browser receives only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- The Supabase secret key and legacy service-role key never enter client code, `.env.example`, tests, or Vercel client variables.
- All user-facing copy remains Korean.
- All new interactive controls have accessible names and keyboard behavior.
- The production build runs on Node.js 22 or later.

---

## File Structure

### Content and rules

- `src/domain/types.ts`: extend persisted card and meal types without breaking V2 records.
- `src/domain/v3Content.ts`: canonical typed catalogs for regions, seasons, sets, fusions, cosmetics, and events.
- `src/domain/v3Progression.ts`: pure V3 discovery, completion, reward, filter, and fusion rules.
- `src/domain/v3Content.test.ts`: catalog integrity tests.
- `src/domain/v3Progression.test.ts`: behavior and idempotency tests.

### Supabase and local-first data

- `src/lib/supabase.ts`: environment validation and client creation.
- `src/auth/anonymousSession.ts`: invisible anonymous session bootstrap.
- `src/auth/anonymousSession.test.ts`: session reuse and failure tests.
- `src/data/foodexDb.ts`: IndexedDB v2 stores, sync state, settings, rewards, and fusion history.
- `src/data/foodexDb.test.ts`: upgrade and local queue tests.
- `src/data/supabaseRepository.ts`: owner-scoped remote reads, idempotent writes, and private photo uploads.
- `src/data/supabaseRepository.test.ts`: mocked Supabase client contract tests.
- `src/data/syncRepository.ts`: local-first facade and retry synchronization.
- `src/data/syncRepository.test.ts`: offline, retry, and migration tests.
- `supabase/schema/foodex_v3.sql`: reviewed canonical schema, grants, RLS policies, indexes, and Storage policies.
- `supabase/tests/foodex_v3_rls.sql`: SQL verification queries for owner isolation and constraints.

### UI

- `src/features/collection/CollectionScreen.tsx`: shell for cards, world, and sets tabs.
- `src/features/collection/CardCollectionTab.tsx`: multi-filter card grid.
- `src/features/collection/WorldMapTab.tsx`: region progress.
- `src/features/collection/SetDexTab.tsx`: set requirements and rewards.
- `src/features/play/PlayScreen.tsx`: play-area shell.
- `src/features/play/FusionLab.tsx`: source selection and fusion result.
- `src/features/play/Wardrobe.tsx`: skin/background ownership and application.
- `src/features/account/ProtectCollection.tsx`: optional email-linking surface.
- `src/features/sync/SyncStatus.tsx`: local-only, syncing, failed, and retry states.
- `src/features/reveal/V3DiscoverySummary.tsx`: region/season/set/reward result after saving.
- `src/features/home/HomeScreen.tsx`: active event and V3 progress summaries.
- `src/ui/BottomNav.tsx`: four-tab navigation.
- `src/App.tsx`: session bootstrap, repository selection, screen routing, and save orchestration.
- `src/styles.css`: responsive V3 world, set, fusion, wardrobe, and sync-state presentation.

### Configuration

- `.env.example`: public Supabase variable names only.
- `package.json`: pinned Supabase dependency and Node engine.
- `package-lock.json`: exact dependency graph.
- `vercel.json`: Node.js 22 build declaration while retaining Vite output configuration.

---

### Task 1: Typed V3 Content Catalog

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/v3Content.ts`
- Create: `src/domain/v3Content.test.ts`

**Interfaces:**
- Produces: `RegionId`, `SeasonId`, `CosmeticType`, `FoodCatalogItem`, `CollectionSet`, `FusionRecipe`, `CosmeticItem`, `FoodEvent`.
- Produces: `FOOD_CATALOG`, `REGIONS`, `SEASONS`, `COLLECTION_SETS`, `FUSION_RECIPES`, `COSMETICS`, `FOOD_EVENTS`.
- Consumes: existing `FoodType` and `Rarity`.

- [ ] **Step 1: Write catalog integrity tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  COLLECTION_SETS,
  COSMETICS,
  FOOD_CATALOG,
  FOOD_EVENTS,
  FUSION_RECIPES,
  REGIONS,
} from './v3Content'

describe('V3 content catalog', () => {
  it('references only existing food, region, and cosmetic ids', () => {
    const foodIds = new Set(FOOD_CATALOG.map((food) => food.id))
    const regionIds = new Set(REGIONS.map((region) => region.id))
    const cosmeticIds = new Set(COSMETICS.map((cosmetic) => cosmetic.id))

    FOOD_CATALOG.forEach((food) => expect(regionIds.has(food.regionId)).toBe(true))
    COLLECTION_SETS.forEach((set) => {
      set.requiredCatalogIds.forEach((id) => expect(foodIds.has(id)).toBe(true))
      expect(cosmeticIds.has(set.reward.rewardId)).toBe(true)
    })
    FUSION_RECIPES.forEach((recipe) => {
      expect(foodIds.has(recipe.leftCatalogId)).toBe(true)
      expect(foodIds.has(recipe.rightCatalogId)).toBe(true)
    })
    FOOD_EVENTS.forEach((event) => expect(foodIds.has(event.rewardCatalogId)).toBe(true))
  })

  it('has unique ids and order-independent fusion pairs', () => {
    const ids = FOOD_CATALOG.map((food) => food.id)
    const pairs = FUSION_RECIPES.map((recipe) =>
      [recipe.leftCatalogId, recipe.rightCatalogId].sort().join(':'),
    )
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(pairs).size).toBe(pairs.length)
  })
})
```

- [ ] **Step 2: Run the catalog test and verify it fails**

Run: `npm run test:run -- src/domain/v3Content.test.ts`

Expected: FAIL because `./v3Content` does not exist.

- [ ] **Step 3: Extend domain types**

Add these exports to `src/domain/types.ts`, and add `dumpling`, `sushi`, and `pasta` to `FoodType` and `FOOD_META`:

```ts
export type RegionId = 'korea' | 'china' | 'japan' | 'west' | 'snack-island'
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter'
export type CosmeticType = 'skin' | 'background'

export interface FoodCard {
  id: string
  mealId: string
  catalogId: string
  name: string
  rarity: Rarity
  quote: string
  xp: number
  isNew: boolean
  regionId: RegionId
  seasonId?: SeasonId
  evolutionStage: number
  skinId?: string
  backgroundId?: string
  createdAt: number
}
```

For legacy V2 rows, the IndexedDB deserializer introduced in Task 5 supplies missing fields from `foodType`; persisted fields are required after normalization.

- [ ] **Step 4: Create the catalog with initial playable content**

Implement `src/domain/v3Content.ts` with these minimum definitions:

```ts
import type {
  CosmeticType,
  FoodType,
  Rarity,
  RegionId,
  SeasonId,
} from './types'

export interface FoodCatalogItem {
  id: string
  foodType: FoodType
  label: string
  regionId: RegionId
  seasonId?: SeasonId
  rarity: Rarity
}

export interface CollectionSet {
  id: string
  title: string
  requiredCatalogIds: readonly string[]
  reward: { rewardType: CosmeticType; rewardId: string }
}

export interface FusionRecipe {
  id: string
  leftCatalogId: string
  rightCatalogId: string
  resultName: string
  resultRarity: Rarity
}

export interface CosmeticItem {
  id: string
  type: CosmeticType
  title: string
  className: string
}

export interface FoodEvent {
  id: string
  title: string
  startsAt: string
  endsAt: string
  requiredCatalogIds: readonly string[]
  rewardCatalogId: string
}

export const REGIONS = [
  { id: 'korea', title: '한식마을' },
  { id: 'china', title: '중화항구' },
  { id: 'japan', title: '일식숲' },
  { id: 'west', title: '양식언덕' },
  { id: 'snack-island', title: '간식섬' },
] as const

export const FOOD_CATALOG: readonly FoodCatalogItem[] = [
  { id: 'ramen', foodType: 'ramen', label: '불꽃 라면', regionId: 'korea', rarity: 'rare' },
  { id: 'rice', foodType: 'rice', label: '든든 밥방패', regionId: 'korea', rarity: 'common' },
  { id: 'fruit', foodType: 'fruit', label: '햇살 과일단', regionId: 'snack-island', seasonId: 'summer', rarity: 'rare' },
  { id: 'bread', foodType: 'bread', label: '폭신 빵구름', regionId: 'west', seasonId: 'winter', rarity: 'common' },
  { id: 'side', foodType: 'side', label: '든든 반찬대', regionId: 'korea', rarity: 'common' },
  { id: 'snack', foodType: 'snack', label: '반짝 간식별', regionId: 'snack-island', rarity: 'common' },
  { id: 'drink', foodType: 'drink', label: '찰랑 음료물결', regionId: 'snack-island', seasonId: 'summer', rarity: 'common' },
  { id: 'dumpling', foodType: 'dumpling', label: '구름 만두', regionId: 'china', seasonId: 'winter', rarity: 'rare' },
  { id: 'sushi', foodType: 'sushi', label: '초밥 닌자', regionId: 'japan', seasonId: 'spring', rarity: 'epic' },
  { id: 'pasta', foodType: 'pasta', label: '파스타 마법사', regionId: 'west', seasonId: 'autumn', rarity: 'rare' },
  { id: 'other', foodType: 'other', label: '새로운 발견대', regionId: 'west', rarity: 'common' },
] as const

export const COSMETICS: readonly CosmeticItem[] = [
  { id: 'street-festival', type: 'skin', title: '분식 축제 스킨', className: 'skin-street-festival' },
  { id: 'sunny-picnic', type: 'background', title: '햇살 소풍 배경', className: 'background-sunny-picnic' },
  { id: 'cozy-morning', type: 'background', title: '포근한 아침 배경', className: 'background-cozy-morning' },
] as const

export const COLLECTION_SETS: readonly CollectionSet[] = [
  { id: 'street-team', title: '분식 탐험대', requiredCatalogIds: ['ramen', 'rice', 'snack'], reward: { rewardType: 'skin', rewardId: 'street-festival' } },
  { id: 'sunny-bites', title: '햇살 한입단', requiredCatalogIds: ['fruit', 'drink'], reward: { rewardType: 'background', rewardId: 'sunny-picnic' } },
  { id: 'cozy-breakfast', title: '포근한 아침', requiredCatalogIds: ['bread', 'fruit', 'drink'], reward: { rewardType: 'background', rewardId: 'cozy-morning' } },
] as const

export const FUSION_RECIPES: readonly FusionRecipe[] = [
  { id: 'ramen-rice-hero', leftCatalogId: 'ramen', rightCatalogId: 'rice', resultName: '라밥 용사', resultRarity: 'epic' },
  { id: 'fruit-drink-fairy', leftCatalogId: 'fruit', rightCatalogId: 'drink', resultName: '과일소다 요정', resultRarity: 'legendary' },
  { id: 'bread-fruit-cloud', leftCatalogId: 'bread', rightCatalogId: 'fruit', resultName: '과일샌드 구름', resultRarity: 'epic' },
] as const

export const FOOD_EVENTS: readonly FoodEvent[] = [
  {
    id: 'summer-table-2026',
    title: '2026 여름 식탁',
    startsAt: '2026-06-01T00:00:00+09:00',
    endsAt: '2026-08-31T23:59:59+09:00',
    requiredCatalogIds: ['fruit', 'drink', 'ramen'],
    rewardCatalogId: 'fruit',
  },
] as const

export const SEASONS: readonly SeasonId[] = ['spring', 'summer', 'autumn', 'winter']
```

- [ ] **Step 5: Run the catalog and existing card tests**

Run: `npm run test:run -- src/domain/v3Content.test.ts src/domain/cardRules.test.ts`

Expected: PASS after updating `createCard()` fixtures and output with catalog metadata.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/cardRules.ts src/domain/cardRules.test.ts src/domain/v3Content.ts src/domain/v3Content.test.ts
git commit -m "feat: define Foodex V3 content catalog"
```

---

### Task 2: Deterministic V3 Progression Engine

**Files:**
- Create: `src/domain/v3Progression.ts`
- Create: `src/domain/v3Progression.test.ts`
- Modify: `src/domain/progression.ts`
- Modify: `src/domain/progression.test.ts`

**Interfaces:**
- Consumes: `FOOD_CATALOG`, `REGIONS`, `COLLECTION_SETS`, `FUSION_RECIPES`, `FOOD_EVENTS`.
- Produces: `buildV3Progress(entries, unlockedRewardIds, now)`.
- Produces: `resolveFusion(leftCard, rightCard)`.
- Produces: `filterCollection(entries, filters)`.

- [ ] **Step 1: Write failing progression tests**

```ts
import { describe, expect, it } from 'vitest'
import { buildV3Progress, resolveFusion } from './v3Progression'
import type { FoodCard, MealRecord } from './types'

function entry(catalogId: string, regionId: FoodCard['regionId']) {
  const meal = {
    id: `meal-${catalogId}`,
    imageData: null,
    foodType: catalogId,
    amount: 'taste',
    recordedAt: Date.parse('2026-07-30T12:00:00+09:00'),
  } as MealRecord
  const card = {
    id: `card-${catalogId}`,
    mealId: meal.id,
    catalogId,
    name: catalogId,
    rarity: 'common',
    quote: 'test',
    xp: 10,
    isNew: true,
    regionId,
    seasonId: catalogId === 'fruit' ? 'summer' : undefined,
    evolutionStage: 1,
    createdAt: meal.recordedAt,
  } as FoodCard
  return { meal, card }
}

describe('V3 progression', () => {
  it('counts unique discoveries and grants each completed set once', () => {
    const entries = [
      entry('fruit', 'snack-island'),
      entry('drink', 'snack-island'),
      entry('fruit', 'snack-island'),
    ]
    const progress = buildV3Progress(entries, [], Date.parse('2026-07-30T12:00:00+09:00'))

    expect(progress.regions.find((region) => region.id === 'snack-island')?.discovered).toBe(2)
    expect(progress.completedSetIds).toContain('sunny-bites')
    expect(progress.newRewards).toEqual([
      expect.objectContaining({ rewardId: 'sunny-picnic', sourceId: 'sunny-bites' }),
    ])
    expect(buildV3Progress(entries, ['sunny-picnic'], Date.now()).newRewards).toEqual([])
  })

  it('keeps source cards and resolves fusion regardless of selection order', () => {
    const ramen = entry('ramen', 'korea').card
    const rice = entry('rice', 'korea').card
    expect(resolveFusion(ramen, rice)?.id).toBe('ramen-rice-hero')
    expect(resolveFusion(rice, ramen)?.id).toBe('ramen-rice-hero')
    expect([ramen.id, rice.id]).toEqual(['card-ramen', 'card-rice'])
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:run -- src/domain/v3Progression.test.ts`

Expected: FAIL because `buildV3Progress` and `resolveFusion` do not exist.

- [ ] **Step 3: Implement pure V3 rules**

Create these public shapes and functions in `src/domain/v3Progression.ts`:

```ts
export interface V3RewardGrant {
  rewardType: 'skin' | 'background' | 'event-card' | 'fusion-card'
  rewardId: string
  sourceType: 'set' | 'event'
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
    completed: number
    total: number
    endsAt: string
  }
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

export function resolveFusion(left: FoodCard, right: FoodCard) {
  const pair = [left.catalogId, right.catalogId].sort().join(':')
  return FUSION_RECIPES.find((recipe) =>
    [recipe.leftCatalogId, recipe.rightCatalogId].sort().join(':') === pair,
  )
}
```

`buildV3Progress()` must use sets of `catalogId`, calculate region totals from `FOOD_CATALOG`, return only rewards absent from `unlockedRewardIds`, and select events whose inclusive time range contains `now`.

- [ ] **Step 4: Compose V3 progress with existing V2 progress**

Add a `v3` field to `Progression` in `src/domain/progression.ts` and call:

```ts
v3: buildV3Progress(entries, unlockedRewardIds, now)
```

Change `buildProgression` to accept `unlockedRewardIds: readonly string[] = []` as its third argument.

- [ ] **Step 5: Run domain tests**

Run: `npm run test:run -- src/domain`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/v3Progression.ts src/domain/v3Progression.test.ts src/domain/progression.ts src/domain/progression.test.ts
git commit -m "feat: derive Foodex V3 collection progress"
```

---

### Task 3: Supabase Client and Invisible Anonymous Session

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.env.example`
- Create: `src/lib/supabase.ts`
- Create: `src/auth/anonymousSession.ts`
- Create: `src/auth/anonymousSession.test.ts`

**Interfaces:**
- Produces: `createSupabaseClient(env): SupabaseClient | null`.
- Produces: `ensureAnonymousSession(client): Promise<AuthBootstrapResult>`.
- Consumes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

- [ ] **Step 1: Pin the Supabase client and Node version**

Run: `npm install --save-exact @supabase/supabase-js@2.111.0`

Add to `package.json`:

```json
"engines": {
  "node": ">=22"
}
```

Expected: `package-lock.json` records exact resolved versions.

- [ ] **Step 2: Write session bootstrap tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import { ensureAnonymousSession } from './anonymousSession'

describe('anonymous session bootstrap', () => {
  it('reuses an existing session', async () => {
    const signInAnonymously = vi.fn()
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-1', is_anonymous: true } } },
          error: null,
        }),
        signInAnonymously,
      },
    }
    const result = await ensureAnonymousSession(client as never)
    expect(result).toEqual({ mode: 'cloud', userId: 'user-1', isAnonymous: true })
    expect(signInAnonymously).not.toHaveBeenCalled()
  })

  it('returns local mode instead of blocking when anonymous sign-in fails', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: new Error('offline'),
        }),
      },
    }
    expect(await ensureAnonymousSession(client as never)).toEqual({
      mode: 'local',
      reason: 'auth-unavailable',
    })
  })
})
```

- [ ] **Step 3: Run the test and verify it fails**

Run: `npm run test:run -- src/auth/anonymousSession.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 4: Implement environment-safe client creation**

```ts
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient(env: ImportMetaEnv = import.meta.env) {
  const url = env.VITE_SUPABASE_URL
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) return null
  return createClient(url, publishableKey)
}

export const supabase = createSupabaseClient()
```

Create `.env.example`:

```dotenv
VITE_SUPABASE_URL=https://project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_project_key
```

- [ ] **Step 5: Implement non-blocking session bootstrap**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type AuthBootstrapResult =
  | { mode: 'cloud'; userId: string; isAnonymous: boolean }
  | { mode: 'local'; reason: 'missing-config' | 'auth-unavailable' }

export async function ensureAnonymousSession(client: SupabaseClient): Promise<AuthBootstrapResult> {
  const existing = await client.auth.getSession()
  if (existing.data.session) {
    return {
      mode: 'cloud',
      userId: existing.data.session.user.id,
      isAnonymous: existing.data.session.user.is_anonymous ?? false,
    }
  }

  const created = await client.auth.signInAnonymously()
  if (created.error || !created.data.user) return { mode: 'local', reason: 'auth-unavailable' }
  return {
    mode: 'cloud',
    userId: created.data.user.id,
    isAnonymous: true,
  }
}
```

- [ ] **Step 6: Run auth tests and build**

Run: `npm run test:run -- src/auth/anonymousSession.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS with no secret-key reference in `dist`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example src/lib/supabase.ts src/auth/anonymousSession.ts src/auth/anonymousSession.test.ts
git commit -m "feat: bootstrap Supabase anonymous sessions"
```

---

### Task 4: Supabase Schema, Grants, RLS, and Private Photo Storage

**Files:**
- Create: `supabase/schema/foodex_v3.sql`
- Create: `supabase/tests/foodex_v3_rls.sql`
- Create during execution with `supabase migration new foodex_v3_schema`: CLI-generated migration file under `supabase/migrations/`

**Interfaces:**
- Produces tables: `profiles`, `meal_records`, `food_cards`, `user_rewards`, `fusion_history`.
- Produces private bucket: `meal-photos`.
- Consumes: Supabase authenticated user UUID.

- [ ] **Step 1: Discover the installed Supabase CLI**

Run: `npx supabase --help`

Expected: help output lists `migration`, `db`, and `projects` commands.

Run: `npx supabase migration new --help`

Expected: help output documents migration creation.

- [ ] **Step 2: Create the canonical schema SQL**

Write `supabase/schema/foodex_v3.sql` with:

```sql
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  level integer not null default 1 check (level >= 1),
  total_xp integer not null default 0 check (total_xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_recorded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_records (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_type text not null,
  amount text not null check (amount in ('taste', 'half', 'almostAll')),
  recorded_at timestamptz not null,
  photo_path text,
  client_created_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.food_cards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references public.meal_records(id) on delete cascade,
  catalog_id text not null,
  name text not null,
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  quote text not null,
  xp integer not null check (xp >= 0),
  region_id text not null,
  season_id text,
  evolution_stage integer not null default 1 check (evolution_stage between 1 and 4),
  skin_id text,
  background_id text,
  created_at timestamptz not null,
  unique (user_id, meal_id)
);

create table if not exists public.user_rewards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_type text not null check (reward_type in ('skin', 'background', 'event-card', 'fusion-card')),
  reward_id text not null,
  source_type text not null check (source_type in ('set', 'event')),
  source_id text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, reward_type, reward_id)
);

create table if not exists public.fusion_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  left_card_id uuid not null references public.food_cards(id) on delete restrict,
  right_card_id uuid not null references public.food_cards(id) on delete restrict,
  fusion_catalog_id text not null,
  created_at timestamptz not null default now(),
  check (left_card_id <> right_card_id)
);

create index if not exists meal_records_user_recorded_idx
  on public.meal_records (user_id, recorded_at desc);
create index if not exists food_cards_user_created_idx
  on public.food_cards (user_id, created_at desc);
create index if not exists food_cards_meal_id_idx
  on public.food_cards (meal_id);
create index if not exists user_rewards_user_id_idx
  on public.user_rewards (user_id);
create index if not exists fusion_history_user_created_idx
  on public.fusion_history (user_id, created_at desc);
create index if not exists fusion_history_left_card_idx
  on public.fusion_history (left_card_id);
create index if not exists fusion_history_right_card_idx
  on public.fusion_history (right_card_id);

alter table public.profiles enable row level security;
alter table public.meal_records enable row level security;
alter table public.food_cards enable row level security;
alter table public.user_rewards enable row level security;
alter table public.fusion_history enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.meal_records to authenticated;
grant select, insert, update, delete on public.food_cards to authenticated;
grant select, insert on public.user_rewards to authenticated;
grant select, insert on public.fusion_history to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "meals_select_own" on public.meal_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "meals_insert_own" on public.meal_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meals_update_own" on public.meal_records
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "meals_delete_own" on public.meal_records
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "cards_select_own" on public.food_cards
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "cards_insert_own" on public.food_cards
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cards_update_own" on public.food_cards
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "cards_delete_own" on public.food_cards
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "rewards_select_own" on public.user_rewards
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "rewards_insert_own" on public.user_rewards
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "fusions_select_own" on public.fusion_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "fusions_insert_own" on public.fusion_history
  for insert to authenticated with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "meal_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "meal_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "meal_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
```

- [ ] **Step 3: Create the migration through the CLI**

Run: `npx supabase migration new foodex_v3_schema`

Expected: the CLI prints the generated migration path.

Copy the reviewed contents of `supabase/schema/foodex_v3.sql` into exactly the generated migration file.

- [ ] **Step 4: Write SQL verification queries**

Create `supabase/tests/foodex_v3_rls.sql`:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'meal_records', 'food_cards', 'user_rewards', 'fusion_history')
order by tablename;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'meal_records', 'food_cards', 'user_rewards', 'fusion_history')
order by tablename, policyname;

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'meal_records_user_recorded_idx',
    'food_cards_user_created_idx',
    'food_cards_meal_id_idx',
    'user_rewards_user_id_idx',
    'fusion_history_user_created_idx',
    'fusion_history_left_card_idx',
    'fusion_history_right_card_idx'
  )
order by indexname;
```

- [ ] **Step 5: Apply to the connected development project**

Use the Supabase SQL execution tool to run the generated migration. Do not use `apply_migration` while iterating.

Expected: all statements succeed once.

- [ ] **Step 6: Run security and performance advisors**

Use the Supabase advisors tool after schema application.

Expected: no error-level missing-RLS, insecure-policy, or missing-foreign-key-index finding for the five app tables.

- [ ] **Step 7: Verify Data API visibility and RLS**

Run the SQL in `supabase/tests/foodex_v3_rls.sql`.

Expected:

- five public tables report `rowsecurity = true`;
- owner policies exist for every granted operation;
- all seven named indexes exist;
- an authenticated user cannot select another user's rows;
- an authenticated user cannot upload outside `{auth.uid()}/{meal-id}/original.jpg` in `meal-photos`.

- [ ] **Step 8: Commit**

```bash
git add supabase/schema/foodex_v3.sql supabase/tests/foodex_v3_rls.sql supabase/migrations
git commit -m "feat: secure Foodex V3 Supabase schema"
```

---

### Task 5: IndexedDB V2 Upgrade and Local Sync Queue

**Files:**
- Modify: `src/data/foodexDb.ts`
- Modify: `src/data/foodexDb.test.ts`
- Create: `src/data/normalizers.ts`
- Create: `src/data/normalizers.test.ts`

**Interfaces:**
- Produces: `SyncQueueItem`, `UserReward`, `FusionRecord`, `LocalSettings`.
- Produces repository methods `enqueueSync`, `listPendingSync`, `markSynced`, `saveRewards`, `listRewards`, `saveFusion`, `listFusions`, `getSetting`, `setSetting`.
- Consumes legacy V2 `MealRecord` and `FoodCard` rows.

- [ ] **Step 1: Write failing upgrade and normalization tests**

```ts
it('normalizes a V2 card with V3 catalog metadata', () => {
  expect(normalizeCard({
    id: 'card-1',
    mealId: 'meal-1',
    name: '불꽃 라면',
    rarity: 'rare',
    quote: 'test',
    xp: 20,
    isNew: true,
    createdAt: 1,
  }, 'ramen')).toEqual(expect.objectContaining({
    catalogId: 'ramen',
    regionId: 'korea',
    evolutionStage: 1,
  }))
})

it('keeps one pending sync item per meal', async () => {
  const repo = createFoodexRepository(databaseName)
  await repo.enqueueSync({ kind: 'meal-card', mealId: 'meal-1', attempts: 0 })
  await repo.enqueueSync({ kind: 'meal-card', mealId: 'meal-1', attempts: 1 })
  expect(await repo.listPendingSync()).toEqual([
    expect.objectContaining({ mealId: 'meal-1', attempts: 1 }),
  ])
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm run test:run -- src/data/normalizers.test.ts src/data/foodexDb.test.ts`

Expected: FAIL because normalization and queue APIs do not exist.

- [ ] **Step 3: Upgrade IndexedDB to version 2**

Add these stores without deleting `meals` or `cards`:

```ts
syncQueue: {
  key: string
  value: SyncQueueItem
}
rewards: {
  key: string
  value: UserReward
}
fusions: {
  key: string
  value: FusionRecord
}
settings: {
  key: string
  value: { key: string; value: string }
}
```

Use this upgrade structure:

```ts
return openDB<FoodexDatabaseSchema>(name, 2, {
  upgrade(database) {
    if (!database.objectStoreNames.contains('meals')) {
      database.createObjectStore('meals', { keyPath: 'id' })
    }
    if (!database.objectStoreNames.contains('cards')) {
      const cards = database.createObjectStore('cards', { keyPath: 'id' })
      cards.createIndex('createdAt', 'createdAt')
    }
    if (!database.objectStoreNames.contains('syncQueue')) {
      database.createObjectStore('syncQueue', { keyPath: 'mealId' })
    }
    if (!database.objectStoreNames.contains('rewards')) {
      database.createObjectStore('rewards', { keyPath: 'key' })
    }
    if (!database.objectStoreNames.contains('fusions')) {
      database.createObjectStore('fusions', { keyPath: 'id' })
    }
    if (!database.objectStoreNames.contains('settings')) {
      database.createObjectStore('settings', { keyPath: 'key' })
    }
  },
})
```

`syncQueue` uses `mealId` as its key for meal-card work, so retries replace rather than duplicate the item.

- [ ] **Step 4: Normalize legacy cards at repository boundaries**

Implement:

```ts
export function normalizeCard(card: LegacyOrV3FoodCard, foodType: FoodType): FoodCard {
  const catalog = FOOD_CATALOG.find((item) => item.foodType === foodType)
    ?? FOOD_CATALOG.find((item) => item.id === 'other')!
  return {
    ...card,
    catalogId: card.catalogId ?? catalog.id,
    regionId: card.regionId ?? catalog.regionId,
    seasonId: card.seasonId ?? catalog.seasonId,
    evolutionStage: card.evolutionStage ?? 1,
  }
}
```

`listCards()` returns normalized V3 cards while the underlying existing records remain intact.

- [ ] **Step 5: Implement queue, reward, fusion, and setting methods**

All methods write with IndexedDB `put`; reward keys use `${rewardType}:${rewardId}`, fusion keys use fusion record UUIDs, and settings use their setting name.

- [ ] **Step 6: Run local data tests**

Run: `npm run test:run -- src/data`

Expected: PASS, including existing atomic meal/card behavior.

- [ ] **Step 7: Commit**

```bash
git add src/data/foodexDb.ts src/data/foodexDb.test.ts src/data/normalizers.ts src/data/normalizers.test.ts
git commit -m "feat: add Foodex local sync queue"
```

---

### Task 6: Supabase Remote Repository and Photo Upload

**Files:**
- Create: `src/data/supabaseRepository.ts`
- Create: `src/data/supabaseRepository.test.ts`

**Interfaces:**
- Produces: `SupabaseFoodexRepository`.
- Produces: `uploadMealPhoto(userId, mealId, imageData)`.
- Produces: `upsertMealBundle(userId, meal, card, rewards)`.
- Consumes: authenticated `SupabaseClient`.

- [ ] **Step 1: Write mocked remote repository tests**

```ts
it('uploads to the current user and fixed meal path', async () => {
  const client = createMockSupabase()
  const repo = createSupabaseRepository(client, 'user-1')
  await repo.uploadMealPhoto('meal-1', 'data:image/jpeg;base64,dGVzdA==')
  expect(client.storage.from).toHaveBeenCalledWith('meal-photos')
  expect(client.storage.upload).toHaveBeenCalledWith(
    'user-1/meal-1/original.jpg',
    expect.any(Blob),
    { contentType: 'image/jpeg', upsert: true },
  )
})

it('uses upsert conflict keys so retries are idempotent', async () => {
  const client = createMockSupabase()
  const repo = createSupabaseRepository(client, 'user-1')
  await repo.upsertMealBundle(meal, card, [reward])
  expect(client.table('meal_records').upsert).toHaveBeenCalledWith(
    expect.objectContaining({ id: meal.id, user_id: 'user-1' }),
    { onConflict: 'id' },
  )
  expect(client.table('food_cards').upsert).toHaveBeenCalledWith(
    expect.objectContaining({ meal_id: meal.id, user_id: 'user-1' }),
    { onConflict: 'user_id,meal_id' },
  )
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:run -- src/data/supabaseRepository.test.ts`

Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Implement data URL conversion and private upload**

```ts
function dataUrlToBlob(dataUrl: string) {
  const [header, payload] = dataUrl.split(',')
  const mime = header.match(/^data:(.*?);base64$/)?.[1] ?? 'image/jpeg'
  const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0))
  return { blob: new Blob([bytes], { type: mime }), mime }
}

async function uploadMealPhoto(mealId: string, imageData: string) {
  const { blob, mime } = dataUrlToBlob(imageData)
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${mealId}/original.${extension}`
  const result = await client.storage.from('meal-photos').upload(path, blob, {
    contentType: mime,
    upsert: true,
  })
  if (result.error) throw result.error
  return path
}
```

- [ ] **Step 4: Implement owner-scoped reads and idempotent writes**

Every inserted row includes `user_id: userId`. Reads include `.eq('user_id', userId)` for clarity even though RLS is the security boundary. Upserts use table constraints:

```ts
await client.from('meal_records').upsert(mealRow, { onConflict: 'id' })
await client.from('food_cards').upsert(cardRow, { onConflict: 'user_id,meal_id' })
await client.from('user_rewards').upsert(rewardRows, {
  onConflict: 'user_id,reward_type,reward_id',
  ignoreDuplicates: true,
})
```

Throw on the first returned Supabase error and let the local sync queue retain the work.

- [ ] **Step 5: Run repository tests**

Run: `npm run test:run -- src/data/supabaseRepository.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/supabaseRepository.ts src/data/supabaseRepository.test.ts
git commit -m "feat: sync Foodex records to Supabase"
```

---

### Task 7: Local-First Synchronization and V2 Migration

**Files:**
- Create: `src/data/syncRepository.ts`
- Create: `src/data/syncRepository.test.ts`
- Modify: `src/data/foodexDb.ts`

**Interfaces:**
- Produces: `createSyncRepository(local, remote?)`.
- Produces: `syncPending()`, `migrateLegacyData()`, `retryPhoto(mealId)`.
- Consumes: local repository and optional `SupabaseFoodexRepository`.

- [ ] **Step 1: Write offline and retry tests**

```ts
it('saves locally before a failing remote write', async () => {
  const local = createMemoryLocalRepository()
  const remote = createMemoryRemoteRepository({ fail: true })
  const repo = createSyncRepository(local, remote)

  await repo.saveMealAndCard(meal, card, [])

  expect(await local.listCards()).toHaveLength(1)
  expect(await local.listPendingSync()).toEqual([
    expect.objectContaining({ mealId: meal.id, attempts: 1 }),
  ])
})

it('retries one meal without duplicating its card or rewards', async () => {
  const local = createMemoryLocalRepositoryWithPending(meal, card, [reward])
  const remote = createMemoryRemoteRepository()
  const repo = createSyncRepository(local, remote)

  await repo.syncPending()
  await repo.syncPending()

  expect(remote.meals).toHaveLength(1)
  expect(remote.cards).toHaveLength(1)
  expect(remote.rewards).toHaveLength(1)
  expect(await local.listPendingSync()).toEqual([])
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm run test:run -- src/data/syncRepository.test.ts`

Expected: FAIL because `createSyncRepository` does not exist.

- [ ] **Step 3: Implement local-first saving**

```ts
async function saveMealAndCard(meal: MealRecord, card: FoodCard, rewards: V3RewardGrant[]) {
  await local.saveMealAndCard(meal, card)
  await local.saveRewards(rewards)
  await local.enqueueSync({ kind: 'meal-card', mealId: meal.id, attempts: 0 })
  if (remote) await syncMeal(meal.id)
}
```

`syncMeal()` loads the exact local meal, card, and associated rewards, uploads the photo, upserts all rows, and removes the queue item only after remote reads confirm the meal and card IDs.

- [ ] **Step 4: Implement startup and reconnect synchronization**

`syncPending()` processes queue items sequentially to avoid saturating mobile connections. On failure it increments `attempts`, stores a short error code, and continues to the next item. Listen to `window.online` in `App`, not inside the repository, and call `syncPending()` once per reconnect event.

- [ ] **Step 5: Implement safe legacy migration**

`migrateLegacyData()`:

1. checks `migration_complete`;
2. reads normalized local entries;
3. enqueues every meal ID using `put`;
4. calls `syncPending()`;
5. re-reads remote IDs;
6. writes `migration_complete = 'true'` only if every local meal and card ID exists remotely;
7. never deletes local records.

- [ ] **Step 6: Run sync tests**

Run: `npm run test:run -- src/data/syncRepository.test.ts src/data/foodexDb.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/data/syncRepository.ts src/data/syncRepository.test.ts src/data/foodexDb.ts
git commit -m "feat: add offline Foodex synchronization"
```

---

### Task 8: V3 Collection Tabs

**Files:**
- Modify: `src/features/collection/CollectionScreen.tsx`
- Modify: `src/features/collection/CollectionScreen.test.tsx`
- Create: `src/features/collection/CardCollectionTab.tsx`
- Create: `src/features/collection/WorldMapTab.tsx`
- Create: `src/features/collection/SetDexTab.tsx`

**Interfaces:**
- Consumes: normalized entries and `Progression['v3']`.
- Produces: accessible `cards`, `world`, and `sets` tab panels.

- [ ] **Step 1: Write the collection interaction tests**

```ts
it('switches between cards, world, and set panels', async () => {
  const user = userEvent.setup()
  render(<CollectionScreen entries={entries} progression={progression} />)

  await user.click(screen.getByRole('tab', { name: '세계지도' }))
  expect(screen.getByRole('tabpanel', { name: '세계지도' })).toHaveTextContent('한식마을')

  await user.click(screen.getByRole('tab', { name: '세트 도감' }))
  expect(screen.getByRole('tabpanel', { name: '세트 도감' })).toHaveTextContent('분식 탐험대')
})

it('filters cards by region, season, set, and rarity', async () => {
  const user = userEvent.setup()
  render(<CollectionScreen entries={entries} progression={progression} />)
  await user.selectOptions(screen.getByLabelText('지역'), 'korea')
  await user.selectOptions(screen.getByLabelText('희귀도'), 'rare')
  expect(screen.getByRole('button', { name: /불꽃 라면/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /초밥 닌자/ })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm run test:run -- src/features/collection/CollectionScreen.test.tsx`

Expected: FAIL because V3 tabs and filters do not exist.

- [ ] **Step 3: Split the collection screen into focused tab components**

`CollectionScreen` owns only selected tab state and shared heading:

```tsx
type CollectionTab = 'cards' | 'world' | 'sets'

<div role="tablist" aria-label="도감 보기">
  {tabs.map((tab) => (
    <button
      role="tab"
      aria-selected={activeTab === tab.id}
      aria-controls={`collection-${tab.id}`}
      id={`collection-tab-${tab.id}`}
      onClick={() => setActiveTab(tab.id)}
    >
      {tab.label}
    </button>
  ))}
</div>
```

Each panel uses `role="tabpanel"`, `aria-labelledby`, and is mounted only while active.

- [ ] **Step 4: Implement world and set progress views**

`WorldMapTab` renders `discovered/total`, percentage, and locked silhouettes from `progress.regions`. `SetDexTab` renders every required catalog item with acquired/locked state and displays a single `완성 보상 획득` badge when the reward ID is already owned.

- [ ] **Step 5: Implement collection filters**

`CardCollectionTab` uses controlled `<select>` elements for region, season, set, and rarity. All filters combine with logical AND. A zero-result state says `조건에 맞는 카드가 아직 없어요. 필터를 하나 줄여 볼까요?`.

- [ ] **Step 6: Run collection tests**

Run: `npm run test:run -- src/features/collection`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/collection
git commit -m "feat: add Foodex world and set dex"
```

---

### Task 9: Fusion Lab and Cosmetic Wardrobe

**Files:**
- Create: `src/features/play/PlayScreen.tsx`
- Create: `src/features/play/PlayScreen.test.tsx`
- Create: `src/features/play/FusionLab.tsx`
- Create: `src/features/play/FusionLab.test.tsx`
- Create: `src/features/play/Wardrobe.tsx`
- Create: `src/features/play/Wardrobe.test.tsx`

**Interfaces:**
- Consumes: entries, fusion history, rewards, `resolveFusion`.
- Produces: `onSaveFusion(fusion)`, `onApplyCosmetic(cardId, cosmetic)`.

- [ ] **Step 1: Write fusion safety tests**

```ts
it('creates a fusion result without removing either source card', async () => {
  const user = userEvent.setup()
  const onFuse = vi.fn()
  render(<FusionLab entries={[ramenEntry, riceEntry]} onFuse={onFuse} />)

  await user.click(screen.getByRole('button', { name: /불꽃 라면 선택/ }))
  await user.click(screen.getByRole('button', { name: /든든 밥방패 선택/ }))
  await user.click(screen.getByRole('button', { name: '퓨전 발견하기' }))

  expect(onFuse).toHaveBeenCalledWith(expect.objectContaining({
    fusionCatalogId: 'ramen-rice-hero',
    leftCardId: ramenEntry.card.id,
    rightCardId: riceEntry.card.id,
  }))
  expect(screen.getByText('원본 카드는 그대로 보관돼요.')).toBeInTheDocument()
})
```

- [ ] **Step 2: Write wardrobe ownership tests**

```ts
it('allows only owned cosmetics to be applied', async () => {
  const user = userEvent.setup()
  const onApply = vi.fn()
  render(<Wardrobe card={ramenEntry.card} rewards={[sunnyPicnicReward]} onApply={onApply} />)
  expect(screen.getByRole('button', { name: /분식 축제 스킨/ })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: /햇살 소풍 배경 적용/ }))
  expect(onApply).toHaveBeenCalledWith(ramenEntry.card.id, {
    type: 'background',
    id: 'sunny-picnic',
  })
})
```

- [ ] **Step 3: Run play tests and verify they fail**

Run: `npm run test:run -- src/features/play`

Expected: FAIL because the play components do not exist.

- [ ] **Step 4: Implement Fusion Lab**

Require two distinct card IDs. Resolve recipes order-independently. Known combinations reveal the result, save one fusion-history record with `crypto.randomUUID()`, and save a `fusion-card` reward whose `rewardId` is the recipe ID. The reward uniqueness constraint makes the discovered fusion card permanent without duplicating it after later attempts. Unknown combinations show `새로운 조합의 기운이 보여요. 다른 친구와도 만나 보세요.` and do not write history or rewards.

- [ ] **Step 5: Implement Wardrobe**

Render all cosmetics, mark unowned items with a lock, and disable their apply buttons. Applying a cosmetic updates only `skinId` or `backgroundId`; it never changes rarity or XP.

- [ ] **Step 6: Implement Play screen tabs**

Provide `퓨전 연구소` and `꾸미기` tabs with the same WAI-ARIA tab pattern as the collection screen.

- [ ] **Step 7: Run play tests**

Run: `npm run test:run -- src/features/play`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/play
git commit -m "feat: add Foodex fusion and wardrobe"
```

---

### Task 10: App Integration, Sync Status, Event Summary, and Account Protection

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Create: `src/features/home/HomeScreen.test.tsx`
- Modify: `src/ui/BottomNav.tsx`
- Create: `src/features/sync/SyncStatus.tsx`
- Create: `src/features/account/ProtectCollection.tsx`
- Create: `src/features/account/ProtectCollection.test.tsx`
- Create: `src/features/reveal/V3DiscoverySummary.tsx`
- Modify: `src/features/reveal/CardReveal.tsx`

**Interfaces:**
- Consumes: session bootstrap, sync repository, `buildProgression`.
- Produces screens: `home`, `record`, `collection`, `play`, `reveal`.
- Produces account action: `protectWithEmail(email)`.

- [ ] **Step 1: Write application flow tests**

```ts
it('starts in local mode when Supabase is unavailable and still saves a meal', async () => {
  render(<App repository={localRepository} authResult={{ mode: 'local', reason: 'auth-unavailable' }} />)
  expect(screen.getByText('기기에 안전하게 저장 중')).toBeInTheDocument()
  await completeRecordFlow(userEvent.setup())
  await userEvent.click(screen.getByRole('button', { name: '도감에 저장' }))
  expect(await screen.findByText('오늘 카드 1장')).toBeInTheDocument()
})

it('shows every V3 result after one meal save', async () => {
  render(<App repository={repositoryWithAlmostCompleteSunnySet} />)
  await completeFruitRecord(userEvent.setup())
  await userEvent.click(screen.getByRole('button', { name: '도감에 저장' }))
  expect(await screen.findByText('간식섬에 새 친구가 나타났어요')).toBeInTheDocument()
  expect(screen.getByText('여름 도장 획득')).toBeInTheDocument()
  expect(screen.getByText('햇살 한입단 완성')).toBeInTheDocument()
  expect(screen.getByText('햇살 소풍 배경 획득')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run App tests and verify they fail**

Run: `npm run test:run -- src/App.test.tsx`

Expected: FAIL because V3 routing and result summaries do not exist.

- [ ] **Step 3: Bootstrap the repository without blocking first render**

`App` starts with `foodexRepository`. In an effect it creates or reuses the anonymous session, then swaps in `createSyncRepository(local, remote)` and calls `migrateLegacyData()` plus `syncPending()`. Auth failure sets local-only status and leaves all record controls enabled.

- [ ] **Step 4: Calculate rewards before saving**

At card reveal time:

1. normalize the pending card;
2. calculate progress including the pending entry;
3. select `progress.v3.newRewards`;
4. pass the meal, card, and reward grants to the sync repository;
5. show the exact discovery summary returned from that calculation.

The save button remains disabled during local commit only. Remote synchronization continues without holding the user on the reveal screen.

- [ ] **Step 5: Add the fourth bottom navigation item**

```ts
type AppTab = 'home' | 'record' | 'collection' | 'play'

const navItems = [
  { tab: 'home', label: '홈', icon: '⌂' },
  { tab: 'record', label: '기록', icon: '＋' },
  { tab: 'collection', label: '도감', icon: '▦' },
  { tab: 'play', label: '놀이', icon: '✦' },
] satisfies Array<{ tab: AppTab; label: string; icon: string }>
```

- [ ] **Step 6: Add event and sync summaries to Home**

Show active event title, completed/total conditions, and Korean-formatted end date. `SyncStatus` maps states to:

- idle cloud: no banner;
- syncing: `도감을 안전하게 동기화하고 있어요`;
- local-only: `기기에 안전하게 저장 중`;
- failed: `동기화를 기다리고 있어요` plus `다시 시도` button.

- [ ] **Step 7: Add optional email protection**

`ProtectCollection` is opened from a small `내 도감 안전하게 보관하기` button. It calls:

```ts
await client.auth.updateUser({ email })
```

The success message says `확인 메일을 보냈어요. 메일의 안내를 완료하면 다른 기기에서도 도감을 찾을 수 있어요.` It does not claim protection is complete before verification.

- [ ] **Step 8: Register reconnect synchronization**

Add one `online` listener in `App`:

```ts
useEffect(() => {
  const sync = () => void repository.syncPending()
  window.addEventListener('online', sync)
  return () => window.removeEventListener('online', sync)
}, [repository])
```

- [ ] **Step 9: Run integrated tests**

Run: `npm run test:run -- src/App.test.tsx src/features/home src/features/account`

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/features/home src/features/sync src/features/account src/features/reveal src/ui/BottomNav.tsx
git commit -m "feat: integrate Foodex V3 game loop"
```

---

### Task 11: Responsive Styling and Accessibility Regression

**Files:**
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`
- Modify: `src/features/collection/CollectionScreen.test.tsx`
- Modify: `src/features/play/PlayScreen.test.tsx`

**Interfaces:**
- Consumes: semantic classes and ARIA contracts from Tasks 8–10.
- Produces: 320px–desktop responsive layouts and visible focus states.

- [ ] **Step 1: Add accessibility regression assertions**

```ts
it('names every visible action across V3 tabs', async () => {
  render(<App repository={repositoryWithV3Data} />)
  for (const destination of ['홈', '기록', '도감', '놀이']) {
    const button = screen.getByRole('button', { name: destination })
    expect(button).toHaveAccessibleName()
  }
  await userEvent.click(screen.getByRole('button', { name: '도감' }))
  expect(screen.getAllByRole('tab')).toHaveLength(3)
  screen.getAllByRole('tab').forEach((tab) => expect(tab).toHaveAccessibleName())
})
```

- [ ] **Step 2: Run accessibility tests before styling**

Run: `npm run test:run -- src/App.test.tsx src/features/collection src/features/play`

Expected: PASS for behavior; visual classes remain unstyled.

- [ ] **Step 3: Add focused V3 styles**

Add:

- a three-column max world grid that becomes one column below 520px;
- horizontal, scrollable tab lists with visible selected state;
- two-column set cards above 700px and one column below;
- fusion source slots with a fixed minimum 44px tap target;
- locked cosmetic presentation that does not rely on color alone;
- `.sync-status` variants with text labels;
- `:focus-visible` outlines on tabs, cards, filters, and action buttons;
- `padding-bottom` that keeps content above the four-item bottom navigation;
- no fixed width wider than `100%`.

- [ ] **Step 4: Run full tests and build**

Run: `npm run test:run`

Expected: all tests PASS.

Run: `npm run build`

Expected: TypeScript and Vite build PASS.

- [ ] **Step 5: Start and verify the local app**

Run: `npm run dev -- --host 0.0.0.0`

Verify in a browser at desktop and 390px mobile width:

- bottom navigation remains visible;
- no horizontal page scrolling;
- all collection tabs open;
- fusion controls are usable;
- offline status does not block recording;
- card details remain readable with skins and backgrounds.

- [ ] **Step 6: Commit**

```bash
git add src/styles.css src/App.test.tsx src/features/collection/CollectionScreen.test.tsx src/features/play/PlayScreen.test.tsx
git commit -m "style: polish Foodex V3 mobile experience"
```

---

### Task 12: Vercel Configuration, Production Verification, and Release

**Files:**
- Modify: `vercel.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: built V3 app and connected Supabase project.
- Produces: Vercel production deployment with anonymous auth and private storage.

- [ ] **Step 1: Lock the Vercel build environment**

Update `vercel.json`:

```json
{
  "framework": "vite",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Use the committed `package.json` `engines.node` value for Node.js 22 and confirm the same major version in Project Settings → Build and Deployment.

- [ ] **Step 2: Configure only public client variables in Vercel**

Set for Preview and Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Confirm no secret key or service-role key exists in Vercel client variables.

- [ ] **Step 3: Configure Supabase Auth**

In Supabase:

- enable Anonymous Sign-Ins;
- add the Vercel production domain and preview callback pattern to allowed URLs;
- enable CAPTCHA or Cloudflare Turnstile before public launch;
- confirm email verification is enabled for account protection;
- configure custom SMTP before opening email protection to general users.

- [ ] **Step 4: Run pre-release verification**

Run: `npm run test:run`

Expected: all tests PASS.

Run: `npm run build`

Expected: build PASS and `dist` contains no `sb_secret_`, `service_role`, or secret-key value.

Run: `rg -n "sb_secret_|service_role" src .env.example dist`

Expected: no matches.

- [ ] **Step 5: Push the completed branch**

Use the `github:yeet` skill. Confirm the branch contains only Foodex V3 commits, then push the intended branch to `asitiso/foodex`.

- [ ] **Step 6: Verify automatic Vercel deployment**

Use the Vercel deployment tools to confirm:

- the deployment commit matches the pushed V3 commit;
- build state is `READY`;
- the production URL loads without Vercel Authentication when public mobile testing is intended;
- the browser console has no Supabase Auth, RLS, or Storage errors.

- [ ] **Step 7: Complete two production smoke flows**

New anonymous user:

1. open the production URL in a private browser;
2. record a meal;
3. receive a card and V3 progress;
4. refresh and confirm persistence;
5. open the world, set, fusion, and wardrobe screens.

Existing V2 user:

1. open the production URL with existing IndexedDB data;
2. approve migration;
3. confirm every existing card appears once;
4. refresh and confirm no duplicate XP, reward, or card;
5. retry one interrupted photo upload.

- [ ] **Step 8: Document the release**

Update `README.md` with:

- V3 feature list;
- local environment variables;
- anonymous-session behavior and recovery limitation;
- Supabase schema application procedure;
- test and build commands;
- Vercel deployment procedure.

- [ ] **Step 9: Commit release documentation**

```bash
git add vercel.json README.md
git commit -m "docs: prepare Foodex V3 release"
```

---

## Plan Self-Review Checklist

- Every V3 feature in the approved design maps to Tasks 1, 2, 8, 9, or 10.
- Anonymous start, account protection, and local fallback map to Tasks 3 and 10.
- RLS, explicit grants, indexed owner columns, and private Storage map to Task 4.
- Offline writes, retry idempotency, and legacy migration map to Tasks 5–7.
- Mobile accessibility and Vercel production verification map to Tasks 11–12.
- No task deletes legacy IndexedDB data.
- No browser code receives a Supabase secret key.
- All persistence retries use stable UUIDs and database uniqueness constraints.
- Fusion never calls a delete or decrement operation.
