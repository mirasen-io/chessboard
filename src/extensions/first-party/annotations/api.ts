import { normalizeSquare } from '../../../state/board/normalize.js';
import type { SquareString } from '../../../state/board/types/input.js';
import { denormalizeArrows, denormalizeCircles } from './denormalize.js';
import { markCommittedDirtyAndRequestRender } from './invalidation.js';
import {
	arrowAnnotationKey,
	normalizeArrowAnnotation,
	normalizeCircleAnnotation
} from './normalize.js';
import type { AnnotationsStateInternal } from './types/main.js';
import type {
	ArrowAnnotationPublic,
	ArrowAnnotationValuePublic,
	CircleAnnotationPublic,
	CircleAnnotationValuePublic
} from './types/public.js';

export function annotationsGetCircles(state: AnnotationsStateInternal): CircleAnnotationPublic[] {
	return denormalizeCircles(state.annotations.circles);
}

export function annotationsGetArrows(state: AnnotationsStateInternal): ArrowAnnotationPublic[] {
	return denormalizeArrows(state.annotations.arrows);
}

export function annotationsSetCircles(
	state: AnnotationsStateInternal,
	circles: CircleAnnotationPublic[]
): void {
	state.annotations.circles.clear();
	for (const pub of circles) {
		const circle = normalizeCircleAnnotation(pub);
		state.annotations.circles.set(circle.key, circle);
	}
	markCommittedDirtyAndRequestRender(state);
}

export function annotationsSetArrows(
	state: AnnotationsStateInternal,
	arrows: ArrowAnnotationPublic[]
): void {
	// Validate all entries before mutating state (atomic behavior)
	const normalized = arrows.map((pub) => normalizeArrowAnnotation(pub));
	state.annotations.arrows.clear();
	for (const arrow of normalized) {
		state.annotations.arrows.set(arrow.key, arrow);
	}
	markCommittedDirtyAndRequestRender(state);
}

export function annotationsSetCircle(
	state: AnnotationsStateInternal,
	square: SquareString,
	annotation: CircleAnnotationValuePublic | null
): void {
	const key = normalizeSquare(square);
	if (annotation === null) {
		state.annotations.circles.delete(key);
	} else {
		const normalizedAnnotation = normalizeCircleAnnotation({
			square,
			color: annotation.color
		});
		state.annotations.circles.set(key, normalizedAnnotation);
	}
	markCommittedDirtyAndRequestRender(state);
}

export function annotationsSetArrow(
	state: AnnotationsStateInternal,
	from: SquareString,
	to: SquareString,
	annotation: ArrowAnnotationValuePublic | null
): void {
	const key = arrowAnnotationKey(from, to);
	if (annotation === null) {
		state.annotations.arrows.delete(key);
	} else {
		const normalizedArrow = normalizeArrowAnnotation({
			from,
			to,
			color: annotation.color
		});
		state.annotations.arrows.set(key, normalizedArrow);
	}
	markCommittedDirtyAndRequestRender(state);
}

export function annotationsClear(state: AnnotationsStateInternal): void {
	state.annotations.circles.clear();
	state.annotations.arrows.clear();
	markCommittedDirtyAndRequestRender(state);
}

export function annotationsSetClearOnCoreInteraction(
	state: AnnotationsStateInternal,
	value: boolean
): void {
	state.config.clearOnCoreInteraction = value;
}

export function annotationsGetClearOnCoreInteraction(state: AnnotationsStateInternal): boolean {
	return state.config.clearOnCoreInteraction;
}

export function annotationsSetDrawButton(state: AnnotationsStateInternal, value: number): void {
	state.config.drawButton = value;
}

export function annotationsGetDrawButton(state: AnnotationsStateInternal): number {
	return state.config.drawButton;
}
