import { ExtensionRenderVisualsContext, RenderStateFrameSnapshot } from '../../extensions/types';
import { BoardRuntimeStateSnapshot } from '../../state/types';
import { VisualsStateSnapshot } from '../../state/visuals/types';
import { RenderInternal } from '../types';
import { validateIsMounted } from './helpers';

export function performRenderVisualsPass(
	state: RenderInternal,
	request: VisualsStateSnapshot
): void {
	validateIsMounted(state);
	const lastRendered = state.lastRendered;
	if (!lastRendered) {
		throw new Error(
			'RenderVisuals called but no previous render state found. RenderState must be called before RenderVisuals.'
		);
	}

	// Just update state.lastRendered.current.state.visuals and the rest is the same
	const newCurrentState: BoardRuntimeStateSnapshot = {
		...lastRendered.state,
		visuals: request
	};
	const newRendered: RenderStateFrameSnapshot = {
		...lastRendered,
		state: newCurrentState
	};
	for (const extensionRec of state.extensions.values()) {
		const context: ExtensionRenderVisualsContext = {
			current: newRendered,
			invalidation: extensionRec.extension.invalidation,
			animation: extensionRec.extension.animation
		};
		extensionRec.extension.instance.renderVisuals?.(context);
	}

	state.lastRendered = newRendered;
}
