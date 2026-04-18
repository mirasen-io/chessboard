import type { MutationSession } from '../../mutation/types';

export type ViewStateMutationPayloadByCause = {
	'state.view.setOrientation': undefined;
};

export type ViewStateMutationSession = MutationSession<ViewStateMutationPayloadByCause>;
