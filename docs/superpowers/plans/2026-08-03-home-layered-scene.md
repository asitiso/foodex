# Foodex Home Layered Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Foodex home screen into a responsive, independently replaceable layered scene while preserving all current navigation and gameplay entry points.

**Architecture:** Keep `HomeScreen` as the state-to-view adapter and make `WorldHomeScene` the composition root. Split decorative rendering into focused background, landmark, character, and effect components; preserve existing semantic HUD, hotspot, record-orb, and menu controls above those layers.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Testing Library, CSS custom properties and keyframe animation.

## Global Constraints

- Work only on branch `agent/foodex-reference-home`.
- Home screen only; do not redesign other screens or add gameplay systems.
- Preserve all existing callback behavior and live HUD values.
- Keep text and numeric values in semantic HTML, never baked into scene art.
- Use no new runtime dependency or animation library.
- Decorative asset failure must not prevent interactive controls from rendering.
- Respect the existing `reducedMotion` prop.
- Primary target is mobile portrait, with safe behavior on narrow and desktop viewports.

---

## File Map

**Create**

- `src/features/home/scene/HomeSceneAssets.ts` — typed registry and fallback contract for home-scene assets.
- `src/features/home/scene/SceneBackgroundLayer.tsx` — non-interactive sky, distant, and ground layers.
- `src/features/home/scene/SceneLandmarkLayer.tsx` — non-interactive visual landmarks aligned with hotspot controls.
- `src/features/home/scene/SceneCharacterLayer.tsx` — character wrapper and shadow layer.
- `src/features/home/scene/SceneEffectsLayer.tsx` — ambient decorative effects with reduced-motion state.
- `src/features/home/WorldHomeScene.test.tsx` — scene structure and callback regression tests.
- `src/assets/home/README.md` — asset naming, transparency, sizing, and replacement guide.
- `src/assets/home/backgrounds/.gitkeep`
- `src/assets/home/landmarks/.gitkeep`
- `src/assets/home/characters/.gitkeep`
- `src/assets/home/effects/.gitkeep`
- `src/assets/home/ui/.gitkeep`

**Modify**

- `src/features/home/WorldHomeScene.tsx` — compose the new layers and existing controls.
- `src/styles.css` — scene stage, layer placement, responsive variables, effects, and reduced-motion rules.
- `src/ui/sceneAssets.ts` — only if needed to expose current artwork as temporary fallbacks; do not duplicate URLs.

---

### Task 1: Lock Existing Interaction Behavior With Tests

**Files:**
- Create: `src/features/home/WorldHomeScene.test.tsx`
- Read: `src/features/home/WorldHomeScene.tsx`
- Read: `src/features/home/GameHud.tsx`
- Read: `src/features/home/WorldHotspot.tsx`
- Read: `src/features/home/MealRecordOrb.tsx`

**Interfaces:**
- Consumes: `WorldHomeSceneProps` from `WorldHomeScene.tsx`.
- Produces: regression tests that later tasks must keep passing.

- [ ] **Step 1: Write the shared test props and render helper**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WorldHomeScene, type WorldHomeSceneProps } from './WorldHomeScene'

