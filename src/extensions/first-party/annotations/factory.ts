import { cloneDeep } from 'es-toolkit';
import type { Square } from '../../../state/board/types/internal.js';
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
	annotationsGetDrawModifier,
	annotationsSetArrow,
	annotationsSetArrows,
	annotationsSetCircle,
	annotationsSetCircles,
	annotationsSetClearOnCoreInteraction,
	annotationsSetDrawButton,
	annotationsSetDrawModifier
} from './api.js';
import { clearCommittedAnnotations, hasCommittedAnnotations } from './committed.js';
import {
	cancelAnnotationsDrag,
	completeAnnotationsDrag,
	handleAnnotationsEvent
} from './interaction.js';
import { normalizeAnnotationsConfig, normalizeInitialAnnotations } from './normalize.js';
import { renderCommittedAnnotations } from './render/committed.js';
import { renderPreviewAnnotations } from './render/preview.js';
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
		activeDrawGesture: null,
		activeDrawPreviewTarget: null,
		previewSvg: { circle: null, arrow: null }
	};
}

function extensionCleanSvg(state: AnnotationsStateInternal): void {
	state.svg.svgCircles.clear();
	state.svg.svgArrows.clear();
	if (state.previewSvg.arrow) {
		state.previewSvg.arrow.marker.remove();
	}
	state.previewSvg.circle = null;
	state.previewSvg.arrow = null;
}

function extensionClean(state: AnnotationsStateInternal): void {
	state.runtimeSurface.events.unsubscribeEvent('pointerdown');
	state.runtimeSurface.events.unsubscribeEvent('contextmenu');
	state.activeDrawGesture = null;
	state.activeDrawPreviewTarget = null;
	extensionCleanSvg(state);
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
		},
		get drawModifier() {
			return annotationsGetDrawModifier(state);
		},
		set drawModifier(value) {
			annotationsSetDrawModifier(state, value);
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
				if (
					internalState.activeDrawPreviewTarget !== null ||
					internalState.previewSvg.circle !== null ||
					internalState.previewSvg.arrow !== null
				) {
					context.invalidation.markDirty(DirtyLayer.PREVIEW);
				}
			}

			// Preview target tracking from ext:draw drag session
			let nextPreviewTarget: Square | null = null;
			if (internalState.activeDrawGesture !== null) {
				const dragSession = context.currentFrame.state.interaction.dragSession;
				if (
					dragSession &&
					dragSession.type === 'ext:draw' &&
					'owner' in dragSession &&
					dragSession.owner === EXTENSION_ID
				) {
					nextPreviewTarget = dragSession.targetSquare;
				}
			}

			if (nextPreviewTarget !== internalState.activeDrawPreviewTarget) {
				internalState.activeDrawPreviewTarget = nextPreviewTarget;
				context.invalidation.markDirty(DirtyLayer.PREVIEW);
				context.invalidation.markDirty(DirtyLayer.COMMITTED);
			} else if (
				nextPreviewTarget === null &&
				(internalState.previewSvg.circle !== null || internalState.previewSvg.arrow !== null)
			) {
				context.invalidation.markDirty(DirtyLayer.PREVIEW);
				context.invalidation.markDirty(DirtyLayer.COMMITTED);
			}
		},
		render(context) {
			if (context.invalidation.dirtyLayers & DirtyLayer.COMMITTED) {
				renderCommittedAnnotations(internalState, context.currentFrame.layout.geometry);
			}
			if (context.invalidation.dirtyLayers & DirtyLayer.PREVIEW) {
				renderPreviewAnnotations(internalState, context.currentFrame.layout.geometry);
			}
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
			extensionClean(internalState);
			extensionUnmountBase<ExtensionSlotsType>(internalState);
		},
		destroy() {
			extensionClean(internalState);
			extensionDestroyBase<ExtensionSlotsType>(internalState);
		},
		getPublic() {
			return publicAPI;
		}
	};
}
