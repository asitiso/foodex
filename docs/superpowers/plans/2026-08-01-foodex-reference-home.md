# Foodex Reference Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Foodex home screen from Vercel Preview commit `7eb0798` so its structure and visual grammar stay locked to the supplied reference while preserving existing routes, data, and click behavior.

**Architecture:** Keep `HomeScreen` as the data adapter and make `WorldHomeScene` the isolated full-viewport composition root. Add one reusable bottom-card component, extend the existing hotspot contract to render object-bound sign labels, keep all visual rules in `homeGameUi.css`, and hide `BottomNav` only while the home screen is active.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Testing Library, CSS, Vercel Preview deployments

## Global Constraints

- Visual source of truth: `C:\Users\우\Downloads\ChatGPT Image 2026년 8월 1일 오후 02_42_52.png`.
- Base commit: `7eb0798ceb96f0e81c07117d538f88f559c35216`.
- Preserve existing feature behavior, routing, persistence, and data structures.
- Home must fit without vertical scrolling at `375×667`, `390×844`, and `430×932`.
- Use percentage-based positioning and `clamp()` before fixed pixel positioning.
- Preserve named controls, DOM accessibility, `aria-label`, focus visibility, reduced-motion behavior, and 44px minimum touch targets.
- Do not proceed past a visual stage while a larger reference mismatch remains in that stage.
- Home bottom-card routing is fixed: achievements to adventure, quests to adventure, shop to collection, news to companion.

---

### Task 1: Lock the Required Home Structure and Route Mapping in Tests

**Files:**
- Modify: `src/features/home/WorldHomeScene.test.tsx`
- Modify: `src/features/home/HomeScreen.test.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: existing `WorldHomeSceneProps` callbacks and `App.navigate` destinations.
- Produces: executable DOM, click-routing, accessibility, and home-only navigation requirements.

- [ ] **Step 1: Replace the current lobby-action test with the required landmark and card assertions**

Add assertions in `WorldHomeScene.test.tsx` for the four accessible landmark buttons and four bottom cards:

```tsx
expect(screen.getByRole('button', { name: '도감 열기' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '모험 열기' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '식사 기록하기' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '버디 열기' })).toBeInTheDocument()
expect(screen.getByRole('navigation', { name: '홈 게임 메뉴' })).toBeInTheDocument()
for (const label of ['업적', '퀘스트', '상점', '소식']) {
  expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
}
expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)
```

Click every control and assert exact callback totals:

```tsx
await user.click(screen.getByRole('button', { name: '도감 열기' }))
await user.click(screen.getByRole('button', { name: '모험 열기' }))
await user.click(screen.getByRole('button', { name: '식사 기록하기' }))
await user.click(screen.getByRole('button', { name: '버디 열기' }))
await user.click(screen.getByRole('button', { name: '업적' }))
await user.click(screen.getByRole('button', { name: '퀘스트' }))
await user.click(screen.getByRole('button', { name: '상점' }))
await user.click(screen.getByRole('button', { name: '소식' }))

expect(props.onOpenCollection).toHaveBeenCalledTimes(2)
expect(props.onOpenAdventure).toHaveBeenCalledTimes(3)
expect(props.onRecord).toHaveBeenCalledOnce()
expect(props.onOpenCompanion).toHaveBeenCalledTimes(2)
```

- [ ] **Step 2: Update the HomeScreen contract test**

In `HomeScreen.test.tsx`, keep the three HUD assertions and assert all four landmark accessible names and the `홈 게임 메뉴` navigation. Update the companion test to click `버디 열기`.

- [ ] **Step 3: Add an App integration test for home-only BottomNav removal**

Add this test to `App.test.tsx`:

```tsx
it('replaces the five-tab bar with four reference menu cards only on home', async () => {
  const user = userEvent.setup()
  render(<App repository={createMemoryRepository()} />)

  expect(screen.queryByRole('navigation', { name: '주요 메뉴' })).not.toBeInTheDocument()
  const homeMenu = screen.getByRole('navigation', { name: '홈 게임 메뉴' })
  expect(within(homeMenu).getAllByRole('button')).toHaveLength(4)

  await user.click(within(homeMenu).getByRole('button', { name: '상점' }))
  expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '도감' })).toHaveAttribute('aria-current', 'page')
})
```

- [ ] **Step 4: Run the focused tests and verify RED**

Run:

```powershell
npm ci
npm run test:run -- src/features/home/WorldHomeScene.test.tsx src/features/home/HomeScreen.test.tsx src/App.test.tsx
```

Expected: FAIL because the four landmark names, `홈 게임 메뉴`, bottom cards, and home-only BottomNav condition do not exist yet.

- [ ] **Step 5: Commit the failing tests**

```powershell
git add src/features/home/WorldHomeScene.test.tsx src/features/home/HomeScreen.test.tsx src/App.test.tsx
git commit -m "test: lock Foodex reference home structure"
```

---

### Task 2: Build the Four Landmarks and Four Bottom Cards

**Files:**
- Create: `src/features/home/HomeMenuCard.tsx`
- Create: `src/features/home/HomeMenuCard.test.tsx`
- Modify: `src/features/home/WorldHotspot.tsx`
- Modify: `src/features/home/WorldHotspot.test.tsx`
- Modify: `src/features/home/MealRecordOrb.tsx`
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/ui/GameIcon.tsx`
- Modify: `src/ui/GameIcon.test.tsx`