function makeProps(overrides: Partial<WorldHomeSceneProps> = {}): WorldHomeSceneProps {
  return {
    coinBalance: 42,
    level: {
      level: 3,
      title: '새싹 탐험가',
      totalXp: 250,
      currentLevelXp: 50,
      nextLevelXp: 100,
    },
    todayCards: 2,
    todayMeals: 1,
    mealTarget: 3,
    streakDays: 4,
    characterId: 'foody',
    emotion: 'happy',
    reducedMotion: false,
    onRecord: vi.fn(),
    onOpenCollection: vi.fn(),
    onOpenAdventure: vi.fn(),
    onOpenMeals: vi.fn(),
    onOpenCompanion: vi.fn(),
    onOpenLevel: vi.fn(),
    onOpenCoins: vi.fn(),
    ...overrides,
  }
}
```

Adjust only the `PlayerLevel` fixture fields if the repository type requires a different exact shape; use the exported type rather than `as any`.

- [ ] **Step 2: Add callback regression tests**

```tsx
describe('WorldHomeScene', () => {
  it('keeps collection, adventure, buddy, and record actions interactive', async () => {
    const user = userEvent.setup()
    const props = makeProps()
    render(<WorldHomeScene {...props} />)

    await user.click(screen.getByRole('button', { name: '도감 열기' }))
    await user.click(screen.getByRole('button', { name: '모험 열기' }))
    await user.click(screen.getByRole('button', { name: '버디 열기' }))
    await user.click(screen.getByRole('button', { name: /식사.*기록|기록/ }))

    expect(props.onOpenCollection).toHaveBeenCalledTimes(1)
    expect(props.onOpenAdventure).toHaveBeenCalledTimes(1)
    expect(props.onOpenCompanion).toHaveBeenCalledTimes(1)
    expect(props.onRecord).toHaveBeenCalledTimes(1)
  })
})
```

Use the exact accessible name already emitted by `MealRecordOrb` after inspecting that component.

- [ ] **Step 3: Add live-value and reduced-motion expectations**

```tsx
it('renders live HUD values and exposes the motion preference', () => {
  render(<WorldHomeScene {...makeProps({ reducedMotion: true })} />)

  expect(screen.getByLabelText('푸덱 월드 홈')).toHaveAttribute('data-reduced-motion', 'true')
  expect(screen.getByText('42')).toBeInTheDocument()
  expect(screen.getByText(/Lv\.?\s*3|레벨\s*3/i)).toBeInTheDocument()
})
```

Replace the text matcher only if the current `GameHud` has a different existing accessible representation.

- [ ] **Step 4: Run the focused test to establish baseline**

Run: `npm run test:run -- src/features/home/WorldHomeScene.test.tsx`

Expected: callback tests pass against the current implementation; the `data-reduced-motion` expectation fails because the new scene contract is not implemented yet.

- [ ] **Step 5: Commit the regression tests**

```bash
git add src/features/home/WorldHomeScene.test.tsx
git commit -m "test: lock home scene interactions"
```

---

### Task 2: Add the Typed Scene Asset Contract and Folder Skeleton

**Files:**
- Create: `src/features/home/scene/HomeSceneAssets.ts`
- Create: `src/assets/home/README.md`
- Create: the five `.gitkeep` files listed in the file map
- Read: `src/ui/sceneAssets.ts`

**Interfaces:**
- Consumes: existing `SCENE_ASSETS.worldHome` fallback URL.
- Produces: `HOME_SCENE_ASSETS` and `HomeSceneAssetRegistry`.

- [ ] **Step 1: Add a failing registry test to `WorldHomeScene.test.tsx`**

```tsx
import { HOME_SCENE_ASSETS } from './scene/HomeSceneAssets'

it('defines replaceable asset slots without embedding UI text', () => {
  expect(HOME_SCENE_ASSETS).toMatchObject({
    backgrounds: { sky: expect.any(String), distant: expect.any(String), ground: expect.any(String) },
    landmarks: {
      collection: expect.any(String),
      record: expect.any(String),
      adventure: expect.any(String),
      buddy: expect.any(String),
    },
    effects: { sparkle: expect.any(String), glow: expect.any(String) },
  })
})
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `npm run test:run -- src/features/home/WorldHomeScene.test.tsx`

Expected: FAIL because `./scene/HomeSceneAssets` does not exist.

- [ ] **Step 3: Implement the registry**

