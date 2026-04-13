import { RuntimeMutationPipe } from './pipeline';

export const extensionSystemUpdatePipe: RuntimeMutationPipe = (context, mutationSession) => {
	const { current } = context;
	const hasMutation = mutationSession.hasMutation({
		prefixes: ['state.', 'layout.']
	});
	if (hasMutation) {
		const stateSnapshot = current.state.getSnapshot();
		current.extensionSystem.onUpdate({
			state: current.renderSystem.isMounted
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
