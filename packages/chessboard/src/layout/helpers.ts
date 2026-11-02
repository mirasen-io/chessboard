import { Size } from './geometry/types.js';

export function measureSceneSize(container: HTMLElement): Size {
	return { width: container.clientWidth, height: container.clientHeight };
}

export function isSceneSizeValid(size: Size | null): boolean {
	return size !== null && size.width > 0 && size.height > 0;
}
