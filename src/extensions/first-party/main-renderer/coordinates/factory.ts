import { ConfigColorPair } from '../types/internal';
import { rendererCoordinatesRender } from './render';
import { MainRendererCoordinates, MainRendererCoordinatesInternal } from './types';

export function createMainRendererCoordinates(config: ConfigColorPair): MainRendererCoordinates {
	const internalState: MainRendererCoordinatesInternal = { config };
	return {
		render(context, layer) {
			rendererCoordinatesRender(internalState, context, layer);
		}
	};
}
