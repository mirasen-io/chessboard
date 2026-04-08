import { Render } from '../render/types';
import { boardRuntimeRefreshGeometry } from './layout';
import { BoardRuntimeInternal } from './types';

export function boardRuntimeIsMounted(state: BoardRuntimeInternal): boolean {
	return state.render.isMounted;
}

export function boardRuntimeValidateIsMounted(
	state: BoardRuntimeInternal
): asserts state is BoardRuntimeInternal & {
	render: { container: NonNullable<Render['container']> };
} {
	if (!boardRuntimeIsMounted(state)) {
		throw new Error(
			'BoardRuntime is not mounted. Please call mount() before performing this action.'
		);
	}
}

export function boardRuntimeValidateIsNotMounted(state: BoardRuntimeInternal): void {
	if (boardRuntimeIsMounted(state)) {
		throw new Error(
			'BoardRuntime is already mounted. This action cannot be performed after mounting.'
		);
	}
}

export function boardRuntimeMount(state: BoardRuntimeInternal, container: HTMLElement): void {
	boardRuntimeValidateIsNotMounted(state);
	state.render.mount(container);
	state.resizeObserver = new ResizeObserver(() => {
		boardRuntimeRefreshGeometry(state);
	});
	state.resizeObserver.observe(container);
}

export function boardRuntimeUnmount(state: BoardRuntimeInternal): void {
	boardRuntimeValidateIsMounted(state);
	state.render.unmount();
	if (state.resizeObserver) {
		state.resizeObserver.disconnect();
		state.resizeObserver = null;
	}
}
