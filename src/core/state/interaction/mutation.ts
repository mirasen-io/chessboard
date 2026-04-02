import type { MutationSession } from '../../mutation/types';

export type InteractionStateMutationPayloadByCause = {
	'interaction.state.setSelectedSquare': undefined;
	'interaction.state.setDestinations': undefined;
	'interaction.state.setDragSession': undefined;
	'interaction.state.setCurrentTarget': undefined;
	'interaction.state.setReleaseTargetingActive': undefined;
	'interaction.state.clear': undefined;
	'interaction.state.clearActive': undefined;
};

export type InteractionStateMutationCause = keyof InteractionStateMutationPayloadByCause;

export type InteractionMutationSession = MutationSession<InteractionStateMutationPayloadByCause>;
