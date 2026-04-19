import { ExtensionRenderContext } from '../../../types/context/render.js';
import { ConfigColorPair } from '../types/internal.js';

export interface MainRendererCoordinatesInternal {
	readonly config: ConfigColorPair;
}

export interface MainRendererCoordinates {
	render(context: ExtensionRenderContext, layer: SVGElement): void;
}
