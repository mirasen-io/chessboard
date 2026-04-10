import { LayoutMutationSession } from '../layout/mutation';
import { boardRuntimeValidateIsMounted } from './lifecycle';
import { boardRuntimeRunMutationPipeline } from './mutation';
import { BoardRuntimeInternal } from './types';

export function boardRuntimeRefreshGeometry(state: BoardRuntimeInternal): void {
	boardRuntimeValidateIsMounted(state);
	state.layout.refreshGeometry(
		state.render.container,
		state.state.view.getOrientation(),
		state.mutation.getSession() as LayoutMutationSession
	);
	boardRuntimeRunMutationPipeline(state);
}
