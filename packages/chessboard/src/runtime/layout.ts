import { runtimeValidateIsMounted } from './lifecycle.js';
import { runtimeRunMutationPipeline } from './mutation/run.js';
import { RuntimeInternal } from './types/main.js';

export function runtimeRefreshGeometry(state: RuntimeInternal): void {
	runtimeValidateIsMounted(state);
	state.layout.refreshGeometry(
		{
			orientation: state.state.view.orientation,
			container: state.renderSystem.container
		},
		state.mutation.getSession()
	);
	runtimeRunMutationPipeline(state);
}
