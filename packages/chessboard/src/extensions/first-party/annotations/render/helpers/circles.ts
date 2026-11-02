import type { SceneRenderGeometry } from '../../../../../layout/geometry/types.js';
import { createSvgElement, updateSvgElementAttributes } from '../../../../../render/svg/helpers.js';
import type { Square } from '../../../../../state/board/types/internal.js';
import type { RenderedAnnotationCircleSvg } from '../../types/main.js';

export interface AnnotationCircleSvgAttributeParams {
	readonly square: Square;
	readonly color: string;
	readonly radius: number;
	readonly strokeWidth: number;
	readonly opacity: number;
	readonly geometry: SceneRenderGeometry;
}

export interface AnnotationCircleSvgCreateParams extends AnnotationCircleSvgAttributeParams {
	readonly parent: SVGGElement;
	readonly dataId: string;
}

function computeCircleAttributes(params: AnnotationCircleSvgAttributeParams) {
	const { square, color, radius, strokeWidth, opacity, geometry } = params;
	const squareSize = geometry.squareSize;
	const rect = geometry.getSquareRect(square);
	return {
		cx: (rect.x + rect.width / 2).toString(),
		cy: (rect.y + rect.height / 2).toString(),
		r: (squareSize * radius).toString(),
		fill: 'none',
		stroke: color,
		'stroke-width': (squareSize * strokeWidth).toString(),
		opacity: opacity.toString()
	};
}

export function createAnnotationCircleSvg(
	params: AnnotationCircleSvgCreateParams
): RenderedAnnotationCircleSvg {
	const attributes = computeCircleAttributes(params);
	const circle = createSvgElement(params.parent, 'circle', {
		'data-chessboard-id': params.dataId,
		...attributes
	});
	return { circle };
}

export function updateAnnotationCircleSvg(
	rendered: RenderedAnnotationCircleSvg,
	params: AnnotationCircleSvgAttributeParams
): void {
	const attributes = computeCircleAttributes(params);
	updateSvgElementAttributes(rendered.circle, attributes);
}

export function removeAnnotationCircleSvg(rendered: RenderedAnnotationCircleSvg): void {
	rendered.circle.remove();
}
