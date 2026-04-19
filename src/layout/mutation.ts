import type { MutationSession } from '../mutation/types.js';

export type LayoutMutationPayloadByCause = {
	'layout.refreshGeometry': undefined;
};

export type LayoutMutationCause = keyof LayoutMutationPayloadByCause;

export type LayoutMutationSession = MutationSession<LayoutMutationPayloadByCause>;
