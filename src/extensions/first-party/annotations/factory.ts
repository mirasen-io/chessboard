import { cloneDeep } from 'es-toolkit';
import { normalizeSquare } from '../../../state/board/normalize.js';
import { isUpdateContextRenderable } from '../../types/context/update.js';
import type { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionMountBase,
	extensionUnmountBase
} from '../common/helpers.js';
import { denormalizeArrows, denormalizeCircles } from './denormalize.js';
import {
	arrowAnnotationKey,
	normalizeAnnotationsConfig,
	normalizeArrowAnnotation,
	normalizeCircleAnnotation,
	normalizeInitialAnnotations
} from './normalize.js';
import { renderCommittedArrows } from './render-arrows.js';
import { renderCommittedCircles } from './render-circles.js';
import { DirtyLayer, type AnnotationsConfig } from './types/internal.js';
import type {
	AnnotationsDefinition,
	AnnotationsInstance,
	AnnotationsStateInternal,
	AnnotationsStateInternalAnnotations,
	ExtensionSlotsType
} from './types/main.js';
import { EXTENSION_ID, EXTENSION_SLOTS } from './types/main.js';
import type { AnnotationsInitOptions, AnnotationsPublicAPI } from './types/public.js';

const ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE = 'ext:idle-clear' as const;

export function createAnnotations(options?: AnnotationsInitOptions): AnnotationsDefinition {
	const normalizedConfig = normalizeAnnotationsConfig(options?.config);
	const normalizedAnnotations = normalizeInitialAnnotations(options?.annotations);

	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance(runtimeOptions) {
			return createAnnotationsInstance(normalizedConfig, normalizedAnnotations, runtimeOptions);
		}
	};
}

function createAnnotationsInternal(
	normalizedConfig: AnnotationsConfig,
	normalizedAnnotations: AnnotationsStateInternalAnnotations,
	runtimeOptions: ExtensionCreateInstanceOptions
): AnnotationsStateInternal {
	// Clone to ensure each instance has independent mutable state
	const config = cloneDeep(normalizedConfig);
	const annotations: AnnotationsStateInternalAnnotations = {
		circles: new Map(normalizedAnnotations.circles),
		arrows: new Map(normalizedAnnotations.arrows)
	};

	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(runtimeOptions),
		runtimeSurface: runtimeOptions.runtimeSurface,
		svg: {
			svgCircles: new Map(),
			svgArrows: new Map()
		},
		annotations,
		config
	};
}

function extensionCleanSvg(state: AnnotationsStateInternal): void {
	state.svg.svgCircles.clear();
	state.svg.svgArrows.clear();
}

function markDirtyAndRequestRender(state: AnnotationsStateInternal, layers: number): void {
	state.runtimeSurface.invalidation.markDirty(layers);
	state.runtimeSurface.commands.requestRender({ state: true });
}

function hasCommittedAnnotations(state: AnnotationsStateInternal): boolean {
	return state.annotations.circles.size > 0 || state.annotations.arrows.size > 0;
}

function createAnnotationsPublicAPI(state: AnnotationsStateInternal): AnnotationsPublicAPI {
	return {
		getCircles() {
			return denormalizeCircles(state.annotations.circles);
		},
		getArrows() {
			return denormalizeArrows(state.annotations.arrows);
		},
		setCircles(circles) {
			state.annotations.circles.clear();
			for (const pub of circles) {
				const circle = normalizeCircleAnnotation(pub);
				state.annotations.circles.set(circle.key, circle);
			}
			markDirtyAndRequestRender(state, DirtyLayer.COMMITTED);
		},
		setArrows(arrows) {
			// Validate all entries before mutating state (atomic behavior)
			const normalized = arrows.map((pub) => normalizeArrowAnnotation(pub));
			state.annotations.arrows.clear();
			for (const arrow of normalized) {
				state.annotations.arrows.set(arrow.key, arrow);
			}
			markDirtyAndRequestRender(state, DirtyLayer.COMMITTED);
		},
		circle(square, annotation) {
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
			markDirtyAndRequestRender(state, DirtyLayer.COMMITTED);
		},
		arrow(from, to, annotation) {
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
			markDirtyAndRequestRender(state, DirtyLayer.COMMITTED);
		},
		clear() {
			state.annotations.circles.clear();
			state.annotations.arrows.clear();
			markDirtyAndRequestRender(state, DirtyLayer.COMMITTED);
		},
		setClearOnCoreInteraction(value) {
			state.config.clearOnCoreInteraction = value;
		},
		getClearOnCoreInteraction() {
			return state.config.clearOnCoreInteraction;
		}
	};
}

function createAnnotationsInstance(
	normalizedConfig: AnnotationsConfig,
	normalizedAnnotations: AnnotationsStateInternalAnnotations,
	runtimeOptions: ExtensionCreateInstanceOptions
): AnnotationsInstance {
	const internalState = createAnnotationsInternal(
		normalizedConfig,
		normalizedAnnotations,
		runtimeOptions
	);
	const publicAPI = createAnnotationsPublicAPI(internalState);

	return {
		id: EXTENSION_ID,
		mount(env) {
			extensionMountBase<ExtensionSlotsType>(internalState, env.slotRoots);
			internalState.runtimeSurface.events.subscribeEvent('pointerdown');
		},
		onUpdate(context) {
			const needsRender =
				context.mutation.hasMutation({ causes: ['layout.refreshGeometry'] }) &&
				isUpdateContextRenderable(context);
			if (!needsRender) {
				return;
			}
			context.invalidation.markDirty(DirtyLayer.COMMITTED);
		},
		render(context) {
			if (!(context.invalidation.dirtyLayers & DirtyLayer.COMMITTED)) {
				return;
			}
			renderCommittedCircles(internalState, context.currentFrame.layout.geometry);
			renderCommittedArrows(internalState, context.currentFrame.layout.geometry);
		},
		onEvent(context) {
			if (context.rawEvent.type !== 'pointerdown') return;
			const rawEvent = context.rawEvent as PointerEvent;
			if (rawEvent.button !== 0) return;
			if (!context.sceneEvent?.targetSquare) return;
			if (context.runtimeInteractionActionPreview !== null) return;
			if (!internalState.config.clearOnCoreInteraction) return;
			if (!hasCommittedAnnotations(internalState)) return;

			const success = internalState.runtimeSurface.commands.startDrag({
				type: ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE,
				sourceSquare: context.sceneEvent.targetSquare,
				sourcePieceCode: null,
				targetSquare: context.sceneEvent.targetSquare
			});

			if (success) {
				context.rawEvent.preventDefault();
			}
		},
		completeDrag(session) {
			if (session.type !== ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE) return;
			if (session.targetSquare === null) return;
			if (!hasCommittedAnnotations(internalState)) return;

			internalState.annotations.circles.clear();
			internalState.annotations.arrows.clear();
			markDirtyAndRequestRender(internalState, DirtyLayer.COMMITTED);
		},
		unmount() {
			internalState.runtimeSurface.events.unsubscribeEvent('pointerdown');
			extensionUnmountBase<ExtensionSlotsType>(internalState, EXTENSION_ID);
			extensionCleanSvg(internalState);
		},
		destroy() {
			extensionDestroyBase<ExtensionSlotsType>(internalState, EXTENSION_ID);
			extensionCleanSvg(internalState);
		},
		getPublic() {
			return publicAPI;
		}
	};
}
