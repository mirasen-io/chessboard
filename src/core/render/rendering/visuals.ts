import {
	AnyExtensionRenderVisualsContext,
	ExtensionRenderStateContextCommon
} from '../../extensions/types';
import { mergeReadonlySessions } from '../../mutation/session';
import { BoardRuntimeStateSnapshot } from '../../state/types';
import { RenderInternal, RenderVisualsRequest } from '../types';
import { validateIsMounted } from './helpers';

export function performRenderVisualsPass(
	state: RenderInternal,
	request: RenderVisualsRequest
): void {
	validateIsMounted(state);
	const contextCommonBase = state.lastRendered;
	if (!contextCommonBase) {
		throw new Error(
			'RenderVisuals called but no previous render state found. RenderState must be called before RenderVisuals.'
		);
	}
	const mutation = state.lastRendered?.mutation
		? mergeReadonlySessions([state.lastRendered.mutation, request.mutation], 'visuals.state.')
		: request.mutation;

	// Just update state.lastRendered.current.state.visuals and the rest is the same
	const newCurrentState: BoardRuntimeStateSnapshot = {
		...contextCommonBase.current.state,
		visuals: request.current
	};
	const newContextCommonBase: ExtensionRenderStateContextCommon = {
		...contextCommonBase,
		mutation,
		current: {
			...contextCommonBase.current,
			state: newCurrentState
		}
	};
	for (const extensionRec of state.extensions.values()) {
		const context: AnyExtensionRenderVisualsContext = {
			...newContextCommonBase,
			previousData: extensionRec.extension.storedData.previous,
			currentData: extensionRec.extension.storedData.current,
			invalidation: extensionRec.extension.invalidation,
			animation: extensionRec.extension.animation
		};
		extensionRec.extension.instance.renderVisuals?.(context);
	}

	state.lastRendered = newContextCommonBase;
}
