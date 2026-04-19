import { SceneRenderGeometry } from '../../../layout/geometry/types.js';
import { InteractionController } from '../controller/types.js';

export interface InputAdapterInitOptions {
	container: HTMLElement;
	getRenderGeometry: () => SceneRenderGeometry | null;
	controller: InteractionController;
}

export interface InputAdapterInternal {
	readonly container: HTMLElement;
	readonly getRenderGeometry: () => SceneRenderGeometry | null;
	readonly controller: InteractionController;
	activePointerId: number | null;
}
export interface InputAdapter {
	subscribeEvent<K extends keyof HTMLElementEventMap>(type: K): void;
	unsubscribeEvent<K extends keyof HTMLElementEventMap>(type: K): void;
	destroy(): void;
}

export const NEED_EVENT_TYPES: Set<string> = new Set([
	'pointerdown',
	'pointermove',
	'pointerup',
	'pointercancel'
]);
