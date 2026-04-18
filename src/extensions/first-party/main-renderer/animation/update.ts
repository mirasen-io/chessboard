import { calculateAnimationPlan } from '../../../../animation/planner';
import { AnimationTrackExclude } from '../../../../animation/types';
import { piecePositionsEqual } from '../../../../state/board/check';
import { ExtensionUpdateContext, isUpdateContextRenderable } from '../../../types/context/update';
import type { MainRendererAnimationInternal } from './types';

const DEFAULT_ANIMATION_DURATION_MS = 180;

export function rendererAnimationOnUpdate(
	state: MainRendererAnimationInternal,
	context: ExtensionUpdateContext
): void {
	if (
		!isUpdateContextRenderable(context) ||
		!context.mutation.hasMutation({ prefixes: ['state.board.'] }) ||
		!context.previousFrame
	) {
		return;
	}

	const previousBoard = context.previousFrame.state.board;
	const currentBoard = context.currentFrame.state.board;

	if (piecePositionsEqual(previousBoard, currentBoard)) return;

	// On DropTo exclude the move that user did from the animation plan
	const exclude: AnimationTrackExclude[] = [];
	if (
		context.mutation.hasMutation({ causes: ['runtime.interaction.dropTo'] }) &&
		context.currentFrame.state.change.lastMove
	) {
		exclude.push({
			fromSq: context.currentFrame.state.change.lastMove.from,
			toSq: context.currentFrame.state.change.lastMove.to
		});
		exclude.push({
			sq: context.currentFrame.state.change.lastMove.from
		});
		exclude.push({
			sq: context.currentFrame.state.change.lastMove.to
		});
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
