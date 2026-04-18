import { ReadonlyDeep } from 'type-fest';
import { RenderFrameSnapshot } from '../basic/render';
import { TransientInput } from '../basic/transient-visuals';

export interface ExtensionRenderTransientVisualsContext {
	readonly currentFrame: RenderFrameSnapshot;
	readonly transientInput: ReadonlyDeep<TransientInput>;
}
