import { denormalizeSquare } from '../../../state/board/denormalize.js';
import type {
	ArrowAnnotation,
	ArrowAnnotationKey,
	CircleAnnotation,
	CircleAnnotationKey
} from './types/internal.js';
import type { ArrowAnnotationPublic, CircleAnnotationPublic } from './types/public.js';

export function denormalizeCircles(
	circles: Map<CircleAnnotationKey, CircleAnnotation>
): CircleAnnotationPublic[] {
	const result: CircleAnnotationPublic[] = [];
	for (const circle of circles.values()) {
		result.push({
			square: denormalizeSquare(circle.square),
			color: circle.color
		});
	}
	return result;
}

export function denormalizeArrows(
	arrows: Map<ArrowAnnotationKey, ArrowAnnotation>
): ArrowAnnotationPublic[] {
	const result: ArrowAnnotationPublic[] = [];
	for (const arrow of arrows.values()) {
		result.push({
			from: denormalizeSquare(arrow.from),
			to: denormalizeSquare(arrow.to),
			color: arrow.color
		});
	}
	return result;
}
