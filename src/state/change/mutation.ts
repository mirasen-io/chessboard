import type { MutationSession } from '../../mutation/types';

export type ChangeStateMutationPayloadByCause = {
	'state.change.setLastMove': undefined;
};

export type ChangeStateMutationCause = keyof ChangeStateMutationPayloadByCause;

export type ChangeStateMutationSession = MutationSession<ChangeStateMutationPayloadByCause>;
