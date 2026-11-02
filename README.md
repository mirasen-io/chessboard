# mirasen chessboard

This repository contains the mirasen chessboard packages in an npm workspaces monorepo. Each package keeps its own version and release history.

## Packages

- [`@mirasen/chessboard`](./packages/chessboard) is the framework-agnostic TypeScript chessboard runtime, with built-in interaction, animation, extensions and chess.js adapters.
- [`@mirasen/react-chessboard`](./packages/react-chessboard) is the React component wrapper around the chessboard runtime.

The React package will be added from its separately prepared Git history as a later owner-performed integration step.

## Development

The repository uses npm workspaces. Run orchestration, linting, formatting and Changesets commands from the repository root. Package build and test tools remain declared by their respective package manifests.

The workspace build scripts build `@mirasen/chessboard` before `@mirasen/react-chessboard`, because the React package resolves the core package through its published exports.

See [the migration plan](./docs/plan-migrate-monorepo.md) and [contribution guide](./CONTRIBUTING.md) for repository workflows.
