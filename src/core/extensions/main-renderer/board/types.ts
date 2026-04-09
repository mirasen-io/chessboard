import { ConfigColorPair } from '../types/config';
import { MainRendererOnUpdateContext, MainRendererRenderStateContext } from '../types/extension';

export interface MainRendererBoardInternal {
	readonly config: ConfigColorPair;
}

export interface MainRendererBoard {
	onUpdate(context: MainRendererOnUpdateContext): void;
	render(context: MainRendererRenderStateContext, layer: SVGElement): void;
}
