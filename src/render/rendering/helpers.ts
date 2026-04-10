import { RenderInternal } from '../types';

export function validateIsMounted(state: RenderInternal): void {
	if (!state.container) {
		throw new Error(
			'Render is not mounted to any container. Please mount before requesting renders.'
		);
	}
}

export function validateIsNotMounted(state: RenderInternal): void {
	if (state.container) {
		throw new Error(
			'Render is already mounted to a container. Please unmount before performing this action.'
		);
	}
}
