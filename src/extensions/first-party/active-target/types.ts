import { PartialDeep } from 'type-fest';
import { ExtensionDefinition, ExtensionInstance } from '../../types/extension';
import { ExtensionInternal, OpaqueColor } from '../common/types';

export const EXTENSION_SLOTS = ['underPieces', 'overPieces'] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'activeTarget' as const;

export interface ActiveTargetConfig {
	squareColor: OpaqueColor;
	halo: {
		color: OpaqueColor;
		radiusRatio: number;
	};
}

export const DEFAULT_CONFIG: ActiveTargetConfig = {
	squareColor: {
		color: 'rgba(255, 255, 0)',
		opacity: 0.4
	},
	halo: {
		color: {
			color: 'rgba(0, 0, 0)',
			opacity: 0.2
		},
		radiusRatio: 1.2
	}
};

export type ActiveTargetInitConfig = PartialDeep<ActiveTargetConfig>;

export type ActiveTargetDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export type ActiveTargetInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export interface ActiveTargetInstanceInternal extends ExtensionInternal<ExtensionSlotsType> {
	svgRect: SVGRectElement | null;
	svgCircle: SVGCircleElement | null;
	readonly config: ActiveTargetConfig;
}

export const enum DirtyLayer {
	Highlight = 1 // 1 << 0,
}
