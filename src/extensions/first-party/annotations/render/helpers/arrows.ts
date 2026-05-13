import type { SceneRenderGeometry } from '../../../../../layout/geometry/types.js';
import { createSvgElement, updateSvgElementAttributes } from '../../../../../render/svg/helpers.js';
import type { Square } from '../../../../../state/board/types/internal.js';
import type { RenderedAnnotationArrowSvg } from '../../types/main.js';

export interface AnnotationArrowSvgVisualConfig {
	readonly strokeWidth: number;
	readonly startOffset: number;
	readonly endOffset: number;
	readonly opacity: number;
	readonly markerWidth: number;
	readonly markerHeight: number;
	readonly markerRefX: number;
	readonly markerRefY: number;
	readonly markerViewBox: string;
	readonly markerPathD: string;
}

export interface AnnotationArrowSvgParams {
	readonly defsRoot: SVGDefsElement;
	readonly visualRoot: SVGGElement;
	readonly markerDataId: string;
	readonly markerPathDataId: string;
	readonly lineDataId: string;
	readonly markerId: string;
	readonly markerHref: string;
	readonly from: Square;
	readonly to: Square;
	readonly color: string;
	readonly opacity: number;
	readonly visual: AnnotationArrowSvgVisualConfig;
	readonly geometry: SceneRenderGeometry;
}

function computeArrowGeometry(params: AnnotationArrowSvgParams) {
	const { from, to, visual, geometry } = params;
	const squareSize = geometry.squareSize;

	const fromRect = geometry.getSquareRect(from);
	const toRect = geometry.getSquareRect(to);
	const fromCx = fromRect.x + fromRect.width / 2;
	const fromCy = fromRect.y + fromRect.height / 2;
	const toCx = toRect.x + toRect.width / 2;
	const toCy = toRect.y + toRect.height / 2;

	const dx = toCx - fromCx;
	const dy = toCy - fromCy;
	const dist = Math.sqrt(dx * dx + dy * dy);

	const ux = dx / dist;
	const uy = dy / dist;

	const absoluteStartOffset = squareSize * visual.startOffset;
	const absoluteEndOffset = squareSize * visual.endOffset;

	return {
		x1: (fromCx + ux * absoluteStartOffset).toString(),
		y1: (fromCy + uy * absoluteStartOffset).toString(),
		x2: (toCx - ux * absoluteEndOffset).toString(),
		y2: (toCy - uy * absoluteEndOffset).toString(),
		strokeWidth: (squareSize * visual.strokeWidth).toString()
	};
}

export function createAnnotationArrowSvg(
	params: AnnotationArrowSvgParams
): RenderedAnnotationArrowSvg {
	const {
		defsRoot,
		visualRoot,
		markerDataId,
		markerPathDataId,
		lineDataId,
		markerId,
		markerHref,
		color,
		opacity,
		visual
	} = params;
	const geo = computeArrowGeometry(params);

	const marker = createSvgElement(defsRoot, 'marker', {
		'data-chessboard-id': markerDataId,
		id: markerId,
		markerUnits: 'strokeWidth',
		markerWidth: visual.markerWidth.toString(),
		markerHeight: visual.markerHeight.toString(),
		refX: visual.markerRefX.toString(),
		refY: visual.markerRefY.toString(),
		orient: 'auto',
		overflow: 'visible',
		viewBox: visual.markerViewBox
	});

	const markerPath = createSvgElement(marker, 'path', {
		'data-chessboard-id': markerPathDataId,
		d: visual.markerPathD,
		fill: color
	});

	const line = createSvgElement(visualRoot, 'line', {
		'data-chessboard-id': lineDataId,
		x1: geo.x1,
		y1: geo.y1,
		x2: geo.x2,
		y2: geo.y2,
		stroke: color,
		'stroke-width': geo.strokeWidth,
		'stroke-linecap': 'round',
		opacity: opacity.toString(),
		'marker-end': markerHref
	});

	return { line, marker, markerPath };
}

export function updateAnnotationArrowSvg(
	rendered: RenderedAnnotationArrowSvg,
	params: AnnotationArrowSvgParams
): void {
	const { markerId, markerHref, color, opacity, visual } = params;
	const geo = computeArrowGeometry(params);

	updateSvgElementAttributes(rendered.marker, {
		id: markerId,
		markerUnits: 'strokeWidth',
		markerWidth: visual.markerWidth.toString(),
		markerHeight: visual.markerHeight.toString(),
		refX: visual.markerRefX.toString(),
		refY: visual.markerRefY.toString(),
		orient: 'auto',
		overflow: 'visible',
		viewBox: visual.markerViewBox
	});

	updateSvgElementAttributes(rendered.markerPath, {
		d: visual.markerPathD,
		fill: color
	});

	updateSvgElementAttributes(rendered.line, {
		x1: geo.x1,
		y1: geo.y1,
		x2: geo.x2,
		y2: geo.y2,
		stroke: color,
		'stroke-width': geo.strokeWidth,
		'stroke-linecap': 'round',
		opacity: opacity.toString(),
		'marker-end': markerHref
	});
}

export function removeAnnotationArrowSvg(rendered: RenderedAnnotationArrowSvg): void {
	rendered.line.remove();
	rendered.marker.remove();
}
