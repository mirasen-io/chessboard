import { createSvgElement, updateSvgElementAttributes } from '../../../../render/svg/helpers.js';
import { ExtensionRenderTransientVisualsContext } from '../../../types/context/transient-visuals.js';
import { MainRendererDragInternal } from './types.js';

export function rendererDragRenderTransientVisuals(
	state: MainRendererDragInternal,
	context: ExtensionRenderTransientVisualsContext,
	slot: SVGGElement
): void {
	const config = state.getDragConfig();
	const geometry = context.currentFrame.layout.geometry;
	const point = context.transientInput.boardClampedPoint;
	const renderedSize = geometry.squareSize * config.pieceScale;
	const anchorOffsetY = geometry.squareSize * config.pieceAnchorOffsetY;
	const x = point.x - renderedSize / 2;
	const y =
		config.pieceAnchor === 'bottom'
			? point.y - renderedSize + anchorOffsetY
			: point.y - renderedSize / 2 + anchorOffsetY;
	const renderedSizeStr = renderedSize.toString();
	const xStr = x.toString();
	const yStr = y.toString();
	if (state.isDragActive && state.pieceCode && !state.pieceNode) {
		// Ok this is first render pass, let's create the piece node
		const href = state.resolver.getHref(state.pieceCode);
		state.pieceNode = createSvgElement(slot, 'use', {
			'data-chessboard-id': 'dragged-piece',
			width: renderedSizeStr,
			height: renderedSizeStr,
			x: xStr,
			y: yStr,
			href
		});
	} else if (state.isDragActive && state.pieceNode) {
		updateSvgElementAttributes(state.pieceNode, {
			width: renderedSizeStr,
			height: renderedSizeStr,
			x: xStr,
			y: yStr
		});
	}
}
