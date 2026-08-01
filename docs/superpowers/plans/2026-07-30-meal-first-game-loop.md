# Meal-first Game Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 저장된 식사 기록을 하루 게이지·콤보·다음 한 끼 미션·성장 목표로 변환해 실제 식사 행동을 게임 보상으로 연결한다.

**Architecture:** 순수 도메인 함수 `buildMealGameLoop`가 `MealRecord` 목록에서 파생 상태를 계산하고, 홈 화면은 progression의 상태를 표시한다. Supabase와 스키마는 변경하지 않는다.

**Tech Stack:** TypeScript, React, Vitest, existing CSS.

## Global Constraints

- `supabase/schema/`는 수정하지 않는다.
- 식사 기록 원본과 저장 흐름은 변경하지 않는다.
- Windows 검증 명령은 `npm.cmd`를 사용한다.

### Task 1: Add meal game loop domain state

**Files:** Create `src/domain/mealGameLoop.ts` and `src/domain/mealGameLoop.test.ts`.

- [ ] Write tests for empty, one/two/three meals today and growth thresholds.
- [ ] Run `npm.cmd run test:run -- src/domain/mealGameLoop.test.ts` and confirm failure because the module is missing.
- [ ] Implement `MealGameLoopState` and pure `buildMealGameLoop(entries, now)` with local-day counting, a capped 3-step gauge, next meal target, and thresholds `[3,7,14,30,100]`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Integrate derived state into progression

**Files:** Modify `src/domain/progression.ts` and `src/domain/progression.test.ts`.

- [ ] Add a regression assertion that `buildProgression` exposes the meal game loop.
- [ ] Run the focused progression test and confirm failure before integration.
- [ ] Add `mealGameLoop` to the progression return object using the pure builder.
- [ ] Run progression tests and confirm they pass.

### Task 3: Render the loop on the home screen

**Files:** Modify the existing home screen component, `src/styles.css`, and its test.

- [ ] Add a failing UI test for `오늘의 식사 게이지`, `다음 한 끼`, and the current meal count.
- [ ] Run that test and confirm the labels are absent.
- [ ] Render a compact panel with three gauge steps, next target text, and growth target text.
- [ ] Add responsive styles and reduced-motion-safe styling.
- [ ] Run the UI test and confirm it passes.

### Task 4: Verify and publish

- [ ] Run `npm.cmd run test:run`.
- [ ] Run `npm.cmd run build`.
- [ ] Confirm `git status --short` shows no `supabase/schema/` changes.
- [ ] Commit with `feat: add meal-first game loop`.
- [ ] Push `feature/foodex-mvp` and verify the Vercel Preview status.
