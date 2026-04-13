import { RuntimeInternal } from '../types';

export function runtimeRunMutationPipeline(state: RuntimeInternal): boolean {
	return state.mutation.run(state);
}
