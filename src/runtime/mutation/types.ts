import { LayoutMutationPayloadByCause } from '../../layout/mutation';
import { MutationSession, ReadonlyMutationSession } from '../../mutation/types';
import { BoardStateMutationPayloadByCause } from '../../state/board/mutation';
import { ChangeStateMutationPayloadByCause } from '../../state/change/mutation';
import { InteractionStateMutationPayloadByCause } from '../../state/interaction/mutation';
import { ViewStateMutationPayloadByCause } from '../../state/view/mutation';
import { VisualsStateMutationPayloadByCause } from '../../state/visuals/mutation';

export type BoardRuntimeMutationPayloadByCause = BoardStateMutationPayloadByCause &
	ChangeStateMutationPayloadByCause &
	InteractionStateMutationPayloadByCause &
	ViewStateMutationPayloadByCause &
	VisualsStateMutationPayloadByCause &
	LayoutMutationPayloadByCause & {
		'runtime.interaction.dropTo': undefined;
		'runtime.interaction.releaseTo': undefined;
	};

export type BoardRuntimeMutationCause = keyof BoardRuntimeMutationPayloadByCause;

export type BoardRuntimeMutationSession = MutationSession<BoardRuntimeMutationPayloadByCause>;
export type BoardRuntimeReadonlyMutationSession =
	ReadonlyMutationSession<BoardRuntimeMutationPayloadByCause>;
