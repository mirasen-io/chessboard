import { BoardRuntimeMutationPipe } from './pipeline';

export const extensionSystemUpdateStatePipe: BoardRuntimeMutationPipe = (
	context,
	mutationSession
) => {
	const { current } = context;
	const needUpdate =
		mutationSession.hasMutation('state.board.') ||
		mutationSession.hasMutation('state.view.') ||
		mutationSession.hasMutation('state.interaction.') ||
		mutationSession.hasMutation('state.change.') ||
		(mutationSession.hasMutation('layout.') && current.render.isMounted);
	if (needUpdate) {
		const stateSnapshot = current.state.getSnapshot();
		current.extensions.updateState({
			state: current.render.isMounted
				? {
						isMounted: true,
						state: stateSnapshot,
						layout: current.layout.getSnapshot()
					}
				: {
						isMounted: false,
						state: stateSnapshot
					},
			mutation: mutationSession
		});
	}
};
