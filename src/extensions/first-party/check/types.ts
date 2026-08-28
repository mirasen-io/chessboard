import { PartialDeep } from 'type-fest';
import type { Square } from '../../../state/board/types/internal.js';
import { ExtensionDefinition, ExtensionInstance } from '../../types/extension.js';
import { ExtensionInternalBase, OpaqueColor } from '../common/types.js';
import type { ExtensionRuntimeSurface } from '../../types/surface/main.js';
import type { SquareString } from '../../../state/board/types/input.js';

export const EXTENSION_SLOTS = ['defs', 'underPieces'] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'check' as const;

export type CheckConfig = OpaqueColor;

// A recognizable check glow: a solid red core fading to transparent toward the
// square edges. The center color/opacity are configurable; the edge fade is
// fixed by GRADIENT_STOPS below.
export const DEFAULT_CONFIG: CheckConfig = {
	color: 'rgb(255, 0, 0)',
	opacity: 1
};

// Radial gradient stops with fixed offsets. Each stop's stop-color comes from
// config.color; stop-opacity multiplies config.opacity by the ratio here so the
// glow is opaque at the center and transparent at the edges.
export const GRADIENT_STOPS = [
	{ offset: '0%', opacityRatio: 1 },
	{ offset: '25%', opacityRatio: 1 },
	{ offset: '89%', opacityRatio: 0 },
	{ offset: '100%', opacityRatio: 0 }
] as const;

export type CheckInitConfig = PartialDeep<CheckConfig>;

export type CheckPublic = {
	square: SquareString | null;
};

export type CheckDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	CheckPublic
>;

export type CheckInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	CheckPublic
>;

export interface CheckInstanceInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	square: Square | null;
	svgRect: SVGRectElement | null;
	svgGradient: SVGRadialGradientElement | null;
	readonly runtimeSurface: ExtensionRuntimeSurface;
	readonly config: CheckConfig;
}

export const enum DirtyLayer {
	Highlight = 1 // 1 << 0
}
