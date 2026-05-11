import assert from '@ktarmyshov/assert';
import type { SceneRenderGeometry } from '../../../layout/geometry/types.js';
import { createSvgElement, updateSvgElementAttributes } from '../../../render/svg/helpers.js';
import { VISUAL_CONFIG } from './constants.js';
import type { ArrowAnnotationKey } from './types/internal.js';
import type { AnnotationsStateInternal } from './types/main.js';

/**
 * Reconciles committed arrow SVG elements against the current annotations state.
 *
 * Uses keyed reconciliation:
 * - Updates existing SVG elements in place when their key still exists
 * - Creates SVG elements only for new keys
 * - Removes SVG elements whose keys were not seen in the desired annotations
 */
export function renderCommittedArrows(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry
): void {
	assert(state.slotRoots, 'Expected slotRoots to be initialized before rendering annotations');

	const { committed } = VISUAL_CONFIG.arrow;
	const squareSize = geometry.squareSize;
	const absoluteStrokeWidth = squareSize * committed.strokeWidth;
	const absoluteStartOffset = squareSize * committed.startOffset;
	const absoluteEndOffset = squareSize * committed.endOffset;
	const strokeWidthStr = absoluteStrokeWidth.toString();
	const opacityStr = committed.opacity.toString();

	// Track which keys are still desired this pass
	const seenKeys = new Set<ArrowAnnotationKey>();

	for (const [key, arrow] of state.annotations.arrows) {
		seenKeys.add(key);

		// Compute source and target square centers
		const fromRect = geometry.getSquareRect(arrow.from);
		const toRect = geometry.getSquareRect(arrow.to);
		const fromCx = fromRect.x + fromRect.width / 2;
		const fromCy = fromRect.y + fromRect.height / 2;
		const toCx = toRect.x + toRect.width / 2;
		const toCy = toRect.y + toRect.height / 2;

		// Compute unit vector from source to target
		const dx = toCx - fromCx;
		const dy = toCy - fromCy;
		const dist = Math.sqrt(dx * dx + dy * dy);

		// Defensive: skip degenerate arrows (should not happen with validation)
		if (dist === 0) {
			seenKeys.delete(key);
			continue;
		}

		const ux = dx / dist;
		const uy = dy / dist;

		// Start point offset from source center
		const x1 = fromCx + ux * absoluteStartOffset;
		const y1 = fromCy + uy * absoluteStartOffset;

		// End point offset from target center (shortened towards source)
		const x2 = toCx - ux * absoluteEndOffset;
		const y2 = toCy - uy * absoluteEndOffset;

		// Marker id/href
		const markerId = state.svgIds.makeId('annotations', `arrowhead-${key}`);
		const markerHref = `url(${state.svgIds.makeHref('annotations', `arrowhead-${key}`)})`;

		const lineAttributes = {
			x1: x1.toString(),
			y1: y1.toString(),
			x2: x2.toString(),
			y2: y2.toString(),
			stroke: arrow.color,
			'stroke-width': strokeWidthStr,
			'stroke-linecap': 'round',
			opacity: opacityStr,
			'marker-end': markerHref
		};

		const markerAttributes = {
			id: markerId,
			markerUnits: 'strokeWidth',
			markerWidth: committed.markerWidth.toString(),
			markerHeight: committed.markerHeight.toString(),
			refX: committed.markerRefX.toString(),
			refY: committed.markerRefY.toString(),
			orient: 'auto',
			overflow: 'visible',
			viewBox: committed.markerViewBox
		};

		const existing = state.svg.svgArrows.get(key);
		if (existing) {
			// Update in place
			updateSvgElementAttributes(existing.line, lineAttributes);
			updateSvgElementAttributes(existing.marker, markerAttributes);
			updateSvgElementAttributes(existing.markerPath, {
				d: committed.markerPathD,
				fill: arrow.color
			});
		} else {
			// Create marker in defs
			const marker = createSvgElement(state.slotRoots.defs, 'marker', {
				'data-chessboard-id': `annotation-arrowhead-committed-${key}`,
				...markerAttributes
			});

			// Create path inside marker
			const markerPath = createSvgElement(marker, 'path', {
				'data-chessboard-id': `annotation-arrowhead-path-committed-${key}`,
				d: committed.markerPathD,
				fill: arrow.color
			});

			// Create line in overPieces
			const line = createSvgElement(state.slotRoots.overPieces, 'line', {
				'data-chessboard-id': `annotation-arrow-committed-${key}`,
				...lineAttributes
			});

			state.svg.svgArrows.set(key, {
				line,
				marker: marker,
				markerPath: markerPath
			});
		}
	}

	// Remove stale elements whose keys are no longer desired
	for (const [key, rendered] of state.svg.svgArrows) {
		if (!seenKeys.has(key)) {
			rendered.line.remove();
			rendered.marker.remove();
			state.svg.svgArrows.delete(key);
		}
	}
}
