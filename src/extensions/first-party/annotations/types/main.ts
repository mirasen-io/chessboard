import type { ExtensionSlotName } from '../../../types/basic/mount.js';
import type { ExtensionDefinition, ExtensionInstance } from '../../../types/extension.js';
import type { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import type { ExtensionInternalBase } from '../../common/types.js';
import type {
	ActiveDrawGesture,
	AnnotationsConfig,
	ArrowAnnotation,
	ArrowAnnotationKey,
	CircleAnnotation,
	CircleAnnotationKey
} from './internal.js';
import type { AnnotationsPublicAPI } from './public.js';

export const EXTENSION_SLOTS = [
	'defs',
	'overPieces',
	'drag'
] as const satisfies readonly ExtensionSlotName[];
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'annotations' as const;

export type AnnotationsDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	AnnotationsPublicAPI
>;

export type AnnotationsInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	AnnotationsPublicAPI
>;

export interface RenderedArrowSvg {
	readonly line: SVGLineElement;
	readonly marker: SVGMarkerElement;
	readonly markerPath: SVGPathElement;
}

export interface AnnotationsStateInternalSvg {
	readonly svgCircles: Map<CircleAnnotationKey, SVGCircleElement>;
	readonly svgArrows: Map<ArrowAnnotationKey, RenderedArrowSvg>;
}

export interface AnnotationsStateInternalAnnotations {
	readonly circles: Map<CircleAnnotationKey, CircleAnnotation>;
	readonly arrows: Map<ArrowAnnotationKey, ArrowAnnotation>;
}

export interface AnnotationsStateInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	// Future render wiring:
	// public API mutations will need to request a render, but we still need to decide
	// which annotations-specific dirty/invalidation flag should be set before
	// calling state.runtimeSurface.commands.requestRender().
	readonly runtimeSurface: ExtensionRuntimeSurface;
	readonly svg: AnnotationsStateInternalSvg;
	readonly annotations: AnnotationsStateInternalAnnotations;
	readonly config: AnnotationsConfig;
	activeDrawGesture: ActiveDrawGesture | null;
}
