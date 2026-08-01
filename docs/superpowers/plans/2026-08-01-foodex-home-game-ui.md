# Foodex Home Game UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every existing Foodex home action intact while replacing the flat web-style presentation with a cohesive purple-and-gold kids-game interface.

**Architecture:** Add isolated home-only visual components and styles on top of the existing `WorldHomeScene`, `GameIcon`, `WorldHotspot`, `MealRecordOrb`, and `BottomNav` APIs. Each task changes one visual layer, keeps callbacks and DOM order stable, and is verified before the next task begins.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, Vite, Vercel Preview.

## Global Constraints

- Preserve all existing callbacks, routes, data structures, game systems, and tab DOM order.
- Do not add a new gameplay feature or data dependency.
- Keep touch targets at least 52px.
- Keep the home scene usable without scrolling at 375×667, 390×844, and 430×932.
- Load home-specific overrides after shared game styles so other screens remain unchanged.
- Do not proceed to the next task until focused tests, full tests, build, Preview deployment, and mobile visual verification pass.

---

## File Structure

- `src/features/home/GameLogo.tsx`: reusable FOODEX game-logo markup.
- `src/features/home/GameLogo.test.tsx`: logo semantics and decoration tests.
- `src/ui/GameIcon.tsx`: existing icon API with filled toy-style variants for six priority icons.
- `src/ui/GameIcon.test.tsx`: icon API and filled-rendering regression tests.
- `src/features/home/WorldHomeScene.tsx`: mounts the new logo and keeps existing actions.
- `src/features/home/WorldHomeScene.test.tsx`: home action and logo integration tests.
- `src/features/home/WorldHotspot.tsx`: keeps callbacks and applies building-sign variants.
- `src/features/home/MealRecordOrb.tsx`: keeps record callback and exposes main-action structure.
- `src/ui/BottomNav.tsx`: keeps tab order and callbacks while exposing card-style classes.
- `src/ui/BottomNav.test.tsx`: tab order, labels, and active-state tests.
- `src/homeGameUi.css`: isolated final visual layer for logo, icons, buttons, navigation, and scene placement.
- `src/main.tsx`: imports `homeGameUi.css` last.

---

### Task 1: FOODEX Game Logo

**Files:**
- Create: `src/features/home/GameLogo.tsx`
- Create: `src/features/home/GameLogo.test.tsx`
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/features/home/WorldHomeScene.test.tsx`
- Create: `src/homeGameUi.css`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `GameLogo(): JSX.Element`
- Consumes: no props; decorative star and sparkle elements are `aria-hidden`.

- [ ] **Step 1: Write the failing logo test**

```tsx
render(<GameLogo />)
expect(screen.getByRole('img', { name: 'FOODEX' })).toBeInTheDocument()
expect(screen.getByTestId('foodex-logo-star')).toHaveAttribute('aria-hidden', 'true')
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/features/home/GameLogo.test.tsx src/features/home/WorldHomeScene.test.tsx`

Expected: FAIL because `GameLogo` does not exist and the home scene still renders the old text logo.

- [ ] **Step 3: Implement the minimal logo component**

Use semantic markup with one accessible image role and individual letter spans:

```tsx
export function GameLogo() {
  return (
    <div className="foodex-game-logo" role="img" aria-label="FOODEX">
      <span className="foodex-logo-word" aria-hidden="true">
        {'FOODEX'.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ '--letter-index': index } as React.CSSProperties}>{letter}</span>
        ))}
      </span>
      <span className="foodex-logo-star" data-testid="foodex-logo-star" aria-hidden="true">★</span>
      <span className="foodex-logo-sparkles" aria-hidden="true">✦ ✦</span>
    </div>
  )
}
```

Replace only the existing logo element in `WorldHomeScene`; do not alter callbacks or scene order.

- [ ] **Step 4: Add isolated logo styling**

In `homeGameUi.css`, implement white extruded letters, purple outer stroke, pink-purple lower shadow, gold star, responsive width, and collision-safe top placement. Use CSS only; no remote font or image dependency.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/features/home/GameLogo.test.tsx src/features/home/WorldHomeScene.test.tsx`

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run: `npm run test:run && npm run build`

