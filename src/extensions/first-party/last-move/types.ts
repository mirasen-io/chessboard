import { PartialDeep } from 'type-fest';
import { ExtensionDefinition, ExtensionInstance } from '../../types/extension.js';
import { ExtensionInternalBase, OpaqueColor } from '../common/types.js';

export const EXTENSION_SLOTS = ['underPieces'] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'lastMove' as const;

export type LastMoveConfig = OpaqueColor;

export const DEFAULT_CONFIG: LastMoveConfig = {
	color: 'rgba(255, 255, 0)',
	opacity: 0.4
};

export type LastMoveInitConfig = PartialDeep<LastMoveConfig>;

export type LastMoveDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export type LastMoveInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export interface LastMoveInstanceInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	svgRectFrom: SVGRectElement | null;
	svgRectTo: SVGRectElement | null;
	readonly config: LastMoveConfig;
}

export const enum DirtyLayer {
	Highlight = 1 // 1 << 0,
}
