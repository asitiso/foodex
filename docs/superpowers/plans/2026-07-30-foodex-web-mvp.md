# Foodex Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Foodex web MVP where a child records one meal photo, makes two simple selections, reveals a positive collectible card, and can revisit saved cards after a reload.

**Architecture:** A React single-page app owns navigation and the three-step recording state. Pure TypeScript domain functions calculate rarity, XP, and card copy; an IndexedDB repository persists meals and cards; feature components render home, record, reveal, and collection screens without knowing storage internals.

**Tech Stack:** React, TypeScript, Vite, `idb`, Vitest, React Testing Library, `fake-indexeddb`, CSS

## Global Constraints

- The primary experience is mobile-first and Korean-language.
- The complete record flow is `photo → food type → amount → reveal → save`.
- Food types are `라면`, `밥`, `과일`, `빵`, `반찬`, `간식`, `음료`, `기타`.
- Amounts are `맛보기`, `절반`, `거의 다`.
- Amount changes XP only: 10, 20, and 30 respectively.
- A first category is Epic, a first food in an existing category is Rare, and a repeated food is Common.
- A small amount must never reduce rarity or produce negative copy.
- No authentication, Firebase, remote APIs, nutrition calculation, social features, or random boxes.
- Photos and records persist locally in IndexedDB.
- The app remains usable when camera permission is denied by keeping gallery selection available.

---

## File Map

- `package.json`: scripts and dependencies.
- `vite.config.ts`, `tsconfig*.json`, `index.html`: Vite and test configuration.
- `src/domain/types.ts`: shared domain types and food metadata.
- `src/domain/cardRules.ts`: pure rarity, XP, and card-generation rules.
- `src/data/foodexDb.ts`: IndexedDB schema and repository interface.
- `src/features/record/RecordFlow.tsx`: photo, food, and amount steps.
- `src/features/reveal/CardReveal.tsx`: arcade-style reveal and save action.
- `src/features/home/HomeScreen.tsx`: summary and primary CTA.
- `src/features/collection/CollectionScreen.tsx`: filters, card grid, and detail sheet.
- `src/ui/BottomNav.tsx`: three-tab mobile navigation.
- `src/App.tsx`: screen state, repository calls, and cross-feature refresh.
- `src/styles.css`: visual system, animations, and responsive layout.
- `src/test/setup.ts`: DOM and IndexedDB test setup.

---

### Task 1: App Scaffold and Card Domain

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/test/setup.ts`
- Create: `src/domain/types.ts`
- Create: `src/domain/cardRules.ts`
- Test: `src/domain/cardRules.test.ts`

**Interfaces:**
- Produces: `FoodType`, `MealAmount`, `Rarity`, `MealRecord`, `FoodCard`, `FoodHistory`
- Produces: `xpForAmount(amount): number`
- Produces: `rarityForFood(foodType, history): Rarity`
- Produces: `createCard(input, history): FoodCard`

- [ ] **Step 1: Scaffold the Vite React project and test runner**

Create scripts `dev`, `build`, `test`, and `test:run`. Add runtime dependencies `react`, `react-dom`, and `idb`; add development dependencies `@vitejs/plugin-react`, `vite`, `typescript`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `fake-indexeddb`, and React type packages.

Configure Vitest in `vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
}
```

Configure `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
```

- [ ] **Step 2: Write failing card-rule tests**

```ts
import { describe, expect, it } from 'vitest'
import { createCard, rarityForFood, xpForAmount } from './cardRules'

