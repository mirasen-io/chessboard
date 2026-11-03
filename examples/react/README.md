# Example App

Minimal Vite React app to smoke-test `@mirasen/react-chessboard` with chess.js.

## Run

```bash
cd examples/react
npm install
npm run dev
```

The example is a standalone project; install its dependencies from its own directory.

## What it does

- Renders a chessboard using `@mirasen/react-chessboard`
- Uses chess.js for legal move validation
- Demonstrates id-based position requests
- Shows flip, reset, and auto-promote controls

## Browser tests

The portable board demo lives in `src/chessboard-example/`; browser interaction
specifications live in `tests/e2e/`. The tests check behavior such as board state,
moves, controls, and interaction cleanup. They do not use committed screenshot
baselines or pixel comparisons. From this directory, install dependencies and the
Chromium browser once, then run the suite:

```sh
npm ci
npm run test:e2e:install
npm run test:e2e
```

On failure, inspect `test-results/` for temporary diagnostic screenshots and traces, and open
`playwright-report/index.html` for the report. The GitHub Actions `browser-tests` job
runs this suite alongside the SvelteKit browser tests. Failure screenshots are for
debugging only; they are not committed baselines or test assertions.
