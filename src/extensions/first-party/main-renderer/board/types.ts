import { ExtensionRenderContext } from '../../../types/context/render';
import { ExtensionUpdateContext } from '../../../types/context/update';
import { ConfigColorPair } from '../types/internal';

export interface MainRendererBoardInternal {
	readonly config: ConfigColorPair;
}

export interface MainRendererBoard {
	onUpdate(context: ExtensionUpdateContext): void;
	render(context: ExtensionRenderContext, layer: SVGElement): void;
}
