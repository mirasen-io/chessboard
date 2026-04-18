import { RuntimeInternal } from '../types/main';

export function runtimeRunMutationPipeline(state: RuntimeInternal): boolean {
	return state.mutation.run(state);
}