```ts
import { SCENE_ASSETS } from '../../../ui/sceneAssets'

export interface HomeSceneAssetRegistry {
  backgrounds: {
    sky: string
    distant: string
    ground: string
  }
  landmarks: {
    collection: string
    record: string
    adventure: string
    buddy: string
  }
  character: {
    shadow: string
  }
  effects: {
    sparkle: string
    glow: string
  }
}

const transparentFallback =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E'

export const HOME_SCENE_ASSETS: HomeSceneAssetRegistry = {
  backgrounds: {
    sky: SCENE_ASSETS.worldHome,
    distant: transparentFallback,
    ground: transparentFallback,
  },
  landmarks: {
    collection: transparentFallback,
    record: transparentFallback,
    adventure: transparentFallback,
    buddy: transparentFallback,
  },
  character: { shadow: transparentFallback },
  effects: { sparkle: transparentFallback, glow: transparentFallback },
}
```

If `sceneAssets.ts` has a suitable exported transparent fallback already, import and reuse it instead of adding another data URI.

- [ ] **Step 4: Add `src/assets/home/README.md`**

Document these exact rules:

```markdown
# Foodex Home Scene Assets

- Keep dynamic text and counters out of images.
- Use transparent PNG or WebP for landmarks, characters, and effects.
- Export artwork with tight transparent bounds to make CSS placement predictable.
- Background layers may be opaque and should cover the portrait stage.
- Replace a registry URL in `HomeSceneAssets.ts`; do not import assets directly inside layer components.
- Suggested source sizes: background 1080×1920, large landmark 640×640, character 512×512, effect 512×512.
- Verify at 320px, 390px, and 768px viewport widths after replacement.
```

- [ ] **Step 5: Run focused tests**

Run: `npm run test:run -- src/features/home/WorldHomeScene.test.tsx`

Expected: registry test passes; reduced-motion test remains failing.

- [ ] **Step 6: Commit the asset contract**

```bash
git add src/features/home/scene/HomeSceneAssets.ts src/assets/home
git commit -m "feat: add replaceable home scene asset contract"
```

---

### Task 3: Implement Focused Decorative Layer Components

**Files:**
- Create: `src/features/home/scene/SceneBackgroundLayer.tsx`
- Create: `src/features/home/scene/SceneLandmarkLayer.tsx`
- Create: `src/features/home/scene/SceneCharacterLayer.tsx`
- Create: `src/features/home/scene/SceneEffectsLayer.tsx`
- Modify: `src/features/home/WorldHomeScene.test.tsx`

**Interfaces:**
- Consumes: `HOME_SCENE_ASSETS`, `CompanionCharacterId`, `CompanionEmotion`, `HeroCompanion`.
- Produces:
  - `SceneBackgroundLayer(): JSX.Element`
  - `SceneLandmarkLayer(): JSX.Element`
  - `SceneCharacterLayer(props): JSX.Element`
  - `SceneEffectsLayer({ reducedMotion }): JSX.Element`

- [ ] **Step 1: Add failing scene-structure tests**

```tsx
it('renders independently replaceable decorative layers', () => {
  render(<WorldHomeScene {...makeProps()} />)

  expect(screen.getByTestId('home-layer-background')).toBeInTheDocument()
  expect(screen.getByTestId('home-layer-landmarks')).toBeInTheDocument()
  expect(screen.getByTestId('home-layer-character')).toBeInTheDocument()
  expect(screen.getByTestId('home-layer-effects')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:run -- src/features/home/WorldHomeScene.test.tsx`

Expected: FAIL because the layer test IDs are absent.

- [ ] **Step 3: Implement `SceneBackgroundLayer`**

```tsx
import { HOME_SCENE_ASSETS } from './HomeSceneAssets'

export function SceneBackgroundLayer() {
  return (
    <div className="home-scene-layer home-scene-background" data-testid="home-layer-background" aria-hidden="true">
      <img className="home-scene-sky" src={HOME_SCENE_ASSETS.backgrounds.sky} alt="" />
      <img className="home-scene-distant" src={HOME_SCENE_ASSETS.backgrounds.distant} alt="" />
      <img className="home-scene-ground" src={HOME_SCENE_ASSETS.backgrounds.ground} alt="" />
    </div>
  )
}
```

