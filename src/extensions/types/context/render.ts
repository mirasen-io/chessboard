import { ExtensionReadonlyInvalidationState } from '../../invalidation/types.js';
import { RenderFrameSnapshot } from '../basic/render.js';

export interface ExtensionRenderContext {
	readonly currentFrame: RenderFrameSnapshot;
	readonly invalidation: ExtensionReadonlyInvalidationState;
}
