import assert from '@ktarmyshov/assert';
import { RenderSystem } from '../render/types.js';
import { createInputAdapter } from './input/adapter/factory.js';
import { runtimeRefreshGeometry } from './layout.js';
import { RuntimeInternal } from './types/main.js';

export function runtimeIsMounted(state: RuntimeInternal): boolean {
	return state.renderSystem.isMounted;
}

export function runtimeValidateIsMounted(
	state: RuntimeInternal
): asserts state is RuntimeInternal & {
	readonly renderSystem: RuntimeInternal['renderSystem'] & {
		readonly container: NonNullable<RenderSystem['container']>;
	};
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
	assert(state.inputAdapter === null, 'Input adapter should not be initialized before mounting');
	state.inputAdapter = createInputAdapter({
		container,
		getRenderGeometry: () => state.layout.geometry,
		controller: state.interactionController
	});
	state.renderSystem.mount(container);
	state.resizeObserver = new ResizeObserver(() => {
		runtimeRefreshGeometry(state);
	});
	// Observe will cause immediate first callback!
	state.resizeObserver.observe(container);
}

export function runtimeUnmount(state: RuntimeInternal): void {
	runtimeValidateIsMounted(state);
	assert(state.inputAdapter !== null, 'Input adapter should be initialized when mounted');
	state.inputAdapter.destroy();
	state.inputAdapter = null;
	if (state.resizeObserver) {
		state.resizeObserver.disconnect();
		state.resizeObserver = null;
	}
	state.renderSystem.unmount();
	state.extensionSystem.onUnmount();
}

export function runtimeDestroy(state: RuntimeInternal): void {
	if (runtimeIsMounted(state)) {
		runtimeUnmount(state);
	}
	state.extensionSystem.onDestroy();
}
