# Task 7 report — accessible shared bottom sheet

## Changed files

- `src/ui/GameSheet.tsx`
- `src/ui/GameSheet.test.tsx`

## Behavior

- Uses native `<dialog>` modal behavior, with a named heading and title-specific close control.
- Focuses the close control when opened.
- Forwards the native `cancel` event (including Escape in supporting browsers) to `onClose`.
- Removes the dialog from the accessibility tree when closed.

## TDD evidence

- Initial focused run failed as expected because `GameSheet` did not exist.
- Final focused run: `4/4` tests passed.

## Build

`npm.cmd run build` remains blocked only by the known Task 6 → Task 10 integration boundary in `src/App.tsx`: the existing `HomeScreen` call does not yet provide `onOpenLevel` and `onOpenCoins`. No additional Task 7 build error was reported.