Expected: PASS with no TypeScript or Vite errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/home/GameLogo.tsx src/features/home/GameLogo.test.tsx src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx src/homeGameUi.css src/main.tsx
git commit -m "feat: add Foodex game logo"
```

- [ ] **Step 8: Preview and mobile visual gate**

Verify 375×667, 390×844, and 430×932. The logo must not overlap the left status rail or right coin pill. Stop if it does.

---

### Task 2: Six Priority Toy-Style Icons

**Files:**
- Modify: `src/ui/GameIcon.tsx`
- Modify: `src/ui/GameIcon.test.tsx`
- Modify: `src/homeGameUi.css`

**Interfaces:**
- Consumes: existing `GameIconName` values.
- Produces: filled toy-style renderings for `collection`, `adventure`, `buddy`, `camera`, `shop`, and `quest` while preserving `<GameIcon name="..." />`.

- [ ] **Step 1: Write failing rendering tests**

For each priority icon, render `GameIcon` and assert a stable `data-game-icon-style="toy"` marker and accessible SVG structure.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/ui/GameIcon.test.tsx`

Expected: FAIL because the priority icons do not expose the toy-style marker.

- [ ] **Step 3: Implement minimal filled variants**

Keep the public name union unchanged. Add layered SVG shapes with thick purple strokes, bright fills, top highlights, and lower shadow shapes. Do not convert non-priority icons.

- [ ] **Step 4: Add shared icon depth styling**

Use `.game-icon[data-game-icon-style="toy"]` rules for drop shadow and highlight without changing button hit areas.

- [ ] **Step 5: Run focused and full verification**

Run: `npm test -- src/ui/GameIcon.test.tsx && npm run test:run && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/GameIcon.tsx src/ui/GameIcon.test.tsx src/homeGameUi.css
git commit -m "feat: add toy style game icons"
```

- [ ] **Step 7: Preview and mobile visual gate**

Confirm icons remain recognizable at their smallest rendered size and do not clip inside existing buttons.

---

### Task 3: Three-Level Game Button System

**Files:**
- Modify: `src/features/home/WorldHotspot.tsx`
- Modify: `src/features/home/WorldHotspot.test.tsx`
- Modify: `src/features/home/MealRecordOrb.tsx`
- Modify: `src/features/home/MealRecordOrb.test.tsx`
- Modify: `src/homeGameUi.css`

**Interfaces:**
- Produces: building-sign hotspot class, main-action camera class, and shared pressed-state styling.
- Preserves: all button labels and callback signatures.

- [ ] **Step 1: Write failing class and callback tests**

Assert that a world hotspot exposes the building-sign class, the meal button exposes the main-action class, and clicking each still invokes its original callback exactly once.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/features/home/WorldHotspot.test.tsx src/features/home/MealRecordOrb.test.tsx`

Expected: FAIL on the new class assertions only.

- [ ] **Step 3: Add semantic style hooks**

Add stable classes without wrapping or reordering callback elements.

- [ ] **Step 4: Implement visual hierarchy**

Building signs: cream face, purple frame, white inset highlight, lower purple extrusion.

Main action: larger camera/orb face, gold rim, animated sparkle limited by reduced-motion rules.

All buttons: minimum 52px, visible focus ring, pressed translation that does not alter absolute coordinates.

- [ ] **Step 5: Run focused and full verification**

Run: `npm test -- src/features/home/WorldHotspot.test.tsx src/features/home/MealRecordOrb.test.tsx && npm run test:run && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/WorldHotspot.tsx src/features/home/WorldHotspot.test.tsx src/features/home/MealRecordOrb.tsx src/features/home/MealRecordOrb.test.tsx src/homeGameUi.css
git commit -m "feat: unify home game buttons"
```

- [ ] **Step 7: Preview and mobile visual gate**

Confirm the main action is visually dominant but does not cover the character. Confirm sign labels remain readable.

---

### Task 4: Card-Style Bottom Navigation

**Files:**
- Modify: `src/ui/BottomNav.tsx`
- Modify: `src/ui/BottomNav.test.tsx`
- Modify: `src/homeGameUi.css`

**Interfaces:**
- Preserves: tab order `home`, `collection`, `record`, `adventure`, `companion` and existing callback API.
- Produces: per-tab `game-nav-card` class and active-state styling hook.

- [ ] **Step 1: Write failing order and class tests**

Assert five buttons remain in the same DOM order, each has `game-nav-card`, the center record button remains third, and active state remains accessible through `aria-current` or the existing selected marker.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/ui/BottomNav.test.tsx`

