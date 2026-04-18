import type { MutationSession } from '../../mutation/types';

export type InteractionStateMutationPayloadByCause = {
	'state.interaction.setSelectedSquare': undefined;
	'state.interaction.setDragSession': undefined;
	'state.interaction.updateDragSessionCurrentTarget': undefined;
	'state.interaction.clear': undefined;
	'state.interaction.clearActive': undefined;
	'state.interaction.setMovability': undefined;
	'state.interaction.updateActiveDestinations': undefined;
};

export type InteractionStateMutationSession =
	MutationSession<InteractionStateMutationPayloadByCause>;
