import type { MutationSession } from '../../mutation/types';

export type ViewStateMutationPayloadByCause = {
	'view.state.setOrientation': undefined;
	'view.state.setMovability': undefined;
};
export type ViewStateMutationCause = keyof ViewStateMutationPayloadByCause;

export type ViewMutationSession = MutationSession<ViewStateMutationPayloadByCause>;
