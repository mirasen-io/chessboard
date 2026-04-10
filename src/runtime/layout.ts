import { LayoutMutationSession } from '../layout/mutation';
import { runtimeValidateIsMounted } from './lifecycle';
import { runtimeRunMutationPipeline } from './mutation';
import { RuntimeInternal } from './types';

export function runtimeRefreshGeometry(state: RuntimeInternal): void {
	runtimeValidateIsMounted(state);
	state.layout.refreshGeometry(
		{
			orientation: state.state.view.orientation,
			container: state.renderSystem.container
		},
		state.mutation.getSession() as LayoutMutationSession
	);
	runtimeRunMutationPipeline(state);
}
