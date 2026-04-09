import { ConfigColorPair } from '../types/config';
import { MainRendererRenderStateContext } from '../types/extension';

export interface MainRendererCoordinatesInternal {
	readonly config: ConfigColorPair;
}

export interface MainRendererCoordinates {
	render(context: MainRendererRenderStateContext, layer: SVGElement): void;
}
