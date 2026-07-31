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

## Review fix

- Kept the dialog mounted while closed, so the `open: true → false` transition can invoke native `close()` before the sheet is hidden from assistive technology.
- Captures the focused opener on open and restores it after close.
- Added a rerender transition test that asserts both native close invocation and focus restoration. The focused suite now passes `5/5` tests.
