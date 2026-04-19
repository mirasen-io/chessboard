import assert from '@ktarmyshov/assert';
import { ExtensionRuntimeSurfaceEvents } from '../../extensions/types/surface/events.js';
import { NEED_EVENT_TYPES } from '../input/adapter/types.js';
import { GetInternalState } from '../types/main.js';

export function createExtensionRuntimeSurfaceEvents(
	getInternalState: GetInternalState
): ExtensionRuntimeSurfaceEvents {
	return {
		subscribeEvent<K extends keyof HTMLElementEventMap>(type: K): void {
			const internalState = getInternalState();
			assert(
				internalState.inputAdapter,
				'Input adapter not available in the current runtime state'
			);
			internalState.inputAdapter.subscribeEvent(type);
		},
		unsubscribeEvent<K extends keyof HTMLElementEventMap>(type: K): void {
			const internalState = getInternalState();
			assert(
				internalState.inputAdapter,
				'Input adapter not available in the current runtime state'
			);
			if (!NEED_EVENT_TYPES.has(type)) {
				internalState.inputAdapter.unsubscribeEvent(type);
			}
		}
	};
}
