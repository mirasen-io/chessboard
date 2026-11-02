import type { Square } from '../../../state/board/types/internal.js';
import type { ExtensionUpdateContext } from '../../types/context/update.js';
import { isUpdateContextRenderable } from '../../types/context/update.js';
import { clearCommittedAnnotations, hasCommittedAnnotations } from './committed.js';
import { DirtyLayer } from './types/internal.js';
import type { AnnotationsStateInternal } from './types/main.js';
import { EXTENSION_ID } from './types/main.js';

export function annotationsOnUpdate(
	state: AnnotationsStateInternal,
	context: ExtensionUpdateContext
): void {
	if (
		state.config.clearOnCoreInteraction &&
		hasCommittedAnnotations(state) &&
		context.mutation.hasMutation({
			causes: ['runtime.interaction.completeCoreDragSessionTo']
		})
	) {
		clearCommittedAnnotations(state);
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
			state.activeDrawPreviewTarget !== null ||
			state.previewSvg.circle !== null ||
			state.previewSvg.arrow !== null
		) {
			context.invalidation.markDirty(DirtyLayer.PREVIEW);
		}
	}

	// Preview target tracking from ext:draw drag session
	let nextPreviewTarget: Square | null = null;
	if (state.activeDrawGesture !== null) {
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

	if (nextPreviewTarget !== state.activeDrawPreviewTarget) {
		state.activeDrawPreviewTarget = nextPreviewTarget;
		context.invalidation.markDirty(DirtyLayer.PREVIEW);
		context.invalidation.markDirty(DirtyLayer.COMMITTED);
	} else if (
		nextPreviewTarget === null &&
		(state.previewSvg.circle !== null || state.previewSvg.arrow !== null)
	) {
		context.invalidation.markDirty(DirtyLayer.PREVIEW);
		context.invalidation.markDirty(DirtyLayer.COMMITTED);
	}
}
