# Task 8 report — warm companion room scene

## Changed files

- `src/features/companion/CompanionRoomScene.tsx`
- `src/features/companion/CompanionRoomScene.test.tsx`

## Behavior

- Adds a warm room scene using the separate companion-room artwork layer.
- Renders the selected companion, its optional evolution stage, and the current coin balance.
- Provides three named, keyboard-accessible location controls for wardrobe, growth, and shop panels.
- Uses the shared accessible `GameSheet`; only the selected panel's child content is mounted and closing it requests `null`.

## TDD evidence

- Initial focused run failed as expected because `CompanionRoomScene` did not exist.
- Final room suite: `3/3` tests passed.
- Related focused suites: `16/16` tests passed across `CompanionRoomScene`, `HeroCompanion`, and `GameSheet`.

## Build

`npm.cmd run build` remains blocked only by the known Task 6 → Task 10 integration boundary in `src/App.tsx`: the existing `HomeScreen` call does not yet provide `onOpenLevel` and `onOpenCoins`. No Task 8 TypeScript or Vite error was reported.
