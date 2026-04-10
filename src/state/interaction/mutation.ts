import type { MutationSession } from '../../mutation/types';

export type InteractionStateMutationPayloadByCause = {
	'state.interaction.setSelectedSquare': undefined;
	'state.interaction.setDestinations': undefined;
	'state.interaction.setDragSession': undefined;
	'state.interaction.setCurrentTarget': undefined;
	'state.interaction.setReleaseTargetingActive': undefined;
	'state.interaction.clear': undefined;
	'state.interaction.clearActive': undefined;
};

export type InteractionStateMutationCause = keyof InteractionStateMutationPayloadByCause;

export type InteractionStateMutationSession =
	MutationSession<InteractionStateMutationPayloadByCause>;
