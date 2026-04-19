import { ExtensionRenderContext } from '../../../types/context/render.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import { ConfigColorPair } from '../types/internal.js';

export interface MainRendererBoardInternal {
	readonly config: ConfigColorPair;
}

export interface MainRendererBoard {
	onUpdate(context: ExtensionUpdateContext): void;
	render(context: ExtensionRenderContext, layer: SVGElement): void;
}