**Interfaces:**
- Produces: `HomeMenuCardProps { label: string; icon: GameIconName; onActivate: () => void }`.
- Produces: `WorldHotspotProps` with `text: string` so landmarks render visible sign copy in addition to their accessible name.
- Consumes: existing `WorldHomeSceneProps` callbacks without adding routes or data.

- [ ] **Step 1: Write a failing unit test for HomeMenuCard**

```tsx
it('renders a named toy-card action', async () => {
  const user = userEvent.setup()
  const onActivate = vi.fn()
  render(<HomeMenuCard label="업적" icon="achievement" onActivate={onActivate} />)

  await user.click(screen.getByRole('button', { name: '업적' }))
  expect(onActivate).toHaveBeenCalledOnce()
})
```

Run `npm run test:run -- src/features/home/HomeMenuCard.test.tsx` and expect module-not-found failure.

- [ ] **Step 2: Implement HomeMenuCard minimally**

```tsx
import { GameIcon, type GameIconName } from '../../ui/GameIcon'

export interface HomeMenuCardProps {
  label: string
  icon: GameIconName
  onActivate: () => void
}

export function HomeMenuCard({ label, icon, onActivate }: HomeMenuCardProps) {
  return (
    <button className="home-menu-card" type="button" onClick={onActivate} aria-label={label}>
      <GameIcon name={icon} />
      <span>{label}</span>
    </button>
  )
}
```

- [ ] **Step 3: Extend GameIcon with the four exact menu concepts**

Add `achievement`, `quest`, and `news` to `GameIconName`; reuse existing `shop`. Define filled toy-like SVG paths for a trophy, clipboard/star, and megaphone. Extend `GameIcon.test.tsx` to render all names and verify each SVG has a non-empty graphic child.

- [ ] **Step 4: Make landmarks render visible object-bound signs**

Add a required `text` prop to `WorldHotspot`, render `<span>{text}</span>` after `GameIcon`, and update its test to assert both accessible name and visible sign copy. Keep `aria-label={label}` on the button.

- [ ] **Step 5: Compose the exact home-world order**

Replace the two current hotspots and separate room action in `WorldHomeScene.tsx` with:

```tsx
<WorldHotspot className="world-landmark-collection" label="도감 열기" text="도감" icon="collection" onActivate={onOpenCollection} />
<WorldHotspot className="world-landmark-adventure" label="모험 열기" text="모험" icon="adventure" onActivate={onOpenAdventure} />
<MealRecordOrb onRecord={onRecord} />
<WorldHotspot className="world-landmark-buddy" label="버디 열기" text="버디" icon="buddy" onActivate={onOpenCompanion} />
<HeroCompanion characterId={characterId} emotion={emotion} reducedMotion={reducedMotion} onOpenRoom={undefined} />
<nav className="home-menu-dock" aria-label="홈 게임 메뉴">
  <HomeMenuCard label="업적" icon="achievement" onActivate={onOpenAdventure} />
  <HomeMenuCard label="퀘스트" icon="quest" onActivate={onOpenAdventure} />
  <HomeMenuCard label="상점" icon="shop" onActivate={onOpenCollection} />
  <HomeMenuCard label="소식" icon="news" onActivate={onOpenCompanion} />
</nav>
```

