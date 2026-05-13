import assert from '@ktarmyshov/assert';
import type { SceneRenderGeometry } from '../../../../layout/geometry/types.js';
import { VISUAL_CONFIG } from '../constants.js';
import { arrowAnnotationKeyNormalized } from '../normalize.js';
import type { ArrowAnnotationKey, CircleAnnotationKey } from '../types/internal.js';
import type { AnnotationsStateInternal } from '../types/main.js';
import {
	createAnnotationArrowSvg,
	removeAnnotationArrowSvg,
	updateAnnotationArrowSvg
} from './helpers/arrows.js';
import {
	createAnnotationCircleSvg,
	removeAnnotationCircleSvg,
	updateAnnotationCircleSvg
} from './helpers/circles.js';

export function renderCommittedAnnotations(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry
): void {
	assert(state.slotRoots, 'Expected slotRoots to be initialized before rendering annotations');
	renderCommittedCircles(state, geometry);
	renderCommittedArrows(state, geometry);
}

function getSuppressedCircleKey(state: AnnotationsStateInternal): CircleAnnotationKey | null {
	const gesture = state.activeDrawGesture;
	const target = state.activeDrawPreviewTarget;
	if (gesture === null || target === null) return null;
	if (target !== gesture.sourceSquare) return null;
	const existing = state.annotations.circles.get(target);
	if (existing === undefined || existing.color !== gesture.color) return null;
	return target;
}

function getSuppressedArrowKey(state: AnnotationsStateInternal): ArrowAnnotationKey | null {
	const gesture = state.activeDrawGesture;
	const target = state.activeDrawPreviewTarget;
	if (gesture === null || target === null) return null;
	if (target === gesture.sourceSquare) return null;
	const key = arrowAnnotationKeyNormalized(gesture.sourceSquare, target);
	const existing = state.annotations.arrows.get(key);
	if (existing === undefined || existing.color !== gesture.color) return null;
	return key;
}

function renderCommittedCircles(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry
): void {
	const { committed } = VISUAL_CONFIG.circle;
	const suppressedKey = getSuppressedCircleKey(state);

	const seenKeys = new Set<CircleAnnotationKey>();

	for (const [key, circle] of state.annotations.circles) {
		if (key === suppressedKey) continue;
		seenKeys.add(key);

		const params = {
			parent: state.slotRoots!.overPieces,
			dataId: `annotation-circle-committed-${key}`,
			square: circle.square,
			color: circle.color,
			radius: committed.radius,
			strokeWidth: committed.strokeWidth,
			opacity: committed.opacity,
			geometry
		};

		const existing = state.svg.svgCircles.get(key);
		if (existing) {
			updateAnnotationCircleSvg(existing, params);
		} else {
			const rendered = createAnnotationCircleSvg(params);
			state.svg.svgCircles.set(key, rendered);
		}
	}

	for (const [key, rendered] of state.svg.svgCircles) {
		if (!seenKeys.has(key)) {
			removeAnnotationCircleSvg(rendered);
			state.svg.svgCircles.delete(key);
		}
	}
}

function renderCommittedArrows(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry
): void {
	const { committed } = VISUAL_CONFIG.arrow;
	const suppressedKey = getSuppressedArrowKey(state);

	const seenKeys = new Set<ArrowAnnotationKey>();

	for (const [key, arrow] of state.annotations.arrows) {
		if (key === suppressedKey) continue;
		seenKeys.add(key);

		const fromRect = geometry.getSquareRect(arrow.from);
		const toRect = geometry.getSquareRect(arrow.to);
		const fromCx = fromRect.x + fromRect.width / 2;
		const fromCy = fromRect.y + fromRect.height / 2;
		const toCx = toRect.x + toRect.width / 2;
		const toCy = toRect.y + toRect.height / 2;
		const dx = toCx - fromCx;
		const dy = toCy - fromCy;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist === 0) {
			seenKeys.delete(key);
			continue;
		}

		const markerId = state.svgIds.makeId('annotations', `arrowhead-${key}`);
		const markerHref = `url(${state.svgIds.makeHref('annotations', `arrowhead-${key}`)})`;

		const params = {
			defsRoot: state.slotRoots!.defs,
			visualRoot: state.slotRoots!.overPieces,
			markerDataId: `annotation-arrowhead-committed-${key}`,
			markerPathDataId: `annotation-arrowhead-path-committed-${key}`,
			lineDataId: `annotation-arrow-committed-${key}`,
			markerId,
			markerHref,
			from: arrow.from,
			to: arrow.to,
			color: arrow.color,
			opacity: committed.opacity,
			visual: committed,
			geometry
		};

		const existing = state.svg.svgArrows.get(key);
		if (existing) {
			updateAnnotationArrowSvg(existing, params);
		} else {
			const rendered = createAnnotationArrowSvg(params);
			state.svg.svgArrows.set(key, rendered);
		}
	}

	for (const [key, rendered] of state.svg.svgArrows) {
		if (!seenKeys.has(key)) {
			removeAnnotationArrowSvg(rendered);
			state.svg.svgArrows.delete(key);
		}
	}
}
