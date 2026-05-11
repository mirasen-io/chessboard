import { cloneDeep, toMerged } from 'es-toolkit';
import { normalizeSquare } from '../../../state/board/normalize.js';
import type { SquareString } from '../../../state/board/types/input.js';
import type { Square } from '../../../state/board/types/internal.js';
import { DEFAULT_CONFIG } from './constants.js';
import type {
	AnnotationsConfig,
	ArrowAnnotation,
	ArrowAnnotationKey,
	CircleAnnotation,
	CircleAnnotationKey
} from './types/internal.js';
import type { AnnotationsStateInternalAnnotations } from './types/main.js';
import type {
	AnnotationsInitOptionsAnnotations,
	AnnotationsInitOptionsConfig,
	ArrowAnnotationPublic,
	CircleAnnotationPublic
} from './types/public.js';

export function normalizeAnnotationsConfig(
	input?: AnnotationsInitOptionsConfig
): AnnotationsConfig {
	if (!input) {
		return cloneDeep(DEFAULT_CONFIG);
	}
	return toMerged(DEFAULT_CONFIG, input) as AnnotationsConfig;
}

export function circleAnnotationKey(square: SquareString): CircleAnnotationKey {
	return normalizeSquare(square);
}

export function normalizeCircleAnnotation(pub: CircleAnnotationPublic): CircleAnnotation {
	const square = normalizeSquare(pub.square);
	return {
		key: square,
		square,
		color: pub.color
	};
}

export function arrowAnnotationKeyNormalized(from: Square, to: Square): ArrowAnnotationKey {
	if (from === to) {
		throw new Error("Invalid arrow: 'from' and 'to' must be different squares");
	}
	return from * 64 + to;
}

export function arrowAnnotationKey(from: SquareString, to: SquareString): ArrowAnnotationKey {
	const fromKey = normalizeSquare(from);
	const toKey = normalizeSquare(to);
	return arrowAnnotationKeyNormalized(fromKey, toKey);
}

export function normalizeArrowAnnotation(pub: ArrowAnnotationPublic): ArrowAnnotation {
	const from = normalizeSquare(pub.from);
	const to = normalizeSquare(pub.to);
	const key = arrowAnnotationKeyNormalized(from, to);
	return { key, from, to, color: pub.color };
}

export function normalizeInitialAnnotations(
	input?: AnnotationsInitOptionsAnnotations
): AnnotationsStateInternalAnnotations {
	const circles = new Map<CircleAnnotationKey, CircleAnnotation>();
	const arrows = new Map<ArrowAnnotationKey, ArrowAnnotation>();

	if (input?.circles) {
		for (const pub of input.circles) {
			const circle = normalizeCircleAnnotation(pub);
			circles.set(circle.key, circle);
		}
	}

	if (input?.arrows) {
		for (const pub of input.arrows) {
			const arrow = normalizeArrowAnnotation(pub);
			arrows.set(arrow.key, arrow);
		}
	}

	return { circles, arrows };
}
