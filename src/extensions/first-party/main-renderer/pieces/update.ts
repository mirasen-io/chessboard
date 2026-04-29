import { setsEqual } from '../../../../helpers/util.js';
import { piecePositionsEqual } from '../../../../state/board/check.js';
import { Square } from '../../../../state/board/types/internal.js';
import { ExtensionCleanAnimationContext } from '../../../types/context/animation.js';
import {
	ExtensionUpdateContext,
	isUpdateContextRenderable
} from '../../../types/context/update.js';
import { DirtyLayer } from '../types/extension.js';
import { calculateSuppressedSquares } from './suppress.js';
import { MainRendererPiecesInternal } from './types.js';

export function rendererPiecesOnUpdate(
	state: MainRendererPiecesInternal,
	context: ExtensionUpdateContext,
	animationSuppressedSquares: ReadonlySet<Square>
): void {
	if (
		!isUpdateContextRenderable(context) ||
		!context.mutation.hasMutation({
			prefixes: ['state.'],
			causes: ['layout.refreshGeometry']
		})
	) {
		return;
	}

	const previousSuppressedSquares = state.suppressedSquares;
	state.suppressedSquares = calculateSuppressedSquares(state, context, animationSuppressedSquares);
	const needsRender =
		context.mutation.hasMutation({ causes: ['layout.refreshGeometry'] }) ||
		!context.previousFrame ||
		!setsEqual(previousSuppressedSquares, state.suppressedSquares) ||
		!piecePositionsEqual(context.currentFrame.state.board, context.previousFrame.state.board);

	if (!needsRender) return;
	context.invalidation.markDirty(DirtyLayer.Pieces);
}

export function rendererPiecesRefreshSuppressedSquares(
	state: MainRendererPiecesInternal,
	context: ExtensionCleanAnimationContext,
	animationSuppressedSquares: ReadonlySet<Square>
): void {
	const newSuppressedSquares = calculateSuppressedSquares(
		state,
		context,
		animationSuppressedSquares
	);
	const needsRender = !setsEqual(state.suppressedSquares, newSuppressedSquares);
	state.suppressedSquares = newSuppressedSquares;
	if (needsRender) {
		context.invalidation.markDirty(DirtyLayer.Pieces);
	}
}
