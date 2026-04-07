import {
	AnyExtensionRenderStateContext,
	ExtensionRenderStateContextCommonBase
} from '../../extensions/types';
import { RenderInternal, RenderStateRequest } from '../types';

export function checkNeedsRender(state: RenderInternal): boolean {
	for (const extension of state.extensions.values()) {
		if (extension.render.invalidation.dirtyLayers !== 0) {
			return true;
		}
	}
	return false;
}

export function performRenderStatePass(
	state: RenderInternal,
	request: RenderStateRequest | null
): void {
	if (!request) {
		throw new Error('Render called without a valid render request');
	}
	if (!request.current.layout.geometry) {
		throw new Error('Render called without a valid layout geometry');
	}

	// Check if we have any invalidation states
	if (!checkNeedsRender(state)) {
		console.debug('Render called but no invalidation detected, skipping render');
		return; // no-op
	}

	const contextBase: ExtensionRenderStateContextCommonBase = {
		previous: state.lastRenderedState?.current ?? null,
		mutation: request.mutation,
		current: request.current
	};

	// Now run over the extensions that have invalidation layers marked and call their render method
	for (const extensionRec of state.extensions.values()) {
		if (extensionRec.render.invalidation.dirtyLayers !== 0) {
			const context: AnyExtensionRenderStateContext = {
				...contextBase,
				previousData: extensionRec.data.previous,
				currentData: extensionRec.data.current,
				invalidation: extensionRec.render.invalidation,
				animation: extensionRec.render.animation
			};
			extensionRec.instance.renderState?.(context);
		}
	}

	// Save the last rendered common base context
	state.lastRenderedState = contextBase;
}