describe('card rules', () => {
  it.each([
    ['taste', 10],
    ['half', 20],
    ['almostAll', 30],
  ] as const)('maps %s to %i XP', (amount, xp) => {
    expect(xpForAmount(amount)).toBe(xp)
  })

  it('awards Epic for a first category', () => {
    expect(rarityForFood('ramen', { foodTypes: [], categories: [] })).toBe('epic')
  })

  it('awards Rare for a new food in a known category', () => {
    expect(rarityForFood('ramen', { foodTypes: [], categories: ['meal'] })).toBe('rare')
  })

  it('awards Common for a repeated food regardless of amount', () => {
    const history = { foodTypes: ['ramen'] as const, categories: ['meal'] as const }
    expect(createCard({ mealId: 'm1', foodType: 'ramen', amount: 'taste', now: 1 }, history).rarity).toBe('common')
    expect(createCard({ mealId: 'm2', foodType: 'ramen', amount: 'almostAll', now: 2 }, history).rarity).toBe('common')
  })
})
```

- [ ] **Step 3: Run the domain tests and verify failure**

Run: `npm install && npm run test:run -- src/domain/cardRules.test.ts`

Expected: FAIL because `cardRules.ts` and its exports do not exist.

- [ ] **Step 4: Implement types and minimal deterministic card rules**

Define stable English storage values with Korean labels:

```ts
export type FoodType = 'ramen' | 'rice' | 'fruit' | 'bread' | 'side' | 'snack' | 'drink' | 'other'
export type FoodCategory = 'meal' | 'produce' | 'bakery' | 'treat' | 'drink' | 'other'
export type MealAmount = 'taste' | 'half' | 'almostAll'
export type Rarity = 'common' | 'rare' | 'epic'

export interface FoodHistory {
  foodTypes: readonly FoodType[]
  categories: readonly FoodCategory[]
}

export interface MealRecord {
  id: string
  imageData: string | null
  foodType: FoodType
  amount: MealAmount
  recordedAt: number
}

export interface FoodCard {
  id: string
  mealId: string
  name: string
  rarity: Rarity
  quote: string
  xp: number
  isNew: boolean
  createdAt: number
}
```

Implement `FOOD_META`, `AMOUNT_META`, `xpForAmount`, `rarityForFood`, and `createCard`. Select card copy deterministically with `now % variants.length` so tests are reproducible.

- [ ] **Step 5: Run tests and build**

Run: `npm run test:run -- src/domain/cardRules.test.ts && npm run build`

Expected: all domain tests PASS and Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src
git commit -m "feat: add Foodex card domain"
```

---

### Task 2: IndexedDB Repository

**Files:**
- Create: `src/data/foodexDb.ts`
- Test: `src/data/foodexDb.test.ts`

**Interfaces:**
- Consumes: `MealRecord`, `FoodCard`, `FoodHistory`
- Produces: `FoodexRepository`
- Produces: `foodexRepository`
- `saveMealAndCard(meal: MealRecord, card: FoodCard): Promise<void>`
- `listCards(): Promise<Array<{ card: FoodCard; meal: MealRecord }>>`
- `getHistory(): Promise<FoodHistory>`
- `getSummary(now: number): Promise<{ todayCount: number; discoveredCount: number; totalXp: number; lastMealAt?: number }>`

- [ ] **Step 1: Write failing repository tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createFoodexRepository, deleteFoodexDatabase } from './foodexDb'

beforeEach(() => deleteFoodexDatabase('foodex-test'))

it('saves a meal and card atomically and lists newest first', async () => {
  const repo = createFoodexRepository('foodex-test')
  await repo.saveMealAndCard(mealAt(1), cardAt(1))
  await repo.saveMealAndCard(mealAt(2), cardAt(2))
  expect((await repo.listCards()).map((entry) => entry.card.createdAt)).toEqual([2, 1])
})

