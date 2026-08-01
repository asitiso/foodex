# Foodex World Home and Companion Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard-like home with an outdoor food-world game lobby and make the companion tab a warm interactive room, while preserving all existing game data and flows.

**Architecture:** Keep progression, storage, Supabase, and navigation logic unchanged. Add reusable scene, HUD, character, hotspot, orb, and bottom-sheet components that consume existing calculated props, then simplify `HomeScreen` and restructure `CompanionScreen` around those components. Use separate optimized artwork layers for backgrounds and characters so dynamic selection, values, motion, and accessibility remain real DOM rather than a flattened mockup.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS, static WebP/PNG art assets, existing IndexedDB/Supabase repositories.

## Global Constraints

- Home must show only the logo, coin balance, three status badges, selected companion, record CTA, and bottom navigation without scrolling.
- Home uses the outdoor food-world art direction; the companion room uses the warm cream/coral room direction.
- Body text must be at least `16px`; primary values `20px` or larger.
- Interactive targets must be at least `52px × 52px`; record CTA at least `88px × 88px`.
- The home HUD contains exactly three status badges: level, today’s cards, and meal progress with streak folded into it.
- Existing meal recording, integrated rewards, collection, adventure, companion progression, coin shop, local persistence, and Supabase contracts must remain unchanged.
- Do not add a Supabase migration or a new economy rule.
- Background and character art remain separate; never flatten live UI values into a screenshot.
- `prefers-reduced-motion` must eliminate large movement, shake, and rotation while preserving readable state changes.
- Existing Korean accessible names must remain meaningful and all icon-only controls need explicit `aria-label`.
- Initial home interactivity must not wait for the companion-room asset bundle.

---

## File Structure

### New files

- `src/features/home/WorldHomeScene.tsx` — composes the outdoor scene, HUD, character, hotspots, and record orb.
- `src/features/home/WorldHomeScene.test.tsx` — verifies the home’s fixed visual hierarchy and navigation callbacks.
- `src/features/home/GameHud.tsx` — renders logo, coin pill, and exactly three large status badges.
- `src/features/home/GameHud.test.tsx` — tests labels, values, progress, and callbacks.
- `src/features/home/MealRecordOrb.tsx` — reusable game-style record CTA.
- `src/features/home/MealRecordOrb.test.tsx` — tests accessible naming and click behavior.
- `src/features/home/WorldHotspot.tsx` — accessible background hotspot primitive.
- `src/features/home/WorldHotspot.test.tsx` — tests label and callback behavior.
- `src/features/companion/HeroCompanion.tsx` — shared selected-character renderer and non-repeating reaction controller.
- `src/features/companion/HeroCompanion.test.tsx` — tests character selection, reactions, and reduced motion.
- `src/features/companion/CompanionRoomScene.tsx` — composes the warm room and its three location buttons.
- `src/features/companion/CompanionRoomScene.test.tsx` — tests wardrobe, growth, shop, and preview callbacks.
- `src/ui/GameSheet.tsx` — accessible shared bottom sheet for HUD and room details.
- `src/ui/GameSheet.test.tsx` — tests open/close, Escape, focus, and native cancel.
- `src/ui/sceneAssets.ts` — typed asset manifest for responsive scene and character artwork.
- `src/ui/sceneAssets.test.ts` — tests every supported character and scene key.
- `public/art/world/world-home-day.webp` — outdoor background without UI or character.
- `public/art/room/companion-room-day.webp` — room background without UI or character.
- `public/art/characters/foody.png`
- `public/art/characters/berry.png`
- `public/art/characters/noodle.png`
- `public/art/characters/cocoa.png`

### Modified files

- `src/features/home/HomeScreen.tsx` — replace stacked dashboard sections with `WorldHomeScene`.
- `src/features/home/HomeScreen.test.tsx` — assert the new compact home and existing callbacks.
- `src/features/home/HomeStatusGrid.tsx` — remove after `GameHud` is integrated.
- `src/features/home/HomeStatusGrid.test.tsx` — remove with obsolete component.
- `src/features/home/CompanionRoom.tsx` — remove after shared `HeroCompanion` and `CompanionRoomScene` cover its responsibilities.
- `src/features/home/CompanionRoom.test.tsx` — migrate assertions to the two new component suites, then remove.
- `src/features/companion/CompanionScreen.tsx` — make the room the primary scene and move details into sheets.
- `src/features/companion/CompanionScreen.test.tsx` — verify room-first behavior and retained journal/report/growth/shop functions.
- `src/features/companion/CosmeticShop.tsx` — support compact sheet presentation without changing purchase behavior.
- `src/features/companion/CosmeticShop.test.tsx` — cover the compact mode and existing preview flow.
- `src/ui/BottomNav.tsx` — retain five routes but render game-scale icon controls and rename companion label to `내 방`.
- `src/ui/BottomNav.test.tsx` — verify unchanged routes and new labels.
- `src/App.tsx` — route home HUD sheets and home character long-press to existing screens.
- `src/App.test.tsx` — retain complete meal loop and add home-to-room integration.
- `src/styles.css` — add scene tokens and styles; remove obsolete home-dashboard and old room CSS after migration.

