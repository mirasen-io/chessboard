import {
	AnyExtensionOnUpdateStateContext,
	AnyExtensionRenderStateContext,
	RenderStateFrameSnapshot
} from '../../extensions/types';
import { RenderInternal, RenderStateRequest } from '../types';

function checkNeedsRender(state: RenderInternal): boolean {
	for (const extension of state.extensions.values()) {
		if (extension.invalidation.dirtyLayers !== 0) {
			return true;
		}
	}
	return false;
}

export interface ExtensionRenderStateExtensionData {
	previous: unknown | null;
	current: unknown;
}

interface ExtensionRenderStateContextBase {
	readonly previous: RenderStateFrameSnapshot | null;
	readonly current: RenderStateFrameSnapshot;
}

function updateState(
	state: RenderInternal,
	request: RenderStateRequest
): ExtensionRenderStateContextBase {
	// Prepare base context
	const contextBase: ExtensionRenderStateContextBase = {
		previous: state.previouslyRendered,
		current: request
	};
	// Update invalidation state based on the new request
	for (const extension of state.extensions.values()) {
		const context: AnyExtensionOnUpdateStateContext = {
			...contextBase,
			previousData: extension.data.previous,
			invalidation: extension.invalidation,
			animation: extension.animation
		};
		const newData = extension.instance.onStateUpdate(context);
		extension.data.previous = extension.data.current;
		extension.data.current = newData;
	}
	return contextBase;
}

export function renderState(state: RenderInternal, request: RenderStateRequest | null) {
	if (!request) {
		throw new Error('Render called without a valid render request');
	}
	if (!request.layout.geometry) {
		throw new Error('Render called without a valid layout geometry');
	}

	// First run update cycle to allow extensions to update their state and mark invalidation layers as needed
	const contextBase = updateState(state, request);

	// Check if we have any invalidation states
	if (!checkNeedsRender(state)) {
		console.debug('Render called but no invalidation detected, skipping render');
		return; // no-op
	}

	// Now run over the extensions that have invalidation layers marked and call their render method
	for (const extension of state.extensions.values()) {
		if (extension.invalidation.dirtyLayers !== 0) {
			const context: AnyExtensionRenderStateContext = {
				...contextBase,
				previousData: extension.data.previous,
				currentData: extension.data.current,
				invalidation: extension.invalidation,
				animation: extension.animation
			};
			extension.instance.renderState?.(context);
		}
	}
}
