import {
	AnyExtensionDefinition,
	ExtensionCreateInstanceOptions,
	RuntimeExtensionSurface,
	RuntimeExtensionSurfaceSnapshot
} from '../extensions/types';
import { RuntimeStateInitOptions } from '../state/types';
import { RuntimeMutationPipeline, RuntimeMutationPipelineContext } from './mutation/pipeline';

export type RuntimeStatus = 'constructing' | 'unmounted' | 'mounted' | 'destroyed';

export interface RuntimeInternal extends RuntimeMutationPipelineContext {
	readonly mutation: RuntimeMutationPipeline;
	resizeObserver: ResizeObserver | null;
}

export interface RuntimeInitOptions {
	doc: Document;
	state?: RuntimeStateInitOptions;
	extensions?: readonly AnyExtensionDefinition[];
}

export interface RuntimeInitOptionsInternal extends RuntimeInitOptions {
	extensionCreateInstanceOptions: ExtensionCreateInstanceOptions;
}

/**
 * Public interface for the internal runtime.
 * Orchestrates board state, view state, interaction state, and invalidation.
 * Board/view/interaction reducers own mutation logic; the runtime coordinates scheduling
 * and geometry updates in response to state changes.
 */
export interface Runtime extends RuntimeExtensionSurface {
	// Lifecycle
	readonly status: RuntimeStatus;
	mount(container: HTMLElement): void;
	unmount(): void; // just unmount, can be remounted
	destroy(): void; // unmount + cleanup internal state, observers, etc. cannot be reused anymore
	getSnapshot(): RuntimeExtensionSurfaceSnapshot;
}
