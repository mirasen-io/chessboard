import type { MutationSession } from '../../mutation/types';

export type ViewStateMutationPayloadByCause = {
	'state.view.setOrientation': undefined;
	'state.view.setMovability': undefined;
};
export type ViewStateMutationCause = keyof ViewStateMutationPayloadByCause;

export type ViewStateMutationSession = MutationSession<ViewStateMutationPayloadByCause>;