---

### Task 1: Establish the scene asset contract

**Files:**
- Create: `src/ui/sceneAssets.ts`
- Create: `src/ui/sceneAssets.test.ts`

**Interfaces:**
- Consumes: `CompanionCharacterId` from `src/domain/companionCharacters.ts`.
- Produces: `SCENE_ASSETS`, `getCompanionArt(id)`, and `SceneAssetKey`.

- [ ] **Step 1: Write the failing manifest test**

```ts
import { describe, expect, it } from 'vitest'
import { COMPANION_CHARACTERS } from '../domain/companionCharacters'
import { getCompanionArt, SCENE_ASSETS } from './sceneAssets'

describe('scene assets', () => {
  it('defines separate home and room backgrounds', () => {
    expect(SCENE_ASSETS.worldHome).toBe('/art/world/world-home-day.webp')
    expect(SCENE_ASSETS.companionRoom).toBe('/art/room/companion-room-day.webp')
  })

  it('maps every selectable companion to an independent image', () => {
    for (const character of COMPANION_CHARACTERS) {
      expect(getCompanionArt(character.id)).toMatch(
        new RegExp(`/art/characters/${character.id}\\.png$`),
      )
    }
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
npm.cmd test -- --run src/ui/sceneAssets.test.ts
```

Expected: FAIL because `sceneAssets.ts` does not exist.

- [ ] **Step 3: Implement the typed manifest**

```ts
import type { CompanionCharacterId } from '../domain/companionCharacters'

export type SceneAssetKey = 'worldHome' | 'companionRoom'

export const SCENE_ASSETS: Record<SceneAssetKey, string> = {
  worldHome: '/art/world/world-home-day.webp',
  companionRoom: '/art/room/companion-room-day.webp',
}

const COMPANION_ART: Record<CompanionCharacterId, string> = {
  foody: '/art/characters/foody.png',
  berry: '/art/characters/berry.png',
  noodle: '/art/characters/noodle.png',
  cocoa: '/art/characters/cocoa.png',
}

export function getCompanionArt(id: CompanionCharacterId): string {
  return COMPANION_ART[id]
}
```

- [ ] **Step 4: Run the test and verify pass**

Run:

```powershell
npm.cmd test -- --run src/ui/sceneAssets.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/ui/sceneAssets.ts src/ui/sceneAssets.test.ts
git commit -m "feat: define layered game scene assets"
```

---

### Task 2: Produce and optimize the artwork layers

**Files:**
- Create: `public/art/world/world-home-day.webp`
- Create: `public/art/room/companion-room-day.webp`
- Create: `public/art/characters/foody.png`
- Create: `public/art/characters/berry.png`
- Create: `public/art/characters/noodle.png`
- Create: `public/art/characters/cocoa.png`

**Interfaces:**
- Consumes: exact paths from `SCENE_ASSETS`.
- Produces: backgrounds with HUD and character safe zones; four transparent character sprites with matching camera, lighting, and scale.

- [ ] **Step 1: Generate the outdoor background plate**

Use the approved A-direction concept as visual reference. Generate a portrait background with no logo, UI, numbers, text, character, or phone frame. Keep the left 24% visually quiet for HUD, the center-lower area clear for the character, and the bottom 18% free of important details for navigation.

Exact art prompt:

```text
Premium commercial casual mobile game background plate, portrait 9:19.5.
A bright living food world: winding river, tiny bread and vegetable houses,
food-shaped distant mountains, lush edible plants, warm morning sun.
Polished soft 3D illustration with toy-like materials and clear depth.
Leave the left 24 percent calm for three large UI badges, the center-lower
area open for one large character, and the bottom 18 percent free for navigation.
No character, no UI, no text, no numbers, no logo, no phone frame, no watermark.
```

- [ ] **Step 2: Generate the companion-room background plate**

Use the approved C-direction concept as visual reference. Keep the same safe zones and lighting direction as the outdoor plate.

Exact art prompt:

```text
Premium commercial casual mobile game room background plate, portrait 9:19.5.
A warm food-themed character room with an arched sunny window, coral curtains,
herb planters, bread furniture, a trophy shelf, a soft round rug, and tiny
collectible display spaces. Cream, coral, gold, warm wood, and mint palette.
Leave the left 24 percent calm for three large UI badges, the center-lower
area open for one large character, and the bottom 18 percent free for navigation.
No character, no UI, no text, no numbers, no logo, no phone frame, no watermark.
```

