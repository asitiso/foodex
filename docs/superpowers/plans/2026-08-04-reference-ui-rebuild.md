# Foodex Reference UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Foodex home interface on `agent/foodex-reference-home-v4` so the HUD, world buttons, logo, character placement, and five-tab navigation closely match the approved reference image while preserving every existing callback, route, and data flow.

**Architecture:** Replace the current temporary home-only presentation with focused React components for the reference HUD and landmark actions, then load one final `referenceHomeUi.css` override after the existing scene styles. Reuse the existing application bottom navigation rather than rendering a second menu inside `WorldHomeScene`, and keep scene artwork, interaction callbacks, and accessibility names independent from visual positioning.

**Tech Stack:** React 19, TypeScript 5.9, CSS, Vitest 3, Testing Library, Vite 7, Vercel Preview.

## Global Constraints

- Work only on `agent/foodex-reference-home-v4`; do not create another preview branch.
- Preserve `WorldHomeSceneProps` and all existing callback signatures.
- Preserve level, card, meal, streak, coin, character, and emotion data flows.
- Do not change routes, persistence, Supabase, wallet logic, or other screens.
- Keep every interactive target at least 52px.
- Keep existing accessible names for level, cards, meals, coins, collection, adventure, companion, and meal recording.
- Decorative images use `alt=""` and `aria-hidden="true"`.
- Respect both the existing `reducedMotion` prop and `prefers-reduced-motion`.
- Verify 375×667, 390×844, and 430×932.
- Do not use image assets that retain black, gray, or opaque rectangular backgrounds.
- Do not render the old `업적 / 퀘스트 / 상점 / 소식` dock inside the world scene.

---

## File Structure

- `src/features/home/ReferenceStatusCard.tsx`: reusable reference-style status card for level, cards, and meals.
- `src/features/home/ReferenceStatusCard.test.tsx`: status value, progress, and helper-text tests.
- `src/features/home/ReferenceGameHud.tsx`: composes three status cards, the central logo, and the coin capsule.
- `src/features/home/ReferenceGameHud.test.tsx`: HUD content and callback tests.
- `src/features/home/ReferenceLandmarkButton.tsx`: collection, adventure, and buddy sign buttons with explicit variants.
- `src/features/home/ReferenceLandmarkButton.test.tsx`: variant, accessible-name, and callback tests.
- `src/features/home/ReferenceRecordButton.tsx`: primary camera-style meal recording action.
- `src/features/home/ReferenceRecordButton.test.tsx`: record action and visual-hook tests.
- `src/features/home/WorldHomeScene.tsx`: mounts the new HUD and world controls, removes the four-item internal dock.
- `src/features/home/WorldHomeScene.test.tsx`: integration and regression coverage.
- `src/ui/BottomNav.tsx`: existing five-tab navigation; add stable reference-home classes without changing order or callbacks.
- `src/ui/BottomNav.test.tsx`: tab order, active state, and center-record emphasis tests.
- `src/features/home/referenceHomeUi.css`: single final source of HUD, landmark, record, character, and responsive home coordinates.
- `src/features/home/homeSceneUi.css`: remove rules superseded by `referenceHomeUi.css` or reduce it to non-conflicting shared rules.
- `src/features/home/homeSceneV4.css`: remove temporary v4 coordinate overrides that conflict with the new reference layer.

---

### Task 1: Reference Status Cards and HUD

**Files:**
- Create: `src/features/home/ReferenceStatusCard.tsx`
- Create: `src/features/home/ReferenceStatusCard.test.tsx`
- Create: `src/features/home/ReferenceGameHud.tsx`
- Create: `src/features/home/ReferenceGameHud.test.tsx`
- Modify: `src/features/home/WorldHomeScene.tsx`

**Interfaces:**
- Produces:
  - `ReferenceStatusCard(props: ReferenceStatusCardProps): JSX.Element`
  - `ReferenceGameHud(props: ReferenceGameHudProps): JSX.Element`
- `ReferenceStatusCardProps`:

```ts
export interface ReferenceStatusCardProps {
  title: string
  value: string
  helperText?: string
  progress?: number
  tone: 'level' | 'cards' | 'meals'
  ariaLabel: string
  onActivate: () => void
}
```

- `ReferenceGameHudProps` preserves the current `GameHud` values and callbacks:

