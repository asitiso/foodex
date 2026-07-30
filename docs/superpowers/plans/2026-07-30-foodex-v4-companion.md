# Foodex V4 Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the crowded V3 home with a character-room game home, add a zero-API context-aware companion engine, move progression content into dedicated Adventure and Companion tabs, add game feedback, and package the verified web app for Android.

**Architecture:** Keep React/Vite and the existing offline-first repository. Add pure domain modules for food selection, context building, event priority, dialogue, cards, journal, room unlocks, and feedback; UI components consume their typed outputs without embedding rules. Persist new user-owned state locally first and synchronize it through the existing Supabase path.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Testing Library, IndexedDB/idb, Supabase Auth/Postgres/Storage, Capacitor Android.

## Global Constraints

- Use no OpenAI or other paid AI API in V4.
- Never claim that a photo was AI-analyzed when the user selected the food.
- Keep the home limited to companion, level, today's cards, today's challenge, and streak.
- Use the C-style warm character-room home.
- Keep photo capture as the large center action in a five-item bottom navigation.
- Never punish, shame, diagnose, or negatively evaluate missing meals.
- Keep core recording usable when offline, muted, or when haptics are unavailable.
- Respect `prefers-reduced-motion`.
- Preserve existing anonymous Supabase authentication and local-first fallback.
- Target Android first; iOS remains outside this plan.

---

## File Structure

### Domain

- `src/domain/foodCatalog.ts`: searchable food definitions and time-of-day suggestions.
- `src/domain/companionTypes.ts`: shared companion, event, dialogue, room, journal, and feedback types.
- `src/domain/companionContext.ts`: converts entries and progression into one normalized context.
- `src/domain/companionEvents.ts`: scores and selects the primary and secondary events.
- `src/domain/dialogueEngine.ts`: composes non-repeating, positive companion lines.
- `src/domain/cardComposer.ts`: composes food-aware card names and quotes.
- `src/domain/roomProgression.ts`: derives unlocked room decoration IDs.
- `src/domain/journal.ts`: generates daily journal and monthly report data.
- `src/domain/feedback.ts`: maps card and progression events to visual, sound, and haptic cues.

### UI

- `src/features/home/CompanionRoom.tsx`: character room, emotion, speech bubble, and decoration layers.
- `src/features/home/HomeStatusGrid.tsx`: the four compact home status cards.
- `src/features/adventure/AdventureScreen.tsx`: quests, achievements, event, streak, chest, and player progress.
- `src/features/companion/CompanionScreen.tsx`: journal, monthly report, room unlock history, and settings entry.
- `src/features/record/FoodQuickPicker.tsx`: recent, frequent, time-based, category, and custom food selection.
- `src/features/settings/ExperienceSettings.tsx`: sound, music, haptics, and motion preferences.
- `src/lib/gameFeedback.ts`: safe browser/Capacitor sound and haptic adapter.

### Persistence and platform

- `src/data/foodexDb.ts`: IndexedDB schema version 3 and local companion state methods.
- `src/data/supabaseRepository.ts`: food label and companion state synchronization.
- `src/data/syncRepository.ts`: include V4 state in local-first sync.
- `supabase/migrations/20260730_foodex_v4_companion.sql`: V4 user-owned tables and RLS.
- `capacitor.config.ts`: Android package configuration.
- `android/`: generated Capacitor Android project.

---

### Task 1: Five-tab application shell

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/ui/BottomNav.tsx`
- Create: `src/features/adventure/AdventureScreen.tsx`
- Create: `src/features/companion/CompanionScreen.tsx`
- Test: `src/App.test.tsx`
- Test: `src/ui/BottomNav.test.tsx`

**Interfaces:**
- Produces: `type AppTab = 'home' | 'collection' | 'record' | 'adventure' | 'companion'`
- Produces: `AdventureScreen({ progression })`
- Produces: `CompanionScreen({ entries })`

- [ ] **Step 1: Write the failing navigation tests**

```tsx
it('shows five tabs with record in the center', () => {
  render(<BottomNav active="home" onNavigate={vi.fn()} />)
  expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
    expect.stringContaining('홈'),
    expect.stringContaining('도감'),
    expect.stringContaining('촬영'),
    expect.stringContaining('모험'),
    expect.stringContaining('친구'),
  ])
})

