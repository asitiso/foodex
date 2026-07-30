# Companion Click Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make home-room clicks feel tactile with a short press bounce and a small sparkle pop while preserving reduced-motion behavior.

**Architecture:** Keep the interaction state in `CompanionRoom` and use CSS classes/keyframes for the visual response. Reuse the existing click handlers so no persistence or Supabase behavior changes.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS keyframes.

## Global Constraints

- Do not change Supabase schemas or persistence behavior.
- Keep the existing purple/yellow Foodex palette.
- Respect `reducedMotion` and `prefers-reduced-motion`.

### Task 1: Add click-feedback state and regression coverage

**Files:**
- Modify: `src/features/home/CompanionRoom.tsx`
- Test: `src/features/home/CompanionRoom.test.tsx`

- [ ] Add a test that clicking the character exposes a temporary sparkle-feedback element and clears it after its short lifetime.
- [ ] Run the focused test and confirm it fails because the feedback element does not exist.
- [ ] Add a transient `clickFeedback` state in `CompanionRoom`, set it from character/object clicks, and clear it with a timeout.
- [ ] Render a small `✦` feedback element with an accessible status label.
- [ ] Run the focused test and confirm it passes.

### Task 2: Style tactile press and sparkle feedback

**Files:**
- Modify: `src/styles.css`

- [ ] Add a shared `:active` press transform for interactive room buttons without overriding the existing activity animations.
- [ ] Add sparkle-pop keyframes and positioning around the character.
- [ ] Disable sparkle animation under reduced motion while retaining a static visual cue.
- [ ] Run the focused test and production build.

### Task 3: Full verification and publish

**Files:**
- Modify: none beyond Tasks 1-2.

- [ ] Run the full Vitest suite and `npm.cmd run build`.
- [ ] Commit only the planned files with `feat: add tactile companion click feedback`.
- [ ] Push `feature/foodex-mvp` and verify the Vercel Preview status is successful.
