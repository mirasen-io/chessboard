import { ConfigColorPair } from '../types/internal';
import { rendererBoardRender } from './render';
import { MainRendererBoard, MainRendererBoardInternal } from './types';
import { rendererBoardOnUpdate } from './update';

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