- [ ] **Step 4: Implement `SceneLandmarkLayer`**

Render four `<img alt="">` elements with classes `home-landmark-art--collection`, `--record`, `--adventure`, and `--buddy`, all inside `data-testid="home-layer-landmarks"`. This component must contain no buttons and no text.

- [ ] **Step 5: Implement `SceneCharacterLayer`**

```tsx
import type { CompanionCharacterId } from '../../../domain/companionCharacters'
import { HeroCompanion, type CompanionEmotion } from '../../companion/HeroCompanion'
import { HOME_SCENE_ASSETS } from './HomeSceneAssets'

export interface SceneCharacterLayerProps {
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
}

export function SceneCharacterLayer(props: SceneCharacterLayerProps) {
  return (
    <div className="home-scene-layer home-scene-character" data-testid="home-layer-character">
      <img className="home-character-shadow" src={HOME_SCENE_ASSETS.character.shadow} alt="" aria-hidden="true" />
      <HeroCompanion {...props} onOpenRoom={undefined} />
    </div>
  )
}
```

- [ ] **Step 6: Implement `SceneEffectsLayer`**

```tsx
import { HOME_SCENE_ASSETS } from './HomeSceneAssets'

export function SceneEffectsLayer({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      className="home-scene-layer home-scene-effects"
      data-testid="home-layer-effects"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      aria-hidden="true"
    >
      <img className="home-effect-glow" src={HOME_SCENE_ASSETS.effects.glow} alt="" />
      <img className="home-effect-sparkle home-effect-sparkle--one" src={HOME_SCENE_ASSETS.effects.sparkle} alt="" />
      <img className="home-effect-sparkle home-effect-sparkle--two" src={HOME_SCENE_ASSETS.effects.sparkle} alt="" />
    </div>
  )
}
```

- [ ] **Step 7: Run TypeScript and focused tests**

Run: `npm run test:run -- src/features/home/WorldHomeScene.test.tsx`

Expected: tests still fail only because `WorldHomeScene` has not composed the new layers.

Run: `npx tsc -b --pretty false`

Expected: PASS.

- [ ] **Step 8: Commit layer components**

```bash
git add src/features/home/scene src/features/home/WorldHomeScene.test.tsx
git commit -m "feat: add home scene layer components"
```

---

### Task 4: Compose the Layered Scene Without Changing Behavior

**Files:**
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/features/home/WorldHomeScene.test.tsx`

**Interfaces:**
- Consumes: all four scene layer components from Task 3.
- Produces: the final DOM layer order and `data-reduced-motion` scene contract.

- [ ] **Step 1: Replace the monolithic background style**

Remove the `CSSProperties` import and `--scene-background` inline style. Import:

```tsx
import { SceneBackgroundLayer } from './scene/SceneBackgroundLayer'
import { SceneLandmarkLayer } from './scene/SceneLandmarkLayer'
import { SceneCharacterLayer } from './scene/SceneCharacterLayer'
import { SceneEffectsLayer } from './scene/SceneEffectsLayer'
```

- [ ] **Step 2: Compose the scene in explicit order**

Use this structure inside the existing `<section>`:

```tsx
<section
  className="world-home-scene"
  aria-label="푸덱 월드 홈"
  data-reduced-motion={reducedMotion ? 'true' : 'false'}
>
  <SceneBackgroundLayer />
  <SceneLandmarkLayer />
  <div className="home-scene-layer home-scene-interactions">
    <WorldHotspot className="world-landmark-collection" label="도감 열기" text="도감" icon="collection" onActivate={onOpenCollection} />
    <WorldHotspot className="world-landmark-adventure" label="모험 열기" text="모험" icon="adventure" onActivate={onOpenAdventure} />
    <MealRecordOrb onRecord={onRecord} />
    <WorldHotspot className="world-landmark-buddy" label="버디 열기" text="버디" icon="buddy" onActivate={onOpenCompanion} />
  </div>
  <SceneCharacterLayer characterId={characterId} emotion={emotion} reducedMotion={reducedMotion} />
  <SceneEffectsLayer reducedMotion={reducedMotion} />
  <GameHud ...existing props />
  <nav className="home-menu-dock" aria-label="홈 게임 메뉴">...existing cards...</nav>
