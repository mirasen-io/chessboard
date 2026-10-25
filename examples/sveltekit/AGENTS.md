## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Framework**: SvelteKit 3, Svelte 5, adapter-auto
- **Tooling**: prettier, eslint, vitest, playwright/CLI, tailwindcss (forms/typography)
- **Purpose**: manual chessboard checks; no automated example test suite

These instructions apply inside this example alongside the repository's root instructions.
Run the commands below from `examples/sveltekit`; from the repository root, use
`npm --prefix examples/sveltekit run <script>`. The chessboard dependency is `file:../..`:
build the root library with `npm run build` from the repository root before checking
or building the example. Preserve root architectural contracts and user edits.

## Local skills and integrations

- `.github/skills/svelte-code-writer/SKILL.md`: Svelte documentation lookup and autofixer
  workflow. Also linked under `.agents/skills/` for Codex discovery.
- `.github/skills/svelte-core-bestpractices/SKILL.md`: modern Svelte practices and reference
  documents. Also linked under `.agents/skills/` for Codex discovery.
- `.agents/skills/playwright-cli/SKILL.md` and `.claude/skills/playwright-cli/SKILL.md`:
  local browser CLI guidance. Prefer the project-local executable specified below.
- `.claude/settings.json` enables the Svelte plugin; `.vscode/mcp.json` provides the
  existing Svelte MCP connection. Prefer connected MCP tools over CLI downloads.
- Generated skill copies remain verbatim. For Kit 3, configuration lives in
  `vite.config.ts`; follow current official documentation if a copied reference uses
  the older `svelte.config.js` layout.

## Validation Workflow

- Run `npm run format` after code or configuration changes. Preserve generated skills and existing specification archives using the repository's formatting exclusions.
- Run `npm run lint`, `npm run check`, and `npm run build` after a coherent block of work or a dependency/configuration change, not after every small edit.
- Vitest unit/component and Playwright are configured for future use. There are no automated example tests; do not create or require them unless requested. The root library has its own existing tests and validation.
- Use manual browser sanity checks for this example. Prioritize `/0-debug`, basic controls and navigation; keep visual verification brief unless the task explicitly requires broader review.
- In the final response, briefly report formatting and the checks actually run, including any unavailable checks.

## Browser Verification

Browser checks are for verifying a meaningful visual state, not part of the routine edit loop.

- Use the project's own CLI: `./node_modules/.bin/playwright-cli`, not a global install. Check `--help` instead of guessing commands. If the dependency is not installed, say so; do not install it silently or change `package.json` for verification.
- Start `npm run dev` in the background, wait for the URL Vite reports, and use that URL. Do not run `npm run build` just to look at a page. Stop the server you started when done, and never leave duplicate servers on different ports.
- Restart the dev server when routing, layout, assets, config, dependencies, or generated files changed, HMR fails, or the output looks stale. Always perform a fresh restart before final visual verification, then reload the target routes.
- Keep it token-efficient:
  - Do not take screenshots after routine edits.
  - Prefer `playwright-cli find` to locate nodes in a large page.
  - Prefer snapshots of an element or selector over full-page snapshots, and limit snapshot depth.
  - Use `--raw` when only the value is needed.
  - Read saved snapshot files only when their content is needed.
- A browser skill provides usage guidance; verify that its executable is actually available. If browser tooling cannot be used, report visual verification as unavailable and avoid claims that depend on it.
- Use named browser sessions and close only the sessions you started.
- Keep CLI output (`.playwright-cli/`, screenshots) temporary and untracked; remove routine output when finished. Retain requested migration comparison evidence only under ignored `artifacts/`.

### Visual sanity checks

- Inspect the rendered example at a representative desktop and narrow width when visuals
  change. Prioritize Debug, board mounting, controls, navigation and obvious overflow.
- Use a small number of meaningful screenshots; DOM snapshots do not replace visual inspection.
- Keep checks proportional to the task. Do not run exhaustive route/state/viewport matrices
  or pixel comparisons unless requested. Preserve the numbered examples and portable
  components/helpers/CSS under `src/lib/chessboard-examples/`.
- Fix meaningful regressions with targeted edits, then recheck the affected state.
- Report the routes/states actually checked and any remaining limitations.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
Only generate a Playground link if requested for code that was not written into this project.