- [ ] **Step 3: Generate the four character sprites**

Generate each character as a centered full-body sprite at the same scale, front-facing camera, matching top-left warm light, and a flat removable chroma-key background. Preserve the existing identities:

```text
foody: round golden chick-like food friend, coral scarf, joyful
berry: round strawberry fairy, leaf crown, lively
noodle: small ramen knight, noodle crest, brave
cocoa: soft cocoa bear, warm brown palette, calm
```

For each sprite append:

```text
Premium glossy soft 3D casual-game character, full body, centered, generous
padding, perfectly flat solid #00ff00 chroma-key background. No shadow,
no floor, no text, no logo, no watermark. Do not use #00ff00 in the character.
```

- [ ] **Step 4: Remove sprite backgrounds and optimize files**

Use the installed image-generation chroma removal helper for each character:

```powershell
python "$env:USERPROFILE\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py" --input .\tmp\foody-source.png --out .\public\art\characters\foody.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

Repeat with `berry`, `noodle`, and `cocoa`. Convert the two background plates to WebP at visual quality 84 using the workspace image dependency identified by `codex_app.load_workspace_dependencies`; do not add a runtime image library to the app.

- [ ] **Step 5: Validate the assets visually and mechanically**

Check:

- backgrounds contain no baked UI or character;
- transparent sprite corners have alpha `0`;
- no green fringe remains;
- all four characters fit the same visual bounding box;
- each background is below `550 KB`;
- each character is below `320 KB`;
- details do not sit under the HUD or bottom navigation safe zones.

Run:

```powershell
npm.cmd run build
```

Expected: Vite copies the asset directories and build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add public/art
git commit -m "feat: add food world and companion room artwork"
```

---

### Task 3: Build the fixed three-badge game HUD

**Files:**
- Create: `src/features/home/GameHud.tsx`
- Create: `src/features/home/GameHud.test.tsx`

**Interfaces:**
- Consumes:

```ts
interface GameHudProps {
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

- Produces: `GameHud`, with exactly three status buttons and one coin button.

- [ ] **Step 1: Write the failing HUD tests**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GameHud } from './GameHud'

const props = {
  coinBalance: 13,
  level: 4,
  levelProgress: 60,
  todayCards: 2,
  todayMeals: 1,
  mealTarget: 3,
  streakDays: 4,
  onOpenLevel: vi.fn(),
  onOpenCards: vi.fn(),
  onOpenMeals: vi.fn(),
  onOpenCoins: vi.fn(),
}

describe('GameHud', () => {
  it('shows one coin control and exactly three status controls', () => {
    render(<GameHud {...props} />)
    expect(screen.getByRole('button', { name: '보유 코인 13개' })).toBeInTheDocument()
    expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /레벨 4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /오늘의 카드 2장/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /오늘 식사 1끼, 목표 3끼, 연속 4일/ })).toBeInTheDocument()
  })

  it('opens each existing destination', async () => {
    const user = userEvent.setup()
    render(<GameHud {...props} />)
    await user.click(screen.getByRole('button', { name: /레벨 4/ }))
    await user.click(screen.getByRole('button', { name: /오늘의 카드 2장/ }))
    await user.click(screen.getByRole('button', { name: /오늘 식사 1끼/ }))
    expect(props.onOpenLevel).toHaveBeenCalledOnce()
    expect(props.onOpenCards).toHaveBeenCalledOnce()
    expect(props.onOpenMeals).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
npm.cmd test -- --run src/features/home/GameHud.test.tsx
```

Expected: FAIL because `GameHud` is missing.

- [ ] **Step 3: Implement the HUD**

Render:

```tsx
<header className="game-hud">
  <div className="game-logo" aria-label="Foodex">FOODEX</div>
  <button className="game-coin-pill" aria-label={`보유 코인 ${coinBalance}개`} onClick={onOpenCoins}>◆ {coinBalance}</button>
  <div className="game-status-rail" aria-label="오늘의 게임 상태">
    <button data-testid="game-hud-status" aria-label={`레벨 ${level}, 성장 ${levelProgress}%`} onClick={onOpenLevel}>…</button>
    <button data-testid="game-hud-status" aria-label={`오늘의 카드 ${todayCards}장`} onClick={onOpenCards}>…</button>
    <button data-testid="game-hud-status" aria-label={`오늘 식사 ${todayMeals}끼, 목표 ${mealTarget}끼, 연속 ${streakDays}일`} onClick={onOpenMeals}>…</button>
  </div>
</header>
```

Use visual text spans for the large values and a CSS progress bar with `aria-hidden="true"`.

- [ ] **Step 4: Run the HUD tests**

Run:

