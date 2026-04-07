import { PartialDeep } from 'type-fest';
import { SvgRendererOnUpdateContext, SvgRendererRenderStateContext } from '../types/extension';

export interface SvgRendererBoardPieceNode {
	root: SVGImageElement;
}

export interface RendererConfigColorPair {
	light: string; // board light square color
	dark: string; // board dark square color
}

export interface RendererBoardConfig {
	board: RendererConfigColorPair;
	coords: RendererConfigColorPair; // coordinate text colors
}

/**
 * Default renderer configuration.
 */
export const DEFAULT_RENDERER_BOARD_CONFIG: RendererBoardConfig = {
	board: {
		light: '#d7dde5',
		dark: '#707a8a'
	},
	coords: {
		light: '#707a8a',
		dark: '#eef2f7'
	}
};

export interface SvgRendererBoardInternal {
	readonly config: RendererBoardConfig;
}

export type SvgRendererBoardInitOptions = PartialDeep<RendererBoardConfig>;

export interface SvgRendererBoard {
	onUpdate(context: SvgRendererOnUpdateContext): void;
	render(context: SvgRendererRenderStateContext, layer: SVGElement): void;
}
