import { ColorInput } from './boardTypes';
import { normalizeColor } from './normalize';
import type { Movability, ViewStateInternal, ViewStateSnapshot } from './viewTypes';

export interface ViewStateInitOptions {
	orientation?: ColorInput; // 'white' | 'black' | 'w' | 'b'
	movability?: Movability; // optional externally-provided interaction policy
}

export function createViewState(opts: ViewStateInitOptions = {}): ViewStateInternal {
	const orientation = opts.orientation ? normalizeColor(opts.orientation) : 'white';
	const movability = opts.movability ?? { mode: 'disabled' };
	return {
		orientation,
		movability
	};
}

/**
 * Build a public read-only snapshot of the current state.
 */
export function getViewStateSnapshot(state: ViewStateInternal): ViewStateSnapshot {
	const snap: ViewStateSnapshot = {
		orientation: state.orientation,
		movability: state.movability
	};
	return snap;
}
