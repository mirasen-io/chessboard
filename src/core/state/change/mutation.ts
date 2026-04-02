import type { MutationSession } from '../../mutation/types';

export type ChangeStateMutationPayloadByCause = {
	'change.state.setLastMove': undefined;
};

export type ChangeStateMutationCause = keyof ChangeStateMutationPayloadByCause;

export type ChangeStateMutationSession = MutationSession<ChangeStateMutationPayloadByCause>;
