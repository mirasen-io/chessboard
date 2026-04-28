import type { LayoutInternal } from '../../../src/layout/types.js';
import { ColorCode } from '../../../src/state/board/types/internal.js';

export interface LayoutInternalOverrides {
	sceneSize?: LayoutInternal['sceneSize'];
	orientation?: LayoutInternal['orientation'];
	geometry?: LayoutInternal['geometry'];
	layoutEpoch?: number;
}

/**
 * Creates a LayoutInternal with sensible defaults:
 * - sceneSize = null
 * - orientation = ColorCode.White
 * - geometry = null
 * - layoutEpoch = 0
 *
 * Accepts optional overrides. Uses 'in' checks so null overrides are respected.
 */
export function createTestLayoutInternal(overrides?: LayoutInternalOverrides): LayoutInternal {
	const o = overrides ?? {};
	return {
		sceneSize: 'sceneSize' in o ? (o.sceneSize as LayoutInternal['sceneSize']) : null,
		orientation:
			'orientation' in o ? (o.orientation as LayoutInternal['orientation']) : ColorCode.White,
		geometry: 'geometry' in o ? (o.geometry as LayoutInternal['geometry']) : null,
		layoutEpoch: o.layoutEpoch ?? 0
	};
}

/**
 * Creates a mock HTMLElement-like object with clientWidth and clientHeight.
 */
export function createMockContainer(width: number, height: number): HTMLElement {
	return { clientWidth: width, clientHeight: height } as unknown as HTMLElement;
}
