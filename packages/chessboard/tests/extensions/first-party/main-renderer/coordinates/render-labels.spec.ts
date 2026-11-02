import { describe, expect, it } from 'vitest';
import { createMainRendererCoordinates } from '../../../../../src/extensions/first-party/main-renderer/coordinates/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import { ColorCode } from '../../../../../src/state/board/types/internal.js';
import { queryAllByDataChessboardIdPrefix } from '../../../../test-utils/dom/svg.js';
import {
	createCoordConfig,
	createCoordRenderContext,
	createCoordinatesLayer
} from '../../../../test-utils/extensions/first-party/main-renderer/coordinates.js';

function getRankLabels(layer: SVGGElement): { id: string; text: string }[] {
	return queryAllByDataChessboardIdPrefix(layer, 'coord-rank-').map((el) => ({
		id: el.getAttribute('data-chessboard-id') ?? '',
		text: el.textContent ?? ''
	}));
}

function getFileLabels(layer: SVGGElement): { id: string; text: string }[] {
	return queryAllByDataChessboardIdPrefix(layer, 'coord-file-').map((el) => ({
		id: el.getAttribute('data-chessboard-id') ?? '',
		text: el.textContent ?? ''
	}));
}

describe('coordinates renderer – label count', () => {
	it('renders exactly 8 rank labels and 8 file labels', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(createCoordRenderContext({ dirtyLayers: DirtyLayer.Coordinates }), layer);

		expect(getRankLabels(layer)).toHaveLength(8);
		expect(getFileLabels(layer)).toHaveLength(8);
	});
});

describe('coordinates renderer – white orientation labels', () => {
	it('rank labels are 8,7,6,5,4,3,2,1 from first to last rendered', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		const ranks = getRankLabels(layer).map((r) => r.text);
		expect(ranks).toEqual(['8', '7', '6', '5', '4', '3', '2', '1']);
	});

	it('file labels are a,b,c,d,e,f,g,h from first to last rendered', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		const files = getFileLabels(layer).map((f) => f.text);
		expect(files).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
	});

	it('rank label data-chessboard-id includes the label value', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		const ranks = getRankLabels(layer);
		expect(ranks[0].id).toBe('coord-rank-8');
		expect(ranks[7].id).toBe('coord-rank-1');
	});

	it('file label data-chessboard-id includes the label value', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.White
			}),
			layer
		);

		const files = getFileLabels(layer);
		expect(files[0].id).toBe('coord-file-a');
		expect(files[7].id).toBe('coord-file-h');
	});
});

describe('coordinates renderer – black orientation labels', () => {
	it('rank labels are 1,2,3,4,5,6,7,8 from first to last rendered', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.Black
			}),
			layer
		);

		const ranks = getRankLabels(layer).map((r) => r.text);
		expect(ranks).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
	});

	it('file labels are h,g,f,e,d,c,b,a from first to last rendered', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.Black
			}),
			layer
		);

		const files = getFileLabels(layer).map((f) => f.text);
		expect(files).toEqual(['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']);
	});

	it('rank label data-chessboard-id matches reversed labels', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.Black
			}),
			layer
		);

		const ranks = getRankLabels(layer);
		expect(ranks[0].id).toBe('coord-rank-1');
		expect(ranks[7].id).toBe('coord-rank-8');
	});

	it('file label data-chessboard-id matches reversed labels', () => {
		const coords = createMainRendererCoordinates(() => createCoordConfig());
		const layer = createCoordinatesLayer();

		coords.render(
			createCoordRenderContext({
				dirtyLayers: DirtyLayer.Coordinates,
				orientation: ColorCode.Black
			}),
			layer
		);

		const files = getFileLabels(layer);
		expect(files[0].id).toBe('coord-file-h');
		expect(files[7].id).toBe('coord-file-a');
	});
});
