import {
	calculateAnimationPlan,
	CalculateAnimationTracksOptions
} from '../../../animation/planner';
import { positionsEqual } from '../../../state/board/helpers';
import type { ExtensionUpdateContext } from '../../types/context/update';
import { isUpdateContextRenderable } from '../../types/context/update';
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

	if (positionsEqual(previousBoard, currentBoard)) return;

	const session = state.runtimeSurface.animation.submit({
		duration: DEFAULT_ANIMATION_DURATION_MS
	});
	// On DropTo exclude the move that user did from the animation plan
	const excludeMove: CalculateAnimationTracksOptions['excludeMove'] =
		context.mutation.hasMutation({ causes: ['runtime.interaction.dropTo'] }) &&
		context.currentFrame.state.change.lastMove
			? {
					fromSq: context.currentFrame.state.change.lastMove.from,
					toSq: context.currentFrame.state.change.lastMove.to
				}
			: undefined;
	const plan = calculateAnimationPlan(previousBoard, currentBoard, session.id, {
		excludeMove
	});
	state.entries.set(session.id, { plan, nodes: null });
}
