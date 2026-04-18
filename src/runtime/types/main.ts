import { AnyExtensionDefinition } from '../../extensions/types/extension';
import { ExtensionRuntimeSurfaceCommands } from '../../extensions/types/surface/commands';
import { RuntimeStateInitOptions } from '../../state/types';
import { InputAdapter } from '../input/adapter/types';
import { InteractionController } from '../input/controller/types';
import { RuntimeMutationPipeline, RuntimeMutationPipelineContext } from '../mutation/pipeline';

export type RuntimeStatus = 'constructing' | 'unmounted' | 'mounted' | 'destroyed';

export interface RuntimeInternal extends RuntimeMutationPipelineContext {
	readonly mutation: RuntimeMutationPipeline;
	readonly interactionController: InteractionController;
	inputAdapter: InputAdapter | null;
	resizeObserver: ResizeObserver | null;
}

export type GetInternalState = () => RuntimeInternal;

export interface RuntimeInitOptions {
	doc: Document;
	state?: RuntimeStateInitOptions;
	extensions?: readonly AnyExtensionDefinition[];
}

export interface RuntimeInitOptionsInternal extends RuntimeInitOptions {
	extensionRuntimeSurfaceCommands: ExtensionRuntimeSurfaceCommands;
	getInternalState: GetInternalState;
}

/**
 * Public interface for the internal runtime.
 * Orchestrates board state, view state, interaction state, and invalidation.
 * Board/view/interaction reducers own mutation logic; the runtime coordinates scheduling
 * and geometry updates in response to state changes.
 */
export interface Runtime extends ExtensionRuntimeSurfaceCommands {
	// Lifecycle
	readonly status: RuntimeStatus;
	mount(container: HTMLElement): void;
	unmount(): void; // just unmount, can be remounted
	destroy(): void; // unmount + cleanup internal state, observers, etc. cannot be reused anymore
	// Extensions
	getExtensionsPublicRecord(): Readonly<Record<string, unknown>>;
}
