import type { BoardStateMutationCause } from '../../state/board/mutation';
import type { InteractionStateMutationCause } from '../../state/interaction/mutation';
import type { ViewStateMutationCause } from '../../state/view/mutation';

export type BoardRuntimeMutationCause =
	| BoardStateMutationCause
	| ViewStateMutationCause
	| InteractionStateMutationCause;
