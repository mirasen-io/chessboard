import { RuntimeMutationPipe } from './pipeline';

export const layoutRefreshGeometryPipe: RuntimeMutationPipe = (context, mutationSession) => {
	const { current } = context;
	if (mutationSession.hasMutation({ causes: ['state.view.setOrientation'] })) {
		current.layout.refreshGeometry(
			{
				orientation: current.state.view.orientation
			},
			mutationSession
		);
	}
};
