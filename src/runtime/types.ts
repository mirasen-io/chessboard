import {
	AnyExtensionDefinition,
	BoardRuntimeExtensionSurface,
	BoardRuntimeExtensionSurfaceSnapshot,
	ExtensionCreateInstanceOptions,
	ExtensionSystem
} from '../extensions/types';
import { Layout } from '../layout/types';
import { Render } from '../render/types';
import { BoardRuntimeState, BoardRuntimeStateInitOptions } from '../state/types';
import { BoardRuntimeMutationPipeline } from './mutation/pipeline';

export type BoardRuntimeStatus = 'constructing' | 'unmounted' | 'mounted' | 'destroyed';

export interface BoardRuntimeInternal {
	readonly state: BoardRuntimeState;
	readonly layout: Layout;
	readonly mutation: BoardRuntimeMutationPipeline;
	readonly render: Render;
	readonly extensions: ExtensionSystem;
	resizeObserver: ResizeObserver | null;
}

export interface BoardRuntimeInitOptions {
	doc: Document;
	state?: BoardRuntimeStateInitOptions;
	extensions?: readonly AnyExtensionDefinition[];
}

export interface BoardRuntimeInitOptionsInternal extends BoardRuntimeInitOptions {
	extensionCreateInstanceOptions: ExtensionCreateInstanceOptions;
}

/**
 * Public interface for the internal runtime.
 * Orchestrates board state, view state, interaction state, and invalidation.
 * Board/view/interaction reducers own mutation logic; the runtime coordinates scheduling
 * and geometry updates in response to state changes.
 */
export interface BoardRuntime extends BoardRuntimeExtensionSurface {
	// Lifecycle
	readonly status: BoardRuntimeStatus;
	mount(container: HTMLElement): void;
	unmount(): void; // just unmount, can be remounted
	destroy(): void; // unmount + cleanup internal state, observers, etc. cannot be reused anymore
	getSnapshot(): BoardRuntimeExtensionSurfaceSnapshot;
}
