import assert from '@ktarmyshov/assert';
import { isEmptyPieceCode } from '../../state/board/check.js';
import { Square } from '../../state/board/types/internal.js';
import { createPendingUIMoveRequest } from '../../state/change/factory/ui-move.js';
import { PendingUIMoveRequest } from '../../state/change/types/ui-move.js';
import { canMoveTo } from '../input/controller/helpers.js';
import { RuntimeInternal } from '../types/main.js';

function assertResolvedAfterAutoResolve(
	request: PendingUIMoveRequest
): asserts request is PendingUIMoveRequest & {
	status: 'resolved';
} {
	if (request.status !== 'resolved') {
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
	const pendingUIMoveRequest = createPendingUIMoveRequest(dragSession.sourceSquare, destination);
	state.extensionSystem.onUIMoveRequest({ request: pendingUIMoveRequest });
	if (pendingUIMoveRequest.status === 'deferred') {
		state.state.change.setDeferredUIMoveRequest(pendingUIMoveRequest, mutationSession);
	} else if (pendingUIMoveRequest.status === 'unresolved') {
		// Try to auto-resolve if possible (e.g. if there are no promotion choices to be made)
		pendingUIMoveRequest.autoresolve();
		assertResolvedAfterAutoResolve(pendingUIMoveRequest);
	}
	if (pendingUIMoveRequest.status === 'resolved') {
		const moveRequest = pendingUIMoveRequest.resolvedMoveRequest;
		if (moveRequest !== null) {
			state.state.board.move(moveRequest, mutationSession);
		}
	}
	interaction.clear(mutationSession);
}
