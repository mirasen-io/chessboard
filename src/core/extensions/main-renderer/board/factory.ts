import { toMerged } from 'es-toolkit';
import { rendererBoardRender } from './render';
import {
	DEFAULT_RENDERER_BOARD_CONFIG,
	SvgRendererBoard,
	SvgRendererBoardInitOptions,
	SvgRendererBoardInternal
} from './types';
import { rendererBoardOnUpdate } from './update';

function createSvgRendererBoardInternals(
	options: SvgRendererBoardInitOptions
): SvgRendererBoardInternal {
	const config = toMerged(DEFAULT_RENDERER_BOARD_CONFIG, options);
	return { config };
}

export function createSvgRendererBoard(options: SvgRendererBoardInitOptions): SvgRendererBoard {
	const internalState = createSvgRendererBoardInternals(options);
	return {
		onUpdate(context) {
			rendererBoardOnUpdate(internalState, context);
		},
		render(context, layer) {
			rendererBoardRender(internalState, context, layer);
		}
	};
}