```powershell
npm.cmd test -- --run src/features/home/GameHud.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/home/GameHud.tsx src/features/home/GameHud.test.tsx
git commit -m "feat: add compact game lobby hud"
```

---

### Task 4: Extract the shared hero companion

**Files:**
- Create: `src/features/companion/HeroCompanion.tsx`
- Create: `src/features/companion/HeroCompanion.test.tsx`
- Modify: `src/features/home/CompanionRoom.tsx`
- Modify: `src/features/home/CompanionRoom.test.tsx`

**Interfaces:**
- Consumes:

```ts
export type CompanionEmotion =
  | 'calm'
  | 'expectant'
  | 'happy'
  | 'surprised'
  | 'celebrating'

interface HeroCompanionProps {
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
  evolutionStage?: number
  onOpenRoom?: () => void
}
```

- Produces: `HeroCompanion`, visual reaction classes, and optional long-press room navigation.

- [ ] **Step 1: Write failing behavior tests**

```tsx
it('renders the selected layered character asset', () => {
  render(<HeroCompanion characterId="berry" emotion="happy" reducedMotion={false} />)
  expect(screen.getByRole('button', { name: '기뻐하는 베리' })).toHaveStyle({
    '--companion-art': 'url("/art/characters/berry.png")',
  })
})

it('does not repeat the same click reaction consecutively', async () => {
  const user = userEvent.setup()
  render(<HeroCompanion characterId="foody" emotion="happy" reducedMotion={false} />)
  const companion = screen.getByRole('button', { name: '기뻐하는 푸디' })
  await user.click(companion)
  const first = companion.getAttribute('data-reaction')
  await user.click(companion)
  expect(companion.getAttribute('data-reaction')).not.toBe(first)
})

it('marks the character as reduced motion without removing its identity', () => {
  render(<HeroCompanion characterId="cocoa" emotion="calm" reducedMotion />)
  expect(screen.getByRole('button', { name: '차분한 코코아' })).toHaveClass('reduced-motion')
})
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
npm.cmd test -- --run src/features/companion/HeroCompanion.test.tsx
```

Expected: FAIL because `HeroCompanion` does not exist.

- [ ] **Step 3: Move reaction state into `HeroCompanion`**

Export `CompanionEmotion` from `HeroCompanion.tsx`, update `HomeScreen.tsx` to import it from the new module, and use the existing activity queue and timer cleanup from `CompanionRoom`. Keep:

```ts
const CLICK_REACTIONS = ['jump', 'wiggle', 'ears', 'spin', 'sparkle'] as const
```

Advance the index for each click. Clear every timeout on unmount. Render the selected art as a CSS custom property:

```tsx
style={{ '--companion-art': `url("${getCompanionArt(characterId)}")` } as React.CSSProperties}
```

Use a pointer hold of `600ms` for `onOpenRoom`; cancel the hold if the pointer moves or is released early. Keyboard users receive a visible `내 방 열기` companion action instead of relying on long press.

- [ ] **Step 4: Reuse `HeroCompanion` inside old `CompanionRoom` temporarily**

Replace only the old character markup with:

```tsx
<HeroCompanion
  characterId={characterId}
  emotion={emotion}
  reducedMotion={reducedMotion}
  evolutionStage={evolution?.stage}
  onOpenRoom={onOpenCompanion}
/>
```

This keeps existing home tests useful until the full scene replaces `CompanionRoom`.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm.cmd test -- --run src/features/companion/HeroCompanion.test.tsx src/features/home/CompanionRoom.test.tsx
```

Expected: both suites PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/companion/HeroCompanion.tsx src/features/companion/HeroCompanion.test.tsx src/features/home/CompanionRoom.tsx src/features/home/CompanionRoom.test.tsx
git commit -m "feat: share layered companion reactions"
```

---

### Task 5: Add the record orb and world hotspots

**Files:**
- Create: `src/features/home/MealRecordOrb.tsx`
- Create: `src/features/home/MealRecordOrb.test.tsx`
- Create: `src/features/home/WorldHotspot.tsx`
- Create: `src/features/home/WorldHotspot.test.tsx`

**Interfaces:**
- Produces:

```ts
interface MealRecordOrbProps {
  onRecord: () => void
  showLabel?: boolean
}

interface WorldHotspotProps {
  label: string
  className: string
  icon: string
  onActivate: () => void
}
```

- [ ] **Step 1: Write failing tests**

