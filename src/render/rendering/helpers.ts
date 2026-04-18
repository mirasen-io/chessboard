import { RenderSystemInternal } from '../types';

export function validateIsMounted(state: RenderSystemInternal): void {
	if (!state.container) {
		throw new Error(
			'Render is not mounted to any container. Please mount before requesting renders.'
		);
	}
}

export function validateIsNotMounted(state: RenderSystemInternal): void {
	if (state.container) {
		throw new Error(
			'Render is already mounted to a container. Please unmount before performing this action.'
		);
	}
}
