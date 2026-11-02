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
 * Color logic:
 * - labelColorForSquare uses isLightSquare(sq):
 *   - if square is light → color = coordColors.dark
 *   - if square is dark  → color = coordColors.light
 *
 * isLightSquare: (file + rank) & 1 === 1
 *
 * For white orientation, rank labels use file=0:
 *   - rank "8" → sq = squareOf(0, 7) = 56 → file=0, rank=7 → (0+7)&1=1 → light → fill=dark
 *   - rank "7" → sq = squareOf(0, 6) = 48 → file=0, rank=6 → (0+6)&1=0 → dark → fill=light
 *
 * For white orientation, file labels use rank=0 (logically):
 *   - file "a" → sq = squareOf(0, 0) = 0 → file=0, rank=0 → (0+0)&1=0 → dark → fill=light
 *   - file "b" → sq = squareOf(1, 0) = 1 → file=1, rank=0 → (1+0)&1=1 → light → fill=dark
 */

describe('coordinates renderer – label fill colors', () => {
	const coordColors = { light: '#eef2f7', dark: '#707a8a' };

	it('rank label on a light square uses coordColors.dark as fill', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig(coordColors));
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		// rank "8" → sq(0,7) → light square → fill = dark color
		const el = queryByDataChessboardId(layer, 'coord-rank-8');
		expect(el).not.toBeNull();
		expect(el!.getAttribute('fill')).toBe(coordColors.dark);
	});

	it('rank label on a dark square uses coordColors.light as fill', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig(coordColors));
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		// rank "7" → sq(0,6) → dark square → fill = light color
		const el = queryByDataChessboardId(layer, 'coord-rank-7');
		expect(el).not.toBeNull();
		expect(el!.getAttribute('fill')).toBe(coordColors.light);
	});

	it('file label on a dark square uses coordColors.light as fill', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig(coordColors));
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		// file "a" → sq(0,0) → dark square → fill = light color
		const el = queryByDataChessboardId(layer, 'coord-file-a');
		expect(el).not.toBeNull();
		expect(el!.getAttribute('fill')).toBe(coordColors.light);
	});

	it('file label on a light square uses coordColors.dark as fill', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig(coordColors));
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		// file "b" → sq(1,0) → light square → fill = dark color
		const el = queryByDataChessboardId(layer, 'coord-file-b');
		expect(el).not.toBeNull();
		expect(el!.getAttribute('fill')).toBe(coordColors.dark);
	});

	it('uses custom colors passed via config', () => {
		const custom = { light: '#ff0000', dark: '#00ff00' };
		const coords = createMainRendererCoordinates(() => createCoordConfig(custom));
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		// rank "8" on light square → fill = custom.dark
		const el = queryByDataChessboardId(layer, 'coord-rank-8');
		expect(el!.getAttribute('fill')).toBe(custom.dark);
	});
});

describe('coordinates renderer – file label mobile-safe styles', () => {
	it('file labels have pointer-events: none', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates }), layer);

		for (const el of queryAllByDataChessboardIdPrefix(layer, 'coord-file-')) {
			expect((el as SVGElement).style.getPropertyValue('pointer-events')).toBe('none');
		}
	});

	it('file labels have user-select: none', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates }), layer);

		for (const el of queryAllByDataChessboardIdPrefix(layer, 'coord-file-')) {
			expect((el as SVGElement).style.getPropertyValue('user-select')).toBe('none');
		}
	});

	it('file labels have -webkit-user-select: none', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates }), layer);

		for (const el of queryAllByDataChessboardIdPrefix(layer, 'coord-file-')) {
			expect((el as SVGElement).style.getPropertyValue('-webkit-user-select')).toBe('none');
		}
	});
});

describe('coordinates renderer – rank labels do NOT have mobile-safe styles', () => {
	it('rank labels do not have pointer-events style set', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates }), layer);

		for (const el of queryAllByDataChessboardIdPrefix(layer, 'coord-rank-')) {
			const value = (el as SVGElement).style.getPropertyValue('pointer-events');
			expect(value).toBe('');
		}
	});

	it('rank labels do not have user-select style set', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates }), layer);

		for (const el of queryAllByDataChessboardIdPrefix(layer, 'coord-rank-')) {
			const value = (el as SVGElement).style.getPropertyValue('user-select');
			expect(value).toBe('');
		}
	});
});
