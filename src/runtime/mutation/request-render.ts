import { isFrameRenderable } from '../../extensions/types/basic/update';
import { RuntimeMutationPipe, RuntimeMutationPipeContext } from './pipeline';

export const requestRenderPipe: RuntimeMutationPipe = (context) => {
	const { current } = context;

	const currentFrame = current.extensionSystem.currentFrame;
	if (currentFrame === null || !isFrameRenderable(currentFrame)) return; // no-op if we can't render
	if (needsRender(context)) {
		current.renderSystem.requestRender(currentFrame);
	}
	if (needsRenderAnimation(context)) {
		current.renderSystem.requestRenderAnimation();
	}
};

function needsRender(context: RuntimeMutationPipeContext): boolean {
	for (const extensionRec of context.current.renderSystem.extensions.values()) {
		if (extensionRec.extension.invalidation.dirtyLayers !== 0) {
			return true;
		}
	}
	return false;
}

function needsRenderAnimation(context: RuntimeMutationPipeContext): boolean {
	for (const extensionRec of context.current.renderSystem.extensions.values()) {
		if (extensionRec.extension.animation.getAll(['submitted', 'active']).length > 0) {
			return true;
		}
	}
	return false;
}