- [ ] **Step 6: Run focused component tests and verify GREEN**

Run:

```powershell
npm run test:run -- src/features/home/HomeMenuCard.test.tsx src/features/home/WorldHotspot.test.tsx src/features/home/MealRecordOrb.test.tsx src/features/home/WorldHomeScene.test.tsx src/features/home/HomeScreen.test.tsx src/ui/GameIcon.test.tsx
```

Expected: all listed tests PASS.

- [ ] **Step 7: Commit the component structure**

```powershell
git add src/features/home src/ui/GameIcon.tsx src/ui/GameIcon.test.tsx
git commit -m "feat: rebuild Foodex home actions"
```

---

### Task 3: Hide BottomNav Only on Home Without Changing Other Routes

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: existing `screen: Screen` state.
- Produces: `BottomNav` only for non-home, non-reveal screens.

- [ ] **Step 1: Implement the minimal render condition**

Change:

```tsx
{screen !== 'reveal' && <BottomNav active={activeTab} onNavigate={navigate} />}
```

to:

```tsx
{screen !== 'home' && screen !== 'reveal' && (
  <BottomNav active={activeTab} onNavigate={navigate} />
)}
```

- [ ] **Step 2: Update existing App navigation tests to enter routes through home landmarks or home cards**

Use `도감 열기`, `모험 열기`, `식사 기록하기`, and `버디 열기` for transitions originating on home. Once on another screen, retain assertions against the unchanged five-tab navigation.

- [ ] **Step 3: Run the App integration tests and verify GREEN**

Run `npm run test:run -- src/App.test.tsx`.

Expected: all App tests PASS, including the home-only BottomNav test.

- [ ] **Step 4: Commit the routing-preserving render change**

```powershell
git add src/App.tsx src/App.test.tsx
git commit -m "feat: use game cards as home navigation"
```

---

### Task 4: Rebuild the Home Visual Layer to the Reference

**Files:**
- Modify: `src/homeGameUi.css`
- Modify: `src/features/home/GameLogo.tsx` only if screenshot inspection identifies a markup limitation
- Modify: `src/features/home/GameLogo.test.tsx` only if logo markup changes

**Interfaces:**
- Consumes: stable class names from Tasks 2 and 3.
- Produces: isolated one-viewport composition at all three target sizes.

- [ ] **Step 1: Define the home viewport and vertical zones**

Set `.world-home-scene` to `height: 100dvh`, `min-height: 0`, `overflow: hidden`, and isolate it from `.app-shell` bottom padding. Define custom properties for HUD height, dock height, and safe areas. Use the scene background as the full-bleed world layer.

- [ ] **Step 2: Match the reference HUD geometry**

Position `.game-status-rail` vertically at the upper left, `.foodex-game-logo` centered at the top, and `.game-coin-pill` at the upper right. Give all HUD surfaces ivory fill, purple outline, inner white highlight, and dark lower extrusion. Maintain non-overlap at 375px width.

- [ ] **Step 3: Place the four landmarks by scene percentages**

Use these initial percentage anchors, then refine only from screenshots:

```css
.world-landmark-collection { left: 7%; top: 38%; }
.world-landmark-adventure { left: 57%; top: 29%; }
.meal-record-orb { left: 50%; top: 44%; }
.world-landmark-buddy { right: 6%; top: 43%; }
.hero-companion-wrap { left: 50%; top: 59%; }
```

Style collection as strawberry/book, adventure as castle/sign, meal record as camera/sign, and buddy as house/sign. The visible sign copy must remain readable and attached to its object.

- [ ] **Step 4: Match the reference bottom-card dock**

Make `.home-menu-dock` a four-column grid above the bottom safe area. Each `.home-menu-card` uses ivory fill, purple outline, rounded corners, white inner highlight, dark lower shadow, and an icon occupying the upper half. Compress gaps and typography only under 391px; do not collapse into multiple rows.

- [ ] **Step 5: Add explicit height variants**

Use `@media (max-height: 700px)` for the 375×667 compression and `@media (min-height: 850px)` for 430×932 expansion. Preserve the same object order and relative hierarchy in every variant.