it('opens the adventure screen', async () => {
  render(<App repository={repository} />)
  await userEvent.click(screen.getByRole('button', { name: /모험/ }))
  expect(screen.getByRole('region', { name: '모험' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- src/App.test.tsx src/ui/BottomNav.test.tsx`

Expected: FAIL because `adventure`, `companion`, and the five-item navigation do not exist.

- [ ] **Step 3: Implement the five-tab shell**

Use these exact navigation definitions:

```ts
export type AppTab = 'home' | 'collection' | 'record' | 'adventure' | 'companion'

const navItems = [
  { tab: 'home', label: '홈', icon: '⌂' },
  { tab: 'collection', label: '도감', icon: '▦' },
  { tab: 'record', label: '촬영', icon: '📷', primary: true },
  { tab: 'adventure', label: '모험', icon: '✦' },
  { tab: 'companion', label: '친구', icon: '●' },
] satisfies Array<{ tab: AppTab; label: string; icon: string; primary?: boolean }>
```

Change `Screen` in `App.tsx` to include `adventure` and `companion`, remove the `play` route, and render initial semantic screen shells. Keep fusion and wardrobe files intact until Task 7 relocates them.

- [ ] **Step 4: Style the center action and safe-area navigation**

Change `.bottom-nav` to five equal columns. Give the record button class `primary` and raise its circular icon without changing DOM order. Verify 44px minimum hit targets.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- src/App.test.tsx src/ui/BottomNav.test.tsx && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/ui/BottomNav.tsx src/ui/BottomNav.test.tsx src/features/adventure/AdventureScreen.tsx src/features/companion/CompanionScreen.tsx src/App.test.tsx src/styles.css
git commit -m "feat: add Foodex V4 five-tab shell"
```

### Task 2: Named food catalog and quick selection

**Files:**
- Create: `src/domain/foodCatalog.ts`
- Create: `src/domain/foodCatalog.test.ts`
- Create: `src/features/record/FoodQuickPicker.tsx`
- Create: `src/features/record/FoodQuickPicker.test.tsx`
- Modify: `src/domain/types.ts`
- Modify: `src/features/record/RecordFlow.tsx`
- Modify: `src/features/record/RecordFlow.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `FoodDefinition`
- Produces: `FOOD_CATALOG: readonly FoodDefinition[]`
- Produces: `suggestFoods(input: SuggestFoodInput): FoodDefinition[]`
- Produces: `MealRecord.foodName: string`
- Produces: `MealDraft.foodName: string`
- Produces: `FoodHistory.foodNames: readonly string[]`

- [ ] **Step 1: Write failing catalog tests**

```ts
it('puts recent dinner foods before generic dinner suggestions', () => {
  const result = suggestFoods({
    now: new Date('2026-07-30T19:00:00+09:00').getTime(),
    entries: [{ foodName: '김치볶음밥', foodType: 'rice', recordedAt: Date.now() }],
    query: '',
  })
  expect(result[0].name).toBe('김치볶음밥')
})

it('finds a food by alias', () => {
  expect(searchFoods('돈까스')[0].name).toBe('돈가스')
})
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/domain/foodCatalog.test.ts`

Expected: FAIL because the catalog module is absent.

- [ ] **Step 3: Add the named food types**

```ts
export type FoodFlavor = 'warm' | 'spicy' | 'cool' | 'sweet' | 'fresh' | 'savory' | 'neutral'
export type MealPeriod = 'morning' | 'lunch' | 'dinner' | 'snack'

export interface FoodDefinition {
  id: string
  name: string
  aliases: readonly string[]
  foodType: FoodType
  flavor: FoodFlavor
  periods: readonly MealPeriod[]
}
```

Add `foodName: string` to `MealRecord` and `MealDraft`. For existing local records, normalize missing names to `FOOD_META[foodType].label`.

Add `foodNames` to `FoodHistory` and derive it from saved meals. New-food rarity must compare normalized `foodName`, not only the coarse `foodType`, so discovering 김치볶음밥 after plain 밥 still counts as a new named food.

- [ ] **Step 4: Seed the initial catalog**

Create at least 100 concrete Korean food definitions grouped by the existing coarse `FoodType`. IDs use kebab-case and remain stable. Include common aliases such as `돈까스 → 돈가스`, `짜장면 → 자장면`, and `김치 볶음밥 → 김치볶음밥`.

- [ ] **Step 5: Implement suggestion ranking**

Use this score:

```ts
score = recentMatch * 100
  + samePeriodCount * 20
  + totalCount * 5
  + defaultPeriodMatch * 3
```

Deduplicate by catalog ID, cap the initial list at eight, and expose category and custom input after suggestions.

- [ ] **Step 6: Write and pass picker tests**

```tsx
it('completes a recent food in one tap', async () => {
  const onSelect = vi.fn()
  render(<FoodQuickPicker suggestions={[kimchiRice]} onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: '김치볶음밥' }))
  expect(onSelect).toHaveBeenCalledWith(kimchiRice)
})
```

Run: `npm test -- src/domain/foodCatalog.test.ts src/features/record/FoodQuickPicker.test.tsx src/features/record/RecordFlow.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/types.ts src/domain/foodCatalog.ts src/domain/foodCatalog.test.ts src/features/record/FoodQuickPicker.tsx src/features/record/FoodQuickPicker.test.tsx src/features/record/RecordFlow.tsx src/features/record/RecordFlow.test.tsx src/App.tsx
git commit -m "feat: add fast named food selection"
```

### Task 3: Companion context and event priority engine

**Files:**
- Create: `src/domain/companionTypes.ts`
- Create: `src/domain/companionContext.ts`
- Create: `src/domain/companionContext.test.ts`
- Create: `src/domain/companionEvents.ts`
- Create: `src/domain/companionEvents.test.ts`

**Interfaces:**
- Produces: `buildCompanionContext(entries, progression, now): CompanionContext`
- Produces: `rankCompanionEvents(context): RankedCompanionEvents`
- Produces: `CompanionEventId`

- [ ] **Step 1: Define and test the normalized context**

```ts
export interface CompanionContext {
  now: number
  mealPeriod: MealPeriod
  todayCount: number
  lastMealAt?: number
  latestFoodName?: string
  latestFoodType?: FoodType
  latestRarity?: Rarity
  isNewFood: boolean
  repeatCount: number
  level: number
  levelProgress: number
  streakDays: number
  completedQuestCount: number
  nearCompleteQuestId?: string
  completedSetIds: readonly string[]
  newlyUnlockedDecorationIds: readonly string[]
}
```

Also define `ExperienceSettings` in `companionTypes.ts` so feedback and UI use one shared type:

```ts
export interface ExperienceSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  hapticsEnabled: boolean
  reducedMotion: boolean
}
```

Test `todayCount`, `repeatCount`, meal period boundaries, and no-entry defaults using fixed timestamps.

- [ ] **Step 2: Run context tests and verify failure**

Run: `npm test -- src/domain/companionContext.test.ts`

Expected: FAIL because `buildCompanionContext` is absent.

- [ ] **Step 3: Implement context building as a pure function**

Do not read `Date.now()` inside the function. Pass `now` explicitly so tests and monthly summaries are deterministic.

- [ ] **Step 4: Write event ranking tests**

```ts
it('ranks legendary above a completed quest', () => {
  const result = rankCompanionEvents(context({ latestRarity: 'legendary', completedQuestCount: 3 }))
  expect(result.primary.id).toBe('legendary-card')
})

it('uses a restart event without guilt when the streak is zero', () => {
  const result = rankCompanionEvents(context({ streakDays: 0, todayCount: 0 }))
  expect(result.primary.id).toBe('welcome-back')
  expect(result.primary.tone).toBe('positive')
})
```

- [ ] **Step 5: Implement exact event weights**

Use `legendary-card: 100`, `set-complete: 60`, `achievement: 60`, `epic-card: 60`, `room-unlock: 55`, `quest-complete: 50`, `first-discovery: 40`, `level-up: 30`, `streak: 30`, `category-return: 25`, and `repeat-food: 20`. Return one primary event and up to two secondary events.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/domain/companionContext.test.ts src/domain/companionEvents.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/companionTypes.ts src/domain/companionContext.ts src/domain/companionContext.test.ts src/domain/companionEvents.ts src/domain/companionEvents.test.ts
git commit -m "feat: add companion context and priority engine"
```

### Task 4: Dialogue and card composition

**Files:**
- Create: `src/domain/dialogueContent.ts`
- Create: `src/domain/dialogueEngine.ts`
- Create: `src/domain/dialogueEngine.test.ts`
- Create: `src/domain/cardComposer.ts`
- Create: `src/domain/cardComposer.test.ts`
- Modify: `src/domain/cardRules.ts`
- Modify: `src/domain/cardRules.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `composeDialogue(input: DialogueInput): ComposedDialogue`
- Produces: `composeCardCopy(input: CardCopyInput): { name: string; quote: string }`
- Consumes: `RankedCompanionEvents`, `FoodDefinition`, and recent dialogue IDs.

- [ ] **Step 1: Write failing repetition and safety tests**

```ts
it('does not reuse a line used within thirty days', () => {
  const result = composeDialogue({
    context,
    events,
    history: [{ dialogueId: 'first-warm-discovery', usedAt: now - 86_400_000 }],
    now,
  })
  expect(result.id).not.toBe('first-warm-discovery')
})

it.each(['왜 안 왔어', '부족', '나쁜 식습관', '실망'])('never emits punitive copy: %s', (phrase) => {
  expect(allDialogueText().join(' ')).not.toContain(phrase)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/domain/dialogueEngine.test.ts`

Expected: FAIL because dialogue content and composer are absent.

- [ ] **Step 3: Implement content pools and deterministic weighted selection**

Use a seeded selection key made from `mealId + primaryEventId + localDate`. Exclude exact lines for 30 days, openings for five uses, and food modifiers for three uses. If all candidates are excluded, choose the least recently used positive line.

- [ ] **Step 4: Write card copy tests**

```ts
it('creates a rare spicy food title from its flavor', () => {
  expect(composeCardCopy({ food: kimchiRice, rarity: 'rare', seed: 'meal-1' }).name)
    .toMatch(/불꽃|붉은|매콤/)
})

it('uses the fixed legendary title', () => {
  expect(composeCardCopy({ food: ramen, rarity: 'legendary', seed: 'meal-2' }).name)
    .toBe('천공을 가르는 라면왕')
})
```

- [ ] **Step 5: Integrate the composer with `createCard`**

Extend input:

```ts
{
  mealId: string
  foodType: FoodType
  foodName: string
  amount: MealAmount
  now: number
  rewardSource?: 'season' | 'collection'
}
```

Keep rarity and XP behavior compatible with V3. Only name and quote composition change.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/domain/dialogueEngine.test.ts src/domain/cardComposer.test.ts src/domain/cardRules.test.ts && npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/dialogueContent.ts src/domain/dialogueEngine.ts src/domain/dialogueEngine.test.ts src/domain/cardComposer.ts src/domain/cardComposer.test.ts src/domain/cardRules.ts src/domain/cardRules.test.ts src/App.tsx
git commit -m "feat: compose contextual dialogue and food cards"
```

### Task 5: C-style character-room home

**Files:**
- Create: `src/features/home/CompanionRoom.tsx`
- Create: `src/features/home/CompanionRoom.test.tsx`
- Create: `src/features/home/HomeStatusGrid.tsx`
- Create: `src/features/home/HomeStatusGrid.test.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Create: `src/features/home/HomeScreen.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `CompanionRoom({ emotion, line, decorationIds, reducedMotion })`
- Produces: `HomeStatusGrid({ level, todayCards, quest, streakDays })`

- [ ] **Step 1: Write failing home tests**

```tsx
it('shows only the four compact status cards below the companion', () => {
  render(<HomeScreen {...props} />)
  expect(screen.getByText('레벨')).toBeInTheDocument()
  expect(screen.getByText('오늘의 카드')).toBeInTheDocument()
  expect(screen.getByText('오늘의 도전')).toBeInTheDocument()
  expect(screen.getByText('연속 기록')).toBeInTheDocument()
  expect(screen.queryByText('여름 한입 시즌')).not.toBeInTheDocument()
  expect(screen.queryByText('오늘의 상자')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/features/home/HomeScreen.test.tsx src/features/home/CompanionRoom.test.tsx`

Expected: FAIL because the C-style home components are absent and V3 panels remain.

- [ ] **Step 3: Build the semantic room layers**

Render room layers as CSS-backed elements with stable decoration IDs. The base character uses five CSS classes: `emotion-calm`, `emotion-expectant`, `emotion-happy`, `emotion-surprised`, and `emotion-celebrating`. Do not couple animation names to domain event IDs.

- [ ] **Step 4: Replace the existing home panels**

Remove full quest, season, reward box, and recent-card sections from `HomeScreen`. Keep one companion room and one 2×2 status grid. Status cards navigate to Adventure; the companion speech bubble navigates to Companion.

- [ ] **Step 5: Add motion and reduced-motion behavior**

Use transform and opacity animations only. Under `prefers-reduced-motion: reduce`, remove bob, jump, sparkle, and parallax animation while keeping final states visible.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/features/home/CompanionRoom.test.tsx src/features/home/HomeStatusGrid.test.tsx src/App.test.tsx && npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/home/CompanionRoom.tsx src/features/home/CompanionRoom.test.tsx src/features/home/HomeStatusGrid.tsx src/features/home/HomeStatusGrid.test.tsx src/features/home/HomeScreen.tsx src/App.tsx src/styles.css src/App.test.tsx
git commit -m "feat: build character room home"
```

### Task 6: Room progression and feedback director

**Files:**
- Create: `src/domain/roomProgression.ts`
- Create: `src/domain/roomProgression.test.ts`
- Create: `src/domain/feedback.ts`
- Create: `src/domain/feedback.test.ts`
- Create: `src/lib/gameFeedback.ts`
- Create: `src/lib/gameFeedback.test.ts`
- Modify: `src/features/reveal/CardReveal.tsx`
- Modify: `src/features/reveal/CardReveal.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `deriveRoomUnlocks(progression): RoomUnlock[]`
- Produces: `directFeedback(event): FeedbackCue`
- Produces: `playFeedback(cue, settings): Promise<void>`

- [ ] **Step 1: Write room unlock tests**

```ts
it('unlocks the plant at level three exactly once', () => {
  expect(deriveRoomUnlocks({ ...progression, level: { ...progression.level, level: 3 } }))
    .toContainEqual(expect.objectContaining({ id: 'small-plant' }))
})
```

- [ ] **Step 2: Implement fixed room unlock rules**

Implement `small-plant` at level 3, `food-poster` at 5, `card-shelf` at 8, `window-view` at 10, plus `korean-lamp`, `fruit-cushion`, `noodle-pot`, and `season-wallpaper` from their corresponding V3 completion IDs.

- [ ] **Step 3: Write feedback mapping tests**

```ts
it('maps legendary cards to fanfare and strong haptics', () => {
  expect(directFeedback({ type: 'card', rarity: 'legendary' })).toEqual({
    visual: 'legendary-burst',
    sound: 'legendary-fanfare',
    haptic: 'heavy',
  })
})
```

- [ ] **Step 4: Implement a failure-safe adapter**

`playFeedback` checks settings first, synthesizes short cues with `AudioContext`, catches unavailable or suspended audio contexts, uses `navigator.vibrate` on web when available, and exposes a Capacitor adapter seam without importing Capacitor before Task 10.

Define ten local cue IDs: `card-common`, `card-rare`, `card-epic`, `legendary-fanfare`, `quest-complete`, `level-up`, `room-unlock`, `button-tap`, `chest-shake`, and `chest-open`. Each preset is a fixed sequence of oscillator frequency, start offset, duration, and gain, so no binary audio asset or network request is required.

- [ ] **Step 5: Integrate feedback with card reveal**

Trigger feedback once after the reveal mounts. Store a ref guard so React Strict Mode does not play the cue twice. Add CSS classes for common, rare, epic, and legendary reveal layers.

- [ ] **Step 6: Verify tests and muted fallback**

Run: `npm test -- src/domain/roomProgression.test.ts src/domain/feedback.test.ts src/lib/gameFeedback.test.ts src/features/reveal/CardReveal.test.tsx`

Expected: PASS, including a test where `AudioContext` is unavailable and card save remains enabled.

- [ ] **Step 7: Commit**

```bash
git add src/domain/roomProgression.ts src/domain/roomProgression.test.ts src/domain/feedback.ts src/domain/feedback.test.ts src/lib/gameFeedback.ts src/lib/gameFeedback.test.ts src/features/reveal/CardReveal.tsx src/features/reveal/CardReveal.test.tsx src/styles.css
git commit -m "feat: add room unlocks and game feedback"
```

### Task 7: Adventure and Companion content screens

**Files:**
- Modify: `src/features/adventure/AdventureScreen.tsx`
- Create: `src/features/adventure/AdventureScreen.test.tsx`
- Modify: `src/features/companion/CompanionScreen.tsx`
- Create: `src/features/companion/CompanionScreen.test.tsx`
- Modify: `src/features/collection/CollectionScreen.tsx`
- Modify: `src/features/collection/CollectionScreen.test.tsx`
- Modify: `src/features/play/FusionLab.tsx`
- Modify: `src/features/play/Wardrobe.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing `Progression`, `FusionLab`, and `Wardrobe`.
- Produces: Adventure sub-tabs `today | achievements | events`.
- Produces: Companion sub-tabs `journal | report | room`.

- [ ] **Step 1: Write failing Adventure grouping tests**

```tsx
it('groups quests achievements and events without putting them on home', async () => {
  render(<AdventureScreen progression={progression} />)
  expect(screen.getByRole('tab', { name: '오늘' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: '업적' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: '이벤트' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Implement Adventure**

The Today tab shows player level, streak, three daily quests, and reward box. Achievements shows all achievements and collection bonuses. Events shows the active seasonal event and V3 regional event. Keep only one panel visible at a time.

- [ ] **Step 3: Move fusion and wardrobe**

Add `cards | sets | map | fusion` to Collection tabs. Put `FusionLab` in `fusion`. Move `Wardrobe` into the existing card detail dialog under a `꾸미기` disclosure. Delete `PlayScreen.tsx` only after no import remains.

- [ ] **Step 4: Implement Companion shell**

The Journal tab shows the current day's generated journal. Report shows the current month summary. Room shows unlocked decoration names and the next unlock. Do not add free-form chat input.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/features/adventure/AdventureScreen.test.tsx src/features/companion/CompanionScreen.test.tsx src/features/collection/CollectionScreen.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/adventure src/features/companion src/features/collection src/features/play/FusionLab.tsx src/features/play/Wardrobe.tsx src/styles.css
git rm src/features/play/PlayScreen.tsx src/features/play/PlayScreen.test.tsx
git commit -m "feat: organize adventure and companion screens"
```

### Task 8: Journal and monthly report engine

**Files:**
- Create: `src/domain/journal.ts`
- Create: `src/domain/journal.test.ts`
- Modify: `src/features/companion/CompanionScreen.tsx`
- Modify: `src/features/companion/CompanionScreen.test.tsx`

**Interfaces:**
- Produces: `buildDailyJournal(entries, progression, day): DailyJournal`
- Produces: `buildMonthlyReport(entries, rewards, month): MonthlyReport`

- [ ] **Step 1: Write factual-summary tests**

```ts
it('describes one record positively without calling it insufficient', () => {
  const journal = buildDailyJournal([entry('미역국')], progression, day)
  expect(journal.text).toContain('미역국')
  expect(journal.text).toContain('멋진 모험')
  expect(journal.text).not.toMatch(/부족|나쁘|실패/)
})

it('calculates the most frequent category from source records', () => {
  const report = buildMonthlyReport(entries, rewards, '2026-07')
  expect(report.topCategory).toBe('meal')
})
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/domain/journal.test.ts`

Expected: FAIL because journal builders are absent.

- [ ] **Step 3: Implement deterministic journal composition**

Daily output contains food names, the highest-priority progress event, and one positive closing. Monthly output contains record count, top food, new discoveries, top category, best streak, rare-card count, nearest collection, and room changes. All numeric values derive from entries; no health claims are allowed.

- [ ] **Step 4: Render empty, daily, and monthly states**

Empty copy: `첫 기록을 남기면 푸드 친구가 오늘의 이야기를 써 줄게요.`  
Single-record closing: `한 장의 기록도 멋진 모험이에요.`  
Monthly suggestion: `다음 달에는 새로운 음식 카드를 만나볼까요?`

- [ ] **Step 5: Run tests**

Run: `npm test -- src/domain/journal.test.ts src/features/companion/CompanionScreen.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/journal.ts src/domain/journal.test.ts src/features/companion/CompanionScreen.tsx src/features/companion/CompanionScreen.test.tsx
git commit -m "feat: add free food journal and monthly report"
```

### Task 9: V4 persistence and Supabase synchronization

**Files:**
- Modify: `src/data/foodexDb.ts`
- Modify: `src/data/foodexDb.test.ts`
- Modify: `src/data/supabaseRepository.ts`
- Modify: `src/data/supabaseRepository.test.ts`
- Modify: `src/data/syncRepository.ts`
- Modify: `src/data/syncRepository.test.ts`
- Create: `supabase/migrations/20260730_foodex_v4_companion.sql`
- Create: `supabase/tests/foodex_v4_rls.sql`

**Interfaces:**
- Produces repository methods:

```ts
listDialogueHistory(): Promise<DialogueHistoryItem[]>
saveDialogueHistory(item: DialogueHistoryItem): Promise<void>
getExperienceSettings(): Promise<ExperienceSettings>
saveExperienceSettings(settings: ExperienceSettings): Promise<void>
```

- [ ] **Step 1: Write failing IndexedDB migration tests**

Create a version-2 database fixture, open it with the V4 repository, and assert old meals receive normalized `foodName` values while new `dialogueHistory` and `experienceSettings` stores are available.

- [ ] **Step 2: Upgrade IndexedDB to version 3**

Add stores:

```ts
dialogueHistory: { key: string; value: DialogueHistoryItem; indexes: { usedAt: number } }
experienceSettings: { key: 'experience'; value: ExperienceSettings }
```

Do not rewrite old card IDs, reward keys, or queue items.

- [ ] **Step 3: Write Supabase mapping tests**

Assert `food_name` is included in `meal_records` upserts and dialogue rows include `user_id`, `dialogue_id`, `event_id`, and `used_at`.

- [ ] **Step 4: Create the database migration**

Migration actions:

```sql
alter table public.meal_records add column if not exists food_name text;
update public.meal_records set food_name = food_type where food_name is null;
alter table public.meal_records alter column food_name set not null;

create table public.dialogue_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  dialogue_id text not null,
  event_id text not null,
  used_at timestamptz not null,
  unique (user_id, id)
);
```

Enable RLS, grant authenticated select/insert, and create policies requiring `auth.uid() = user_id`. Add an index on `(user_id, used_at desc)`.

- [ ] **Step 5: Add RLS tests**

Test that user A can insert/select their dialogue rows and cannot select or insert rows owned by user B.

- [ ] **Step 6: Run local tests and migration lint**

Run: `npm test -- src/data/foodexDb.test.ts src/data/supabaseRepository.test.ts src/data/syncRepository.test.ts`

Expected: PASS.

Run when Supabase CLI is available: `supabase db lint --schema public`

Expected: no V4 migration errors.

- [ ] **Step 7: Commit**

```bash
git add src/data/foodexDb.ts src/data/foodexDb.test.ts src/data/supabaseRepository.ts src/data/supabaseRepository.test.ts src/data/syncRepository.ts src/data/syncRepository.test.ts supabase/migrations/20260730_foodex_v4_companion.sql supabase/tests/foodex_v4_rls.sql
git commit -m "feat: persist Foodex V4 companion state"
```

### Task 10: Experience settings

**Files:**
- Create: `src/features/settings/ExperienceSettings.tsx`
- Create: `src/features/settings/ExperienceSettings.test.tsx`
- Modify: `src/features/companion/CompanionScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `ExperienceSettings` from `src/domain/companionTypes.ts`.

- [ ] **Step 1: Write failing setting tests**

```tsx
it('turns sound off without changing haptics', async () => {
  const onChange = vi.fn()
  render(<ExperienceSettings value={defaults} onChange={onChange} />)
  await userEvent.click(screen.getByRole('switch', { name: '효과음' }))
  expect(onChange).toHaveBeenCalledWith({ ...defaults, soundEnabled: false })
})
```

- [ ] **Step 2: Implement accessible switches**

Use buttons with `role="switch"` and `aria-checked`. Defaults are sound on, music off, haptics on, and reduced motion initialized from `matchMedia('(prefers-reduced-motion: reduce)')`.

- [ ] **Step 3: Persist and apply settings**

Load settings during app refresh. Pass them to `CompanionRoom`, `CardReveal`, and `playFeedback`. Setting changes save locally immediately and do not wait for Supabase.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/features/settings/ExperienceSettings.test.tsx src/lib/gameFeedback.test.ts src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings src/features/companion/CompanionScreen.tsx src/App.tsx src/styles.css
git commit -m "feat: add sound motion and haptic settings"
```

### Task 11: Capacitor Android packaging

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `capacitor.config.ts`
- Create: `android/`
- Create: `docs/android-release.md`

**Interfaces:**
- Produces package ID: `com.foodex.app`
- Produces app name: `Foodex`
- Produces scripts: `android:sync`, `android:open`, `android:build`

- [ ] **Step 1: Install scoped platform dependencies**

Run:

```bash
npm install @capacitor/core @capacitor/android @capacitor/camera @capacitor/haptics
npm install --save-dev @capacitor/cli
```

- [ ] **Step 2: Add Capacitor configuration**

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.foodex.app',
  appName: 'Foodex',
  webDir: 'dist',
  server: { androidScheme: 'https' },
}

export default config
```

- [ ] **Step 3: Add and synchronize Android**

Run:

```bash
npm run build
npx cap add android
npx cap sync android
```

Expected: `android/` exists and assets are copied from `dist`.

- [ ] **Step 4: Connect native camera and haptics behind adapters**

Use Capacitor Camera only when `Capacitor.isNativePlatform()` is true; keep the existing file inputs for web. Update `gameFeedback.ts` to use `Haptics.impact()` on Android and `navigator.vibrate` on web.

- [ ] **Step 5: Add Android release instructions**

Document:

- Android Studio JDK requirement.
- `npm run build && npx cap sync android`.
- Debug APK build and device installation.
- AAB generation for Play Console.
- Camera permission verification.
- App icon and splash replacement paths.
- Signing key backup warning.

- [ ] **Step 6: Verify web and Android builds**

Run:

```bash
npm run test:run
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

Expected: all tests pass, Vite build succeeds, Capacitor sync succeeds, and a debug APK is produced.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json capacitor.config.ts android docs/android-release.md src/features/record/RecordFlow.tsx src/lib/gameFeedback.ts
git commit -m "feat: package Foodex for Android"
```

### Task 12: Full verification and release handoff

**Files:**
- Modify: `README.md`
- Modify: `docs/android-release.md`

**Interfaces:**
- Consumes all V4 tasks.
- Produces a verified web deployment candidate and Android debug APK instructions.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm run test:run
npm run build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Run the mobile smoke checklist**

At a 360×800 viewport verify:

1. C-style home shows the companion and four status cards without a long content feed.
2. Center camera action starts recording.
3. A recent food can be selected with one tap.
4. Card reveal works with sound on and off.
5. Adventure owns quests, achievements, events, and chest.
6. Companion owns journal, report, room, and settings.
7. Offline recording saves locally and syncs after reconnection.
8. Reduced motion removes continuous and reveal animation.

- [ ] **Step 3: Run the Android device checklist**

On one physical Android device verify:

1. Camera permission appears only when starting capture.
2. Taking a photo returns to the record flow.
3. Rare and higher cards trigger the expected haptic pattern.
4. Disabling haptics prevents vibration.
5. App relaunch preserves cards, dialogue history, and settings.
6. Anonymous Supabase synchronization succeeds.

- [ ] **Step 4: Update README**

Document V4 navigation, zero-API companion behavior, local-first storage, web commands, Android commands, and the fact that Foodex does not perform medical or nutritional diagnosis.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/android-release.md
git commit -m "docs: prepare Foodex V4 release"
```
