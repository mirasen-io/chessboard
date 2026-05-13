import type { SquareString } from '../../../../state/board/types/input.js';

/** The annotation color resolved from user input modifiers. */
export type AnnotationColorPublic = string;

export interface CircleAnnotationPublic {
	readonly square: SquareString;
	readonly color: AnnotationColorPublic;
}

export interface ArrowAnnotationPublic {
	readonly from: SquareString;
	readonly to: SquareString;
	readonly color: AnnotationColorPublic;
}

export interface AnnotationsInitOptionsConfigModifierColor {
	none?: AnnotationColorPublic;
	ctrl?: AnnotationColorPublic;
	shift?: AnnotationColorPublic;
	alt?: AnnotationColorPublic;
	meta?: AnnotationColorPublic;
}

export interface AnnotationsInitOptionsConfig {
	clearOnCoreInteraction?: boolean;
	drawButton?: number;
	colors?: AnnotationsInitOptionsConfigModifierColor;
}

export interface AnnotationsInitOptionsAnnotations {
	circles?: CircleAnnotationPublic[];
	arrows?: ArrowAnnotationPublic[];
}

export interface AnnotationsInitOptions {
	config?: AnnotationsInitOptionsConfig;
	annotations?: AnnotationsInitOptionsAnnotations;
}

export type CircleAnnotationValuePublic = Omit<CircleAnnotationPublic, 'square'>;

export type ArrowAnnotationValuePublic = Omit<ArrowAnnotationPublic, 'from' | 'to'>;

export interface AnnotationsPublicAPI {
	getCircles(): CircleAnnotationPublic[];
	getArrows(): ArrowAnnotationPublic[];

	setCircles(circles: CircleAnnotationPublic[]): void;
	setArrows(arrows: ArrowAnnotationPublic[]): void;

	circle(square: SquareString, annotation: CircleAnnotationValuePublic | null): void;
	arrow(from: SquareString, to: SquareString, annotation: ArrowAnnotationValuePublic | null): void;

	clear(): void;

	clearOnCoreInteraction: boolean;
	drawButton: number;
}
