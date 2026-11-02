## Context

`Chessboard` currently syncs a small set of named props to the core board via individual `useEffect` hooks. The core `@mirasen/chessboard` package exposes a fully-typed `Chessboard` surface (extensions map + runtime methods) but the React wrapper has no mechanism to pass that surface to consumers. Every new extension property that should be user-controllable today requires a new wrapper prop, a new effect, and a new release.

The core package symlinked via `node_modules/@mirasen/chessboard` already includes the `check` extension (with `CheckPublic = { square: SquareString | null }`) in its `DefaultBuiltinChessboardExtensions`.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Expose the complete core board instance via `forwardRef` / `useImperativeHandle` so future extensions need zero wrapper changes
- Add `checkSquare` as a thin convenience prop following the established `autoPromoteToQueen` pattern
- Export `ChessboardHandle` type so consumers can type their refs
- Zero breaking changes to existing props or their semantics

**Non-Goals:**

- Deprecating or removing any existing prop (`position`, `externalMove`, `autoPromoteToQueen`, etc.)
- Generic `extensions` object prop — explored and rejected (see Decisions)
- Exposing any core-internal or unstable surface beyond the public `Chessboard` type
- Changing the `position` / `externalMove` id-based request model

## Decisions

### D1: `ChessboardHandle` shape = the core `Chessboard` public surface

`useImperativeHandle` returns `boardRef.current` directly (the `CoreChessboard` instance). `ChessboardHandle` is typed as an alias for `CoreChessboard` (with default extension type params).

**Alternative considered: nested `{ board: CoreChessboard }`**  
A wrapper object would reserve space for future React-specific handle fields. Rejected: idiomatic React refs expose a flat API (`videoRef.current.play()`), and no React-specific fields are planned. A wrapper adds verbosity (`ref.current.board.extensions.*`) for no current benefit.

**Alternative considered: generic `extensions` prop object**  
A nested `extensions={{ check: { square } }}` prop keeps everything declarative. Rejected: non-idiomatic for React (no precedent in mainstream wrapper libs), can only cover settable values (not methods or getters), introduces unclear reset semantics (omit ≠ null), and the ref already covers the full superset with better ergonomics.

### D2: `checkSquare` is a thin convenience prop, not the primary mechanism

`checkSquare` is implemented identically to `autoPromoteToQueen`: a prop in `ChessboardProps` + a `useEffect` that assigns `board.extensions.check.square`. Its purpose is ergonomic — common declarative state without needing a ref — not structural.

**Rule for adding future convenience props**: only if the setting is (a) frequently needed by most consumers, (b) a pure settable value (not a method/getter), and (c) clearly maps to `null`/reset semantics. Everything else is accessible via ref by default.

### D3: Last-writer-wins when both prop and ref target the same field

No coordination mechanism between the `checkSquare` effect and a direct `ref.current.extensions.check.square` write. The last write wins. The `checkSquare` effect re-applies on re-render only if the prop value changed (React dep array). Documented as a usage rule: choose one channel per setting; do not mix prop and ref for the same extension property.

### D4: `position` / `externalMove` id-based model is preserved unchanged

Explored removing `position.id` since core `setPosition` is internally idempotent (`positionsEqual` guard + `changed = false` short-circuits the entire mutation pipeline). The id remains because it is the only mechanism for a declarative force-resync when the board has drifted from the prop via user interaction (prop string unchanged, board state moved on). `externalMove.id` remains because `board.move` is non-idempotent — dedup is correct-by-design there, and moving it to ref would require consumers to hold a ref in their state/store.

## Risks / Trade-offs

**[Risk] Consumers forwarding the DOM element ref today will silently receive a handle object instead**  
→ No documented or supported use of `ref` on `<Chessboard>` existed. Impact expected to be zero. Noted as a breaking change in the proposal for completeness.

**[Risk] Last-writer-wins between prop and ref is a footgun if a consumer mixes both channels**  
→ Documented in the README. No runtime guard added — adding one would require storing which channel "owns" each field, which is complexity for a misuse scenario.

**[Risk] `ChessboardHandle` type is tied to the core `Chessboard` default-extensions type; future non-default extensions added by consumers are not reflected**  
→ Acceptable: the handle exposes the default built-in surface. Power users who customise extensions already use the core directly (documented advanced path).

## Migration Plan

Additive change — no migration required. Existing consumers: no changes needed. New capability is opt-in via `ref`.

`checkSquare` prop: available immediately after upgrading `@mirasen/react-chessboard` to the version that includes this change, provided `@mirasen/chessboard` is at a version that includes the `check` extension.
