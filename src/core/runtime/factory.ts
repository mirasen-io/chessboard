import { createExtensionSystem } from '../extensions/factory';
import { createSvgRenderer } from '../extensions/main-renderer/factory';
import {
	BoardRuntimeExtensionSurface,
	BoardRuntimeExtensionSurfaceSnapshot,
	ExtensionSystemInitOptions
} from '../extensions/types';
import { createLayout } from '../layout/factory';
import { createRender } from '../render/factory';
import { createBoardRuntimeState } from '../state/factory';
import { boardRuntimeDestroy, boardRuntimeMount, boardRuntimeUnmount } from './lifecycle';
import { createBoardRuntimeMutationPipeline } from './mutation/factory';
import type {
	BoardRuntime,
	BoardRuntimeInitOptions,
	BoardRuntimeInitOptionsInternal,
	BoardRuntimeInternal,
	BoardRuntimeStatus
} from './types';

function createBoardRuntimeInternal(
	options: BoardRuntimeInitOptionsInternal
): BoardRuntimeInternal {
	const extensions = options.extensions ?? [];
	const hasMainRenderer = extensions.some((ext) => ext.id === 'main-renderer');
	const createExtensions = hasMainRenderer
		? (extensions as unknown as ExtensionSystemInitOptions['extensions'])
		: ([createSvgRenderer(options.render.renderer ?? {}), ...extensions] as const);
	const extensionSystem = createExtensionSystem({
		extensions: createExtensions,
		createInstanceOptions: options.extensionCreateInstanceOptions
	});
	const render = createRender({
		doc: options.render.doc,
		extensions: extensionSystem.extensions
	});
	return {
		state: createBoardRuntimeState(options.state ?? {}),
		layout: createLayout(),
		mutation: createBoardRuntimeMutationPipeline(),
		render: render,
		extensions: extensionSystem,
		resizeObserver: null
	};
}

function createBoardRuntimeExtensionSurface(
	getInternalState: () => BoardRuntimeInternal
): BoardRuntimeExtensionSurface {
	// @ts-expect-error - For now we just return partial object. TODO: REMOVE!!!!
	return {
		getSnapshot(): BoardRuntimeExtensionSurfaceSnapshot {
			const state = getInternalState();
			return {
				state: state.state.getSnapshot(),
				layout: state.layout.getSnapshot()
			};
		}
	};
}

export function createBoardRuntime(options: BoardRuntimeInitOptions): BoardRuntime {
	let internalState: BoardRuntimeInternal | null = null;
	let internalStatus: BoardRuntimeStatus = 'constructing';
	function getInternalState(): BoardRuntimeInternal {
		if (internalStatus === 'constructing' || internalStatus === 'destroyed') {
			throw new Error(`Cannot access internal state when runtime is ${internalStatus}`);
		}
		if (!internalState) {
			throw new Error('Internal state is not initialized');
		}
		return internalState;
	}

	// Create BoardRuntimeExtensionSurface to pass to the extension system for initialization of extension instances
	const extensionSurface = createBoardRuntimeExtensionSurface(getInternalState);

	// Now construct the internal state
	const optionsInternal: BoardRuntimeInitOptionsInternal = {
		state: options.state,
		extensionCreateInstanceOptions: {
			runtime: extensionSurface
		},
		extensions: options.extensions,
		render: {
			doc: options.render.doc,
			renderer: options.render.renderer
		}
	};
	internalState = createBoardRuntimeInternal(optionsInternal);

	// Initial creation, so we mark board position as mutated to trigger mutation pipeline
	internalState.mutation.addMutation('state.board.setPosition', true);

	// We will have two different interfaces here
	// One is returned, one is for controller - with different methods
	// At the moment our assumption that controller will use BoardRuntime but not opposite direction
	// So we can construct these two objects separately so they would not be huge!
	// TODO: const inputControllerSurface = createBoardRuntimeInputControllerSurface(internalState);

	// Initial run to process initial mutations and set up previousContext for the next runs
	internalStatus = 'unmounted';
	internalState.mutation.run(internalState);
	return {
		get status() {
			return internalStatus;
		},
		mount(container) {
			boardRuntimeMount(getInternalState(), container);
			internalStatus = 'mounted';
		},
		unmount() {
			boardRuntimeUnmount(getInternalState());
			internalStatus = 'unmounted';
		},
		destroy() {
			boardRuntimeDestroy(getInternalState());
			internalStatus = 'destroyed';
			internalState = null;
		},
		...extensionSurface
	};
}
