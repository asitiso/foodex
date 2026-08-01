# Integrated Meal Reward Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect one meal record to one deterministic, idempotent reward result and one clear next goal without using AI or adding new screens.

**Architecture:** Add a pure domain coordinator that compares progression before and after a meal and produces one `IntegratedMealResult`. Keep persistence in the existing repository transaction, derive reward keys from the meal ID, then render the result through the existing reveal, home, collection, and adventure components.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, IndexedDB/Dexie repository, Supabase sync repository, Vite.

## Global Constraints

- Do not use AI food recognition, generated descriptions, news, video, or dialogue.
- Do not add or modify Supabase tables or migrations.
- Reuse the existing cream, purple, and yellow palette and existing component radius/shadow tokens.
- Keep one emphasized action per screen.
- Show at most three primary reward items; place additional results in a collapsed detail area.
- Support 320px mobile width and `prefers-reduced-motion`.
- Do not touch `supabase/schema/`.

---

## File Structure

- Create `src/domain/integratedMealResult.ts`: pure before/after reward and next-goal coordinator.
- Create `src/domain/integratedMealResult.test.ts`: deterministic reward, deduplication, and priority tests.
- Modify `src/domain/mealOutcome.ts`: expose normalized XP, coin, slot, tags, combo, and boss damage inputs.
- Modify `src/App.tsx`: calculate pending integrated result, persist once, and retain it through reveal/save.
- Modify `src/data/foodexDb.ts`: add existing-schema reward lookup helpers.
- Modify `src/data/syncRepository.ts`: deduplicate meal/card/reward writes by IDs and keys.
- Modify `src/features/reveal/CardReveal.tsx`: staged card-first reward presentation and skip action.
- Modify `src/features/home/HomeScreen.tsx`: show the result's single next goal.
- Modify `src/features/collection/CardCollectionTab.tsx`: highlight the newly filled album entry.
- Modify `src/features/adventure/AdventureScreen.tsx`: highlight newly completed mission/achievement IDs.
- Modify `src/styles.css`: result layout and reduced-motion behavior using existing tokens.

### Task 1: Pure integrated meal result coordinator

**Files:**
- Create: `src/domain/integratedMealResult.ts`
- Create: `src/domain/integratedMealResult.test.ts`
- Modify: `src/domain/mealOutcome.ts`

**Interfaces:**
- Consumes: `MealRecord`, `FoodCard`, `Progression`, `CompanionClassId`, existing reward keys.
- Produces: `buildIntegratedMealResult(input): IntegratedMealResult`.

- [ ] **Step 1: Write failing deterministic result tests**