```ts
export interface ReferenceGameHudProps {
  coinBalance: number
  level: number
  levelProgress: number
  todayCards: number
  todayMeals: number
  mealTarget: number
  streakDays: number
  onOpenLevel: () => void
  onOpenCards: () => void
  onOpenMeals: () => void
  onOpenCoins: () => void
}
```

- [ ] **Step 1: Write failing status-card tests**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReferenceStatusCard } from './ReferenceStatusCard'

describe('ReferenceStatusCard', () => {
  it('renders value, helper text, and progress with the requested tone', async () => {
    const onActivate = vi.fn()
    const user = userEvent.setup()

    render(
      <ReferenceStatusCard
        title="식사"
        value="2/3"
        helperText="연속 3일"
        progress={67}
        tone="meals"
        ariaLabel="오늘 식사 2/3, 연속 3일"
        onActivate={onActivate}
      />,
    )

    const button = screen.getByRole('button', { name: '오늘 식사 2/3, 연속 3일' })
    expect(button).toHaveAttribute('data-status-tone', 'meals')
    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByText('연속 3일')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67')

    await user.click(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
npm run test:run -- src/features/home/ReferenceStatusCard.test.tsx
```

Expected: FAIL because `ReferenceStatusCard` does not exist.

- [ ] **Step 3: Implement the minimal status card**

```tsx
export function ReferenceStatusCard({
  title,
  value,
  helperText,
  progress,
  tone,
  ariaLabel,
  onActivate,
}: ReferenceStatusCardProps) {
  return (
    <button
      type="button"
      className="reference-status-card"
      data-status-tone={tone}
      aria-label={ariaLabel}
      onClick={onActivate}
    >
      <span className="reference-status-title">{title}</span>
      <strong className="reference-status-value">{value}</strong>
      {helperText ? <span className="reference-status-helper">{helperText}</span> : null}
      {typeof progress === 'number' ? (
        <span
          className="reference-status-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.max(0, Math.min(100, progress))}
        >
          <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </span>
      ) : null}
    </button>
  )
}
```

- [ ] **Step 4: Run the status-card test and verify pass**

Run:

```bash
npm run test:run -- src/features/home/ReferenceStatusCard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Write failing HUD tests**

```tsx
render(
  <ReferenceGameHud
    coinBalance={1250}
    level={12}
    levelProgress={42}
    todayCards={32}
    todayMeals={2}
    mealTarget={3}
    streakDays={3}
    onOpenLevel={onOpenLevel}
    onOpenCards={onOpenCards}
    onOpenMeals={onOpenMeals}
    onOpenCoins={onOpenCoins}
  />,
)

expect(screen.getAllByTestId('reference-status-card')).toHaveLength(3)
expect(screen.getByRole('img', { name: 'FOODEX' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '보유 코인 1250개' })).toBeInTheDocument()
```

Also click each status and coin button and assert the corresponding callback is called exactly once.

- [ ] **Step 6: Run HUD tests and verify failure**

Run:

```bash
npm run test:run -- src/features/home/ReferenceGameHud.test.tsx
```

Expected: FAIL because `ReferenceGameHud` does not exist.

- [ ] **Step 7: Implement the HUD composition**

Implement a `header.reference-game-hud` containing:

```tsx
<div className="reference-status-stack">
  <ReferenceStatusCard title="Lv." value={String(level)} progress={levelProgress} tone="level" ... />
  <ReferenceStatusCard title="카드" value={String(todayCards)} tone="cards" ... />
  <ReferenceStatusCard title="식사" value={`${todayMeals}/${mealTarget}`} helperText={`연속 ${streakDays}일`} tone="meals" ... />
</div>
<GameLogo />
<button className="reference-coin-capsule" aria-label={`보유 코인 ${coinBalance}개`} ...>
  <span aria-hidden="true"><GameIcon name="coin" /></span>
  <strong>{coinBalance.toLocaleString()}</strong>
  <span className="reference-coin-plus" aria-hidden="true">+</span>
</button>
```

Add `data-testid="reference-status-card"` to each status card root.

- [ ] **Step 8: Replace `GameHud` in `WorldHomeScene`**

Replace the `GameHud` import and JSX with `ReferenceGameHud`. Do not change the calculated `levelProgress` or any callback wiring.

- [ ] **Step 9: Run focused integration tests**

Run:

```bash
npm run test:run -- src/features/home/ReferenceStatusCard.test.tsx src/features/home/ReferenceGameHud.test.tsx src/features/home/WorldHomeScene.test.tsx
```

Expected: PASS after updating existing queries only where the old HUD-specific markup changed; accessible names and callback assertions must stay intact.

- [ ] **Step 10: Commit**

```bash
git add src/features/home/ReferenceStatusCard.tsx src/features/home/ReferenceStatusCard.test.tsx src/features/home/ReferenceGameHud.tsx src/features/home/ReferenceGameHud.test.tsx src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx
git commit -m "feat: rebuild reference home hud"
```

---

### Task 2: Variant Landmark Sign Buttons

**Files:**
- Create: `src/features/home/ReferenceLandmarkButton.tsx`
- Create: `src/features/home/ReferenceLandmarkButton.test.tsx`
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/features/home/WorldHomeScene.test.tsx`

**Interfaces:**

```ts
export type ReferenceLandmarkVariant = 'collection' | 'adventure' | 'buddy'

export interface ReferenceLandmarkButtonProps {
  variant: ReferenceLandmarkVariant
  label: string
  text: string
  icon: GameIconName
  className: string
  onActivate: () => void
}
```

- [ ] **Step 1: Write failing variant and callback tests**

```tsx
render(
  <ReferenceLandmarkButton
    variant="collection"
    label="도감 열기"
    text="도감"
    icon="collection"
    className="world-landmark-collection"
    onActivate={onActivate}
  />,
)

const button = screen.getByRole('button', { name: '도감 열기' })
expect(button).toHaveAttribute('data-landmark-variant', 'collection')
expect(button).toHaveClass('reference-landmark-button', 'world-landmark-collection')
expect(screen.getByText('도감')).toBeInTheDocument()
```

Click and assert `onActivate` is called once. Repeat rendering checks for `adventure` and `buddy` variants in a parameterized test.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
npm run test:run -- src/features/home/ReferenceLandmarkButton.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the landmark component**

```tsx
export function ReferenceLandmarkButton({
  variant,
  label,
  text,
  icon,
  className,
  onActivate,
}: ReferenceLandmarkButtonProps) {
  return (
    <button
      type="button"
      className={`reference-landmark-button reference-landmark-button--${variant} ${className}`}
      data-landmark-variant={variant}
      aria-label={label}
      onClick={onActivate}
    >
      <span className="reference-landmark-face">
        <GameIcon name={icon} />
        <strong>{text}</strong>
      </span>
    </button>
  )
}
```

- [ ] **Step 4: Replace the three `WorldHotspot` usages**

Use:

```tsx
<ReferenceLandmarkButton
  variant="collection"
  className="world-landmark-collection"
  label="도감 열기"
  text="도감"
  icon="collection"
  onActivate={onOpenCollection}
/>
```

Repeat for adventure and buddy. Remove the `WorldHotspot` import from `WorldHomeScene` but do not delete the shared component because other screens may use it.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm run test:run -- src/features/home/ReferenceLandmarkButton.test.tsx src/features/home/WorldHomeScene.test.tsx
```

Expected: PASS; all three original callbacks still fire exactly once.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/ReferenceLandmarkButton.tsx src/features/home/ReferenceLandmarkButton.test.tsx src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx
git commit -m "feat: add reference landmark signs"
```

---

### Task 3: Primary Camera Record Button

**Files:**
- Create: `src/features/home/ReferenceRecordButton.tsx`
- Create: `src/features/home/ReferenceRecordButton.test.tsx`
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/features/home/WorldHomeScene.test.tsx`

**Interfaces:**

```ts
export interface ReferenceRecordButtonProps {
  onRecord: () => void
}
```

- [ ] **Step 1: Write the failing record-button test**

```tsx
render(<ReferenceRecordButton onRecord={onRecord} />)

const button = screen.getByRole('button', { name: '식사 기록하기' })
expect(button).toHaveClass('reference-record-button')
expect(button).toHaveAttribute('data-home-landmark', 'record')
expect(button.querySelector('.reference-record-camera')).not.toBeNull()

await user.click(button)
expect(onRecord).toHaveBeenCalledTimes(1)
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm run test:run -- src/features/home/ReferenceRecordButton.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the camera-style action**

```tsx
export function ReferenceRecordButton({ onRecord }: ReferenceRecordButtonProps) {
  return (
    <button
      type="button"
      className="reference-record-button"
      data-home-landmark="record"
      aria-label="식사 기록하기"
      onClick={onRecord}
    >
      <span className="reference-record-camera" aria-hidden="true">
        <span className="reference-record-camera-top" />
        <span className="reference-record-lens"><GameIcon name="camera" /></span>
      </span>
      <strong>식사 기록</strong>
    </button>
  )
}
```

- [ ] **Step 4: Replace `MealRecordOrb` in `WorldHomeScene`**

Replace only the component and import. Preserve `onRecord` unchanged. Do not delete `MealRecordOrb`; other versions may still reference it.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm run test:run -- src/features/home/ReferenceRecordButton.test.tsx src/features/home/WorldHomeScene.test.tsx
```

Expected: PASS and the existing `식사 기록하기` accessible-name assertion remains valid.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/ReferenceRecordButton.tsx src/features/home/ReferenceRecordButton.test.tsx src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx
git commit -m "feat: add primary camera record action"
```

---

### Task 4: Remove Internal Dock and Style the Existing Five-Tab Navigation

**Files:**
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/features/home/WorldHomeScene.test.tsx`
- Modify: `src/ui/BottomNav.tsx`
- Modify: `src/ui/BottomNav.test.tsx`

**Interfaces:**
- Preserve the existing `BottomNav` props and tab keys.
- Produce stable classes:
  - root: `reference-bottom-nav`
  - every tab: `reference-nav-tab`
  - record tab: `reference-nav-tab--record`
  - active tab: `reference-nav-tab--active`

- [ ] **Step 1: Add a failing scene test for dock removal**

```tsx
renderWorldHomeScene()
expect(screen.queryByRole('navigation', { name: '홈 게임 메뉴' })).not.toBeInTheDocument()
expect(screen.queryByRole('button', { name: '업적' })).not.toBeInTheDocument()
expect(screen.queryByRole('button', { name: '퀘스트' })).not.toBeInTheDocument()
expect(screen.queryByRole('button', { name: '상점' })).not.toBeInTheDocument()
expect(screen.queryByRole('button', { name: '소식' })).not.toBeInTheDocument()
```

- [ ] **Step 2: Run the scene test and verify failure**

Run:

```bash
npm run test:run -- src/features/home/WorldHomeScene.test.tsx
```

Expected: FAIL because the four-item internal dock still renders.

- [ ] **Step 3: Remove the four-item dock**

Delete the `HomeMenuCard` import and the `<nav className="home-menu-dock">...</nav>` block from `WorldHomeScene`. Do not alter any world callback.

- [ ] **Step 4: Run the scene test and verify pass**

Run:

```bash
npm run test:run -- src/features/home/WorldHomeScene.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Write failing `BottomNav` class and order tests**

Render the existing `BottomNav` with `activeTab="home"`. Assert:

```tsx
const nav = screen.getByRole('navigation')
expect(nav).toHaveClass('reference-bottom-nav')

const buttons = screen.getAllByRole('button')
expect(buttons.map((button) => button.textContent)).toEqual(
  expect.arrayContaining(['홈', '도감', '촬영', '모험', '버디룸']),
)
expect(buttons[2]).toHaveClass('reference-nav-tab--record')
expect(screen.getByRole('button', { name: /홈/ })).toHaveClass('reference-nav-tab--active')
```

Keep the repository's exact existing accessible labels and selected-state assertion if they differ from visible text.

- [ ] **Step 6: Run the nav test and verify failure**

Run:

```bash
npm run test:run -- src/ui/BottomNav.test.tsx
```

Expected: FAIL only on the new style-hook assertions.

- [ ] **Step 7: Add classes without changing behavior**

In `BottomNav.tsx`, compute classes from each existing tab key and selected state:

```tsx
const className = [
  'reference-nav-tab',
  tab.id === 'record' ? 'reference-nav-tab--record' : '',
  activeTab === tab.id ? 'reference-nav-tab--active' : '',
].filter(Boolean).join(' ')
```

Add `reference-bottom-nav` to the root while keeping the existing class names, tab order, click handlers, labels, and active semantics.

- [ ] **Step 8: Run nav and scene tests**

Run:

```bash
npm run test:run -- src/ui/BottomNav.test.tsx src/features/home/WorldHomeScene.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx src/ui/BottomNav.tsx src/ui/BottomNav.test.tsx
git commit -m "feat: use reference five tab navigation"
```

---

### Task 5: Single Reference Home CSS Layer

**Files:**
- Create: `src/features/home/referenceHomeUi.css`
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/features/home/homeSceneUi.css`
- Modify: `src/features/home/homeSceneV4.css`

**Interfaces:**
- Produces CSS custom properties on `.world-home-scene[data-reference-home="true"]`:

```css
--reference-hud-top
--reference-logo-top
--reference-collection-left
--reference-collection-bottom
--reference-record-left
--reference-record-bottom
--reference-adventure-right
--reference-adventure-bottom
--reference-buddy-right
--reference-buddy-bottom
--reference-character-bottom
--reference-nav-height
```

- [ ] **Step 1: Add the reference marker and final stylesheet import**

In `WorldHomeScene`, add:

```tsx
data-reference-home="true"
```

Import `./referenceHomeUi.css` after `homeSceneV4.css`.

- [ ] **Step 2: Create the base reference layout rules**

The new file must explicitly reset inherited temporary HUD dimensions before applying the reference layout:

```css
.world-home-scene[data-reference-home="true"] {
  --reference-hud-top: max(.55rem, env(safe-area-inset-top));
  --reference-logo-top: 1.15rem;
  --reference-collection-left: 4%;
  --reference-collection-bottom: 30%;
  --reference-record-left: 50%;
  --reference-record-bottom: 31%;
  --reference-adventure-right: 8%;
  --reference-adventure-bottom: 45%;
  --reference-buddy-right: 7%;
  --reference-buddy-bottom: 29%;
  --reference-character-bottom: calc(var(--reference-nav-height) + 1.2rem);
  --reference-nav-height: 5rem;
}

.world-home-scene[data-reference-home="true"] .reference-game-hud {
  position: absolute;
  inset: auto;
  top: var(--reference-hud-top);
  right: .6rem;
  left: .6rem;
  height: auto;
  min-height: 0;
  z-index: 20;
  pointer-events: none;
}
```

Set `pointer-events: auto` only on status cards and the coin capsule.

- [ ] **Step 3: Style the HUD to match the reference**

Implement:

- `reference-status-stack`: absolute left column, three equal-width cream cards.
- `reference-status-card`: purple frame, white highlight, lower purple extrusion.
- `reference-coin-capsule`: absolute right, gold coin medallion, count, circular plus face.
- `.foodex-game-logo`: centered between the left stack and coin capsule, with capped width so it never overlaps either side.

Use `clamp()` for sizes and do not use a full-width HUD background panel.

- [ ] **Step 4: Style landmark variants**

Implement variant faces:

```css
.reference-landmark-button--collection .reference-landmark-face { /* red */ }
.reference-landmark-button--adventure .reference-landmark-face { /* purple */ }
.reference-landmark-button--buddy .reference-landmark-face { /* teal */ }
```

All buttons must have a 52px invisible hit area, while `.reference-landmark-face` contains the visible sign and receives the pressed translation.

Position the buttons using only the custom properties declared on the scene root.

- [ ] **Step 5: Style the camera record action**

Create a blue/yellow camera housing with a circular dark-blue lens, cream text sign, and gold highlight. Keep its visible width smaller than the central plaza building and its hit area at least 52px.

- [ ] **Step 6: Style the five-tab navigation**

Implement:

- purple full-width bar with safe-area padding;
- five equal slots;
- independent rounded tab faces;
- center record tab larger, orange, and gold-rimmed without overlapping neighboring tabs;
- active state uses border plus brightness, not color alone.

The navigation must stay below the character and must not be rendered inside `WorldHomeScene`.

- [ ] **Step 7: Restore and position the transparent vector character**

Hide `.home-character-art` if it references the opaque generated asset. Show the existing `.home-character-interaction .companion-character` at full opacity and position the wrapper above the navigation:

```css
.world-home-scene[data-reference-home="true"] .home-character-interaction {
  left: 50%;
  bottom: var(--reference-character-bottom);
  width: clamp(7.8rem, 29vw, 10.4rem);
  transform: translateX(-50%);
}

.world-home-scene[data-reference-home="true"] .home-character-interaction .companion-character {
  opacity: 1;
}
```

Use a CSS ellipse for the shadow if the uploaded shadow asset is opaque.

- [ ] **Step 8: Add responsive coordinate sets**

Add explicit overrides:

```css
@media (max-width: 379px) { /* 375×667 and smaller */ }
@media (min-width: 380px) and (max-width: 409px) { /* 390×844 */ }
@media (min-width: 410px) and (max-width: 460px) { /* 430×932 */ }
```

Each block must set the coordinate variables, logo maximum width, card scale, character bottom, and nav height. Do not duplicate full component style declarations.

- [ ] **Step 9: Add focus and reduced-motion rules**

Use one shared focus selector with a 3px high-contrast ring. Disable logo-star, character, sparkle, and pressed animations under both:

```css
.world-home-scene[data-reduced-motion="true"]
@media (prefers-reduced-motion: reduce)
```

- [ ] **Step 10: Remove conflicting temporary rules**

In `homeSceneUi.css` and `homeSceneV4.css`, remove or neutralize selectors that style:

- `.game-hud`
- `.home-menu-dock`
- `.world-hotspot`
- `.meal-record-orb`
- old character coordinates
- old reference logo coordinates

Keep unrelated shared layer and animation utilities only. The same final property must not be declared in more than one home CSS file.

- [ ] **Step 11: Run focused tests and build**

Run:

```bash
npm run test:run -- src/features/home/ReferenceStatusCard.test.tsx src/features/home/ReferenceGameHud.test.tsx src/features/home/ReferenceLandmarkButton.test.tsx src/features/home/ReferenceRecordButton.test.tsx src/features/home/WorldHomeScene.test.tsx src/ui/BottomNav.test.tsx
npm run build
```

Expected: PASS with no TypeScript or Vite errors.

- [ ] **Step 12: Commit**

```bash
git add src/features/home/referenceHomeUi.css src/features/home/WorldHomeScene.tsx src/features/home/homeSceneUi.css src/features/home/homeSceneV4.css
git commit -m "feat: add final reference home layout"
```

---

### Task 6: Regression, Preview, and Mobile Visual Gate

**Files:**
- Modify only tests or CSS if a verified regression requires it.

**Interfaces:**
- No new public interfaces.

- [ ] **Step 1: Run the full automated test suite**

Run:

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build succeed.

- [ ] **Step 3: Review the branch diff**

Run:

```bash
git diff --stat HEAD~5..HEAD
git diff HEAD~5..HEAD -- src/features/home src/ui/BottomNav.tsx src/ui/BottomNav.test.tsx
```

Confirm:

- no route or persistence file changed;
- no callback signature changed;
- no new API or Supabase dependency was introduced;
- no second bottom navigation exists inside `WorldHomeScene`;
- the old four-item dock is absent.

- [ ] **Step 4: Confirm Vercel Preview success for the final v4 commit**

Check the combined commit status and require `Vercel: success` before claiming deployment completion.

- [ ] **Step 5: Verify 375×667**

Confirm all of the following:

- all three left status cards are fully visible;
- the coin capsule is fully visible;
- logo does not overlap either side;
- collection, record, adventure, and buddy controls remain inside the viewport;
- character is fully visible above the navigation;
- no black or opaque asset rectangles appear.

- [ ] **Step 6: Verify 390×844**

Confirm:

- visual proportions are closest to the supplied reference;
- record action is the strongest world action but does not cover the character;
- all signs visually attach to their intended landmarks;
- the central plaza remains readable.

- [ ] **Step 7: Verify 430×932**

Confirm:

- HUD and logo stop growing at their maximum size;
- world controls do not drift too far from landmarks;
- navigation does not become excessively tall;
- the scene does not look sparse because of excessive scaling.

- [ ] **Step 8: Commit any verified visual corrections**

For each correction, change one coordinate group at a time, rerun focused tests and build, then commit:

```bash
git add src/features/home/referenceHomeUi.css
git commit -m "fix: tune reference home responsive layout"
```

- [ ] **Step 9: Final evidence report**

Report:

- final v4 commit SHA;
- focused test command and result;
- full test command and result;
- build command and result;
- Vercel status;
- verified viewport sizes;
- any remaining visual limitation caused by missing transparent artwork.
