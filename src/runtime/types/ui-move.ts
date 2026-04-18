import { ExtensionUIMoveRequestStatus } from '../../extensions/types/context/ui-move';
import { MoveRequest, Square } from '../../state/board/types/internal';
import { MoveDestinationSnapshot } from '../../state/interaction/types/internal';

export interface UIMoveRequestContextInternal {
	readonly sourceSquare: Square;
	readonly destination: MoveDestinationSnapshot;
	status: ExtensionUIMoveRequestStatus;
	resolvedMoveRequest: MoveRequest | null;
}
