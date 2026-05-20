import { ConfigColorPair } from '../types/internal.js';
import { rendererCoordinatesRender } from './render.js';
import { MainRendererCoordinates, MainRendererCoordinatesInternal } from './types.js';

export function createMainRendererCoordinates(
	getConfig: () => ConfigColorPair
): MainRendererCoordinates {
	const internalState: MainRendererCoordinatesInternal = { getConfig };
	return {
		render(context, slot) {
			rendererCoordinatesRender(internalState, context, slot);
		}
	};
}
