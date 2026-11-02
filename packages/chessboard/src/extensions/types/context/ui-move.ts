import { PendingUIMoveRequest } from '../../../state/change/types/ui-move.js';

export interface ExtensionPendingUIMoveRequestContext {
	readonly request: PendingUIMoveRequest;
}
