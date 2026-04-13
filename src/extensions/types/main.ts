import { RuntimeReadonlyMutationSession } from '../../runtime/mutation/types';
import { ExtensionInvalidationState } from '../invalidation/types';
import { ExtensionAnimationControllerInternalSurface } from './basic/animation';
import { BoardEventType } from './basic/events';
import { UpdateFrameSnapshot } from './basic/update';
import { AnyExtensionDefinition, AnyExtensionInstance } from './extension';
import { ExtensionRuntimeSurfaceCommands } from './surface/commands';

export interface ExtensionSystemExtensionRecord {
	readonly id: string;
	readonly definition: AnyExtensionDefinition;
	readonly instance: AnyExtensionInstance;
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationControllerInternalSurface;
}

export interface ExtensionSystemInitOptions {
	extensionRuntimeSurfaceCommands: ExtensionRuntimeSurfaceCommands;
	extensions?: readonly AnyExtensionDefinition[];
}

export interface ExtensionSystemInternal {
	readonly extensions: Map<string, ExtensionSystemExtensionRecord>;
	readonly transientVisualsSubscribers: Set<string>;
	readonly eventSubscribers: Map<string, Set<BoardEventType>>;
	currentFrame: UpdateFrameSnapshot | null;
}

export interface ExtensionSystemUpdateRequest {
	readonly state: UpdateFrameSnapshot;
	readonly mutation: RuntimeReadonlyMutationSession;
}

export interface ExtensionSystemSharedDataForRenderSystem {
	readonly extensions: ReadonlyMap<string, ExtensionSystemExtensionRecord>;
	readonly transientVisualsSubscribers: ReadonlySet<string>;
}

export interface ExtensionSystem {
	readonly currentFrame: UpdateFrameSnapshot | null;
	getSharedDataForRenderSystem(): ExtensionSystemSharedDataForRenderSystem;
	onUpdate(request: ExtensionSystemUpdateRequest): void;
	onUnmount(): void;
	onDestroy(): void;
}

export type GetInternalState = () => ExtensionSystemInternal;
