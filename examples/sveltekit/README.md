# Chessboard manual examples

SvelteKit 3 example for manually checking this repository's chessboard library.
Requires Node 22.17 or newer and npm. The library dependency is
`file:../../packages/chessboard` and resolves its public exports from the package's
`dist/` directory.

Run from the repository root:

```sh
npm ci
npm run build
npm ci --prefix examples/sveltekit
npm --prefix examples/sveltekit run dev
```

Use the URL Vite reports. Rebuild the workspace packages after changing their source;
restart the example server if linked output or dependencies appear stale.

## Manual routes

The home page lists all examples; navigation links to them in numeric order.

| URL                  | Manual check                                                                        |
| -------------------- | ----------------------------------------------------------------------------------- |
| `/0-debug`           | Runtime snapshots, orientation, free moves, annotation buttons/modifiers and colors |
| `/1-free`            | Minimal free movement, reset and selection                                          |
| `/2-custom-ext-list` | Explicit extension list and basic controls                                          |
| `/3-setOnUIMove`     | UI move callbacks and polled snapshots                                              |
| `/4-setMovability`   | Strict destinations and polled snapshots                                            |
| `/5-promotion`       | Promotion chooser and auto-queen toggle                                             |
| `/6-chessjs`         | Legal moves, delayed computer reply, check/status and reset                         |

Start with Debug. After moving pieces, try orientation, reset and annotations.
Navigate away and back to check clean remounting; on Chess.js, try resetting or
leaving while the computer reply is pending. Old SvelteKit demo routes are omitted.

## Portable files

Copy `src/lib/chessboard-examples/` for later migrations or embedding. It contains
seven page components, lifecycle/move helpers, a link list, `Navigation.svelte`, and
`chessboard-examples.css`. The route files only mount the corresponding components.

Import the stylesheet and render components inside a `.chessboard-examples` wrapper.
Keep Tailwind setup in the host application (`src/routes/layout.css` here). Pass
host-resolved links and the active pathname into `Navigation`; it has no Kit imports.
The root layout demonstrates the integration. Styles target only the example wrapper.

## Validation and browser tests

```sh
npm --prefix examples/sveltekit run format
npm --prefix examples/sveltekit run lint
npm --prefix examples/sveltekit run check
npm --prefix examples/sveltekit run build
npm --prefix examples/sveltekit run preview
```

Playwright browser interaction specifications live in `tests/e2e/`. They check route
rendering, board state, moves, controls, and interaction cleanup without committed
screenshot baselines or pixel comparisons. After installing the example dependencies,
install Chromium once and run the suite with:

```sh
npm ci --prefix examples/sveltekit
npm --prefix examples/sveltekit run test:e2e:install
npm --prefix examples/sveltekit run test:e2e
```

Failures retain temporary diagnostic traces and screenshots under `test-results/`; use
`playwright-report/index.html` for the HTML report. These screenshots help debug failed
interactions and are not committed baselines or pixel-based assertions. GitHub Actions
runs both app suites in its single `browser-tests` job. Core package coverage and
SonarCloud reporting remain based on the existing Vitest LCOV reports; browser tests do
not contribute coverage.

For a brief interactive browser check from the repository root, use
`examples/sveltekit/node_modules/.bin/playwright-cli --help` and the root Playwright
skill. Example-local `AGENTS.md`, `CLAUDE.md`, Playwright skills and Claude Svelte
plugin settings are also available when opening this directory as a separate project.
Svelte code-writer/best-practices skills live in `.github/skills/` with Codex discovery
links in `.agents/skills/`.
Use named sessions and close the browser/server you start when done.

Adapter-auto is retained; no deployment target is configured for this local example.
