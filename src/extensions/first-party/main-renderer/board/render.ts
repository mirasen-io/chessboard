import {
	clearElementChildren,
	createSvgElement,
	isLightSquare
} from '../../../../render/svg/helpers';
import { Square, SQUARE_COUNT } from '../../../../state/board/types/internal';
import { ExtensionRenderContext } from '../../../types/context/render';
import { DirtyLayer } from '../types/extension';
import { MainRendererBoardInternal } from './types';

export function rendererBoardRender(
	state: MainRendererBoardInternal,
	context: ExtensionRenderContext,
	layer: SVGElement
): void {
	// Check if we need to render
	if ((context.invalidation.dirtyLayers & DirtyLayer.Board) === 0) {
		return; // no-op
	}
	const geometry = context.currentFrame.layout.geometry;
	clearElementChildren(layer);

	const { light, dark } = state.config;

	for (let sq = 0 as Square; sq < SQUARE_COUNT; sq++) {
		const r = geometry.squareRect(sq);
		createSvgElement(layer, 'rect', {
			'data-chessboard-id': `square-${sq}`,
			x: r.x.toString(),
			y: r.y.toString(),
			width: r.size.toString(),
			height: r.size.toString(),
			fill: isLightSquare(sq) ? light : dark,
			'shape-rendering': 'crispEdges'
		});
	}
}
