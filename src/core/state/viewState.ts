import { ColorInput, Square } from './boardTypes';
import { normalizeColor } from './normalize';
import type { Movability, ViewStateInternal, ViewStateSnapshot } from './viewTypes';

export interface ViewStateInitOptions {
	orientation?: ColorInput; // 'white' | 'black' | 'w' | 'b'
	selected?: Square | null; // optional initial selection
	movability?: Movability; // optional externally-provided interaction policy
}

export function createViewState(opts: ViewStateInitOptions = {}): ViewStateInternal {
	const orientation = opts.orientation ? normalizeColor(opts.orientation) : 'white';
	const selected = opts.selected ?? null;
	const movability = opts.movability ?? { mode: 'disabled' };
	return {
		orientation,
		selected,
		movability
	};
}

/**
 * Build a public read-only snapshot of the current state.
 */
export function getViewStateSnapshot(state: ViewStateInternal): ViewStateSnapshot {
	const snap: ViewStateSnapshot = {
		orientation: state.orientation,
		selected: state.selected,
		movability: state.movability
	};
	return snap;
}
