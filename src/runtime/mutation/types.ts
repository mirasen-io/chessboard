import { LayoutMutationPayloadByCause } from '../../layout/mutation.js';
import { MutationSession, ReadonlyMutationSession } from '../../mutation/types.js';
import { BoardStateMutationPayloadByCause } from '../../state/board/mutation.js';
import { ChangeStateMutationPayloadByCause } from '../../state/change/mutation.js';
import { InteractionStateMutationPayloadByCause } from '../../state/interaction/mutation.js';
import { ViewStateMutationPayloadByCause } from '../../state/view/mutation.js';

type RuntimeOwnMutationPayloadByCause = {
	'runtime.interaction.dropTo': undefined;
	'runtime.interaction.releaseTo': undefined;
};
export type RuntimeMutationPayloadByCause = BoardStateMutationPayloadByCause &
	ChangeStateMutationPayloadByCause &
	InteractionStateMutationPayloadByCause &
	ViewStateMutationPayloadByCause &
	LayoutMutationPayloadByCause &
	RuntimeOwnMutationPayloadByCause;

export type RuntimeMutationSession = MutationSession<RuntimeMutationPayloadByCause>;
export type RuntimeReadonlyMutationSession = ReadonlyMutationSession<RuntimeMutationPayloadByCause>;
