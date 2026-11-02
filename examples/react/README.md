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
