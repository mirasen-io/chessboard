import { ExtensionRenderContext } from '../../../types/context/render.js';
import { ConfigColorPair } from '../types/internal.js';

export interface MainRendererCoordinatesInternal {
	readonly getColorConfig: () => ConfigColorPair;
}

export interface MainRendererCoordinates {
	render(context: ExtensionRenderContext, slot: SVGGElement): void;
}
