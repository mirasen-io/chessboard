## 1. checkSquare convenience prop

- [x] 1.1 Add `SquareString` to the imports in `src/types.ts` and add `checkSquare?: SquareString | null` to `ChessboardProps`; verify `tsc --noEmit` passes
- [x] 1.2 Add `checkSquare` to the destructured props in `src/Chessboard.tsx` and add a `useEffect` that assigns `boardRef.current.extensions.check.square = checkSquare ?? null` with `[checkSquare]` dependency, mirroring the `autoPromoteToQueen` effect; verify `tsc --noEmit` passes
- [x] 1.3 Add `check` to the `mockBoard.extensions` object in `tests/Chessboard.test.tsx` (with `square: null`) and write tests: (a) `checkSquare` prop sets `extensions.check.square`, (b) `checkSquare={null}` sets it to `null`, (c) same value on re-render does not re-assign; verify `npm test` passes

## 2. ChessboardHandle and forwardRef

- [x] 2.1 Add `ChessboardHandle` type alias to `src/types.ts` as `CoreChessboard` (imported from `@mirasen/chessboard`); verify `tsc --noEmit` passes
- [x] 2.2 Wrap `Chessboard` with `forwardRef<ChessboardHandle, ChessboardProps>` in `src/Chessboard.tsx`; add `useImperativeHandle(ref, () => boardRef.current!, [])` inside the component (after board creation effect); verify the component still renders and `tsc --noEmit` passes
- [x] 2.3 Write tests in `tests/Chessboard.test.tsx`: (a) ref is `null` before mount, (b) `ref.current` equals the mock board instance after mount, (c) `ref.current` is `null` after unmount; verify `npm test` passes

## 3. Exports

- [x] 3.1 Export `ChessboardHandle` from `src/index.ts` alongside the existing type exports; verify `tsc --noEmit` passes and `publint` reports no issues (`npm run build`)
- [x] 3.2 Add `SquareString` to the re-export block in `src/index.ts` (currently missing); verify `tsc --noEmit` passes and `SquareString` is importable from `@mirasen/react-chessboard` after `npm run build`

## 4. Final verification

- [x] 4.1 Bump the `@mirasen/chessboard` peer dependency lower bound in `package.json` from `^1.1.3` to `^1.4.0` (the version that introduces the `check` extension); verify `npm run build` passes
- [x] 4.2 Run `npm test` and confirm all tests pass including new ones from tasks 1.3 and 2.3
- [x] 4.3 Run `npm run build` and confirm the build succeeds with no type errors and no `publint` warnings