Expected: FAIL on the new class assertions while existing navigation behavior remains green.

- [ ] **Step 3: Add minimal class hooks**

Do not change event handlers, labels, or order.

- [ ] **Step 4: Implement card navigation styling**

Give each tab an independent cream card, purple border, lower extrusion, toy icon, and selected gold glow. Keep the center record card larger without negative margins or overlap.

- [ ] **Step 5: Run focused and full verification**

Run: `npm test -- src/ui/BottomNav.test.tsx && npm run test:run && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/BottomNav.tsx src/ui/BottomNav.test.tsx src/homeGameUi.css
git commit -m "feat: style bottom navigation as game cards"
```

- [ ] **Step 7: Preview and mobile visual gate**

Confirm all five cards fit at 375px width, labels do not wrap unexpectedly, and no card overlaps the scene or another card.

---

### Task 5: Bind Buttons to Background Landmarks

**Files:**
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/features/home/WorldHomeScene.test.tsx`
- Modify: `src/homeGameUi.css`

**Interfaces:**
- Preserves: existing actions for collection, adventure, companion, meals, level, coins, and record.
- Produces: stable location classes for collection building, castle/adventure, companion house, and central camera.

- [ ] **Step 1: Write failing landmark tests**

Render the home scene and assert each interactive landmark has a distinct stable class or `data-home-landmark` value: `collection`, `adventure`, `companion`, and `record`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/features/home/WorldHomeScene.test.tsx`

Expected: FAIL because landmark markers are absent.

- [ ] **Step 3: Add location markers without changing action wiring**

Reuse the current components and callbacks; only add classes/data attributes.

- [ ] **Step 4: Position landmarks responsively**

Use percentages anchored to the artwork rather than viewport corners. Add explicit rules for 375×667, 390×844, and 430×932. Keep the character centered and reserve the lower navigation clearance.

- [ ] **Step 5: Run focused and full verification**

Run: `npm test -- src/features/home/WorldHomeScene.test.tsx && npm run test:run && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx src/homeGameUi.css
git commit -m "feat: anchor home actions to world landmarks"
```

- [ ] **Step 7: Final Preview gate**

At all three target viewports verify:

- Logo clear of status and coin HUD.
- Character remains on the central plaza.
- Building signs point to their buildings without covering key artwork.
- Record control does not overlap the character.
- Bottom navigation does not cover content.
- Every original click action still opens the same destination.

---

### Task 6: Final Regression and PR Update

**Files:**
- Modify: PR description or add a PR comment only; no product code unless a verified regression requires it.

- [ ] **Step 1: Run final verification from a clean dependency install**

Run: `npm ci && npm run test:run && npm run build`

Expected: PASS.

- [ ] **Step 2: Verify deployment status**

Confirm Vercel Preview reports `Ready` for the final head commit.

- [ ] **Step 3: Review the diff**

Confirm no route, data model, callback signature, or gameplay system changed.

- [ ] **Step 4: Update PR #4**

Document completed steps, test commands, target viewport results, and any remaining visual issue. Do not merge until the final screenshots are accepted.
