import assert from '@ktarmyshov/assert';
import type { SceneRenderGeometry } from '../../../layout/geometry/types.js';
import { createSvgElement, updateSvgElementAttributes } from '../../../render/svg/helpers.js';
import { VISUAL_CONFIG } from './constants.js';
import type { CircleAnnotationKey } from './types/internal.js';
import type { AnnotationsStateInternal } from './types/main.js';

/**
 * Reconciles committed circle SVG elements against the current annotations state.
 *
 * Uses keyed reconciliation:
 * - Updates existing SVG elements in place when their key still exists
 * - Creates SVG elements only for new keys
 * - Removes SVG elements whose keys were not seen in the desired annotations
 */
export function renderCommittedCircles(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry
): void {
	assert(state.slotRoots, 'Expected slotRoots to be initialized before rendering annotations');

	const { committed } = VISUAL_CONFIG.circle;
	const squareSize = geometry.squareSize;
	const absoluteRadius = (squareSize * committed.radius).toString();
	const absoluteStrokeWidth = (squareSize * committed.strokeWidth).toString();
	const opacity = committed.opacity.toString();

	// Track which keys are still desired this pass
	const seenKeys = new Set<CircleAnnotationKey>();

	for (const [key, circle] of state.annotations.circles) {
		seenKeys.add(key);

		const rect = geometry.getSquareRect(circle.square);
		const cx = (rect.x + rect.width / 2).toString();
		const cy = (rect.y + rect.height / 2).toString();

		const attributes = {
			cx,
			cy,
			r: absoluteRadius,
			fill: 'none',
			stroke: circle.color,
			'stroke-width': absoluteStrokeWidth,
			opacity: opacity
		};

		const existing = state.svg.svgCircles.get(key);
		if (existing) {
			// Update in place
			updateSvgElementAttributes(existing, attributes);
		} else {
			// Create new element
			const el = createSvgElement(state.slotRoots.overPieces, 'circle', {
				'data-chessboard-id': `annotation-circle-committed-${key}`,
				...attributes
			});
			state.svg.svgCircles.set(key, el);
		}
	}

	// Remove stale elements whose keys are no longer desired
	for (const [key, el] of state.svg.svgCircles) {
		if (!seenKeys.has(key)) {
			el.remove();
			state.svg.svgCircles.delete(key);
		}
	}
}
