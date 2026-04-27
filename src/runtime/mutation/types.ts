import type { LayoutMutationPayloadByCause } from '../../layout/mutation.js';
import type { MutationSession, ReadonlyMutationSession } from '../../mutation/types.js';
import type { BoardStateMutationPayloadByCause } from '../../state/board/mutation.js';
import type { ChangeStateMutationPayloadByCause } from '../../state/change/mutation.js';
import type { InteractionStateMutationPayloadByCause } from '../../state/interaction/mutation.js';
import type {
	DragSessionCoreOwnedSnapshot,
	DragSessionExtensionOwnedSnapshot
} from '../../state/interaction/types/internal.js';
import type { ViewStateMutationPayloadByCause } from '../../state/view/mutation.js';

type RuntimeOwnMutationPayloadByCause = {
	'runtime.interaction.completeCoreDragTo': DragSessionCoreOwnedSnapshot;
	'runtime.interaction.completeExtensionDragTo': DragSessionExtensionOwnedSnapshot;
	'runtime.interaction.resolveDeferredUIMoveRequest': undefined;
	'runtime.interaction.cancelDeferredUIMoveRequest': undefined;
};
export type RuntimeMutationPayloadByCause = BoardStateMutationPayloadByCause &
	ChangeStateMutationPayloadByCause &
	InteractionStateMutationPayloadByCause &
	ViewStateMutationPayloadByCause &
	LayoutMutationPayloadByCause &
	RuntimeOwnMutationPayloadByCause;

export type RuntimeMutationSession = MutationSession<RuntimeMutationPayloadByCause>;
export type RuntimeReadonlyMutationSession = ReadonlyMutationSession<RuntimeMutationPayloadByCause>;
