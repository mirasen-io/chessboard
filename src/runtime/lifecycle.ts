import { RenderSystem } from '../render/types';
import { runtimeRefreshGeometry } from './layout';
import { RuntimeInternal } from './types';

export function runtimeIsMounted(state: RuntimeInternal): boolean {
	return state.renderSystem.isMounted;
}

export function runtimeValidateIsMounted(
	state: RuntimeInternal
): asserts state is RuntimeInternal & {
	renderSystem: { container: NonNullable<RenderSystem['container']> };
} {
	if (!runtimeIsMounted(state)) {
		throw new Error('Runtime is not mounted. Please call mount() before performing this action.');
	}
}

export function runtimeValidateIsNotMounted(state: RuntimeInternal): void {
	if (runtimeIsMounted(state)) {
		throw new Error('Runtime is already mounted. This action cannot be performed after mounting.');
	}
}

export function runtimeMount(state: RuntimeInternal, container: HTMLElement): void {
	runtimeValidateIsNotMounted(state);
	state.renderSystem.mount(container);
	state.resizeObserver = new ResizeObserver(() => {
		runtimeRefreshGeometry(state);
	});
	state.resizeObserver.observe(container);
}

export function runtimeUnmount(state: RuntimeInternal): void {
	runtimeValidateIsMounted(state);
	if (state.resizeObserver) {
		state.resizeObserver.disconnect();
		state.resizeObserver = null;
	}
	state.renderSystem.unmount();
	state.extensionSystem.onUnmount();
}

export function runtimeDestroy(state: RuntimeInternal): void {
	runtimeUnmount(state);
	state.extensionSystem.onDestroy();
}
