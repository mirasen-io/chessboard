import assert from '@ktarmyshov/assert';
import { ExtensionUIMoveRequestContext } from '../../extensions/types/context/ui-move';
import { isEmptyPieceCode } from '../../state/board/check';
import { Square } from '../../state/board/types/internal';
import { canMoveTo } from '../input/controller/helpers';
import { RuntimeInternal } from '../types/main';
import { createUIMoveRequestContext } from './ui-move';

function assertResolvedAfterAutoResolve(
	state: ExtensionUIMoveRequestContext
): asserts state is ExtensionUIMoveRequestContext & {
	status: 'resolved';
} {
	if (state.status !== 'resolved') {
		throw new Error('UI move request must be resolved after autoresolve');
	}
}
/**
 * Helper functions for common flow for dropTo and releaseTo interactions
 */
export function uiMoveCompleteTo(state: RuntimeInternal, target: Square): void {
	const mutationSession = state.mutation.getSession();
	const interaction = state.state.interaction;
	const dragSession = interaction.dragSession;

	assert(dragSession !== null, 'dropTo/releaseTo requires an active drag session');
	assert(
		dragSession.targetSquare === target,
		'dropTo/releaseTo target must match drag session current target'
	);
	assert(interaction.selected !== null, 'dropTo/releaseTo requires a selected piece');
	assert(!isEmptyPieceCode(interaction.selected.pieceCode), 'Selected piece must be valid');
	assert(
		dragSession.sourceSquare === interaction.selected.square,
		'drag session source must match selected square'
	);
	assert(
		canMoveTo(interaction.getSnapshot(), target),
		'dropTo/releaseTo target must be a valid move destination'
	);

	// canMoveTo already confirmed we can move, but if 'FREE' movability it can be that there are no activeDestinations for the target square, so we need to handle that case as well
	const destination = interaction.activeDestinations.get(target) ?? { to: target };
	const moveRequestContext = createUIMoveRequestContext(dragSession.sourceSquare, destination);
	state.extensionSystem.onUIMoveRequest(moveRequestContext);
	if (moveRequestContext.status === 'deferred') {
		state.state.change.setDeferredUIMoveRequestContext(moveRequestContext, mutationSession);
	} else if (moveRequestContext.status === 'unresolved') {
		// Try to auto-resolve if possible (e.g. if there are no promotion choices to be made)
		moveRequestContext.autoresolve();
		assertResolvedAfterAutoResolve(moveRequestContext);
	}
	if (moveRequestContext.status === 'resolved') {
		const moveRequest = moveRequestContext.resolvedMoveRequest;
		if (moveRequest !== null) {
			state.state.board.move(moveRequest, mutationSession);
		}
	}
	interaction.clear(mutationSession);
}
