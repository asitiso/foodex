# Foodex V2 Game Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the V2 collectible game loop: legendary rarity, XP bonuses, food evolution, season events, daily quests, reward boxes, and collection bonuses.

**Architecture:** Keep all game math in `src/domain` and derive state from existing `FoodCard` plus `MealRecord` entries. Avoid new persistence stores; the UI should display V2 progress without adding extra user actions to the meal recording flow.

**Tech Stack:** React, TypeScript, Vite, Vitest, IndexedDB.

## Global Constraints

- Food recording remains `photo -> food type -> amount -> reveal -> save`.
- Small amounts must never create negative copy or penalties.
- No login, server sync, payment, random-box purchase, or remote APIs.
- V2 rewards are derived from local records only.

---

### Task 1: V2 Domain Rules

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/cardRules.ts`
- Modify: `src/domain/cardRules.test.ts`
- Modify: `src/domain/progression.ts`
- Modify: `src/domain/progression.test.ts`

**Interfaces:**
- Produces: `Rarity = 'common' | 'rare' | 'epic' | 'legendary'`
- Produces: `buildProgression(entries, now)` with `evolutions`, `season`, `rewardBox`, and `collectionBonuses`

- [ ] Write failing tests for legendary rarity, XP bonuses, evolution levels, season progress, reward box availability, and collection bonuses.
- [ ] Run targeted tests and confirm expected failures.
- [ ] Implement minimal deterministic rules.
- [ ] Run targeted tests and confirm pass.

### Task 2: V2 Home and Collection UI

**Files:**
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/features/collection/CollectionScreen.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/features/collection/CollectionScreen.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `Progression`
- Produces: home panels for season and reward box, collection badges for evolution and bonuses.

- [ ] Write failing UI tests for season event, reward box, evolved card label, and collection bonus display.
- [ ] Run targeted tests and confirm expected failures.
- [ ] Add minimal UI panels using existing card-like styling.
- [ ] Run targeted tests and confirm pass.

### Task 3: Final Verification

**Files:**
- All changed files

- [ ] Run `npm run test:run`.
- [ ] Run `npm run build`.
- [ ] Report exact verification results and remaining deployment status.
