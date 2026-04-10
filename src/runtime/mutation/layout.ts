import { LayoutMutationSession } from '../../layout/mutation';
import { BoardRuntimeMutationPipe } from './pipeline';

export const layoutRefreshGeometryPipe: BoardRuntimeMutationPipe = (context, mutationSession) => {
	const { current } = context;
	if (mutationSession.hasMutation(['state.view.setOrientation'])) {
		current.layout.refreshGeometryForOrientation(
			current.state.view.getOrientation(),
			mutationSession as LayoutMutationSession
		);
	}
};
