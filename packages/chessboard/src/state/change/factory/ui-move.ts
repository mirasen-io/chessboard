import { RolePromotionCode, Square } from '../../board/types/internal.js';
import { MoveDestinationSnapshot } from '../../interaction/types/internal.js';
import { PendingUIMoveRequest, PendingUIMoveRequestInternal } from '../types/ui-move.js';

function createPendingUIMoveRequestInternal(
	sourceSquare: Square,
	destination: MoveDestinationSnapshot
): PendingUIMoveRequestInternal {
	return {
		sourceSquare,
		destination,
		status: 'unresolved',
		resolvedMoveRequest: null
	};
}

function pendingUIMoveRequestCanBeAutoResolved(state: PendingUIMoveRequestInternal): boolean {
	return (
		state.status === 'unresolved' &&
		(state.destination.promotedTo === undefined || state.destination.promotedTo.length <= 1)
	);
}

function assertCanBeDeferred(state: PendingUIMoveRequestInternal): void {
	if (state.status !== 'unresolved') {
		throw new Error('Only unresolved move requests can be deferred');
	}
}

function assertCanBeResolved(state: PendingUIMoveRequestInternal): void {
	if (state.status === 'resolved') {
		throw new Error('Move request is already resolved');
	}
}

function assertCanBeAutoResolved(
	state: PendingUIMoveRequestInternal
): asserts state is PendingUIMoveRequestInternal & {
	destination: MoveDestinationSnapshot & {
		promotedTo?: readonly [] | readonly [RolePromotionCode];
	};
} {
	if (!pendingUIMoveRequestCanBeAutoResolved(state)) {
		throw new Error(
			'Move request cannot be auto-resolved. Either it is already resolved or deferred, or it requires a promotion choice.'
		);
	}
}

function pendingUIMoveRequestAutoResolve(state: PendingUIMoveRequestInternal): void {
	assertCanBeAutoResolved(state);

	const promotedTo =
		state.destination.promotedTo?.length === 1 ? state.destination.promotedTo[0] : undefined;

	state.status = 'resolved';
	state.resolvedMoveRequest = {
		from: state.sourceSquare,
		to: state.destination.to,
		...(state.destination.capturedSquare !== undefined
			? { capturedSquare: state.destination.capturedSquare }
			: {}),
		...(state.destination.secondary !== undefined
			? { secondary: state.destination.secondary }
			: {}),
		...(promotedTo !== undefined ? { promotedTo } : {})
	};
}

export function createPendingUIMoveRequest(
	sourceSquare: Square,
	destination: MoveDestinationSnapshot
): PendingUIMoveRequest {
	const internalState = createPendingUIMoveRequestInternal(sourceSquare, destination);
	return {
		get status() {
			return internalState.status;
		},
		get sourceSquare() {
			return internalState.sourceSquare;
		},
		get destination() {
			return internalState.destination;
		},
		get canBeAutoResolved() {
			return pendingUIMoveRequestCanBeAutoResolved(internalState);
		},
		get resolvedMoveRequest() {
			return internalState.resolvedMoveRequest;
		},
		defer() {
			assertCanBeDeferred(internalState);
			internalState.status = 'deferred';
		},
		resolve(request) {
			assertCanBeResolved(internalState);
			internalState.status = 'resolved';
			internalState.resolvedMoveRequest = request;
		},
		autoresolve() {
			pendingUIMoveRequestAutoResolve(internalState);
		},
		getSnapshot() {
			return {
				status: internalState.status,
				sourceSquare: internalState.sourceSquare,
				destination: internalState.destination,
				canBeAutoResolved: pendingUIMoveRequestCanBeAutoResolved(internalState),
				resolvedMoveRequest: internalState.resolvedMoveRequest
			};
		}
	};
}
