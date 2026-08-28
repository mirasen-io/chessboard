import { DirtyLayer } from './types.js';
import type { CheckInstanceInternal } from './types.js';

export function markHighlightDirtyAndRequestRender(state: CheckInstanceInternal): void {
	state.runtimeSurface.invalidation.markDirty(DirtyLayer.Highlight);
	state.runtimeSurface.commands.requestRender({ state: true });
}
