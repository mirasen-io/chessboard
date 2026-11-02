import { MoveRequest, RolePromotionCode, Square } from '../../board/types/internal.js';
import { MoveDestinationSnapshot } from '../../interaction/types/internal.js';

export type PendingUIMoveRequestStatus = 'unresolved' | 'deferred' | 'resolved';

export interface PendingUIMoveRequestSnapshot {
	readonly status: PendingUIMoveRequestStatus;
	readonly sourceSquare: Square;
	readonly destination: MoveDestinationSnapshot;
	readonly canBeAutoResolved: boolean;
	readonly resolvedMoveRequest: MoveRequest | null;
}

export interface PendingUIMoveRequest extends PendingUIMoveRequestSnapshot {
	defer(): void;
	resolve(request: MoveRequest): void;
	autoresolve(): void;
	getSnapshot(): PendingUIMoveRequestSnapshot;
}

export interface PendingUIMoveRequestInternal {
	readonly sourceSquare: Square;
	readonly destination: MoveDestinationSnapshot;
	status: PendingUIMoveRequestStatus;
	resolvedMoveRequest: MoveRequest | null;
}

export interface DeferredUIMoveResolutionDetails {
	readonly promotedTo: RolePromotionCode;
}
