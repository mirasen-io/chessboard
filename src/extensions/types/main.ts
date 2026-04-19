import { RuntimeReadonlyMutationSession } from '../../runtime/mutation/types.js';
import { ExtensionInvalidationState } from '../invalidation/types.js';
import { ExtensionAnimationControllerInternalSurface } from './basic/animation.js';
import { SceneEventType } from './basic/events.js';
import { UpdateFrameSnapshot } from './basic/update.js';
import { ExtensionUIMoveRequestContext } from './context/ui-move.js';
import { AnyExtensionDefinition, AnyExtensionInstance } from './extension.js';
import { ExtensionRuntimeSurfaceCommands } from './surface/commands.js';

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
	readonly eventSubscribers: Map<string, Set<SceneEventType>>;
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
	readonly hasSubmittedAnimations: boolean;
	getPublicRecord(): Readonly<Record<string, unknown>>;
	getSharedDataForRenderSystem(): ExtensionSystemSharedDataForRenderSystem;
	onUpdate(request: ExtensionSystemUpdateRequest): void;
	onUIMoveRequest(context: ExtensionUIMoveRequestContext): void;
	onUnmount(): void;
	onDestroy(): void;
}

export type GetInternalState = () => ExtensionSystemInternal;
