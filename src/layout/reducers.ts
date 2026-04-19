import { createRenderGeometry } from './geometry/factory.js';
import { sceneSizesEqual } from './geometry/helpers.js';
import { isSceneSizeValid, measureSceneSize } from './helpers.js';
import { LayoutInternal, LayoutRefreshOptions } from './types.js';

export function layoutRefreshGeometry(
	state: LayoutInternal,
	options: LayoutRefreshOptions
): boolean {
	const orientation = options.orientation ?? state.orientation;

	if (orientation === null) {
		// At this point we should decide if the geometry is invalid or we throw because we expect that the first pass must deliver the orientation?
		// For now we throw
		throw new Error(
			'Orientation is expected to be provided on the first pass of layout.refreshGeometry'
		);
	}

	let sceneSize = options.container ? measureSceneSize(options.container) : state.sceneSize;

	if (sceneSize !== null && !isSceneSizeValid(sceneSize)) sceneSize = null;

	const changed = !sceneSizesEqual(sceneSize, state.sceneSize) || orientation !== state.orientation;
	if (!changed) {
		return false; // no-op, no relevant changes
	}

	// Update the state
	state.sceneSize = sceneSize;
	state.orientation = orientation;
	if (sceneSize === null || orientation === null) {
		// General invalid-geometry rule. Orientation is currently guarded above,
		// but this branch stays explicit in case null orientation is allowed later.
		state.geometry = null;
	} else {
		state.geometry = createRenderGeometry(sceneSize, orientation);
	}
	state.layoutEpoch++;
	return true;
}
