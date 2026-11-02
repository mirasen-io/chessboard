# mirasen chessboard

The mirasen chessboard monorepo provides a framework-agnostic chessboard runtime and a React component built on that runtime. The packages are independently versioned and published to npm.

## `@mirasen/chessboard`

[![npm version](https://img.shields.io/npm/v/%40mirasen%2Fchessboard)](https://www.npmjs.com/package/@mirasen/chessboard)
[![CI](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![License](https://img.shields.io/npm/l/%40mirasen%2Fchessboard)](https://www.npmjs.com/package/@mirasen/chessboard)

Framework-agnostic TypeScript chessboard runtime with built-in interaction, rendering, animation, extensions, and chess.js adapters.

- [npm package](https://www.npmjs.com/package/@mirasen/chessboard)
- [Package README and usage guide](./packages/chessboard/README.md)
- [Core documentation](./packages/chessboard/documentation.md)

## `@mirasen/react-chessboard`

[![npm version](https://img.shields.io/npm/v/%40mirasen%2Freact-chessboard)](https://www.npmjs.com/package/@mirasen/react-chessboard)
[![CI](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![License](https://img.shields.io/npm/l/%40mirasen%2Freact-chessboard)](https://www.npmjs.com/package/@mirasen/react-chessboard)

React component wrapper with built-in board interaction, promotion, animation, and chess.js integration.

- [npm package](https://www.npmjs.com/package/@mirasen/react-chessboard)
- [Package README and usage guide](./packages/react-chessboard/README.md)
- [Local React example](./examples/react/README.md)

## Development

Requires Node.js 22 or newer and npm. Install the shared workspaces from the repository root:

```sh
npm ci
npm run build
npm run check
npm test
npm run lint
```

Build runs core before React because React resolves core declarations through the package exports. Standalone examples are not workspaces; install them in their own directories after building the library packages.

```sh
npm ci --prefix examples/sveltekit
npm --prefix examples/sveltekit run check
npm --prefix examples/sveltekit run build
npm ci --prefix examples/react
npm --prefix examples/react run build
```

For the root validation and optional Git hook setup, see [CONTRIBUTING.md](./CONTRIBUTING.md). The [SvelteKit example](./examples/sveltekit/README.md) and [React example](./examples/react/README.md) provide manual integration guides.
