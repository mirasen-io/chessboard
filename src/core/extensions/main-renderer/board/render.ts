import { clearElementChildren, createSvgElement, isLightSquare } from '../../../render/svg/helpers';
import { toAlgebraic } from '../../../state/board/coords';
import { Square } from '../../../state/board/types';
import { DirtyLayer, MainRendererRenderStateContext } from '../types/extension';
import { MainRendererBoardInternal } from './types';

export function rendererBoardRender(
	state: MainRendererBoardInternal,
	context: MainRendererRenderStateContext,
	layer: SVGElement
): void {
	// Check if we need to render
	if ((context.invalidation.dirtyLayers & DirtyLayer.Board) === 0) {
		return; // no-op
	}
	const geometry = context.current.layout.geometry;
	clearElementChildren(layer);

	const { light, dark } = state.config;

	for (let sq = 0 as Square; sq < 64; sq++) {
		const r = geometry.squareRect(sq);
		createSvgElement(layer, 'rect', {
			'data-chessboard-id': `square-${sq}`,
			'data-chessboard-square': toAlgebraic(sq),
			x: r.x.toString(),
			y: r.y.toString(),
			width: r.size.toString(),
			height: r.size.toString(),
			fill: isLightSquare(sq) ? light : dark,
			'shape-rendering': 'crispEdges'
		});
	}
}