```tsx
it('starts the existing meal flow from the large orb', async () => {
  const onRecord = vi.fn()
  const user = userEvent.setup()
  render(<MealRecordOrb onRecord={onRecord} />)
  await user.click(screen.getByRole('button', { name: '식사 기록하기' }))
  expect(onRecord).toHaveBeenCalledOnce()
})

it('exposes a decorative world object as a named action', async () => {
  const onActivate = vi.fn()
  const user = userEvent.setup()
  render(<WorldHotspot label="음식 마을 모험 보기" className="village" icon="🏡" onActivate={onActivate} />)
  await user.click(screen.getByRole('button', { name: '음식 마을 모험 보기' }))
  expect(onActivate).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run and verify failure**

```powershell
npm.cmd test -- --run src/features/home/MealRecordOrb.test.tsx src/features/home/WorldHotspot.test.tsx
```

Expected: FAIL because both components are missing.

- [ ] **Step 3: Implement both primitives**

`MealRecordOrb` renders a camera icon and optional visible label. `WorldHotspot` renders:

```tsx
<button
  type="button"
  className={`world-hotspot ${className}`}
  aria-label={label}
  onClick={onActivate}
>
  <span aria-hidden="true">{icon}</span>
</button>
```

- [ ] **Step 4: Run and verify pass**

```powershell
npm.cmd test -- --run src/features/home/MealRecordOrb.test.tsx src/features/home/WorldHotspot.test.tsx
```

Expected: both tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/home/MealRecordOrb.tsx src/features/home/MealRecordOrb.test.tsx src/features/home/WorldHotspot.tsx src/features/home/WorldHotspot.test.tsx
git commit -m "feat: add game world actions"
```

---

### Task 6: Compose the outdoor world home

**Files:**
- Create: `src/features/home/WorldHomeScene.tsx`
- Create: `src/features/home/WorldHomeScene.test.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/features/home/HomeScreen.test.tsx`
- Delete: `src/features/home/HomeStatusGrid.tsx`
- Delete: `src/features/home/HomeStatusGrid.test.tsx`
- Delete: `src/features/home/CompanionRoom.tsx`
- Delete: `src/features/home/CompanionRoom.test.tsx`

**Interfaces:**
- Consumes the existing `HomeScreenProps` data and callbacks.
- Produces:

```ts
interface WorldHomeSceneProps {
  coinBalance: number
  level: PlayerLevel
  todayCards: number
  todayMeals: number
  mealTarget: number
  streakDays: number
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
  onRecord: () => void
  onOpenCollection: () => void
  onOpenAdventure: () => void
  onOpenCompanion: () => void
  onOpenLevel: () => void
  onOpenCoins: () => void
}
```

- [ ] **Step 1: Replace dashboard expectations with the compact scene contract**

```tsx
it('shows the outdoor game lobby without dashboard sections', () => {
  render(<HomeScreen {...props} />)
  expect(screen.getByRole('region', { name: '음식 세계 홈' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '식사 기록하기' })).toBeInTheDocument()
  expect(screen.getAllByTestId('game-hud-status')).toHaveLength(3)
  expect(screen.queryByText('오늘의 모험 보드')).not.toBeInTheDocument()
  expect(screen.queryByText('오늘의 식사 게이지')).not.toBeInTheDocument()
})

it('opens the room from the explicit companion action', async () => {
  const user = userEvent.setup()
  render(<HomeScreen {...props} />)
  await user.click(screen.getByRole('button', { name: '푸디의 내 방 열기' }))
  expect(props.onOpenCompanion).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run the home suite and verify failure**

```powershell
npm.cmd test -- --run src/features/home/HomeScreen.test.tsx
```

Expected: FAIL because the dashboard sections still exist.

- [ ] **Step 3: Implement `WorldHomeScene`**

Compose:

```tsx
<section
  className="world-home-scene"
  aria-label="음식 세계 홈"
  style={{ '--scene-background': `url("${SCENE_ASSETS.worldHome}")` } as React.CSSProperties}
>
  <GameHud ... />
  <HeroCompanion ... />
  <button className="open-room-action" onClick={onOpenCompanion}>푸디의 내 방 열기</button>
  <WorldHotspot className="world-hotspot-village" label="음식 마을 모험 보기" icon="🏡" onActivate={onOpenAdventure} />
  <WorldHotspot className="world-hotspot-river" label="오늘의 식사 던전 보기" icon="⛵" onActivate={onOpenAdventure} />
  <MealRecordOrb onRecord={onRecord} />
</section>
```

The explicit room action remains visible to keyboard and screen-reader users and can be rendered as a large toy-like room icon.

- [ ] **Step 4: Simplify `HomeScreen`**

Remove the next-quest derivation and all stacked sections. Add `onOpenLevel` and `onOpenCoins` to `HomeScreenProps`, then return only `WorldHomeScene` with existing props mapped to the new interface. Use `mealGameLoop.gaugeSteps.length` as `mealTarget` and compute level progress with:

```ts
const levelProgress = level.nextLevelXp > 0
  ? Math.min(100, Math.round((level.currentLevelXp / level.nextLevelXp) * 100))
  : 100
