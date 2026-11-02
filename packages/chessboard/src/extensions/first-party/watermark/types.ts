import { ExtensionDefinition, ExtensionInstance } from '../../types/extension.js';
import { ExtensionInternalBase } from '../common/types.js';

export const EXTENSION_SLOTS = ['board'] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'watermark' as const;

export type WatermarkDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export type WatermarkInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export interface WatermarkInstanceInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	svgWatermark: SVGImageElement | null;
}

export const enum DirtyLayer {
	Watermark = 1 << 0
}
