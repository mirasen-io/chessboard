import type { AnnotationsStateInternal } from './types/main.js';

export function hasCommittedAnnotations(state: AnnotationsStateInternal): boolean {
	return state.annotations.circles.size > 0 || state.annotations.arrows.size > 0;
}

export function clearCommittedAnnotations(state: AnnotationsStateInternal): boolean {
	if (state.annotations.circles.size === 0 && state.annotations.arrows.size === 0) {
		return false;
	}
	state.annotations.circles.clear();
	state.annotations.arrows.clear();
	return true;
}
