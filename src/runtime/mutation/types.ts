import { LayoutMutationPayloadByCause } from '../../layout/mutation';
import { MutationSession, ReadonlyMutationSession } from '../../mutation/types';
import { BoardStateMutationPayloadByCause } from '../../state/board/mutation';
import { ChangeStateMutationPayloadByCause } from '../../state/change/mutation';
import { InteractionStateMutationPayloadByCause } from '../../state/interaction/mutation';
import { ViewStateMutationPayloadByCause } from '../../state/view/mutation';
import { TransientVisualsMutationPayloadByCause } from '../../transientVisuals/mutation';

export type RuntimeMutationPayloadByCause = BoardStateMutationPayloadByCause &
	ChangeStateMutationPayloadByCause &
	InteractionStateMutationPayloadByCause &
	ViewStateMutationPayloadByCause &
	TransientVisualsMutationPayloadByCause &
	LayoutMutationPayloadByCause & {
		'runtime.interaction.dropTo': undefined;
		'runtime.interaction.releaseTo': undefined;
	};

export type RuntimeMutationSession = MutationSession<RuntimeMutationPayloadByCause>;
export type RuntimeReadonlyMutationSession = ReadonlyMutationSession<RuntimeMutationPayloadByCause>;
