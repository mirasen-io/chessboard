import { isCurrentUpdateContextMounted } from '../../helpers';
import { ExtensionOnUpdateStateContext } from '../../types';
import { DirtyLayer } from '../types/extension';
import { MainRendererPiecesInternal } from './types';

export function rendererPiecesOnUpdate(
	_state: MainRendererPiecesInternal,
	context: ExtensionOnUpdateStateContext
): void {
	if (!isCurrentUpdateContextMounted(context) || !context.current.layout.geometry) {
		return;
	}
	const mutation = context.mutation;
	if (mutation.hasMutation('state.board') || mutation.hasMutation(['layout.refreshGeometry'])) {
		context.invalidation.markDirty(DirtyLayer.Pieces);
	}
}
