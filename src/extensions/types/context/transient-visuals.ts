import { ReadonlyDeep } from 'type-fest';
import { RenderFrameSnapshot } from '../basic/render.js';
import { TransientInput } from '../basic/transient-visuals.js';

export interface ExtensionRenderTransientVisualsContext {
	readonly currentFrame: RenderFrameSnapshot;
	readonly transientInput: ReadonlyDeep<TransientInput>;
}
