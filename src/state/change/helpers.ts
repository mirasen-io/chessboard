import { ExtensionUIMoveRequestContextSnapshot } from '../../extensions/types/context/ui-move';
import { setsEqual } from '../../helpers/util';
import type {
	MoveBaseSnapshot,
	MoveRequest,
	MoveRequestBase,
	MoveSnapshot
} from '../board/types/internal';
import { MoveDestinationSnapshot } from '../interaction/types/internal';

function baseMovesEqual(moveA: MoveBaseSnapshot, moveB: MoveBaseSnapshot): boolean {
	const diffs: boolean[] = [
		moveA.from !== moveB.from,
		moveA.to !== moveB.to,
		moveA.piece !== moveB.piece
	];
	return !diffs.some(Boolean);
}

export function movesEqual(moveA: MoveSnapshot | null, moveB: MoveSnapshot | null): boolean {
	if (moveA === null && moveB === null) {
		return true;
	}
	if (moveA === null || moveB === null) {
		return false;
	}
	if (!baseMovesEqual(moveA, moveB)) {
		return false;
	}
	const diffs: boolean[] = [
		moveA.promotedTo !== moveB.promotedTo,
		moveA.captured?.piece !== moveB.captured?.piece,
		moveA.captured?.square !== moveB.captured?.square
	];
	if (diffs.some(Boolean)) {
		return false;
	}
	// Now check secondary moves
	if (moveA.secondary === undefined && moveB.secondary === undefined) {
		return true;
	}
	if (moveA.secondary === undefined || moveB.secondary === undefined) {
		return false;
	}
	return movesEqual(moveA.secondary, moveB.secondary);
}

export function moveRequestBasesEqual(
	requestA: MoveRequestBase | null,
	requestB: MoveRequestBase | null
): boolean {
	if (requestA === null && requestB === null) {
		return true;
	}
	if (requestA === null || requestB === null) {
		return false;
	}
	return requestA.from === requestB.from && requestA.to === requestB.to;
}

export function moveRequestsEqual(
	requestA: MoveRequest | null,
	requestB: MoveRequest | null
): boolean {
	if (requestA === null && requestB === null) {
		return true;
	}
	if (requestA === null || requestB === null) {
		return false;
	}
	// Compare relevant properties of MoveRequest here
	// Assuming MoveRequest has properties 'from' and 'to' for example
	return (
		moveRequestBasesEqual(requestA, requestB) &&
		requestA.capturedSquare === requestB.capturedSquare &&
		requestA.promotedTo === requestB.promotedTo &&
		moveRequestBasesEqual(requestA.secondary ?? null, requestB.secondary ?? null)
	);
}

export function moveDestinationsEqual(
	destA: MoveDestinationSnapshot | null,
	destB: MoveDestinationSnapshot | null
): boolean {
	if (destA === null && destB === null) {
		return true;
	}
	if (destA === null || destB === null) {
		return false;
	}
	return (
		destA.to === destB.to &&
		destA.capturedSquare === destB.capturedSquare &&
		setsEqual(new Set(destA.promotedTo ?? []), new Set(destB.promotedTo ?? [])) &&
		moveRequestBasesEqual(destA.secondary ?? null, destB.secondary ?? null)
	);
}

export function uiMoveRequestContextsEqual(
	contextA: ExtensionUIMoveRequestContextSnapshot | null,
	contextB: ExtensionUIMoveRequestContextSnapshot | null
): boolean {
	if (contextA === null && contextB === null) {
		return true;
	}
	if (contextA === null || contextB === null) {
		return false;
	}
	// Compare relevant properties of UIMoveRequestContext here
	// Assuming UIMoveRequestContext has properties 'from' and 'to' for example
	return (
		contextA.status === contextB.status &&
		contextA.sourceSquare === contextB.sourceSquare &&
		moveDestinationsEqual(contextA.destination, contextB.destination) &&
		contextA.canBeAutoResolved === contextB.canBeAutoResolved &&
		moveRequestsEqual(contextA.resolvedMoveRequest, contextB.resolvedMoveRequest)
	);
}