```ts
it('returns one card-first reward result and one next goal', () => {
  const result = buildIntegratedMealResult({ meal, card, before, after, classId: 'hearty-guardian', existingRewardKeys: [] })
  expect(result.mealId).toBe(meal.id)
  expect(result.primaryRewards).toHaveLength(3)
  expect(result.nextGoal.kind).toBe('dungeon-room')
})

it('omits rewards whose stable keys already exist', () => {
  const result = buildIntegratedMealResult({ meal, card, before, after, existingRewardKeys: [`meal:${meal.id}:card`] })
  expect(result.persistedRewards.map((reward) => reward.key)).not.toContain(`meal:${meal.id}:card`)
})
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm.cmd run test:run -- src/domain/integratedMealResult.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement exact result types and coordinator**

```ts
export interface IntegratedMealResult {
  mealId: string
  outcome: MealOutcome
  primaryRewards: Array<{ id: string; label: string; value: string; kind: 'card' | 'xp' | 'coin' | 'unlock' }>
  detailRewards: Array<{ id: string; label: string }>
  persistedRewards: Array<{ key: string; rewardType: UserReward['rewardType']; rewardId: string; sourceType: UserReward['sourceType']; sourceId: string }>
  completedQuestIds: string[]
  unlockedAchievementIds: string[]
  nextGoal: { kind: 'dungeon-room' | 'daily-quest' | 'growth' | 'album' | 'weekly'; label: string }
}
```

Implement `buildIntegratedMealResult` by comparing `before` and `after`, using `buildMealOutcome`, capping `primaryRewards` at three, and ordering next goals exactly as the approved spec.

- [ ] **Step 4: Run domain tests**

Run: `npm.cmd run test:run -- src/domain/integratedMealResult.test.ts src/domain/mealOutcome.test.ts src/domain/progression.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/integratedMealResult.ts src/domain/integratedMealResult.test.ts src/domain/mealOutcome.ts
git commit -m "feat: calculate integrated meal rewards"
```

### Task 2: Idempotent repository persistence

**Files:**
- Modify: `src/data/foodexDb.ts`
- Modify: `src/data/foodexDb.test.ts`
- Modify: `src/data/syncRepository.ts`
- Modify: `src/data/syncRepository.test.ts`

**Interfaces:**
- Consumes: meal, card, and `IntegratedMealResult.persistedRewards`.
- Produces: `saveMealAndCard` that is safe to retry with the same meal ID and reward keys.

- [ ] **Step 1: Write retry tests**

```ts
it('does not duplicate rewards when the same meal save is retried', async () => {
  await repository.saveMealAndCard(meal, card, rewards)
  await repository.saveMealAndCard(meal, card, rewards)
  expect((await repository.getRewards()).filter((item) => item.key === rewards[0].key)).toHaveLength(1)
})
```

- [ ] **Step 2: Run repository tests and confirm failure**

Run: `npm.cmd run test:run -- src/data/foodexDb.test.ts src/data/syncRepository.test.ts`

- [ ] **Step 3: Implement ID/key deduplication**

Within the existing transaction, read meal ID, card meal ID, and reward keys before insertion. Use upsert/put semantics locally and exclude already-present reward keys from Supabase payloads. Do not change tables or migrations.

- [ ] **Step 4: Run repository tests**

Run: `npm.cmd run test:run -- src/data/foodexDb.test.ts src/data/syncRepository.test.ts src/data/supabaseRepository.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/foodexDb.ts src/data/foodexDb.test.ts src/data/syncRepository.ts src/data/syncRepository.test.ts
git commit -m "fix: make meal rewards idempotent"
```

### Task 3: Connect App save flow to the coordinator

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `buildIntegratedMealResult` and idempotent `saveMealAndCard`.
- Produces: pending result state passed to reveal and refreshed screens.

- [ ] **Step 1: Write App integration tests**

```ts
it('shows integrated rewards only after persistence succeeds', async () => {
  repository.saveMealAndCard.mockImplementation(() => pendingSave.promise)
  await completeRecordFlow(user)
  await user.click(screen.getByRole('button', { name: '도감에 저장' }))
  expect(screen.queryByText('다음 목표')).not.toBeInTheDocument()
  pendingSave.resolve()
  expect(await screen.findByText('다음 목표')).toBeInTheDocument()
})
```

Add a retry test asserting one reward key after two save attempts.

- [ ] **Step 2: Run App tests and confirm failure**

Run: `npm.cmd run test:run -- src/App.test.tsx`

- [ ] **Step 3: Implement before/after calculation and pending result**

In `savePending`, build `before` from current entries, build `after` with the pending meal/card, calculate the result once, convert persisted reward drafts to existing `UserReward` records, save, then set `lastIntegratedResult` only after success. Preserve quota fallback and request-order protection.

- [ ] **Step 4: Run App tests**

Run: `npm.cmd run test:run -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/App.tsx src/App.test.tsx
git commit -m "feat: connect meal saves to unified rewards"
```

### Task 4: Card-first reward presentation

**Files:**
- Modify: `src/features/reveal/CardReveal.tsx`
- Modify: `src/features/reveal/CardReveal.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: optional `IntegratedMealResult`, reduced-motion setting, `onSkipReward`.
- Produces: card-first display, up to three reward chips, collapsed details, and next goal.

