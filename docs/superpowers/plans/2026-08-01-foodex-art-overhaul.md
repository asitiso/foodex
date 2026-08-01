# Foodex Art Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Foodex home world, buddy room, and four mascot assets with one coherent kids-animation food-spirit RPG art system while preserving every existing gameplay, navigation, persistence, accessibility, and responsive-layout contract.

**Architecture:** Keep `src/ui/sceneAssets.ts` as the only production asset registry and retain `WorldHomeScene`, `CompanionRoomScene`, `HeroCompanion`, and `GameSheet` as the behavioral boundaries. Add clean optimized scene/character files under `public/art`, then make focused composition and CSS changes without modifying domain logic, IndexedDB, Supabase, progression, or top-level navigation.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS custom properties/keyframes, WebP scene assets, transparent PNG mascot assets, Vercel Preview.

## Global Constraints

- Do not add gameplay systems, routes, top-level navigation items, database changes, or Supabase migrations.
- Preserve collection, adventure, buddy, meal-record, coin, wardrobe, growth, shop, journal, and report behavior.
- Preserve a minimum 16px body-text baseline and minimum 52px interactive targets.
- Preserve safe-area handling, responsive mobile layout, keyboard focus, and `prefers-reduced-motion` behavior.
- Purple `#7350DF` and gold/yellow `#FFD94A` remain the main interaction colors.
- Full-screen backgrounds must be WebP and should remain below approximately 700 KB each after optimization.
- Transparent mascot files should remain below approximately 350 KB each.
- Do not embed labels, HUD, buttons, characters, or readable text inside scene backgrounds.
- Do not add a JavaScript animation library.
- Decorative layers must use `pointer-events: none`.
- The room panel shell and header stay fixed; only panel content scrolls, and scroll chaining is blocked.

---

## File Structure

### Production assets

- Create `public/art/world/world-home-play-city.webp`: clean 9:16 play-city environment with upper-left HUD clearance, upper-right coin clearance, lower-center mascot stage, and bottom-nav clearance.
- Create `public/art/room/buddy-fantasy-room.webp`: clean 9:16 fantasy kids room with wardrobe, growth mirror, shop cabinet, bookshelf/report props, right-control clearance, and lower-center mascot stage.
- Create `public/art/characters/foodi.png`: transparent yellow bird mascot with red scarf.
- Create `public/art/characters/berry.png`: transparent strawberry fairy mascot.
- Create `public/art/characters/noodle.png`: transparent orange noodle-spirit mascot.
- Create `public/art/characters/cocoa.png`: transparent cocoa-cup mascot.

### Registry and tests

- Modify `src/ui/sceneAssets.ts`: map scene and character IDs to the six new production files.
- Modify `src/ui/sceneAssets.test.ts`: assert exact paths and production file extensions.

### Scene composition

- Modify `src/features/home/WorldHomeScene.tsx`: preserve handlers and semantic controls while applying the updated scene composition contract.
- Modify `src/features/home/WorldHomeScene.test.tsx`: verify scene variable, labels, and click callbacks.
- Modify `src/features/companion/CompanionRoomScene.tsx`: preserve panel actions and ensure the new room composition exposes the same controls.
- Modify `src/features/companion/CompanionRoomScene.test.tsx`: verify wardrobe, growth, and shop behavior.
- Modify `src/features/companion/CompanionScreen.tsx`: preserve direct-open panel behavior and background variable.
- Modify `src/features/companion/CompanionScreen.test.tsx`: verify direct shop opening and room background contract.

### Shared companion and reactions

- Modify `src/ui/companion/HeroCompanion.tsx`: normalize the six visual reaction names without changing the public character ID contract.
- Modify `src/ui/companion/HeroCompanion.test.tsx`: verify all four art paths and six reaction classes.

### Styling

- Modify `src/styles.css`: palette tokens, scene positioning, HUD surfaces, hit areas, mascot sizing, six reactions, panel scrolling, focus/press states, breakpoints, and reduced-motion handling.
- Modify `src/companionRoomFix.css`: remove temporary overrides that conflict with the final integrated room-panel rules, or delete this file if all rules move into `styles.css`.
- Modify `src/main.tsx` only if `companionRoomFix.css` is removed.

### Verification documentation

- Create `docs/art/foodex-art-overhaul-asset-manifest.md`: source dimensions, optimized sizes, visual safe areas, and final paths.
- Update `task-11-report.md` or create `art-overhaul-report.md`: focused tests, full tests, build, viewport checks, and Vercel status.

---