</section>
```

Keep every current prop and callback exactly as-is. Do not reorder `HomeMenuCard` labels or destinations.

- [ ] **Step 3: Add a DOM-order test**

```tsx
it('keeps decorative layers below semantic interaction controls', () => {
  render(<WorldHomeScene {...makeProps()} />)
  const scene = screen.getByLabelText('푸덱 월드 홈')
  const children = Array.from(scene.children)

  expect(children.indexOf(screen.getByTestId('home-layer-background')))
    .toBeLessThan(children.indexOf(screen.getByTestId('home-layer-landmarks')))
  expect(screen.getByRole('button', { name: '도감 열기' })).toBeEnabled()
})
```

Do not assert fragile absolute child indexes; only assert meaningful ordering and enabled controls.

- [ ] **Step 4: Run focused tests**

Run: `npm run test:run -- src/features/home/WorldHomeScene.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit composition changes**

```bash
git add src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx
git commit -m "refactor: compose home screen from independent layers"
```

---

### Task 5: Add Responsive Layer Styling and Reduced Motion

**Files:**
- Modify: `src/styles.css`
- Modify: `src/features/home/WorldHomeScene.test.tsx`

**Interfaces:**
- Consumes: class names created in Tasks 3 and 4.
- Produces: portrait-first responsive layout and cheap CSS-only motion.

- [ ] **Step 1: Add the scene variable block**

Add or replace the home-scene rules with a bounded stage:

```css
.world-home-scene {
  --home-collection-left: 4%;
  --home-collection-top: 31%;
  --home-adventure-right: 3%;
  --home-adventure-top: 27%;
  --home-buddy-right: 8%;
  --home-buddy-bottom: 22%;
  --home-record-size: clamp(5.5rem, 24vw, 8rem);
  --home-character-width: clamp(8rem, 36vw, 13rem);
  position: relative;
  isolation: isolate;
  min-height: min(48rem, calc(100dvh - 5.5rem));
  overflow: hidden;
  background: linear-gradient(#79d8ff 0 46%, #a9e96d 46% 100%);
}

.home-scene-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-scene-background { z-index: 0; }
.home-scene-landmarks { z-index: 2; }
.home-scene-interactions { z-index: 4; pointer-events: none; }
.home-scene-character { z-index: 5; }
.home-scene-effects { z-index: 6; }
.game-hud { z-index: 10; }
.home-menu-dock { z-index: 11; }
```

Confirm the existing HUD root class before using `.game-hud`; target its actual current class.

- [ ] **Step 2: Style background images defensively**

```css
.home-scene-background img,
.home-scene-landmarks img,
.home-scene-effects img,
.home-character-shadow {
  position: absolute;
  display: block;
  max-width: none;
  user-select: none;
}

.home-scene-sky { inset: 0; width: 100%; height: 100%; object-fit: cover; }
.home-scene-distant { left: 0; right: 0; bottom: 39%; width: 100%; }
.home-scene-ground { left: 0; right: 0; bottom: 0; width: 100%; }
```

- [ ] **Step 3: Align landmark art and interactive hotspots**

Place decorative art using the same CSS variables as corresponding existing `.world-landmark-*` controls. Preserve a minimum 44px tap target on interactive components. Set `pointer-events: auto` only on the actual buttons/orb, never on decorative layer wrappers.

- [ ] **Step 4: Add lightweight animation**

