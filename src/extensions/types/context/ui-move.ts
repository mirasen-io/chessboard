import { MoveRequest, Square } from '../../../state/board/types/internal.js';
import { MoveDestinationSnapshot } from '../../../state/interaction/types/internal.js';

export type ExtensionUIMoveRequestStatus = 'unresolved' | 'deferred' | 'resolved';

export interface ExtensionUIMoveRequestContextSnapshot {
	readonly status: ExtensionUIMoveRequestStatus;
	readonly sourceSquare: Square;
	readonly destination: MoveDestinationSnapshot;
	readonly canBeAutoResolved: boolean;
	readonly resolvedMoveRequest: MoveRequest | null;
}
export interface ExtensionUIMoveRequestContext extends ExtensionUIMoveRequestContextSnapshot {
	defer(): void;
	resolve(request: MoveRequest): void;
	autoresolve(): void;
	getSnapshot(): ExtensionUIMoveRequestContextSnapshot;
}
