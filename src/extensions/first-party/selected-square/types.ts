import { PartialDeep } from 'type-fest';
import { ExtensionDefinition, ExtensionInstance } from '../../types/extension.js';
import { ExtensionInternalBase, OpaqueColor } from '../common/types.js';

export const EXTENSION_SLOTS = ['underPieces'] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'selectedSquare' as const;

export type SelectedSquareConfig = OpaqueColor;

export const DEFAULT_CONFIG: SelectedSquareConfig = {
	color: 'rgba(255, 255, 0)',
	opacity: 0.4
};

export type SelectedSquareInitConfig = PartialDeep<SelectedSquareConfig>;

export type SelectedSquareDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export type SelectedSquareInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export interface SelectedSquareInstanceInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	svgRect: SVGRectElement | null;
	readonly config: SelectedSquareConfig;
}

export const enum DirtyLayer {
	Highlight = 1 // 1 << 0,
}
