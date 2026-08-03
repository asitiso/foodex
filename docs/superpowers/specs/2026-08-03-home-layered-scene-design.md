# Foodex Home Layered Scene Design

- Date: 2026-08-03
- Branch: `agent/foodex-reference-home`

## Goal

Refactor the Foodex home screen into a layered scene system so background, landmarks, character, effects, and UI decoration can be replaced independently without rewriting the existing screen behavior.

## Scope

- Home screen only
- Preserve existing navigation and live data
- Prepare `src/assets/home/` for later image replacement
- Keep real text and controls in HTML
- Respect reduced-motion preferences

## Architecture

`HomeScreen` continues to map application state into `WorldHomeScene`. `WorldHomeScene` becomes the scene compositor and renders focused layers:

1. Background: sky, distant clouds, ground/plaza
2. Landmarks: collection house, record building, adventure castle, buddy house
3. Character: companion and optional shadow
4. Effects: sparkle, glow, confetti
5. Interaction: HUD, hotspots, record orb, menu dock

Visual assets are decorative. Semantic buttons retain all click handling and accessibility behavior.

## Asset structure

```text
src/assets/home/
├─ backgrounds/
├─ landmarks/
├─ characters/
├─ effects/
└─ ui/
```

Assets should use transparent PNG/WebP where appropriate. Filenames describe their role. Missing decorative assets must not prevent controls from rendering.

## Layout

Use a single portrait-first positioned stage with explicit z-index layers. Landmark sizes and positions are controlled by CSS custom properties such as `--home-collection-left`, `--home-castle-width`, and `--home-character-bottom`. Element sizes use `clamp()` and percentage positioning to remain usable on common mobile widths.

## Interaction

Existing behavior remains unchanged:

- Collection hotspot opens collection
- Record orb opens record flow
- Adventure hotspot opens adventure
- Buddy hotspot opens companion
- HUD actions continue opening their existing destinations

## Motion

Use lightweight CSS animation only: subtle companion float, record-orb pulse, and ambient effects. Disable or simplify motion when `reducedMotion` is enabled.

## Testing

- Render the home scene without crashing
- Verify visible layer containers and key controls
- Verify record, collection, adventure, and companion callbacks
- Verify reduced-motion class/state
- Run `npm run test:run`
- Run `npm run build`

## Non-goals

- No new gameplay systems
- No redesign of other screens
- No animation library
- No remote asset pipeline
- No text baked into images
