import { RolePromotionCode, Square } from '../../../../state/board/types/internal.js';
import { ExtensionSlotName } from '../../../types/basic/mount.js';
import { ExtensionDefinition, ExtensionInstance } from '../../../types/extension.js';
import { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import { ExtensionInternal } from '../../common/types.js';
import { PromotionConfig } from './internal.js';

export const EXTENSION_SLOTS = ['animation'] as const satisfies readonly ExtensionSlotName[];
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'promotion' as const;

export type PromotionDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export type PromotionInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export interface PromotionPieceNode {
	readonly svg: SVGImageElement;
	readonly rect: SVGRectElement;
}

export interface PromotionInstanceInternal extends ExtensionInternal<ExtensionSlotsType> {
	readonly config: PromotionConfig;
	readonly svgPromotionPieces: Map<RolePromotionCode, PromotionPieceNode>;
	readonly activePromotionSquares: Map<Square, RolePromotionCode>;
	svgHoverRect: SVGRectElement | null;
	readonly runtimeSurface: ExtensionRuntimeSurface;
}

export const enum DirtyLayer {
	Promotion = 1 // 1 << 0,
}
