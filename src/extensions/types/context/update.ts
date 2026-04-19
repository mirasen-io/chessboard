import { RuntimeReadonlyMutationSession } from '../../../runtime/mutation/types.js';
import { ExtensionInvalidationState } from '../../invalidation/types.js';
import { RenderFrameSnapshot } from '../basic/render.js';
import {
	isFrameMounted,
	isFrameRenderable,
	UpdateFrameSnapshot,
	UpdateFrameSnapshotMounted,
	UpdateFrameSnapshotUnmounted
} from '../basic/update.js';

export interface ExtensionUpdateContextCommon {
	readonly previousFrame: UpdateFrameSnapshot | null;
	readonly mutation: RuntimeReadonlyMutationSession;
	readonly currentFrame: UpdateFrameSnapshot;
}

export interface ExtensionUpdateContextCommonUnmounted extends ExtensionUpdateContextCommon {
	readonly currentFrame: UpdateFrameSnapshotUnmounted;
}

export interface ExtensionUpdateContextCommonMounted extends ExtensionUpdateContextCommon {
	readonly currentFrame: UpdateFrameSnapshotMounted;
}

export type ExtensionUpdateContextUnmounted = ExtensionUpdateContextCommonUnmounted;

export interface ExtensionUpdateContextMounted extends ExtensionUpdateContextCommonMounted {
	readonly invalidation: ExtensionInvalidationState;
}

export type ExtensionUpdateContext =
	| ExtensionUpdateContextUnmounted
	| ExtensionUpdateContextMounted;

export function isUpdateContextCommonMounted<T extends ExtensionUpdateContextCommon>(
	context: T
): context is T & ExtensionUpdateContextCommonMounted {
	return isFrameMounted(context.currentFrame);
}

export function isUpdateContextMounted<T extends ExtensionUpdateContext>(
	context: T
): context is T & ExtensionUpdateContextMounted {
	return isFrameMounted(context.currentFrame);
}

export function isUpdateContextRenderable<T extends ExtensionUpdateContext>(
	context: T
): context is T & ExtensionUpdateContextMounted & { currentFrame: RenderFrameSnapshot } {
	return isFrameRenderable(context.currentFrame);
}
