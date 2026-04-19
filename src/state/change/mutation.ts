import type { MutationSession } from '../../mutation/types.js';

export type ChangeStateMutationPayloadByCause = {
	'state.change.setLastMove': undefined;
	'state.change.setDeferredUIMoveRequestContext': undefined;
};

export type ChangeStateMutationSession = MutationSession<ChangeStateMutationPayloadByCause>;
