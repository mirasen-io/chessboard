import { ExtensionUIMoveRequestStatus } from '../../extensions/types/context/ui-move.js';
import { MoveRequest, Square } from '../../state/board/types/internal.js';
import { MoveDestinationSnapshot } from '../../state/interaction/types/internal.js';

export interface UIMoveRequestContextInternal {
	readonly sourceSquare: Square;
	readonly destination: MoveDestinationSnapshot;
	status: ExtensionUIMoveRequestStatus;
	resolvedMoveRequest: MoveRequest | null;
}
