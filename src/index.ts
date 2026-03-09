// Public package entry: re-export core renderer contracts, helpers, and SVG renderer

// Core state types (selected)
export { DirtyLayer } from './core/state/types';
export type { Color, Role, Square, SquareString, StateSnapshot, Theme } from './core/state/types';

// Renderer contracts
export type { BoardGeometry, Invalidation, Renderer } from './core/renderer/types';

// Geometry helpers
export { isLightSquare, makeBoardGeometry, squareAtPoint } from './core/renderer/geometry';

// SVG renderer and assets
export { cburnettSpriteUrl } from './core/renderer/assets';
export { SvgRenderer } from './core/renderer/SvgRenderer';
