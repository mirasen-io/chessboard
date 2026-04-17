import { PartialDeep } from 'type-fest';
import { ExtensionSlotSvgRoots } from '../../types/basic/mount';
import { ExtensionDefinition, ExtensionInstance } from '../../types/extension';
import { OpaqueColor } from '../common/types';

export const EXTENSION_SLOTS = ['overPieces'] as const;
export const EXTENSION_ID = 'legal-moves' as const;

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

export type LegalMovesSlotRoots = ExtensionSlotSvgRoots<typeof EXTENSION_SLOTS>;

export interface LegalMovesInstanceInternal {
	slotRoots: LegalMovesSlotRoots | null;
	svgCircles: SVGCircleElement[];
	readonly config: LegalMovesConfig;
}

export const enum DirtyLayer {
	Highlight = 1 // 1 << 0,
}
