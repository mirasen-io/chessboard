import { createSvgElement, updateElementAttributes } from '../../../../render/svg/helpers.js';
import { ExtensionRenderTransientVisualsContext } from '../../../types/context/transient-visuals.js';
import { MainRendererDragInternal } from './types.js';

export function rendererDragRenderTransientVisuals(
	state: MainRendererDragInternal,
	context: ExtensionRenderTransientVisualsContext,
	layer: SVGElement
): void {
	const geometry = context.currentFrame.layout.geometry;
	const point = context.transientInput.boardClampedPoint;
	const squareSize = geometry.squareSize.toString();
	const x = (point.x - geometry.squareSize / 2).toString();
	const y = (point.y - geometry.squareSize / 2).toString();
	if (state.isDragActive && state.pieceUrl && !state.pieceNode) {
		// Ok this is first render pass, let's create the piece node
		state.pieceNode = createSvgElement(layer, 'image', {
			'data-chessboard-id': 'dragged-piece',
			width: squareSize,
			height: squareSize,
			x,
			y,
			href: state.pieceUrl
		});
	} else if (state.isDragActive && state.pieceNode) {
		updateElementAttributes(state.pieceNode, {
			width: squareSize,
			height: squareSize,
			x,
			y
		});
	}
}
