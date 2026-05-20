import { ExtensionRenderContext } from '../../../types/context/render.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import { ConfigColorPair } from '../types/internal.js';

export interface MainRendererBoardInternal {
	readonly getConfig: () => ConfigColorPair;
}

export interface MainRendererBoard {
	onUpdate(context: ExtensionUpdateContext): void;
	render(context: ExtensionRenderContext, slot: SVGGElement): void;
}