it('derives history and summary from saved records', async () => {
  const repo = createFoodexRepository('foodex-test')
  await repo.saveMealAndCard(mealAt(1, 'ramen'), cardAt(1, 10))
  expect(await repo.getHistory()).toEqual({ foodTypes: ['ramen'], categories: ['meal'] })
  expect((await repo.getSummary(1)).totalXp).toBe(10)
})
```

Define local `mealAt` and `cardAt` fixtures in the test with every required field.

- [ ] **Step 2: Run repository tests and verify failure**

Run: `npm run test:run -- src/data/foodexDb.test.ts`

Expected: FAIL because the repository module does not exist.

- [ ] **Step 3: Implement the repository**

Create IndexedDB version 1 with `meals` and `cards` stores keyed by `id`; add `createdAt` index to cards. Use one read-write transaction in `saveMealAndCard`. Join cards to meals in `listCards`, discard orphaned cards defensively, and sort by `createdAt` descending.

Calculate local-day boundaries with `new Date(now).setHours(0, 0, 0, 0)` for `todayCount`. Deduplicate discovered foods and categories with `Set`.

- [ ] **Step 4: Run repository tests**

Run: `npm run test:run -- src/data/foodexDb.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "feat: persist Foodex cards locally"
```

---

### Task 3: Recording and Card Reveal Flow

**Files:**
- Create: `src/features/record/RecordFlow.tsx`
- Create: `src/features/reveal/CardReveal.tsx`
- Test: `src/features/record/RecordFlow.test.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: `FoodType`, `MealAmount`, `FoodCard`, `MealRecord`, `FOOD_META`, `AMOUNT_META`
- Produces: `RecordFlow({ onComplete, onCancel })`
- Produces: `CardReveal({ card, imageData, onSave, onDiscard })`

- [ ] **Step 1: Write failing recording-flow tests**

```tsx
it('requires a photo before food selection', () => {
  render(<RecordFlow onComplete={vi.fn()} onCancel={vi.fn()} />)
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
})

it('completes with one photo and two selections', async () => {
  const onComplete = vi.fn()
  render(<RecordFlow onComplete={onComplete} onCancel={vi.fn()} />)
  const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' })
  await userEvent.upload(screen.getByLabelText('식사 사진 선택'), file)
  await userEvent.click(screen.getByRole('button', { name: '다음' }))
  await userEvent.click(screen.getByRole('button', { name: '라면' }))
  await userEvent.click(screen.getByRole('button', { name: '다음' }))
  await userEvent.click(screen.getByRole('button', { name: '맛보기' }))
  await userEvent.click(screen.getByRole('button', { name: '카드 열기' }))
  expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
    foodType: 'ramen',
    amount: 'taste',
  }))
})
```

Mock `FileReader` in this test to resolve `data:image/jpeg;base64,dGVzdA==`.

- [ ] **Step 2: Run flow tests and verify failure**

Run: `npm run test:run -- src/features/record/RecordFlow.test.tsx`

Expected: FAIL because `RecordFlow` does not exist.

- [ ] **Step 3: Implement the three focused steps**

Use a local `step: 'photo' | 'food' | 'amount'` state. Render:

- Photo input with `accept="image/*"` and `capture="environment"`.
- A separate gallery-compatible label around the same file input.
- Eight food buttons from `FOOD_META`.
- Three amount buttons from `AMOUNT_META`.
- Back and next actions that preserve previous selections.

Return `{ imageData, foodType, amount }` only after all values exist. Never display failure or judgment copy for `taste`.

- [ ] **Step 4: Implement the arcade reveal**

Render a CSS 3D card flip, rarity badge, food illustration made from emoji/CSS, name, quote, and XP pill. Respect `prefers-reduced-motion` by disabling the flip and sparkle loops. `도감에 저장` calls `onSave`; `다시 선택` calls `onDiscard`.

- [ ] **Step 5: Run flow tests and build**

Run: `npm run test:run -- src/features/record/RecordFlow.test.tsx && npm run build`

Expected: tests PASS and build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/features src/styles.css
git commit -m "feat: add meal recording and card reveal"
```

---

### Task 4: Home, Collection, and App Integration

**Files:**
- Create: `src/features/home/HomeScreen.tsx`
- Create: `src/features/collection/CollectionScreen.tsx`
- Create: `src/ui/BottomNav.tsx`
- Create: `src/App.tsx`
- Test: `src/App.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `FoodexRepository`, `RecordFlow`, `CardReveal`
- Produces: complete `App({ repository? })`