```css
@keyframes home-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.45rem); }
}

@keyframes home-sparkle {
  0%, 100% { opacity: 0.3; transform: scale(0.85) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.08) rotate(8deg); }
}

.home-scene-character { animation: home-float 3.6s ease-in-out infinite; }
.home-effect-sparkle { animation: home-sparkle 2.8s ease-in-out infinite; }
.home-effect-sparkle--two { animation-delay: -1.2s; }
```

Do not add a new animation to `HeroCompanion` if it already animates internally; in that case animate only the wrapper at a very small amplitude or omit the duplicate animation.

- [ ] **Step 5: Add explicit reduced-motion rules**

```css
.world-home-scene[data-reduced-motion='true'] .home-scene-character,
.world-home-scene[data-reduced-motion='true'] .home-effect-sparkle,
@media (prefers-reduced-motion: reduce) {
  /* Use the valid expanded selector form below, not a nested at-rule. */
}

.world-home-scene[data-reduced-motion='true'] .home-scene-character,
.world-home-scene[data-reduced-motion='true'] .home-effect-sparkle {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .home-scene-character,
  .home-effect-sparkle {
    animation: none;
  }
}
```

Do not copy the intentionally invalid combined selector/at-rule example; include only the two valid rule blocks.

- [ ] **Step 6: Add responsive tuning**

```css
@media (max-width: 360px) {
  .world-home-scene {
    --home-character-width: clamp(7rem, 34vw, 9rem);
    --home-record-size: clamp(5rem, 22vw, 6.5rem);
  }
}

@media (min-width: 768px) {
  .world-home-scene {
    max-width: 48rem;
    margin-inline: auto;
    border-radius: 2rem;
  }
}
```

Tune existing bottom dock spacing rather than creating a second desktop navigation.

- [ ] **Step 7: Run tests and build**

Run: `npm run test:run -- src/features/home/WorldHomeScene.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: PASS with no TypeScript or CSS parse errors.

- [ ] **Step 8: Commit responsive styling**

```bash
git add src/styles.css
git commit -m "feat: style responsive layered home scene"
```

---

### Task 6: Full Regression Verification and Documentation Check

**Files:**
- Modify only if verification reveals a scoped defect.
- Review: `src/assets/home/README.md`
- Review: `docs/superpowers/specs/2026-08-03-home-layered-scene-design.md`

**Interfaces:**
- Consumes: completed scene implementation.
- Produces: verified build-ready branch.

- [ ] **Step 1: Run the entire test suite**

Run: `npm run test:run`

Expected: all tests pass. Do not update unrelated snapshots or weaken assertions to force green.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: `tsc -b && vite build` completes successfully.

- [ ] **Step 3: Perform three viewport checks**

Run: `npm run dev -- --host 0.0.0.0`

Check widths:

- 320px: no clipped controls; record button and dock remain tappable.
- 390px: intended primary layout; character and landmarks do not cover HUD labels.
- 768px: scene is centered and bounded; layout does not stretch awkwardly.

Also enable operating-system reduced motion or use DevTools emulation and confirm float/sparkle animation stops.

- [ ] **Step 4: Verify asset replacement workflow**

Temporarily replace one registry URL with a local transparent image import, run the home screen, and verify only that layer changes. Revert the temporary asset change before committing.

- [ ] **Step 5: Review documentation against implementation**

Confirm `src/assets/home/README.md` names the real registry file and real viewport checks. Remove any statement that does not match the implemented folder or class structure.

- [ ] **Step 6: Commit any verification fixes**

```bash
git add src/features/home src/assets/home src/styles.css
git commit -m "fix: finalize layered home scene verification"
```

Skip this commit if verification required no changes.

- [ ] **Step 7: Record final evidence**

Capture in the execution summary:

```text
npm run test:run — PASS (<actual test count>)
npm run build — PASS
Viewport checks — 320 / 390 / 768px PASS
Reduced motion — PASS
```

Do not claim completion without the actual command output.
