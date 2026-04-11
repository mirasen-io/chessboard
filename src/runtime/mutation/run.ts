import { RuntimeInternal } from '../types';

export function runtimeRunMutationPipeline(state: RuntimeInternal): void {
	state.mutation.run(state);
}