```

- [ ] **Step 5: Remove obsolete components**

Delete `HomeStatusGrid` and old `CompanionRoom` after imports and tests have migrated.

- [ ] **Step 6: Run focused tests**

```powershell
npm.cmd test -- --run src/features/home/WorldHomeScene.test.tsx src/features/home/HomeScreen.test.tsx src/features/companion/HeroCompanion.test.tsx
```

Expected: all suites PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/home src/features/companion/HeroCompanion.tsx
git commit -m "feat: replace home dashboard with food world"
```

---

### Task 7: Build the accessible shared bottom sheet

**Files:**
- Create: `src/ui/GameSheet.tsx`
- Create: `src/ui/GameSheet.test.tsx`

**Interfaces:**
- Produces:

```ts
interface GameSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}
```

- [ ] **Step 1: Write failing sheet tests**

```tsx
it('opens as a modal dialog and closes from its control', async () => {
  const onClose = vi.fn()
  const user = userEvent.setup()
  render(<GameSheet open title="성장 보기" onClose={onClose}><p>내용</p></GameSheet>)
  expect(screen.getByRole('dialog', { name: '성장 보기' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '성장 보기 닫기' }))
  expect(onClose).toHaveBeenCalledOnce()
})

it('supports the native cancel event', () => {
  const onClose = vi.fn()
  render(<GameSheet open title="상점" onClose={onClose}><p>내용</p></GameSheet>)
  fireEvent.cancel(screen.getByRole('dialog', { name: '상점' }))
  expect(onClose).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run and verify failure**

```powershell
npm.cmd test -- --run src/ui/GameSheet.test.tsx
```

Expected: FAIL because `GameSheet` is missing.

- [ ] **Step 3: Implement with native `<dialog>`**

Mirror the proven collection detail dialog pattern. Call `showModal()` when `open` becomes true, `close()` when false, and forward `cancel` to `onClose`. The sheet contains a named heading and close button.

- [ ] **Step 4: Run and verify pass**

```powershell
npm.cmd test -- --run src/ui/GameSheet.test.tsx
```

Expected: tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/ui/GameSheet.tsx src/ui/GameSheet.test.tsx
git commit -m "feat: add accessible game bottom sheet"
```

---

### Task 8: Compose the warm companion room

**Files:**
- Create: `src/features/companion/CompanionRoomScene.tsx`
- Create: `src/features/companion/CompanionRoomScene.test.tsx`

**Interfaces:**
- Produces:

```ts
export type RoomPanel = 'wardrobe' | 'growth' | 'shop' | null

interface CompanionRoomSceneProps {
  characterId: CompanionCharacterId
  emotion: CompanionEmotion
  reducedMotion: boolean
  evolution?: CompanionEvolution
  coinBalance: number
  activePanel: RoomPanel
  onPanelChange: (panel: RoomPanel) => void
  childrenByPanel: Partial<Record<Exclude<RoomPanel, null>, React.ReactNode>>
}
```

- [ ] **Step 1: Write failing room tests**

```tsx
it('renders one warm room scene and three named locations', () => {
  render(<CompanionRoomScene {...props} />)
  expect(screen.getByRole('region', { name: '푸디의 내 방' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '옷장 열기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '성장 거울 열기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '꾸미기 상점 열기' })).toBeInTheDocument()
})

it('opens the requested room panel', async () => {
  const user = userEvent.setup()
  render(<CompanionRoomScene {...props} />)
  await user.click(screen.getByRole('button', { name: '꾸미기 상점 열기' }))
  expect(props.onPanelChange).toHaveBeenCalledWith('shop')
})
```

- [ ] **Step 2: Run and verify failure**

```powershell
npm.cmd test -- --run src/features/companion/CompanionRoomScene.test.tsx
```

Expected: FAIL because the component is missing.

- [ ] **Step 3: Implement the room composition**

Render the room background via `SCENE_ASSETS.companionRoom`, `HeroCompanion`, coin pill, three `WorldHotspot`-style room buttons, and one `GameSheet`. Only the active panel’s child content is mounted.

- [ ] **Step 4: Run and verify pass**

```powershell
npm.cmd test -- --run src/features/companion/CompanionRoomScene.test.tsx
```

Expected: tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/companion/CompanionRoomScene.tsx src/features/companion/CompanionRoomScene.test.tsx
git commit -m "feat: add interactive companion room scene"
```

---

### Task 9: Make the companion screen room-first

**Files:**
- Modify: `src/features/companion/CompanionScreen.tsx`
- Modify: `src/features/companion/CompanionScreen.test.tsx`
- Modify: `src/features/companion/CosmeticShop.tsx`
- Modify: `src/features/companion/CosmeticShop.test.tsx`

**Interfaces:**
- Consumes `CompanionRoomScene`, existing character/job/evolution data, `CosmeticShop`, journal, and report builders.
- Produces a room-first screen; journal/report remain secondary actions.

- [ ] **Step 1: Write failing room-first tests**

```tsx
it('opens on the room instead of the journal dashboard', () => {
  render(<CompanionScreen {...props} />)
  expect(screen.getByRole('region', { name: '푸디의 내 방' })).toBeInTheDocument()
  expect(screen.queryByText('오늘의 식사 일기')).not.toBeInTheDocument()
})

