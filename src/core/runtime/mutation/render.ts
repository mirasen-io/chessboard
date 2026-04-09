import { isCurrentUpdateContextCommonMounted } from '../../extensions/helpers';
import { RenderStateFrameSnapshot } from '../../extensions/types';
import { BoardRuntimeMutationPipe } from './pipeline';

export const requestRenderStatePipe: BoardRuntimeMutationPipe = (context, mutationSession) => {
	const { current } = context;
	const mayNeedRender =
		mutationSession.hasMutation('state.board.') ||
		mutationSession.hasMutation('state.view.') ||
		mutationSession.hasMutation('state.interaction.') ||
		mutationSession.hasMutation('state.change.') ||
		(mutationSession.hasMutation('layout.') && current.render.isMounted);
	if (!mayNeedRender) return;
	const lastUpdated = current.extensions.lastUpdated;
	if (lastUpdated === null || !isCurrentUpdateContextCommonMounted(lastUpdated)) return;
	const lastCurrent = lastUpdated.current;
	if (lastCurrent.layout.geometry === null) return;
	current.render.requestRenderState(lastCurrent as RenderStateFrameSnapshot);
};
