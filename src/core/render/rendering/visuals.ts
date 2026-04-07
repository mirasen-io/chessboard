import {
	AnyExtensionRenderVisualsContext,
	ExtensionRenderStateContextCommonBase
} from '../../extensions/types';
import { mergeReadonlySessions } from '../../mutation/session';
import { BoardRuntimeStateSnapshot } from '../../state/types';
import { RenderInternal, RenderVisualsRequest } from '../types';

export function performRenderVisualsPass(
	state: RenderInternal,
	request: RenderVisualsRequest
): ExtensionRenderStateContextCommonBase {
	const contextCommonBase = state.lastRenderedState;
	if (!contextCommonBase) {
		throw new Error(
			'RenderVisuals called but no previous render state found. RenderState must be called before RenderVisuals.'
		);
	}
	const mutation = state.lastRenderedState?.mutation
		? mergeReadonlySessions(state.lastRenderedState.mutation, request.mutation)
		: request.mutation;
	const newCurrentState: BoardRuntimeStateSnapshot = {
		...contextCommonBase.current.state,
		visuals: request.current
	};
	const newContextCommonBase: ExtensionRenderStateContextCommonBase = {
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
			previousData: extensionRec.data.previous,
			currentData: extensionRec.data.current,
			invalidation: extensionRec.render.invalidation,
			animation: extensionRec.render.animation
		};
		extensionRec.instance.renderVisuals?.(context);
	}

	return newContextCommonBase;
}
