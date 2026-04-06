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

export function renderState(state: RenderInternal, request: RenderStateRequest | null): void {
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
		previous: state.lastRendered?.current ?? null,
		mutation: request.mutation,
		current: request.current
	};

	// Now run over the extensions that have invalidation layers marked and call their render method
	for (const extension of state.extensions.values()) {
		if (extension.render.invalidation.dirtyLayers !== 0) {
			const context: AnyExtensionRenderStateContext = {
				...contextBase,
				previousData: extension.data.previous,
				currentData: extension.data.current,
				invalidation: extension.render.invalidation,
				animation: extension.render.animation
			};
			extension.instance.renderState?.(context);
		}
	}

	// Save the last rendered common base context
	state.lastRendered = contextBase;
}
