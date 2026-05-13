import assert from '@ktarmyshov/assert';
import type { SceneRenderGeometry } from '../../../../layout/geometry/types.js';
import type { Square } from '../../../../state/board/types/internal.js';
import { VISUAL_CONFIG } from '../constants.js';
import { arrowAnnotationKeyNormalized } from '../normalize.js';
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

export function renderPreviewAnnotations(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry
): void {
	assert(state.slotRoots, 'Expected slotRoots to be initialized before rendering preview');

	const gesture = state.activeDrawGesture;
	const target = state.activeDrawPreviewTarget;

	// No preview needed: clear any existing preview DOM
	if (gesture === null || target === null) {
		clearPreviewCircle(state);
		clearPreviewArrow(state);
		return;
	}

	const source = gesture.sourceSquare;
	const color = gesture.color;

	if (target === source) {
		// Circle preview
		clearPreviewArrow(state);
		renderPreviewCircle(state, geometry, source, color);
	} else {
		// Arrow preview
		clearPreviewCircle(state);
		renderPreviewArrowSvg(state, geometry, source, target, color);
	}
}

function renderPreviewCircle(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry,
	square: Square,
	color: string
): void {
	const { previewAdd, previewRemoveOpacity } = VISUAL_CONFIG.circle;

	// Determine add vs remove style
	const existingCircle = state.annotations.circles.get(square);
	const isRemove = existingCircle !== undefined && existingCircle.color === color;
	const opacity = isRemove ? previewRemoveOpacity : previewAdd.opacity;

	assert(state.slotRoots, 'Expected slotRoots to be initialized before rendering preview');
	const params = {
		parent: state.slotRoots.drag,
		dataId: 'annotation-circle-preview',
		square,
		color,
		radius: previewAdd.radius,
		strokeWidth: previewAdd.strokeWidth,
		opacity,
		geometry
	};

	if (state.previewSvg.circle) {
		updateAnnotationCircleSvg(state.previewSvg.circle, params);
	} else {
		state.previewSvg.circle = createAnnotationCircleSvg(params);
	}
}

function renderPreviewArrowSvg(
	state: AnnotationsStateInternal,
	geometry: SceneRenderGeometry,
	from: Square,
	to: Square,
	color: string
): void {
	const { committed, previewAdd, previewRemoveOpacity } = VISUAL_CONFIG.arrow;

	// Determine add vs remove style
	const arrowKey = arrowAnnotationKeyNormalized(from, to);
	const existingArrow = state.annotations.arrows.get(arrowKey);
	const isRemove = existingArrow !== undefined && existingArrow.color === color;
	const visual = isRemove ? committed : previewAdd;
	const opacity = isRemove ? previewRemoveOpacity : previewAdd.opacity;

	const markerId = state.svgIds.makeId('annotations', 'arrowhead-preview');
	const markerHref = `url(${state.svgIds.makeHref('annotations', 'arrowhead-preview')})`;

	const params = {
		defsRoot: state.slotRoots!.defs,
		visualRoot: state.slotRoots!.drag,
		markerDataId: 'annotation-arrowhead-preview',
		markerPathDataId: 'annotation-arrowhead-path-preview',
		lineDataId: 'annotation-arrow-preview',
		markerId,
		markerHref,
		from,
		to,
		color,
		opacity,
		visual,
		geometry
	};

	if (state.previewSvg.arrow) {
		updateAnnotationArrowSvg(state.previewSvg.arrow, params);
	} else {
		state.previewSvg.arrow = createAnnotationArrowSvg(params);
	}
}

function clearPreviewCircle(state: AnnotationsStateInternal): void {
	if (state.previewSvg.circle) {
		removeAnnotationCircleSvg(state.previewSvg.circle);
		state.previewSvg.circle = null;
	}
}

function clearPreviewArrow(state: AnnotationsStateInternal): void {
	if (state.previewSvg.arrow) {
		removeAnnotationArrowSvg(state.previewSvg.arrow);
		state.previewSvg.arrow = null;
	}
}