### Task 1: Lock the New Asset Registry Contract

**Files:**
- Modify: `src/ui/sceneAssets.test.ts`
- Modify: `src/ui/sceneAssets.ts`

**Interfaces:**
- Produces:

```ts
export type SceneAssetKey = 'worldHome' | 'companionRoom'

export const SCENE_ASSETS: Record<SceneAssetKey, string>

export function getCompanionArt(id: CompanionCharacterId): string
```

- Expected production paths:

```ts
SCENE_ASSETS.worldHome === '/art/world/world-home-play-city.webp'
SCENE_ASSETS.companionRoom === '/art/room/buddy-fantasy-room.webp'
getCompanionArt('foody') === '/art/characters/foodi.png'
getCompanionArt('berry') === '/art/characters/berry.png'
getCompanionArt('noodle') === '/art/characters/noodle.png'
getCompanionArt('cocoa') === '/art/characters/cocoa.png'
```

- [ ] **Step 1: Write the failing registry test**

```ts
import { describe, expect, it } from 'vitest'
import { getCompanionArt, SCENE_ASSETS } from './sceneAssets'

describe('Foodex production art registry', () => {
  it('resolves the approved play-city and fantasy-room backgrounds', () => {
    expect(SCENE_ASSETS).toEqual({
      worldHome: '/art/world/world-home-play-city.webp',
      companionRoom: '/art/room/buddy-fantasy-room.webp',
    })
  })

  it.each([
    ['foody', '/art/characters/foodi.png'],
    ['berry', '/art/characters/berry.png'],
    ['noodle', '/art/characters/noodle.png'],
    ['cocoa', '/art/characters/cocoa.png'],
  ] as const)('maps %s to its transparent production art', (id, path) => {
    expect(getCompanionArt(id)).toBe(path)
  })
})
```

- [ ] **Step 2: Run the registry test and confirm RED**

Run:

```powershell
npm.cmd run test:run -- src/ui/sceneAssets.test.ts
```

Expected: FAIL because the registry still points to `world-home-day.webp`, `companion-room-day.webp`, and the old character file names.

- [ ] **Step 3: Update the registry with only the approved paths**

```ts
export const SCENE_ASSETS: Record<SceneAssetKey, string> = {
  worldHome: '/art/world/world-home-play-city.webp',
  companionRoom: '/art/room/buddy-fantasy-room.webp',
}

const COMPANION_ART: Record<CompanionCharacterId, string> = {
  foody: '/art/characters/foodi.png',
  berry: '/art/characters/berry.png',
  noodle: '/art/characters/noodle.png',
  cocoa: '/art/characters/cocoa.png',
}
```

- [ ] **Step 4: Run the registry test and confirm GREEN**

Run:

```powershell
npm.cmd run test:run -- src/ui/sceneAssets.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the contract separately**

```powershell
git add src/ui/sceneAssets.ts src/ui/sceneAssets.test.ts
git commit -m "test: lock Foodex art asset contract"
```

---

### Task 2: Produce and Optimize the Two Clean Scene Backgrounds

**Files:**
- Create: `public/art/world/world-home-play-city.webp`
- Create: `public/art/room/buddy-fantasy-room.webp`
- Create: `docs/art/foodex-art-overhaul-asset-manifest.md`

**Interfaces:**
- Consumes: exact paths from Task 1.
- Produces: two browser-loadable WebP files with no embedded text, UI, or characters.

- [ ] **Step 1: Create the home source composition**

Generate or edit a portrait source at no less than `1170 × 2532` with these fixed zones:

```text
0–28% height: blue sky, clouds, balloons, rainbow; low visual density at left/right HUD corners
28–66% height: strawberry collection house on left, adventure castle upper center, buddy house right, camera landmark center
66–90% height: open patterned plaza and mascot stage with low-contrast details
90–100% height: low-detail foreground reserved for fixed bottom navigation
```

Reject the source if it contains readable labels, UI panels, coin counters, HUD boxes, mascots, or a baked-in Foodex logo.

- [ ] **Step 2: Create the buddy-room source composition**

Generate or edit a portrait source at no less than `1170 × 2532` with these fixed zones:

```text
upper third: star lights, rounded window, curtains; quiet upper-right coin region
left middle: physical wardrobe
right middle: glowing growth mirror and shop/display cabinet
lower center: soft rug and empty mascot stage
right edge: enough contrast-free space for the existing vertical controls
bottom: low-detail area behind the fixed navigation
```

Reject the source if it contains readable labels, UI panels, counters, mascots, or baked-in buttons.

- [ ] **Step 3: Convert both approved sources to WebP**

Use ImageMagick when available:

```powershell
magick home-source.png -resize "1170x2532^" -gravity center -extent 1170x2532 -strip -quality 82 public/art/world/world-home-play-city.webp
magick room-source.png -resize "1170x2532^" -gravity center -extent 1170x2532 -strip -quality 82 public/art/room/buddy-fantasy-room.webp
```

If `magick` is unavailable, use a local image editor’s WebP export at quality 80–84 and preserve `1170 × 2532`.

- [ ] **Step 4: Verify dimensions, format, and file sizes**

Run:

```powershell
Get-Item public/art/world/world-home-play-city.webp, public/art/room/buddy-fantasy-room.webp |
  Select-Object Name, Length