- [ ] **Step 1: Write failing end-to-end component tests**

```tsx
it('saves a revealed card and refreshes home and collection', async () => {
  const repository = createMemoryRepository()
  render(<App repository={repository} />)
  await completeRecordFlow({ food: '라면', amount: '맛보기' })
  await userEvent.click(screen.getByRole('button', { name: '도감에 저장' }))
  expect(await screen.findByText('오늘 카드 1장')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '도감' }))
  expect(await screen.findByText('불꽃 라면')).toBeInTheDocument()
})

it('shows an empty collection without blaming the user', async () => {
  render(<App repository={createMemoryRepository()} />)
  await userEvent.click(screen.getByRole('button', { name: '도감' }))
  expect(await screen.findByText('첫 식사 카드를 만나러 가볼까요?')).toBeInTheDocument()
})
```

Create the in-memory repository inside the test with the same `FoodexRepository` interface. Make `completeRecordFlow` upload a test file and click the visible step buttons.

- [ ] **Step 2: Run integration tests and verify failure**

Run: `npm run test:run -- src/App.test.tsx`

Expected: FAIL because the application components do not exist.

- [ ] **Step 3: Implement home and navigation**

Home renders today count, last meal time, discovered count, total XP, the latest three cards, and the primary CTA. Bottom navigation provides buttons named `홈`, `기록`, and `도감`; the active tab uses `aria-current="page"`.

- [ ] **Step 4: Implement collection**

Render category chips, a newest-first card grid, and a detail dialog. The detail dialog includes the meal photo, card name, recorded date, Korean amount label, rarity, and quote. Use the native `<dialog>` element with a visible close button.

- [ ] **Step 5: Integrate record, reveal, save, and refresh**

`App` creates a draft `MealRecord`, asks the repository for history, calls `createCard`, and switches to reveal. On save, persist both objects, clear the draft, reload summary and collection, and return home. On an IndexedDB quota error, show `사진 저장 공간이 부족해요. 카드만 저장할까요?` with a `카드만 저장` action that retries with `imageData: null`. On other errors, show `저장하지 못했어요. 다시 시도해 주세요.` with a `다시 저장` button.

- [ ] **Step 6: Run integration tests and full build**

Run: `npm run test:run && npm run build`

Expected: all tests PASS and production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: complete Foodex web MVP"
```

---

### Task 5: Mobile Verification and Handoff

**Files:**
- Create: `README.md`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: the complete app
- Produces: documented local run and seven-day validation instructions

- [ ] **Step 1: Add accessibility and reduced-motion assertions**

Add tests that verify the active navigation uses `aria-current`, all icon-only controls have accessible names, the photo input has an accessible label, and the save error exposes a retry button.

- [ ] **Step 2: Run the full test suite**

Run: `npm run test:run`

Expected: all tests PASS.

- [ ] **Step 3: Verify production output**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully and create `dist/`.

- [ ] **Step 4: Verify mobile layout manually**

Run: `npm run dev -- --host 0.0.0.0`.

At 390 × 844 CSS pixels, verify:

- No horizontal scrolling.
- The primary CTA is visible without overlap.
- Camera and gallery input remains usable.
- Food and amount controls have at least 44 px touch height.
- The reveal card fits above the save action.
- Bottom navigation does not cover content.
- Reloading retains saved cards.

- [ ] **Step 5: Write README**

Document:

```md
npm install
npm run dev
npm run test:run
npm run build
```

Also document that data stays only on the current device, clearing site data removes the collection, and the seven-day validation target is at least four voluntary recording days.

- [ ] **Step 6: Commit**

```bash
git add README.md src
git commit -m "docs: add Foodex MVP verification guide"
```
