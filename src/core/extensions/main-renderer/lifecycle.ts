import { SvgRendererInternals } from './types';

export function rendererMount(state: SvgRendererInternals, container: HTMLElement): void {
	if (rendererIsMounted(state)) {
		throw new Error('Renderer is already mounted');
	}
	state.container = container;
	container.appendChild(state.svgRoot);
}

export function rendererUnmount(state: SvgRendererInternals): void {
	if (!rendererIsMounted(state)) {
		throw new Error('Renderer is not mounted');
	}
	state.container!.removeChild(state.svgRoot);
	state.container = null;
}

export function rendererIsMounted(state: SvgRendererInternals): boolean {
	return state.container !== null;
}
