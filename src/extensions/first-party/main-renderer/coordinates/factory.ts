import { ConfigColorPair } from '../types/internal.js';
import { rendererCoordinatesRender } from './render.js';
import { MainRendererCoordinates, MainRendererCoordinatesInternal } from './types.js';

export function createMainRendererCoordinates(
	getColorConfig: () => ConfigColorPair
): MainRendererCoordinates {
	const internalState: MainRendererCoordinatesInternal = { getColorConfig };
	return {
		render(context, slot) {
			rendererCoordinatesRender(internalState, context, slot);
		}
	};
}
