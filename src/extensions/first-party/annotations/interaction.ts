import type { ExtensionDragSessionSnapshot } from '../../types/basic/interaction.js';
import type { ExtensionOnEventContext } from '../../types/context/events.js';
import { clearCommittedAnnotations, hasCommittedAnnotations } from './committed.js';
import { markCommittedDirtyAndRequestRender } from './invalidation.js';
import type { AnnotationsStateInternal } from './types/main.js';

const ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE = 'ext:idle-clear' as const;

export function handleAnnotationsEvent(
	state: AnnotationsStateInternal,
	context: ExtensionOnEventContext
): void {
	if (context.rawEvent.type !== 'pointerdown') return;
	const rawEvent = context.rawEvent as PointerEvent;
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
		context.rawEvent.preventDefault();
	}
}

export function completeAnnotationsDrag(
	state: AnnotationsStateInternal,
	session: ExtensionDragSessionSnapshot
): void {
	if (session.type !== ANNOTATIONS_IDLE_CLEAR_DRAG_TYPE) return;
	if (session.targetSquare === null) return;
	if (!hasCommittedAnnotations(state)) return;

	clearCommittedAnnotations(state);
	markCommittedDirtyAndRequestRender(state);
}
