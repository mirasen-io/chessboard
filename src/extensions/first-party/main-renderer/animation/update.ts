import assert from '@ktarmyshov/assert';
import { calculateAnimationPlan } from '../../../../animation/planner.js';
import { AnimationTrackExclude } from '../../../../animation/types.js';
import { piecePositionsEqual } from '../../../../state/board/check.js';
import {
	ExtensionUpdateContext,
	isUpdateContextRenderable
} from '../../../types/context/update.js';
import { deriveRuntimeState } from '../helpers.js';
import type { MainRendererAnimationInternal } from './types.js';

const DEFAULT_ANIMATION_DURATION_MS = 180;

export function rendererAnimationOnUpdate(
	state: MainRendererAnimationInternal,
	context: ExtensionUpdateContext
): void {
	if (
		!isUpdateContextRenderable(context) ||
		!context.mutation.hasMutation({ prefixes: ['state.board.', 'state.change.'] }) ||
		!context.previousFrame
	) {
		return;
	}

	const currentState = deriveRuntimeState(context.currentFrame.state);
	const previousState = deriveRuntimeState(context.previousFrame.state);

	const previousBoard = previousState.board;
	const currentBoard = currentState.board;

	if (piecePositionsEqual(previousBoard, currentBoard)) return;

	// On DropTo exclude the move that user did from the animation plan
	const exclude: AnimationTrackExclude[] = [];
	if (
		context.mutation.hasMutation({ causes: ['runtime.interaction.completeDragTo'] }) &&
		currentState.change.lastMove
	) {
		const payloads = context.mutation.getPayloads('runtime.interaction.completeDragTo');
		assert(
			payloads && payloads.length === 1,
			'Expected exactly one payload for runtime.interaction.completeDragTo'
		);
		const dragSession = payloads[0];
		if (dragSession.type === 'lifted-piece-drag') {
			// For piece drag, exclude animation, cause user already "animated" the piece by dragging it
			exclude.push({
				fromSq: currentState.change.lastMove.from,
				toSq: currentState.change.lastMove.to
			});
			exclude.push({
				sq: currentState.change.lastMove.from
			});
			exclude.push({
				sq: currentState.change.lastMove.to
			});
		}
	}
	const plan = calculateAnimationPlan(
		previousBoard,
		currentBoard,
		0 /* placeholder session id for draft plan */,
		{
			exclude
		}
	);
	if (plan.tracks.length === 0) return;
	const session = state.runtimeSurface.animation.submit({
		duration: DEFAULT_ANIMATION_DURATION_MS
	});
	plan.sessionId = session.id;
	state.entries.set(plan.sessionId, { plan, nodes: null });
}
