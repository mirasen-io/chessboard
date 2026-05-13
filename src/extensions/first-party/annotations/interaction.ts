import assert from '@ktarmyshov/assert';
import type { Square } from '../../../state/board/types/internal.js';
import type { ExtensionDragSessionSnapshot } from '../../types/basic/interaction.js';
import type { ExtensionOnEventContext } from '../../types/context/events.js';
import { clearCommittedAnnotations, hasCommittedAnnotations } from './committed.js';
import { markCommittedDirtyAndRequestRender } from './invalidation.js';
import { arrowAnnotationKeyNormalized } from './normalize.js';
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
	assert(context.rawEvent.type === 'pointerdown' || context.rawEvent.type === 'contextmenu');
	if (context.rawEvent.type === 'contextmenu') {
		// Browser context menus are separate from the pointer drag lifecycle.
		// The board owns secondary-button interaction, so suppress the browser menu.
		context.rawEvent.preventDefault();
		return;
	}

	const rawEvent = context.rawEvent as PointerEvent;

	// The configured draw button owns annotation drawing gestures.
	// If configured as primary, drawing intentionally takes precedence over idle-clear.
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

	// Drawing uses the configured draw button above.
	// The remaining primary-button path is reserved for idle-clear.
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
		const gesture = state.activeDrawGesture;
		state.activeDrawGesture = null;
		if (!gesture) return;
		if (session.targetSquare === null) return;

		if (gesture.sourceSquare === session.targetSquare) {
			commitCircleToggle(state, gesture.sourceSquare, gesture.color);
		} else {
			commitArrowToggle(state, gesture.sourceSquare, session.targetSquare, gesture.color);
		}
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

function commitCircleToggle(
	state: AnnotationsStateInternal,
	square: Square,
	color: AnnotationColor
): void {
	const existing = state.annotations.circles.get(square);

	if (existing && existing.color === color) {
		state.annotations.circles.delete(square);
	} else {
		state.annotations.circles.set(square, { key: square, square, color });
	}
	markCommittedDirtyAndRequestRender(state);
}

function commitArrowToggle(
	state: AnnotationsStateInternal,
	from: Square,
	to: Square,
	color: AnnotationColor
): void {
	const key = arrowAnnotationKeyNormalized(from, to);
	const existing = state.annotations.arrows.get(key);

	if (existing && existing.color === color) {
		state.annotations.arrows.delete(key);
	} else {
		state.annotations.arrows.set(key, { key, from, to, color });
	}
	markCommittedDirtyAndRequestRender(state);
}
