import { LayoutSnapshot } from '../../../layout/types';
import { RuntimeStateSnapshot } from '../../../state/types';

export interface RenderLayoutSnapshot extends LayoutSnapshot {
	readonly geometry: NonNullable<LayoutSnapshot['geometry']>;
}

export interface RenderFrameSnapshot {
	readonly state: RuntimeStateSnapshot;
	readonly layout: RenderLayoutSnapshot;
}
