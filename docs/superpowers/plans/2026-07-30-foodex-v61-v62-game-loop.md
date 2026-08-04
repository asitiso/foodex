# Foodex V6.1/V6.2 Game Loop Implementation Plan

> **For agentic workers:** Execute this plan inline with test-first checkpoints.

**Goal:** Turn the V6 world hub into a repeatable daily game loop while preserving local-first storage and Supabase synchronization.

**Architecture:** Add a pure progression module that derives daily expeditions, food-combination missions, resident bonds, weekly events, party bonuses, and relationship episodes from existing meal/card entries. Keep all state derivable from existing records and rewards, so no Supabase schema change is required. Add compact UI sections to the existing Home and World screens.

**Tech Stack:** React 19, TypeScript, Vitest, IndexedDB via idb, Supabase JS repository adapter.

## Global Constraints

- Do not modify `supabase/schema/`.
- Do not store Supabase keys in source control.
- Preserve existing V5/V6 tests and mobile layout.
- Prefer deterministic date-based events over server-managed timers.
- Verify both `npm.cmd run test:run` and `npm.cmd run build` before commit.

### Task 1: V6.1/V6.2 pure progression rules

**Files:**
- Create: `src/domain/v61GameLoop.ts`
- Test: `src/domain/v61GameLoop.test.ts`

- [ ] Write failing tests for a daily expedition, food-combination mission, resident bond level, weekly event, party bonus, and relationship episode.
- [ ] Run the focused test and confirm failure because the module is absent.
- [ ] Implement deterministic functions using existing `MealRecord`, `FoodCard`, and `FoodType` values.
- [ ] Run the focused test and confirm all rules pass.

### Task 2: World and home UI loop

**Files:**
- Modify: `src/features/world/WorldHubScreen.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/features/world/WorldHubScreen.test.tsx`

- [ ] Add a failing screen test for the current expedition, bond progress, weekly event, party, and next action.
- [ ] Implement compact cards that link the existing record action to the expedition target.
- [ ] Keep the world hub readable on narrow screens and avoid duplicate mission text on Home.
- [ ] Run the screen test and existing home/app tests.

### Task 3: Supabase/local sync verification

**Files:**
- Modify: `src/data/supabaseRepository.test.ts` only if a regression test is needed.
- Modify: `src/data/syncRepository.test.ts` only if a regression test is needed.

- [ ] Verify V6 progress remains derivable after local save and pending sync removal.
- [ ] Run repository adapter tests to confirm meal/card/reward upserts are still called.
- [ ] If the supplied VITE Supabase settings are available, run a non-destructive authenticated read/write smoke check without committing secrets.

### Task 4: Full verification and publish

- [ ] Run `npm.cmd run test:run`.
- [ ] Run `npm.cmd run build`.
- [ ] Inspect `git diff --name-only` and confirm `supabase/schema/` is untouched.
- [ ] Commit the implementation and push `feature/foodex-mvp`.
- [ ] Confirm the pushed branch and Vercel Preview check.
