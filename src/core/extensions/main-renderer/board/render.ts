import { clearElementChildren, createSvgElement, isLightSquare } from '../../../render/svg/helpers';
import { toAlgebraic } from '../../../state/board/coords';
import { Square } from '../../../state/board/types';
import { DirtyLayer, SvgRendererRenderStateContext } from '../types/extension';
import { SvgRendererBoardInternal } from './types';

export function rendererBoardRender(
	state: SvgRendererBoardInternal,
	context: SvgRendererRenderStateContext,
	layer: SVGElement
): void {
	// Check if we need to render
	if ((context.invalidation.dirtyLayers & DirtyLayer.Board) === 0) {
		return; // no-op
	}
	const geometry = context.current.layout.geometry;
	clearElementChildren(layer);

	const { light, dark } = state.config.board;

	for (let sq = 0 as Square; sq < 64; sq++) {
		const r = geometry.squareRect(sq);
		const rect = createSvgElement(layer.ownerDocument, 'rect', {
			'data-chessboard-id': `square-${sq}`,
			'data-chessboard-square': toAlgebraic(sq),
			x: r.x.toString(),
			y: r.y.toString(),
			width: r.size.toString(),
			height: r.size.toString(),
			fill: isLightSquare(sq) ? light : dark,
			'shape-rendering': 'crispEdges'
		});
		layer.appendChild(rect);
	}
}
