import { RuntimeInternal } from '../types/main.js';

export function runtimeRunMutationPipeline(state: RuntimeInternal): boolean {
	return state.mutation.run(state);
}
