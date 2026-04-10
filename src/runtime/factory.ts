import { createExtensionSystem } from '../extensions/factory';
import { RuntimeExtensionSurface, RuntimeExtensionSurfaceSnapshot } from '../extensions/types';
import { createLayout } from '../layout/factory';
import { createRender } from '../render/factory';
import { createRuntimeState } from '../state/factory';
import { createTransientVisuals } from '../transientVisuals/factory';
import { runtimeDestroy, runtimeMount, runtimeUnmount } from './lifecycle';
import { createRuntimeMutationPipeline } from './mutation/factory';
import type {
	Runtime,
	RuntimeInitOptions,
	RuntimeInitOptionsInternal,
	RuntimeInternal,
	RuntimeStatus
} from './types';

function createRuntimeInternal(options: RuntimeInitOptionsInternal): RuntimeInternal {
	const extensionSystem = createExtensionSystem({
		extensions: options.extensions,
		createInstanceOptions: options.extensionCreateInstanceOptions
	});
	const render = createRender({
		doc: options.doc,
		extensions: extensionSystem.extensions
	});
	return {
		state: createRuntimeState(options.state ?? {}),
		layout: createLayout(),
		transientVisuals: createTransientVisuals(),
		mutation: createRuntimeMutationPipeline(),
		renderSystem: render,
		extensionSystem: extensionSystem,
		resizeObserver: null
	};
}

function createRuntimeExtensionSurface(
	getInternalState: () => RuntimeInternal
): RuntimeExtensionSurface {
	// @ts-expect-error - For now we just return partial object. TODO: REMOVE!!!!
	return {
		getSnapshot(): RuntimeExtensionSurfaceSnapshot {
			const state = getInternalState();
			return {
				state: state.state.getSnapshot(),
				layout: state.layout.getSnapshot(),
				transientVisuals: state.transientVisuals.getSnapshot()
			};
		}
	};
}

export function createRuntime(options: RuntimeInitOptions): Runtime {
	let internalState: RuntimeInternal | null = null;
	let internalStatus: RuntimeStatus = 'constructing';
	function getInternalState(): RuntimeInternal {
		if (internalStatus === 'constructing' || internalStatus === 'destroyed') {
			throw new Error(`Cannot access internal state when runtime is ${internalStatus}`);
		}
		if (!internalState) {
			throw new Error('Internal state is not initialized');
		}
		return internalState;
	}

	// Create RuntimeExtensionSurface to pass to the extension system for initialization of extension instances
	const extensionSurface = createRuntimeExtensionSurface(getInternalState);

	// Now construct the internal state
	const optionsInternal: RuntimeInitOptionsInternal = {
		...options,
		extensionCreateInstanceOptions: {
			runtime: extensionSurface
		}
	};
	internalState = createRuntimeInternal(optionsInternal);

	// Initial creation, so we mark board position as mutated to trigger mutation pipeline
	internalState.mutation.addMutation('state.board.setPosition', true);

	// We will have two different interfaces here
	// One is returned, one is for controller - with different methods
	// At the moment our assumption that controller will use Runtime but not opposite direction
	// So we can construct these two objects separately so they would not be huge!
	// TODO: const inputControllerSurface = createRuntimeInputControllerSurface(internalState);

	// Initial run to process initial mutations and set up previousContext for the next runs
	internalStatus = 'unmounted';
	internalState.mutation.run(internalState);
	return {
		get status() {
			return internalStatus;
		},
		mount(container) {
			runtimeMount(getInternalState(), container);
			internalStatus = 'mounted';
		},
		unmount() {
			runtimeUnmount(getInternalState());
			internalStatus = 'unmounted';
		},
		destroy() {
			runtimeDestroy(getInternalState());
			internalStatus = 'destroyed';
			internalState = null;
		},
		...extensionSurface
	};
}
