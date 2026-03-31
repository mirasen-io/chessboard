import type { ReadonlyDeep } from 'type-fest';
import { InvalidationMutationSession } from './mutation';

/**
 * Base invalidation types
 */
export type DirtyLayerMask = number;
export enum DirtyLayer {
	Board = 1, // 1 << 0,
	Pieces = 2, // 1 << 1,
	Drag = 4, // 1 << 2,
	All = Board | Pieces | Drag
}

export interface InvalidationStateBaseInternal {
	layers: DirtyLayerMask;
}
export type InvalidationStateBaseSnapshot = ReadonlyDeep<InvalidationStateBaseInternal>;

export interface InvalidationStateBase {
	markLayer(layerMask: DirtyLayerMask, mutationSession: InvalidationMutationSession): boolean;
	getLayers(): DirtyLayerMask;
	clear(mutationSession: InvalidationMutationSession): boolean;
	getSnapshot(): InvalidationStateBaseSnapshot;
}

/**
 * Extension invalidation types
 */
export type InvalidationStateExtensionInternal = InvalidationStateBaseInternal;
export type InvalidationStateExtensionSnapshot = ReadonlyDeep<InvalidationStateExtensionInternal>;
export type InvalidationStateExtension = InvalidationStateBase;

/**
 * Full invalidation subsystem types
 */
export interface InvalidationStateInternal extends InvalidationStateBaseInternal {
	extensions: Record<string, InvalidationStateExtension>;
}

export type InvalidationStateSnapshot = ReadonlyDeep<
	Omit<InvalidationStateInternal, 'extensions'>
> & {
	extensions: Record<string, InvalidationStateExtensionSnapshot>;
};

export interface InvalidationState extends InvalidationStateBase {
	getExtensions(): Readonly<Record<string, InvalidationStateExtension>>;
	getExtension(extensionId: string): InvalidationStateExtension | undefined;
	createExtension(
		extensionId: string,
		mutationSession: InvalidationMutationSession
	): InvalidationStateExtension;
	getSnapshot(): InvalidationStateSnapshot;
}
