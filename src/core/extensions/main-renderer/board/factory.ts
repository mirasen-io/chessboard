import { merge } from 'es-toolkit/object';
import { createSvgGroup } from '../helpers';
import { renderBoard } from './render';
import {
	DEFAULT_RENDERER_BOARD_CONFIG,
	SvgRendererBoard,
	SvgRendererBoardInitOptions,
	SvgRendererBoardInternals
} from './types';

function createSvgRendererBoardInternals(
	doc: Document,
	options: SvgRendererBoardInitOptions
): SvgRendererBoardInternals {
	return {
		config: merge({}, DEFAULT_RENDERER_BOARD_CONFIG, options),
		root: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-board-root' }),
		coords: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-board-coords' }),
		pieces: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-board-pieces' }),
		defsRoot: createSvgGroup(doc, { 'data-chessboard-id': 'renderer-board-defs' }),
		pieceNodes: new Map()
	};
}

export function createSvgRendererBoard(
	doc: Document,
	options: SvgRendererBoardInitOptions
): SvgRendererBoard {
	const internalState = createSvgRendererBoardInternals(doc, options);

	return {
		...internalState,
		render(context) {
			renderBoard(internalState, context);
		}
	};
}
