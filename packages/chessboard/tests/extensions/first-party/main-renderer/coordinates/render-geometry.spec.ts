import { describe, expect, it } from 'vitest';
import { createMainRendererCoordinates } from '../../../../../src/extensions/first-party/main-renderer/coordinates/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import { ColorCode } from '../../../../../src/state/board/types/internal.js';
import {
	queryAllByDataChessboardIdPrefix,
	queryByDataChessboardId
} from '../../../../test-utils/dom/svg.js';
import {
	createCoordConfig,
	createCoordRenderContext,
	createCoordinatesLayer
} from '../../../../test-utils/extensions/first-party/main-renderer/coordinates.js';

/**
 * For a 400×400 scene with white orientation:
 * - squareSize = 50
 * - fontSize = 50 * 0.12 = 6
 * - offset = 3
 *
 * Rank labels are on the left edge (file=0). For white orientation:
 *   visual rank 0 → logical rank 7 → square a8 (sq=56) → rect x=0, y=0
 *   label "8" at x = rect.x + offset = 3, y = rect.y + offset = 3
 *
 * File labels are on the bottom edge (rank=0). For white orientation:
 *   visual file 0 → logical file 0 → square a1 (sq=0) → rect x=0, y=350
 *   label "a" at x = rect.x + rect.width - offset = 47, y = rect.y + rect.height - offset = 397
 */

describe('coordinates renderer – geometry placement (white)', () => {
	const sceneSize = 400;
	const squareSize = sceneSize / 8; // 50
	const offset = 3;

	it('rank label "8" is positioned at top-left corner plus offset', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White,
				sceneSize
			}),
			layer
		);

		const el = queryByDataChessboardId(layer, 'coord-rank-8');
		expect(el).not.toBeNull();
		// square a8 (sq=56): file=0, rank=7 → x=0, y=0 in white orientation
		expect(el!.getAttribute('x')).toBe((0 + offset).toString());
		expect(el!.getAttribute('y')).toBe((0 + offset).toString());
	});

	it('rank label "1" is positioned at bottom-left plus offset', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White,
				sceneSize
			}),
			layer
		);

		const el = queryByDataChessboardId(layer, 'coord-rank-1');
		expect(el).not.toBeNull();
		// square a1 (sq=0): file=0, rank=0 → x=0, y=350 in white orientation
		expect(el!.getAttribute('x')).toBe((0 + offset).toString());
		expect(el!.getAttribute('y')).toBe((7 * squareSize + offset).toString());
	});

	it('file label "a" is positioned at bottom-left square bottom-right corner minus offset', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White,
				sceneSize
			}),
			layer
		);

		const el = queryByDataChessboardId(layer, 'coord-file-a');
		expect(el).not.toBeNull();
		// square a1 (sq=0): rect x=0, y=350, width=50, height=50
		expect(el!.getAttribute('x')).toBe((0 + squareSize - offset).toString());
		expect(el!.getAttribute('y')).toBe((7 * squareSize + squareSize - offset).toString());
	});

	it('file label "h" is positioned at bottom-right square', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White,
				sceneSize
			}),
			layer
		);

		const el = queryByDataChessboardId(layer, 'coord-file-h');
		expect(el).not.toBeNull();
		// square h1 (sq=7): file=7, rank=0 → rect x=350, y=350
		expect(el!.getAttribute('x')).toBe((7 * squareSize + squareSize - offset).toString());
		expect(el!.getAttribute('y')).toBe((7 * squareSize + squareSize - offset).toString());
	});
});

describe('coordinates renderer – font size from geometry', () => {
	it('font-size attribute equals squareSize * 0.12 for a 400px scene', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();
		const sceneSize = 400;
		const expectedFontSize = (sceneSize / 8) * 0.12;

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				sceneSize
			}),
			layer
		);

		const el = queryAllByDataChessboardIdPrefix(layer, 'coord-rank-')[0];
		expect(el).not.toBeUndefined();
		expect(el.getAttribute('font-size')).toBe(expectedFontSize.toString());
	});

	it('font-size scales with different scene sizes', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();
		const sceneSize = 800;
		const expectedFontSize = (sceneSize / 8) * 0.12;

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				sceneSize
			}),
			layer
		);

		const el = queryAllByDataChessboardIdPrefix(layer, 'coord-file-')[0];
		expect(el).not.toBeUndefined();
		expect(el.getAttribute('font-size')).toBe(expectedFontSize.toString());
	});
});

describe('coordinates renderer – renders into provided layer', () => {
	it('all labels are direct children of the passed SVG layer element', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates }), layer);

		expect(layer.children.length).toBe(16);
		for (const child of Array.from(layer.children)) {
			expect(child.parentElement).toBe(layer);
			expect(child.tagName).toBe('text');
		}
	});
});
