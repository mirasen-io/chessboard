import { ConfigColorPair } from '../types/internal.js';
import { rendererBoardRender } from './render.js';
import { MainRendererBoard, MainRendererBoardInternal } from './types.js';
import { rendererBoardOnUpdate } from './update.js';

function createMainRendererBoardInternal(
	getColorConfig: () => ConfigColorPair
): MainRendererBoardInternal {
	return { getColorConfig };
}

export function createMainRendererBoard(getColorConfig: () => ConfigColorPair): MainRendererBoard {
	const internalState = createMainRendererBoardInternal(getColorConfig);
	return {
		onUpdate(context) {
			rendererBoardOnUpdate(internalState, context);
		},
		render(context, slot) {
			rendererBoardRender(internalState, context, slot);
		}
	};
}
