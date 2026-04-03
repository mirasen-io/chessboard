import { PartialDeep } from 'type-fest';
import { RenderGeometry } from '../../../layout/geometry/types';
import { BoardStateSnapshot, Square } from '../../../state/board/types';
import { InvalidationStateSnapshot } from '../../invalidation/types';

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

export interface SvgRendererBoardInternals {
	readonly config: RendererBoardConfig;
	readonly root: SVGGElement;
	readonly coords: SVGGElement;
	readonly pieces: SVGGElement;
	readonly defsRoot: SVGGElement;
	readonly pieceNodes: Map<Square, SvgRendererBoardPieceNode>;
}

export type SvgRendererBoardInitOptions = PartialDeep<RendererBoardConfig>;

//
// Stable render-facing snapshot derived from runtime state.
// This is the semantic input baseline used by the render subsystem and renderer.
//
export interface RendererBoardFrameSnapshot {
	readonly board: BoardStateSnapshot;
	readonly suppressedSquares: ReadonlySet<Square>;
	readonly geometry: RenderGeometry;
}

export interface _BoardRenderContext {
	readonly previous: RendererBoardFrameSnapshot | null;
	readonly current: RendererBoardFrameSnapshot;
	readonly invalidation: InvalidationStateSnapshot;
}

export interface SvgRendererBoard {
	readonly config: RendererBoardConfig;
	readonly root: SVGGElement;
	readonly coords: SVGGElement;
	readonly pieces: SVGGElement;
	readonly defsRoot: SVGGElement;
	readonly pieceNodes: ReadonlyMap<Square, SvgRendererBoardPieceNode>;
	render(context: _BoardRenderContext): void;
}