- [ ] **Step 6: Verify CSS and component tests**

Run:

```powershell
git diff --check
npm run test:run -- src/features/home src/ui/GameIcon.test.tsx src/App.test.tsx
npm run build
```

Expected: no whitespace errors, all focused tests PASS, build exits 0.

- [ ] **Step 7: Commit the first complete visual pass**

```powershell
git add src/homeGameUi.css src/features/home/GameLogo.tsx src/features/home/GameLogo.test.tsx
git commit -m "style: match Foodex home reference layout"
```

---

### Task 5: Screenshot-Gated Responsive Refinement

**Files:**
- Modify: `src/homeGameUi.css`
- Create: `C:\Users\우\Documents\Codex\2026-08-01\foodex-375x667-390x844-430x932-1-hud\outputs\foodex-home-375x667.png`
- Create: `C:\Users\우\Documents\Codex\2026-08-01\foodex-375x667-390x844-430x932-1-hud\outputs\foodex-home-390x844.png`
- Create: `C:\Users\우\Documents\Codex\2026-08-01\foodex-375x667-390x844-430x932-1-hud\outputs\foodex-home-430x932.png`

**Interfaces:**
- Consumes: the running Vite app and the supplied reference image.
- Produces: three auditable screenshots with no scroll or overlap.

- [ ] **Step 1: Start the app and capture the three exact viewports**

Run `npm run dev -- --host 127.0.0.1`, then use browser verification to capture `375×667`, `390×844`, and `430×932` into the three output paths.

- [ ] **Step 2: Compare in strict priority order**

For each viewport compare: top HUD geometry, four-landmark presence and left/center/right relation, camera/character separation, bottom-card size and one-row placement, then decorative polish. Record any mismatch that changes structure before polishing shadows or animation.

- [ ] **Step 3: Correct the largest remaining mismatch only**

Adjust percentage anchors and `clamp()` values in `homeGameUi.css`, rerun focused tests and build, and recapture all three viewports. Repeat until every viewport meets the design success criteria.

- [ ] **Step 4: Check scroll and overlap programmatically**

At each viewport assert `document.documentElement.scrollHeight <= window.innerHeight`, every required button rectangle lies inside the viewport, and the character rectangle does not intersect the meal-record or bottom-dock rectangles.

- [ ] **Step 5: Commit responsive refinements**

```powershell
git add src/homeGameUi.css
git commit -m "style: refine Foodex home across mobile sizes"
```

---

### Task 6: Full Verification and Preview Deployment

**Files:**
- Modify: only files required by verified failures

**Interfaces:**
- Consumes: completed home implementation.
- Produces: fresh test/build evidence and a Vercel Preview URL.

- [ ] **Step 1: Run the focused suite**

Run `npm run test:run -- src/features/home src/ui/GameIcon.test.tsx src/App.test.tsx` and require zero failures.

- [ ] **Step 2: Run the complete suite**

Run `npm run test:run` and require zero failures.

- [ ] **Step 3: Run the production build and secret scan**

```powershell
npm run build
rg -n 'sb_secret_[A-Za-z0-9_-]{20,}|service_role[[:space:]]*[:=]' src .env.example dist
```

Expected: build exits 0 and secret scan returns no matches.

- [ ] **Step 4: Inspect the final diff**

Run `git diff 7eb0798..HEAD --check`, `git status --short`, and `git log --oneline 7eb0798..HEAD`. Confirm no route, persistence, or data-model files changed outside the planned `App.tsx` render condition.

- [ ] **Step 5: Push the branch and wait for Vercel Preview**

Push `agent/foodex-reference-home`, then inspect Vercel deployments until the branch deployment is `READY`. Do not deploy to production.

- [ ] **Step 6: Verify the deployed Preview at all three target sizes**

Capture fresh screenshots from the Preview URL, repeat the scroll/overlap assertions, and compare against the reference. If Preview rendering differs from local rendering, fix, verify, push, and wait for the replacement Preview.

- [ ] **Step 7: Report evidence**

Report focused test count, full test count, build exit status, Preview URL/status/commit, the three screenshot links, and any approved deviation from the reference. If no deviation was approved, state that none was introduced.