it('opens the shop in the room sheet and preserves preview behavior', async () => {
  const user = userEvent.setup()
  render(<CompanionScreen {...props} />)
  await user.click(screen.getByRole('button', { name: '꾸미기 상점 열기' }))
  expect(screen.getByRole('dialog', { name: '꾸미기 상점' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /별 핀 미리보기/ }))
  expect(screen.getByText('방에 미리 놓아봤어요')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run and verify failure**

```powershell
npm.cmd test -- --run src/features/companion/CompanionScreen.test.tsx src/features/companion/CosmeticShop.test.tsx
```

Expected: room-first assertions FAIL.

- [ ] **Step 3: Replace the top-level tabs with room actions**

Use:

```ts
const [activePanel, setActivePanel] = useState<RoomPanel>(null)
```

Pass these panel bodies:

- `wardrobe`: current character picker and owned cosmetic controls;
- `growth`: evolution card, class picker, and one link/button to detailed systems;
- `shop`: `CosmeticShop compact`.

Move journal/report to two large secondary room buttons or a single `기록 책장` sheet. Do not show their text on initial render.

- [ ] **Step 4: Add compact shop presentation**

Extend:

```ts
interface CosmeticShopProps {
  compact?: boolean
  // existing props unchanged
}
```

When compact, omit the outer section heading only; retain product cards, preview, ownership, offline, insufficient-balance, and purchase behavior.

- [ ] **Step 5: Run focused tests**

```powershell
npm.cmd test -- --run src/features/companion/CompanionScreen.test.tsx src/features/companion/CosmeticShop.test.tsx src/features/companion/CompanionRoomScene.test.tsx
```

Expected: all suites PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/companion
git commit -m "feat: make the companion screen a real room"
```

---

### Task 10: Connect app navigation and game-scale bottom navigation

**Files:**
- Modify: `src/ui/BottomNav.tsx`
- Modify: `src/ui/BottomNav.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Keeps `AppTab = 'home' | 'collection' | 'record' | 'adventure' | 'companion'`.
- Changes only the companion visible label from `친구` to `내 방`.

- [ ] **Step 1: Write failing navigation tests**

```tsx
it('keeps all five routes and names the companion route 내 방', () => {
  render(<BottomNav active="home" onNavigate={vi.fn()} />)
  expect(screen.getAllByRole('button')).toHaveLength(5)
  expect(screen.getByRole('button', { name: '내 방' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '촬영' })).toBeInTheDocument()
})

it('opens the same companion route from the home room action', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: '푸디의 내 방 열기' }))
  expect(screen.getByRole('region', { name: '푸디의 내 방' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run and verify failure**

```powershell
npm.cmd test -- --run src/ui/BottomNav.test.tsx src/App.test.tsx
```

Expected: new label and new home action assertions FAIL.

- [ ] **Step 3: Update visible navigation**

Keep the route values and callback behavior unchanged. Use large icon spans and the labels:

```ts
[
  ['home', '홈'],
  ['collection', '도감'],
  ['record', '촬영'],
  ['adventure', '모험'],
  ['companion', '내 방'],
]
```

- [ ] **Step 4: Connect HUD sheet actions in `App`**

Add a local UI-only sheet state:

```ts
type HomeSheet = 'level' | 'meals' | 'coins' | null
const [homeSheet, setHomeSheet] = useState<HomeSheet>(null)
```

Collection continues to navigate directly. Level, meal progress, and coin controls open `GameSheet` with already calculated values and one clear destination action. Do not persist this state.

- [ ] **Step 5: Run focused integration tests**

```powershell
npm.cmd test -- --run src/ui/BottomNav.test.tsx src/features/home/HomeScreen.test.tsx src/App.test.tsx
```

Expected: all suites PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/ui/BottomNav.tsx src/ui/BottomNav.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: connect game lobby navigation"
```

---

### Task 11: Apply the unified art and interaction system

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes class names created in Tasks 3–10.
- Produces responsive game scene styling, safe areas, common focus, motion, and bottom sheet layout.

- [ ] **Step 1: Add global game tokens**

```css
:root {
  --game-ink: #3d2750;
  --game-purple: #6d42cc;
  --game-gold: #ffd35d;
  --game-coral: #f5755d;
  --game-mint: #bfe5cd;
  --game-cream: #fff6dc;
  --game-outline: .2rem solid #583267;
  --game-shadow: 0 .34rem 0 #4a2859;
  --game-touch: 3.25rem;
}
```

- [ ] **Step 2: Implement scene and safe-area layout**

`world-home-scene` and `companion-room-scene`:

- width `min(100%, 31rem)`;
- min-height `calc(100dvh - 5.4rem)`;
- background from `--scene-background`, cover and center;
- overflow hidden;
- no vertical dashboard gap;
- bottom padding covers navigation safe area.

Position the left HUD rail outside the central character bounding box. Keep the camera orb centered above bottom navigation.

- [ ] **Step 3: Implement size constraints**

```css
.game-status-button { min-width: 4.7rem; min-height: 3.75rem; font-size: 1rem; }
.game-status-value { font-size: 1.35rem; }
.meal-record-orb { width: 5.5rem; height: 5.5rem; font-size: 2.2rem; }
.world-hotspot, .room-hotspot, .open-room-action { min-width: var(--game-touch); min-height: var(--game-touch); }
.bottom-nav button { min-height: 4rem; font-size: 1rem; }
```

- [ ] **Step 4: Implement tactile feedback and focus**

Buttons use a short downshift and shadow compression. Use:

```css
:where(.game-status-button, .meal-record-orb, .world-hotspot, .room-hotspot, .bottom-nav button):focus-visible {
  outline: .25rem solid var(--game-gold);
  outline-offset: .18rem;
  box-shadow: 0 0 0 .22rem var(--game-purple), var(--game-shadow);
}
```

Do not use default blue focus.

- [ ] **Step 5: Implement motion reduction**

```css
@media (prefers-reduced-motion: reduce) {
  .hero-companion,
  .hero-companion::after,
  .world-hotspot,
  .room-hotspot,
  .meal-record-orb {
    animation: none !important;
    transition-duration: .01ms !important;
  }
}
```

Preserve opacity and color state changes.

- [ ] **Step 6: Remove obsolete dashboard CSS**

Delete selectors for:

- `.home-hero-mission`
- `.meal-game-loop` within home
- `.meal-adventure-panel` within home
- `.home-adventure-board`
- `.home-status-grid`
- old CSS-drawn `.companion-character` body parts
- old room floor/wall drawing once the new room background is active

Use `rg` to confirm no deleted class is referenced:

```powershell
rg -n "home-hero-mission|home-adventure-board|home-status-grid|meal-adventure-panel" src
```

Expected: no matches from live source.

- [ ] **Step 7: Run component tests and build**

```powershell
npm.cmd test -- --run src/features/home src/features/companion src/ui
npm.cmd run build
```

Expected: focused tests and production build PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/styles.css
git commit -m "feat: unify foodex game scene design"
```

---

### Task 12: Complete regression, visual, and deployment verification

**Files:**
- Modify only if verification uncovers a scoped defect.

**Interfaces:**
- Validates the full approved experience without adding scope.

- [ ] **Step 1: Run the entire automated suite**

```powershell
npm.cmd test -- --run
```

Expected: all existing 185 tests plus new tests PASS.

- [ ] **Step 2: Run the production build**

```powershell
npm.cmd run build
```

Expected: TypeScript and Vite build PASS with no missing asset.

- [ ] **Step 3: Start and verify the production preview**

```powershell
npm.cmd run preview -- --host 127.0.0.1
```

Verify with browser automation at:

- `360 × 800`
- `390 × 844`
- `430 × 932`

Check:

- no horizontal overflow;
- logo, coin, three badges, character, orb, and navigation fit without scroll;
- character does not overlap HUD;
- all 4 characters fit the same hero box;
- room sheets remain within viewport;
- 200% zoom retains record CTA and readable labels;
- keyboard focus is visible;
- reduced motion removes large movement;
- offline shop messaging remains available;
- food recording still reaches the integrated reward reveal and returns home.

- [ ] **Step 4: Inspect image transfer and paint behavior**

Use browser network/performance inspection:

- home must not request the room background before idle preload or navigation;
- no single background exceeds `550 KB`;
- no character exceeds `320 KB`;
- no 404 asset requests;
- animation does not continuously trigger layout.

- [ ] **Step 5: Run final static checks**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and only intended tracked changes.

- [ ] **Step 6: Commit scoped verification fixes**

If verification required code changes, stage only those exact files and commit:

```powershell
git commit -m "fix: polish food world mobile layout"
```

If no changes were required, do not create an empty commit.

- [ ] **Step 7: Publish and verify Vercel Preview**

Push `feature/foodex-mvp`, update the existing open PR, and wait until the Vercel deployment for the final commit is `READY`. Confirm the branch alias opens the redesigned home and room before reporting completion.
