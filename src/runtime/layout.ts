import { runtimeValidateIsMounted } from './lifecycle';
import { runtimeRunMutationPipeline } from './mutation/run';
import { RuntimeInternal } from './types/main';

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
