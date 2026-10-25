# Chessboard manual examples

SvelteKit 3 example for manually checking this repository's chessboard library.
Requires Node 22.17 or newer and npm. The library dependency is `file:../..` and
resolves its public exports from the root `dist/` directory.

Run from the repository root:

```sh
npm ci
npm run build
npm ci --prefix examples/sveltekit
npm --prefix examples/sveltekit run dev
```

Use the URL Vite reports. Rebuild the root library after changing its source;
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

## Validation and optional tooling

```sh
npm --prefix examples/sveltekit run format
npm --prefix examples/sveltekit run lint
npm --prefix examples/sveltekit run check
npm --prefix examples/sveltekit run build
npm --prefix examples/sveltekit run preview
```

Vitest unit/component tooling, Playwright, local `@playwright/cli` and Tailwind with
forms/typography are installed and configured for future use. There are intentionally
no automated example tests. The `test:*` scripts are reserved for future suites;
no-tests results are expected until tests are added. `test:e2e` also downloads browsers.
The root library's automated tests are independent and remain unchanged.

For a brief interactive browser check from the repository root, use
`examples/sveltekit/node_modules/.bin/playwright-cli --help` and the root Playwright
skill. Example-local `AGENTS.md`, `CLAUDE.md`, Playwright skills and Claude Svelte
plugin settings are also available when opening this directory as a separate project.
Use named sessions and close the browser/server you start when done.

Adapter-auto is retained; no deployment target is configured for this local example.
