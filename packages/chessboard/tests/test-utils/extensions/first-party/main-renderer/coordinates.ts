import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import type { ConfigColorPair } from '../../../../../src/extensions/first-party/main-renderer/types/internal.js';
import type { ExtensionRenderContext } from '../../../../../src/extensions/types/context/render.js';
import { createRenderGeometry } from '../../../../../src/layout/geometry/factory.js';
import { ColorCode } from '../../../../../src/state/board/types/internal.js';
import type { RuntimeStateSnapshot } from '../../../../../src/state/types.js';
import { createSvgElement } from '../../../dom/svg.js';

export interface CoordRenderContextOptions {
	dirtyLayers?: number;
	orientation?: ColorCode;
	sceneSize?: number;
}

/**
 * Builds a minimal ExtensionRenderContext suitable for coordinates renderer tests.
 * Uses real createRenderGeometry for realistic geometry.
 */
export function createCoordRenderContext(
	opts: CoordRenderContextOptions = {}
): ExtensionRenderContext {
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const geometry = createRenderGeometry({ width: size, height: size }, orientation);

	return {
		currentFrame: {
			state: {} as RuntimeStateSnapshot,
			layout: {
				sceneSize: { width: size, height: size },
				orientation,
				geometry,
				layoutEpoch: 1
			}
		},
		invalidation: {
			dirtyLayers: opts.dirtyLayers ?? DirtyLayer.Coordinates
		}
	} as ExtensionRenderContext;
}

/**
 * Creates a ConfigColorPair for coordinates renderer tests with sensible defaults.
 */
export function createCoordConfig(overrides?: Partial<ConfigColorPair>): ConfigColorPair {
	return {
		light: overrides?.light ?? '#eef2f7',
		dark: overrides?.dark ?? '#707a8a'
	};
}

/**
 * Creates an SVG <g> element to serve as the coordinates layer in tests.
 */
export function createCoordinatesLayer(): SVGGElement {
	return createSvgElement('g');
}
