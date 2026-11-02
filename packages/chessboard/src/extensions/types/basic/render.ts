import { LayoutSnapshot } from '../../../layout/types.js';
import { RuntimeStateSnapshot } from '../../../state/types.js';

export interface RenderLayoutSnapshot extends LayoutSnapshot {
	readonly geometry: NonNullable<LayoutSnapshot['geometry']>;
}

export interface RenderFrameSnapshot {
	readonly state: RuntimeStateSnapshot;
	readonly layout: RenderLayoutSnapshot;
}
