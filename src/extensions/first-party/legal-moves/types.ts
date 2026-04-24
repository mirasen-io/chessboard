import { PartialDeep } from 'type-fest';
import { ExtensionDefinition, ExtensionInstance } from '../../types/extension.js';
import { ExtensionInternalBase, OpaqueColor } from '../common/types.js';

export const EXTENSION_SLOTS = ['overPieces'] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'legalMoves' as const;

export interface LegalMovesConfig {
	emptySquare: {
		color: OpaqueColor;
		radiusRatio: number;
	};
	captureTarget: {
		color: OpaqueColor;
		radiusRatio: number;
		strokeWidthRatio: number;
	};
}

export const DEFAULT_CONFIG: LegalMovesConfig = {
	emptySquare: {
		color: {
			color: 'rgb(0, 0, 0)',
			opacity: 0.14
		},
		radiusRatio: 0.125
	}, // semi-transparent black
	captureTarget: {
		color: {
			color: 'rgb(0, 0, 0)',
			opacity: 0.14
		},
		radiusRatio: 0.45,
		strokeWidthRatio: 0.1
	}
};

export type LegalMovesInitConfig = PartialDeep<LegalMovesConfig>;

export type LegalMovesDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export type LegalMovesInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export interface LegalMovesInstanceInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	destroyed: boolean;
	svgCircles: SVGCircleElement[];
	readonly config: LegalMovesConfig;
}

export const enum DirtyLayer {
	Highlight = 1 // 1 << 0,
}
