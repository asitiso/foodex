# Foodex Art Overhaul Design

## Goal

Unify Foodex as a bright kids-animation food-spirit RPG without changing its navigation, persistence, progression rules, or existing gameplay contracts.

The first implementation package replaces the home world background, buddy room background, four mascot assets, shared reaction visuals, and surface styling as one coherent visual system.

## Approved Direction

**Kids animation play city + food-spirit RPG**

Foodex should feel like a playful world where children record meals with friendly food companions rather than a conventional tracking app.

## Scope

### Included

- Replace the outdoor home with a high-saturation food-themed play city.
- Replace the buddy room with a warm fantasy kids room.
- Redesign Foodi, Berry, Noodle, and Cocoa with large heads, large expressive eyes, compact bodies, short limbs, clear silhouettes, and strong facial expressions.
- Standardize six shared reactions: idle smile, jump, surprise, sleepy, satisfied, sparkle discovery.
- Retune HUD, sheets, buttons, shadows, focus states, and press feedback to match the new art.
- Preserve 16px minimum body text, 52px minimum touch targets, safe-area support, responsive layout, and reduced-motion support.
- Keep the existing coin, level, meal, collection, adventure, buddy, wardrobe, growth, and shop behavior.

### Excluded

- New gameplay systems.
- New top-level navigation destinations.
- Database or Supabase schema changes.
- Human player avatars.
- Dozens of costume variants.
- Per-screen 3D rendering.
- Weather or time-dependent scene variants.
- Independent animation for every decorative prop.

## Visual System

### Palette

- Sky blue: `#2397F3`
- Bright yellow: `#FFD94A`
- Pink: `#FF6FAE`
- Purple: `#7350DF`
- Mint: `#80D9C2`
- Coral: `#FF7A65`
- Cream: `#FFF5D8`
- Dark outline: `#4A2E67`

Purple and gold remain the main interaction colors. Blue and pink expand the environment and character palette.

### Shape and Rendering Rules

- Rounded silhouettes and softened corners.
- High saturation with clear light-dark separation.
- Large highlights and minimal muddy shadows.
- Dark purple or warm brown outlines rather than pure black.
- Cream UI surfaces over visually rich backgrounds.
- Decorative stars, balloons, clouds, hearts, and confetti used sparingly around primary actions.

## Home World Design

### Layering

1. **Background:** blue sky, cotton-candy clouds, balloons, rainbow, distant food-shaped buildings.
2. **Midground:** strawberry collection house, adventure castle, buddy house, camera-shaped meal-record landmark.
3. **Foreground:** central companion stage, patterned path, flowers, sweets, shadows, and small sparkles.

### Interaction Mapping

- Collection: book sign or strawberry-house entrance.
- Adventure: castle gate.
- Buddy: buddy-house entrance.
- Meal record: central camera orb or landmark.
- Coins: existing top-right coin control.

Existing click handlers and navigation contracts remain unchanged. Visual assets and hit-area placement may change, but every target remains at least 52px.

### Safe Areas

- Reserve the upper-left region for level/card/meal HUD.
- Reserve the upper-right region for coins.
- Keep the central lower area clear for the active companion.
- Keep bottom controls clear of the fixed navigation bar and device safe area.

## Buddy Room Design

### Environment

- Warm fantasy kids room with rounded window, bright curtains, toy shelves, star lights, soft rug, plush furniture, gift boxes, and character decorations.
- The room remains a single scene; feature panels open over it rather than becoming separate routes.

### Prop Mapping

- Wardrobe: physical wardrobe door.
- Growth: glowing mirror.
- Shop: gift display or toy shop cabinet.
- Journal: bookshelf.
- Report: calendar or medal board.

The existing right-side vertical controls remain during the first package. Prop-first interaction can be added later only if it clearly improves discoverability.

### Panel Behavior

