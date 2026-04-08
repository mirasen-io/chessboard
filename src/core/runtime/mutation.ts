import { BoardRuntimeInternal } from './types';

export function boardRuntimeRunMutationPipeline(state: BoardRuntimeInternal): void {
	state.mutation.run(state);
}
