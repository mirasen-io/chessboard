import { ExtensionUIMoveRequestContext } from '../../extensions/types/context/ui-move';
import { RolePromotionCode, Square } from '../../state/board/types/internal';
import { MoveDestinationSnapshot } from '../../state/interaction/types/internal';
import { UIMoveRequestContextInternal } from '../types/ui-move';

function createMoveRequestContextInternal(
	sourceSquare: Square,
	destination: MoveDestinationSnapshot
): UIMoveRequestContextInternal {
	return {
		sourceSquare,
		destination,
		status: 'unresolved',
		resolvedMoveRequest: null
	};
}

function moveRequestContextCanBeAutoResolved(state: UIMoveRequestContextInternal): boolean {
	return (
		state.status === 'unresolved' &&
		(state.destination.promotedTo === undefined || state.destination.promotedTo.length <= 1)
	);
}

function assertCanBeDeferred(state: UIMoveRequestContextInternal): void {
	if (state.status !== 'unresolved') {
		throw new Error('Only unresolved move requests can be deferred');
	}
}

function assertCanBeResolved(state: UIMoveRequestContextInternal): void {
	if (state.status === 'resolved') {
		throw new Error('Move request is already resolved');
	}
}

function assertCanBeAutoResolved(
	state: UIMoveRequestContextInternal
): asserts state is UIMoveRequestContextInternal & {
	destination: MoveDestinationSnapshot & {
		promotedTo?: readonly [] | readonly [RolePromotionCode];
	};
} {
	if (!moveRequestContextCanBeAutoResolved(state)) {
		throw new Error(
			'Move request cannot be auto-resolved. Either it is already resolved or deferred, or it requires a promotion choice.'
		);
	}
}

function moveRequestContextAutoResolve(state: UIMoveRequestContextInternal): void {
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

export function createUIMoveRequestContext(
	sourceSquare: Square,
	destination: MoveDestinationSnapshot
): ExtensionUIMoveRequestContext {
	const internalState = createMoveRequestContextInternal(sourceSquare, destination);
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
			return moveRequestContextCanBeAutoResolved(internalState);
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
			moveRequestContextAutoResolve(internalState);
		},
		getSnapshot() {
			return {
				status: internalState.status,
				sourceSquare: internalState.sourceSquare,
				destination: internalState.destination,
				canBeAutoResolved: moveRequestContextCanBeAutoResolved(internalState),
				resolvedMoveRequest: internalState.resolvedMoveRequest
			};
		}
	};
}
