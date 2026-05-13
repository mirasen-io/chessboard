import { cloneDeep } from 'es-toolkit';
import { isUpdateContextRenderable } from '../../types/context/update.js';
import type { ExtensionCreateInstanceOptions } from '../../types/extension.js';
import {
	extensionCreateInternalBase,
	extensionDestroyBase,
	extensionMountBase,
	extensionUnmountBase
} from '../common/helpers.js';
import {
	annotationsClear,
	annotationsGetArrows,
	annotationsGetCircles,
	annotationsGetClearOnCoreInteraction,
	annotationsGetDrawButton,
	annotationsSetArrow,
	annotationsSetArrows,
	annotationsSetCircle,
	annotationsSetCircles,
	annotationsSetClearOnCoreInteraction,
	annotationsSetDrawButton
} from './api.js';
import { clearCommittedAnnotations, hasCommittedAnnotations } from './committed.js';
import {
	cancelAnnotationsDrag,
	completeAnnotationsDrag,
	handleAnnotationsEvent
} from './interaction.js';
import { normalizeAnnotationsConfig, normalizeInitialAnnotations } from './normalize.js';
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

export function createAnnotations(options: AnnotationsInitOptions = {}): AnnotationsDefinition {
	const normalizedConfig = normalizeAnnotationsConfig(options.config);
	const normalizedAnnotations = normalizeInitialAnnotations(options.annotations);

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
		config,
		activeDrawGesture: null
	};
}

function extensionCleanSvg(state: AnnotationsStateInternal): void {
	state.svg.svgCircles.clear();
	state.svg.svgArrows.clear();
}

function createAnnotationsPublicAPI(state: AnnotationsStateInternal): AnnotationsPublicAPI {
	return {
		getCircles() {
			return annotationsGetCircles(state);
		},
		getArrows() {
			return annotationsGetArrows(state);
		},
		setCircles(circles) {
			annotationsSetCircles(state, circles);
		},
		setArrows(arrows) {
			annotationsSetArrows(state, arrows);
		},
		circle(square, annotation) {
			annotationsSetCircle(state, square, annotation);
		},
		arrow(from, to, annotation) {
			annotationsSetArrow(state, from, to, annotation);
		},
		clear() {
			annotationsClear(state);
		},
		get clearOnCoreInteraction() {
			return annotationsGetClearOnCoreInteraction(state);
		},
		set clearOnCoreInteraction(value) {
			annotationsSetClearOnCoreInteraction(state, value);
		},
		get drawButton() {
			return annotationsGetDrawButton(state);
		},
		set drawButton(value) {
			annotationsSetDrawButton(state, value);
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
			internalState.runtimeSurface.events.subscribeEvent('contextmenu');
		},
		onUpdate(context) {
			if (
				internalState.config.clearOnCoreInteraction &&
				hasCommittedAnnotations(internalState) &&
				context.mutation.hasMutation({
					causes: ['runtime.interaction.completeCoreDragTo']
				})
			) {
				clearCommittedAnnotations(internalState);
				context.invalidation.markDirty(DirtyLayer.COMMITTED);
			}

			if (
				context.mutation.hasMutation({
					causes: ['layout.refreshGeometry']
				}) &&
				isUpdateContextRenderable(context)
			) {
				context.invalidation.markDirty(DirtyLayer.COMMITTED);
			}
		},
		render(context) {
			if (!(context.invalidation.dirtyLayers & DirtyLayer.COMMITTED)) {
				return;
			}
			renderCommittedCircles(internalState, context.currentFrame.layout.geometry);
			renderCommittedArrows(internalState, context.currentFrame.layout.geometry);
		},
		onEvent(context) {
			handleAnnotationsEvent(internalState, context);
		},
		completeDrag(session) {
			completeAnnotationsDrag(internalState, session);
		},
		cancelDrag(session) {
			cancelAnnotationsDrag(internalState, session);
		},
		unmount() {
			internalState.runtimeSurface.events.unsubscribeEvent('pointerdown');
			internalState.runtimeSurface.events.unsubscribeEvent('contextmenu');
			extensionUnmountBase<ExtensionSlotsType>(internalState);
			extensionCleanSvg(internalState);
			internalState.activeDrawGesture = null;
		},
		destroy() {
			internalState.runtimeSurface.events.unsubscribeEvent('pointerdown');
			internalState.runtimeSurface.events.unsubscribeEvent('contextmenu');
			extensionDestroyBase<ExtensionSlotsType>(internalState);
			extensionCleanSvg(internalState);
			internalState.activeDrawGesture = null;
		},
		getPublic() {
			return publicAPI;
		}
	};
}
