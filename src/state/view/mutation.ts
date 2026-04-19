import type { MutationSession } from '../../mutation/types.js';

export type ViewStateMutationPayloadByCause = {
	'state.view.setOrientation': undefined;
};

export type ViewStateMutationSession = MutationSession<ViewStateMutationPayloadByCause>;