magick identify public/art/world/world-home-play-city.webp public/art/room/buddy-fantasy-room.webp
```

Expected:
- Both files are WebP.
- Both files are `1170 × 2532` or an equivalent 9:16 portrait size.
- Each file is approximately 700 KB or less where quality permits.

- [ ] **Step 5: Record the asset manifest**

Create `docs/art/foodex-art-overhaul-asset-manifest.md` with this exact table shape:

```markdown
# Foodex Art Overhaul Asset Manifest

| Asset | Path | Pixel size | File size | Alpha | Safe-area notes |
|---|---|---:|---:|---|---|
| Home play city | `public/art/world/world-home-play-city.webp` | 1170×2532 | ... KB | No | HUD corners and lower-center stage clear |
| Buddy fantasy room | `public/art/room/buddy-fantasy-room.webp` | 1170×2532 | ... KB | No | Right control rail and lower-center stage clear |
```

- [ ] **Step 6: Commit the scene assets**

```powershell
git add public/art/world/world-home-play-city.webp public/art/room/buddy-fantasy-room.webp docs/art/foodex-art-overhaul-asset-manifest.md
git commit -m "feat: add Foodex play-city and buddy-room art"
```

---

### Task 3: Produce and Optimize the Four Transparent Mascots

**Files:**
- Create: `public/art/characters/foodi.png`
- Create: `public/art/characters/berry.png`
- Create: `public/art/characters/noodle.png`
- Create: `public/art/characters/cocoa.png`
- Modify: `docs/art/foodex-art-overhaul-asset-manifest.md`

**Interfaces:**
- Consumes: character IDs from `CompanionCharacterId` and paths from Task 1.
- Produces: one neutral transparent production pose per mascot. CSS supplies the six reaction transforms.

- [ ] **Step 1: Produce the four neutral poses on transparent canvases**

Use a square `1024 × 1024` canvas for each file. Keep 8–10% transparent padding on all sides. Required identity cues:

```text
Foodi: yellow round bird, large eyes, short wings/feet, red scarf
Berry: strawberry-pink round fairy, green leaf crown, small white flower, tiny wings
Noodle: orange-yellow round spirit, readable flexible noodle strands, star accent
Cocoa: cocoa-brown cup body, cream/marshmallow top, red bow, short limbs
```

Use the same light direction, outline family, eye style, highlight size, and body scale for all four.

- [ ] **Step 2: Verify transparency before optimization**

Run:

```powershell
magick identify -format "%f %[channels] %wx%h`n" character-source-*.png
```

Expected: each source reports an alpha channel and `1024x1024`.

- [ ] **Step 3: Resize and optimize the production PNG files**

```powershell
magick foodi-source.png -resize 768x768 -strip -define png:compression-level=9 public/art/characters/foodi.png
magick berry-source.png -resize 768x768 -strip -define png:compression-level=9 public/art/characters/berry.png
magick noodle-source.png -resize 768x768 -strip -define png:compression-level=9 public/art/characters/noodle.png
magick cocoa-source.png -resize 768x768 -strip -define png:compression-level=9 public/art/characters/cocoa.png
```

- [ ] **Step 4: Verify output sizes and alpha**

```powershell
Get-Item public/art/characters/foodi.png, public/art/characters/berry.png, public/art/characters/noodle.png, public/art/characters/cocoa.png |
  Select-Object Name, Length
