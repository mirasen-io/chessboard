// Public package entry: re-export core renderer contracts, helpers, and SVG renderer

// Core state types (selected)
export { DirtyLayer, type InvalidationStateSnapshot } from './core/scheduler/types';
export type {
	BoardStateSnapshot,
	Color,
	Role,
	Square,
	SquareString
} from './core/state/boardTypes';

/* Renderer contracts */
export type { Renderer, RenderGeometry } from './core/renderer/types';

/* Geometry helpers */
export { isLightSquare, makeRenderGeometry } from './core/renderer/geometry';

// SVG renderer and assets
export { cburnettSpriteUrl } from './core/renderer/assets';
export { SvgRenderer } from './core/renderer/SvgRenderer';
