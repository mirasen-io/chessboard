import { createExtensionSystem } from '../extensions/factory';
import { createSvgRenderer } from '../extensions/main-renderer/factory';
import { ExtensionSystemInitOptions } from '../extensions/types';
import { createLayout } from '../layout/factory';
import { createRender } from '../render/factory';
import { createBoardRuntimeState } from '../state/factory';
import { boardRuntimeMount, boardRuntimeUnmount } from './mount';
import { createBoardRuntimeMutationPipeline } from './mutation/factory';
import type {
	BoardRuntime,
	BoardRuntimeInitOptions,
	BoardRuntimeInitOptionsInternal,
	BoardRuntimeInternal,
	BoardRuntimeSnapshot
} from './types';

function createBoardRuntimeInternal(
	options: BoardRuntimeInitOptionsInternal
): BoardRuntimeInternal {
	const extensions = options.extensions ?? [];
	const hasMainRenderer = extensions.some((ext) => ext.id === 'main-renderer');
	const createExtensions = hasMainRenderer
		? (extensions as unknown as ExtensionSystemInitOptions['extensions'])
		: ([createSvgRenderer(options.render.renderer ?? {}), ...extensions] as const);
	const extensionSystem = createExtensionSystem({ extensions: createExtensions });
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

export function createBoardRuntime(options: BoardRuntimeInitOptions): BoardRuntime {
	const optionsInternal: BoardRuntimeInitOptionsInternal = {
		state: options.state,
		extensions: options.extensions,
		render: {
			doc: options.render.doc,
			renderer: options.render.renderer
		}
	};
	const internalState = createBoardRuntimeInternal(optionsInternal);
	// Initial creation, so we mark board position as mutated to trigger mutation pipeline
	internalState.mutation.addMutation('board.state.setPosition', true);

	// We will have two different interfaces here
	// One is returned, one is for controller - with different methods
	// At the moment our assumption that controller will use BoardRuntime but not opposite direction
	// So we can construct these two objects separately so they would not be huge!
	// TODO: const inputControllerSurface = createBoardRuntimeInputControllerSurface(internalState);

	// Initial run to process initial mutations and set up previousContext for the next runs
	internalState.mutation.run(internalState);
	// @ts-expect-error - For now we just return partial object. TODO: REMOVE!!!!
	return {
		mount(container) {
			boardRuntimeMount(internalState, container);
		},
		unmount() {
			boardRuntimeUnmount(internalState);
			// We keep the state of the runtime even after unmounting, so when we mount it again we can just reuse it and not lose the current position, orientation, etc.
		},
		getSnapshot(): BoardRuntimeSnapshot {
			return {
				state: internalState.state.getSnapshot(),
				layout: internalState.layout.getSnapshot()
			};
		}
	};
}