- Room panel shell remains fixed.
- Header and close control remain visible.
- Only panel content scrolls.
- Scroll chaining to the page is blocked.
- Opening the shop from the home coin sheet navigates to Buddy and opens the shop panel directly.

## Character Design

### Foodi

- Bright yellow lead mascot.
- Simple, friendly silhouette.
- Red scarf retained as a strong identity cue.
- Energetic and encouraging expressions.

### Berry

- Strawberry-pink fairy mascot.
- Green leaf crown and small flower accent.
- Best suited to bounce, spin, and sparkle reactions.

### Noodle

- Orange-yellow noodle spirit.
- Flexible noodle strands create readable motion.
- Mischievous and energetic expressions.

### Cocoa

- Cocoa-brown cup mascot with cream highlights.
- Warm, calm, and comforting personality.
- Best suited to sleepy and satisfied reactions.

### Asset Contract

Each mascot provides one transparent production asset sized for the existing `background-image` character component. Shared CSS transforms handle the six reactions in phase one. Separate frame-by-frame sprites are not required.

Recommended production paths:

- `public/art/characters/foodi.png`
- `public/art/characters/berry.png`
- `public/art/characters/noodle.png`
- `public/art/characters/cocoa.png`
- `public/art/world/world-home-play-city.webp`
- `public/art/room/buddy-fantasy-room.webp`

## Architecture

### Asset Registry

`src/ui/sceneAssets.ts` remains the single public mapping from scene and character IDs to files. Components must not hard-code production asset paths.

### Components

- `WorldHomeScene`: maintains current behavior and receives only new scene art and style adjustments.
- `CompanionRoomScene`: maintains current panel and interaction contracts.
- `HeroCompanion`: remains the shared companion renderer for home and buddy scenes.
- `GameSheet`: remains the shared fixed-shell, internal-scroll panel.

No persistence or domain module changes are required.

## Error and Fallback Behavior

- Scene backgrounds fall back to the cream game background if an image fails.
- Character assets retain a readable fallback class or hidden text label for accessibility.
- The app remains usable while assets load; no blocking splash screen is added.
- Decorative effects never intercept pointer input.

## Performance Requirements

- Prefer WebP for full-screen backgrounds.
- Keep each scene background below approximately 700 KB after optimization where visual quality permits.
- Keep each transparent character image below approximately 350 KB.
- Avoid adding JavaScript animation libraries.
- Reuse current CSS animation classes and disable nonessential motion under reduced-motion settings.

## Testing

### Contract Tests

- Scene registry resolves all six production assets.
- Home and buddy scenes render the expected asset variables.
- All four character IDs render the corresponding art.
- Existing click handlers still invoke collection, adventure, buddy, meal, coin, wardrobe, growth, and shop actions.
- Six reaction classes remain available and reduced-motion behavior suppresses continuous animation.

### Visual Verification

Test at minimum:

- 320 × 568
- 390 × 844
- 430 × 932
- Desktop centered mobile viewport

Check HUD contrast, touch target size, safe areas, central character visibility, room panel scrolling, and bottom-navigation overlap.

### Completion Gate

- Focused tests pass.
- Full Vitest suite passes.
- TypeScript and production build pass.
- Vercel Preview succeeds.
- Mobile screenshots show no clipped background, hidden controls, scroll-chain layout breakage, or unreadable HUD.

## Implementation Order

1. Define final asset names and registry tests.
2. Produce and optimize clean home and room backgrounds without embedded text, HUD, or characters.
3. Produce and optimize four transparent mascot assets.
4. Replace registry mappings.
5. Retune home and buddy scene composition.
6. Normalize six reaction styles.
7. Retune HUD, panel, focus, and press styling.
8. Run focused and full verification.
9. Inspect Vercel Preview on mobile sizes.

## Success Criteria

The redesign succeeds when the home, buddy room, characters, and UI clearly look like one world while all existing Foodex behavior remains intact. The user should perceive a major visual upgrade without needing to relearn the app.