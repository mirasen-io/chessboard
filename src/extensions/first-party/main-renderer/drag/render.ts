import { createSvgElement, updateSvgElementAttributes } from '../../../../render/svg/helpers.js';
import { ExtensionRenderTransientVisualsContext } from '../../../types/context/transient-visuals.js';
import { MainRendererDragInternal } from './types.js';

export function rendererDragRenderTransientVisuals(
	state: MainRendererDragInternal,
	context: ExtensionRenderTransientVisualsContext,
	slot: SVGGElement
): void {
	const geometry = context.currentFrame.layout.geometry;
	const point = context.transientInput.boardClampedPoint;
	const squareSize = geometry.squareSize.toString();
	const x = (point.x - geometry.squareSize / 2).toString();
	const y = (point.y - geometry.squareSize / 2).toString();
	if (state.isDragActive && state.pieceCode && !state.pieceNode) {
		// Ok this is first render pass, let's create the piece node
		const href = state.resolver.getHref(state.pieceCode);
		state.pieceNode = createSvgElement(slot, 'use', {
			'data-chessboard-id': 'dragged-piece',
			width: squareSize,
			height: squareSize,
			x,
			y,
			href
		});
	} else if (state.isDragActive && state.pieceNode) {
		updateSvgElementAttributes(state.pieceNode, {
			width: squareSize,
			height: squareSize,
			x,
			y
		});
	}
}
