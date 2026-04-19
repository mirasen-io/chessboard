import { LayoutSnapshot } from '../../../layout/types.js';
import { RuntimeStateSnapshot } from '../../../state/types.js';
import { RenderFrameSnapshot } from './render.js';

export interface UpdateFrameSnapshotUnmounted {
	readonly isMounted: false;
	readonly state: RuntimeStateSnapshot;
}

export interface UpdateFrameSnapshotMounted {
	readonly isMounted: true;
	readonly state: RuntimeStateSnapshot;
	readonly layout: LayoutSnapshot;
}

export type UpdateFrameSnapshot = UpdateFrameSnapshotUnmounted | UpdateFrameSnapshotMounted;

export function isFrameMounted<T extends UpdateFrameSnapshot>(
	frame: T
): frame is T & UpdateFrameSnapshotMounted {
	return frame.isMounted;
}

export function isFrameRenderable<T extends UpdateFrameSnapshot>(
	frame: T
): frame is T & RenderFrameSnapshot {
	return frame.isMounted && frame.layout.geometry !== null;
}

export function assertFrameRenderable<T extends UpdateFrameSnapshot>(
	frame: T
): asserts frame is T & RenderFrameSnapshot {
	if (!isFrameRenderable(frame)) {
		throw new Error('Frame is not renderable. It must be mounted and have valid geometry.');
	}
}
