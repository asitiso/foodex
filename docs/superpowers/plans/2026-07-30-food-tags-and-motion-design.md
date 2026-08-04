# Food Tags and Varied Companion Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Foodex with tag-driven food collection, generated achievements/events, category progress, representative snacks/drinks, and five varied character click motions.

**Architecture:** Food catalog entries gain stable tags and aliases; progression derives tag counts and generated achievement/event records from those tags. The collection screen renders tag progress without changing meal persistence. Companion clicks use a repeat-avoiding action cycle and CSS motion classes.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS keyframes.

## Global Constraints

- User-entered names remain aliases/fallback records and never become achievement IDs.
- Do not modify `supabase/schema/` or persistence table contracts.
- Preserve reduced-motion support and existing Foodex visual palette.

### Task 1: Add stable food tags, aliases, and representative foods

**Files:** `src/domain/types.ts`, `src/domain/foodCatalog.ts`, related tests.

- Add a `FoodTag` union and `tags` field to `FoodDefinition`.
- Add tag-aware lookup helpers that normalize aliases and map unknown names to `other` without creating new IDs.
- Add milk caramel, coffee, cola, grape juice, potato chips, cookies, and similar representative foods with aliases.
- Test tag lookup and representative food search before moving on.

### Task 2: Generate tag-based achievements and events

**Files:** `src/domain/progression.ts`, `src/domain/tagProgression.ts`, `src/domain/v3Progression.ts`, tests.

- Add reusable tag-count derivation from meal entries.
- Generate milestone achievements from tag/count templates and pair events from tag combinations.
- Keep existing achievements and events compatible while appending generated records.
- Test that names do not affect IDs, tags unlock milestones, and pair events report progress.

### Task 3: Show category/tag collection progress

**Files:** `src/features/collection/CardCollectionTab.tsx`, styles, tests.

- Render a compact “분류별 수집 현황” panel with discovered/target counts for the most useful tags.
- Keep current region/rarity filters and card list unchanged.
- Test that tag counts render and update from entries.

### Task 4: Add five repeat-avoiding companion click motions

**Files:** `src/features/home/CompanionRoom.tsx`, `src/features/home/CompanionRoom.test.tsx`, `src/styles.css`.

- Cycle through jump, wiggle, tail, ears, and sparkle actions while excluding the previous action.
- Keep click reactions transient and respect reduced motion.
- Add CSS keyframes/classes for each motion and test that consecutive clicks produce different action classes.

### Task 5: Verify and publish

- Run the full Vitest suite and production build.
- Commit only planned files and push `feature/foodex-mvp`.
- Confirm Vercel Preview succeeds for the pushed commit.