- [ ] **Step 1: Write reward presentation tests**

```ts
it('renders three primary rewards and one next goal', () => {
  render(<CardReveal integratedResult={result} {...requiredProps} />)
  expect(screen.getAllByTestId('primary-reward')).toHaveLength(3)
  expect(screen.getByText(result.nextGoal.label)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run reveal tests and confirm failure**

Run: `npm.cmd run test:run -- src/features/reveal/CardReveal.test.tsx`

- [ ] **Step 3: Implement staged content without new routes**

Keep the existing card scene. Add one result panel below it, a `details` element for extra results, and a skip button that marks presentation complete without altering persistence. Add CSS using existing purple/cream/yellow tokens and remove transforms/particles under reduced motion.

- [ ] **Step 4: Run reveal and accessibility tests**

Run: `npm.cmd run test:run -- src/features/reveal/CardReveal.test.tsx src/App.test.tsx`

- [ ] **Step 5: Commit**

```powershell
git add src/features/reveal/CardReveal.tsx src/features/reveal/CardReveal.test.tsx src/styles.css
git commit -m "feat: present unified meal rewards"
```

### Task 5: Reflect the result in existing screens

**Files:**
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/features/home/HomeScreen.test.tsx`
- Modify: `src/features/collection/CardCollectionTab.tsx`
- Modify: `src/features/collection/CollectionScreen.test.tsx`
- Modify: `src/features/adventure/AdventureScreen.tsx`
- Modify: `src/features/adventure/AdventureScreen.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `IntegratedMealResult` IDs and next goal.
- Produces: one home next-goal callout and temporary NEW highlights in existing tabs.

- [ ] **Step 1: Write screen reflection tests**

```ts
expect(screen.getByRole('region', { name: '오늘의 다음 행동' })).toHaveTextContent(result.nextGoal.label)
expect(screen.getByTestId(`card-${newCard.id}`)).toHaveClass('recently-unlocked')
expect(screen.getByTestId(`achievement-${achievementId}`)).toHaveClass('recently-unlocked')
```

- [ ] **Step 2: Run screen tests and confirm failure**

Run: `npm.cmd run test:run -- src/features/home/HomeScreen.test.tsx src/features/collection/CollectionScreen.test.tsx src/features/adventure/AdventureScreen.test.tsx`

- [ ] **Step 3: Add existing-layout highlights**

Pass only IDs and one next-goal string. Reuse album, growth, today, and achievement tabs. Add no new cards or routes. Use a short border/glow highlight disabled under reduced motion.

- [ ] **Step 4: Run screen tests**

Run the same command as Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/home/HomeScreen.tsx src/features/home/HomeScreen.test.tsx src/features/collection/CardCollectionTab.tsx src/features/collection/CollectionScreen.test.tsx src/features/adventure/AdventureScreen.tsx src/features/adventure/AdventureScreen.test.tsx src/styles.css
git commit -m "feat: highlight meal progress across screens"
```

### Task 6: Full regression, offline verification, and deployment

**Files:**
- Modify only if a regression is found; do not broaden scope.

**Interfaces:**
- Consumes: completed Tasks 1-5.
- Produces: verified branch and successful Vercel Preview.

- [ ] **Step 1: Run the complete suite**

Run: `npm.cmd run test:run`

Expected: all test files pass with no unhandled errors.

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build succeed.

- [ ] **Step 3: Inspect scope**

Run: `git status --short` and `git diff --check`.

Confirm no file under `supabase/schema/` changed and no unrelated files are staged.

- [ ] **Step 4: Push branch**

```powershell
git push origin feature/foodex-mvp
```

- [ ] **Step 5: Verify Vercel Preview**

Run `gh api repos/asitiso/foodex/commits/<sha>/status` until Vercel reports `success`. Record the Preview URL in the handoff.
