import { DirtyLayer } from './types/internal.js';
import type { AnnotationsStateInternal } from './types/main.js';

export function markDirtyAndRequestRender(state: AnnotationsStateInternal, layers: number): void {
	state.runtimeSurface.invalidation.markDirty(layers);
	state.runtimeSurface.commands.requestRender({ state: true });
}

export function markCommittedDirtyAndRequestRender(state: AnnotationsStateInternal): void {
	markDirtyAndRequestRender(state, DirtyLayer.COMMITTED);
}
