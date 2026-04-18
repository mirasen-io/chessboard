import { ExtensionReadonlyInvalidationState } from '../../invalidation/types';
import { RenderFrameSnapshot } from '../basic/render';

export interface ExtensionRenderContext {
	readonly currentFrame: RenderFrameSnapshot;
	readonly invalidation: ExtensionReadonlyInvalidationState;
}
