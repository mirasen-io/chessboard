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

The portable board demo lives in `src/chessboard-example/`; browser specifications and
their committed visual baselines live in `tests/e2e/`. From this directory, install
dependencies and the Chromium browser once, then run the suite:

```sh
npm ci
npm run test:e2e:install
npm run test:e2e
```

Visual baselines use the fixed Chromium viewport configured in
`playwright.config.ts`. Update them deliberately after reviewing the rendered change:

```sh
npm run test:e2e:update
```

On failure, inspect `test-results/` for screenshots and traces, and open
`playwright-report/index.html` for the report. The GitHub Actions `browser-tests` job
runs this suite alongside the SvelteKit browser tests.