magick identify -format "%f %[channels] %wx%h`n" public/art/characters/*.png
```

Expected:
- Every file is `768 × 768`.
- Every file retains alpha.
- Each file is approximately 350 KB or less where visual quality permits.

- [ ] **Step 5: Add all four rows to the manifest**

```markdown
| Foodi | `public/art/characters/foodi.png` | 768×768 | ... KB | Yes | 8–10% transparent padding |
| Berry | `public/art/characters/berry.png` | 768×768 | ... KB | Yes | 8–10% transparent padding |
| Noodle | `public/art/characters/noodle.png` | 768×768 | ... KB | Yes | strands remain inside canvas |
| Cocoa | `public/art/characters/cocoa.png` | 768×768 | ... KB | Yes | steam/cream remains inside canvas |
```

- [ ] **Step 6: Commit the mascot package**

```powershell
git add public/art/characters/foodi.png public/art/characters/berry.png public/art/characters/noodle.png public/art/characters/cocoa.png docs/art/foodex-art-overhaul-asset-manifest.md
git commit -m "feat: add redesigned Foodex mascots"
```

---

### Task 4: Preserve Home Behavior While Applying the New Composition

**Files:**
- Modify: `src/features/home/WorldHomeScene.test.tsx`
- Modify: `src/features/home/WorldHomeScene.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `SCENE_ASSETS.worldHome`, `HeroCompanion`, and the existing callbacks.
- Produces: the same semantic controls and callbacks with the new background variable and safe-area composition.

- [ ] **Step 1: Add a regression test for the approved scene and actions**

```ts
it('uses the play-city scene while preserving every home action', async () => {
  const user = userEvent.setup()
  const actions = {
    onRecord: vi.fn(),
    onOpenCollection: vi.fn(),
    onOpenAdventure: vi.fn(),
    onOpenCompanion: vi.fn(),
    onOpenCoins: vi.fn(),
  }

  render(<WorldHomeScene {...baseProps} {...actions} />)

  expect(screen.getByLabelText('Foodex 홈')).toHaveStyle({
    '--scene-background': 'url("/art/world/world-home-play-city.webp")',
  })

  await user.click(screen.getByRole('button', { name: /식사 기록/ }))
  await user.click(screen.getByRole('button', { name: /도감/ }))
  await user.click(screen.getByRole('button', { name: /모험/ }))
  await user.click(screen.getByRole('button', { name: /버디/ }))
  await user.click(screen.getByRole('button', { name: /코인/ }))

  expect(actions.onRecord).toHaveBeenCalledOnce()
  expect(actions.onOpenCollection).toHaveBeenCalledOnce()
  expect(actions.onOpenAdventure).toHaveBeenCalledOnce()
  expect(actions.onOpenCompanion).toHaveBeenCalledOnce()
  expect(actions.onOpenCoins).toHaveBeenCalledOnce()
})
```

Use the component’s existing accessible labels if they differ; do not rename user-facing controls solely to satisfy the sample.

- [ ] **Step 2: Run the focused home test and confirm RED where the path/style differs**

```powershell
npm.cmd run test:run -- src/features/home/WorldHomeScene.test.tsx
```

- [ ] **Step 3: Apply the registry scene variable without hard-coded paths**

The root must continue to receive:

```tsx
style={{ '--scene-background': `url("${SCENE_ASSETS.worldHome}")` } as CSSProperties}
```

Do not duplicate `/art/world/world-home-play-city.webp` inside the component.

- [ ] **Step 4: Retune only the home composition rules**

Add or update these responsibilities in `styles.css`:

```css
.world-home-scene {
  min-height: calc(100dvh - 5.4rem);
  background: var(--scene-background) center / cover no-repeat, var(--game-cream);
}

.world-home-scene .game-hud {
  position: relative;
  z-index: 6;
}

.world-home-scene .hero-companion-wrap {
  z-index: 3;
  bottom: calc(5.6rem + env(safe-area-inset-bottom));
  height: min(43dvh, 23rem);
  pointer-events: none;
}

.world-home-scene .companion-character {
  pointer-events: auto;
  width: min(46vw, 13.5rem);
  height: min(50vw, 14.5rem);
}
```

Keep actual hotspot positions aligned with the approved art, but every hotspot must retain `min-width` and `min-height` of `var(--game-touch)` (`3.25rem`, equal to 52px at a 16px root size).

- [ ] **Step 5: Run the home test and related navigation test**

```powershell
npm.cmd run test:run -- src/features/home/WorldHomeScene.test.tsx src/features/home/HomeScreen.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the home composition**

```powershell
git add src/features/home/WorldHomeScene.tsx src/features/home/WorldHomeScene.test.tsx src/styles.css
git commit -m "feat: apply Foodex play-city home scene"
```

---

### Task 5: Preserve Buddy Behavior While Applying the Fantasy Room

**Files:**
- Modify: `src/features/companion/CompanionRoomScene.test.tsx`
- Modify: `src/features/companion/CompanionRoomScene.tsx`
- Modify: `src/features/companion/CompanionScreen.test.tsx`
- Modify: `src/features/companion/CompanionScreen.tsx`
- Modify: `src/styles.css`
- Modify or delete: `src/companionRoomFix.css`
- Modify: `src/main.tsx` only when deleting the temporary stylesheet.

**Interfaces:**
- Consumes: `SCENE_ASSETS.companionRoom` and `initialPanel?: RoomPanel` from the current companion screen contract.
- Produces: wardrobe, growth, and shop controls; direct shop opening; fixed shell with content-only scrolling.

- [ ] **Step 1: Add room-action and direct-open tests**

```ts
it('opens each room feature from the fantasy room controls', async () => {
  const user = userEvent.setup()
  render(<CompanionRoomScene {...baseProps} />)

  await user.click(screen.getByRole('button', { name: /옷장/ }))
  expect(screen.getByRole('heading', { name: /옷장|친구 캐릭터 선택/ })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /성장/ }))
  expect(screen.getByText(/성장|직업 선택/)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /상점/ }))
  expect(screen.getByText(/꾸미기 상점/)).toBeInTheDocument()
})

it('opens the shop immediately when CompanionScreen receives initialPanel shop', () => {
  render(<CompanionScreen {...baseProps} initialPanel="shop" />)
  expect(screen.getByText(/꾸미기 상점/)).toBeInTheDocument()
})
```

Adapt the first test to the actual controlled `activePanel/onPanelChange` interface if `CompanionRoomScene` does not own panel state.

- [ ] **Step 2: Run focused room tests and confirm current failures or missing assertions**

```powershell
npm.cmd run test:run -- src/features/companion/CompanionRoomScene.test.tsx src/features/companion/CompanionScreen.test.tsx
```

- [ ] **Step 3: Keep the background path registry-driven**

The `CompanionScreen` root must retain:

```tsx
style={{ '--scene-background': `url("${SCENE_ASSETS.companionRoom}")` } as CSSProperties}
```

- [ ] **Step 4: Consolidate the room panel scrolling rules**

Move the final rules into `styles.css`:

```css
.companion-room-scene {
  background: var(--scene-background) center / cover no-repeat, var(--game-cream);
}

.room-panel {
  position: absolute;
  z-index: 8;
  inset: auto 0 0;
  max-height: min(74dvh, 42rem);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  overscroll-behavior: contain;
}

.room-panel-header {
  position: relative;
  z-index: 2;
}

.room-panel-content {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}
```

Use the project’s real panel class names; do not add parallel wrappers if existing ones already provide these boundaries.

- [ ] **Step 5: Remove temporary duplicate overrides**

If `src/companionRoomFix.css` only contains the scrolling/background hotfix, move every still-needed rule into `styles.css`, delete the file, and remove:

```ts
import './companionRoomFix.css'
```

from `src/main.tsx`.

If the file contains unrelated necessary rules, keep it but delete only duplicated declarations and document why it remains in the manifest/report.

- [ ] **Step 6: Run room tests and App navigation tests**

```powershell
npm.cmd run test:run -- src/features/companion/CompanionRoomScene.test.tsx src/features/companion/CompanionScreen.test.tsx src/App.test.tsx
```

Expected: PASS, including coin sheet → Buddy → open shop.

- [ ] **Step 7: Commit the buddy-room composition**

```powershell
git add src/features/companion/CompanionRoomScene.tsx src/features/companion/CompanionRoomScene.test.tsx src/features/companion/CompanionScreen.tsx src/features/companion/CompanionScreen.test.tsx src/styles.css src/main.tsx
git add -u src/companionRoomFix.css
git commit -m "feat: apply Foodex fantasy buddy room"
```

---

### Task 6: Normalize Four Mascots and Six Shared Reactions

**Files:**
- Modify: `src/ui/companion/HeroCompanion.test.tsx`
- Modify: `src/ui/companion/HeroCompanion.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `getCompanionArt(characterId)`.
- Produces:

```ts
export type CompanionReaction =
  | 'idle-smile'
  | 'jump'
  | 'surprise'
  | 'sleepy'
  | 'satisfied'
  | 'sparkle-discovery'
```

If the existing public API uses `emotion` and `activity`, retain it and add a pure mapping function rather than forcing all callers to change.

- [ ] **Step 1: Add a pure reaction-class mapping test**

```ts
it.each([
  ['idle-smile', 'reaction-idle-smile'],
  ['jump', 'reaction-jump'],
  ['surprise', 'reaction-surprise'],
  ['sleepy', 'reaction-sleepy'],
  ['satisfied', 'reaction-satisfied'],
  ['sparkle-discovery', 'reaction-sparkle-discovery'],
] as const)('maps %s to one stable reaction class', (reaction, expectedClass) => {
  expect(getReactionClass(reaction)).toBe(expectedClass)
})
```

- [ ] **Step 2: Add a four-character render test**

```ts
it.each(['foody', 'berry', 'noodle', 'cocoa'] as const)(
  'renders production art for %s',
  (characterId) => {
    render(<HeroCompanion characterId={characterId} reaction="idle-smile" reducedMotion={false} />)
    expect(screen.getByRole('button', { name: new RegExp(characterId, 'i') })).toHaveStyle({
      '--companion-art': `url("${getCompanionArt(characterId)}")`,
    })
  },
)
```

Use Korean accessible character names if that is the existing contract.

- [ ] **Step 3: Run the focused test and confirm RED**

```powershell
npm.cmd run test:run -- src/ui/companion/HeroCompanion.test.tsx
```

- [ ] **Step 4: Implement the minimal mapping while preserving callers**

```ts
export function getReactionClass(reaction: CompanionReaction): string {
  return `reaction-${reaction}`
}
```

When current `emotion/activity` values are used, map them in one place:

```ts
const LEGACY_REACTION_MAP = {
  calm: 'idle-smile',
  happy: 'satisfied',
  celebrating: 'sparkle-discovery',
  surprised: 'surprise',
  sleep: 'sleepy',
  jump: 'jump',
} as const
```

Do not remove old props until every current caller and test is migrated in the same task.

- [ ] **Step 5: Define the six CSS reactions**

```css
.reaction-idle-smile { animation: companion-bob 2.6s ease-in-out infinite; }
.reaction-jump { animation: companion-jump .9s ease-in-out; }
.reaction-surprise { animation: companion-surprise .55s ease-out; }
.reaction-sleepy { animation: companion-sleep 3.4s ease-in-out infinite; }
.reaction-satisfied { animation: companion-satisfied 1.4s ease-in-out; }
.reaction-sparkle-discovery { animation: companion-sparkle .9s ease-out; }

@keyframes companion-surprise {
  0% { transform: translateX(-50%) scale(1); }
  45% { transform: translateX(-50%) translateY(-.35rem) scale(1.08); }
  100% { transform: translateX(-50%) scale(1); }
}

@keyframes companion-satisfied {
  0%, 100% { transform: translateX(-50%) rotate(0); }
  45% { transform: translateX(-50%) rotate(-3deg) scale(1.03); }
}
```

- [ ] **Step 6: Preserve reduced-motion behavior**

```css
@media (prefers-reduced-motion: reduce) {
  .companion-character {
    animation: none !important;
    transition-duration: .01ms !important;
  }
}

.companion-character[data-reduced-motion="true"] {
  animation: none !important;
}
```

- [ ] **Step 7: Run focused and scene tests**

```powershell
npm.cmd run test:run -- src/ui/companion/HeroCompanion.test.tsx src/features/home/WorldHomeScene.test.tsx src/features/companion/CompanionRoomScene.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the shared character system**

```powershell
git add src/ui/companion/HeroCompanion.tsx src/ui/companion/HeroCompanion.test.tsx src/styles.css
git commit -m "feat: unify Foodex mascot reactions"
```

---

### Task 7: Retune HUD, Sheets, Buttons, Focus, and Press Feedback

**Files:**
- Modify: `src/styles.css`
- Modify: `src/ui/GameSheet.test.tsx` only if an additional scroll-shell assertion is required.
- Modify: `src/ui/GameSheet.tsx` only if the current DOM lacks separate fixed header/content regions.

**Interfaces:**
- Consumes: existing `--game-*` tokens and `GameSheet` markup.
- Produces: one coherent cream/purple/gold surface system with accessible contrast and 52px targets.

- [ ] **Step 1: Add or confirm the sheet structure test**

```ts
it('keeps the header outside the independently scrollable content region', () => {
  render(
    <GameSheet open title="성장 거울" onClose={vi.fn()}>
      <div>긴 내용</div>
    </GameSheet>,
  )

  const dialog = screen.getByRole('dialog', { name: '성장 거울' })
  expect(dialog.querySelector('.game-sheet-header')).toBeInTheDocument()
  expect(dialog.querySelector('.game-sheet-content')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the sheet test**

```powershell
npm.cmd run test:run -- src/ui/GameSheet.test.tsx
```

Expected: PASS with the current separated DOM. If it fails, restore the existing header/content separation rather than adding another nested dialog.

- [ ] **Step 3: Consolidate approved palette tokens**

```css
:root {
  --game-sky: #2397f3;
  --game-gold: #ffd94a;
  --game-pink: #ff6fae;
  --game-purple: #7350df;
  --game-mint: #80d9c2;
  --game-coral: #ff7a65;
  --game-cream: #fff5d8;
  --game-ink: #4a2e67;
  --game-outline: .2rem solid var(--game-ink);
  --game-shadow: 0 .34rem 0 #3a205f;
  --game-touch: 3.25rem;
}
```

- [ ] **Step 4: Retune interactive surfaces without reducing contrast**

```css
.game-coin-pill,
.game-status-button,
.room-hotspot,
.world-hotspot,
.game-sheet-header button {
  min-width: var(--game-touch);
  min-height: var(--game-touch);
  border: var(--game-outline);
  color: var(--game-ink);
  box-shadow: var(--game-shadow);
}

.game-sheet,
.room-panel {
  background: color-mix(in srgb, var(--game-cream) 96%, white);
  color: var(--game-ink);
}
```

Avoid `color-mix` if the project’s browser support target rejects it; use `#fff8e7` instead.

- [ ] **Step 5: Keep keyboard focus visibly above the rich backgrounds**

```css
:where(
  .game-status-button,
  .game-coin-pill,
  .meal-record-orb,
  .world-hotspot,
  .room-hotspot,
  .game-sheet-header button,
  .bottom-nav button
):focus-visible {
  outline: .25rem solid var(--game-gold);
  outline-offset: .18rem;
  box-shadow: 0 0 0 .22rem var(--game-purple), var(--game-shadow);
}
```

- [ ] **Step 6: Keep press feedback tactile but brief**

```css
:where(
  .game-status-button,
  .game-coin-pill,
  .world-hotspot,
  .room-hotspot,
  .game-sheet-header button
):active {
  transform: translateY(.22rem);
  filter: saturate(1.1);
  box-shadow: 0 .12rem 0 #3a205f;
}
```

Do not apply a transform that overwrites the mascot’s animation transform.

- [ ] **Step 7: Run all UI-focused tests**

```powershell
npm.cmd run test:run -- src/ui/GameSheet.test.tsx src/ui/BottomNav.test.tsx src/features/home/WorldHomeScene.test.tsx src/features/companion/CompanionRoomScene.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the surface-system pass**

```powershell
git add src/styles.css src/ui/GameSheet.tsx src/ui/GameSheet.test.tsx
git commit -m "style: unify Foodex game surfaces"
```

---

### Task 8: Full Automated Verification

**Files:**
- Create: `art-overhaul-report.md`
- Modify: none unless tests reveal regressions.

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: recorded evidence for tests, build, asset sizes, and unresolved issues.

- [ ] **Step 1: Pull the exact branch and confirm a clean tree**

```powershell
git status
git branch --show-current
```

Expected:

```text
On branch agent/foodex-world-home-room
nothing to commit, working tree clean
```

- [ ] **Step 2: Run the focused art-overhaul tests**

```powershell
npm.cmd run test:run -- src/ui/sceneAssets.test.ts src/ui/companion/HeroCompanion.test.tsx src/features/home/WorldHomeScene.test.tsx src/features/companion/CompanionRoomScene.test.tsx src/features/companion/CompanionScreen.test.tsx src/ui/GameSheet.test.tsx src/App.test.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 3: Run the complete Vitest suite**

```powershell
npm.cmd run test:run
```

Expected: every test PASS; record the exact test-file and test counts.

- [ ] **Step 4: Run TypeScript and production build**

```powershell
npm.cmd run build
```

Expected: `tsc -b && vite build` completes with exit code 0 and produces `dist/`.

- [ ] **Step 5: Verify production assets are copied into dist**

```powershell
Get-Item dist/art/world/world-home-play-city.webp,
  dist/art/room/buddy-fantasy-room.webp,
  dist/art/characters/foodi.png,
  dist/art/characters/berry.png,
  dist/art/characters/noodle.png,
  dist/art/characters/cocoa.png |
  Select-Object FullName, Length
```

Expected: all six files exist and have nonzero lengths.

- [ ] **Step 6: Write the automated-verification section of the report**

```markdown
# Foodex Art Overhaul Verification Report

## Automated verification
- Focused tests: PASS — ... tests
- Full Vitest: PASS — ... test files / ... tests
- Production build: PASS
- Dist assets: PASS — six production files present

## Asset sizes
| Asset | Bytes |
|---|---:|
| ... | ... |
```

- [ ] **Step 7: Commit the report**

```powershell
git add art-overhaul-report.md
git commit -m "docs: record Foodex art overhaul verification"
```

---

### Task 9: Mobile Visual Verification and Vercel Preview

**Files:**
- Modify: `art-overhaul-report.md`
- Modify: implementation files only for defects reproduced during this task.

**Interfaces:**
- Consumes: successful production build from Task 8.
- Produces: viewport screenshots/checklist and successful Vercel Preview status.

- [ ] **Step 1: Start the production preview locally**

```powershell
npm.cmd run preview -- --host 0.0.0.0
```

Open the printed local URL in Chrome or Edge DevTools.

- [ ] **Step 2: Check the required viewports**

Verify each viewport separately:

```text
320 × 568
390 × 844
430 × 932
Desktop browser with a centered 390px-wide app viewport
```

For every viewport, check:

```text
[ ] upper-left HUD readable and not over detailed art
[ ] upper-right coin control visible and clickable
[ ] mascot fully visible above bottom navigation
[ ] home hotspots align with the intended landmarks
[ ] no control is smaller than 52px
[ ] bottom navigation does not cover actions
[ ] buddy right-side controls remain visible
[ ] growth/shop/wardrobe panel header remains fixed
[ ] only panel content scrolls
[ ] scrolling upward does not distort or expose the room layout
[ ] no horizontal scrolling
```

- [ ] **Step 3: Check reduced motion**

In DevTools Rendering, enable `Emulate CSS media feature prefers-reduced-motion: reduce`.

Expected:
- continuous mascot bob/sleep animations stop;
- controls remain usable;
- no information disappears;
- static character art remains visible.

- [ ] **Step 4: Check keyboard and pointer behavior**

Using Tab/Shift+Tab and pointer input:

```text
[ ] focus ring remains visible on HUD and room controls
[ ] decorative art never intercepts clicks
[ ] coin sheet opens
[ ] “꾸미기 상점” navigates to Buddy and opens the shop
[ ] Escape closes modal/dialog surfaces
[ ] focus returns to the opener when a shared GameSheet closes
```

- [ ] **Step 5: Fix only reproduced defects and rerun the smallest relevant test**

For every defect:

```text
1. Record viewport and reproduction steps in the report.
2. Add or update a focused regression test where behavior is testable.
3. Make the minimum CSS/component correction.
4. Run the focused test.
5. Recheck the same viewport.
6. Commit the correction separately.
```

- [ ] **Step 6: Push the verified branch**

```powershell
git push origin agent/foodex-world-home-room
```

- [ ] **Step 7: Verify the Vercel Preview**

Wait until the GitHub/Vercel status for the pushed head commit is `success`. Open the Preview and repeat the `390 × 844` checks for:

```text
home scene
coin sheet
coin sheet → 꾸미기 상점
buddy room
growth mirror panel scrolling
shop panel
character switching
```

- [ ] **Step 8: Finish the report with exact evidence**

```markdown
## Visual verification
- 320×568: PASS
- 390×844: PASS
- 430×932: PASS
- Desktop centered mobile viewport: PASS
- Reduced motion: PASS
- Keyboard focus: PASS

## Deployment
- Branch: `agent/foodex-world-home-room`
- Head commit: `<exact SHA>`
- Vercel Preview: PASS
```

- [ ] **Step 9: Commit and push the final report**

```powershell
git add art-overhaul-report.md
git commit -m "docs: complete Foodex art overhaul review"
git push
```

---

## Self-Review Results

- **Spec coverage:** Asset registry, two scenes, four mascots, six reactions, HUD/panels, accessibility, safe areas, reduced motion, performance, automated tests, mobile viewports, and Vercel are each assigned to a task.
- **Scope:** The plan changes presentation assets and scene/UI composition only; gameplay, persistence, Supabase, and navigation contracts remain out of scope.
- **Type consistency:** The plan retains `SceneAssetKey`, `SCENE_ASSETS`, `getCompanionArt`, `CompanionCharacterId`, and existing scene callbacks. The proposed `CompanionReaction` is introduced in Task 6 with an explicit legacy mapping path.
- **No placeholders:** Exact paths, commands, test examples, asset requirements, commit boundaries, and completion evidence are provided. Runtime-generated values such as byte counts and commit SHA are intentionally recorded from real command output rather than invented.
