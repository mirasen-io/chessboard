import type { ExtensionDragSessionSnapshot } from '../../types/basic/interaction.js';
import type { ExtensionOnEventContext } from '../../types/context/events.js';
import { clearCommittedAnnotations, hasCommittedAnnotations } from './committed.js';
import { markCommittedDirtyAndRequestRender } from './invalidation.js';
import type { AnnotationColor, AnnotationsConfig } from './types/internal.js';
import type { AnnotationsStateInternal } from './types/main.js';

const ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE = 'ext:idle-clear' as const;
const ANNOTATIONS_DRAW_DRAG_TYPE = 'ext:draw' as const;

export function resolveAnnotationColor(
	config: AnnotationsConfig,
	rawEvent: PointerEvent
): AnnotationColor {
	if (rawEvent.ctrlKey) return config.colors.ctrl;
	if (rawEvent.shiftKey) return config.colors.shift;
	if (rawEvent.altKey) return config.colors.alt;
	if (rawEvent.metaKey) return config.colors.meta;
	return config.colors.none;
}

export function handleAnnotationsEvent(
	state: AnnotationsStateInternal,
	context: ExtensionOnEventContext
): void {
	if (context.rawEvent.type !== 'pointerdown') return;
	const rawEvent = context.rawEvent as PointerEvent;

	if (rawEvent.button === state.config.drawButton) {
		const targetSquare = context.sceneEvent?.targetSquare;
		if (targetSquare === undefined || targetSquare === null) return;

		const success = state.runtimeSurface.commands.startDrag({
			type: ANNOTATIONS_DRAW_DRAG_TYPE,
			sourceSquare: targetSquare,
			sourcePieceCode: null,
			targetSquare: targetSquare
		});

		if (success) {
			rawEvent.preventDefault();
			state.activeDrawGesture = {
				sourceSquare: targetSquare,
				color: resolveAnnotationColor(state.config, rawEvent)
			};
		}
		return;
	}

	if (rawEvent.button !== 0) return;
	const targetSquare = context.sceneEvent?.targetSquare;
	if (targetSquare === undefined || targetSquare === null) return;
	if (context.runtimeInteractionActionPreview !== null) return;
	if (!state.config.clearOnCoreInteraction) return;
	if (!hasCommittedAnnotations(state)) return;

	const success = state.runtimeSurface.commands.startDrag({
		type: ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE,
		sourceSquare: targetSquare,
		sourcePieceCode: null,
		targetSquare: targetSquare
	});

	if (success) {
		rawEvent.preventDefault();
	}
}

export function completeAnnotationsDrag(
	state: AnnotationsStateInternal,
	session: ExtensionDragSessionSnapshot
): void {
	if (session.type === ANNOTATIONS_DRAW_DRAG_TYPE) {
		state.activeDrawGesture = null;
		return;
	}

	if (session.type !== ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE) return;
	if (session.targetSquare === null) return;
	if (!hasCommittedAnnotations(state)) return;

	clearCommittedAnnotations(state);
	markCommittedDirtyAndRequestRender(state);
}

export function cancelAnnotationsDrag(
	state: AnnotationsStateInternal,
	session: ExtensionDragSessionSnapshot
): void {
	if (session.type === ANNOTATIONS_DRAW_DRAG_TYPE) {
		state.activeDrawGesture = null;
	}
}
