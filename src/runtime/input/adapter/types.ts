import { RenderGeometry } from '../../../layout/geometry/types';
import { InteractionController } from '../controller/types';

export interface InputAdapterInitOptions {
	container: HTMLElement;
	getGeometry: () => RenderGeometry | null;
	controller: InteractionController;
}

export interface InputAdapterInternal {
	readonly container: HTMLElement;
	readonly getGeometry: () => RenderGeometry | null;
	readonly controller: InteractionController;
	activePointerId: number | null;
}
export interface InputAdapter {
	destroy(): void;
}
