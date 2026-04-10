import { ExtensionOnUpdateStateContext, ExtensionRenderStateContext } from '../../types';
import { ConfigColorPair } from '../types/config';

export interface MainRendererBoardInternal {
	readonly config: ConfigColorPair;
}

export interface MainRendererBoard {
	onUpdate(context: ExtensionOnUpdateStateContext): void;
	render(context: ExtensionRenderStateContext, layer: SVGElement): void;
}
