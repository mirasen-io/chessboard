import { LayoutMutationPayloadByCause } from '../../layout/mutation';
import { MutationSession, ReadonlyMutationSession } from '../../mutation/types';
import { BoardStateMutationPayloadByCause } from '../../state/board/mutation';
import { ChangeStateMutationPayloadByCause } from '../../state/change/mutation';
import { InteractionStateMutationPayloadByCause } from '../../state/interaction/mutation';
import { ViewStateMutationPayloadByCause } from '../../state/view/mutation';

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
