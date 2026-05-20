import { ConfigColorPair } from '../types/internal.js';
import { rendererBoardRender } from './render.js';
import { MainRendererBoard, MainRendererBoardInternal } from './types.js';
import { rendererBoardOnUpdate } from './update.js';

function createMainRendererBoardInternal(
	getConfig: () => ConfigColorPair
): MainRendererBoardInternal {
	return { getConfig };
}

export function createMainRendererBoard(getConfig: () => ConfigColorPair): MainRendererBoard {
	const internalState = createMainRendererBoardInternal(getConfig);
	return {
		onUpdate(context) {
			rendererBoardOnUpdate(internalState, context);
		},
		render(context, slot) {
			rendererBoardRender(internalState, context, slot);
		}
	};
}
