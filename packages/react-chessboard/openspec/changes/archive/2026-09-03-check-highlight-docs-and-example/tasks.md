## 1. Type update

- [x] 1.1 In `src/types.ts`, change `checkSquare?: SquareString | null` to `checkSquare?: SquareString | ColorInput | null`. Verify: `tsc --noEmit` passes with no type errors.

## 2. Example simplification

- [x] 2.1 In `examples/app/src/App.tsx`, remove the `getCheckSquare` helper function and the `checkSquare` state variable. Replace all three `setCheckSquare(getCheckSquare(chess))` / `setCheckSquare(null)` call sites with inline expressions: pass `chess.isCheck() ? (chess.turn() as ColorInput) : null` directly as the `checkSquare` prop (or keep minimal derived state — either way, no board scan). Verify: the example app still compiles and correctly shows the red glow when the king is in check.

## 3. README update

- [x] 3.1 Update the `### checkSquare` section in `README.md` to document the `ColorInput` shorthand form. Show both usage patterns: explicit square string and `chess.turn()` color shorthand. Verify: `checkSquare` section accurately reflects the new `SquareString | ColorInput | null` type and the code snippet uses `chess.turn()`.

## 4. Verification

- [x] 4.1 Run `npm test` (or the project's test command) and confirm all tests pass. Verify: zero test failures.
- [x] 4.2 Run the example app (`examples/app`) and play through a game until a check occurs. Confirm the red highlight appears on the king's square and clears on the next move. Verify: visual confirmation in the browser.
