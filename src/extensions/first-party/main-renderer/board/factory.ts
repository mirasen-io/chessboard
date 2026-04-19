import { ConfigColorPair } from '../types/internal.js';
import { rendererBoardRender } from './render.js';
import { MainRendererBoard, MainRendererBoardInternal } from './types.js';
import { rendererBoardOnUpdate } from './update.js';

function createMainRendererBoardInternal(config: ConfigColorPair): MainRendererBoardInternal {
	return { config };
}

export function createMainRendererBoard(config: ConfigColorPair): MainRendererBoard {
	const internalState = createMainRendererBoardInternal(config);
	return {
		onUpdate(context) {
			rendererBoardOnUpdate(internalState, context);
		},
		render(context, layer) {
			rendererBoardRender(internalState, context, layer);
		}
	};
}
