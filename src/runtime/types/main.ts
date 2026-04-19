import { AnyExtensionDefinition } from '../../extensions/types/extension.js';
import { ExtensionRuntimeSurfaceCommands } from '../../extensions/types/surface/commands.js';
import { ExtensionRuntimeSurfaceEvents } from '../../extensions/types/surface/events.js';
import { RuntimeStateInitOptions } from '../../state/types.js';
import { InputAdapter } from '../input/adapter/types.js';
import { InteractionController } from '../input/controller/types.js';
import { RuntimeMutationPipeline, RuntimeMutationPipelineContext } from '../mutation/pipeline.js';

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
	extensionRuntimeSurfaceEvents: ExtensionRuntimeSurfaceEvents;
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
